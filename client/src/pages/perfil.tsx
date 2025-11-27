import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, MapPin, FileText, Briefcase, Star, 
  Save, Loader2, Check, Camera, Car, Upload,
  Image as ImageIcon, Trash2, RotateCcw, ZoomIn, ZoomOut, Users, ArrowLeft, Map
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ProfileImageCapture } from "@/components/ProfileImageCapture";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GestionContactosFamiliares from "@/components/GestionContactosFamiliares";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import type { Usuario, Sector } from "@shared/schema";

const TIPOS_VEHICULO = [
  { value: "auto", label: "Automóvil" },
  { value: "camioneta", label: "Camioneta" },
  { value: "camion", label: "Camión" },
  { value: "mototaxi", label: "Mototaxi" },
  { value: "moto", label: "Motocicleta" },
  { value: "van", label: "Van / Minivan" },
  { value: "bus", label: "Bus" },
  { value: "combi", label: "Combi" },
];

const CAMPOS_PERFIL = [
  { campo: 'alias', peso: 5, grupo: 'basico' },
  { campo: 'firstName', peso: 10, grupo: 'personal' },
  { campo: 'lastName', peso: 10, grupo: 'personal' },
  { campo: 'telefono', peso: 10, grupo: 'personal' },
  { campo: 'dni', peso: 10, grupo: 'personal' },
  { campo: 'pais', peso: 5, grupo: 'ubicacion' },
  { campo: 'departamento', peso: 5, grupo: 'ubicacion' },
  { campo: 'distrito', peso: 5, grupo: 'ubicacion' },
  { campo: 'direccion', peso: 10, grupo: 'direccion' },
  { campo: 'gpsLatitud', peso: 5, grupo: 'direccion' },
  { campo: 'gpsLongitud', peso: 5, grupo: 'direccion' },
  { campo: 'nombreLocal', peso: 10, grupo: 'negocio' },
  { campo: 'ruc', peso: 10, grupo: 'negocio' },
];

const calcularPorcentajeCompletado = (usuario: Partial<Usuario>): number => {
  let puntos = 0;
  let total = 0;
  
  CAMPOS_PERFIL.forEach(({ campo, peso }) => {
    total += peso;
    const valor = (usuario as any)[campo];
    if (valor !== null && valor !== undefined && valor !== '') {
      puntos += peso;
    }
  });
  
  return Math.round((puntos / total) * 100);
};

const obtenerSugerenciaConfianza = (porcentaje: number): { mensaje: string; color: string } => {
  if (porcentaje < 25) {
    return {
      mensaje: "Los usuarios con perfil completo tienen más éxito en venta, compras, y servicios...",
      color: "text-red-600"
    };
  } else if (porcentaje < 50) {
    return {
      mensaje: "Buen inicio. Agrega más datos para que otros usuarios confíen en ti al hacer negocios.",
      color: "text-orange-600"
    };
  } else if (porcentaje < 75) {
    return {
      mensaje: "Tu perfil está casi listo. Completa los campos faltantes para acceder a todas las funciones.",
      color: "text-yellow-600"
    };
  } else if (porcentaje < 100) {
    return {
      mensaje: "Excelente. Solo te faltan algunos datos para tener un perfil completo y confiable.",
      color: "text-blue-600"
    };
  }
  return {
    mensaje: "Perfil completo. Los usuarios pueden confiar plenamente en ti para transacciones.",
    color: "text-green-600"
  };
};

const calcularNivelUsuario = (usuario: Partial<Usuario>): number => {
  let nivel = 1;
  
  if (usuario.firstName && usuario.lastName && usuario.telefono && usuario.dni) {
    nivel = 2;
  }
  if (nivel >= 2 && usuario.pais && usuario.departamento && usuario.distrito) {
    nivel = 3;
  }
  if (nivel >= 3 && usuario.direccion && usuario.gpsLatitud && usuario.gpsLongitud) {
    nivel = 4;
  }
  if (nivel >= 4 && usuario.nombreLocal && usuario.ruc) {
    nivel = 5;
  }
  
  return nivel;
};

const renderEstrellas = (nivel: number) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-5 w-5 ${n <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

const NIVELES_INFO = [
  { nivel: 1, titulo: "Básico", descripcion: "Alias y email", color: "bg-gray-500" },
  { nivel: 2, titulo: "Chat", descripcion: "Datos personales y DNI", color: "bg-blue-500" },
  { nivel: 3, titulo: "Ubicación", descripcion: "País, departamento y distrito", color: "bg-green-500" },
  { nivel: 4, titulo: "Dirección", descripcion: "Dirección completa y GPS", color: "bg-purple-500" },
  { nivel: 5, titulo: "Marketplace", descripcion: "Datos de negocio (RUC)", color: "bg-yellow-500" },
];

async function uploadImageToServer(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('imagen', file);
    
    const response = await fetch('/api/upload/documentos', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Error al subir imagen');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

interface DocumentoUploadProps {
  titulo: string;
  imagenFrente?: string | null;
  imagenPosterior?: string | null;
  fechaEmision?: string | null;
  fechaCaducidad?: string | null;
  onFrenteChange: (url: string) => void;
  onPosteriorChange: (url: string) => void;
  onEmisionChange: (fecha: string) => void;
  onCaducidadChange: (fecha: string) => void;
  testIdPrefix: string;
}

function DocumentoUpload({
  titulo,
  imagenFrente,
  imagenPosterior,
  fechaEmision,
  fechaCaducidad,
  onFrenteChange,
  onPosteriorChange,
  onEmisionChange,
  onCaducidadChange,
  testIdPrefix
}: DocumentoUploadProps) {
  const [uploading, setUploading] = useState<'frente' | 'posterior' | null>(null);
  const { toast } = useToast();
  
  const handleFileChange = async (type: 'frente' | 'posterior', file: File) => {
    setUploading(type);
    try {
      const url = await uploadImageToServer(file);
      if (url) {
        if (type === 'frente') {
          onFrenteChange(url);
        } else {
          onPosteriorChange(url);
        }
        toast({ title: "Imagen subida", description: "La imagen se guardó correctamente" });
      } else {
        toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al subir la imagen", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Foto Frontal</Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`${testIdPrefix}-frente`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange('frente', file);
                }}
              />
              <label 
                htmlFor={`${testIdPrefix}-frente`}
                className={`block border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors ${uploading === 'frente' ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploading === 'frente' ? (
                  <div className="flex flex-col items-center py-4">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground mt-1">Subiendo...</span>
                  </div>
                ) : imagenFrente ? (
                  <img 
                    src={imagenFrente} 
                    alt={`${titulo} frente`} 
                    className="h-20 w-full object-cover rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Frente</span>
                  </div>
                )}
              </label>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Foto Posterior</Label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`${testIdPrefix}-posterior`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange('posterior', file);
                }}
              />
              <label 
                htmlFor={`${testIdPrefix}-posterior`}
                className={`block border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors ${uploading === 'posterior' ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploading === 'posterior' ? (
                  <div className="flex flex-col items-center py-4">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground mt-1">Subiendo...</span>
                  </div>
                ) : imagenPosterior ? (
                  <img 
                    src={imagenPosterior} 
                    alt={`${titulo} posterior`} 
                    className="h-20 w-full object-cover rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Posterior</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${testIdPrefix}-emision`} className="text-xs">Emisión</Label>
            <Input
              id={`${testIdPrefix}-emision`}
              type="date"
              value={fechaEmision || ""}
              onChange={(e) => onEmisionChange(e.target.value)}
              className="h-8 text-sm"
              data-testid={`input-${testIdPrefix}-emision`}
            />
          </div>
          <div>
            <Label htmlFor={`${testIdPrefix}-caducidad`} className="text-xs">Caducidad</Label>
            <Input
              id={`${testIdPrefix}-caducidad`}
              type="date"
              value={fechaCaducidad || ""}
              onChange={(e) => onCaducidadChange(e.target.value)}
              className="h-8 text-sm"
              data-testid={`input-${testIdPrefix}-caducidad`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface VehiculoFotoProps {
  titulo: string;
  imagen?: string | null;
  onImageChange: (url: string) => void;
  testId: string;
}

function VehiculoFoto({ titulo, imagen, onImageChange, testId }: VehiculoFotoProps) {
  const handleFileChange = (file: File) => {
    const url = URL.createObjectURL(file);
    onImageChange(url);
  };

  return (
    <div className="flex flex-col items-center">
      <Label className="text-xs text-muted-foreground mb-1">{titulo}</Label>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={testId}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
        }}
      />
      <label 
        htmlFor={testId}
        className="block w-full border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors aspect-video"
      >
        {imagen ? (
          <img 
            src={imagen} 
            alt={titulo} 
            className="h-full w-full object-cover rounded"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Car className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">{titulo}</span>
          </div>
        )}
      </label>
    </div>
  );
}

export default function PerfilPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("basico");
  const [formData, setFormData] = useState<Partial<Usuario>>({});

  const { data: perfil, isLoading } = useQuery<Usuario>({
    queryKey: ["/api/usuarios/me"],
    enabled: !!user,
  });

  const { data: departamentos = [] } = useQuery<string[]>({
    queryKey: ["/api/ubicaciones/departamentos", formData.pais || "Perú"],
    enabled: true,
  });

  const { data: distritos = [] } = useQuery<string[]>({
    queryKey: ["/api/ubicaciones/distritos", formData.departamento],
    queryFn: async () => {
      if (!formData.departamento) return [];
      const response = await fetch(`/api/ubicaciones/distritos?departamento=${encodeURIComponent(formData.departamento)}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!formData.departamento,
  });

  const { data: sectores = [] } = useQuery<Sector[]>({
    queryKey: ["/api/sectores", formData.departamento, formData.distrito],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (formData.departamento) params.append("departamento", formData.departamento);
      if (formData.distrito) params.append("distrito", formData.distrito);
      const response = await fetch(`/api/sectores?${params.toString()}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: true,
  });

  const opcionesSectores = sectores.map((s: Sector) => s.nombre);

  useEffect(() => {
    if (perfil) {
      setFormData(perfil);
    }
  }, [perfil]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Usuario>) => {
      const response = await apiRequest("PATCH", `/api/usuarios/me`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Perfil actualizado", description: "Los cambios se guardaron correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo actualizar el perfil", 
        variant: "destructive" 
      });
    },
  });

  const handleInputChange = (field: keyof Usuario, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    if (!formData || Object.keys(formData).length === 0) {
      toast({ title: "Error", description: "No hay datos para guardar", variant: "destructive" });
      return;
    }
    
    if (formData.sector && formData.departamento && formData.distrito) {
      const sectorExiste = sectores.find(s => s.nombre.toLowerCase() === formData.sector?.toLowerCase());
      if (!sectorExiste) {
        try {
          await apiRequest("POST", "/api/sectores", {
            nombre: formData.sector,
            departamento: formData.departamento,
            distrito: formData.distrito,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/sectores"] });
        } catch (error) {
          console.log("Sector ya existe o error al crear");
        }
      }
    }
    
    const nivelCalculado = calcularNivelUsuario(formData);
    const dataToSave = {
      ...formData,
      nivelUsuario: nivelCalculado,
    };
    
    console.log("Guardando datos:", dataToSave);
    updateMutation.mutate(dataToSave);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Debes iniciar sesión para ver tu perfil</p>
            <Button className="mt-4" asChild>
              <a href="/api/login">Iniciar Sesión</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nivelActual = calcularNivelUsuario(formData);
  const progresoNivel = (nivelActual / 5) * 100;
  const porcentajeCompletado = calcularPorcentajeCompletado(formData);
  const sugerencia = obtenerSugerenciaConfianza(porcentajeCompletado);
  const esConductor = formData.rol === "conductor" || formData.modoTaxi === "conductor";

  const tieneValor = (campo: string) => {
    const valor = (formData as any)[campo];
    return valor !== null && valor !== undefined && valor !== '';
  };

  const handleTelefonoChange = (value: string) => {
    let telefono = value;
    if (!telefono.startsWith('+51')) {
      telefono = '+51' + telefono.replace(/^\+51/, '').replace(/[^0-9]/g, '');
    }
    handleInputChange("telefono", telefono);
    
    if (telefono.length >= 12 && navigator && 'userAgent' in navigator) {
      const userAgent = navigator.userAgent;
      const hash = userAgent.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const imeiGenerado = Math.abs(hash).toString().padStart(15, '0').slice(0, 15);
      handleInputChange("imeiDispositivo", imeiGenerado);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-800/30 dark:bg-gray-900/50" data-testid="page-perfil">
      {/* Header fijo */}
      <div className="flex-shrink-0 bg-background border-b px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-9 w-9"
                data-testid="button-regresar-perfil"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-titulo-perfil">
                  <User className="h-5 w-5" />
                  Mi Perfil
                </h1>
                <p className="text-sm text-muted-foreground">Completa tu información para desbloquear más funciones</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{porcentajeCompletado}%</span>
                {renderEstrellas(nivelActual)}
              </div>
              <p className="text-xs text-muted-foreground">Perfil completado</p>
            </div>
          </div>
          
          {/* Barra de progreso y sugerencia */}
          <div className="mt-3">
            <Progress value={porcentajeCompletado} className="h-2" data-testid="progress-porcentaje" />
            <p className={`text-xs mt-2 ${sugerencia.color}`} data-testid="text-sugerencia">
              {sugerencia.mensaje}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <Card data-testid="card-foto-perfil">
                <CardContent className="p-4 flex flex-col items-center">
                  <ProfileImageCapture
                    usuarioId={user.id}
                    imagenActual={formData.profileImageUrl || undefined}
                    nombre={formData.firstName || user.nombre || "Usuario"}
                    size="xl"
                    onImageUpdated={(url) => handleInputChange("profileImageUrl", url)}
                  />
                  <h2 className="mt-3 text-base font-semibold" data-testid="text-nombre-usuario">
                    {formData.firstName || user.nombre || "Usuario"}
                  </h2>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  
                  <div className="mt-3 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Nivel</span>
                      {renderEstrellas(nivelActual)}
                    </div>
                    <Progress value={progresoNivel} className="h-1.5" data-testid="progress-nivel" />
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      {nivelActual}/5 niveles
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-niveles">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Niveles de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {NIVELES_INFO.map((info) => (
                    <div 
                      key={info.nivel}
                      className={`flex items-center gap-2 p-1.5 rounded-md text-sm ${
                        nivelActual >= info.nivel ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'
                      }`}
                      data-testid={`nivel-info-${info.nivel}`}
                    >
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                        nivelActual >= info.nivel ? 'bg-green-500' : 'bg-muted-foreground/30'
                      }`}>
                        {nivelActual >= info.nivel ? <Check className="h-3 w-3" /> : info.nivel}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{info.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{info.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-2" data-testid="card-formulario-perfil">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información del Perfil</CardTitle>
                <CardDescription className="text-xs">Completa cada sección para subir de nivel</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-6 h-auto">
                    <TabsTrigger value="basico" className="text-xs py-1.5 px-1" data-testid="tab-perfil-basico">
                      <User className="h-3 w-3 mr-1" />
                      Básico
                    </TabsTrigger>
                    <TabsTrigger value="ubicacion" className="text-xs py-1.5 px-1" data-testid="tab-perfil-ubicacion">
                      <MapPin className="h-3 w-3 mr-1" />
                      Ubicación
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="text-xs py-1.5 px-1" data-testid="tab-perfil-documentos">
                      <FileText className="h-3 w-3 mr-1" />
                      Docs
                    </TabsTrigger>
                    <TabsTrigger value="familia" className="text-xs py-1.5 px-1" data-testid="tab-perfil-familia">
                      <Users className="h-3 w-3 mr-1" />
                      Familia
                    </TabsTrigger>
                    <TabsTrigger value="conductor" className="text-xs py-1.5 px-1" data-testid="tab-perfil-conductor">
                  <Car className="h-3 w-3 mr-1" />
                  Conductor
                </TabsTrigger>
                <TabsTrigger value="negocio" className="text-xs py-1.5 px-1" data-testid="tab-perfil-negocio">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Negocio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      Nivel 1 - Básico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="alias" className={`text-xs ${tieneValor('alias') ? 'font-bold' : ''}`}>Alias</Label>
                      <Input
                        id="alias"
                        value={formData.alias || ""}
                        onChange={(e) => handleInputChange("alias", e.target.value)}
                        placeholder="Tu nombre de usuario"
                        className={`h-8 ${tieneValor('alias') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-alias"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className={`text-xs ${tieneValor('email') ? 'font-bold' : ''}`}>Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || user.email || ""}
                        disabled
                        className={`h-8 bg-muted ${tieneValor('email') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-email"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="telefono" className={`text-xs ${tieneValor('telefono') ? 'font-bold' : ''}`}>Teléfono Celular</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono || "+51"}
                        onChange={(e) => handleTelefonoChange(e.target.value)}
                        placeholder="+51 999 999 999"
                        className={`h-8 ${tieneValor('telefono') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-telefono-basico"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="imeiDispositivo" className={`text-xs ${tieneValor('imeiDispositivo') ? 'font-bold' : ''}`}>IMEI Dispositivo</Label>
                      <Input
                        id="imeiDispositivo"
                        value={formData.imeiDispositivo || ""}
                        disabled
                        placeholder="Se genera automáticamente"
                        className={`h-8 bg-muted ${tieneValor('imeiDispositivo') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-imei"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      Nivel 2 - Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className={`text-xs ${tieneValor('firstName') ? 'font-bold' : ''}`}>Nombres</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName || ""}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="Tus nombres"
                        className={`h-8 ${tieneValor('firstName') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-nombres"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className={`text-xs ${tieneValor('lastName') ? 'font-bold' : ''}`}>Apellidos</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName || ""}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Tus apellidos"
                        className={`h-8 ${tieneValor('lastName') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-apellidos"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dni" className={`text-xs ${tieneValor('dni') ? 'font-bold' : ''}`}>DNI</Label>
                      <Input
                        id="dni"
                        value={formData.dni || ""}
                        onChange={(e) => handleInputChange("dni", e.target.value)}
                        placeholder="12345678"
                        maxLength={8}
                        className={`h-8 ${tieneValor('dni') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-dni"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ubicacion" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      Nivel 3 - Ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="pais" className={`text-xs ${tieneValor('pais') ? 'font-bold' : ''}`}>País</Label>
                      <AutocompleteInput
                        id="pais"
                        value={formData.pais || "Perú"}
                        onChange={(value) => handleInputChange("pais", value)}
                        options={["Perú"]}
                        className={`h-8 ${tieneValor('pais') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-pais"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="departamento" className={`text-xs ${tieneValor('departamento') ? 'font-bold' : ''}`}>Departamento</Label>
                      <AutocompleteInput
                        id="departamento"
                        value={formData.departamento || ""}
                        onChange={(value) => {
                          handleInputChange("departamento", value);
                          if (formData.departamento !== value) {
                            handleInputChange("distrito", "");
                          }
                        }}
                        options={departamentos}
                        placeholder="Escribe para buscar..."
                        className={`h-8 ${tieneValor('departamento') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-departamento"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="distrito" className={`text-xs ${tieneValor('distrito') ? 'font-bold' : ''}`}>Distrito</Label>
                      <AutocompleteInput
                        id="distrito"
                        value={formData.distrito || ""}
                        onChange={(value) => handleInputChange("distrito", value)}
                        options={distritos}
                        placeholder={formData.departamento ? "Escribe para buscar..." : "Selecciona departamento"}
                        disabled={!formData.departamento}
                        className={`h-8 ${tieneValor('distrito') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-distrito"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sector" className={`text-xs ${tieneValor('sector') ? 'font-bold' : ''}`}>Sector</Label>
                      <AutocompleteInput
                        id="sector"
                        value={formData.sector || ""}
                        onChange={(value) => handleInputChange("sector", value)}
                        options={opcionesSectores}
                        placeholder="Escribe o selecciona..."
                        className={`h-8 ${tieneValor('sector') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-sector"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      Nivel 4 - Dirección
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="avenidaCalle" className={`text-xs ${tieneValor('avenidaCalle') ? 'font-bold' : ''}`}>Avenida / Calle</Label>
                      <Input
                        id="avenidaCalle"
                        value={formData.avenidaCalle || ""}
                        onChange={(e) => handleInputChange("avenidaCalle", e.target.value)}
                        placeholder="Av. Principal"
                        className={`h-8 ${tieneValor('avenidaCalle') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-avenida"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="manzanaLote" className={`text-xs ${tieneValor('manzanaLote') ? 'font-bold' : ''}`}>Mza / Lote</Label>
                      <Input
                        id="manzanaLote"
                        value={formData.manzanaLote || ""}
                        onChange={(e) => handleInputChange("manzanaLote", e.target.value)}
                        placeholder="Mz. A Lt. 10"
                        className={`h-8 ${tieneValor('manzanaLote') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-manzana"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label htmlFor="direccion" className={`text-xs ${tieneValor('direccion') ? 'font-bold' : ''}`}>Dirección Completa</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion || ""}
                        onChange={(e) => handleInputChange("direccion", e.target.value)}
                        placeholder="Dirección completa"
                        className={`h-8 ${tieneValor('direccion') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-direccion"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gpsLatitud" className={`text-xs ${tieneValor('gpsLatitud') ? 'font-bold' : ''}`}>Latitud GPS</Label>
                      <Input
                        id="gpsLatitud"
                        type="number"
                        step="any"
                        value={formData.gpsLatitud || ""}
                        onChange={(e) => handleInputChange("gpsLatitud", parseFloat(e.target.value))}
                        placeholder="-18.0065"
                        className={`h-8 ${tieneValor('gpsLatitud') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-latitud"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gpsLongitud" className={`text-xs ${tieneValor('gpsLongitud') ? 'font-bold' : ''}`}>Longitud GPS</Label>
                      <Input
                        id="gpsLongitud"
                        type="number"
                        step="any"
                        value={formData.gpsLongitud || ""}
                        onChange={(e) => handleInputChange("gpsLongitud", parseFloat(e.target.value))}
                        placeholder="-70.2463"
                        className={`h-8 ${tieneValor('gpsLongitud') ? 'font-bold' : ''}`}
                        data-testid="input-perfil-longitud"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                handleInputChange("gpsLatitud", position.coords.latitude);
                                handleInputChange("gpsLongitud", position.coords.longitude);
                                toast({ title: "Ubicación obtenida" });
                              },
                              () => toast({ title: "Error", description: "No se pudo obtener ubicación", variant: "destructive" })
                            );
                          }
                        }}
                        data-testid="button-obtener-gps"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Obtener mi GPS
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documentos" className="mt-4 space-y-4">
                <DocumentoUpload
                  titulo="DNI - Documento Nacional de Identidad"
                  imagenFrente={formData.dniImagenFrente}
                  imagenPosterior={formData.dniImagenPosterior}
                  fechaEmision={formData.dniEmision?.toString()}
                  fechaCaducidad={formData.dniCaducidad?.toString()}
                  onFrenteChange={(url) => handleInputChange("dniImagenFrente", url)}
                  onPosteriorChange={(url) => handleInputChange("dniImagenPosterior", url)}
                  onEmisionChange={(fecha) => handleInputChange("dniEmision", fecha)}
                  onCaducidadChange={(fecha) => handleInputChange("dniCaducidad", fecha)}
                  testIdPrefix="dni"
                />
              </TabsContent>

              <TabsContent value="familia" className="mt-4">
                <GestionContactosFamiliares />
              </TabsContent>

              <TabsContent value="conductor" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Perfil de Conductor
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Completa los documentos para ser conductor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="tipoVehiculo" className="text-xs">Tipo de Vehículo</Label>
                        <Select 
                          value={formData.tipoVehiculo || ""} 
                          onValueChange={(v) => handleInputChange("tipoVehiculo", v)}
                        >
                          <SelectTrigger className="h-8" data-testid="select-tipo-vehiculo">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_VEHICULO.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="vehiculoPlaca" className="text-xs">Placa del Vehículo</Label>
                        <Input
                          id="vehiculoPlaca"
                          value={formData.vehiculoPlaca || ""}
                          onChange={(e) => handleInputChange("vehiculoPlaca", e.target.value.toUpperCase())}
                          placeholder="ABC-123"
                          className="h-8"
                          data-testid="input-vehiculo-placa"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label htmlFor="vehiculoModelo" className="text-xs">Modelo del Vehículo</Label>
                        <Input
                          id="vehiculoModelo"
                          value={formData.vehiculoModelo || ""}
                          onChange={(e) => handleInputChange("vehiculoModelo", e.target.value)}
                          placeholder="Toyota Yaris 2020"
                          className="h-8"
                          data-testid="input-vehiculo-modelo"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Fotos del Vehículo (4 lados)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <VehiculoFoto
                        titulo="Frente"
                        imagen={formData.vehiculoFotoFrente}
                        onImageChange={(url) => handleInputChange("vehiculoFotoFrente", url)}
                        testId="vehiculo-foto-frente"
                      />
                      <VehiculoFoto
                        titulo="Posterior"
                        imagen={formData.vehiculoFotoPosterior}
                        onImageChange={(url) => handleInputChange("vehiculoFotoPosterior", url)}
                        testId="vehiculo-foto-posterior"
                      />
                      <VehiculoFoto
                        titulo="Lateral Izq."
                        imagen={formData.vehiculoFotoLateralIzq}
                        onImageChange={(url) => handleInputChange("vehiculoFotoLateralIzq", url)}
                        testId="vehiculo-foto-lateral-izq"
                      />
                      <VehiculoFoto
                        titulo="Lateral Der."
                        imagen={formData.vehiculoFotoLateralDer}
                        onImageChange={(url) => handleInputChange("vehiculoFotoLateralDer", url)}
                        testId="vehiculo-foto-lateral-der"
                      />
                    </div>
                  </CardContent>
                </Card>

                <DocumentoUpload
                  titulo="Brevete / Licencia de Conducir"
                  imagenFrente={formData.breveteImagenFrente}
                  imagenPosterior={formData.breveteImagenPosterior}
                  fechaEmision={formData.breveteEmision?.toString()}
                  fechaCaducidad={formData.breveteCaducidad?.toString()}
                  onFrenteChange={(url) => handleInputChange("breveteImagenFrente", url)}
                  onPosteriorChange={(url) => handleInputChange("breveteImagenPosterior", url)}
                  onEmisionChange={(fecha) => handleInputChange("breveteEmision", fecha)}
                  onCaducidadChange={(fecha) => handleInputChange("breveteCaducidad", fecha)}
                  testIdPrefix="brevete"
                />

                <DocumentoUpload
                  titulo="SOAT - Seguro Obligatorio"
                  imagenFrente={formData.soatImagenFrente}
                  imagenPosterior={formData.soatImagenPosterior}
                  fechaEmision={formData.soatEmision?.toString()}
                  fechaCaducidad={formData.soatCaducidad?.toString()}
                  onFrenteChange={(url) => handleInputChange("soatImagenFrente", url)}
                  onPosteriorChange={(url) => handleInputChange("soatImagenPosterior", url)}
                  onEmisionChange={(fecha) => handleInputChange("soatEmision", fecha)}
                  onCaducidadChange={(fecha) => handleInputChange("soatCaducidad", fecha)}
                  testIdPrefix="soat"
                />

                <DocumentoUpload
                  titulo="Revisión Técnica Vehicular"
                  imagenFrente={formData.revisionTecnicaImagenFrente}
                  imagenPosterior={formData.revisionTecnicaImagenPosterior}
                  fechaEmision={formData.revisionTecnicaEmision?.toString()}
                  fechaCaducidad={formData.revisionTecnicaCaducidad?.toString()}
                  onFrenteChange={(url) => handleInputChange("revisionTecnicaImagenFrente", url)}
                  onPosteriorChange={(url) => handleInputChange("revisionTecnicaImagenPosterior", url)}
                  onEmisionChange={(fecha) => handleInputChange("revisionTecnicaEmision", fecha)}
                  onCaducidadChange={(fecha) => handleInputChange("revisionTecnicaCaducidad", fecha)}
                  testIdPrefix="revision-tecnica"
                />

                <DocumentoUpload
                  titulo="Credencial de Conductor"
                  imagenFrente={formData.credencialConductorImagenFrente}
                  imagenPosterior={formData.credencialConductorImagenPosterior}
                  fechaEmision={formData.credencialConductorEmision?.toString()}
                  fechaCaducidad={formData.credencialConductorCaducidad?.toString()}
                  onFrenteChange={(url) => handleInputChange("credencialConductorImagenFrente", url)}
                  onPosteriorChange={(url) => handleInputChange("credencialConductorImagenPosterior", url)}
                  onEmisionChange={(fecha) => handleInputChange("credencialConductorEmision", fecha)}
                  onCaducidadChange={(fecha) => handleInputChange("credencialConductorCaducidad", fecha)}
                  testIdPrefix="credencial-conductor"
                />

                <DocumentoUpload
                  titulo="Credencial de Taxi"
                  imagenFrente={formData.credencialTaxiImagenFrente}
                  imagenPosterior={formData.credencialTaxiImagenPosterior}
                  fechaEmision={formData.credencialTaxiEmision?.toString()}
                  fechaCaducidad={formData.credencialTaxiCaducidad?.toString()}
                  onFrenteChange={(url) => handleInputChange("credencialTaxiImagenFrente", url)}
                  onPosteriorChange={(url) => handleInputChange("credencialTaxiImagenPosterior", url)}
                  onEmisionChange={(fecha) => handleInputChange("credencialTaxiEmision", fecha)}
                  onCaducidadChange={(fecha) => handleInputChange("credencialTaxiCaducidad", fecha)}
                  testIdPrefix="credencial-taxi"
                />
              </TabsContent>

              <TabsContent value="negocio" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      <Star className="h-3 w-3 text-yellow-400" />
                      Nivel 5 - Marketplace
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="nombreLocal" className="text-xs">Nombre del Local</Label>
                      <Input
                        id="nombreLocal"
                        value={formData.nombreLocal || ""}
                        onChange={(e) => handleInputChange("nombreLocal", e.target.value)}
                        placeholder="Mi Negocio"
                        className="h-8"
                        data-testid="input-perfil-nombre-local"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ruc" className="text-xs">RUC</Label>
                      <Input
                        id="ruc"
                        value={formData.ruc || ""}
                        onChange={(e) => handleInputChange("ruc", e.target.value)}
                        placeholder="20123456789"
                        maxLength={11}
                        className="h-8"
                        data-testid="input-perfil-ruc"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="categoriaLocal" className="text-xs">Categoría</Label>
                      <Input
                        id="categoriaLocal"
                        value={formData.categoriaLocal || ""}
                        onChange={(e) => handleInputChange("categoriaLocal", e.target.value)}
                        placeholder="Restaurante, Tienda..."
                        className="h-8"
                        data-testid="input-perfil-categoria-local"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="direccionLocal" className="text-xs">Dirección del Local</Label>
                      <Input
                        id="direccionLocal"
                        value={formData.direccionLocal || ""}
                        onChange={(e) => handleInputChange("direccionLocal", e.target.value)}
                        placeholder="Dirección del negocio"
                        className="h-8"
                        data-testid="input-perfil-direccion-local"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Botones fijos en la parte inferior */}
      <div className="flex-shrink-0 bg-background border-t px-4 py-3 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              if (perfil) setFormData(perfil);
              navigate("/");
            }}
            disabled={updateMutation.isPending}
            data-testid="button-cancelar-perfil"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardar}
            disabled={updateMutation.isPending}
            data-testid="button-guardar-perfil"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
