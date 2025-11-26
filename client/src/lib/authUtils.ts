export interface AuthUser {
  id: string;
  nombre: string;
  alias?: string;
  email: string;
  rol: string;
  rolesSuperAdmin?: boolean;
  telefono?: string;
  ubicacionLatitud?: number;
  ubicacionLongitud?: number;
  modoTaxi: boolean;
  activo: boolean;
  imagenPerfil?: string;
  primerNombre?: string;
  apellido?: string;
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
