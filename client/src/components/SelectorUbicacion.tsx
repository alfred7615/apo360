import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapPin, Navigation, Search, X, Loader2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SelectorUbicacionProps {
  ubicacionActual: { lat: number; lng: number } | null;
  onSeleccionarUbicacion: (ubicacion: { lat: number; lng: number }) => void;
  obteniendoGPS?: boolean;
}

function MapaCentroTracker({ 
  onCentroCambia,
  onMovimientoManual,
  centrarEn,
}: { 
  onCentroCambia: (lat: number, lng: number) => void;
  onMovimientoManual: () => void;
  centrarEn: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const ultimoCentroRef = useRef<{ lat: number; lng: number } | null>(null);
  const movimientoProgramaticoRef = useRef(false);
  
  useMapEvents({
    moveend: () => {
      const centro = map.getCenter();
      onCentroCambia(centro.lat, centro.lng);
      
      if (!movimientoProgramaticoRef.current) {
        onMovimientoManual();
      }
      movimientoProgramaticoRef.current = false;
    },
    zoomend: () => {
      const centro = map.getCenter();
      onCentroCambia(centro.lat, centro.lng);
    },
  });
  
  useEffect(() => {
    if (centrarEn && (
      !ultimoCentroRef.current ||
      Math.abs(ultimoCentroRef.current.lat - centrarEn.lat) > 0.0001 ||
      Math.abs(ultimoCentroRef.current.lng - centrarEn.lng) > 0.0001
    )) {
      movimientoProgramaticoRef.current = true;
      map.setView([centrarEn.lat, centrarEn.lng], map.getZoom(), { animate: true });
      ultimoCentroRef.current = centrarEn;
    }
  }, [centrarEn, map]);
  
  return null;
}

const CENTRO_TACNA: { lat: number; lng: number } = { lat: -18.0146, lng: -70.2536 };

export default function SelectorUbicacion({
  ubicacionActual,
  onSeleccionarUbicacion,
  obteniendoGPS = false,
}: SelectorUbicacionProps) {
  const { toast } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ubicacionCentro, setUbicacionCentro] = useState<{ lat: number; lng: number }>(CENTRO_TACNA);
  const [centrarEnUbicacion, setCentrarEnUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [obteniendoGPSLocal, setObteniendoGPSLocal] = useState(false);
  const gpsIntentadoRef = useRef(false);
  const usuarioMovioMapaRef = useRef(false);
  const solicitudGPSIdRef = useRef(0);

  useEffect(() => {
    if (modalAbierto) {
      usuarioMovioMapaRef.current = false;
      solicitudGPSIdRef.current += 1;
      
      if (ubicacionActual) {
        setUbicacionCentro(ubicacionActual);
        setCentrarEnUbicacion(ubicacionActual);
      } else if (!gpsIntentadoRef.current) {
        gpsIntentadoRef.current = true;
        obtenerGPSDispositivo(true);
      }
    } else {
      gpsIntentadoRef.current = false;
      usuarioMovioMapaRef.current = false;
      solicitudGPSIdRef.current += 1;
      setCentrarEnUbicacion(null);
      setUbicacionCentro(CENTRO_TACNA);
    }
  }, [modalAbierto, ubicacionActual]);

  const obtenerGPSDispositivo = useCallback((silencioso = false) => {
    if (!navigator.geolocation) {
      if (!silencioso) {
        toast({
          title: "GPS no disponible",
          description: "Tu dispositivo no soporta geolocalización",
          variant: "destructive",
        });
      }
      setUbicacionCentro(CENTRO_TACNA);
      setCentrarEnUbicacion(CENTRO_TACNA);
      return;
    }

    setObteniendoGPSLocal(true);
    const solicitudId = solicitudGPSIdRef.current;

    const opciones: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (solicitudId !== solicitudGPSIdRef.current) {
          return;
        }
        
        if (usuarioMovioMapaRef.current) {
          setObteniendoGPSLocal(false);
          return;
        }
        
        const nuevaUbicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUbicacionCentro(nuevaUbicacion);
        setCentrarEnUbicacion({ ...nuevaUbicacion });
        setObteniendoGPSLocal(false);
        
        if (!silencioso) {
          toast({
            title: "Ubicación GPS obtenida",
            description: `Precisión: ${Math.round(position.coords.accuracy)} metros`,
          });
        }
      },
      (error) => {
        if (solicitudId !== solicitudGPSIdRef.current) {
          return;
        }
        
        setObteniendoGPSLocal(false);
        
        if (!silencioso) {
          let mensaje = "No se pudo obtener tu ubicación";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              mensaje = "Permiso de ubicación denegado. Activa el GPS en tu dispositivo.";
              break;
            case error.POSITION_UNAVAILABLE:
              mensaje = "Ubicación no disponible. Verifica que el GPS esté activado.";
              break;
            case error.TIMEOUT:
              mensaje = "Tiempo de espera agotado. Mueve el mapa manualmente.";
              break;
          }
          toast({
            title: "Error de GPS",
            description: mensaje,
            variant: "destructive",
          });
        }
        
        if (!ubicacionActual && !usuarioMovioMapaRef.current) {
          setCentrarEnUbicacion(CENTRO_TACNA);
        }
      },
      opciones
    );
  }, [toast, ubicacionActual]);

  const buscarDireccion = useCallback(async () => {
    if (!busqueda.trim()) return;
    
    setBuscando(true);
    try {
      const consulta = encodeURIComponent(`${busqueda}, Tacna, Peru`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${consulta}&limit=1`
      );
      const datos = await response.json();
      
      if (datos && datos.length > 0) {
        const resultado = datos[0];
        const nuevaUbicacion = {
          lat: parseFloat(resultado.lat),
          lng: parseFloat(resultado.lon),
        };
        setUbicacionCentro(nuevaUbicacion);
        setCentrarEnUbicacion({ ...nuevaUbicacion });
        
        toast({
          title: "Ubicación encontrada",
          description: resultado.display_name.substring(0, 50) + "...",
        });
      } else {
        toast({
          title: "Sin resultados",
          description: "No se encontró la dirección. Intenta con otra búsqueda.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de búsqueda",
        description: "No se pudo buscar la dirección. Intenta más tarde.",
        variant: "destructive",
      });
    } finally {
      setBuscando(false);
    }
  }, [busqueda, toast]);

  const confirmarUbicacion = () => {
    onSeleccionarUbicacion(ubicacionCentro);
    setModalAbierto(false);
    toast({
      title: "Ubicación confirmada",
      description: `Lat: ${ubicacionCentro.lat.toFixed(6)}, Lng: ${ubicacionCentro.lng.toFixed(6)}`,
    });
  };

  const handleCentroCambia = useCallback((lat: number, lng: number) => {
    setUbicacionCentro({ lat, lng });
  }, []);

  const handleMovimientoManual = useCallback(() => {
    usuarioMovioMapaRef.current = true;
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setModalAbierto(true)}
        disabled={obteniendoGPS}
        className="gap-2"
        data-testid="button-abrir-mapa"
      >
        {obteniendoGPS ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {ubicacionActual ? "Cambiar ubicación" : "Seleccionar en mapa"}
        </span>
        <span className="sm:hidden">Mapa</span>
      </Button>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-0 flex flex-col [&>button]:z-[1001]">
          <DialogHeader className="p-4 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Seleccionar Ubicación
            </DialogTitle>
            <DialogDescription className="sr-only">
              Usa el mapa para seleccionar una ubicación
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="px-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Buscar dirección..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarDireccion()}
                  className="pr-10"
                  data-testid="input-buscar-direccion"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={buscarDireccion}
                disabled={buscando || !busqueda.trim()}
                size="icon"
                variant="outline"
                data-testid="button-buscar-direccion"
              >
                {buscando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => {
                  usuarioMovioMapaRef.current = false;
                  obtenerGPSDispositivo(false);
                }}
                disabled={obteniendoGPSLocal}
                size="icon"
                variant="default"
                title="Centrar en mi ubicación GPS"
                data-testid="button-obtener-gps"
              >
                {obteniendoGPSLocal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-center gap-2">
              <Crosshair className="h-3 w-3 text-red-500" />
              <span>
                Lat: {ubicacionCentro.lat.toFixed(6)}, Lng: {ubicacionCentro.lng.toFixed(6)}
              </span>
            </div>
          </div>

          <div className="relative h-[50vh] sm:h-[400px] mx-4 mt-2 rounded-lg overflow-hidden border">
            <MapContainer
              center={[ubicacionCentro.lat, ubicacionCentro.lng]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              scrollWheelZoom={true}
              dragging={true}
              touchZoom={true}
              doubleClickZoom={true}
              boxZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapaCentroTracker 
                onCentroCambia={handleCentroCambia}
                onMovimientoManual={handleMovimientoManual}
                centrarEn={centrarEnUbicacion}
              />
            </MapContainer>
            
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
              style={{ transform: "translate(-50%, -100%)" }}
            >
              <div className="flex flex-col items-center">
                <MapPin className="h-10 w-10 text-red-600 drop-shadow-lg" fill="currentColor" />
                <div className="w-2 h-2 bg-red-600 rounded-full -mt-1 shadow-lg animate-pulse" />
              </div>
            </div>
            
          </div>
          </div>

          <div className="p-4 pt-3 flex gap-2 justify-end border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
              data-testid="button-cancelar-ubicacion"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarUbicacion}
              data-testid="button-confirmar-ubicacion"
            >
              <Crosshair className="h-4 w-4 mr-2" />
              Confirmar ubicación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
