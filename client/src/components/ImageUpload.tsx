import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Pencil, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CameraCapture } from './CameraCapture';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  endpoint?: 'publicidad' | 'galeria' | 'servicios' | 'documentos';
  fileField?: string;
  maxSize?: number;
  acceptedFormats?: string[];
  enableEditor?: boolean;
  aspectRatio?: number;
}

// Función para convertir dataURL a Blob
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  endpoint = 'publicidad',
  fileField,
  maxSize = 15,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  enableEditor = true,
  aspectRatio = 16 / 9
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
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

  const uploadToServer = async (file: File | Blob): Promise<string | null> => {
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
      return data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setPreview(URL.createObjectURL(file));
    
    const url = await uploadToServer(file);
    if (url) {
      onChange(url);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  const handleEditorCapture = async (dataURL: string) => {
    setEditorOpen(false);
    setPreview(dataURL);
    
    const blob = dataURLtoBlob(dataURL);
    const url = await uploadToServer(blob);
    if (url) {
      onChange(url);
    } else {
      setPreview(null);
      onChange(null);
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

  const handleOpenEditor = () => {
    if (!disabled) {
      setEditorOpen(true);
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
              {enableEditor && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenEditor}
                  className="flex-1"
                  data-testid="button-edit-image"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClick}
                className="flex-1"
                data-testid="button-change-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                Cambiar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={enableEditor ? handleOpenEditor : handleClick}
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
                  {enableEditor ? (
                    <Camera className="h-6 w-6 text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {enableEditor ? 'Subir o capturar imagen' : 'Click para subir imagen'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} hasta {maxSize}MB
                  </p>
                </div>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>
          
          {enableEditor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClick}
              disabled={disabled || isUploading}
              className="w-full text-muted-foreground"
              data-testid="button-direct-upload"
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir sin editar
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid="text-upload-error">
          {error}
        </p>
      )}

      {enableEditor && (
        <CameraCapture
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onCapture={handleEditorCapture}
          aspectRatio={aspectRatio}
          title="Subir Foto y Editar"
          description="Captura o sube una imagen, luego edítala con las herramientas disponibles"
        />
      )}
    </div>
  );
}
