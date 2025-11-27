import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Check, X, Crosshair } from "lucide-react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

function MapEventHandler({ 
  onMove 
}: { 
  onMove: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  
  useMapEvents({
    move() {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    },
    moveend() {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    }
  });

  return null;
}

function MapCenterUpdater({ center, shouldUpdate }: { center: [number, number]; shouldUpdate: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (shouldUpdate) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, shouldUpdate, map]);
  
  return null;
}

export function MapPicker({
  open,
  onClose,
  onSelectLocation,
  initialLat = -18.0146,
  initialLng = -70.2536,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [latInput, setLatInput] = useState(initialLat.toFixed(6));
  const [lngInput, setLngInput] = useState(initialLng.toFixed(6));
  const [isLocating, setIsLocating] = useState(false);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);

  useEffect(() => {
    if (open) {
      const lat = initialLat || -18.0146;
      const lng = initialLng || -70.2536;
      setPosition([lat, lng]);
      setLatInput(lat.toFixed(6));
      setLngInput(lng.toFixed(6));
      setShouldCenterMap(true);
    }
  }, [open, initialLat, initialLng]);

  const handleMapMove = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    setShouldCenterMap(false);
  }, []);

  const handleInputChange = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setPosition([lat, lng]);
      setShouldCenterMap(true);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada en este navegador");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        setShouldCenterMap(true);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        alert("No se pudo obtener la ubicación actual. Verifica los permisos de ubicación.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onSelectLocation(position[0], position[1]);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600">
        <DialogHeader className="px-4 pt-3 pb-2 sm:px-5 sm:pt-4 bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <MapPin className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            Seleccionar Ubicación GPS
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-2 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex-1 bg-zinc-50 dark:bg-zinc-600 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-500"
              data-testid="button-ubicacion-actual"
            >
              <Navigation className={`h-4 w-4 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? "Obteniendo GPS..." : "Usar GPS del Dispositivo"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShouldCenterMap(true)}
              className="flex-1 bg-zinc-50 dark:bg-zinc-600 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-500"
              data-testid="button-centrar-mapa"
            >
              <Crosshair className="h-4 w-4 mr-2" />
              Seleccionar en Mapa
            </Button>
          </div>

          <div className="relative">
            <div className="h-[200px] sm:h-[280px] md:h-[320px] rounded-lg overflow-hidden border-2 border-zinc-300 dark:border-zinc-500">
              <MapContainer
                center={position}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                dragging={true}
                touchZoom={true}
                doubleClickZoom={true}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEventHandler onMove={handleMapMove} />
                <MapCenterUpdater center={position} shouldUpdate={shouldCenterMap} />
              </MapContainer>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
              <div className="flex flex-col items-center">
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 drop-shadow-lg" style={{ marginBottom: '-8px' }} />
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded-full opacity-30 animate-ping" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="map-lat" className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Latitud
              </Label>
              <Input
                id="map-lat"
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onBlur={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleInputChange()}
                className="h-9 sm:h-10 bg-white dark:bg-zinc-600 border-zinc-300 dark:border-zinc-500 text-zinc-800 dark:text-zinc-100 text-sm"
                placeholder="-18.014600"
                data-testid="input-map-latitud"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="map-lng" className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Longitud
              </Label>
              <Input
                id="map-lng"
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onBlur={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleInputChange()}
                className="h-9 sm:h-10 bg-white dark:bg-zinc-600 border-zinc-300 dark:border-zinc-500 text-zinc-800 dark:text-zinc-100 text-sm"
                placeholder="-70.253600"
                data-testid="input-map-longitud"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-9 sm:h-10 bg-zinc-200 dark:bg-zinc-600 border-zinc-400 dark:border-zinc-500 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-500"
              data-testid="button-cancelar-mapa"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-9 sm:h-10 bg-zinc-700 dark:bg-zinc-500 hover:bg-zinc-800 dark:hover:bg-zinc-400 text-white"
              data-testid="button-confirmar-ubicacion"
            >
              <Check className="h-4 w-4 mr-2" />
              Guardar Coordenadas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
