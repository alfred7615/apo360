import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Check, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

function DraggableMarker({ 
  position, 
  onPositionChange 
}: { 
  position: [number, number]; 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const latlng = marker.getLatLng();
            onPositionChange(latlng.lat, latlng.lng);
          }
        },
      }}
    />
  );
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
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
  const [latInput, setLatInput] = useState(initialLat.toString());
  const [lngInput, setLngInput] = useState(initialLng.toString());
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (open) {
      const lat = initialLat || -18.0146;
      const lng = initialLng || -70.2536;
      setPosition([lat, lng]);
      setLatInput(lat.toString());
      setLngInput(lng.toString());
    }
  }, [open, initialLat, initialLng]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
  };

  const handleInputChange = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      setPosition([lat, lng]);
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
        handlePositionChange(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        alert("No se pudo obtener la ubicación actual");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onSelectLocation(position[0], position[1]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Seleccionar Ubicación GPS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="map-lat" className="text-xs">Latitud</Label>
              <Input
                id="map-lat"
                type="number"
                step="any"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onBlur={handleInputChange}
                className="h-8"
                data-testid="input-map-latitud"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="map-lng" className="text-xs">Longitud</Label>
              <Input
                id="map-lng"
                type="number"
                step="any"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onBlur={handleInputChange}
                className="h-8"
                data-testid="input-map-longitud"
              />
            </div>
          </div>

          <div className="h-[350px] rounded-lg overflow-hidden border">
            <MapContainer
              center={position}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker position={position} onPositionChange={handlePositionChange} />
              <MapCenterUpdater center={position} />
            </MapContainer>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Arrastra el marcador o haz clic en el mapa para seleccionar la ubicación
          </p>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2"
              data-testid="button-ubicacion-actual"
            >
              <Navigation className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
              {isLocating ? "Obteniendo..." : "Mi Ubicación"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                data-testid="button-cancelar-mapa"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                data-testid="button-confirmar-ubicacion"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
