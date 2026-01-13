import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface AlertaEmergencia {
  id: string;
  tipo: 'panico' | 'emergencia';
  emisor: {
    id: string;
    nombre: string;
    telefono?: string;
    foto?: string;
  };
  grupo: {
    id: string;
    nombre: string;
    esOrganizacional: boolean;
  };
  ubicacion?: {
    lat: number;
    lng: number;
  };
  opciones: {
    alertarPolicia: boolean;
    solicitarGrua: boolean;
    tieneImagen: boolean;
  };
  mensaje?: string;
  imagenUrl?: string;
  fechaCreacion: string;
}

interface UseAlertasEmergenciaOptions {
  usuarioId?: string;
  onAlerta?: (alerta: AlertaEmergencia) => void;
}

export function useAlertasEmergencia({ usuarioId, onAlerta }: UseAlertasEmergenciaOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState<AlertaEmergencia[]>([]);
  const queryClient = useQueryClient();
  
  const onAlertaRef = useRef(onAlerta);
  const usuarioIdRef = useRef(usuarioId);
  
  useEffect(() => {
    onAlertaRef.current = onAlerta;
  }, [onAlerta]);
  
  useEffect(() => {
    usuarioIdRef.current = usuarioId;
  }, [usuarioId]);

  const connect = useCallback(() => {
    if (!usuarioIdRef.current) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('🚨 Conectando a canal de alertas:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Canal de alertas conectado');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🚨 Mensaje de alerta:', data);

        switch (data.type) {
          case 'nueva_alerta':
            const alerta = data.alerta as AlertaEmergencia;
            setAlertasActivas(prev => [alerta, ...prev]);
            onAlertaRef.current?.(alerta);
            break;

          case 'alerta_cancelada':
            setAlertasActivas(prev => prev.filter(a => a.id !== data.alertaId));
            break;

          case 'alerta_resuelta':
            setAlertasActivas(prev => prev.filter(a => a.id !== data.alertaId));
            break;

          case 'subscribed':
            console.log('📡 Suscrito a alertas');
            break;

          case 'error':
            console.error('❌ Error en canal de alertas:', data.message);
            break;
        }
      } catch (error) {
        console.error('Error al procesar mensaje de alerta:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Error canal alertas:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 Canal de alertas desconectado');
      setIsConnected(false);
      wsRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Reconectando canal de alertas...');
        connect();
      }, 5000);
    };

    wsRef.current = ws;
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const descartarAlerta = useCallback((alertaId: string) => {
    setAlertasActivas(prev => prev.filter(a => a.id !== alertaId));
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'descartar_alerta',
        alertaId,
      }));
    }
  }, []);

  const confirmarVista = useCallback((alertaId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'confirmar_vista',
        alertaId,
      }));
    }
  }, []);

  useEffect(() => {
    if (usuarioId) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [usuarioId, connect, disconnect]);

  return {
    isConnected,
    alertasActivas,
    descartarAlerta,
    confirmarVista,
    reconnect: connect,
  };
}
