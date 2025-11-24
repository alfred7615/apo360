export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  rolesSuperAdmin?: boolean;
  telefono?: string;
  ubicacionLatitud?: number;
  ubicacionLongitud?: number;
  modoTaxi: boolean;
  activo: boolean;
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
