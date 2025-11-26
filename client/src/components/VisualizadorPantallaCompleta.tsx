import { useState, useEffect } from "react";
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
  Star,
  MessageCircle,
  Calendar,
  Share2,
  Printer,
  ArrowLeft,
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
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95" aria-describedby={undefined}>
        <DialogTitle className="sr-only">
          {publicidad.titulo || "Visualizador de imagen"}
        </DialogTitle>
        <div className="relative w-full h-full flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 left-4 z-50 text-white hover:bg-white/20 rounded-full"
            data-testid="button-cerrar-visualizador"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="absolute inset-0 flex items-center justify-center px-16 py-4">
            <img
              src={publicidad.imagenUrl || undefined}
              alt={publicidad.titulo || "Imagen"}
              className="max-h-full max-w-full object-contain"
              style={{ maxHeight: "calc(100vh - 120px)" }}
              data-testid="img-visualizador-completo"
            />
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-black/50 rounded-full p-3">
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => likeMutation.mutate()}
                className={`text-white hover:bg-white/20 rounded-full ${misInteracciones?.hasLike ? "text-red-500" : ""}`}
                data-testid="button-like"
              >
                <Heart className={`h-6 w-6 ${misInteracciones?.hasLike ? "fill-red-500" : ""}`} />
              </Button>
              <span className="text-white text-xs" data-testid="contador-likes">{contadores?.likes || 0}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => favoritoMutation.mutate()}
                className={`text-white hover:bg-white/20 rounded-full ${misInteracciones?.hasFavorito ? "text-yellow-400" : ""}`}
                data-testid="button-favorito"
              >
                <Star className={`h-6 w-6 ${misInteracciones?.hasFavorito ? "fill-yellow-400" : ""}`} />
              </Button>
              <span className="text-white text-xs" data-testid="contador-favoritos">{contadores?.favoritos || 0}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setComentariosAbiertos(true)}
                className="text-white hover:bg-white/20 rounded-full"
                data-testid="button-comentarios"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs" data-testid="contador-comentarios">{contadores?.comentarios || 0}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAgendar}
                className="text-white hover:bg-white/20 rounded-full"
                data-testid="button-agenda"
              >
                <Calendar className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs" data-testid="contador-agendados">{contadores?.agendados || 0}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompartirAbierto(true)}
                className="text-white hover:bg-white/20 rounded-full"
                data-testid="button-compartir"
              >
                <Share2 className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs" data-testid="contador-compartidos">{contadores?.compartidos || 0}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImprimir}
                className="text-white hover:bg-white/20 rounded-full"
                data-testid="button-imprimir"
              >
                <Printer className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs" data-testid="contador-impresiones">{contadores?.impresiones || 0}</span>
            </div>
          </div>

          {(tieneRedesSociales || tieneUbicacion) && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-black/50 rounded-full p-3">
              {tieneUbicacion && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={abrirMapa}
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
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
                  className="text-white hover:bg-white/20 rounded-full"
                  data-testid="button-linkedin"
                >
                  <SiLinkedin className="h-5 w-5 text-blue-600" />
                </Button>
              )}
            </div>
          )}

          {publicidad.titulo && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-3 rounded-lg max-w-lg text-center">
              <h3 className="text-white font-semibold text-lg" data-testid="titulo-publicidad">
                {publicidad.titulo}
              </h3>
              {publicidad.descripcion && (
                <p className="text-gray-300 text-sm mt-1" data-testid="descripcion-publicidad">
                  {publicidad.descripcion}
                </p>
              )}
            </div>
          )}
        </div>

        <Dialog open={comentariosAbiertos} onOpenChange={setComentariosAbiertos}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Comentarios</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-64 pr-4">
              {comentarios?.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No hay comentarios aún</p>
              )}
              {comentarios?.map((comentario) => (
                <div key={comentario.id} className="flex gap-3 mb-4" data-testid={`comentario-${comentario.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comentario.profile_image_url} />
                    <AvatarFallback>
                      {comentario.first_name?.[0]}{comentario.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {comentario.first_name} {comentario.last_name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => eliminarComentarioMutation.mutate(comentario.id)}
                        data-testid={`button-eliminar-comentario-${comentario.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{comentario.contenido}</p>
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
                className="flex-1"
                data-testid="input-comentario"
              />
              <Button
                onClick={() => comentarioMutation.mutate(nuevoComentario)}
                disabled={!nuevoComentario.trim() || comentarioMutation.isPending}
                data-testid="button-enviar-comentario"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={compartirAbierto} onOpenChange={setCompartirAbierto}>
          <DialogContent className="max-w-xs" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Compartir en</DialogTitle>
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
                <SiLinkedin className="h-8 w-8 text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
