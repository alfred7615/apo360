import { useState, useRef, useEffect } from "react";
import { AlertTriangle, Shield, Phone, Truck, Ambulance, Flame, MapPin, Send, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const TIPOS_EMERGENCIA = [
  { tipo: "policia", icono: Shield, label: "Policía", color: "bg-blue-600", descripcion: "Robos, asaltos, delitos" },
  { tipo: "bomberos", icono: Flame, label: "Bomberos", color: "bg-orange-600", descripcion: "Incendios, rescates" },
  { tipo: "samu", icono: Ambulance, label: "SAMU", color: "bg-red-600", descripcion: "Emergencias médicas" },
  { tipo: "serenazgo", icono: Shield, label: "Serenazgo", color: "bg-purple-600", descripcion: "Seguridad municipal" },
  { tipo: "105", icono: Phone, label: "Línea 105", color: "bg-green-600", descripcion: "Emergencia nacional" },
  { tipo: "grua", icono: Truck, label: "Grúa", color: "bg-yellow-600", descripcion: "Asistencia vehicular" },
];

interface GrupoEmergencia {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  esEmergencia: boolean;
}

export default function BotonPanico() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [gruposSeleccionados, setGruposSeleccionados] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [expandido, setExpandido] = useState(false);
  
  // Estado para arrastre
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const botonRef = useRef<HTMLDivElement>(null);

  const { data: gruposEmergencia = [] } = useQuery<GrupoEmergencia[]>({
    queryKey: ["/api/chat/grupos-emergencia"],
    enabled: modalAbierto,
  });

  // Cargar posición guardada
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

  // Guardar posición
  useEffect(() => {
    if (posicion.x !== 0 || posicion.y !== 0) {
      localStorage.setItem('panicButtonPosition', JSON.stringify(posicion));
    }
  }, [posicion]);

  const obtenerUbicacion = () => {
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
        toast({
          title: "Ubicación obtenida",
          description: "Se adjuntará tu ubicación GPS a la alerta",
        });
      },
      (error) => {
        setObteniendoUbicacion(false);
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación. Intenta nuevamente.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const emergenciaMutation = useMutation({
    mutationFn: async (datos: any) => {
      return await apiRequest("POST", "/api/emergencias", datos);
    },
    onSuccess: () => {
      toast({
        title: "Alerta Enviada",
        description: "Tu solicitud de auxilio ha sido enviada a las autoridades y grupos comunitarios.",
        className: "bg-success text-success-foreground",
      });
      cerrarModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar alerta",
        description: error.message || "No se pudo enviar la alerta de emergencia. Intenta nuevamente.",
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
    setTipoSeleccionado("");
    setGruposSeleccionados([]);
    setDescripcion("");
    setExpandido(false);
  };

  const toggleGrupo = (grupoId: string) => {
    setGruposSeleccionados(prev => 
      prev.includes(grupoId)
        ? prev.filter(id => id !== grupoId)
        : [...prev, grupoId]
    );
  };

  const confirmarEmergencia = () => {
    if (!tipoSeleccionado) {
      toast({
        title: "Selecciona tipo de emergencia",
        description: "Por favor selecciona el tipo de auxilio que necesitas.",
        variant: "destructive",
      });
      return;
    }

    const datosEmergencia = {
      tipo: tipoSeleccionado,
      descripcion: descripcion || `Solicitud de emergencia: ${tipoSeleccionado}`,
      latitud: ubicacion?.lat || 0,
      longitud: ubicacion?.lng || 0,
      prioridad: "urgente",
      gruposDestino: gruposSeleccionados.length > 0 ? gruposSeleccionados : undefined,
    };

    emergenciaMutation.mutate(datosEmergencia);
  };

  // Handlers de arrastre - Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!botonRef.current) return;
    e.preventDefault();
    setArrastrando(true);
    const rect = botonRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left - posicion.x,
      y: e.clientY - rect.top - posicion.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!arrastrando) return;
    
    const newX = e.clientX - offset.x - (window.innerWidth - 80);
    const newY = e.clientY - offset.y - (window.innerHeight - 120);
    
    // Limitar dentro de la pantalla
    const maxX = 0;
    const minX = -(window.innerWidth - 100);
    const maxY = 0;
    const minY = -(window.innerHeight - 150);
    
    setPosicion({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    });
  };

  const handleMouseUp = () => {
    setArrastrando(false);
  };

  // Handlers de arrastre - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!botonRef.current) return;
    const touch = e.touches[0];
    setArrastrando(true);
    const rect = botonRef.current.getBoundingClientRect();
    setOffset({
      x: touch.clientX - rect.left - posicion.x,
      y: touch.clientY - rect.top - posicion.y,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!arrastrando) return;
    const touch = e.touches[0];
    
    const newX = touch.clientX - offset.x - (window.innerWidth - 80);
    const newY = touch.clientY - offset.y - (window.innerHeight - 120);
    
    const maxX = 0;
    const minX = -(window.innerWidth - 100);
    const maxY = 0;
    const minY = -(window.innerHeight - 150);
    
    setPosicion({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    });
  };

  const handleTouchEnd = () => {
    setArrastrando(false);
  };

  // Agregar/remover event listeners globales
  useEffect(() => {
    if (arrastrando) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [arrastrando, offset]);

  if (!user) return null;

  return (
    <>
      <div 
        ref={botonRef}
        className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2"
        style={{
          transform: `translate(${posicion.x}px, ${posicion.y}px)`,
          transition: arrastrando ? 'none' : 'transform 0.1s ease-out',
        }}
        data-testid="panic-button-container"
      >
        {/* Botones de acceso rápido expandibles */}
        {expandido && (
          <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {TIPOS_EMERGENCIA.slice(0, 4).map((tipo) => (
              <button
                key={tipo.tipo}
                className={`${tipo.color} text-white shadow-lg h-12 w-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform`}
                onClick={() => {
                  setTipoSeleccionado(tipo.tipo);
                  abrirModal();
                  setExpandido(false);
                }}
                data-testid={`panic-quick-${tipo.tipo}`}
              >
                <tipo.icono className="h-6 w-6" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Botón expandir */}
          <button
            onClick={() => setExpandido(!expandido)}
            className="bg-gray-700 text-white p-2 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
            data-testid="panic-expand-toggle"
          >
            <ChevronUp className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`} />
          </button>

          {/* Botón principal de pánico */}
          <button
            onClick={abrirModal}
            className="relative"
            data-testid="button-panic"
            aria-label="Botón de pánico - Solicitar ayuda de emergencia"
          >
            <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75" />
            <div className="relative bg-gradient-to-br from-red-500 to-red-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center h-16 w-16 hover:scale-105 active:scale-95 transition-transform">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </button>

          {/* Handle de arrastre */}
          <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`cursor-grab active:cursor-grabbing bg-gray-700/80 text-white p-2 rounded-full touch-none select-none ${arrastrando ? 'bg-gray-500' : ''}`}
            data-testid="panic-drag-handle"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Modal de emergencia */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-panic-confirmation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <span data-testid="text-panic-title">Solicitar Auxilio</span>
            </DialogTitle>
            <DialogDescription data-testid="text-panic-description">
              Selecciona el tipo de emergencia que necesitas. Tu ubicación y alerta serán enviadas inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/30">
              <p className="text-sm text-destructive font-medium" data-testid="text-panic-warning">
                ADVERTENCIA: Usar el botón de pánico sin una emergencia real está penalizado.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TIPOS_EMERGENCIA.map((emergencia) => {
                const Icono = emergencia.icono;
                const estaSeleccionado = tipoSeleccionado === emergencia.tipo;
                
                return (
                  <button
                    key={emergencia.tipo}
                    onClick={() => setTipoSeleccionado(emergencia.tipo)}
                    className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-all border-2 ${
                      estaSeleccionado
                        ? `${emergencia.color} text-white border-transparent shadow-lg scale-105`
                        : 'bg-card border-border hover-elevate active-elevate-2'
                    }`}
                    data-testid={`button-emergency-${emergencia.tipo}`}
                  >
                    <Icono className="h-8 w-8" />
                    <span className="text-sm font-semibold">{emergencia.label}</span>
                    <span className={`text-xs ${estaSeleccionado ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {emergencia.descripcion}
                    </span>
                  </button>
                );
              })}
            </div>

            {gruposEmergencia.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Grupos a Notificar (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {gruposEmergencia.map((grupo) => (
                    <Badge
                      key={grupo.id}
                      variant={gruposSeleccionados.includes(grupo.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleGrupo(grupo.id)}
                      data-testid={`panic-group-${grupo.id}`}
                    >
                      {grupo.nombre}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Si no seleccionas ninguno, se notificará a todos los grupos de emergencia
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="descripcion-emergencia" className="text-sm font-medium">
                Descripción adicional (opcional):
              </label>
              <Textarea
                id="descripcion-emergencia"
                placeholder="Ej: Accidente de tránsito en la Av. Cultura cerca al parque central"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                data-testid="input-emergency-description"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${ubicacion ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium" data-testid="text-location-status">
                    {obteniendoUbicacion ? 'Obteniendo ubicación...' : ubicacion ? 'Ubicación obtenida' : 'Sin ubicación'}
                  </p>
                  {ubicacion && (
                    <p className="text-xs text-muted-foreground">
                      {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={obtenerUbicacion}
                disabled={obteniendoUbicacion}
                data-testid="button-refresh-location"
              >
                {obteniendoUbicacion ? 'Obteniendo...' : 'Actualizar'}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={cerrarModal}
                className="flex-1"
                data-testid="button-cancel-emergency"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarEmergencia}
                disabled={!tipoSeleccionado || emergenciaMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-emergency"
              >
                {emergenciaMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    ENVIAR ALERTA
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
