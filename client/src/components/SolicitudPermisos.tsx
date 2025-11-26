import { useState, useEffect, useCallback } from "react";
import { MapPin, MessageCircle, Shield, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type EstadoPermiso = "pendiente" | "concedido" | "denegado" | "no_soportado" | "solicitando";

interface PermisoInfo {
  nombre: string;
  icono: any;
  estado: EstadoPermiso;
  descripcion: string;
  requerido: boolean;
}

export default function SolicitudPermisos() {
  const { toast } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [permisos, setPermisos] = useState<PermisoInfo[]>([]);
  const [verificando, setVerificando] = useState(false);
  const [todosVerificados, setTodosVerificados] = useState(false);
  const [solicitandoGPS, setSolicitandoGPS] = useState(false);

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
        descripcion: "OBLIGATORIO - Requerido para emergencias y verificación de ubicación",
        requerido: true,
      },
      {
        nombre: "Notificaciones",
        icono: MessageCircle,
        estado: estadoNotificaciones,
        descripcion: "Para recibir alertas de emergencia",
        requerido: false,
      },
    ];
    
    setPermisos(nuevosPermisos);
    setVerificando(false);
    setTodosVerificados(true);
    
    const gpsPermiso = nuevosPermisos.find(p => p.nombre === "Ubicación GPS");
    const gpsOK = gpsPermiso?.estado === "concedido";
    
    if (!gpsOK) {
      setModalAbierto(true);
    }
  }, [verificarPermisoGPS, verificarPermisoNotificaciones]);

  useEffect(() => {
    const timer = setTimeout(() => {
      verificarTodosPermisos();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [verificarTodosPermisos]);

  const forzarActivacionGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS no disponible",
        description: "Tu dispositivo no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    setSolicitandoGPS(true);
    
    setPermisos(prev => prev.map(p => 
      p.nombre === "Ubicación GPS" ? { ...p, estado: "solicitando" as EstadoPermiso } : p
    ));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: true, 
            timeout: 30000,
            maximumAge: 0 
          }
        );
      });

      setPermisos(prev => prev.map(p => 
        p.nombre === "Ubicación GPS" ? { ...p, estado: "concedido" } : p
      ));

      toast({
        title: "GPS activado correctamente",
        description: `Ubicación obtenida con precisión de ${Math.round(position.coords.accuracy)} metros`,
      });

      localStorage.setItem("permisosModalVisto", "true");
      localStorage.setItem("gpsActivado", "true");
      
      setTimeout(() => {
        setModalAbierto(false);
      }, 1000);

    } catch (error: any) {
      let mensaje = "No se pudo activar el GPS";
      let instrucciones = "";
      
      if (error.code === 1) {
        mensaje = "Permiso de GPS denegado";
        instrucciones = "Debes permitir el acceso a ubicación en tu navegador. Ve a Configuración > Sitios > Permisos > Ubicación y actívalo para este sitio.";
      } else if (error.code === 2) {
        mensaje = "GPS no disponible";
        instrucciones = "Verifica que el GPS esté activado en tu dispositivo.";
      } else if (error.code === 3) {
        mensaje = "Tiempo de espera agotado";
        instrucciones = "Intenta de nuevo en un lugar con mejor señal GPS.";
      }

      setPermisos(prev => prev.map(p => 
        p.nombre === "Ubicación GPS" ? { ...p, estado: error.code === 1 ? "denegado" : "pendiente" } : p
      ));

      toast({
        title: mensaje,
        description: instrucciones,
        variant: "destructive",
      });
    } finally {
      setSolicitandoGPS(false);
    }
  }, [toast]);

  const solicitarNotificaciones = useCallback(async () => {
    if (!("Notification" in window)) return;
    
    try {
      const resultado = await Notification.requestPermission();
      setPermisos(prev => prev.map(p => 
        p.nombre === "Notificaciones" ? { 
          ...p, 
          estado: resultado === "granted" ? "concedido" : resultado === "denied" ? "denegado" : "pendiente" 
        } : p
      ));
    } catch {
      // Silencioso
    }
  }, []);

  const handleCerrarModal = useCallback((open: boolean) => {
    const gpsPermiso = permisos.find(p => p.nombre === "Ubicación GPS");
    const gpsOK = gpsPermiso?.estado === "concedido";
    
    if (!open && !gpsOK) {
      toast({
        title: "GPS es obligatorio",
        description: "Debes activar el GPS para usar SEG-APO. Esta función es necesaria para emergencias y verificación de ubicación.",
        variant: "destructive",
      });
      return;
    }
    
    setModalAbierto(open);
  }, [permisos, toast]);

  const getIconoEstado = (estado: EstadoPermiso) => {
    switch (estado) {
      case "concedido":
        return <Check className="h-5 w-5 text-green-500" />;
      case "denegado":
        return <X className="h-5 w-5 text-red-500" />;
      case "no_soportado":
        return <X className="h-5 w-5 text-muted-foreground" />;
      case "solicitando":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getColorEstado = (estado: EstadoPermiso, requerido: boolean) => {
    switch (estado) {
      case "concedido":
        return "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700";
      case "denegado":
        return "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700";
      case "no_soportado":
        return "bg-muted border-muted";
      case "solicitando":
        return "bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700";
      default:
        return requerido 
          ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700" 
          : "bg-muted/50 border-border";
    }
  };

  const gpsPermiso = permisos.find(p => p.nombre === "Ubicación GPS");
  const gpsOK = gpsPermiso?.estado === "concedido";
  const gpsDenegado = gpsPermiso?.estado === "denegado";
  const gpsNoSoportado = gpsPermiso?.estado === "no_soportado";

  if (!todosVerificados) return null;

  return (
    <Dialog open={modalAbierto} onOpenChange={handleCerrarModal}>
      <DialogContent 
        className="max-w-sm" 
        onPointerDownOutside={(e) => {
          if (!gpsOK) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!gpsOK) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permisos Requeridos
          </DialogTitle>
          <DialogDescription>
            SEG-APO requiere acceso a tu ubicación GPS para funcionar correctamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {permisos.map((permiso) => {
            const Icono = permiso.icono;
            return (
              <div
                key={permiso.nombre}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${getColorEstado(permiso.estado, permiso.requerido)}`}
                data-testid={`permiso-${permiso.nombre.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="flex-shrink-0">
                  <Icono className={`h-6 w-6 ${permiso.requerido ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${permiso.requerido ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {permiso.nombre}
                    {permiso.requerido && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{permiso.descripcion}</p>
                </div>
                <div className="flex-shrink-0">
                  {getIconoEstado(permiso.estado)}
                </div>
              </div>
            );
          })}
        </div>

        {gpsNoSoportado && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm">
            <p className="font-medium text-orange-700 dark:text-orange-300 mb-1">
              GPS no disponible en este dispositivo
            </p>
            <p className="text-orange-600 dark:text-orange-400 text-xs">
              Tu navegador o dispositivo no soporta geolocalización. Para usar SEG-APO necesitas:
              <br />• Un navegador moderno (Chrome, Firefox, Safari, Edge)
              <br />• Un dispositivo con GPS o servicios de ubicación
              <br />• Acceder desde HTTPS (conexión segura)
            </p>
          </div>
        )}

        {gpsDenegado && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
            <p className="font-medium text-red-700 dark:text-red-300 mb-1">
              GPS bloqueado por el navegador
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs">
              Para activar el GPS:
              <br />1. Haz clic en el icono de candado en la barra de direcciones
              <br />2. Busca "Ubicación" o "Location"
              <br />3. Cambia a "Permitir"
              <br />4. Recarga la página
            </p>
          </div>
        )}

        {!gpsOK && !gpsDenegado && !gpsNoSoportado && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              Al hacer clic en "Activar GPS", tu navegador te pedirá permiso para acceder a tu ubicación. 
              <strong> Debes hacer clic en "Permitir"</strong> para continuar.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {!gpsOK ? (
            <Button
              onClick={forzarActivacionGPS}
              disabled={solicitandoGPS || verificando}
              className="w-full gap-2"
              size="lg"
              data-testid="button-activar-gps"
            >
              {solicitandoGPS ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Solicitando acceso GPS...
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5" />
                  Activar GPS Ahora
                </>
              )}
            </Button>
          ) : (
            <>
              {permisos.find(p => p.nombre === "Notificaciones")?.estado !== "concedido" && (
                <Button
                  onClick={solicitarNotificaciones}
                  variant="outline"
                  className="w-full gap-2"
                  data-testid="button-activar-notificaciones"
                >
                  <MessageCircle className="h-4 w-4" />
                  Activar Notificaciones (opcional)
                </Button>
              )}
              <Button
                onClick={() => setModalAbierto(false)}
                className="w-full gap-2"
                data-testid="button-continuar"
              >
                <Check className="h-4 w-4" />
                Continuar a SEG-APO
              </Button>
            </>
          )}
        </div>

        {!gpsOK && (
          <p className="text-xs text-center text-muted-foreground">
            El GPS es obligatorio para todas las funciones de SEG-APO
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
