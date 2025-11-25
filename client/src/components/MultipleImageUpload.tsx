import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface MultipleImageUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  disabled?: boolean;
  className?: string;
  endpoint?: 'publicidad' | 'galeria' | 'servicios' | 'documentos';
  maxSize?: number;
  maxFiles?: number;
  acceptedFormats?: string[];
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  url: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  error: string | null;
}

export function MultipleImageUpload({
  onImagesUploaded,
  disabled = false,
  className,
  endpoint = 'publicidad',
  maxSize = 15,
  maxFiles = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
}: MultipleImageUploadProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Formato no permitido. Solo se aceptan: ${acceptedFormats.join(', ')}`;
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `El archivo es muy grande. Tamaño máximo: ${maxSize}MB`;
    }

    return null;
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGlobalError(null);

    if (images.length + files.length > maxFiles) {
      setGlobalError(`No puedes subir más de ${maxFiles} imágenes a la vez`);
      return;
    }

    const newImages: ImageItem[] = files.map(file => {
      const validationError = validateFile(file);
      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        url: null,
        isUploading: false,
        isUploaded: false,
        error: validationError,
      };
    });

    setImages(prev => [...prev, ...newImages]);

    // Limpiar el input para permitir seleccionar los mismos archivos de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (imageId: string): Promise<string | null> => {
    const image = images.find(img => img.id === imageId);
    if (!image || image.error) return null;

    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, isUploading: true, error: null } : img
    ));

    try {
      const formData = new FormData();
      formData.append('imagen', image.file);

      const response = await fetch(`/api/upload/${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir imagen');
      }

      const data = await response.json();
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, url: data.url, isUploading: false, isUploaded: true } 
          : img
      ));

      return data.url;
    } catch (err) {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, error: err instanceof Error ? err.message : 'Error al subir', isUploading: false } 
          : img
      ));
      return null;
    }
  };

  const uploadAllImages = async () => {
    const imagesToUpload = images.filter(img => !img.isUploaded && !img.error && !img.isUploading);
    const uploadResults = await Promise.all(imagesToUpload.map(img => uploadImage(img.id)));
    
    // Filtrar solo las URLs exitosas (no null)
    const uploadedUrls = uploadResults.filter((url): url is string => url !== null);
    
    if (uploadedUrls.length > 0) {
      onImagesUploaded(uploadedUrls);
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== imageId);
      const image = prev.find(img => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return newImages;
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setGlobalError(null);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadedCount = images.filter(img => img.isUploaded).length;
  const errorCount = images.filter(img => img.error).length;

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        data-testid="input-multiple-images"
      />

      {images.length === 0 ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "relative w-full rounded-md border-2 border-dashed border-border py-12",
            "flex flex-col items-center justify-center gap-3",
            "hover:bg-muted/50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          data-testid="button-select-multiple-images"
        >
          <div className="rounded-full bg-primary/10 p-4">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium">Click para seleccionar múltiples imágenes</p>
            <p className="text-sm text-muted-foreground mt-1">
              {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} hasta {maxSize}MB por archivo
            </p>
            <p className="text-sm text-muted-foreground">
              Máximo {maxFiles} imágenes a la vez
            </p>
          </div>
          <Upload className="h-5 w-5 text-muted-foreground" />
        </button>
      ) : (
        <div className="space-y-4">
          {/* Estadísticas y acciones */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {images.length} imágenes seleccionadas
              {uploadedCount > 0 && ` • ${uploadedCount} subidas`}
              {errorCount > 0 && ` • ${errorCount} con errores`}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={disabled || images.length >= maxFiles}
                data-testid="button-add-more-images"
              >
                <Upload className="h-4 w-4 mr-2" />
                Agregar más
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={uploadAllImages}
                disabled={disabled || uploadedCount === images.length || errorCount === images.length}
                data-testid="button-upload-all-images"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Todas
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={clearAll}
                disabled={disabled}
                data-testid="button-clear-all-images"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Grilla de imágenes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(image => (
              <Card key={image.id} className={cn(
                "overflow-hidden",
                image.error && "border-destructive",
                image.isUploaded && "border-green-500"
              )}>
                <CardContent className="p-2">
                  <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    {image.isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    {image.isUploaded && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 h-6 w-6"
                      onClick={() => removeImage(image.id)}
                      disabled={image.isUploading}
                      data-testid={`button-remove-image-${image.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {image.error && (
                    <p className="text-xs text-destructive mt-1 line-clamp-2">{image.error}</p>
                  )}
                  {!image.error && !image.isUploaded && !image.isUploading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => uploadImage(image.id)}
                      data-testid={`button-upload-single-${image.id}`}
                    >
                      Subir
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {globalError && (
        <p className="text-sm text-destructive" data-testid="text-global-error">
          {globalError}
        </p>
      )}
    </div>
  );
}
