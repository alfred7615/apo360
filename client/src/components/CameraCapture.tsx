import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Camera, X, Check, RotateCcw, ZoomIn, ZoomOut, 
  FlipHorizontal, FlipVertical, Move, Upload, Loader2, Video, Crop, Square
} from "lucide-react";

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  aspectRatio?: number;
  title?: string;
  description?: string;
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
  aspectRatio = 4 / 3,
  title = "Subir Foto y Editar",
  description = "Captura o sube una imagen para editar",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Cámara ${index + 1}`,
        }));
      
      setCameras(videoDevices);
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error al enumerar cámaras:", err);
    }
  }, [selectedCamera]);

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      await enumerateCameras();
      
    } catch (err: any) {
      console.error("Error al acceder a la cámara:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos o usa 'Subir Archivo'.");
      await enumerateCameras();
    } finally {
      setIsLoading(false);
    }
  }, [stream, enumerateCameras]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera(selectedCamera || undefined);
    }
    return () => {
      if (!open) {
        stopCamera();
      }
    };
  }, [open]);

  useEffect(() => {
    if (open && selectedCamera && !capturedImage) {
      startCamera(selectedCamera);
    }
  }, [selectedCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedImage(result);
      stopCamera();
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCropArea(null);
    setIsCropping(false);
    resetEdits();
    startCamera(selectedCamera || undefined);
  };

  const resetEdits = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setOffsetX(0);
    setOffsetY(0);
    setCropArea(null);
    setIsCropping(false);
  };

  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !cropStart || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const x = Math.min(cropStart.x, currentX);
    const y = Math.min(cropStart.y, currentY);
    const width = Math.abs(currentX - cropStart.x);
    const height = Math.abs(currentY - cropStart.y);
    
    setCropArea({ x, y, width, height });
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setCropStart(null);
  };

  const applyCrop = () => {
    if (!cropArea || !capturedImage || !cropCanvasRef.current || !imageContainerRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = cropCanvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      const containerRect = imageContainerRef.current!.getBoundingClientRect();
      const scaleX = img.width / containerRect.width;
      const scaleY = img.height / containerRect.height;
      
      const cropX = cropArea.x * scaleX;
      const cropY = cropArea.y * scaleY;
      const cropW = cropArea.width * scaleX;
      const cropH = cropArea.height * scaleY;
      
      canvas.width = cropW;
      canvas.height = cropH;
      
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCapturedImage(croppedDataUrl);
      setCropArea(null);
      setIsCropping(false);
    };
    img.src = capturedImage;
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    
    const canvas = canvasRef.current;
    const cropCanvas = cropCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const cropCtx = cropCanvas?.getContext("2d");
    
    if (!canvas || !ctx) {
      onCapture(capturedImage);
      handleClose();
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const containerRect = imageContainerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        onCapture(capturedImage);
        handleClose();
        return;
      }
      
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // PASO 1: Renderizar la imagen con TODAS las transformaciones aplicadas en un canvas temporal
      // Este canvas representa exactamente lo que el usuario ve en pantalla
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        onCapture(capturedImage);
        handleClose();
        return;
      }
      
      // El canvas temporal tiene el mismo tamaño que el contenedor visual
      tempCanvas.width = containerWidth;
      tempCanvas.height = containerHeight;
      
      // Calcular el tamaño de la imagen mostrada con object-fit: contain
      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;
      
      let displayedWidth, displayedHeight, displayOffsetX, displayOffsetY;
      
      if (imgAspect > containerAspect) {
        displayedWidth = containerWidth;
        displayedHeight = containerWidth / imgAspect;
        displayOffsetX = 0;
        displayOffsetY = (containerHeight - displayedHeight) / 2;
      } else {
        displayedHeight = containerHeight;
        displayedWidth = containerHeight * imgAspect;
        displayOffsetX = (containerWidth - displayedWidth) / 2;
        displayOffsetY = 0;
      }
      
      // Aplicar las mismas transformaciones CSS al canvas temporal
      tempCtx.fillStyle = "#000";
      tempCtx.fillRect(0, 0, containerWidth, containerHeight);
      
      tempCtx.save();
      tempCtx.translate(containerWidth / 2, containerHeight / 2);
      tempCtx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.translate(offsetX, offsetY);
      
      // Dibujar la imagen centrada
      tempCtx.drawImage(
        img,
        -displayedWidth / 2,
        -displayedHeight / 2,
        displayedWidth,
        displayedHeight
      );
      tempCtx.restore();
      
      // PASO 2: Si hay área de recorte, extraer esa porción del canvas transformado
      if (cropArea && cropArea.width > 10 && cropArea.height > 10 && cropCanvas && cropCtx) {
        // El área de recorte está en coordenadas del contenedor, 
        // que coinciden exactamente con las coordenadas del canvas temporal
        const cropX = Math.max(0, Math.min(cropArea.x, containerWidth - 1));
        const cropY = Math.max(0, Math.min(cropArea.y, containerHeight - 1));
        const cropW = Math.min(cropArea.width, containerWidth - cropX);
        const cropH = Math.min(cropArea.height, containerHeight - cropY);
        
        // Calcular el tamaño final manteniendo la proporción
        const maxWidth = 800;
        const scale = cropW > maxWidth ? maxWidth / cropW : 1;
        const finalWidth = Math.round(cropW * scale);
        const finalHeight = Math.round(cropH * scale);
        
        cropCanvas.width = finalWidth;
        cropCanvas.height = finalHeight;
        
        // Extraer el área recortada del canvas transformado
        cropCtx.drawImage(
          tempCanvas,
          cropX, cropY, cropW, cropH,  // Área fuente del canvas transformado
          0, 0, finalWidth, finalHeight  // Destino en el canvas final
        );
        
        const finalDataUrl = cropCanvas.toDataURL("image/jpeg", 0.9);
        onCapture(finalDataUrl);
        handleClose();
      } else {
        // Sin área de recorte, usar el canvas transformado completo
        // Pero redimensionar al tamaño objetivo
        let targetWidth = 800;
        let targetHeight = targetWidth / aspectRatio;
        
        if (containerWidth < targetWidth) {
          targetWidth = containerWidth;
          targetHeight = containerHeight;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        ctx.drawImage(
          tempCanvas,
          0, 0, containerWidth, containerHeight,
          0, 0, targetWidth, targetHeight
        );
        
        const finalDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        onCapture(finalDataUrl);
        handleClose();
      }
    };
    img.src = capturedImage;
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCropArea(null);
    setIsCropping(false);
    resetEdits();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!capturedImage && cameras.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Video className="h-3 w-3" />
                Seleccionar Cámara
              </Label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger className="h-8" data-testid="select-camera">
                  <SelectValue placeholder="Selecciona una cámara" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div 
            ref={imageContainerRef}
            className={`relative bg-black rounded-lg overflow-hidden ${isCropping ? 'cursor-crosshair' : ''}`}
            style={{ aspectRatio: aspectRatio.toString() }}
            onMouseDown={handleCropMouseDown}
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
          >
            {!capturedImage && (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                    <p className="text-white text-sm text-center mb-4">{error}</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Archivo
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {capturedImage && (
              <>
                <img
                  src={capturedImage}
                  alt="Captura"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${flipH ? -zoom : zoom}, ${flipV ? -zoom : zoom}) rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
                  }}
                  draggable={false}
                />
                
                {(isCropping || cropArea) && (
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                )}
                
                {cropArea && cropArea.width > 0 && cropArea.height > 0 && (
                  <>
                    <div
                      className={`absolute border-2 ${isCropping ? 'border-white border-dashed' : 'border-green-500 border-solid'} shadow-lg pointer-events-none`}
                      style={{
                        left: cropArea.x,
                        top: cropArea.y,
                        width: cropArea.width,
                        height: cropArea.height,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={capturedImage}
                          alt="Área seleccionada"
                          className="absolute"
                          style={{
                            transform: `scale(${flipH ? -zoom : zoom}, ${flipV ? -zoom : zoom}) rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
                            left: -cropArea.x,
                            top: -cropArea.y,
                            width: imageContainerRef.current?.clientWidth || 'auto',
                            height: imageContainerRef.current?.clientHeight || 'auto',
                            objectFit: 'contain',
                          }}
                          draggable={false}
                        />
                      </div>
                    </div>
                    {!isCropping && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                        Área a recortar
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={cropCanvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {capturedImage && (
            <div className="space-y-3 bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  onValueChange={(v) => setZoom(v[0])}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="flex-1"
                  data-testid="slider-zoom"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  data-testid="button-rotar-izq"
                  title="Rotar izquierda"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  data-testid="button-rotar-der"
                  title="Rotar derecha"
                >
                  <RotateCcw className="h-4 w-4 scale-x-[-1]" />
                </Button>
                <Button
                  size="sm"
                  variant={flipH ? "default" : "outline"}
                  onClick={() => setFlipH(!flipH)}
                  data-testid="button-voltear-h"
                  title="Espejo horizontal"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={flipV ? "default" : "outline"}
                  onClick={() => setFlipV(!flipV)}
                  data-testid="button-voltear-v"
                  title="Espejo vertical"
                >
                  <FlipVertical className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={isCropping ? "default" : cropArea ? "secondary" : "outline"}
                  onClick={() => setIsCropping(!isCropping)}
                  data-testid="button-recortar"
                  title={cropArea ? "Área seleccionada - Click para editar" : "Recortar área"}
                >
                  <Crop className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetEdits}
                  data-testid="button-reset-edicion"
                  title="Restablecer"
                >
                  <Move className="h-4 w-4" />
                </Button>
              </div>
              
              {isCropping && (
                <div className="flex items-center justify-center gap-2 p-2 bg-primary/10 rounded text-sm">
                  <Square className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {cropArea && cropArea.width > 10 
                      ? "Área seleccionada - Dibuja de nuevo para cambiar"
                      : "Dibuja un rectángulo para seleccionar el área"
                    }
                  </span>
                  {cropArea && cropArea.width > 10 && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setCropArea(null)} 
                      data-testid="button-limpiar-recorte"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
              )}
              
              {!isCropping && cropArea && cropArea.width > 10 && (
                <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">
                    Área de recorte seleccionada ({Math.round(cropArea.width)}x{Math.round(cropArea.height)}px)
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setCropArea(null)} 
                    className="text-destructive hover:text-destructive"
                    data-testid="button-eliminar-recorte"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">X:</span>
                  <Slider
                    value={[offsetX]}
                    onValueChange={(v) => setOffsetX(v[0])}
                    min={-100}
                    max={100}
                    step={5}
                    className="flex-1"
                    data-testid="slider-offset-x"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Y:</span>
                  <Slider
                    value={[offsetY]}
                    onValueChange={(v) => setOffsetY(v[0])}
                    min={-100}
                    max={100}
                    step={5}
                    className="flex-1"
                    data-testid="slider-offset-y"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {!capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-subir-archivo"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Subir
                </Button>
                <Button
                  onClick={handleCapture}
                  disabled={isLoading || !!error}
                  className="flex-1"
                  data-testid="button-capturar-foto"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Capturar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  data-testid="button-cancelar-camara"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  data-testid="button-retomar-foto"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Otra
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-cambiar-archivo"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                  data-testid="button-confirmar-foto"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Usar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CameraCaptureButtonProps {
  usuarioId?: string;
  imagenActual?: string | null;
  nombre?: string;
  onImageCapture: (imageDataUrl: string) => void;
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  aspectRatio?: number;
  title?: string;
}

export function CameraCaptureButton({ 
  usuarioId, 
  imagenActual, 
  nombre = "Usuario",
  onImageCapture,
  size = "lg",
  isLoading = false,
  aspectRatio = 1,
  title = "Editar Foto de Perfil"
}: CameraCaptureButtonProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };

  const obtenerIniciales = (nombre: string) => {
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div 
        className="relative group cursor-pointer"
        onClick={() => setEditorOpen(true)}
        data-testid="camera-capture-button"
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-primary/20 hover:border-primary/50 transition-colors`}>
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <AvatarImage src={imagenActual || undefined} alt={nombre} />
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

      <CameraCapture
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onCapture={onImageCapture}
        aspectRatio={aspectRatio}
        title={title}
        description="Captura o sube tu foto"
      />
    </>
  );
}

interface ImageUploadWithCameraProps {
  value?: string | null;
  onChange: (imageDataUrl: string) => void;
  placeholder?: string;
  aspectRatio?: number;
  className?: string;
  testId?: string;
  title?: string;
}

export function ImageUploadWithCamera({
  value,
  onChange,
  placeholder = "Subir imagen",
  aspectRatio = 1,
  className = "",
  testId = "image-upload",
  title = "Subir Foto y Editar"
}: ImageUploadWithCameraProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <>
      <div
        className={`relative border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
        onClick={() => setEditorOpen(true)}
        data-testid={testId}
      >
        {value ? (
          <img 
            src={value} 
            alt="Imagen" 
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">{placeholder}</span>
          </div>
        )}
      </div>

      <CameraCapture
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onCapture={onChange}
        aspectRatio={aspectRatio}
        title={title}
      />
    </>
  );
}
