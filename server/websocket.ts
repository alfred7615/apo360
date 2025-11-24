import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import type { InsertMensaje } from '@shared/schema';
import type { IncomingMessage } from 'http';
import { getSession } from './replitAuth';
import passport from 'passport';

interface ExtendedWebSocket extends WebSocket {
  usuarioId?: string;
  grupoId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'join' | 'message' | 'typing' | 'ping';
  grupoId?: string;
  usuarioId?: string;
  contenido?: string;
  archivoUrl?: string;
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
            // Enviar mensaje y persistir en BD
            if (!data.contenido) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'contenido es requerido',
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

            // SEGURIDAD: Usar ws.usuarioId de la sesión (NO del cliente)
            {

              try {
                // Persistir mensaje en base de datos usando usuarioId de la sesión
                const mensajeData: InsertMensaje = {
                  grupoId: ws.grupoId,
                  remitenteId: ws.usuarioId, // Usar ws.usuarioId de la sesión autenticada
                  contenido: data.contenido,
                  archivoUrl: data.archivoUrl,
                };

                const mensaje = await storage.createMensaje(mensajeData);
                console.log('💾 Mensaje guardado en BD:', mensaje.id);

                // Broadcast mensaje (ya tiene remitenteId correcto)
                broadcastToGroup(wss, ws.grupoId, {
                  type: 'new_message',
                  mensaje: mensaje,
                });
              } catch (error) {
                console.error('❌ Error al guardar mensaje:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Error al enviar mensaje',
                }));
              }
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
