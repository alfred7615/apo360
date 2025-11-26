import { useState, useRef, useEffect, useCallback } from "react";
import { AlertTriangle, Shield, Phone, Truck, Ambulance, Flame, MapPin, Send, Users, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const TIPOS_EMERGENCIA = [
  { tipo: "policia", icono: Shield, color: "bg-blue-600", hoverColor: "hover:bg-blue-700" },
  { tipo: "bomberos", icono: Flame, color: "bg-orange-600", hoverColor: "hover:bg-orange-700" },
  { tipo: "samu", icono: Ambulance, color: "bg-red-600", hoverColor: "hover:bg-red-700" },
  { tipo: "serenazgo", icono: Shield, color: "bg-purple-600", hoverColor: "hover:bg-purple-700" },
  { tipo: "105", icono: Phone, color: "bg-green-600", hoverColor: "hover:bg-green-700" },
  { tipo: "grua", icono: Truck, color: "bg-yellow-600", hoverColor: "hover:bg-yellow-700" },
  { tipo: "familia", icono: Users, color: "bg-pink-600", hoverColor: "hover:bg-pink-700" },
  { tipo: "grupo_chat", icono: MessageCircle, color: "bg-cyan-600", hoverColor: "hover:bg-cyan-700" },
];

interface GrupoEmergencia {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  esEmergencia: boolean;
}

interface ContactoFamiliar {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  notificarEmergencias: boolean;
}

const HOLD_THRESHOLD_MS = 250;
const DRAG_THRESHOLD_PX = 10;

export default function BotonPanico() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const botonRef = useRef<HTMLDivElement>(null);
  
  const touchStartTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { data: gruposEmergencia = [] } = useQuery<GrupoEmergencia[]>({
    queryKey: ["/api/chat/grupos-emergencia"],
    enabled: modalAbierto,
  });

  const { data: contactosFamiliares = [] } = useQuery<ContactoFamiliar[]>({
    queryKey: ["/api/contactos-familiares"],
    enabled: modalAbierto,
  });

  useEffect(() => {
    const posicionGuardada = localStorage.getItem('panicButtonPosition');
    if (posicionGuardada) {
      try {
        const pos = JSON.parse(posicionGuardada);
        setPosicion(pos);
      } catch (e) {
        console.error('Error al cargar posición guardada');
      }
    }
  }, []);

  useEffect(() => {
    if (posicion.x !== 0 || posicion.y !== 0) {
      localStorage.setItem('panicButtonPosition', JSON.stringify(posicion));
    }
  }, [posicion]);

  const obtenerUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setObteniendoUbicacion(false);
      },
      () => {
        setObteniendoUbicacion(false);
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [toast]);

  const emergenciaMutation = useMutation({
    mutationFn: async (datos: any) => {
      return await apiRequest("POST", "/api/emergencias", datos);
    },
    onSuccess: () => {
      toast({
        title: "Alerta Enviada",
        description: "Tu solicitud de auxilio ha sido enviada.",
        className: "bg-green-600 text-white",
      });
      cerrarModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar alerta",
        description: error.message || "No se pudo enviar la alerta.",
        variant: "destructive",
      });
    },
  });

  const abrirModal = () => {
    setModalAbierto(true);
    obtenerUbicacion();
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTiposSeleccionados([]);
    setDescripcion("");
  };

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados(prev => 
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const confirmarEmergencia = () => {
    if (tiposSeleccionados.length === 0) {
      toast({
        title: "Selecciona un destino",
        description: "Por favor selecciona al menos un servicio o destino.",
        variant: "destructive",
      });
      return;
    }

    const enviaFamilia = tiposSeleccionados.includes("familia");
    const enviaGrupoChat = tiposSeleccionados.includes("grupo_chat");
    const serviciosSeleccionados = tiposSeleccionados.filter(t => t !== "familia" && t !== "grupo_chat");

    const datosEmergencia = {
      tipo: serviciosSeleccionados[0] || "emergencia",
      descripcion: descripcion || "Solicitud de auxilio",
      latitud: ubicacion?.lat || 0,
      longitud: ubicacion?.lng || 0,
      prioridad: "urgente",
      serviciosDestino: serviciosSeleccionados,
      notificarFamilia: enviaFamilia,
      notificarGrupoChat: enviaGrupoChat,
      gruposDestino: enviaGrupoChat ? gruposEmergencia.map(g => g.id) : [],
      contactosFamiliares: enviaFamilia ? contactosFamiliares.filter(c => c.notificarEmergencias).map(c => c.id) : [],
    };

    emergenciaMutation.mutate(datosEmergencia);
  };

  const calcularNuevaPosicion = (clientX: number, clientY: number) => {
    const newX = clientX - offsetRef.current.x - (window.innerWidth - 80);
    const newY = clientY - offsetRef.current.y - (window.innerHeight - 120);
    
    const maxX = 0;
    const minX = -(window.innerWidth - 100);
    const maxY = 0;
    const minY = -(window.innerHeight - 150);
    
    return {
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!botonRef.current) return;
    
    touchStartTimeRef.current = Date.now();
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    
    const rect = botonRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left - posicion.x,
      y: e.clientY - rect.top - posicion.y,
    };
    
    holdTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setArrastrando(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, HOLD_THRESHOLD_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.clientY - touchStartPosRef.current.y);
    
    if (!isDraggingRef.current && (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX)) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      isDraggingRef.current = true;
      setArrastrando(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
    
    if (isDraggingRef.current) {
      e.preventDefault();
      setPosicion(calcularNuevaPosicion(e.clientX, e.clientY));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    setArrastrando(false);
    
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    
    if (!wasDragging) {
      const touchDuration = Date.now() - touchStartTimeRef.current;
      const dx = Math.abs(e.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.clientY - touchStartPosRef.current.y);
      
      if (touchDuration < HOLD_THRESHOLD_MS && dx < DRAG_THRESHOLD_PX && dy < DRAG_THRESHOLD_PX) {
        abrirModal();
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isDraggingRef.current = false;
    setArrastrando(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  if (!user) return null;

  const tieneContactosFamiliares = contactosFamiliares.filter(c => c.notificarEmergencias).length > 0;
  const tieneGruposEmergencia = gruposEmergencia.length > 0;

  return (
    <>
      <div 
        ref={botonRef}
        className="fixed bottom-20 right-4 z-50"
        style={{
          transform: `translate(${posicion.x}px, ${posicion.y}px)`,
          transition: arrastrando ? 'none' : 'transform 0.1s ease-out',
          touchAction: 'none',
        }}
        data-testid="panic-button-container"
      >
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative touch-none select-none ${arrastrando ? 'cursor-grabbing' : 'cursor-pointer'}`}
          data-testid="button-panic"
          aria-label="Botón de pánico - Mantén presionado para mover, toca para abrir"
        >
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75" />
          <div className={`relative bg-gradient-to-br from-red-500 to-red-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center h-16 w-16 transition-transform ${arrastrando ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}>
            <AlertTriangle className="h-8 w-8" />
          </div>
        </button>
      </div>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-xs sm:max-w-sm p-4" data-testid="dialog-panic-confirmation">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span data-testid="text-panic-title">Solicitar Auxilio</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-2 border border-destructive/30">
              <p className="text-xs text-destructive font-medium text-center" data-testid="text-panic-warning">
                Uso indebido está penalizado
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {TIPOS_EMERGENCIA.map((emergencia) => {
                const Icono = emergencia.icono;
                const estaSeleccionado = tiposSeleccionados.includes(emergencia.tipo);
                
                const deshabilitado = 
                  (emergencia.tipo === "familia" && !tieneContactosFamiliares) ||
                  (emergencia.tipo === "grupo_chat" && !tieneGruposEmergencia);
                
                return (
                  <button
                    key={emergencia.tipo}
                    onClick={() => !deshabilitado && toggleTipo(emergencia.tipo)}
                    disabled={deshabilitado}
                    className={`relative flex items-center justify-center rounded-xl p-3 transition-all ${
                      deshabilitado
                        ? 'bg-muted opacity-40 cursor-not-allowed'
                        : estaSeleccionado
                          ? `${emergencia.color} text-white shadow-lg ring-2 ring-white ring-offset-2 ring-offset-background`
                          : `bg-card border border-border ${emergencia.hoverColor} hover:text-white`
                    }`}
                    data-testid={`button-emergency-${emergencia.tipo}`}
                    title={
                      emergencia.tipo === "familia" ? "Notificar a familia" :
                      emergencia.tipo === "grupo_chat" ? "Notificar a grupos de chat" :
                      emergencia.tipo
                    }
                  >
                    <Icono className="h-7 w-7 sm:h-8 sm:w-8" />
                    {estaSeleccionado && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <Textarea
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="text-sm resize-none"
              data-testid="input-emergency-description"
            />

            <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${ubicacion ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className={ubicacion ? 'text-green-600' : 'text-muted-foreground'} data-testid="text-location-status">
                  {obteniendoUbicacion ? 'Obteniendo...' : ubicacion ? 'GPS listo' : 'Sin GPS'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={obtenerUbicacion}
                disabled={obteniendoUbicacion}
                className="h-7 text-xs"
                data-testid="button-refresh-location"
              >
                Actualizar
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={cerrarModal}
                className="flex-1"
                size="sm"
                data-testid="button-cancel-emergency"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarEmergencia}
                disabled={tiposSeleccionados.length === 0 || emergenciaMutation.isPending}
                className="flex-1"
                size="sm"
                data-testid="button-confirm-emergency"
              >
                {emergenciaMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    ENVIAR
                  </>
                )}
              </Button>
            </div>

            {tiposSeleccionados.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {tiposSeleccionados.length} destino{tiposSeleccionados.length > 1 ? 's' : ''} seleccionado{tiposSeleccionados.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
