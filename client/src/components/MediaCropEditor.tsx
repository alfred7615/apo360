import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Info,
  Check
} from "lucide-react";

export interface CropConfig {
  zoom: number;
  offsetX: number;  // Porcentaje relativo al tamaño del media (valor de crop.x de react-easy-crop)
  offsetY: number;  // Porcentaje relativo al tamaño del media (valor de crop.y de react-easy-crop)
}

interface CropConfigs {
  desktop: CropConfig;
  tablet: CropConfig;
  mobile: CropConfig;
}

interface MediaCropEditorProps {
  imageUrl: string;
  tipoMedia: "imagen" | "video";
  initialConfigs?: Partial<CropConfigs>;
  onSave: (configs: CropConfigs) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = {
  desktop: 16 / 9,
  tablet: 4 / 3,
  mobile: 1 / 1,
};

const DIMENSION_INFO = {
  desktop: { width: 1920, height: 1080, label: "PC (16:9)" },
  tablet: { width: 1024, height: 768, label: "Tablet (4:3)" },
  mobile: { width: 720, height: 720, label: "Móvil (1:1)" },
};

const defaultCropConfig: CropConfig = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export function MediaCropEditor({
  imageUrl,
  tipoMedia,
  initialConfigs,
  onSave,
  onCancel,
}: MediaCropEditorProps) {
  const [activeTab, setActiveTab] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const previousTabRef = useRef<"desktop" | "tablet" | "mobile">(activeTab);
  
  // Inicializar configs desde los valores guardados
  const getInitialConfigs = (): CropConfigs => ({
    desktop: initialConfigs?.desktop || { ...defaultCropConfig },
    tablet: initialConfigs?.tablet || { ...defaultCropConfig },
    mobile: initialConfigs?.mobile || { ...defaultCropConfig },
  });
  
  const [configs, setConfigs] = useState<CropConfigs>(getInitialConfigs);

  // Inicializar crop y zoom desde los valores guardados del tab activo (desktop por defecto)
  const [crop, setCrop] = useState(() => {
    const config = initialConfigs?.desktop || defaultCropConfig;
    return { x: config.offsetX, y: config.offsetY };
  });
  const [zoom, setZoom] = useState(() => {
    const config = initialConfigs?.desktop || defaultCropConfig;
    return config.zoom;
  });

  // Sincronizar crop/zoom cuando cambia el tab activo o los configs se actualizan
  useEffect(() => {
    // Solo sincronizar cuando el tab ha cambiado
    if (previousTabRef.current !== activeTab) {
      const config = configs[activeTab];
      setCrop({ x: config.offsetX, y: config.offsetY });
      setZoom(config.zoom);
      previousTabRef.current = activeTab;
    }
  }, [activeTab, configs]);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      // Guardar los valores de crop.x y crop.y directamente (son porcentajes)
      setConfigs((prev) => ({
        ...prev,
        [activeTab]: {
          zoom,
          offsetX: crop.x,
          offsetY: crop.y,
        },
      }));
    },
    [activeTab, zoom, crop]
  );

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    setConfigs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        zoom: newZoom,
      },
    }));
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    const newTab = tab as "desktop" | "tablet" | "mobile";
    
    // Guardar estado actual antes de cambiar de tab
    setConfigs((prev) => ({
      ...prev,
      [activeTab]: {
        zoom,
        offsetX: crop.x,
        offsetY: crop.y,
      },
    }));
    
    // Cambiar tab - el useEffect sincronizará crop/zoom
    setActiveTab(newTab);
  };

  const handleReset = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setConfigs((prev) => ({
      ...prev,
      [activeTab]: { ...defaultCropConfig },
    }));
  };

  const handleSave = () => {
    const finalConfigs: CropConfigs = {
      ...configs,
      [activeTab]: {
        zoom,
        offsetX: crop.x,
        offsetY: crop.y,
      },
    };
    onSave(finalConfigs);
  };

  const currentDimensions = DIMENSION_INFO[activeTab];

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <div className="text-sm">
          <p className="font-medium mb-1">Tamaño recomendado para {tipoMedia === "imagen" ? "imágenes" : "videos"}:</p>
          <ul className="text-muted-foreground space-y-1">
            <li><Monitor className="h-3 w-3 inline mr-1" /> PC: <strong>1920 x 1080 px</strong> (16:9)</li>
            <li><Tablet className="h-3 w-3 inline mr-1" /> Tablet: <strong>1024 x 768 px</strong> (4:3)</li>
            <li><Smartphone className="h-3 w-3 inline mr-1" /> Móvil: <strong>720 x 720 px</strong> (1:1)</li>
          </ul>
          {tipoMedia === "video" && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Para mejor calidad en videos, créalos con las dimensiones exactas del dispositivo destino.
            </p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop" className="flex items-center gap-1" data-testid="tab-crop-desktop">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">PC</span>
          </TabsTrigger>
          <TabsTrigger value="tablet" className="flex items-center gap-1" data-testid="tab-crop-tablet">
            <Tablet className="h-4 w-4" />
            <span className="hidden sm:inline">Tablet</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-1" data-testid="tab-crop-mobile">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Móvil</span>
          </TabsTrigger>
        </TabsList>

        {["desktop", "tablet", "mobile"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="text-center text-xs text-muted-foreground mb-2">
              Vista: {currentDimensions.label} ({currentDimensions.width} x {currentDimensions.height} px)
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: "300px" }}>
              {tipoMedia === "imagen" ? (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={ASPECT_RATIOS[activeTab]}
                  onCropChange={onCropChange}
                  onCropComplete={onCropComplete}
                  onZoomChange={onZoomChange}
                  minZoom={1}
                  maxZoom={3}
                  showGrid={true}
                  restrictPosition={true}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    src={imageUrl} 
                    className="max-w-full max-h-full"
                    style={{
                      transform: `scale(${zoom}) translate(${crop.x}%, ${crop.y}%)`,
                    }}
                  />
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: "2px dashed rgba(139, 92, 246, 0.8)",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                    }}
                  />
                  <p className="absolute bottom-2 left-2 right-2 text-center text-xs text-white bg-black/50 rounded px-2 py-1">
                    Para videos, use las dimensiones exactas al crearlos
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {tipoMedia === "imagen" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <ZoomOut className="h-4 w-4" />
              Zoom
              <ZoomIn className="h-4 w-4" />
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(values) => onZoomChange(values[0])}
            data-testid="slider-zoom"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-between">
        <Button variant="outline" size="sm" onClick={handleReset} data-testid="btn-reset-crop">
          <RotateCcw className="h-4 w-4 mr-1" />
          Restablecer
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="btn-cancel-crop">
            Cancelar
          </Button>
          <Button onClick={handleSave} data-testid="btn-save-crop">
            <Check className="h-4 w-4 mr-1" />
            Aplicar Recorte
          </Button>
        </div>
      </div>
    </div>
  );
}
