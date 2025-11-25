import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, Heart, Bookmark, MessageCircle, Share2, Calendar, 
  Send, Copy, AlertTriangle, Info, Users
} from "lucide-react";
import { SiFacebook, SiWhatsapp, SiX } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Popup {
  id: string;
  titulo?: string;
  tipoContenido?: string;
  imagenUrl?: string;
  videoUrl?: string;
  tipo: string;
  duracionSegundos: number;
  segundosObligatorios: number;
  puedeOmitir: boolean;
  estado: string;
}

interface InteraccionContador {
  tipo: string;
  cantidad: number;
}

interface PopupViewerProps {
  tipoContenido?: "popup" | "encuesta";
  contenidoId?: string;
  onClose?: () => void;
  isAuthenticated?: boolean;
}

export default function PopupViewer({ 
  tipoContenido = "popup",
  contenidoId,
  onClose,
  isAuthenticated = false 
}: PopupViewerProps) {
  const [popupActual, setPopupActual] = useState<Popup | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [puedeOmitir, setPuedeOmitir] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const { data: popupsActivos = [] } = useQuery<Popup[]>({
    queryKey: ["/api/popups/activos"],
  });

  const { data: contadores = [] } = useQuery<InteraccionContador[]>({
    queryKey: ["/api/interacciones", tipoContenido, popupActual?.id],
    enabled: !!popupActual?.id,
  });

  const { data: interaccionesUsuario = {} } = useQuery<{ [key: string]: boolean }>({
    queryKey: ["/api/interacciones", tipoContenido, popupActual?.id, "usuario"],
    enabled: !!popupActual?.id && isAuthenticated,
  });

  const { data: comentarios = [] } = useQuery({
    queryKey: ["/api/comentarios", tipoContenido, popupActual?.id],
    enabled: !!popupActual?.id && mostrarComentarios,
  });

  const registrarVistaMutation = useMutation({
    mutationFn: async (popupId: string) => {
      return await apiRequest("POST", `/api/popups/${popupId}/vista`);
    },
  });

  const interaccionMutation = useMutation({
    mutationFn: async (data: { tipoContenido: string; contenidoId: string; tipoInteraccion: string }) => {
      return await apiRequest("POST", "/api/interacciones", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interacciones", tipoContenido, popupActual?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/interacciones", tipoContenido, popupActual?.id, "usuario"] });
    },
  });

  const comentarioMutation = useMutation({
    mutationFn: async (data: { tipoContenido: string; contenidoId: string; texto: string }) => {
      return await apiRequest("POST", "/api/comentarios", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comentarios", tipoContenido, popupActual?.id] });
      setNuevoComentario("");
      toast({ title: "Comentario agregado" });
    },
  });

  const mostrarSiguientePopup = useCallback(() => {
    if (popupsActivos.length > 0 && popupIndex < popupsActivos.length) {
      const popup = popupsActivos[popupIndex];
      setPopupActual(popup);
      setSegundosRestantes(popup.duracionSegundos);
      setPuedeOmitir(false);
      setMostrarPopup(true);
      registrarVistaMutation.mutate(popup.id);
    } else {
      setMostrarPopup(false);
      onClose?.();
    }
  }, [popupsActivos, popupIndex, onClose]);

  useEffect(() => {
    if (popupsActivos.length > 0 && !mostrarPopup && popupIndex === 0) {
      const timer = setTimeout(() => {
        mostrarSiguientePopup();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [popupsActivos, mostrarPopup, popupIndex]);

  useEffect(() => {
    if (!mostrarPopup || !popupActual) return;

    const interval = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        
        const nuevosSegundos = prev - 1;
        if (popupActual.duracionSegundos - nuevosSegundos >= popupActual.segundosObligatorios) {
          setPuedeOmitir(true);
        }
        
        return nuevosSegundos;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mostrarPopup, popupActual]);

  useEffect(() => {
    if (segundosRestantes === 0 && mostrarPopup) {
      cerrarPopup();
    }
  }, [segundosRestantes]);

  const cerrarPopup = () => {
    setMostrarPopup(false);
    setPopupIndex(prev => prev + 1);
    setTimeout(() => {
      mostrarSiguientePopup();
    }, 1000);
  };

  const omitirPopup = () => {
    if (puedeOmitir) {
      cerrarPopup();
    }
  };

  const manejarInteraccion = (tipo: string) => {
    if (!isAuthenticated) {
      toast({ title: "Inicia sesión para interactuar", variant: "destructive" });
      return;
    }
    if (popupActual) {
      interaccionMutation.mutate({
        tipoContenido,
        contenidoId: popupActual.id,
        tipoInteraccion: tipo,
      });
    }
  };

  const enviarComentario = () => {
    if (!nuevoComentario.trim()) return;
    if (!isAuthenticated) {
      toast({ title: "Inicia sesión para comentar", variant: "destructive" });
      return;
    }
    if (popupActual) {
      comentarioMutation.mutate({
        tipoContenido,
        contenidoId: popupActual.id,
        texto: nuevoComentario,
      });
    }
  };

  const compartirEnRedSocial = (red: string) => {
    if (!popupActual) return;
    
    const url = window.location.href;
    const texto = popupActual.titulo || "Mira esto en SEG-APO";
    
    let shareUrl = "";
    switch (red) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + " " + url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({ title: "Enlace copiado al portapapeles" });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      manejarInteraccion("compartir");
    }
  };

  const agregarAlCalendario = () => {
    if (!popupActual) return;
    
    const evento = {
      title: popupActual.titulo || "Evento SEG-APO",
      description: popupActual.tipoContenido || "",
    };
    
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.title)}&details=${encodeURIComponent(evento.description)}`;
    window.open(googleCalUrl, "_blank");
    manejarInteraccion("calendario");
  };

  const getContador = (tipo: string): number => {
    const contador = contadores.find(c => c.tipo === tipo);
    return contador?.cantidad || 0;
  };

  const esContenidoSolidario = popupActual?.tipo === "persona_desaparecida" || popupActual?.tipo === "mascota_desaparecida";

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "persona_desaparecida":
        return <Badge className="bg-red-500 text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Persona Desaparecida</Badge>;
      case "mascota_desaparecida":
        return <Badge className="bg-orange-500 text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Mascota Desaparecida</Badge>;
      case "evento":
        return <Badge className="bg-purple-500 text-xs"><Calendar className="h-3 w-3 mr-1" /> Evento</Badge>;
      case "publicidad":
        return <Badge className="bg-blue-500 text-xs">Publicidad</Badge>;
      default:
        return null;
    }
  };

  if (!popupActual) return null;

  return (
    <Dialog open={mostrarPopup} onOpenChange={(open) => !open && puedeOmitir && omitirPopup()}>
      <DialogContent 
        className="w-[95vw] max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto" 
        data-testid="popup-viewer"
      >
        <VisuallyHidden>
          <DialogTitle>{popupActual.titulo || "Contenido"}</DialogTitle>
        </VisuallyHidden>
        
        <div className="relative w-full">
          {popupActual.videoUrl ? (
            <video 
              ref={videoRef}
              src={popupActual.videoUrl}
              className="w-full max-h-[40vh] sm:max-h-[50vh] object-contain bg-black"
              autoPlay
              muted
              playsInline
              controlsList="nodownload"
              data-testid="video-popup"
            />
          ) : popupActual.imagenUrl ? (
            <img 
              src={popupActual.imagenUrl} 
              alt={popupActual.titulo || "Contenido"}
              className="w-full max-h-[40vh] sm:max-h-[50vh] object-contain bg-gray-100 dark:bg-gray-900"
              data-testid="img-popup"
            />
          ) : null}
          
          <div className="absolute top-2 left-2 right-16 flex flex-wrap gap-1">
            {getTipoBadge(popupActual.tipo)}
          </div>
          
          <div className="absolute top-2 right-2 flex items-center gap-1 sm:gap-2">
            {!puedeOmitir ? (
              <Badge variant="secondary" className="bg-black/70 text-white text-xs px-2 py-1">
                <span className="hidden sm:inline">Omitir en </span>
                <span className="sm:hidden">⏱</span>
                {popupActual.segundosObligatorios - (popupActual.duracionSegundos - segundosRestantes)}s
              </Badge>
            ) : (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={omitirPopup}
                className="bg-black/70 hover:bg-black/90 text-white text-xs h-7 px-2 sm:px-3"
                data-testid="button-omitir"
              >
                <X className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Omitir</span>
              </Button>
            )}
          </div>
          
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white text-xs">
              {segundosRestantes}s
            </Badge>
          </div>
        </div>
        
        {esContenidoSolidario && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-3 py-2 sm:px-4 sm:py-2.5 border-b">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                <span className="font-medium text-foreground">Tu atención hace la diferencia.</span>{" "}
                Al visualizar este contenido, ayudas a mantener SEG-APO activo como servicio gratuito para toda la comunidad de Tacna.
              </p>
            </div>
          </div>
        )}
        
        {!esContenidoSolidario && popupActual.tipo === "publicidad" && (
          <div className="bg-muted/50 px-3 py-1.5 sm:px-4 sm:py-2 border-b">
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Esta publicidad permite mantener SEG-APO gratuito para todos.
              </p>
            </div>
          </div>
        )}
        
        {(popupActual.titulo || popupActual.tipoContenido) && (
          <div className="p-3 sm:p-4">
            {popupActual.titulo && (
              <h3 className="font-semibold text-base sm:text-lg leading-tight">{popupActual.titulo}</h3>
            )}
            {popupActual.tipoContenido && (
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">{popupActual.tipoContenido}</p>
            )}
          </div>
        )}
        
        <div className="border-t px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => manejarInteraccion("like")}
                className={`flex items-center gap-1 text-xs sm:text-sm transition-colors ${interaccionesUsuario.like ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                data-testid="button-like"
              >
                <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${interaccionesUsuario.like ? "fill-current" : ""}`} />
                <span>{getContador("like")}</span>
              </button>
              
              <button 
                onClick={() => manejarInteraccion("favorito")}
                className={`flex items-center gap-1 text-xs sm:text-sm transition-colors ${interaccionesUsuario.favorito ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                data-testid="button-favorito"
              >
                <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${interaccionesUsuario.favorito ? "fill-current" : ""}`} />
                <span>{getContador("favorito")}</span>
              </button>
              
              <button 
                onClick={() => setMostrarComentarios(!mostrarComentarios)}
                className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-comentarios"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{getContador("comentario")}</span>
              </button>
              
              {popupActual.tipo === "evento" && (
                <button 
                  onClick={agregarAlCalendario}
                  className={`flex items-center gap-1 text-xs sm:text-sm transition-colors ${interaccionesUsuario.calendario ? "text-purple-500" : "text-muted-foreground hover:text-purple-500"}`}
                  data-testid="button-calendario"
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{getContador("calendario")}</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => compartirEnRedSocial("facebook")}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-blue-600 transition-colors"
                data-testid="button-share-facebook"
              >
                <SiFacebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button 
                onClick={() => compartirEnRedSocial("twitter")}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-sky-500 transition-colors"
                data-testid="button-share-twitter"
              >
                <SiX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button 
                onClick={() => compartirEnRedSocial("whatsapp")}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-green-500 transition-colors"
                data-testid="button-share-whatsapp"
              >
                <SiWhatsapp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button 
                onClick={() => compartirEnRedSocial("copy")}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-share-copy"
              >
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
          
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            <span>{getContador("compartir")} compartidos</span>
          </div>
        </div>
        
        {mostrarComentarios && (
          <div className="border-t px-3 py-2 sm:px-4 sm:py-3 max-h-40 sm:max-h-48 overflow-y-auto">
            <div className="space-y-2 sm:space-y-3">
              {(comentarios as any[]).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No hay comentarios aún</p>
              )}
              {(comentarios as any[]).map((comentario: any) => (
                <div key={comentario.id} className="flex gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] sm:text-xs font-medium">U</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm break-words">{comentario.texto}</p>
                  </div>
                </div>
              ))}
              
              {isAuthenticated && (
                <div className="flex gap-2 mt-2 sm:mt-3">
                  <input
                    type="text"
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 min-w-0 text-xs sm:text-sm border rounded px-2 py-1.5 sm:px-3 sm:py-2 bg-background"
                    data-testid="input-comentario"
                    onKeyDown={(e) => e.key === "Enter" && enviarComentario()}
                  />
                  <Button 
                    size="sm" 
                    onClick={enviarComentario}
                    disabled={comentarioMutation.isPending}
                    className="h-7 sm:h-8 px-2 sm:px-3"
                    data-testid="button-enviar-comentario"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
