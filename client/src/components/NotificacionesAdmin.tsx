import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Heart, 
  Star, 
  MessageCircle, 
  AlertTriangle,
  UserPlus,
  X,
  Volume2
} from "lucide-react";

interface NotificacionAdmin {
  tipo: 'recarga' | 'retiro' | 'favorito' | 'like' | 'comentario' | 'emergencia' | 'nuevo_usuario';
  titulo: string;
  mensaje: string;
  usuarioId?: string;
  usuarioNombre?: string;
  monto?: number;
  timestamp: string;
}

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState<NotificacionAdmin[]>([]);
  const [notificacionActual, setNotificacionActual] = useState<NotificacionAdmin | null>(null);
  const [visible, setVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const esSuperAdmin = user?.rol === 'super_admin';

  const reproducirSonido = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      const frequencies = [523.25, 659.25, 783.99, 1046.50];
      const now = ctx.currentTime;
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0.3, now + i * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
        
        oscillator.start(now + i * 0.08);
        oscillator.stop(now + i * 0.08 + 0.35);
      });
    } catch (error) {
      console.log("Error al reproducir sonido:", error);
    }
  }, []);

  const mostrarNotificacion = useCallback((notif: NotificacionAdmin) => {
    setNotificaciones(prev => [notif, ...prev].slice(0, 50));
    setNotificacionActual(notif);
    setVisible(true);
    reproducirSonido();

    setTimeout(() => {
      setVisible(false);
    }, 8000);
  }, [reproducirSonido]);

  useEffect(() => {
    if (!esSuperAdmin) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const conectarWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("🔔 WebSocket de notificaciones conectado");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'admin_notification') {
              mostrarNotificacion(data);
            }
          } catch (error) {
            console.error("Error procesando mensaje WS:", error);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket cerrado, reconectando en 5s...");
          setTimeout(conectarWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error("Error en WebSocket:", error);
        };
      } catch (error) {
        console.error("Error conectando WebSocket:", error);
        setTimeout(conectarWebSocket, 5000);
      }
    };

    conectarWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [esSuperAdmin, mostrarNotificacion]);

  const getIcono = (tipo: NotificacionAdmin['tipo']) => {
    switch (tipo) {
      case 'recarga':
      case 'retiro':
        return <DollarSign className="h-8 w-8 text-green-500" />;
      case 'favorito':
        return <Star className="h-8 w-8 text-yellow-500" />;
      case 'like':
        return <Heart className="h-8 w-8 text-red-500" />;
      case 'comentario':
        return <MessageCircle className="h-8 w-8 text-blue-500" />;
      case 'emergencia':
        return <AlertTriangle className="h-8 w-8 text-red-600 animate-pulse" />;
      case 'nuevo_usuario':
        return <UserPlus className="h-8 w-8 text-purple-500" />;
      default:
        return <Volume2 className="h-8 w-8 text-gray-500" />;
    }
  };

  const getColorFondo = (tipo: NotificacionAdmin['tipo']) => {
    switch (tipo) {
      case 'recarga':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'retiro':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'favorito':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'like':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'comentario':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'emergencia':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
      case 'nuevo_usuario':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (!esSuperAdmin) return null;

  return (
    <>
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent 
          className={`max-w-sm p-0 border-2 ${notificacionActual ? getColorFondo(notificacionActual.tipo) : ''}`}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Notificación</DialogTitle>
          {notificacionActual && (
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                  {getIcono(notificacionActual.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground">
                    {notificacionActual.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notificacionActual.mensaje}
                  </p>
                  {notificacionActual.monto && (
                    <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                      S/. {notificacionActual.monto.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notificacionActual.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setVisible(false)}
                  className="shrink-0"
                  data-testid="button-cerrar-notificacion"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
