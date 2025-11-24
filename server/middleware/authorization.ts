import { Request, Response, NextFunction, RequestHandler } from 'express';
import { storage } from '../storage';

// Extender el tipo Request para incluir usuario
export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      [key: string]: any;
    };
  };
}

// Tipos de roles del sistema (DEBE coincidir con rolesEnum en schema.ts)
export type UserRole = 
  | 'super_admin'        // Super administrador con todos los permisos
  | 'admin_publicidad'   // Administrador de publicidad
  | 'admin_radio'        // Administrador de radio/MP3
  | 'admin_cartera'      // Administrador de cartera/saldos
  | 'admin_operaciones'  // Administrador de operaciones
  | 'supervisor'         // Supervisor
  | 'conductor'          // Conductor de taxi/delivery
  | 'local'              // Local/comercio
  | 'serenazgo'          // Serenazgo
  | 'policia'            // Policía
  | 'samu'               // SAMU (emergencias médicas)
  | 'bombero'            // Bomberos
  | 'usuario';           // Usuario regular

/**
 * Middleware que verifica si el usuario tiene al menos uno de los roles requeridos
 */
export function requireRoles(...rolesPermitidos: UserRole[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      // Verificar que el usuario esté autenticado
      if (!authenticatedReq.user?.claims?.sub) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      const usuarioId = authenticatedReq.user.claims.sub;
      
      // Obtener el usuario de la base de datos
      const usuario = await storage.getUser(usuarioId);
      if (!usuario) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      // Obtener roles del usuario
      const rolesUsuario = await storage.getUserRoles(usuarioId);
      
      // Verificar si el usuario tiene al menos uno de los roles permitidos
      const tienePermiso = rolesUsuario.some(rol => 
        rolesPermitidos.includes(rol as UserRole)
      );

      if (!tienePermiso) {
        return res.status(403).json({ 
          message: 'No tienes permisos para realizar esta acción',
          rolesRequeridos: rolesPermitidos,
          tuRol: rolesUsuario
        });
      }

      next();
    } catch (error) {
      console.error('Error al verificar roles:', error);
      res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
}

/**
 * Middleware específico para super administradores
 */
export const requireSuperAdmin = requireRoles('super_admin');

/**
 * Middleware para administradores (super_admin o cualquier admin_*)
 */
export const requireAdmin = requireRoles(
  'super_admin', 
  'admin_publicidad',
  'admin_radio',
  'admin_cartera',
  'admin_operaciones',
  'supervisor'
);

/**
 * Middleware para conductores (taxi y delivery usan el mismo rol 'conductor')
 */
export const requireConductor = requireRoles('super_admin', 'conductor');

/**
 * Middleware para servicios de emergencia
 */
export const requireEmergencyService = requireRoles(
  'super_admin', 
  'policia', 
  'serenazgo', 
  'samu', 
  'bombero'
);
