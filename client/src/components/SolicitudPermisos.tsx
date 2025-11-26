import { useState, useEffect, useCallback } from "react";
import { Camera, MapPin, MessageCircle, Shield, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type EstadoPermiso = "pendiente" | "concedido" | "denegado" | "no_soportado";

interface PermisoInfo {
  nombre: string;
  icono: any;
  estado: EstadoPermiso;
  descripcion: string;
}

export default function SolicitudPermisos() {
  const { toast } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [permisos, setPermisos] = useState<PermisoInfo[]>([]);
  const [verificando, setVerificando] = useState(false);
  const [todosVerificados, setTodosVerificados] = useState(false);

  const verificarPermisoGPS = useCallback(async (): Promise<EstadoPermiso> => {
    if (!navigator.geolocation) return "no_soportado";
    
    try {
      if (navigator.permissions) {
        const resultado = await navigator.permissions.query({ name: "geolocation" });
        if (resultado.state === "granted") return "concedido";
        if (resultado.state === "denied") return "denegado";
      }
      return "pendiente";
    } catch {
      return "pendiente";
    }
  }, []);

  const verificarPermisoNotificaciones = useCallback(async (): Promise<EstadoPermiso> => {
    if (!("Notification" in window)) return "no_soportado";
    
    try {
      if (Notification.permission === "granted") return "concedido";
      if (Notification.permission === "denied") return "denegado";
      return "pendiente";
    } catch {
      return "no_soportado";
    }
  }, []);

  const verificarTodosPermisos = useCallback(async () => {
    setVerificando(true);
    
    const estadoGPS = await verificarPermisoGPS();
    const estadoNotificaciones = await verificarPermisoNotificaciones();
    
    const nuevosPermisos: PermisoInfo[] = [
      {
        nombre: "Ubicación GPS",
        icono: MapPin,
        estado: estadoGPS,
        descripcion: "Para enviar tu ubicación en emergencias",
      },
      {
        nombre: "Notificaciones",
        icono: MessageCircle,
        estado: estadoNotificaciones,
        descripcion: "Para recibir alertas de emergencia",
      },
    ];
    
    setPermisos(nuevosPermisos);
    setVerificando(false);
    setTodosVerificados(true);
    
    const hayPendientes = nuevosPermisos.some(p => p.estado === "pendiente");
    const todosOK = nuevosPermisos.every(p => p.estado === "concedido" || p.estado === "no_soportado");
    
    if (!todosOK && hayPendientes) {
      const yaVisto = localStorage.getItem("permisosModalVisto");
      if (!yaVisto) {
        setModalAbierto(true);
      }
    }
  }, [verificarPermisoGPS, verificarPermisoNotificaciones]);

  useEffect(() => {
    const timer = setTimeout(() => {
      verificarTodosPermisos();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [verificarTodosPermisos]);

  const solicitarPermisoGPS = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) return false;
    
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const solicitarPermisoNotificaciones = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    
    try {
      const resultado = await Notification.requestPermission();
      return resultado === "granted";
    } catch {
      return false;
    }
  }, []);

  const solicitarTodosPermisos = useCallback(async () => {
    setVerificando(true);
    
    const gpsOK = await solicitarPermisoGPS();
    await solicitarPermisoNotificaciones();
    
    await verificarTodosPermisos();
    
    setVerificando(false);
    
    if (gpsOK) {
      localStorage.setItem("permisosModalVisto", "true");
      setModalAbierto(false);
      toast({
        title: "Permisos concedidos",
        description: "Los permisos fueron configurados correctamente",
      });
    } else {
      toast({
        title: "GPS requerido",
        description: "El permiso de ubicación es necesario para las emergencias. Actívalo en la configuración del navegador.",
        variant: "destructive",
      });
    }
  }, [solicitarPermisoGPS, solicitarPermisoNotificaciones, verificarTodosPermisos, toast]);

  const omitirPermisos = () => {
    const gpsPermiso = permisos.find(p => p.nombre === "Ubicación GPS");
    const gpsOK = gpsPermiso?.estado === "concedido" || gpsPermiso?.estado === "no_soportado";
    
    if (!gpsOK) {
      toast({
        title: "GPS requerido",
        description: "El permiso de ubicación es necesario para enviar emergencias. Puedes configurarlo después.",
        variant: "destructive",
      });
    }
    
    localStorage.setItem("permisosModalVisto", "true");
    setModalAbierto(false);
  };

  const getIconoEstado = (estado: EstadoPermiso) => {
    switch (estado) {
      case "concedido":
        return <Check className="h-4 w-4 text-green-500" />;
      case "denegado":
        return <X className="h-4 w-4 text-red-500" />;
      case "no_soportado":
        return <X className="h-4 w-4 text-muted-foreground" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-yellow-500" />;
    }
  };

  const getColorEstado = (estado: EstadoPermiso) => {
    switch (estado) {
      case "concedido":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "denegado":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      case "no_soportado":
        return "bg-muted border-muted";
      default:
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
    }
  };

  if (!todosVerificados) return null;

  return (
    <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permisos Necesarios
          </DialogTitle>
          <DialogDescription>
            SEG-APO necesita estos permisos para funcionar correctamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {permisos.map((permiso) => {
            const Icono = permiso.icono;
            return (
              <div
                key={permiso.nombre}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getColorEstado(permiso.estado)}`}
              >
                <div className="flex-shrink-0">
                  <Icono className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{permiso.nombre}</p>
                  <p className="text-xs text-muted-foreground">{permiso.descripcion}</p>
                </div>
                <div className="flex-shrink-0">
                  {getIconoEstado(permiso.estado)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={omitirPermisos}
            className="flex-1"
            disabled={verificando}
          >
            Más tarde
          </Button>
          <Button
            onClick={solicitarTodosPermisos}
            className="flex-1"
            disabled={verificando}
          >
            {verificando ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Permitir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
