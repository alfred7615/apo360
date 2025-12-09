/**
 * Configuración de autenticación para APO-360
 * Maneja Replit Auth (desarrollo) y Google OAuth (producción)
 */

import { getAppEnvironment } from './environment';

export type AuthMode = 'replit' | 'google';

export interface AuthConfig {
  mode: AuthMode;
  google?: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    scopes: string[];
  };
  replit?: {
    issuerUrl: string;
  };
  sessionSecret: string;
}

function getDevelopmentAuthConfig(): AuthConfig {
  return {
    mode: 'replit',
    replit: {
      issuerUrl: process.env.ISSUER_URL || 'https://replit.com/oidc',
    },
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
  };
}

function getProductionAuthConfig(): AuthConfig {
  return {
    mode: 'google',
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'https://apo360.net/api/callback',
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/contacts.readonly',
      ],
    },
    sessionSecret: process.env.SESSION_SECRET || '',
  };
}

export function getAuthConfig(): AuthConfig {
  // Permitir override manual
  const authModeOverride = process.env.AUTH_MODE;
  if (authModeOverride === 'google') {
    return getProductionAuthConfig();
  }
  if (authModeOverride === 'replit') {
    return getDevelopmentAuthConfig();
  }

  const env = getAppEnvironment();
  
  if (env === 'production') {
    return getProductionAuthConfig();
  }
  
  return getDevelopmentAuthConfig();
}

export const authConfig = getAuthConfig();
