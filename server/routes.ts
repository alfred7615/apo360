import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createUploadMiddleware, getPublicUrl } from "./uploadConfigByEndpoint";
import { requireSuperAdmin } from "./authMiddleware";
import { 
  insertPublicidadSchema, 
  insertServicioSchema, 
  insertProductoDeliverySchema, 
  insertGrupoChatSchema, 
  insertMensajeSchema, 
  insertEmergenciaSchema, 
  insertViajeTaxiSchema, 
  insertPedidoDeliverySchema, 
  insertRadioOnlineSchema, 
  insertArchivoMp3Schema,
  insertRegistroBasicoSchema,
  insertRegistroChatSchema,
  insertRegistroUbicacionSchema,
  insertRegistroDireccionSchema,
  insertRegistroMarketplaceSchema,
  insertCredencialesConductorSchema,
} from "@shared/schema";
import { registerAdminRoutes } from "./routes-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación
  await setupAuth(app);

  // Servir archivos estáticos
  const publicPath = path.join(process.cwd(), 'public');
  app.use('/assets', express.static(path.join(publicPath, 'assets')));

  // Registrar rutas de administración
  registerAdminRoutes(app);

  // ============================================================
  // RUTAS DE UPLOAD DE ARCHIVOS
  // ============================================================

  app.post('/api/upload/publicidad', isAuthenticated, requireSuperAdmin, createUploadMiddleware('carrusel', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de publicidad:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/galeria', isAuthenticated, requireSuperAdmin, createUploadMiddleware('galeria', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de galería:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/servicios', isAuthenticated, requireSuperAdmin, createUploadMiddleware('servicios', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de servicios:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/documentos', isAuthenticated, requireSuperAdmin, createUploadMiddleware('documentos', 'documento'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        tipo: req.body.tipoDocumento || 'general',
      });
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      res.status(500).json({ message: error.message || 'Error al subir documento' });
    }
  });

  // ============================================================
  // RUTAS DE AUTENTICACIÓN
  // ============================================================

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const authUser = {
        id: user.id,
        nombre: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName || user.lastName || 'Usuario',
        email: user.email || '',
        rol: user.rol,
        rolesSuperAdmin: user.rol === 'super_admin',
        telefono: user.telefono || undefined,
        ubicacionLatitud: user.latitud || undefined,
        ubicacionLongitud: user.longitud || undefined,
        modoTaxi: user.modoTaxi === 'conductor',
        activo: user.estado === 'activo',
        imagenPerfil: user.profileImageUrl || undefined,
        primerNombre: user.firstName || undefined,
        apellido: user.lastName || undefined,
      };
      
      res.json(authUser);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  // ============================================================
  // RUTAS DE PERFIL DE USUARIO
  // ============================================================

  app.get('/api/usuarios/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({ message: "Error al obtener perfil" });
    }
  });

  app.patch('/api/usuarios/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUser(userId, req.body);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      res.status(400).json({ message: error.message || "Error al actualizar perfil" });
    }
  });

  app.post('/api/usuarios/:id/foto', isAuthenticated, createUploadMiddleware('perfiles', 'imagen'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      if (id !== userId && req.user.claims.rol !== 'super_admin') {
        return res.status(403).json({ message: "No autorizado" });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      }

      const url = getPublicUrl(req.file.path);
      const user = await storage.updateUser(id, { profileImageUrl: url });
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({ 
        profileImageUrl: url,
        message: "Foto de perfil actualizada"
      });
    } catch (error: any) {
      console.error("Error al subir foto de perfil:", error);
      res.status(500).json({ message: error.message || "Error al subir foto de perfil" });
    }
  });

  // ============================================================
  // RUTAS DE PUBLICIDAD
  // ============================================================

  app.get('/api/publicidad', async (req, res) => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const publicidades = await storage.getPublicidades(tipo);
      res.json(publicidades);
    } catch (error) {
      console.error("Error al obtener publicidad:", error);
      res.status(500).json({ message: "Error al obtener publicidad" });
    }
  });

  app.post('/api/publicidad', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convertir fechas de string a Date si es necesario
      const body = { ...req.body };
      if (body.fechaInicio && typeof body.fechaInicio === 'string') {
        body.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
      }
      if (body.fechaFin && typeof body.fechaFin === 'string') {
        body.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
      }
      if (body.fechaCaducidad && typeof body.fechaCaducidad === 'string') {
        body.fechaCaducidad = body.fechaCaducidad ? new Date(body.fechaCaducidad) : null;
      }
      
      const data = insertPublicidadSchema.parse(body);
      const publicidad = await storage.createPublicidad({
        ...data,
        usuarioId: userId,
      });
      res.json(publicidad);
    } catch (error: any) {
      console.error("Error al crear publicidad:", error);
      res.status(400).json({ message: error.message || "Error al crear publicidad" });
    }
  });

  app.patch('/api/publicidad/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convertir fechas de string a Date si es necesario
      const body = { ...req.body };
      if (body.fechaInicio && typeof body.fechaInicio === 'string') {
        body.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
      }
      if (body.fechaFin && typeof body.fechaFin === 'string') {
        body.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
      }
      if (body.fechaCaducidad && typeof body.fechaCaducidad === 'string') {
        body.fechaCaducidad = body.fechaCaducidad ? new Date(body.fechaCaducidad) : null;
      }
      
      const publicidad = await storage.updatePublicidad(id, body);
      if (!publicidad) {
        return res.status(404).json({ message: "Publicidad no encontrada" });
      }
      res.json(publicidad);
    } catch (error) {
      console.error("Error al actualizar publicidad:", error);
      res.status(500).json({ message: "Error al actualizar publicidad" });
    }
  });

  app.delete('/api/publicidad/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePublicidad(id);
      res.json({ message: "Publicidad eliminada" });
    } catch (error) {
      console.error("Error al eliminar publicidad:", error);
      res.status(500).json({ message: "Error al eliminar publicidad" });
    }
  });

  // ============================================================
  // RUTAS DE SERVICIOS
  // ============================================================

  app.get('/api/servicios', async (req, res) => {
    try {
      const servicios = await storage.getServicios();
      res.json(servicios);
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      res.status(500).json({ message: "Error al obtener servicios" });
    }
  });

  app.get('/api/servicios/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const servicio = await storage.getServicio(id);
      if (!servicio) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }
      res.json(servicio);
    } catch (error) {
      console.error("Error al obtener servicio:", error);
      res.status(500).json({ message: "Error al obtener servicio" });
    }
  });

  app.get('/api/servicios/:id/productos', async (req, res) => {
    try {
      const { id } = req.params;
      const productos = await storage.getProductosPorServicio(id);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.post('/api/servicios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertServicioSchema.parse(req.body);
      const servicio = await storage.createServicio({
        ...data,
        usuarioId: userId,
      });
      res.json(servicio);
    } catch (error: any) {
      console.error("Error al crear servicio:", error);
      res.status(400).json({ message: error.message || "Error al crear servicio" });
    }
  });

  // ============================================================
  // RUTAS DE CHAT
  // ============================================================

  app.get('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grupos = await storage.getGruposPorUsuario(userId);
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      res.status(500).json({ message: "Error al obtener grupos" });
    }
  });

  app.post('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGrupoChatSchema.parse(req.body);
      const grupo = await storage.createGrupo({
        ...data,
        creadorId: userId,
      });
      
      // Agregar al creador como miembro
      await storage.agregarMiembroGrupo({
        grupoId: grupo.id,
        usuarioId: userId,
        rol: 'admin',
      });
      
      res.json(grupo);
    } catch (error: any) {
      console.error("Error al crear grupo:", error);
      res.status(400).json({ message: error.message || "Error al crear grupo" });
    }
  });

  app.get('/api/chat/mensajes/:grupoId', isAuthenticated, async (req, res) => {
    try {
      const { grupoId } = req.params;
      const mensajes = await storage.getMensajesPorGrupo(grupoId);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.post('/api/chat/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertMensajeSchema.parse(req.body);
      const mensaje = await storage.createMensaje({
        ...data,
        remitenteId: userId,
      });
      
      // Emitir mensaje a través de WebSocket (se manejará después)
      res.json(mensaje);
    } catch (error: any) {
      console.error("Error al crear mensaje:", error);
      res.status(400).json({ message: error.message || "Error al crear mensaje" });
    }
  });

  // ============================================================
  // RUTAS DE EMERGENCIAS
  // ============================================================

  app.get('/api/emergencias', isAuthenticated, async (req, res) => {
    try {
      const emergencias = await storage.getEmergencias();
      res.json(emergencias);
    } catch (error) {
      console.error("Error al obtener emergencias:", error);
      res.status(500).json({ message: "Error al obtener emergencias" });
    }
  });

  app.get('/api/emergencias/recientes', async (req, res) => {
    try {
      const limite = parseInt(req.query.limite as string) || 10;
      const emergencias = await storage.getEmergenciasRecientes(limite);
      res.json(emergencias);
    } catch (error) {
      console.error("Error al obtener emergencias recientes:", error);
      res.status(500).json({ message: "Error al obtener emergencias recientes" });
    }
  });

  app.post('/api/emergencias', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertEmergenciaSchema.parse(req.body);
      const emergencia = await storage.createEmergencia({
        ...data,
        usuarioId: userId,
      });
      
      // TODO: Enviar notificaciones a grupos y entidades
      res.json(emergencia);
    } catch (error: any) {
      console.error("Error al crear emergencia:", error);
      res.status(400).json({ message: error.message || "Error al crear emergencia" });
    }
  });

  app.patch('/api/emergencias/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const emergencia = await storage.updateEmergencia(id, req.body);
      if (!emergencia) {
        return res.status(404).json({ message: "Emergencia no encontrada" });
      }
      res.json(emergencia);
    } catch (error) {
      console.error("Error al actualizar emergencia:", error);
      res.status(500).json({ message: "Error al actualizar emergencia" });
    }
  });

  // ============================================================
  // RUTAS DE TAXI
  // ============================================================

  app.get('/api/taxi/viajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const viajes = await storage.getViajesTaxi(userId);
      res.json(viajes);
    } catch (error) {
      console.error("Error al obtener viajes:", error);
      res.status(500).json({ message: "Error al obtener viajes" });
    }
  });

  app.post('/api/taxi/viajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertViajeTaxiSchema.parse(req.body);
      const viaje = await storage.createViajeTaxi({
        ...data,
        pasajeroId: userId,
      });
      res.json(viaje);
    } catch (error: any) {
      console.error("Error al crear viaje:", error);
      res.status(400).json({ message: error.message || "Error al crear viaje" });
    }
  });

  app.patch('/api/taxi/viajes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const viaje = await storage.updateViajeTaxi(id, req.body);
      if (!viaje) {
        return res.status(404).json({ message: "Viaje no encontrado" });
      }
      res.json(viaje);
    } catch (error) {
      console.error("Error al actualizar viaje:", error);
      res.status(500).json({ message: "Error al actualizar viaje" });
    }
  });

  app.get('/api/taxi/conductores', isAuthenticated, async (req, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      const conductores = usuarios.filter(u => u.rol === 'conductor' || u.modoTaxi === 'conductor');
      res.json(conductores.map(c => ({
        id: c.id,
        nombre: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}`.trim() : c.firstName || c.lastName || 'Conductor',
        telefono: c.telefono || '',
        activo: c.estado === 'activo',
        email: c.email,
      })));
    } catch (error) {
      console.error("Error al obtener conductores:", error);
      res.status(500).json({ message: "Error al obtener conductores" });
    }
  });

  // ============================================================
  // RUTAS DE DELIVERY
  // ============================================================

  app.get('/api/delivery/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pedidos = await storage.getPedidosDelivery(userId);
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  });

  app.post('/api/delivery/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPedidoDeliverySchema.parse(req.body);
      const pedido = await storage.createPedidoDelivery({
        ...data,
        usuarioId: userId,
      });
      res.json(pedido);
    } catch (error: any) {
      console.error("Error al crear pedido:", error);
      res.status(400).json({ message: error.message || "Error al crear pedido" });
    }
  });

  app.patch('/api/delivery/pedidos/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await storage.updatePedidoDelivery(id, req.body);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      res.json(pedido);
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      res.status(500).json({ message: "Error al actualizar pedido" });
    }
  });

  // ============================================================
  // RUTAS DE RADIO Y AUDIO
  // ============================================================

  app.get('/api/radios-online', async (req, res) => {
    try {
      const radios = await storage.getRadiosOnline();
      res.json(radios);
    } catch (error) {
      console.error("Error al obtener radios:", error);
      res.status(500).json({ message: "Error al obtener radios" });
    }
  });

  app.post('/api/radios-online', isAuthenticated, async (req, res) => {
    try {
      const data = insertRadioOnlineSchema.parse(req.body);
      const radio = await storage.createRadioOnline(data);
      res.json(radio);
    } catch (error: any) {
      console.error("Error al crear radio:", error);
      res.status(400).json({ message: error.message || "Error al crear radio" });
    }
  });

  app.get('/api/archivos-mp3', async (req, res) => {
    try {
      const archivos = await storage.getArchivosMp3();
      res.json(archivos);
    } catch (error) {
      console.error("Error al obtener archivos MP3:", error);
      res.status(500).json({ message: "Error al obtener archivos MP3" });
    }
  });

  app.post('/api/archivos-mp3', isAuthenticated, async (req, res) => {
    try {
      const data = insertArchivoMp3Schema.parse(req.body);
      const archivo = await storage.createArchivoMp3(data);
      res.json(archivo);
    } catch (error: any) {
      console.error("Error al crear archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al crear archivo MP3" });
    }
  });

  // ============================================================
  // RUTAS DE CONFIGURACIÓN
  // ============================================================

  app.get('/api/configuracion/:clave', async (req, res) => {
    try {
      const { clave } = req.params;
      const config = await storage.getConfiguracion(clave);
      res.json(config || null);
    } catch (error) {
      console.error("Error al obtener configuración:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.post('/api/configuracion', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.setConfiguracion(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      res.status(500).json({ message: "Error al guardar configuración" });
    }
  });

  // Ruta de sugerencias (envío de formulario)
  app.post('/api/sugerencias', async (req, res) => {
    try {
      // TODO: Implementar envío de email con las sugerencias
      console.log("Nueva sugerencia recibida:", req.body);
      res.json({ message: "Sugerencia recibida correctamente" });
    } catch (error) {
      console.error("Error al procesar sugerencia:", error);
      res.status(500).json({ message: "Error al procesar sugerencia" });
    }
  });

  // ============================================================
  // MIGRACIÓN DE DATOS: Backfill miembros_grupo
  // ============================================================
  
  app.post('/api/admin/backfill-miembros', isAuthenticated, async (req: any, res) => {
    try {
      // Solo super_admin puede ejecutar backfill
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      console.log('🔄 Iniciando backfill de miembros_grupo...');
      
      // Obtener todos los grupos con miembros JSON legacy
      const grupos = await storage.getAllGruposConMiembrosLegacy();
      let migrados = 0;
      let errores = 0;
      
      for (const grupo of grupos) {
        try {
          // Migrar miembros del JSON a la tabla normalizada
          if (grupo.miembros && Array.isArray(grupo.miembros)) {
            for (const usuarioId of grupo.miembros) {
              try {
                await storage.agregarMiembroGrupo({
                  grupoId: grupo.id,
                  usuarioId: usuarioId as string,
                  rol: usuarioId === grupo.creadorId ? 'admin' : 'miembro',
                });
                migrados++;
              } catch (error) {
                console.error(`Error al agregar miembro ${usuarioId} al grupo ${grupo.id}:`, error);
                errores++;
              }
            }
          }
        } catch (error) {
          console.error(`Error al procesar grupo ${grupo.id}:`, error);
          errores++;
        }
      }

      console.log(`✅ Backfill completado: ${migrados} miembros migrados, ${errores} errores`);
      res.json({
        success: true,
        migrados,
        errores,
        message: `Backfill completado: ${migrados} miembros migrados`,
      });
    } catch (error) {
      console.error('❌ Error en backfill:', error);
      res.status(500).json({ message: 'Error en backfill' });
    }
  });

  // ============================================================
  // SISTEMA DE REGISTRO POR NIVELES (5 ESTRELLAS)
  // ============================================================

  // Obtener nivel actual del usuario
  app.get('/api/registro/nivel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const nivel = await storage.getNivelRegistro(userId);
      res.json({ nivel });
    } catch (error) {
      console.error("Error al obtener nivel de registro:", error);
      res.status(500).json({ message: "Error al obtener nivel de registro" });
    }
  });

  // NIVEL 1: Registro Básico
  app.get('/api/registro/basico', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroBasico(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro básico:", error);
      res.status(500).json({ message: "Error al obtener registro básico" });
    }
  });

  app.post('/api/registro/basico', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertRegistroBasicoSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroBasico(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro básico:", error);
      res.status(400).json({ message: error.message || "Error al crear registro básico" });
    }
  });

  // NIVEL 2: Servicio Chat
  app.get('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroChat(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro chat:", error);
      res.status(500).json({ message: "Error al obtener registro chat" });
    }
  });

  app.post('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 1 exactamente (verificar existencia de registro_basico)
      const registroBasico = await storage.getRegistroBasico(userId);
      if (!registroBasico) {
        return res.status(400).json({ message: "Debe completar el nivel 1 (registro básico) primero" });
      }
      
      const data = insertRegistroChatSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroChat(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro chat:", error);
      res.status(400).json({ message: error.message || "Error al crear registro chat" });
    }
  });

  app.patch('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroChat(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro chat:", error);
      res.status(500).json({ message: "Error al actualizar registro chat" });
    }
  });

  // NIVEL 3: Ubicación
  app.get('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroUbicacion(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro ubicación:", error);
      res.status(500).json({ message: "Error al obtener registro ubicación" });
    }
  });

  app.post('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 2 exactamente (verificar existencia de registro_chat)
      const registroChat = await storage.getRegistroChat(userId);
      if (!registroChat) {
        return res.status(400).json({ message: "Debe completar el nivel 2 (registro chat) primero" });
      }
      
      const data = insertRegistroUbicacionSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroUbicacion(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro ubicación:", error);
      res.status(400).json({ message: error.message || "Error al crear registro ubicación" });
    }
  });

  app.patch('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroUbicacion(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro ubicación:", error);
      res.status(500).json({ message: "Error al actualizar registro ubicación" });
    }
  });

  // NIVEL 4: Dirección
  app.get('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroDireccion(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro dirección:", error);
      res.status(500).json({ message: "Error al obtener registro dirección" });
    }
  });

  app.post('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 3 exactamente (verificar existencia de registro_ubicacion)
      const registroUbicacion = await storage.getRegistroUbicacion(userId);
      if (!registroUbicacion) {
        return res.status(400).json({ message: "Debe completar el nivel 3 (registro ubicación) primero" });
      }
      
      const data = insertRegistroDireccionSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroDireccion(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro dirección:", error);
      res.status(400).json({ message: error.message || "Error al crear registro dirección" });
    }
  });

  app.patch('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroDireccion(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro dirección:", error);
      res.status(500).json({ message: "Error al actualizar registro dirección" });
    }
  });

  // NIVEL 5: Marketplace
  app.get('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroMarketplace(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro marketplace:", error);
      res.status(500).json({ message: "Error al obtener registro marketplace" });
    }
  });

  app.post('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 4 exactamente (verificar existencia de registro_direccion)
      const registroDireccion = await storage.getRegistroDireccion(userId);
      if (!registroDireccion) {
        return res.status(400).json({ message: "Debe completar el nivel 4 (registro dirección) primero" });
      }
      
      const data = insertRegistroMarketplaceSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroMarketplace(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro marketplace:", error);
      res.status(400).json({ message: error.message || "Error al crear registro marketplace" });
    }
  });

  app.patch('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroMarketplace(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro marketplace:", error);
      res.status(500).json({ message: "Error al actualizar registro marketplace" });
    }
  });

  // CREDENCIALES DE CONDUCTOR
  app.get('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credenciales = await storage.getCredencialesConductor(userId);
      res.json(credenciales || {});
    } catch (error) {
      console.error("Error al obtener credenciales conductor:", error);
      res.status(500).json({ message: "Error al obtener credenciales conductor" });
    }
  });

  app.post('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertCredencialesConductorSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const credenciales = await storage.createCredencialesConductor(data);
      res.json(credenciales);
    } catch (error: any) {
      console.error("Error al crear credenciales conductor:", error);
      res.status(400).json({ message: error.message || "Error al crear credenciales conductor" });
    }
  });

  app.patch('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credenciales = await storage.updateCredencialesConductor(userId, req.body);
      if (!credenciales) {
        return res.status(404).json({ message: "Credenciales no encontradas" });
      }
      res.json(credenciales);
    } catch (error) {
      console.error("Error al actualizar credenciales conductor:", error);
      res.status(500).json({ message: "Error al actualizar credenciales conductor" });
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
      console.error("Error al obtener encuestas:", error);
      res.status(500).json({ message: "Error al obtener encuestas" });
    }
  });

  app.get('/api/encuestas/activas', async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      const ahora = new Date();
      const activas = encuestas.filter(e => {
        if (e.estado !== 'activa') return false;
        const inicioValido = !e.fechaInicio || new Date(e.fechaInicio) <= ahora;
        const finValido = !e.fechaFin || new Date(e.fechaFin) >= ahora;
        return inicioValido && finValido;
      });
      res.json(activas);
    } catch (error) {
      console.error("Error al obtener encuestas activas:", error);
      res.status(500).json({ message: "Error al obtener encuestas activas" });
    }
  });

  app.get('/api/encuestas/:id', async (req, res) => {
    try {
      const encuesta = await storage.getEncuesta(req.params.id);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error) {
      console.error("Error al obtener encuesta:", error);
      res.status(500).json({ message: "Error al obtener encuesta" });
    }
  });

  app.get('/api/encuestas/:id/resultados', async (req, res) => {
    try {
      const encuesta = await storage.getEncuesta(req.params.id);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      const resultados = await storage.getResultadosEncuesta(req.params.id);
      res.json({ encuesta, resultados });
    } catch (error) {
      console.error("Error al obtener resultados:", error);
      res.status(500).json({ message: "Error al obtener resultados" });
    }
  });

  app.post('/api/encuestas', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        usuarioId: userId,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
      };
      const encuesta = await storage.createEncuesta(data);
      res.json(encuesta);
    } catch (error: any) {
      console.error("Error al crear encuesta:", error);
      res.status(400).json({ message: error.message || "Error al crear encuesta" });
    }
  });

  app.patch('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
      };
      const encuesta = await storage.updateEncuesta(req.params.id, data);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error: any) {
      console.error("Error al actualizar encuesta:", error);
      res.status(400).json({ message: error.message || "Error al actualizar encuesta" });
    }
  });

  app.delete('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteEncuesta(req.params.id);
      res.json({ message: "Encuesta eliminada" });
    } catch (error) {
      console.error("Error al eliminar encuesta:", error);
      res.status(500).json({ message: "Error al eliminar encuesta" });
    }
  });

  app.post('/api/encuestas/:id/responder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const encuestaId = req.params.id;
      
      const yaRespondio = await storage.verificarRespuestaUsuario(encuestaId, userId);
      if (yaRespondio) {
        return res.status(400).json({ message: "Ya has respondido esta encuesta" });
      }

      const respuesta = await storage.createRespuestaEncuesta({
        encuestaId,
        usuarioId: userId,
        respuestas: req.body.respuestas,
      });
      res.json(respuesta);
    } catch (error: any) {
      console.error("Error al responder encuesta:", error);
      res.status(400).json({ message: error.message || "Error al responder encuesta" });
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
      console.error("Error al obtener popups:", error);
      res.status(500).json({ message: "Error al obtener popups" });
    }
  });

  app.get('/api/popups/activos', async (req, res) => {
    try {
      const popups = await storage.getPopupsActivos();
      res.json(popups);
    } catch (error) {
      console.error("Error al obtener popups activos:", error);
      res.status(500).json({ message: "Error al obtener popups activos" });
    }
  });

  app.get('/api/popups/:id', async (req, res) => {
    try {
      const popup = await storage.getPopup(req.params.id);
      if (!popup) {
        return res.status(404).json({ message: "Popup no encontrado" });
      }
      res.json(popup);
    } catch (error) {
      console.error("Error al obtener popup:", error);
      res.status(500).json({ message: "Error al obtener popup" });
    }
  });

  app.post('/api/popups', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        usuarioId: userId,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
      };
      const popup = await storage.createPopup(data);
      res.json(popup);
    } catch (error: any) {
      console.error("Error al crear popup:", error);
      res.status(400).json({ message: error.message || "Error al crear popup" });
    }
  });

  app.patch('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
      };
      const popup = await storage.updatePopup(req.params.id, data);
      if (!popup) {
        return res.status(404).json({ message: "Popup no encontrado" });
      }
      res.json(popup);
    } catch (error: any) {
      console.error("Error al actualizar popup:", error);
      res.status(400).json({ message: error.message || "Error al actualizar popup" });
    }
  });

  app.delete('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deletePopup(req.params.id);
      res.json({ message: "Popup eliminado" });
    } catch (error) {
      console.error("Error al eliminar popup:", error);
      res.status(500).json({ message: "Error al eliminar popup" });
    }
  });

  app.post('/api/popups/:id/vista', async (req, res) => {
    try {
      await storage.incrementarVistasPopup(req.params.id);
      res.json({ message: "Vista registrada" });
    } catch (error) {
      console.error("Error al registrar vista:", error);
      res.status(500).json({ message: "Error al registrar vista" });
    }
  });

  // ============================================================
  // INTERACCIONES SOCIALES (likes, favoritos, compartir, calendario)
  // ============================================================

  app.get('/api/interacciones/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const contadores = await storage.getContadoresInteracciones(tipoContenido, contenidoId);
      res.json(contadores);
    } catch (error) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  app.post('/api/interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, tipoInteraccion, valor } = req.body;
      
      const yaExiste = await storage.verificarInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
      if (yaExiste) {
        await storage.deleteInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
        return res.json({ message: "Interacción eliminada", accion: "eliminada" });
      }

      const interaccion = await storage.createInteraccion({
        tipoContenido,
        contenidoId,
        usuarioId: userId,
        tipoInteraccion,
        valor,
      });
      res.json({ ...interaccion, accion: "creada" });
    } catch (error: any) {
      console.error("Error al crear interacción:", error);
      res.status(400).json({ message: error.message || "Error al crear interacción" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId/usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId } = req.params;
      
      const tipos = ['like', 'favorito', 'compartir', 'calendario'];
      const interacciones: { [key: string]: boolean } = {};
      
      for (const tipo of tipos) {
        interacciones[tipo] = await storage.verificarInteraccion(userId, tipoContenido, contenidoId, tipo);
      }
      
      res.json(interacciones);
    } catch (error) {
      console.error("Error al verificar interacciones:", error);
      res.status(500).json({ message: "Error al verificar interacciones" });
    }
  });

  // ============================================================
  // COMENTARIOS
  // ============================================================

  app.get('/api/comentarios/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const comentarios = await storage.getComentarios(tipoContenido, contenidoId);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  app.post('/api/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, texto } = req.body;
      
      const comentario = await storage.createComentario({
        tipoContenido,
        contenidoId,
        usuarioId: userId,
        texto,
      });
      res.json(comentario);
    } catch (error: any) {
      console.error("Error al crear comentario:", error);
      res.status(400).json({ message: error.message || "Error al crear comentario" });
    }
  });

  app.delete('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteComentario(req.params.id);
      res.json({ message: "Comentario eliminado" });
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // ============================================================
  // CONFIGURACIÓN DE WEBSOCKET
  // ============================================================

  const httpServer = createServer(app);
  
  // Configurar WebSocket con rooms y persistencia
  const { setupWebSocket } = await import('./websocket');
  setupWebSocket(httpServer);

  return httpServer;
}
