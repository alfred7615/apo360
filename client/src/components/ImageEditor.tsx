import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Camera, Upload, RotateCcw, RotateCw, ZoomIn, ZoomOut, 
  Move, Check, X, Crop, FlipHorizontal, FlipVertical 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (imageDataUrl: string) => void;
  aspectRatio?: number;
  title?: string;
}

export function ImageEditor({
  open,
  onClose,
  onSave,
  aspectRatio = 1,
  title = "Editar Imagen"
}: ImageEditorProps) {
  const { toast } = useToast();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const CANVAS_SIZE = 300;

  const resetState = useCallback(() => {
    setImage(null);
    setImageUrl("");
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPosition({ x: 0, y: 0 });
    setShowCamera(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setImageUrl(event.target?.result as string);
          setPosition({ x: 0, y: 0 });
          setZoom(1);
          setRotation(0);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 640, height: 480 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara",
        variant: "destructive"
      });
    }
  };

  const captureFromCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setImageUrl(dataUrl);
          setPosition({ x: 0, y: 0 });
          setZoom(1);
          setRotation(0);
        };
        img.src = dataUrl;
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        setShowCamera(false);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !image) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!image || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !image || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const rotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleSave = () => {
    if (!image || !canvasRef.current) {
      toast({ title: "Error", description: "No hay imagen para guardar", variant: "destructive" });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize / aspectRatio;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    ctx.rotate((rotation * Math.PI) / 180);
    
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    
    ctx.scale(zoom, zoom);
    
    const scale = Math.max(
      canvas.width / image.width,
      canvas.height / image.height
    );
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    const offsetX = position.x * (scale / (CANVAS_SIZE / canvas.width));
    const offsetY = position.y * (scale / (CANVAS_SIZE / canvas.height));
    
    ctx.drawImage(
      image,
      -scaledWidth / 2 + offsetX,
      -scaledHeight / 2 + offsetY,
      scaledWidth,
      scaledHeight
    );
    
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  const renderPreview = () => {
    if (!image) return null;

    const scale = Math.max(
      CANVAS_SIZE / image.width,
      (CANVAS_SIZE / aspectRatio) / image.height
    );

    return (
      <div
        style={{
          transform: `
            translate(${position.x}px, ${position.y}px)
            rotate(${rotation}deg)
            scale(${zoom * (flipH ? -1 : 1)}, ${zoom * (flipV ? -1 : 1)})
          `,
          width: image.width * scale,
          height: image.height * scale,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md w-full p-4">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!image && !showCamera && (
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-subir-imagen"
              >
                <Upload className="h-6 w-6" />
                <span>Subir Imagen</span>
              </Button>
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col gap-2"
                onClick={startCamera}
                data-testid="button-tomar-foto"
              >
                <Camera className="h-6 w-6" />
                <span>Tomar Foto</span>
              </Button>
            </div>
          )}

          {showCamera && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
              />
              <div className="flex justify-center gap-2 mt-3">
                <Button onClick={captureFromCamera} data-testid="button-capturar">
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
                <Button variant="outline" onClick={() => {
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                  }
                  setShowCamera(false);
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {image && (
            <>
              <div
                ref={previewRef}
                className="relative mx-auto overflow-hidden rounded-lg border-2 border-dashed border-primary/50 bg-muted/30 cursor-move"
                style={{
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE / aspectRatio,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                data-testid="area-edicion"
              >
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  {renderPreview()}
                </div>
                <div className="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-lg" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[zoom]}
                    onValueChange={([value]) => setZoom(value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="flex-1"
                    data-testid="slider-zoom"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => rotate(-90)}
                    data-testid="button-rotar-izq"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => rotate(90)}
                    data-testid="button-rotar-der"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFlipH(!flipH)}
                    className={flipH ? "bg-primary text-primary-foreground" : ""}
                    data-testid="button-voltear-h"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFlipV(!flipV)}
                    className={flipV ? "bg-primary text-primary-foreground" : ""}
                    data-testid="button-voltear-v"
                  >
                    <FlipVertical className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setFlipH(false);
                    setFlipV(false);
                    setPosition({ x: 0, y: 0 });
                  }}
                  data-testid="button-restablecer"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restablecer
                </Button>
              </div>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} data-testid="button-cancelar-editor">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          {image && (
            <Button onClick={handleSave} data-testid="button-guardar-imagen">
              <Check className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImageUploadWithEditorProps {
  value?: string | null;
  onChange: (url: string) => void;
  placeholder?: string;
  aspectRatio?: number;
  className?: string;
  testId?: string;
}

export function ImageUploadWithEditor({
  value,
  onChange,
  placeholder = "Subir imagen",
  aspectRatio = 1,
  className = "",
  testId = "image-upload"
}: ImageUploadWithEditorProps) {
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

      <ImageEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={onChange}
        aspectRatio={aspectRatio}
        title="Editar Imagen"
      />
    </>
  );
}
