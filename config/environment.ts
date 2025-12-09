/**
 * Configuración de entorno para APO-360
 * Detecta automáticamente el entorno (desarrollo/producción) y carga las configuraciones apropiadas
 */

export type AppEnvironment = 'development' | 'production';

export function getAppEnvironment(): AppEnvironment {
  // Prioridad: APP_ENV > NODE_ENV > detección automática
  const appEnv = process.env.APP_ENV;
  if (appEnv === 'production' || appEnv === 'development') {
    return appEnv;
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    return 'production';
  }

  // Si estamos en Replit, es desarrollo
  if (process.env.REPL_ID) {
    return 'development';
  }

  return 'development';
}

export function isDevelopment(): boolean {
  return getAppEnvironment() === 'development';
}

export function isProduction(): boolean {
  return getAppEnvironment() === 'production';
}

export const appEnv = getAppEnvironment();

console.log(`🌍 Entorno detectado: ${appEnv}`);
