import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  // Backfill automático de miembros_grupo (migración one-time)
  try {
    const { storage } = await import('./storage');
    log('🔄 Verificando migración de miembros_grupo...');
    
    const grupos = await storage.getAllGruposConMiembrosLegacy();
    let migrados = 0;
    
    for (const grupo of grupos) {
      if (grupo.miembros && Array.isArray(grupo.miembros) && grupo.miembros.length > 0) {
        for (const usuarioId of grupo.miembros) {
          try {
            await storage.agregarMiembroGrupo({
              grupoId: grupo.id,
              usuarioId: usuarioId as string,
              rol: usuarioId === grupo.creadorId ? 'admin' : 'miembro',
            });
            migrados++;
          } catch (error) {
            // onConflictDoNothing ya maneja duplicados silenciosamente
          }
        }
      }
    }
    
    if (migrados > 0) {
      log(`✅ Migración completada: ${migrados} miembros migrados a tabla normalizada`);
    } else {
      log('✅ Tabla miembros_grupo ya está sincronizada');
    }
  } catch (error) {
    log(`⚠️ Error en migración automática (se ignorará): ${error}`);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}
