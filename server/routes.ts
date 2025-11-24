import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPublicidadSchema, insertServicioSchema, insertProductoDeliverySchema, insertGrupoChatSchema, insertMensajeSchema, insertEmergenciaSchema, insertViajeTaxiSchema, insertPedidoDeliverySchema, insertRadioOnlineSchema, insertArchivoMp3Schema } from "@shared/schema";
import { registerAdminRoutes } from "./routes-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación
  await setupAuth(app);

  // Registrar rutas de administración
  registerAdminRoutes(app);

  // ============================================================
  // RUTAS DE AUTENTICACIÓN
  // ============================================================

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ message: "Error al obtener usuario" });
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
      const data = insertPublicidadSchema.parse(req.body);
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
      const publicidad = await storage.updatePublicidad(id, req.body);
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
  // CONFIGURACIÓN DE WEBSOCKET
  // ============================================================

  const httpServer = createServer(app);
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Nuevo cliente WebSocket conectado');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Mensaje WebSocket recibido:', data);

        // Reenviar mensaje a todos los clientes conectados
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    });

    ws.on('close', () => {
      console.log('Cliente WebSocket desconectado');
    });
  });

  return httpServer;
}
