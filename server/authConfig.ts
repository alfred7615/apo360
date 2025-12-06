import * as client from "openid-client";
import { Strategy as ReplitStrategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback } from "passport-google-oauth20";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const AUTH_MODE = process.env.AUTH_MODE || (process.env.REPL_ID ? "replit" : "google");
let activeAuthMode = AUTH_MODE;

const getOidcConfig = memoize(
  async () => {
    if (!process.env.REPL_ID) return null;
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
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

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
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
  if (!process.env.REPL_ID) {
    throw new Error("Replit Auth requires REPL_ID environment variable");
  }
  
  const config = await getOidcConfig();
  if (!config) {
    throw new Error("Failed to get Replit OIDC configuration");
  }
  
  activeAuthMode = "replit";

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
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
      scope: ["profile", "email"],
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
    scope: ["profile", "email"],
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
      console.log("⚠️ Fallback: Configurando Replit Auth en lugar de Google OAuth");
      if (process.env.REPL_ID) {
        await setupReplitAuth(app);
        console.log("✅ Replit Auth configurado (fallback)");
      } else {
        console.error("❌ ERROR: No hay proveedor de autenticación disponible.");
        console.error("   Configure GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET para Google OAuth");
        console.error("   O ejecute en un entorno Replit para usar Replit Auth");
        throw new Error("No authentication provider configured");
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
