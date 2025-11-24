import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export async function requireSuperAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user || !req.user.claims?.sub) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    if (user.rol !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Acceso denegado. Se requiere rol de super administrador' 
      });
    }

    next();
  } catch (error) {
    console.error('Error al verificar rol de super admin:', error);
    return res.status(500).json({ message: 'Error al verificar permisos' });
  }
}
