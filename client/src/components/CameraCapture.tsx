import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Camera, X, Check, RotateCcw, ZoomIn, ZoomOut, 
  FlipHorizontal, Move, Upload, Loader2
} from "lucide-react";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  aspectRatio?: number;
  title?: string;
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
  aspectRatio = 4 / 3,
  title = "Capturar Foto",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
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
    } catch (err: any) {
      console.error("Error al acceder a la cámara:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos o usa 'Subir Archivo'.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera, capturedImage]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 640;
    const height = width / aspectRatio;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, zoom);
    ctx.drawImage(
      video,
      -video.videoWidth / 2 + offsetX,
      -video.videoHeight / 2 + offsetY,
      video.videoWidth,
      video.videoHeight
    );
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
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
  };

  const handleRetake = () => {
    setCapturedImage(null);
    resetEdits();
    startCamera();
  };

  const resetEdits = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      
      if (canvas && ctx) {
        const img = new Image();
        img.onload = () => {
          const width = 640;
          const height = width / aspectRatio;
          canvas.width = width;
          canvas.height = height;
          
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, width, height);
          
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(flipH ? -zoom : zoom, zoom);
          
          const imgAspect = img.width / img.height;
          const canvasAspect = width / height;
          
          let drawWidth, drawHeight;
          if (imgAspect > canvasAspect) {
            drawHeight = height;
            drawWidth = height * imgAspect;
          } else {
            drawWidth = width;
            drawHeight = width / imgAspect;
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
    resetEdits();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div 
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ aspectRatio: aspectRatio.toString() }}
          >
            {!capturedImage && (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{
                    transform: `scale(${flipH ? -zoom : zoom}, ${zoom}) rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
                  }}
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
              <img
                src={capturedImage}
                alt="Captura"
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${flipH ? -zoom : zoom}, ${zoom}) rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
                }}
              />
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
              
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  data-testid="button-rotar-izq"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  data-testid="button-rotar-der"
                >
                  <RotateCcw className="h-4 w-4 scale-x-[-1]" />
                </Button>
                <Button
                  size="sm"
                  variant={flipH ? "default" : "outline"}
                  onClick={() => setFlipH(!flipH)}
                  data-testid="button-voltear"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetEdits}
                  data-testid="button-reset-edicion"
                >
                  <Move className="h-4 w-4" />
                </Button>
              </div>
              
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

          <div className="flex items-center justify-between gap-2">
            {!capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-subir-archivo"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Archivo
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
                  Retomar
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                  data-testid="button-confirmar-foto"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Usar esta foto
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
