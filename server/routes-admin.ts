// Rutas admin para SEG-APO - Para agregar a server/routes.ts
// Todas las rutas con validación Zod y autorización por roles

import { Express } from 'express';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';
import { requireSuperAdmin, requireAdmin } from './middleware/authorization';
import { 
  insertServicioSchema, 
  insertRadioOnlineSchema, 
  insertArchivoMp3Schema,
  insertUsuarioRolSchema,
  insertAdministradorSchema,
  insertConfiguracionSaldoSchema,
  insertEncuestaSchema,
  insertPopupPublicitarioSchema,
} from '@shared/schema';

export function registerAdminRoutes(app: Express) {
  // ============================================================
  // SERVICIOS - Rutas adicionales (PUT/DELETE)
  // ============================================================

  app.put('/api/servicios/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertServicioSchema.partial().parse(req.body);
      const servicio = await storage.updateServicio(id, data);
      if (!servicio) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }
      res.json(servicio);
    } catch (error: any) {
      console.error('Error al actualizar servicio:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar servicio' });
    }
  });

  app.delete('/api/servicios/:id', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteServicio(id);
      res.json({ message: 'Servicio eliminado' });
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      res.status(500).json({ message: 'Error al eliminar servicio' });
    }
  });

  // ============================================================
  // RADIOS ONLINE - Rutas adicionales (PUT/DELETE)
  // ============================================================

  app.put('/api/radios-online/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertRadioOnlineSchema.partial().parse(req.body);
      const radio = await storage.updateRadioOnline(id, data);
      if (!radio) {
        return res.status(404).json({ message: 'Radio no encontrada' });
      }
      res.json(radio);
    } catch (error: any) {
      console.error('Error al actualizar radio:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar radio' });
    }
  });

  app.delete('/api/radios-online/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRadioOnline(id);
      res.json({ message: 'Radio eliminada' });
    } catch (error) {
      console.error('Error al eliminar radio:', error);
      res.status(500).json({ message: 'Error al eliminar radio' });
    }
  });

  // ============================================================
  // ARCHIVOS MP3 - Rutas adicionales (PUT/DELETE)
  // ============================================================

  app.put('/api/archivos-mp3/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertArchivoMp3Schema.partial().parse(req.body);
      const archivo = await storage.updateArchivoMp3(id, data);
      if (!archivo) {
        return res.status(404).json({ message: 'Archivo MP3 no encontrado' });
      }
      res.json(archivo);
    } catch (error: any) {
      console.error('Error al actualizar archivo MP3:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar archivo MP3' });
    }
  });

  app.delete('/api/archivos-mp3/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteArchivoMp3(id);
      res.json({ message: 'Archivo MP3 eliminado' });
    } catch (error) {
      console.error('Error al eliminar archivo MP3:', error);
      res.status(500).json({ message: 'Error al eliminar archivo MP3' });
    }
  });

  // ============================================================
  // ROLES DE USUARIO
  // ============================================================

  app.get('/api/usuarios/:usuarioId/roles', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { usuarioId } = req.params;
      const roles = await storage.getUserRoles(usuarioId);
      res.json(roles);
    } catch (error) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({ message: 'Error al obtener roles' });
    }
  });

  app.post('/api/usuarios/:usuarioId/roles', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { usuarioId } = req.params;
      const data = insertUsuarioRolSchema.parse({ ...req.body, usuarioId });
      const rol = await storage.addUserRole(data);
      res.json(rol);
    } catch (error: any) {
      console.error('Error al agregar rol:', error);
      res.status(400).json({ message: error.message || 'Error al agregar rol' });
    }
  });

  app.delete('/api/usuario-roles/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeUserRole(id);
      res.json({ message: 'Rol eliminado' });
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      res.status(500).json({ message: 'Error al eliminar rol' });
    }
  });

  // ============================================================
  // ADMINISTRADORES DE SEGUNDO NIVEL
  // ============================================================

  app.get('/api/administradores', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const admins = await storage.getAdministradores();
      res.json(admins);
    } catch (error) {
      console.error('Error al obtener administradores:', error);
      res.status(500).json({ message: 'Error al obtener administradores' });
    }
  });

  app.post('/api/administradores', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = insertAdministradorSchema.parse(req.body);
      const admin = await storage.createAdministrador(data);
      res.json(admin);
    } catch (error: any) {
      console.error('Error al crear administrador:', error);
      res.status(400).json({ message: error.message || 'Error al crear administrador' });
    }
  });

  app.put('/api/administradores/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAdministradorSchema.partial().parse(req.body);
      const admin = await storage.updateAdministrador(id, data);
      if (!admin) {
        return res.status(404).json({ message: 'Administrador no encontrado' });
      }
      res.json(admin);
    } catch (error: any) {
      console.error('Error al actualizar administrador:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar administrador' });
    }
  });

  app.delete('/api/administradores/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdministrador(id);
      res.json({ message: 'Administrador eliminado' });
    } catch (error) {
      console.error('Error al eliminar administrador:', error);
      res.status(500).json({ message: 'Error al eliminar administrador' });
    }
  });

  // ============================================================
  // CONFIGURACIÓN DE SALDOS
  // ============================================================

  app.get('/api/configuracion-saldos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const configs = await storage.getConfiguracionesSaldos();
      res.json(configs);
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      res.status(500).json({ message: 'Error al obtener configuraciones' });
    }
  });

  app.get('/api/configuracion-saldos/:tipoOperacion', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { tipoOperacion } = req.params;
      const config = await storage.getConfiguracionSaldo(tipoOperacion);
      res.json(config || null);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ message: 'Error al obtener configuración' });
    }
  });

  app.post('/api/configuracion-saldos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = insertConfiguracionSaldoSchema.parse(req.body);
      const config = await storage.upsertConfiguracionSaldo(data);
      res.json(config);
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      res.status(400).json({ message: error.message || 'Error al guardar configuración' });
    }
  });

  // ============================================================
  // ENCUESTAS
  // ============================================================

  app.get('/api/encuestas', async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      res.json(encuestas);
    } catch (error) {
      console.error('Error al obtener encuestas:', error);
      res.status(500).json({ message: 'Error al obtener encuestas' });
    }
  });

  app.get('/api/encuestas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const encuesta = await storage.getEncuesta(id);
      if (!encuesta) {
        return res.status(404).json({ message: 'Encuesta no encontrada' });
      }
      res.json(encuesta);
    } catch (error) {
      console.error('Error al obtener encuesta:', error);
      res.status(500).json({ message: 'Error al obtener encuesta' });
    }
  });

  app.post('/api/encuestas', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = insertEncuestaSchema.parse(req.body);
      const encuesta = await storage.createEncuesta(data);
      res.json(encuesta);
    } catch (error: any) {
      console.error('Error al crear encuesta:', error);
      res.status(400).json({ message: error.message || 'Error al crear encuesta' });
    }
  });

  app.put('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertEncuestaSchema.partial().parse(req.body);
      const encuesta = await storage.updateEncuesta(id, data);
      if (!encuesta) {
        return res.status(404).json({ message: 'Encuesta no encontrada' });
      }
      res.json(encuesta);
    } catch (error: any) {
      console.error('Error al actualizar encuesta:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar encuesta' });
    }
  });

  app.delete('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEncuesta(id);
      res.json({ message: 'Encuesta eliminada' });
    } catch (error) {
      console.error('Error al eliminar encuesta:', error);
      res.status(500).json({ message: 'Error al eliminar encuesta' });
    }
  });

  // ============================================================
  // POPUPS PUBLICITARIOS
  // ============================================================

  app.get('/api/popups', async (req, res) => {
    try {
      const popups = await storage.getPopups();
      res.json(popups);
    } catch (error) {
      console.error('Error al obtener popups:', error);
      res.status(500).json({ message: 'Error al obtener popups' });
    }
  });

  app.get('/api/popups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const popup = await storage.getPopup(id);
      if (!popup) {
        return res.status(404).json({ message: 'Popup no encontrado' });
      }
      res.json(popup);
    } catch (error) {
      console.error('Error al obtener popup:', error);
      res.status(500).json({ message: 'Error al obtener popup' });
    }
  });

  app.post('/api/popups', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = insertPopupPublicitarioSchema.parse(req.body);
      const popup = await storage.createPopup(data);
      res.json(popup);
    } catch (error: any) {
      console.error('Error al crear popup:', error);
      res.status(400).json({ message: error.message || 'Error al crear popup' });
    }
  });

  app.put('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertPopupPublicitarioSchema.partial().parse(req.body);
      const popup = await storage.updatePopup(id, data);
      if (!popup) {
        return res.status(404).json({ message: 'Popup no encontrado' });
      }
      res.json(popup);
    } catch (error: any) {
      console.error('Error al actualizar popup:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar popup' });
    }
  });

  app.delete('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePopup(id);
      res.json({ message: 'Popup eliminado' });
    } catch (error) {
      console.error('Error al eliminar popup:', error);
      res.status(500).json({ message: 'Error al eliminar popup' });
    }
  });

  // ============================================================
  // EVENTOS CALENDARIZADOS
  // ============================================================

  app.get('/api/eventos', async (req, res) => {
    try {
      const eventos = await storage.getAllEventos();
      res.json(eventos);
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      res.status(500).json({ message: 'Error al obtener eventos' });
    }
  });

  app.get('/api/eventos/activos', async (req, res) => {
    try {
      const eventos = await storage.getEventosActivos();
      res.json(eventos);
    } catch (error) {
      console.error('Error al obtener eventos activos:', error);
      res.status(500).json({ message: 'Error al obtener eventos activos' });
    }
  });

  app.get('/api/eventos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const evento = await storage.getEventoById(id);
      if (!evento) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }
      res.json(evento);
    } catch (error) {
      console.error('Error al obtener evento:', error);
      res.status(500).json({ message: 'Error al obtener evento' });
    }
  });

  app.post('/api/eventos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const evento = await storage.createEvento(req.body);
      res.json(evento);
    } catch (error: any) {
      console.error('Error al crear evento:', error);
      res.status(400).json({ message: error.message || 'Error al crear evento' });
    }
  });

  app.put('/api/eventos/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const evento = await storage.updateEvento(id, req.body);
      if (!evento) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }
      res.json(evento);
    } catch (error: any) {
      console.error('Error al actualizar evento:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar evento' });
    }
  });

  app.delete('/api/eventos/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEvento(id);
      res.json({ message: 'Evento eliminado' });
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      res.status(500).json({ message: 'Error al eliminar evento' });
    }
  });

  // ============================================================
  // AVISOS DE EMERGENCIA
  // ============================================================

  app.get('/api/avisos-emergencia', async (req, res) => {
    try {
      const avisos = await storage.getAllAvisosEmergencia();
      res.json(avisos);
    } catch (error) {
      console.error('Error al obtener avisos:', error);
      res.status(500).json({ message: 'Error al obtener avisos' });
    }
  });

  app.get('/api/avisos-emergencia/activos', async (req, res) => {
    try {
      const avisos = await storage.getAvisosEmergenciaActivos();
      res.json(avisos);
    } catch (error) {
      console.error('Error al obtener avisos activos:', error);
      res.status(500).json({ message: 'Error al obtener avisos activos' });
    }
  });

  app.get('/api/avisos-emergencia/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const aviso = await storage.getAvisoEmergenciaById(id);
      if (!aviso) {
        return res.status(404).json({ message: 'Aviso no encontrado' });
      }
      res.json(aviso);
    } catch (error) {
      console.error('Error al obtener aviso:', error);
      res.status(500).json({ message: 'Error al obtener aviso' });
    }
  });

  app.post('/api/avisos-emergencia', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const aviso = await storage.createAvisoEmergencia(req.body);
      res.json(aviso);
    } catch (error: any) {
      console.error('Error al crear aviso:', error);
      res.status(400).json({ message: error.message || 'Error al crear aviso' });
    }
  });

  app.put('/api/avisos-emergencia/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const aviso = await storage.updateAvisoEmergencia(id, req.body);
      if (!aviso) {
        return res.status(404).json({ message: 'Aviso no encontrado' });
      }
      res.json(aviso);
    } catch (error: any) {
      console.error('Error al actualizar aviso:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar aviso' });
    }
  });

  app.delete('/api/avisos-emergencia/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAvisoEmergencia(id);
      res.json({ message: 'Aviso eliminado' });
    } catch (error) {
      console.error('Error al eliminar aviso:', error);
      res.status(500).json({ message: 'Error al eliminar aviso' });
    }
  });

  // ============================================================
  // TIPOS DE MONEDA
  // ============================================================

  app.get('/api/tipos-moneda', async (req, res) => {
    try {
      const tipos = await storage.getAllTiposMoneda();
      res.json(tipos);
    } catch (error) {
      console.error('Error al obtener tipos de moneda:', error);
      res.status(500).json({ message: 'Error al obtener tipos de moneda' });
    }
  });

  app.get('/api/tipos-moneda/activos', async (req, res) => {
    try {
      const tipos = await storage.getTiposMonedaActivos();
      res.json(tipos);
    } catch (error) {
      console.error('Error al obtener tipos activos:', error);
      res.status(500).json({ message: 'Error al obtener tipos activos' });
    }
  });

  app.get('/api/tipos-moneda/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const tipo = await storage.getTipoMonedaById(id);
      if (!tipo) {
        return res.status(404).json({ message: 'Tipo de moneda no encontrado' });
      }
      res.json(tipo);
    } catch (error) {
      console.error('Error al obtener tipo de moneda:', error);
      res.status(500).json({ message: 'Error al obtener tipo de moneda' });
    }
  });

  app.post('/api/tipos-moneda', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const tipo = await storage.createTipoMoneda(req.body);
      res.json(tipo);
    } catch (error: any) {
      console.error('Error al crear tipo de moneda:', error);
      res.status(400).json({ message: error.message || 'Error al crear tipo de moneda' });
    }
  });

  app.put('/api/tipos-moneda/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const tipo = await storage.updateTipoMoneda(id, req.body);
      if (!tipo) {
        return res.status(404).json({ message: 'Tipo de moneda no encontrado' });
      }
      res.json(tipo);
    } catch (error: any) {
      console.error('Error al actualizar tipo de moneda:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar tipo de moneda' });
    }
  });

  app.delete('/api/tipos-moneda/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTipoMoneda(id);
      res.json({ message: 'Tipo de moneda eliminado' });
    } catch (error) {
      console.error('Error al eliminar tipo de moneda:', error);
      res.status(500).json({ message: 'Error al eliminar tipo de moneda' });
    }
  });

  // ============================================================
  // TASAS DE CAMBIO
  // ============================================================

  app.get('/api/tasas-cambio', async (req, res) => {
    try {
      const tasas = await storage.getAllTasasCambio();
      res.json(tasas);
    } catch (error) {
      console.error('Error al obtener tasas de cambio:', error);
      res.status(500).json({ message: 'Error al obtener tasas de cambio' });
    }
  });

  app.get('/api/tasas-cambio/:origenId/:destinoId', async (req, res) => {
    try {
      const { origenId, destinoId } = req.params;
      const tasa = await storage.getTasaCambioByMonedas(origenId, destinoId);
      if (!tasa) {
        return res.status(404).json({ message: 'Tasa de cambio no encontrada' });
      }
      res.json(tasa);
    } catch (error) {
      console.error('Error al obtener tasa de cambio:', error);
      res.status(500).json({ message: 'Error al obtener tasa de cambio' });
    }
  });

  app.post('/api/tasas-cambio', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const tasa = await storage.createTasaCambio(req.body);
      res.json(tasa);
    } catch (error: any) {
      console.error('Error al crear tasa de cambio:', error);
      res.status(400).json({ message: error.message || 'Error al crear tasa de cambio' });
    }
  });

  app.put('/api/tasas-cambio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const tasa = await storage.updateTasaCambio(id, req.body);
      if (!tasa) {
        return res.status(404).json({ message: 'Tasa de cambio no encontrada' });
      }
      res.json(tasa);
    } catch (error: any) {
      console.error('Error al actualizar tasa de cambio:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar tasa de cambio' });
    }
  });

  app.delete('/api/tasas-cambio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTasaCambio(id);
      res.json({ message: 'Tasa de cambio eliminada' });
    } catch (error) {
      console.error('Error al eliminar tasa de cambio:', error);
      res.status(500).json({ message: 'Error al eliminar tasa de cambio' });
    }
  });

  // ============================================================
  // CONFIGURACIÓN DEL SITIO
  // ============================================================

  app.get('/api/configuracion', async (req, res) => {
    try {
      const configuraciones = await storage.getAllConfiguraciones();
      res.json(configuraciones);
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      res.status(500).json({ message: 'Error al obtener configuraciones' });
    }
  });

  app.get('/api/configuracion/:clave', async (req, res) => {
    try {
      const { clave } = req.params;
      const config = await storage.getConfiguracionByClave(clave);
      if (!config) {
        return res.status(404).json({ message: 'Configuración no encontrada' });
      }
      res.json(config);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({ message: 'Error al obtener configuración' });
    }
  });

  app.put('/api/configuracion/:clave', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { clave } = req.params;
      const { valor } = req.body;
      if (!valor) {
        return res.status(400).json({ message: 'Valor requerido' });
      }
      const config = await storage.updateConfiguracion(clave, valor);
      if (!config) {
        return res.status(404).json({ message: 'Configuración no encontrada' });
      }
      res.json(config);
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      res.status(400).json({ message: error.message || 'Error al actualizar configuración' });
    }
  });
}
