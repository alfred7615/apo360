import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback } from "passport-google-oauth20";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { Pool as PgPool } from "pg";
import { storage } from "./storage";

function isValidString(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

const hasReplitEnv = isValidString(process.env.REPL_ID);
const hasGoogleEnv = isValidString(process.env.GOOGLE_CLIENT_ID) && isValidString(process.env.GOOGLE_CLIENT_SECRET);

function determineAuthMode(): "replit" | "google" {
  const explicitMode = process.env.AUTH_MODE?.trim().toLowerCase();
  
  if (explicitMode === "replit") {
    if (!hasReplitEnv) {
      console.warn("⚠️ AUTH_MODE=replit pero REPL_ID no está disponible");
    }
    return "replit";
  }
  
  if (explicitMode === "google") {
    return "google";
  }
  
  return hasReplitEnv ? "replit" : "google";
}

const AUTH_MODE = determineAuthMode();
let activeAuthMode = AUTH_MODE;

let oidcClientModule: typeof import("openid-client") | null = null;
let oidcPassportModule: typeof import("openid-client/passport") | null = null;

async function loadOidcModules() {
  if (!hasReplitEnv) {
    throw new Error("Cannot load OIDC modules: REPL_ID is not available");
  }
  
  if (!oidcClientModule) {
    oidcClientModule = await import("openid-client");
  }
  if (!oidcPassportModule) {
    oidcPassportModule = await import("openid-client/passport");
  }
  return { client: oidcClientModule, passport: oidcPassportModule };
}

const getOidcConfig = memoize(
  async () => {
    if (!hasReplitEnv) return null;
    
    const { client } = await loadOidcModules();
    const replId = process.env.REPL_ID!.trim();
    
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      replId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  
  // Detectar si estamos en producción (Hostinger) o desarrollo (Replit/Neon)
  const isProduction = !process.env.REPL_ID && process.env.NODE_ENV === 'production';
  
  // Configuración del pool para connect-pg-simple
  const poolConfig: any = {
    connectionString: process.env.DATABASE_URL,
  };
  
  // En producción local, desactivar SSL
  if (isProduction) {
    poolConfig.ssl = false;
  }
  
  // Usar pg Pool importado al inicio del archivo
  const pool = new PgPool(poolConfig);
  
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokens: any) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

function updateGoogleUserSession(user: any, profile: GoogleProfile, accessToken: string, refreshToken?: string) {
  user.claims = {
    sub: profile.id,
    email: profile.emails?.[0]?.value,
    first_name: profile.name?.givenName,
    last_name: profile.name?.familyName,
    profile_image_url: profile.photos?.[0]?.value,
  };
  user.access_token = accessToken;
  user.refresh_token = refreshToken;
  user.expires_at = Math.floor(Date.now() / 1000) + 3600;
}

async function upsertUser(claims: any) {
  const email = claims["email"];
  const isSuperAdmin = email === "aapomayta15@gmail.com";
  
  let rol: string | undefined = undefined;
  if (claims["roles"] && Array.isArray(claims["roles"])) {
    if (claims["roles"].includes("super_admin")) {
      rol = "super_admin";
    } else if (claims["roles"].includes("admin")) {
      rol = "admin";
    }
  } else if (isSuperAdmin) {
    rol = "super_admin";
  }
  
  await storage.upsertUsuario({
    id: claims["sub"],
    email: email,
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    rol: rol,
    telefono: isSuperAdmin ? "916202070" : undefined,
  });
  
  if (isSuperAdmin) {
    const usuarioId = claims["sub"];
    
    try {
      await storage.createRegistroBasico({
        usuarioId,
        alias: "alfred76",
      });
    } catch (error) {
      console.log("Registro básico ya existe para super admin");
    }
    
    try {
      await storage.createRegistroChat({
        usuarioId,
        nombres: "Alfredo",
        apellidos: "Apomayta",
        dniNumero: "10329053",
        dniFrenteUrl: "https://placeholder.com/dni-frente",
        dniPosteriorUrl: "https://placeholder.com/dni-posterior",
        dniFechaCaducidad: "2030-12-31",
        numeroCelular: "916202070",
      });
    } catch (error) {
      console.log("Registro chat ya existe para super admin");
    }
  }
}

async function setupReplitAuth(app: Express) {
  if (!hasReplitEnv) {
    throw new Error("Replit Auth requires valid REPL_ID environment variable (non-empty string)");
  }
  
  const config = await getOidcConfig();
  if (!config) {
    throw new Error("Failed to get Replit OIDC configuration");
  }
  
  const { client, passport: oidcPassport } = await loadOidcModules();
  const ReplitStrategy = oidcPassport.Strategy;
  
  activeAuthMode = "replit";

  const verify = async (tokens: any, verified: passport.AuthenticateCallback) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new ReplitStrategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

async function setupGoogleAuth(app: Express): Promise<boolean> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "https://apo360.net/api/callback";

  if (!clientId || !clientSecret) {
    console.warn("⚠️ Google OAuth no configurado. Intentando fallback a Replit Auth...");
    return false;
  }

  passport.use(new GoogleStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackUrl,
      scope: ["profile", "email", "https://www.googleapis.com/auth/contacts.readonly"],
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
      try {
        const user: any = {};
        updateGoogleUserSession(user, profile, accessToken, refreshToken);
        await upsertUser(user.claims);
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }
  ));

  app.get("/api/login", passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/contacts.readonly"],
    accessType: "offline",
    prompt: "consent",
  }));

  app.get("/api/callback", passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/api/login",
  }));

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  console.log("✅ Google OAuth configurado correctamente");
  activeAuthMode = "google";
  return true;
}

export async function setupAuth(app: Express) {
  console.log(`🔐 Modo de autenticación solicitado: ${AUTH_MODE}`);
  
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (AUTH_MODE === "replit") {
    await setupReplitAuth(app);
    console.log("✅ Replit Auth configurado");
  } else {
    const googleConfigured = await setupGoogleAuth(app);
    if (!googleConfigured) {
      if (hasReplitEnv) {
        console.log("⚠️ Fallback: Configurando Replit Auth en lugar de Google OAuth");
        await setupReplitAuth(app);
        console.log("✅ Replit Auth configurado (fallback)");
      } else {
        console.error("❌ ERROR: No hay proveedor de autenticación disponible.");
        console.error("   Configure GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET para Google OAuth");
        console.error("   O ejecute en un entorno Replit para usar Replit Auth (requiere REPL_ID válido)");
        throw new Error("No authentication provider configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for production, or run in Replit environment for development.");
      }
    }
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  if (session?.user?.claims?.sub) {
    (req as any).user = session.user;
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  if (activeAuthMode === "replit") {
    try {
      const config = await getOidcConfig();
      if (config) {
        const { client } = await loadOidcModules();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        return next();
      }
    } catch (error) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }
  }

  res.status(401).json({ message: "No autorizado" });
};

export { AUTH_MODE, activeAuthMode };
