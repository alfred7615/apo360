import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Share2,
  Printer,
  ArrowLeft,
  MapPin,
  X,
  Send,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  SiFacebook,
  SiInstagram,
  SiWhatsapp,
  SiTiktok,
  SiX,
  SiYoutube,
  SiLinkedin,
} from "react-icons/si";
import type { Publicidad } from "@/lib/publicidadUtils";

interface VisualizadorPantallaCompletaProps {
  publicidad: Publicidad | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Contadores {
  likes: number;
  favoritos: number;
  compartidos: number;
  impresiones: number;
  comentarios: number;
  agendados: number;
}

interface Interacciones {
  hasLike: boolean;
  hasFavorito: boolean;
}

interface Comentario {
  id: string;
  contenido: string;
  created_at: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  usuario_id: string;
}

export default function VisualizadorPantallaCompleta({
  publicidad,
  isOpen,
  onClose,
}: VisualizadorPantallaCompletaProps) {
  const { toast } = useToast();
  const [comentariosAbiertos, setComentariosAbiertos] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [compartirAbierto, setCompartirAbierto] = useState(false);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { data: contadores, refetch: refetchContadores } = useQuery<Contadores>({
    queryKey: ["/api/publicidad", publicidad?.id, "contadores"],
    queryFn: async () => {
      if (!publicidad?.id) return { likes: 0, favoritos: 0, compartidos: 0, impresiones: 0, comentarios: 0, agendados: 0 };
      const res = await fetch(`/api/publicidad/${publicidad.id}/contadores`);
      return res.json();
    },
    enabled: !!publicidad?.id && isOpen,
  });

  const { data: misInteracciones, refetch: refetchInteracciones } = useQuery<Interacciones>({
    queryKey: ["/api/publicidad", publicidad?.id, "mis-interacciones"],
    queryFn: async () => {
      if (!publicidad?.id) return { hasLike: false, hasFavorito: false };
      const res = await fetch(`/api/publicidad/${publicidad.id}/mis-interacciones`);
      if (res.status === 401) return { hasLike: false, hasFavorito: false };
      return res.json();
    },
    enabled: !!publicidad?.id && isOpen,
  });

  const { data: comentarios, refetch: refetchComentarios } = useQuery<Comentario[]>({
    queryKey: ["/api/publicidad", publicidad?.id, "comentarios"],
    queryFn: async () => {
      if (!publicidad?.id) return [];
      const res = await fetch(`/api/publicidad/${publicidad.id}/comentarios`);
      return res.json();
    },
    enabled: !!publicidad?.id && isOpen && comentariosAbiertos,
  });

  useEffect(() => {
    if (!isOpen) {
      resetZoom();
    }
  }, [isOpen]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setZoomOrigin({ x: 50, y: 50 });
    setPanOffset({ x: 0, y: 0 });
    setInitialPinchDistance(null);
  }, []);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialZoom(zoomLevel);
      
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const midpoint = getMidpoint(e.touches[0], e.touches[1]);
        const x = ((midpoint.x - rect.left) / rect.width) * 100;
        const y = ((midpoint.y - rect.top) / rect.height) * 100;
        setZoomOrigin({ x, y });
      }
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setIsPanning(true);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.min(Math.max(initialZoom * scale, 1), 5);
      setZoomLevel(newZoom);
      
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const midpoint = getMidpoint(e.touches[0], e.touches[1]);
        const x = ((midpoint.x - rect.left) / rect.width) * 100;
        const y = ((midpoint.y - rect.top) / rect.height) * 100;
        setZoomOrigin({ x, y });
      }
    } else if (e.touches.length === 1 && isPanning && zoomLevel > 1) {
      const deltaX = e.touches[0].clientX - lastPanPoint.x;
      const deltaY = e.touches[0].clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [initialPinchDistance, initialZoom, isPanning, lastPanPoint, zoomLevel]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setInitialPinchDistance(null);
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
      if (zoomLevel <= 1) {
        resetZoom();
      }
    }
  }, [zoomLevel, resetZoom]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || zoomLevel === 1) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomOrigin({ x, y });
  };

  const handleMouseEnter = () => {
    setZoomLevel(2);
  };

  const handleMouseLeave = () => {
    resetZoom();
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 5);
    setZoomLevel(newZoom);
    
    if (newZoom <= 1) {
      resetZoom();
    } else if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin({ x, y });
    }
  }, [zoomLevel, resetZoom]);

  const handleDoubleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (zoomLevel > 1) {
      resetZoom();
    } else {
      setZoomLevel(2.5);
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0]?.clientX || rect.width / 2 : e.clientX;
        const clientY = 'touches' in e ? e.touches[0]?.clientY || rect.height / 2 : e.clientY;
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        setZoomOrigin({ x, y });
      }
    }
  }, [zoomLevel, resetZoom]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/publicidad/${publicidad?.id}/like`);
      return res.json();
    },
    onSuccess: () => {
      refetchContadores();
      refetchInteracciones();
    },
    onError: () => {
      toast({ title: "Error", description: "Debes iniciar sesión para dar me gusta", variant: "destructive" });
    },
  });

  const favoritoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/publicidad/${publicidad?.id}/favorito`);
      return res.json();
    },
    onSuccess: (data) => {
      refetchContadores();
      refetchInteracciones();
      toast({
        title: data.favorito ? "Agregado a favoritos" : "Eliminado de favoritos",
        description: data.favorito ? "Se guardó en tu perfil" : "Se eliminó de tu perfil",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar favoritos", variant: "destructive" });
    },
  });

  const compartirMutation = useMutation({
    mutationFn: async (redSocial: string) => {
      const res = await apiRequest("POST", `/api/publicidad/${publicidad?.id}/compartir`, { redSocial });
      return res.json();
    },
    onSuccess: () => {
      refetchContadores();
    },
  });

  const imprimirMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/publicidad/${publicidad?.id}/impresion`);
      return res.json();
    },
    onSuccess: () => {
      refetchContadores();
    },
  });

  const agendaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/publicidad/${publicidad?.id}/agenda`);
      return res.json();
    },
    onSuccess: () => {
      refetchContadores();
      toast({ title: "Agendado", description: "El evento se agregó a tu calendario" });
    },
    onError: () => {
      toast({ title: "Error", description: "Debes iniciar sesión para agendar", variant: "destructive" });
    },
  });

  const comentarioMutation = useMutation({
    mutationFn: async (contenido: string) => {
      const res = await apiRequest("POST", `/api/publicidad/${publicidad?.id}/comentarios`, { contenido });
      return res.json();
    },
    onSuccess: () => {
      setNuevoComentario("");
      refetchComentarios();
      refetchContadores();
      toast({ title: "Comentario agregado", description: "Tu comentario se publicó correctamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "Debes iniciar sesión para comentar", variant: "destructive" });
    },
  });

  const eliminarComentarioMutation = useMutation({
    mutationFn: async (comentarioId: string) => {
      const res = await apiRequest("DELETE", `/api/publicidad/${publicidad?.id}/comentarios/${comentarioId}`);
      return res.json();
    },
    onSuccess: () => {
      refetchComentarios();
      refetchContadores();
    },
  });

  const handleImprimir = () => {
    if (!publicidad?.imagenUrl) return;
    
    imprimirMutation.mutate();
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${publicidad.titulo || "Imagen"}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${publicidad.imagenUrl}" alt="${publicidad.titulo || 'Imagen'}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAgendar = () => {
    if (!publicidad) return;
    
    agendaMutation.mutate();
    
    const titulo = encodeURIComponent(publicidad.titulo || "Evento SEG-APO");
    const descripcion = encodeURIComponent(publicidad.descripcion || "");
    const fechaInicio = publicidad.fechaInicio 
      ? new Date(publicidad.fechaInicio).toISOString().replace(/-|:|\.\d{3}/g, "")
      : new Date().toISOString().replace(/-|:|\.\d{3}/g, "");
    const fechaFin = publicidad.fechaFin
      ? new Date(publicidad.fechaFin).toISOString().replace(/-|:|\.\d{3}/g, "")
      : new Date(Date.now() + 3600000).toISOString().replace(/-|:|\.\d{3}/g, "");
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&details=${descripcion}&dates=${fechaInicio}/${fechaFin}`;
    window.open(googleCalendarUrl, "_blank");
  };

  const handleCompartir = (redSocial: string) => {
    if (!publicidad) return;
    
    compartirMutation.mutate(redSocial);
    
    const url = encodeURIComponent(window.location.href);
    const texto = encodeURIComponent(publicidad.titulo || "Mira esto en SEG-APO");
    
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${texto}`,
      whatsapp: `https://wa.me/?text=${texto}%20${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${texto}`,
    };
    
    if (urls[redSocial]) {
      window.open(urls[redSocial], "_blank", "width=600,height=400");
    }
    
    setCompartirAbierto(false);
  };

  const abrirRedSocial = (url: string) => {
    if (url) {
      let finalUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        finalUrl = `https://${url}`;
      }
      window.open(finalUrl, "_blank");
    }
  };

  const abrirMapa = () => {
    if (publicidad?.latitud && publicidad?.longitud) {
      window.open(`https://www.google.com/maps?q=${publicidad.latitud},${publicidad.longitud}`, "_blank");
    }
  };

  const tieneRedesSociales = publicidad && (
    publicidad.facebook || publicidad.instagram || publicidad.whatsapp ||
    publicidad.tiktok || publicidad.twitter || publicidad.youtube || publicidad.linkedin
  );

  const tieneUbicacion = publicidad?.latitud && publicidad?.longitud;

  if (!publicidad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95" 
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {publicidad.titulo || "Visualizador de imagen"}
        </DialogTitle>
        <div className="relative w-full h-full flex flex-col touch-none">
          
          {/* Header: Botón salir + Título centrado - Responsivo */}
          <div className="absolute top-0 left-0 right-0 flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-black/80 to-transparent z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full shrink-0 h-8 w-8 sm:h-10 sm:w-10"
              data-testid="button-cerrar-visualizador"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            
            {publicidad.titulo && (
              <h3 
                className="flex-1 text-white font-semibold text-sm sm:text-base md:text-lg text-center pr-8 sm:pr-10 line-clamp-1" 
                data-testid="titulo-publicidad"
              >
                {publicidad.titulo}
              </h3>
            )}
          </div>

          {/* Controles de zoom para móvil */}
          <div className="absolute top-14 right-2 sm:right-4 flex flex-col gap-1 z-50 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))}
              className="text-white bg-black/50 hover:bg-white/20 rounded-full h-8 w-8"
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              className="text-white bg-black/50 hover:bg-white/20 rounded-full h-8 w-8"
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Imagen con zoom - autoajustable a los bordes */}
          <div 
            ref={imageContainerRef}
            className="absolute inset-0 top-12 sm:top-14 bottom-16 sm:bottom-20 md:bottom-24 flex items-center justify-center overflow-hidden cursor-zoom-in z-10"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleTap}
          >
            <img
              ref={imageRef}
              src={publicidad.imagenUrl || undefined}
              alt={publicidad.titulo || "Imagen"}
              className="w-full h-full object-contain transition-transform duration-150 ease-out select-none"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
              }}
              draggable={false}
              data-testid="img-visualizador-completo"
            />
          </div>

          {/* Panel izquierdo: Redes sociales y ubicación - Responsivo */}
          {(tieneRedesSociales || tieneUbicacion) && (
            <div className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 sm:gap-2 md:gap-3 bg-black/50 rounded-full p-1.5 sm:p-2 md:p-3 z-50">
              {tieneUbicacion && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={abrirMapa}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-ubicacion"
                >
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                </Button>
              )}
              
              {publicidad.facebook && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.facebook!)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-facebook"
                >
                  <SiFacebook className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </Button>
              )}
              
              {publicidad.instagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.instagram!)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-instagram"
                >
                  <SiInstagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                </Button>
              )}
              
              {publicidad.whatsapp && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(`https://wa.me/${publicidad.whatsapp}`)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-whatsapp"
                >
                  <SiWhatsapp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </Button>
              )}
              
              {publicidad.tiktok && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.tiktok!)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-tiktok"
                >
                  <SiTiktok className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              
              {publicidad.twitter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.twitter!)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-twitter"
                >
                  <SiX className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              
              {publicidad.youtube && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.youtube!)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-youtube"
                >
                  <SiYoutube className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </Button>
              )}
              
              {publicidad.linkedin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.linkedin!)}
                  className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                  data-testid="button-linkedin"
                >
                  <SiLinkedin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </Button>
              )}
            </div>
          )}

          {/* Barra inferior: Iconos de interacción - Responsivo */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-2 sm:px-4 py-2 sm:py-3 md:py-4 bg-gradient-to-t from-black/80 to-transparent z-50 flex-wrap">
            {/* Me gusta - Manito con pulgar arriba */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => likeMutation.mutate()}
                className={`text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ${misInteracciones?.hasLike ? "text-blue-500" : ""}`}
                data-testid="button-like"
              >
                <ThumbsUp className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${misInteracciones?.hasLike ? "fill-blue-500" : ""}`} />
              </Button>
              {(contadores?.likes ?? 0) > 0 && (
                <span className="text-white text-[10px] sm:text-xs" data-testid="contador-likes">{contadores?.likes}</span>
              )}
            </div>

            {/* Favorito - Corazón */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => favoritoMutation.mutate()}
                className={`text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ${misInteracciones?.hasFavorito ? "text-red-500" : ""}`}
                data-testid="button-favorito"
              >
                <Heart className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${misInteracciones?.hasFavorito ? "fill-red-500" : ""}`} />
              </Button>
              {(contadores?.favoritos ?? 0) > 0 && (
                <span className="text-white text-[10px] sm:text-xs" data-testid="contador-favoritos">{contadores?.favoritos}</span>
              )}
            </div>

            {/* Comentarios */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setComentariosAbiertos(true)}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                data-testid="button-comentarios"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </Button>
              {(contadores?.comentarios ?? 0) > 0 && (
                <span className="text-white text-[10px] sm:text-xs" data-testid="contador-comentarios">{contadores?.comentarios}</span>
              )}
            </div>

            {/* Agenda */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAgendar}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                data-testid="button-agenda"
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </Button>
              {(contadores?.agendados ?? 0) > 0 && (
                <span className="text-white text-[10px] sm:text-xs" data-testid="contador-agendados">{contadores?.agendados}</span>
              )}
            </div>

            {/* Compartir */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompartirAbierto(true)}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                data-testid="button-compartir"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </Button>
              {(contadores?.compartidos ?? 0) > 0 && (
                <span className="text-white text-[10px] sm:text-xs" data-testid="contador-compartidos">{contadores?.compartidos}</span>
              )}
            </div>

            {/* Imprimir - Oculto en móviles muy pequeños */}
            <div className="flex flex-col items-center hidden sm:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImprimir}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
                data-testid="button-imprimir"
              >
                <Printer className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </Button>
              {(contadores?.impresiones ?? 0) > 0 && (
                <span className="text-white text-[10px] sm:text-xs" data-testid="contador-impresiones">{contadores?.impresiones}</span>
              )}
            </div>
          </div>

          {/* Descripción (si existe) - Responsivo */}
          {publicidad.descripcion && (
            <div className="absolute bottom-16 sm:bottom-20 md:bottom-24 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto bg-black/70 px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg max-w-lg text-center z-40">
              <p className="text-gray-300 text-xs sm:text-sm line-clamp-2" data-testid="descripcion-publicidad">
                {publicidad.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Modal de comentarios - Responsivo */}
        <Dialog open={comentariosAbiertos} onOpenChange={setComentariosAbiertos}>
          <DialogContent className="w-[95vw] max-w-md mx-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Comentarios</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-48 sm:h-64 pr-2 sm:pr-4">
              {comentarios?.length === 0 && (
                <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">No hay comentarios aún</p>
              )}
              {comentarios?.map((comentario) => (
                <div key={comentario.id} className="flex gap-2 sm:gap-3 mb-3 sm:mb-4" data-testid={`comentario-${comentario.id}`}>
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                    <AvatarImage src={comentario.profile_image_url} />
                    <AvatarFallback className="text-xs">
                      {comentario.first_name?.[0]}{comentario.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-xs sm:text-sm truncate">
                        {comentario.first_name} {comentario.last_name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                        onClick={() => eliminarComentarioMutation.mutate(comentario.id)}
                        data-testid={`button-eliminar-comentario-${comentario.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">{comentario.contenido}</p>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(comentario.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </ScrollArea>
            
            <div className="flex gap-2 mt-3 sm:mt-4">
              <Textarea
                placeholder="Escribe un comentario..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="flex-1 text-sm min-h-[60px] sm:min-h-[80px]"
                data-testid="input-comentario"
              />
              <Button
                onClick={() => comentarioMutation.mutate(nuevoComentario)}
                disabled={!nuevoComentario.trim() || comentarioMutation.isPending}
                className="self-end"
                size="sm"
                data-testid="button-enviar-comentario"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de compartir - Responsivo */}
        <Dialog open={compartirAbierto} onOpenChange={setCompartirAbierto}>
          <DialogContent className="w-[90vw] max-w-xs mx-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Compartir en</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-2 sm:py-3"
                onClick={() => handleCompartir("facebook")}
                data-testid="compartir-facebook"
              >
                <SiFacebook className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <span className="text-[10px] sm:text-xs">Facebook</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-2 sm:py-3"
                onClick={() => handleCompartir("twitter")}
                data-testid="compartir-twitter"
              >
                <SiX className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="text-[10px] sm:text-xs">X</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-2 sm:py-3"
                onClick={() => handleCompartir("whatsapp")}
                data-testid="compartir-whatsapp"
              >
                <SiWhatsapp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                <span className="text-[10px] sm:text-xs">WhatsApp</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-2 sm:py-3"
                onClick={() => handleCompartir("linkedin")}
                data-testid="compartir-linkedin"
              >
                <SiLinkedin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <span className="text-[10px] sm:text-xs">LinkedIn</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
