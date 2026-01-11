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

// Altura fija de la sección de bienvenida: 180px
// PC: 1080x180 (relación 6:1)
// Tablet/Móvil: ancho automático, altura 180px
const FIXED_HEIGHT = 180;

const ASPECT_RATIOS = {
  desktop: 1080 / FIXED_HEIGHT,  // 6:1
  tablet: 800 / FIXED_HEIGHT,    // ~4.44:1 (ancho estimado para tablet)
  mobile: 400 / FIXED_HEIGHT,    // ~2.22:1 (ancho estimado para móvil)
};

const DIMENSION_INFO = {
  desktop: { width: 1080, height: FIXED_HEIGHT, label: "PC (1080x180)" },
  tablet: { width: "auto", height: FIXED_HEIGHT, label: "Tablet (auto x 180)" },
  mobile: { width: "auto", height: FIXED_HEIGHT, label: "Móvil (auto x 180)" },
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
  
  // Rastrear qué pestañas tienen recorte aplicado
  const [appliedTabs, setAppliedTabs] = useState<Record<string, boolean>>({
    desktop: !!initialConfigs?.desktop,
    tablet: !!initialConfigs?.tablet,
    mobile: !!initialConfigs?.mobile,
  });
  
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
    setAppliedTabs((prev) => ({
      ...prev,
      [activeTab]: false,
    }));
  };

  // Aplicar recorte solo para la pestaña activa
  const handleApplyCurrentTab = () => {
    setConfigs((prev) => ({
      ...prev,
      [activeTab]: {
        zoom,
        offsetX: crop.x,
        offsetY: crop.y,
      },
    }));
    setAppliedTabs((prev) => ({
      ...prev,
      [activeTab]: true,
    }));
  };

  // Guardar todos los cambios y cerrar
  const handleSave = () => {
    // Asegurar que el tab actual esté guardado
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

  // Verificar si todos los tabs tienen recorte aplicado
  const allTabsApplied = appliedTabs.desktop && appliedTabs.tablet && appliedTabs.mobile;

  const currentDimensions = DIMENSION_INFO[activeTab];

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <div className="text-sm">
          <p className="font-medium mb-1">Sección de Bienvenida - Altura fija: 180px</p>
          <ul className="text-muted-foreground space-y-1">
            <li><Monitor className="h-3 w-3 inline mr-1" /> PC: <strong>1080 x 180 px</strong></li>
            <li><Tablet className="h-3 w-3 inline mr-1" /> Tablet: <strong>Auto x 180 px</strong></li>
            <li><Smartphone className="h-3 w-3 inline mr-1" /> Móvil: <strong>Auto x 180 px</strong></li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            La imagen se posicionará en el lado derecho del contenedor con overlay púrpura-rosa al 50%.
          </p>
          {tipoMedia === "video" && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Para videos, use dimensiones horizontales anchas para mejor visualización.
            </p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop" className="flex items-center gap-1" data-testid="tab-crop-desktop">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">PC</span>
            {appliedTabs.desktop && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="tablet" className="flex items-center gap-1" data-testid="tab-crop-tablet">
            <Tablet className="h-4 w-4" />
            <span className="hidden sm:inline">Tablet</span>
            {appliedTabs.tablet && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-1" data-testid="tab-crop-mobile">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Móvil</span>
            {appliedTabs.mobile && <Check className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        {["desktop", "tablet", "mobile"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                Vista: {currentDimensions.label} ({currentDimensions.width === "auto" ? "ancho auto" : `${currentDimensions.width}px`} x {currentDimensions.height}px)
              </div>
              {appliedTabs[activeTab] && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Recorte aplicado
                </span>
              )}
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

            {/* Botón Aplicar Recorte para esta pestaña */}
            <div className="flex justify-end mt-3">
              <Button 
                onClick={handleApplyCurrentTab}
                variant={appliedTabs[activeTab] ? "outline" : "default"}
                size="sm"
                data-testid={`btn-apply-crop-${tab}`}
              >
                <Check className="h-4 w-4 mr-1" />
                {appliedTabs[activeTab] ? "Recorte Actualizado" : "Aplicar Recorte"}
              </Button>
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

      {/* Estado de recortes aplicados */}
      <div className="bg-muted/30 rounded-lg p-3 text-sm">
        <p className="font-medium mb-2">Estado de recortes:</p>
        <div className="flex flex-wrap gap-3">
          <span className={`flex items-center gap-1 ${appliedTabs.desktop ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            <Monitor className="h-4 w-4" />
            PC: {appliedTabs.desktop ? "✓ Aplicado" : "Pendiente"}
          </span>
          <span className={`flex items-center gap-1 ${appliedTabs.tablet ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            <Tablet className="h-4 w-4" />
            Tablet: {appliedTabs.tablet ? "✓ Aplicado" : "Pendiente"}
          </span>
          <span className={`flex items-center gap-1 ${appliedTabs.mobile ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            <Smartphone className="h-4 w-4" />
            Móvil: {appliedTabs.mobile ? "✓ Aplicado" : "Pendiente"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <Button variant="outline" size="sm" onClick={handleReset} data-testid="btn-reset-crop">
          <RotateCcw className="h-4 w-4 mr-1" />
          Restablecer
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="btn-cancel-crop">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!allTabsApplied}
            data-testid="btn-save-crop"
          >
            <Check className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>
      {!allTabsApplied && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          Debe aplicar el recorte en cada dispositivo (PC, Tablet, Móvil) antes de guardar
        </p>
      )}
    </div>
  );
}
