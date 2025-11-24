import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Mensaje } from '@shared/schema';

interface WebSocketMessage {
  type: 'new_message' | 'user_joined' | 'user_left' | 'user_typing' | 'error' | 'pong';
  mensaje?: Mensaje;
  usuarioId?: string;
  grupoId?: string;
  message?: string;
}

interface UseWebSocketOptions {
  grupoId: string;
  onMessage?: (mensaje: Mensaje) => void;
  onUserTyping?: (usuarioId: string) => void;
  onError?: (error: string) => void;
}

export function useWebSocket({ grupoId, onMessage, onUserTyping, onError }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    // No conectar si no hay grupoId
    if (!grupoId) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('🔌 Conectando a WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);

      // Unirse al grupo (usuarioId viene de la sesión del servidor)
      ws.send(JSON.stringify({
        type: 'join',
        grupoId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 Mensaje WebSocket:', data);

        switch (data.type) {
          case 'new_message':
            if (data.mensaje) {
              // Invalidar cache de mensajes para actualizar UI (usar queryKey correcto)
              queryClient.invalidateQueries({ queryKey: ['/api/chat/mensajes', grupoId] });
              onMessage?.(data.mensaje);
            }
            break;

          case 'user_typing':
            if (data.usuarioId) {
              onUserTyping?.(data.usuarioId);
            }
            break;

          case 'user_joined':
            console.log('👤 Usuario se unió:', data.usuarioId);
            break;

          case 'user_left':
            console.log('👋 Usuario salió:', data.usuarioId);
            break;

          case 'error':
            console.error('❌ Error del servidor:', data.message);
            onError?.(data.message || 'Error desconocido');
            break;
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setIsConnected(false);

      // Intentar reconectar después de 3 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Intentando reconectar...');
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [grupoId, queryClient, onMessage, onUserTyping, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((contenido: string, archivoUrl?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket no está conectado');
      return false;
    }

    // No enviamos grupoId ni usuarioId - el servidor ya los tiene
    wsRef.current.send(JSON.stringify({
      type: 'message',
      contenido,
      archivoUrl,
    }));

    return true;
  }, []);

  const sendTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Servidor usa ws.grupoId y ws.usuarioId
    wsRef.current.send(JSON.stringify({
      type: 'typing',
    }));
  }, []);

  useEffect(() => {
    if (grupoId) {
      connect();
    }
    return () => disconnect();
  }, [grupoId, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    sendTyping,
    reconnect: connect,
  };
}
