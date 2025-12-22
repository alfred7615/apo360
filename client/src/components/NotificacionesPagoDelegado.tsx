import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  X,
  Volume2,
  Store,
  User
} from "lucide-react";

interface NotificacionPago {
  tipo: 'pago_delegado';
  titulo: string;
  mensaje: string;
  pedidoId: string;
  monto?: string;
  solicitanteNombre?: string;
  nombreLocal?: string;
  timestamp: string;
}

interface NotificacionesPagoDelegadoProps {
  onAbrirFormularioPago: (pedidoId: string) => void;
}

export default function NotificacionesPagoDelegado({ onAbrirFormularioPago }: NotificacionesPagoDelegadoProps) {
  const [notificacion, setNotificacion] = useState<NotificacionPago | null>(null);
  const [visible, setVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const reproducirSonido = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      const frequencies = [659.25, 783.99, 880, 1046.50];
      const now = ctx.currentTime;
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0.35, now + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
        
        oscillator.start(now + i * 0.1);
        oscillator.stop(now + i * 0.1 + 0.45);
      });
    } catch (error) {
      console.log("Error al reproducir sonido:", error);
    }
  }, []);

  const mostrarNotificacion = useCallback((notif: NotificacionPago) => {
    setNotificacion(notif);
    setVisible(true);
    reproducirSonido();
  }, [reproducirSonido]);

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const conectarWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("📲 WebSocket de notificaciones de usuario conectado");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'user_notification' && data.tipo === 'pago_delegado') {
              mostrarNotificacion(data);
            }
          } catch (error) {
            console.error("Error procesando mensaje WS:", error);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket de notificaciones cerrado, reconectando en 5s...");
          setTimeout(conectarWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error("Error en WebSocket de notificaciones:", error);
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
  }, [user?.id, mostrarNotificacion]);

  const handlePagarAhora = () => {
    if (notificacion?.pedidoId) {
      onAbrirFormularioPago(notificacion.pedidoId);
      setVisible(false);
    }
  };

  if (!user?.id) return null;

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent 
        className="sm:max-w-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800"
        data-testid="modal-notificacion-pago-delegado"
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center animate-pulse">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {notificacion?.titulo || "Solicitud de Pago"}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {notificacion?.mensaje}
          </DialogDescription>
        </DialogHeader>
        
        {notificacion && (
          <div className="space-y-4 py-4">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Solicitante</p>
                  <p className="font-medium">{notificacion.solicitanteNombre || "Usuario"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Negocio</p>
                  <p className="font-medium">{notificacion.nombreLocal || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total a pagar:</span>
                <span className="text-2xl font-bold text-orange-600">
                  S/ {notificacion.monto || "0.00"}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="outline"
            onClick={() => setVisible(false)}
            className="flex-1"
            data-testid="button-cerrar-notificacion"
          >
            Más tarde
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            onClick={handlePagarAhora}
            data-testid="button-pagar-ahora-notificacion"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
