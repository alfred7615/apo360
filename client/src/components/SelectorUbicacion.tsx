import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";
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

const iconoRojo = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface SelectorUbicacionProps {
  ubicacionActual: { lat: number; lng: number } | null;
  onSeleccionarUbicacion: (ubicacion: { lat: number; lng: number }) => void;
  obteniendoGPS?: boolean;
}

function MapaEventos({ onUbicacionCambia }: { onUbicacionCambia: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onUbicacionCambia(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CentrarMapa({ centro }: { centro: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (centro) {
      map.setView(centro, 16);
    }
  }, [centro, map]);
  
  return null;
}

export default function SelectorUbicacion({
  ubicacionActual,
  onSeleccionarUbicacion,
  obteniendoGPS = false,
}: SelectorUbicacionProps) {
  const { toast } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ubicacionTemporal, setUbicacionTemporal] = useState<{ lat: number; lng: number } | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [obteniendoGPSLocal, setObteniendoGPSLocal] = useState(false);

  const centroTacna: [number, number] = [-18.0146, -70.2536];
  
  const centroMapa: [number, number] = ubicacionTemporal 
    ? [ubicacionTemporal.lat, ubicacionTemporal.lng]
    : ubicacionActual 
      ? [ubicacionActual.lat, ubicacionActual.lng]
      : centroTacna;

  useEffect(() => {
    if (modalAbierto && ubicacionActual) {
      setUbicacionTemporal(ubicacionActual);
    }
  }, [modalAbierto, ubicacionActual]);

  const obtenerGPSDispositivo = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS no disponible",
        description: "Tu dispositivo no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    setObteniendoGPSLocal(true);

    const opciones: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nuevaUbicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUbicacionTemporal(nuevaUbicacion);
        setObteniendoGPSLocal(false);
        toast({
          title: "Ubicación obtenida",
          description: `Precisión: ${Math.round(position.coords.accuracy)} metros`,
        });
      },
      (error) => {
        setObteniendoGPSLocal(false);
        let mensaje = "No se pudo obtener tu ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = "Permiso de ubicación denegado. Activa el GPS en tu dispositivo.";
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje = "Ubicación no disponible. Verifica que el GPS esté activado.";
            break;
          case error.TIMEOUT:
            mensaje = "Tiempo de espera agotado. Intenta en un lugar con mejor señal.";
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
        setUbicacionTemporal(nuevaUbicacion);
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
    if (ubicacionTemporal) {
      onSeleccionarUbicacion(ubicacionTemporal);
      setModalAbierto(false);
      toast({
        title: "Ubicación confirmada",
        description: `Lat: ${ubicacionTemporal.lat.toFixed(6)}, Lng: ${ubicacionTemporal.lng.toFixed(6)}`,
      });
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setUbicacionTemporal({ lat, lng });
  };

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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Seleccionar Ubicación
            </DialogTitle>
            <DialogDescription>
              Toca en el mapa para marcar tu ubicación o usa el GPS
            </DialogDescription>
          </DialogHeader>

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
                onClick={obtenerGPSDispositivo}
                disabled={obteniendoGPSLocal}
                size="icon"
                variant="default"
                title="Obtener mi ubicación GPS"
                data-testid="button-obtener-gps"
              >
                {obteniendoGPSLocal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>

            {ubicacionTemporal && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>
                  Lat: {ubicacionTemporal.lat.toFixed(6)}, Lng: {ubicacionTemporal.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>

          <div className="h-[50vh] sm:h-[400px] mx-4 mt-2 rounded-lg overflow-hidden border">
            <MapContainer
              center={centroMapa}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapaEventos onUbicacionCambia={handleMapClick} />
              <CentrarMapa centro={ubicacionTemporal ? [ubicacionTemporal.lat, ubicacionTemporal.lng] : null} />
              {ubicacionTemporal && (
                <Marker
                  position={[ubicacionTemporal.lat, ubicacionTemporal.lng]}
                  icon={iconoRojo}
                />
              )}
            </MapContainer>
          </div>

          <div className="p-4 pt-3 flex gap-2 justify-end border-t">
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
              data-testid="button-cancelar-ubicacion"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarUbicacion}
              disabled={!ubicacionTemporal}
              data-testid="button-confirmar-ubicacion"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Confirmar ubicación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
