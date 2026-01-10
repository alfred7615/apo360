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
  MapPin,
  X,
  Send,
  Trash2,
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
    setPanOffset({ x: 0, y: 0 });
    setInitialPinchDistance(null);
  }, []);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialZoom(zoomLevel);
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [zoomLevel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 1), 5);
    setZoomLevel(newZoom);
    
    if (newZoom <= 1) {
      resetZoom();
    }
  }, [zoomLevel, resetZoom]);

  const handleDoubleClick = useCallback(() => {
    if (zoomLevel > 1) {
      resetZoom();
    } else {
      setZoomLevel(2.5);
      setPanOffset({ x: 0, y: 0 });
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
      toast({ title: "Agendado", description: "El evento se agregó a tu calendario con recordatorio 1 hora antes" });
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
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://www.apo360.net`;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${publicidad.titulo || "Imagen"} - APO-360</title>
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #333;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              .content {
                flex: 1;
                padding: 20px;
              }
              .image-container {
                text-align: center;
                margin-bottom: 30px;
              }
              .image-container img {
                max-width: 100%;
                max-height: 60vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #8B5CF6;
                margin-bottom: 15px;
                text-align: center;
              }
              .description {
                font-size: 14px;
                line-height: 1.6;
                color: #555;
                text-align: justify;
                padding: 15px;
                background: #f9f9f9;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .event-date {
                font-size: 14px;
                color: #8B5CF6;
                text-align: center;
                margin-bottom: 20px;
                padding: 10px;
                background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
                color: white;
                border-radius: 8px;
              }
              .footer {
                background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
                color: white;
                padding: 20px;
                margin-top: auto;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              }
              .footer-info {
                flex: 1;
              }
              .footer-info h3 {
                font-size: 20px;
                margin-bottom: 10px;
              }
              .footer-info p {
                font-size: 12px;
                line-height: 1.5;
                margin-bottom: 5px;
              }
              .footer-qr {
                text-align: center;
              }
              .footer-qr img {
                background: white;
                padding: 8px;
                border-radius: 8px;
              }
              .footer-qr p {
                font-size: 10px;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="content">
              <div class="image-container">
                <img src="${publicidad.imagenUrl}" alt="${publicidad.titulo || 'Imagen'}" />
              </div>
              
              ${publicidad.titulo ? `<h1 class="title">${publicidad.titulo}</h1>` : ''}
              
              ${publicidad.fechaEvento ? `
                <div class="event-date">
                  Fecha del Evento: ${new Date(publicidad.fechaEvento).toLocaleDateString('es-PE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              ` : ''}
              
              ${publicidad.descripcion ? `<div class="description">${publicidad.descripcion}</div>` : ''}
            </div>
            
            <div class="footer">
              <div class="footer-info">
                <h3>APO-360</h3>
                <p><strong>Sistema de Seguridad y Apoyo Comunitario</strong></p>
                <p>Plataforma integral de seguridad ciudadana, servicios de emergencia, taxi, delivery y comercio local para la comunidad de Tacna, Perú.</p>
                <p style="margin-top: 10px;">
                  <strong>Contacto:</strong> www.apo360.net<br/>
                  Tacna, Perú
                </p>
              </div>
              <div class="footer-qr">
                <img src="${qrCodeUrl}" alt="QR Code" width="100" height="100" />
                <p>Escanea para visitar<br/>www.apo360.net</p>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAgendar = () => {
    if (!publicidad) return;
    
    agendaMutation.mutate();
    
    const titulo = encodeURIComponent(publicidad.titulo || "Evento APO-360");
    const descripcion = encodeURIComponent(publicidad.descripcion || "");
    
    let fechaEventoDate: Date;
    if (publicidad.fechaEvento) {
      fechaEventoDate = new Date(publicidad.fechaEvento);
    } else if (publicidad.fechaInicio) {
      fechaEventoDate = new Date(publicidad.fechaInicio);
    } else {
      fechaEventoDate = new Date(Date.now() + 86400000);
    }
    
    const fechaRecordatorio = new Date(fechaEventoDate.getTime() - 3600000);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, "");
    };
    
    const fechaInicio = formatGoogleDate(fechaEventoDate);
    const fechaFin = formatGoogleDate(new Date(fechaEventoDate.getTime() + 3600000));
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&details=${descripcion}&dates=${fechaInicio}/${fechaFin}&reminder=60`;
    window.open(googleCalendarUrl, "_blank");
  };

  const handleCompartir = (redSocial: string) => {
    if (!publicidad) return;
    
    compartirMutation.mutate(redSocial);
    
    const url = encodeURIComponent(window.location.href);
    const texto = encodeURIComponent(publicidad.titulo || "Mira esto en APO-360");
    
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
          
          {/* Botón de salir - MÁS GRANDE y fijo en esquina superior derecha */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[100] bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all duration-150 flex items-center justify-center"
            style={{ width: "56px", height: "56px" }}
            data-testid="button-cerrar-visualizador"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Título centrado en la parte superior */}
          {publicidad.titulo && (
            <div className="absolute top-4 left-4 right-20 z-50">
              <h3 
                className="text-white font-semibold text-sm sm:text-base md:text-lg text-center bg-black/60 px-4 py-2 rounded-lg line-clamp-1" 
                data-testid="titulo-publicidad"
              >
                {publicidad.titulo}
              </h3>
            </div>
          )}

          {/* Fecha del evento si existe */}
          {publicidad.fechaEvento && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs sm:text-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(publicidad.fechaEvento).toLocaleDateString('es-PE', { 
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}

          {/* Imagen con zoom - scroll=zoom, arrastrar=pan, doble clic=toggle */}
          <div 
            ref={imageContainerRef}
            className={`absolute inset-0 flex items-center justify-center overflow-hidden z-10 ${
              zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'
            } ${isPanning ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
          >
            <img
              ref={imageRef}
              src={publicidad.imagenUrl || undefined}
              alt={publicidad.titulo || "Imagen"}
              className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out select-none"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              }}
              draggable={false}
              data-testid="img-visualizador-completo"
            />
          </div>

          {/* Panel izquierdo: Redes sociales y ubicación */}
          {(tieneRedesSociales || tieneUbicacion) && (
            <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/60 rounded-full p-2 z-50">
              {tieneUbicacion && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={abrirMapa}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-ubicacion"
                >
                  <MapPin className="h-5 w-5 text-green-400" />
                </Button>
              )}
              
              {publicidad.facebook && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.facebook!)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-facebook"
                >
                  <SiFacebook className="h-5 w-5 text-blue-500" />
                </Button>
              )}
              
              {publicidad.instagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.instagram!)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-instagram"
                >
                  <SiInstagram className="h-5 w-5 text-pink-500" />
                </Button>
              )}
              
              {publicidad.whatsapp && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(`https://wa.me/${publicidad.whatsapp}`)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-whatsapp"
                >
                  <SiWhatsapp className="h-5 w-5 text-green-500" />
                </Button>
              )}
              
              {publicidad.tiktok && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.tiktok!)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-tiktok"
                >
                  <SiTiktok className="h-5 w-5" />
                </Button>
              )}
              
              {publicidad.twitter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.twitter!)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-twitter"
                >
                  <SiX className="h-5 w-5" />
                </Button>
              )}
              
              {publicidad.youtube && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.youtube!)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-youtube"
                >
                  <SiYoutube className="h-5 w-5 text-red-500" />
                </Button>
              )}
              
              {publicidad.linkedin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirRedSocial(publicidad.linkedin!)}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  data-testid="button-linkedin"
                >
                  <SiLinkedin className="h-5 w-5 text-blue-600" />
                </Button>
              )}
            </div>
          )}

          {/* Panel derecho FIJO: Iconos de interacción con contadores al costado (horizontal) */}
          <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-black/60 rounded-2xl p-3 z-50">
            {/* Me gusta */}
            <div className="flex items-center gap-2" data-testid="interaction-like">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => likeMutation.mutate()}
                className={`text-white hover:bg-white/20 rounded-full h-10 w-10 ${misInteracciones?.hasLike ? "text-blue-500" : ""}`}
                data-testid="button-like"
              >
                <ThumbsUp className={`h-5 w-5 ${misInteracciones?.hasLike ? "fill-blue-500" : ""}`} />
              </Button>
              <span className="text-white text-sm min-w-[24px]" data-testid="contador-likes">
                {contadores?.likes ?? 0}
              </span>
            </div>

            {/* Favorito */}
            <div className="flex items-center gap-2" data-testid="interaction-favorito">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => favoritoMutation.mutate()}
                className={`text-white hover:bg-white/20 rounded-full h-10 w-10 ${misInteracciones?.hasFavorito ? "text-red-500" : ""}`}
                data-testid="button-favorito"
              >
                <Heart className={`h-5 w-5 ${misInteracciones?.hasFavorito ? "fill-red-500" : ""}`} />
              </Button>
              <span className="text-white text-sm min-w-[24px]" data-testid="contador-favoritos">
                {contadores?.favoritos ?? 0}
              </span>
            </div>

            {/* Comentarios */}
            <div className="flex items-center gap-2" data-testid="interaction-comentarios">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setComentariosAbiertos(true)}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                data-testid="button-comentarios"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm min-w-[24px]" data-testid="contador-comentarios">
                {contadores?.comentarios ?? 0}
              </span>
            </div>

            {/* Agenda/Calendario */}
            <div className="flex items-center gap-2" data-testid="interaction-agenda">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAgendar}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                data-testid="button-agenda"
              >
                <Calendar className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm min-w-[24px]" data-testid="contador-agendados">
                {contadores?.agendados ?? 0}
              </span>
            </div>

            {/* Compartir */}
            <div className="flex items-center gap-2" data-testid="interaction-compartir">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompartirAbierto(true)}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                data-testid="button-compartir"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm min-w-[24px]" data-testid="contador-compartidos">
                {contadores?.compartidos ?? 0}
              </span>
            </div>

            {/* Imprimir */}
            <div className="flex items-center gap-2" data-testid="interaction-imprimir">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImprimir}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                data-testid="button-imprimir"
              >
                <Printer className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm min-w-[24px]" data-testid="contador-impresiones">
                {contadores?.impresiones ?? 0}
              </span>
            </div>
          </div>

          {/* Descripción en la parte inferior */}
          {publicidad.descripcion && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg max-w-2xl text-center z-40 mx-4">
              <p className="text-gray-300 text-sm line-clamp-3" data-testid="descripcion-publicidad">
                {publicidad.descripcion}
              </p>
            </div>
          )}

          {/* Indicador de zoom */}
          {zoomLevel > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full z-50">
              Zoom: {Math.round(zoomLevel * 100)}% | Doble clic para restablecer
            </div>
          )}
        </div>

        {/* Modal de comentarios */}
        <Dialog open={comentariosAbiertos} onOpenChange={setComentariosAbiertos}>
          <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto mx-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Comentarios</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-64 pr-4">
              {comentarios?.length === 0 && (
                <p className="text-muted-foreground text-center py-8 text-sm">No hay comentarios aún</p>
              )}
              {comentarios?.map((comentario) => (
                <div key={comentario.id} className="flex gap-3 mb-4" data-testid={`comentario-${comentario.id}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comentario.profile_image_url} />
                    <AvatarFallback className="text-xs">
                      {comentario.first_name?.[0]}{comentario.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {comentario.first_name} {comentario.last_name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => eliminarComentarioMutation.mutate(comentario.id)}
                        data-testid={`button-eliminar-comentario-${comentario.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground break-words">{comentario.contenido}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comentario.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </ScrollArea>
            
            <div className="flex gap-2 mt-4">
              <Textarea
                placeholder="Escribe un comentario..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                className="flex-1 text-sm min-h-[80px]"
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

        {/* Modal de compartir */}
        <Dialog open={compartirAbierto} onOpenChange={setCompartirAbierto}>
          <DialogContent className="w-[90vw] max-w-xs mx-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="text-lg">Compartir en</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-4 gap-4">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleCompartir("facebook")}
                data-testid="compartir-facebook"
              >
                <SiFacebook className="h-8 w-8 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleCompartir("twitter")}
                data-testid="compartir-twitter"
              >
                <SiX className="h-8 w-8" />
                <span className="text-xs">X</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleCompartir("whatsapp")}
                data-testid="compartir-whatsapp"
              >
                <SiWhatsapp className="h-8 w-8 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleCompartir("linkedin")}
                data-testid="compartir-linkedin"
              >
                <SiLinkedin className="h-8 w-8 text-blue-600" />
                <span className="text-xs">LinkedIn</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
