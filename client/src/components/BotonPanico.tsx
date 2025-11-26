import { useState, useRef, useEffect, useCallback } from "react";
import { AlertTriangle, Shield, Phone, Truck, Ambulance, Flame, MapPin, Send, Users, MessageCircle, Check, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import SelectorUbicacion from "./SelectorUbicacion";

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

const TAP_THRESHOLD_MS = 300;
const DRAG_THRESHOLD_PX = 8;

export default function BotonPanico() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  
  const [posicion, setPosicion] = useState({ x: 20, y: 20 });
  const [arrastrando, setArrastrando] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  
  const isActiveRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const initialButtonPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          const padding = 10;
          const buttonSize = 64;
          const maxX = window.innerWidth - buttonSize - padding;
          const maxY = window.innerHeight - buttonSize - padding;
          setPosicion({
            x: Math.max(padding, Math.min(maxX, pos.x)),
            y: Math.max(padding, Math.min(maxY, pos.y)),
          });
        }
      } catch (e) {
        console.error('Error al cargar posición guardada');
      }
    } else {
      setPosicion({
        x: window.innerWidth - 84,
        y: window.innerHeight - 140,
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('panicButtonPosition', JSON.stringify(posicion));
  }, [posicion]);

  const obtenerUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS no disponible",
        description: "Tu dispositivo no soporta geolocalización. Usa el selector de mapa.",
        variant: "destructive",
      });
      return;
    }

    setObteniendoUbicacion(true);
    
    const opciones: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setObteniendoUbicacion(false);
        toast({
          title: "Ubicación obtenida",
          description: `Precisión: ${Math.round(position.coords.accuracy)} metros`,
        });
      },
      (error) => {
        setObteniendoUbicacion(false);
        let mensaje = "No se pudo obtener tu ubicación. Usa el selector de mapa.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = "Permiso de GPS denegado. Actívalo en configuración o usa el mapa.";
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje = "GPS no disponible. Verifica que esté activado o usa el mapa.";
            break;
          case error.TIMEOUT:
            mensaje = "Tiempo agotado. Intenta en mejor señal o usa el selector de mapa.";
            break;
        }
        toast({
          title: "Error de GPS",
          description: mensaje,
          variant: "destructive",
        });
      },
      opciones
    );
  }, [toast]);

  const seleccionarUbicacionManual = useCallback((nuevaUbicacion: { lat: number; lng: number }) => {
    setUbicacion(nuevaUbicacion);
  }, []);

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

  const calcularPosicion = useCallback((clientX: number, clientY: number) => {
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;
    
    const newX = initialButtonPosRef.current.x + deltaX;
    const newY = initialButtonPosRef.current.y + deltaY;
    
    const padding = 10;
    const buttonSize = 64;
    const maxX = window.innerWidth - buttonSize - padding;
    const maxY = window.innerHeight - buttonSize - padding;
    
    return {
      x: Math.max(padding, Math.min(maxX, newX)),
      y: Math.max(padding, Math.min(maxY, newY)),
    };
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number, target: HTMLElement, pointerId?: number) => {
    isActiveRef.current = true;
    startTimeRef.current = Date.now();
    startPosRef.current = { x: clientX, y: clientY };
    hasDraggedRef.current = false;
    initialButtonPosRef.current = { ...posicion };
    
    if (pointerId !== undefined) {
      try {
        target.setPointerCapture(pointerId);
      } catch {}
    }
  }, [posicion]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isActiveRef.current) return;
    
    const dx = Math.abs(clientX - startPosRef.current.x);
    const dy = Math.abs(clientY - startPosRef.current.y);
    
    if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
      hasDraggedRef.current = true;
      setArrastrando(true);
      setPosicion(calcularPosicion(clientX, clientY));
    }
  }, [calcularPosicion]);

  const handleEnd = useCallback((target: HTMLElement, pointerId?: number) => {
    if (!isActiveRef.current) return;
    
    isActiveRef.current = false;
    const wasDragging = hasDraggedRef.current;
    const duration = Date.now() - startTimeRef.current;
    
    setArrastrando(false);
    
    if (pointerId !== undefined) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {}
    }
    
    if (!wasDragging && duration < TAP_THRESHOLD_MS) {
      abrirModal();
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY, e.currentTarget as HTMLElement, e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    handleEnd(e.currentTarget as HTMLElement, e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    isActiveRef.current = false;
    hasDraggedRef.current = false;
    setArrastrando(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  if (!user) return null;

  const tieneContactosFamiliares = contactosFamiliares.filter(c => c.notificarEmergencias).length > 0;
  const tieneGruposEmergencia = gruposEmergencia.length > 0;

  return (
    <>
      <button
        ref={botonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        className={`fixed z-50 touch-none select-none ${arrastrando ? 'cursor-grabbing' : 'cursor-pointer'}`}
        style={{
          left: `${posicion.x}px`,
          top: `${posicion.y}px`,
          transition: arrastrando ? 'none' : 'left 0.15s ease-out, top 0.15s ease-out',
        }}
        data-testid="button-panic"
        aria-label="Botón de pánico - Arrastra para mover, toca rápido para abrir"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75" />
          <div className={`relative bg-gradient-to-br from-red-500 to-red-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center h-16 w-16 transition-transform ${arrastrando ? 'scale-110 opacity-90' : 'hover:scale-105 active:scale-95'}`}>
            <AlertTriangle className="h-8 w-8" />
          </div>
        </div>
      </button>

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
                
                const sinDatos = 
                  (emergencia.tipo === "familia" && !tieneContactosFamiliares) ||
                  (emergencia.tipo === "grupo_chat" && !tieneGruposEmergencia);
                
                const handleClick = () => {
                  if (sinDatos) {
                    if (emergencia.tipo === "familia") {
                      toast({
                        title: "Sin contactos familiares",
                        description: "Configura tus contactos de emergencia en tu perfil.",
                        variant: "destructive",
                      });
                    } else if (emergencia.tipo === "grupo_chat") {
                      toast({
                        title: "Sin grupos de emergencia",
                        description: "No hay grupos de chat configurados para emergencias.",
                        variant: "destructive",
                      });
                    }
                    return;
                  }
                  toggleTipo(emergencia.tipo);
                };
                
                return (
                  <button
                    key={emergencia.tipo}
                    onClick={handleClick}
                    className={`relative flex items-center justify-center rounded-xl p-3 transition-all ${
                      sinDatos
                        ? 'bg-muted opacity-50 cursor-pointer'
                        : estaSeleccionado
                          ? `${emergencia.color} text-white shadow-lg ring-2 ring-white ring-offset-2 ring-offset-background`
                          : `bg-card border border-border ${emergencia.hoverColor} hover:text-white`
                    }`}
                    data-testid={`button-emergency-${emergencia.tipo}`}
                    title={
                      emergencia.tipo === "familia" 
                        ? (tieneContactosFamiliares ? "Notificar a familia" : "Configurar contactos familiares")
                        : emergencia.tipo === "grupo_chat" 
                          ? (tieneGruposEmergencia ? "Notificar a grupos de chat" : "Sin grupos disponibles")
                          : emergencia.tipo
                    }
                  >
                    <Icono className="h-7 w-7 sm:h-8 sm:w-8" />
                    {estaSeleccionado && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                    {sinDatos && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-md">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {(!tieneContactosFamiliares || !tieneGruposEmergencia) && (
              <div className="text-xs p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-300">
                  {!tieneContactosFamiliares && !tieneGruposEmergencia 
                    ? "Configura contactos familiares en tu perfil para habilitar alertas a familia."
                    : !tieneContactosFamiliares 
                      ? "Configura contactos familiares en tu perfil para habilitar alertas a familia."
                      : "No hay grupos de emergencia disponibles."}
                </p>
                {!tieneContactosFamiliares && (
                  <button
                    className="text-xs text-yellow-700 dark:text-yellow-300 underline hover:text-yellow-800 dark:hover:text-yellow-200"
                    onClick={() => {
                      cerrarModal();
                      setLocation("/perfil");
                    }}
                  >
                    Ir a mi perfil
                  </button>
                )}
              </div>
            )}

            <Textarea
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="text-sm resize-none"
              data-testid="input-emergency-description"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className={`h-4 w-4 ${ubicacion ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className={ubicacion ? 'text-green-600' : 'text-muted-foreground'} data-testid="text-location-status">
                    {obteniendoUbicacion ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Obteniendo GPS...
                      </span>
                    ) : ubicacion ? (
                      <span className="text-xs">
                        {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
                      </span>
                    ) : (
                      'Sin ubicación'
                    )}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={obtenerUbicacion}
                  disabled={obteniendoUbicacion}
                  className="h-7 text-xs gap-1"
                  data-testid="button-refresh-location"
                >
                  <Navigation className="h-3 w-3" />
                  GPS
                </Button>
              </div>
              
              <div className="flex justify-center">
                <SelectorUbicacion
                  ubicacionActual={ubicacion}
                  onSeleccionarUbicacion={seleccionarUbicacionManual}
                  obteniendoGPS={obteniendoUbicacion}
                />
              </div>
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
