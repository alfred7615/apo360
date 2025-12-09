/**
 * Configuración de base de datos para APO-360
 * Maneja conexiones separadas para desarrollo y producción
 */

import { getAppEnvironment } from './environment';

export interface DatabaseConfig {
  connectionString: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

function getDevelopmentConfig(): DatabaseConfig {
  return {
    connectionString: process.env.DATABASE_URL_DEV || process.env.DATABASE_URL || '',
    host: process.env.PGHOST_DEV || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT_DEV || process.env.PGPORT || '5432'),
    user: process.env.PGUSER_DEV || process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD_DEV || process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE_DEV || process.env.PGDATABASE || 'apo360_dev',
    ssl: true,
  };
}

function getProductionConfig(): DatabaseConfig {
  return {
    connectionString: process.env.DATABASE_URL || '',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'apo360_admin',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'apo360_prod',
    ssl: false, // Conexión local en VPS, no requiere SSL
  };
}

export function getDatabaseConfig(): DatabaseConfig {
  const env = getAppEnvironment();
  
  if (env === 'production') {
    return getProductionConfig();
  }
  
  return getDevelopmentConfig();
}

export const dbConfig = getDatabaseConfig();
