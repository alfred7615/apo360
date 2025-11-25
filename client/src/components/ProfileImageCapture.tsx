import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Upload, X, Check, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProfileImageCaptureProps {
  usuarioId: string;
  imagenActual?: string;
  nombre?: string;
  onImageUpdated?: (nuevaUrl: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ProfileImageCapture({ 
  usuarioId, 
  imagenActual, 
  nombre = "Usuario",
  onImageUpdated,
  size = "lg"
}: ProfileImageCaptureProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [modoCaptura, setModoCaptura] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/usuarios/${usuarioId}/foto`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir imagen');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios/me"] });
      toast({ title: "Foto actualizada", description: "Tu foto de perfil se ha actualizado correctamente" });
      onImageUpdated?.(data.imagenPerfil);
      cerrarModal();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al subir imagen", 
        description: error.message || "No se pudo actualizar la foto de perfil",
        variant: "destructive"
      });
    }
  });

  const obtenerIniciales = (nombre: string) => {
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const iniciarCamara = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      setModoCaptura(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const capturarFoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imagenData = canvas.toDataURL('image/jpeg', 0.8);
        setImagenPreview(imagenData);
        detenerCamara();
      }
    }
  }, []);

  const detenerCamara = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setModoCaptura(false);
  }, [stream]);

  const seleccionarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de archivo inválido",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarImagen = async () => {
    if (!imagenPreview) return;

    const blob = await fetch(imagenPreview).then(r => r.blob());
    const formData = new FormData();
    formData.append('imagen', blob, 'profile.jpg');
    
    uploadMutation.mutate(formData);
  };

  const cerrarModal = () => {
    detenerCamara();
    setImagenPreview(null);
    setModalOpen(false);
  };

  const reintentar = () => {
    setImagenPreview(null);
    iniciarCamara();
  };

  return (
    <>
      <div 
        className="relative group cursor-pointer"
        onClick={() => setModalOpen(true)}
        data-testid="profile-image-capture"
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-primary/20 hover:border-primary/50 transition-colors`}>
          <AvatarImage src={imagenActual} alt={nombre} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {obtenerIniciales(nombre)}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={cerrarModal}>
        <DialogContent className="sm:max-w-md" data-testid="modal-captura-foto">
          <DialogHeader>
            <DialogTitle>Actualizar Foto de Perfil</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {modoCaptura && !imagenPreview ? (
              <div className="relative">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="rounded-lg w-full max-w-sm"
                  data-testid="video-captura"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : imagenPreview ? (
              <div className="relative">
                <img 
                  src={imagenPreview} 
                  alt="Vista previa" 
                  className="rounded-lg w-full max-w-sm"
                  data-testid="img-preview"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <Avatar className="h-32 w-32 border-2 border-dashed border-muted-foreground/30">
                  <AvatarImage src={imagenActual} alt={nombre} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                    {obtenerIniciales(nombre)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground text-center">
                  Selecciona una opción para actualizar tu foto de perfil
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {modoCaptura && !imagenPreview ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={detenerCamara}
                  data-testid="button-cancelar-camara"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={capturarFoto}
                  data-testid="button-capturar"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
              </>
            ) : imagenPreview ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={reintentar}
                  data-testid="button-reintentar"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
                <Button 
                  onClick={guardarImagen}
                  disabled={uploadMutation.isPending}
                  data-testid="button-guardar-foto"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={iniciarCamara}
                  data-testid="button-usar-camara"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Usar Cámara
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-subir-archivo"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Imagen
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={seleccionarArchivo}
                  data-testid="input-archivo-imagen"
                />
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
