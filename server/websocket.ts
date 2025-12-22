import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import type { InsertMensaje, InsertEmergencia } from '@shared/schema';
import type { IncomingMessage } from 'http';
import { getSession } from './replitAuth';
import passport from 'passport';

interface ExtendedWebSocket extends WebSocket {
  usuarioId?: string;
  grupoId?: string;
  isAlive?: boolean;
  userName?: string;
  userPhoto?: string;
}

interface WebSocketMessage {
  type: 'join' | 'message' | 'typing' | 'ping' | 'location' | 'emergency' | 'multimedia' | 'leave';
  grupoId?: string;
  usuarioId?: string;
  contenido?: string;
  archivoUrl?: string;
  tipoContenido?: 'texto' | 'imagen' | 'audio' | 'video' | 'documento' | 'ubicacion' | 'emergencia';
  latitud?: number;
  longitud?: number;
  metadataFoto?: {
    fechaHora?: string;
    logoUrl?: string;
    nombreUsuario?: string;
    gpsLat?: number;
    gpsLng?: number;
    marcaAgua?: string;
  };
  tipoEmergencia?: 'policia' | 'bomberos' | 'ambulancia' | 'serenazgo' | 'general';
  gruposDestino?: string[];
}

export function setupWebSocket(httpServer: Server) {
  const sessionMiddleware = getSession();
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info, callback) => {
      // Parsear sesión para autenticar usuario
      const req = info.req as any;
      const res = {} as any; // Mock response object for session middleware
      
      sessionMiddleware(req, res, async () => {
        passport.initialize()(req, res, () => {
          passport.session()(req, res, async () => {
            // Verificar si usuario está autenticado
            if (!req.user?.claims?.sub) {
              console.log('❌ WebSocket rechazado: Usuario no autenticado');
              callback(false, 401, 'No autorizado');
              return;
            }
            
            console.log(`✅ WebSocket autenticado para usuario: ${req.user.claims.sub}`);
            callback(true);
          });
        });
      });
    },
  });

  // Ping interval para mantener conexiones vivas
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', async (ws: ExtendedWebSocket, request: any) => {
    // Usuario YA está autenticado gracias a verifyClient
    const usuarioId = request.user?.claims?.sub;
    
    if (!usuarioId) {
      console.error('❌ WebSocket sin usuario autenticado (no debería pasar)');
      ws.close(1008, 'Error de autenticación');
      return;
    }

    // Asociar WebSocket con usuario autenticado
    ws.usuarioId = usuarioId;
    ws.isAlive = true;
    
    console.log(`✅ WebSocket conectado para usuario: ${usuarioId}`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message: string) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        console.log('📨 Mensaje WebSocket recibido:', data);

        switch (data.type) {
          case 'join':
            // Usuario se une a un grupo/room
            if (!data.grupoId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'grupoId es requerido',
              }));
              return;
            }

            try {
              // Usuario autenticado ya está en ws.usuarioId (de la sesión)
              // NO aceptamos usuarioId del cliente - usamos el de la sesión

              // SEGURIDAD: Verificar que el grupo existe
              const grupo = await storage.getGrupo(data.grupoId);
              if (!grupo) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Grupo no encontrado',
                }));
                return;
              }

              // SEGURIDAD: Verificar que el usuario es miembro del grupo
              if (!ws.usuarioId) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Usuario no autenticado',
                }));
                return;
              }
              const esMiembro = await storage.verificarMiembroGrupo(data.grupoId, ws.usuarioId);
              if (!esMiembro) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'No eres miembro de este grupo',
                }));
                console.log(`❌ Usuario ${ws.usuarioId} NO es miembro del grupo ${data.grupoId}`);
                return;
              }

              ws.grupoId = data.grupoId;
              console.log(`👤 Usuario ${ws.usuarioId} se unió al grupo ${data.grupoId}`);
              
              // Notificar a otros miembros del grupo
              broadcastToGroup(wss, data.grupoId, {
                type: 'user_joined',
                usuarioId: ws.usuarioId,
                grupoId: data.grupoId,
              }, ws);
            } catch (error) {
              console.error('❌ Error al unirse al grupo:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Error al unirse al grupo',
              }));
            }
            break;

          case 'message':
          case 'multimedia':
            // Enviar mensaje (texto o multimedia) y persistir en BD
            if (!data.contenido && !data.archivoUrl) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'contenido o archivoUrl es requerido',
              }));
              return;
            }

            // Verificar que está unido a un grupo
            if (!ws.grupoId || !ws.usuarioId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Debe unirse a un grupo primero',
              }));
              return;
            }

            try {
              // Obtener datos del usuario para metadata
              const usuario = await storage.getUser(ws.usuarioId);
              const nombreRemitente = `${usuario?.firstName || ''} ${usuario?.lastName || ''}`.trim() || usuario?.email || 'Usuario';
              
              // Persistir mensaje en base de datos usando usuarioId de la sesión
              const mensajeData: InsertMensaje = {
                grupoId: ws.grupoId,
                remitenteId: ws.usuarioId,
                contenido: data.contenido || '',
                tipo: data.tipoContenido || 'texto',
                archivoUrl: data.archivoUrl,
                gpsLatitud: data.latitud,
                gpsLongitud: data.longitud,
                metadataFoto: data.metadataFoto ? {
                  fechaHora: data.metadataFoto.fechaHora || new Date().toISOString(),
                  nombreUsuario: data.metadataFoto.nombreUsuario || nombreRemitente,
                  logoUrl: data.metadataFoto.logoUrl,
                  latitud: data.metadataFoto.gpsLat,
                  longitud: data.metadataFoto.gpsLng,
                } : undefined,
              };

              const mensaje = await storage.createMensaje(mensajeData);
              console.log('💾 Mensaje guardado en BD:', mensaje.id, 'tipo:', data.tipoContenido || 'texto');

              // Broadcast mensaje con datos del remitente
              broadcastToGroup(wss, ws.grupoId, {
                type: 'new_message',
                mensaje: {
                  ...mensaje,
                  nombreRemitente,
                  fotoRemitente: usuario?.profileImageUrl,
                },
              });
            } catch (error) {
              console.error('❌ Error al guardar mensaje:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Error al enviar mensaje',
              }));
            }
            break;

          case 'location':
            // Enviar ubicación GPS
            if (!ws.grupoId || !ws.usuarioId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Debe unirse a un grupo primero',
              }));
              return;
            }

            if (!data.latitud || !data.longitud) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'latitud y longitud son requeridos',
              }));
              return;
            }

            try {
              const usuario = await storage.getUser(ws.usuarioId);
              const nombreRemitente = `${usuario?.firstName || ''} ${usuario?.lastName || ''}`.trim() || usuario?.email || 'Usuario';
              
              const mensajeUbicacion: InsertMensaje = {
                grupoId: ws.grupoId,
                remitenteId: ws.usuarioId,
                contenido: data.contenido || 'Ubicación compartida',
                tipo: 'ubicacion',
                gpsLatitud: data.latitud,
                gpsLongitud: data.longitud,
              };

              const mensaje = await storage.createMensaje(mensajeUbicacion);
              console.log('📍 Ubicación guardada en BD:', mensaje.id);

              broadcastToGroup(wss, ws.grupoId, {
                type: 'new_location',
                mensaje: {
                  ...mensaje,
                  nombreRemitente,
                  fotoRemitente: usuario?.profileImageUrl,
                },
              });
            } catch (error) {
              console.error('❌ Error al guardar ubicación:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Error al enviar ubicación',
              }));
            }
            break;

          case 'emergency':
            // BOTÓN DE PÁNICO - Enviar alerta de emergencia a grupos específicos
            if (!ws.usuarioId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Usuario no autenticado',
              }));
              return;
            }

            try {
              const usuario = await storage.getUser(ws.usuarioId);
              const nombreUsuario = `${usuario?.firstName || ''} ${usuario?.lastName || ''}`.trim() || usuario?.email || 'Usuario';
              
              // Crear registro de emergencia en BD
              const emergenciaData: InsertEmergencia = {
                usuarioId: ws.usuarioId,
                tipo: data.tipoEmergencia || 'general',
                descripcion: data.contenido || 'Alerta de emergencia activada',
                latitud: data.latitud ?? 0,
                longitud: data.longitud ?? 0,
                estado: 'activa',
              };

              const emergencia = await storage.createEmergencia(emergenciaData);
              console.log('🚨 Emergencia creada:', emergencia.id, 'tipo:', data.tipoEmergencia);

              // Obtener grupos de emergencia para notificar
              const gruposEmergencia = await storage.getGruposEmergencia();
              
              // Filtrar por tipo de emergencia si se especificaron grupos destino
              const gruposDestino = data.gruposDestino?.length 
                ? gruposEmergencia.filter(g => data.gruposDestino?.includes(g.id))
                : gruposEmergencia;

              // Broadcast a todos los grupos de emergencia
              for (const grupo of gruposDestino) {
                broadcastToGroup(wss, grupo.id, {
                  type: 'emergency_alert',
                  emergencia: {
                    ...emergencia,
                    nombreUsuario,
                    fotoUsuario: usuario?.profileImageUrl,
                    telefonoUsuario: usuario?.telefono,
                  },
                });
              }

              // Confirmar al usuario que envió el pánico
              ws.send(JSON.stringify({
                type: 'emergency_confirmed',
                emergencia,
                gruposNotificados: gruposDestino.length,
                mensaje: `Alerta enviada a ${gruposDestino.length} grupos de emergencia`,
              }));

              console.log(`🚨 Emergencia broadcast a ${gruposDestino.length} grupos`);
            } catch (error) {
              console.error('❌ Error al crear emergencia:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Error al enviar alerta de emergencia',
              }));
            }
            break;

          case 'leave':
            // Usuario abandona el grupo actual
            if (ws.grupoId && ws.usuarioId) {
              broadcastToGroup(wss, ws.grupoId, {
                type: 'user_left',
                usuarioId: ws.usuarioId,
                grupoId: ws.grupoId,
              });
              console.log(`👋 Usuario ${ws.usuarioId} abandonó el grupo ${ws.grupoId}`);
              ws.grupoId = undefined;
            }
            break;

          case 'typing':
            // Indicador de "escribiendo..."
            // Usar ws.grupoId y ws.usuarioId (NO del cliente)
            if (ws.grupoId && ws.usuarioId) {
              broadcastToGroup(wss, ws.grupoId, {
                type: 'user_typing',
                usuarioId: ws.usuarioId,
                grupoId: ws.grupoId,
              }, ws);
            }
            break;

          case 'ping':
            // Responder pong para mantener conexión
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.warn('⚠️ Tipo de mensaje desconocido:', data.type);
        }
      } catch (error) {
        console.error('❌ Error al procesar mensaje WebSocket:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error al procesar mensaje',
        }));
      }
    });

    ws.on('close', () => {
      console.log('👋 Cliente WebSocket desconectado');
      
      // Notificar a otros miembros si estaba en un grupo
      if (ws.grupoId && ws.usuarioId) {
        broadcastToGroup(wss, ws.grupoId, {
          type: 'user_left',
          usuarioId: ws.usuarioId,
          grupoId: ws.grupoId,
        });
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Error en WebSocket:', error);
    });
  });

  console.log('🚀 Servidor WebSocket configurado en /ws');
  setGlobalWss(wss);
  return wss;
}

/**
 * Envía un mensaje a todos los clientes de un grupo específico
 */
function broadcastToGroup(
  wss: WebSocketServer,
  grupoId: string,
  message: any,
  exclude?: ExtendedWebSocket
) {
  const messageStr = JSON.stringify(message);
  let sent = 0;

  wss.clients.forEach((client: ExtendedWebSocket) => {
    if (
      client !== exclude &&
      client.readyState === WebSocket.OPEN &&
      client.grupoId === grupoId
    ) {
      client.send(messageStr);
      sent++;
    }
  });

  console.log(`📢 Broadcast a ${sent} clientes en grupo ${grupoId}`);
}

// Map global para almacenar el WSS y poder usarlo desde otros módulos
let globalWss: WebSocketServer | null = null;

export function getGlobalWss(): WebSocketServer | null {
  return globalWss;
}

export function setGlobalWss(wss: WebSocketServer) {
  globalWss = wss;
}

/**
 * Envía una notificación a todos los super admins conectados
 */
export async function notificarSuperAdmins(notificacion: {
  tipo: 'recarga' | 'retiro' | 'favorito' | 'like' | 'comentario' | 'emergencia' | 'nuevo_usuario';
  titulo: string;
  mensaje: string;
  usuarioId?: string;
  usuarioNombre?: string;
  monto?: number;
  metadata?: any;
}) {
  const wss = globalWss;
  if (!wss) {
    console.log('⚠️ WebSocket no inicializado para notificaciones');
    return;
  }

  try {
    // Obtener IDs de super admins
    const superAdmins = await storage.getUsersByRole('super_admin');
    const adminIds = new Set(superAdmins.map(u => u.id));

    const messageStr = JSON.stringify({
      type: 'admin_notification',
      ...notificacion,
      timestamp: new Date().toISOString(),
    });

    let sent = 0;
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.usuarioId &&
        adminIds.has(client.usuarioId)
      ) {
        client.send(messageStr);
        sent++;
      }
    });

    console.log(`🔔 Notificación enviada a ${sent} super admins: ${notificacion.tipo}`);
  } catch (error) {
    console.error('❌ Error enviando notificación a admins:', error);
  }
}

/**
 * Envía una notificación a un usuario específico
 */
export function notificarUsuario(usuarioId: string, notificacion: {
  tipo: 'pago_delegado' | 'pedido_aceptado' | 'pedido_listo' | 'pedido_en_camino' | 'general';
  titulo: string;
  mensaje: string;
  pedidoId?: string;
  monto?: string;
  solicitanteNombre?: string;
  nombreLocal?: string;
  metadata?: any;
}) {
  const wss = globalWss;
  if (!wss) {
    console.log('⚠️ WebSocket no inicializado para notificaciones');
    return false;
  }

  try {
    const messageStr = JSON.stringify({
      type: 'user_notification',
      ...notificacion,
      timestamp: new Date().toISOString(),
    });

    let sent = 0;
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.usuarioId === usuarioId
      ) {
        client.send(messageStr);
        sent++;
      }
    });

    console.log(`🔔 Notificación enviada a usuario ${usuarioId}: ${notificacion.tipo} (${sent} conexiones)`);
    return sent > 0;
  } catch (error) {
    console.error('❌ Error enviando notificación a usuario:', error);
    return false;
  }
}
