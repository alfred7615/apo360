import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  endpoint?: 'publicidad' | 'galeria' | 'servicios' | 'documentos';
  fileField?: string;
  maxSize?: number;
  acceptedFormats?: string[];
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  endpoint = 'publicidad',
  fileField,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUploading && value !== preview) {
      setPreview(value || null);
    }
  }, [value, isUploading]);

  const validateFile = (file: File): boolean => {
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato no permitido. Solo se aceptan: ${acceptedFormats.join(', ')}`);
      return false;
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`El archivo es muy grande. Tamaño máximo: ${maxSize}MB`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setPreview(URL.createObjectURL(file));
    
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      const fieldName = fileField || (endpoint === 'documentos' ? 'documento' : 'imagen');
      formData.append(fieldName, file);

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
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
      setPreview(null);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        data-testid="input-image-file"
      />

      {preview ? (
        <div className="space-y-2">
          <div 
            className="relative aspect-video rounded-md overflow-hidden border-2 border-border bg-muted"
            data-testid="image-preview"
          >
            <img
              src={preview}
              alt="Vista previa"
              className="w-full h-full object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          {!disabled && !isUploading && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClick}
                className="flex-1"
                data-testid="button-change-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                Cambiar Imagen
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className={cn(
            "relative aspect-video w-full rounded-md border-2 border-dashed border-border",
            "flex flex-col items-center justify-center gap-2",
            "hover:bg-muted/50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isUploading && "cursor-wait"
          )}
          data-testid="button-upload-image"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Subiendo imagen...</span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-3">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click para subir imagen</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} hasta {maxSize}MB
                </p>
              </div>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid="text-upload-error">
          {error}
        </p>
      )}
    </div>
  );
}
