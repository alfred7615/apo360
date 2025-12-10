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
  const { Pool } = require('pg');
  const { drizzle } = require('drizzle-orm/node-postgres');
  
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  db = drizzle(pool, { schema });
  console.log('🗄️ Usando PostgreSQL local (producción)');
} else {
  // Desarrollo: Neon con WebSocket
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-serverless');
  const ws = require('ws');
  
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log('🗄️ Usando Neon PostgreSQL (desarrollo)');
}

export { pool, db };
