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
  
  // Usar refs para los callbacks para evitar reconexiones cuando cambian
  const onMessageRef = useRef(onMessage);
  const onUserTypingRef = useRef(onUserTyping);
  const onErrorRef = useRef(onError);
  const grupoIdRef = useRef(grupoId);
  
  // Actualizar refs cuando cambien los valores
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    onUserTypingRef.current = onUserTyping;
  }, [onUserTyping]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  useEffect(() => {
    grupoIdRef.current = grupoId;
  }, [grupoId]);

  const connect = useCallback(() => {
    // No conectar si no hay grupoId
    if (!grupoIdRef.current) {
      return;
    }

    // Si ya hay conexión abierta o conectando, no crear otra
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('🔌 Conectando a WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);

      // Unirse al grupo
      ws.send(JSON.stringify({
        type: 'join',
        grupoId: grupoIdRef.current,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 Mensaje WebSocket:', data);

        switch (data.type) {
          case 'new_message':
            if (data.mensaje) {
              // Invalidar cache de mensajes para actualizar UI
              queryClient.invalidateQueries({ queryKey: ['/api/chat/mensajes', grupoIdRef.current] });
              onMessageRef.current?.(data.mensaje);
            }
            break;

          case 'user_typing':
            if (data.usuarioId) {
              onUserTypingRef.current?.(data.usuarioId);
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
            onErrorRef.current?.(data.message || 'Error desconocido');
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
      wsRef.current = null;

      // Intentar reconectar después de 3 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Intentando reconectar...');
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // Evitar reconexión automática
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

    wsRef.current.send(JSON.stringify({
      type: 'typing',
    }));
  }, []);

  // Efecto principal para conectar/desconectar
  useEffect(() => {
    if (grupoId) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [grupoId, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    sendTyping,
    reconnect: connect,
  };
}
