import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL debe estar configurada. ¿Olvidaste crear la base de datos?",
  );
}

// Detectar si estamos en producción (Hostinger) o desarrollo (Replit/Neon)
const isProduction = !process.env.REPL_ID && process.env.NODE_ENV === 'production';

let pool: any;
let db: any;

if (isProduction) {
  // Producción: PostgreSQL local sin SSL
  pool = new PgPool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  db = drizzlePg(pool, { schema });
  console.log('🗄️ Usando PostgreSQL local (producción)');
} else {
  // Desarrollo: Neon con WebSocket
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
  console.log('🗄️ Usando Neon PostgreSQL (desarrollo)');
}

export { pool, db };
