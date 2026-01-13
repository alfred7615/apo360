import { useState, useEffect, useRef } from "react";
import { AlertTriangle, MapPin, Phone, Truck, Camera, X, User, Clock, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface AlertaEmergenciaModalProps {
  alerta: AlertaEmergencia | null;
  onVerDetalles: (alerta: AlertaEmergencia) => void;
  onDescartar: (alertaId: string) => void;
}

export function AlertaEmergenciaModal({ alerta, onVerDetalles, onDescartar }: AlertaEmergenciaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (alerta) {
      setIsOpen(true);
      setIsFlashing(true);
      
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/alerta-emergencia.mp3');
        audioRef.current.loop = true;
      }
      
      audioRef.current.play().catch(e => {
        console.log('No se pudo reproducir audio:', e);
      });

      flashIntervalRef.current = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 500);
    } else {
      setIsOpen(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
    };
  }, [alerta]);

  const handleVerDetalles = () => {
    if (alerta) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
      onVerDetalles(alerta);
      setIsOpen(false);
    }
  };

  const handleDescartar = () => {
    if (alerta) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
      onDescartar(alerta.id);
      setIsOpen(false);
    }
  };

  if (!alerta) return null;

  const tiempoTranscurrido = () => {
    const ahora = new Date();
    const creacion = new Date(alerta.fechaCreacion);
    const diff = Math.floor((ahora.getTime() - creacion.getTime()) / 1000);
    if (diff < 60) return `Hace ${diff} segundos`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    return `Hace ${Math.floor(diff / 3600)} horas`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleDescartar();
    }}>
      <DialogContent 
        className={`max-w-md border-4 transition-all duration-300 ${
          isFlashing 
            ? 'border-red-600 bg-red-50 dark:bg-red-950/50' 
            : 'border-red-400 bg-white dark:bg-gray-900'
        }`}
        data-testid="modal-alerta-emergencia"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className={`h-6 w-6 ${isFlashing ? 'animate-pulse' : ''}`} />
              ALERTA DE EMERGENCIA
            </DialogTitle>
            <Badge 
              variant="destructive" 
              className={`${isFlashing ? 'animate-bounce' : ''}`}
            >
              {alerta.grupo.esOrganizacional ? 'ORGANIZACIONAL' : 'GRUPO'}
            </Badge>
          </div>
          <DialogDescription className="text-left">
            Un miembro de tu grupo necesita ayuda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-12 w-12 border-2 border-red-400">
              <AvatarImage src={alerta.emisor.foto} />
              <AvatarFallback className="bg-red-100 text-red-600">
                {alerta.emisor.nombre.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold" data-testid="text-emisor-nombre">
                {alerta.emisor.nombre}
              </p>
              {alerta.emisor.telefono && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {alerta.emisor.telefono}
                </p>
              )}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium flex items-center gap-1 mb-1">
              <User className="h-4 w-4" />
              Grupo: {alerta.grupo.nombre}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tiempoTranscurrido()}
            </p>
          </div>

          {alerta.ubicacion && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium flex items-center gap-1 text-green-700 dark:text-green-400">
                <MapPin className="h-4 w-4" />
                Ubicación GPS disponible
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {alerta.ubicacion.lat.toFixed(6)}, {alerta.ubicacion.lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {alerta.opciones.alertarPolicia && (
              <Badge variant="outline" className="border-blue-500 text-blue-600">
                <Shield className="h-3 w-3 mr-1" />
                Policía alertada
              </Badge>
            )}
            {alerta.opciones.solicitarGrua && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                <Truck className="h-3 w-3 mr-1" />
                Grúa solicitada
              </Badge>
            )}
            {alerta.opciones.tieneImagen && (
              <Badge variant="outline" className="border-purple-500 text-purple-600">
                <Camera className="h-3 w-3 mr-1" />
                Imagen adjunta
              </Badge>
            )}
          </div>

          {alerta.mensaje && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm italic">"{alerta.mensaje}"</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDescartar}
            data-testid="button-descartar-alerta"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={handleVerDetalles}
            data-testid="button-ver-detalles-alerta"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver detalles
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlertaEmergenciaDetalles({ 
  alerta, 
  onCerrar 
}: { 
  alerta: AlertaEmergencia; 
  onCerrar: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={() => onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-detalles-alerta">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Detalles de la emergencia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-14 w-14 border-2 border-red-400">
              <AvatarImage src={alerta.emisor.foto} />
              <AvatarFallback className="bg-red-100 text-red-600">
                {alerta.emisor.nombre.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{alerta.emisor.nombre}</p>
              {alerta.emisor.telefono && (
                <a 
                  href={`tel:${alerta.emisor.telefono}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-4 w-4" />
                  {alerta.emisor.telefono}
                </a>
              )}
              <p className="text-sm text-muted-foreground">
                Grupo: {alerta.grupo.nombre}
              </p>
            </div>
          </div>

          {alerta.ubicacion && (
            <div className="rounded-lg overflow-hidden border">
              <div className="p-2 bg-muted flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Ubicación del emisor
                </span>
                <a
                  href={`https://www.google.com/maps?q=${alerta.ubicacion.lat},${alerta.ubicacion.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Abrir en Google Maps
                </a>
              </div>
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <iframe
                  title="Ubicación de emergencia"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${alerta.ubicacion.lat},${alerta.ubicacion.lng}&zoom=16`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {alerta.imagenUrl && (
            <div className="rounded-lg overflow-hidden border">
              <div className="p-2 bg-muted">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Camera className="h-4 w-4 text-purple-600" />
                  Imagen capturada
                </span>
              </div>
              <img 
                src={alerta.imagenUrl} 
                alt="Captura de emergencia"
                className="w-full object-contain max-h-80"
              />
            </div>
          )}

          {alerta.mensaje && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Mensaje:</p>
              <p className="italic">"{alerta.mensaje}"</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {alerta.opciones.alertarPolicia && (
              <Badge className="bg-blue-600">
                <Shield className="h-3 w-3 mr-1" />
                Policía alertada
              </Badge>
            )}
            {alerta.opciones.solicitarGrua && (
              <Badge className="bg-yellow-600">
                <Truck className="h-3 w-3 mr-1" />
                Grúa solicitada
              </Badge>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onCerrar} data-testid="button-cerrar-detalles">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
