import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ImageEditor } from "@/components/ImageEditor";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      onImageUpdated?.(data.imagenPerfil || data.url);
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

  const handleImageSave = async (dataUrl: string) => {
    setUploading(true);
    try {
      const blob = await fetch(dataUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append('imagen', blob, 'profile.jpg');
      
      uploadMutation.mutate(formData, {
        onSuccess: () => {
          setUploading(false);
          setEditorOpen(false);
        },
        onError: () => {
          setUploading(false);
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen",
        variant: "destructive"
      });
      setUploading(false);
    }
  };

  return (
    <>
      <div 
        className="relative group cursor-pointer"
        onClick={() => setEditorOpen(true)}
        data-testid="profile-image-capture"
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-primary/20 hover:border-primary/50 transition-colors`}>
          {uploading || uploadMutation.isPending ? (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <AvatarImage src={imagenActual} alt={nombre} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {obtenerIniciales(nombre)}
              </AvatarFallback>
            </>
          )}
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full border-2 border-background">
          <Camera className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>

      <ImageEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleImageSave}
        aspectRatio={1}
        title="Editar Foto de Perfil"
      />
    </>
  );
}
