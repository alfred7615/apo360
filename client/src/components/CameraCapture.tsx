import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Camera, X, Check, RotateCcw, ZoomIn, ZoomOut, 
  FlipHorizontal, Move, Upload, Loader2, Video, Crop, Square
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
    if (capturedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => {
          let targetWidth = 800;
          let targetHeight = targetWidth / aspectRatio;
          
          if (img.width < targetWidth) {
            targetWidth = img.width;
            targetHeight = img.height;
          }
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          
          ctx.save();
          ctx.translate(targetWidth / 2, targetHeight / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(flipH ? -zoom : zoom, zoom);
          
          const imgAspect = img.width / img.height;
          const canvasAspect = targetWidth / targetHeight;
          
          let drawWidth, drawHeight;
          if (imgAspect > canvasAspect) {
            drawHeight = targetHeight;
            drawWidth = targetHeight * imgAspect;
          } else {
            drawWidth = targetWidth;
            drawHeight = targetWidth / imgAspect;
          }
          
          ctx.drawImage(
            img,
            -drawWidth / 2 + offsetX * zoom,
            -drawHeight / 2 + offsetY * zoom,
            drawWidth,
            drawHeight
          );
          ctx.restore();
          
          const finalDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          onCapture(finalDataUrl);
          handleClose();
        };
        img.src = capturedImage;
      } else {
        onCapture(capturedImage);
        handleClose();
      }
    }
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
                    transform: `scale(${flipH ? -zoom : zoom}, ${zoom}) rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
                  }}
                  draggable={false}
                />
                
                {isCropping && (
                  <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                )}
                
                {cropArea && cropArea.width > 0 && cropArea.height > 0 && (
                  <div
                    className="absolute border-2 border-white border-dashed bg-white/10"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                  />
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
                  data-testid="button-voltear"
                  title="Voltear horizontal"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={isCropping ? "default" : "outline"}
                  onClick={() => {
                    setIsCropping(!isCropping);
                    if (isCropping) setCropArea(null);
                  }}
                  data-testid="button-recortar"
                  title="Recortar área"
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
                    Dibuja un rectángulo para seleccionar el área
                  </span>
                  {cropArea && cropArea.width > 10 && (
                    <Button size="sm" onClick={applyCrop} data-testid="button-aplicar-recorte">
                      <Check className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  )}
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
