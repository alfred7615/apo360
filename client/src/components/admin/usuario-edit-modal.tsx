import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User, MapPin, FileText, Shield, Star, 
  Car, Briefcase, AlertTriangle, Ban, 
  Check, X, Save, Loader2, Camera, Upload
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageEditor } from "@/components/ImageEditor";
import type { Usuario } from "@shared/schema";

interface UsuarioEditModalProps {
  usuario: Usuario | null;
  open: boolean;
  onClose: () => void;
}

const ROLES_DISPONIBLES = [
  { id: "usuario", label: "Usuario", descripcion: "Usuario básico del sistema", icon: User },
  { id: "conductor", label: "Conductor", descripcion: "Taxista, delivery, mudanzas", icon: Car },
  { id: "local", label: "Local Comercial", descripcion: "Propietario de negocio", icon: Briefcase },
  { id: "serenazgo", label: "Serenazgo", descripcion: "Personal de seguridad municipal", icon: Shield },
  { id: "policia", label: "Policía", descripcion: "Miembro de la PNP", icon: Shield },
  { id: "bombero", label: "Bombero", descripcion: "Miembro del cuerpo de bomberos", icon: Shield },
  { id: "samu", label: "SAMU", descripcion: "Personal de emergencias médicas", icon: Shield },
  { id: "supervisor", label: "Supervisor", descripcion: "Supervisor de operaciones", icon: Shield },
  { id: "admin_operaciones", label: "Admin Operaciones", descripcion: "Administrador de operaciones", icon: Shield },
  { id: "admin_cartera", label: "Admin Cartera", descripcion: "Administrador de cartera/saldos", icon: Shield },
  { id: "admin_publicidad", label: "Admin Publicidad", descripcion: "Administrador de publicidad", icon: Shield },
  { id: "admin_radio", label: "Admin Radio", descripcion: "Administrador de radio online", icon: Shield },
];

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

const calcularNivelUsuario = (usuario: any): number => {
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
          className={`h-4 w-4 ${n <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">Nivel {nivel}</span>
    </div>
  );
};

async function uploadImageToServer(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('imagen', file);
    
    const response = await fetch('/api/upload/documentos', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) throw new Error('Error al subir imagen');
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

interface DocumentoUploadFieldProps {
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

function DocumentoUploadField({
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
}: DocumentoUploadFieldProps) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState<'frente' | 'posterior' | null>(null);
  const [uploading, setUploading] = useState<'frente' | 'posterior' | null>(null);

  const handleSaveImage = async (type: 'frente' | 'posterior', dataUrl: string) => {
    setUploading(type);
    try {
      const file = await dataUrlToFile(dataUrl, `${testIdPrefix}_${type}_${Date.now()}.jpg`);
      const url = await uploadImageToServer(file);
      if (url) {
        if (type === 'frente') onFrenteChange(url);
        else onPosteriorChange(url);
        toast({ title: "Imagen guardada", description: "La imagen se subió correctamente" });
        setEditorOpen(null);
      } else {
        toast({ title: "Error", description: "No se pudo subir la imagen. Intente de nuevo.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al procesar la imagen. Intente de nuevo.", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <h4 className="font-medium text-sm">{titulo}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Foto Frontal</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors h-20 flex items-center justify-center ${uploading === 'frente' ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => setEditorOpen('frente')}
            data-testid={`${testIdPrefix}-frente-trigger`}
          >
            {uploading === 'frente' ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : imagenFrente ? (
              <img src={imagenFrente} alt="Frente" className="h-full w-full object-cover rounded" />
            ) : (
              <div className="flex flex-col items-center">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Frente</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Foto Posterior</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors h-20 flex items-center justify-center ${uploading === 'posterior' ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => setEditorOpen('posterior')}
            data-testid={`${testIdPrefix}-posterior-trigger`}
          >
            {uploading === 'posterior' ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : imagenPosterior ? (
              <img src={imagenPosterior} alt="Posterior" className="h-full w-full object-cover rounded" />
            ) : (
              <div className="flex flex-col items-center">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Posterior</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Fecha Emisión</Label>
          <Input
            type="date"
            value={fechaEmision || ""}
            onChange={(e) => onEmisionChange(e.target.value)}
            className="h-8 text-xs"
            data-testid={`${testIdPrefix}-emision`}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fecha Caducidad</Label>
          <Input
            type="date"
            value={fechaCaducidad || ""}
            onChange={(e) => onCaducidadChange(e.target.value)}
            className="h-8 text-xs"
            data-testid={`${testIdPrefix}-caducidad`}
          />
        </div>
      </div>

      <ImageEditor
        open={editorOpen === 'frente'}
        onClose={() => setEditorOpen(null)}
        onSave={(dataUrl) => handleSaveImage('frente', dataUrl)}
        aspectRatio={1.5}
        title={`${titulo} - Frente`}
      />
      <ImageEditor
        open={editorOpen === 'posterior'}
        onClose={() => setEditorOpen(null)}
        onSave={(dataUrl) => handleSaveImage('posterior', dataUrl)}
        aspectRatio={1.5}
        title={`${titulo} - Posterior`}
      />
    </div>
  );
}

interface FotoVehiculoFieldProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  testId: string;
}

function FotoVehiculoField({ label, value, onChange, testId }: FotoVehiculoFieldProps) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSaveImage = async (dataUrl: string) => {
    setUploading(true);
    try {
      const file = await dataUrlToFile(dataUrl, `vehiculo_${testId}_${Date.now()}.jpg`);
      const url = await uploadImageToServer(file);
      if (url) {
        onChange(url);
        toast({ title: "Imagen guardada" });
        setEditorOpen(false);
      } else {
        toast({ title: "Error", description: "No se pudo subir la imagen. Intente de nuevo.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Intente de nuevo.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-1 text-center cursor-pointer hover:bg-muted/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => setEditorOpen(true)}
        data-testid={testId}
      >
        {uploading ? (
          <div className="h-16 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : value ? (
          <img src={value} alt={label} className="h-16 w-full object-cover rounded" />
        ) : (
          <div className="h-16 flex flex-col items-center justify-center">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        )}
      </div>
      <ImageEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveImage}
        aspectRatio={1.5}
        title={`Foto - ${label}`}
      />
    </>
  );
}

export function UsuarioEditModal({ usuario, open, onClose }: UsuarioEditModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basico");
  const [formData, setFormData] = useState<Partial<Usuario>>({});
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [motivoAccion, setMotivoAccion] = useState("");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  
  useEffect(() => {
    if (usuario) {
      setFormData({ ...usuario });
      setRolesSeleccionados(usuario.rol ? [usuario.rol] : []);
    } else {
      setFormData({});
      setRolesSeleccionados([]);
    }
    setActiveTab("basico");
  }, [usuario, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Usuario>) => {
      const response = await apiRequest("PATCH", `/api/usuarios/${usuario?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({ title: "Usuario actualizado", description: "Los cambios se guardaron correctamente" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el usuario", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Usuario>) => {
      const response = await apiRequest("POST", `/api/usuarios`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({ title: "Usuario creado", description: "El nuevo usuario se ha registrado correctamente" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear el usuario", variant: "destructive" });
    },
  });

  const suspenderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/usuarios/${usuario?.id}`, {
        estado: "suspendido",
        motivoSuspension: motivoAccion,
        fechaSuspension: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({ title: "Usuario suspendido" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bloquearMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/usuarios/${usuario?.id}`, {
        estado: "bloqueado",
        motivoBloqueo: motivoAccion,
        fechaBloqueo: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({ title: "Usuario bloqueado" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/usuarios/${usuario?.id}`, {
        estado: "activo",
        motivoSuspension: null,
        fechaSuspension: null,
        motivoBloqueo: null,
        fechaBloqueo: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({ title: "Usuario activado" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleInputChange = (field: keyof Usuario, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRolToggle = (rolId: string) => {
    setRolesSeleccionados((prev) => 
      prev.includes(rolId) 
        ? prev.filter(r => r !== rolId)
        : [...prev, rolId]
    );
  };

  const handleProfileImageSave = async (dataUrl: string) => {
    setUploadingProfile(true);
    try {
      const file = await dataUrlToFile(dataUrl, `profile_${Date.now()}.jpg`);
      const url = await uploadImageToServer(file);
      if (url) {
        handleInputChange("profileImageUrl", url);
        toast({ title: "Foto de perfil actualizada" });
        setProfileEditorOpen(false);
      } else {
        toast({ title: "Error", description: "No se pudo subir la foto. Intente de nuevo.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Intente de nuevo.", variant: "destructive" });
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleGuardar = () => {
    const rolPrincipal = rolesSeleccionados[0] || "usuario";
    const nivelCalculado = calcularNivelUsuario(formData);
    
    const datosGuardar = {
      ...formData,
      rol: rolPrincipal,
      nivelUsuario: nivelCalculado,
    };

    if (usuario) {
      updateMutation.mutate(datosGuardar);
    } else {
      createMutation.mutate(datosGuardar);
    }
  };

  const esNuevoUsuario = !usuario;
  const nivelActual = calcularNivelUsuario(formData);
  const isPending = updateMutation.isPending || createMutation.isPending || suspenderMutation.isPending || bloquearMutation.isPending || activarMutation.isPending;
  const estadoActual = usuario?.estado || "activo";
  const nombreCompleto = [formData.firstName, formData.lastName].filter(Boolean).join(" ") || "Nuevo Usuario";
  const iniciales = nombreCompleto.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" data-testid="modal-editar-usuario">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-4">
            <div className="relative">
              <Avatar 
                className="h-16 w-16 cursor-pointer border-2 border-primary/20"
                onClick={() => setProfileEditorOpen(true)}
              >
                {uploadingProfile ? (
                  <div className="h-full w-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <AvatarImage src={formData.profileImageUrl || undefined} alt={nombreCompleto} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {iniciales || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1 bg-primary rounded-full">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{esNuevoUsuario ? "Nuevo Usuario" : nombreCompleto}</span>
                {!esNuevoUsuario && (
                  <Badge 
                    className={
                      estadoActual === "activo" ? "bg-green-500" :
                      estadoActual === "suspendido" ? "bg-yellow-500" :
                      estadoActual === "bloqueado" ? "bg-red-500" : "bg-gray-500"
                    }
                  >
                    {estadoActual}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {renderEstrellas(nivelActual)}
              </div>
              <Progress value={(nivelActual / 5) * 100} className="h-1 mt-2" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <ImageEditor
          open={profileEditorOpen}
          onClose={() => setProfileEditorOpen(false)}
          onSave={handleProfileImageSave}
          aspectRatio={1}
          title="Foto de Perfil"
        />

        <ScrollArea className="h-[60vh] px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full mb-4 ${esNuevoUsuario ? 'grid-cols-4' : 'grid-cols-5'}`}>
              <TabsTrigger value="basico" data-testid="tab-basico">
                <User className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="ubicacion" data-testid="tab-ubicacion">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Ubicación</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" data-testid="tab-documentos">
                <FileText className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
              <TabsTrigger value="roles" data-testid="tab-roles">
                <Shield className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
              {!esNuevoUsuario && (
                <TabsTrigger value="acciones" data-testid="tab-acciones">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Acciones</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basico" className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    Nivel 1 - Básico
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Alias</Label>
                    <Input
                      value={formData.alias || ""}
                      onChange={(e) => handleInputChange("alias", e.target.value)}
                      placeholder="Nombre de usuario"
                      data-testid="input-alias"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="correo@ejemplo.com"
                      data-testid="input-email"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {[1, 2].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    Nivel 2 - Servicio Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombres</Label>
                    <Input
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Nombres completos"
                      data-testid="input-nombres"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Apellidos</Label>
                    <Input
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Apellidos completos"
                      data-testid="input-apellidos"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      value={formData.telefono || ""}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="+51 999 999 999"
                      data-testid="input-telefono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">DNI</Label>
                    <Input
                      value={formData.dni || ""}
                      onChange={(e) => handleInputChange("dni", e.target.value)}
                      placeholder="12345678"
                      data-testid="input-dni"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ubicacion" className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {[1, 2, 3].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    Nivel 3 - Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">País</Label>
                    <Input
                      value={formData.pais || ""}
                      onChange={(e) => handleInputChange("pais", e.target.value)}
                      placeholder="Perú"
                      data-testid="input-pais"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Departamento</Label>
                    <Input
                      value={formData.departamento || ""}
                      onChange={(e) => handleInputChange("departamento", e.target.value)}
                      placeholder="Tacna"
                      data-testid="input-departamento"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Distrito</Label>
                    <Input
                      value={formData.distrito || ""}
                      onChange={(e) => handleInputChange("distrito", e.target.value)}
                      placeholder="Alto de la Alianza"
                      data-testid="input-distrito"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sector</Label>
                    <Input
                      value={formData.sector || ""}
                      onChange={(e) => handleInputChange("sector", e.target.value)}
                      placeholder="Sector o zona"
                      data-testid="input-sector"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    Nivel 4 - Dirección
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Dirección</Label>
                    <Input
                      value={formData.direccion || ""}
                      onChange={(e) => handleInputChange("direccion", e.target.value)}
                      placeholder="Dirección completa"
                      data-testid="input-direccion"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Manzana / Lote</Label>
                    <Input
                      value={formData.manzanaLote || ""}
                      onChange={(e) => handleInputChange("manzanaLote", e.target.value)}
                      placeholder="Mz A Lt 15"
                      data-testid="input-manzana-lote"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Avenida / Calle</Label>
                    <Input
                      value={formData.avenidaCalle || ""}
                      onChange={(e) => handleInputChange("avenidaCalle", e.target.value)}
                      placeholder="Av. Coronel Mendoza"
                      data-testid="input-avenida-calle"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">GPS Latitud</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.gpsLatitud || ""}
                      onChange={(e) => handleInputChange("gpsLatitud", parseFloat(e.target.value))}
                      placeholder="-18.0146"
                      data-testid="input-gps-latitud"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">GPS Longitud</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.gpsLongitud || ""}
                      onChange={(e) => handleInputChange("gpsLongitud", parseFloat(e.target.value))}
                      placeholder="-70.2536"
                      data-testid="input-gps-longitud"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    Nivel 5 - Marketplace
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre del Local</Label>
                    <Input
                      value={formData.nombreLocal || ""}
                      onChange={(e) => handleInputChange("nombreLocal", e.target.value)}
                      placeholder="Mi Negocio SAC"
                      data-testid="input-nombre-local"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">RUC</Label>
                    <Input
                      value={formData.ruc || ""}
                      onChange={(e) => handleInputChange("ruc", e.target.value)}
                      placeholder="20123456789"
                      data-testid="input-ruc"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Dirección del Local</Label>
                    <Input
                      value={formData.direccionLocal || ""}
                      onChange={(e) => handleInputChange("direccionLocal", e.target.value)}
                      placeholder="Dirección comercial"
                      data-testid="input-direccion-local"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4 text-orange-500" />
                    Documentos de Conductor
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Brevete, SOAT, revisión técnica y credenciales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DocumentoUploadField
                    titulo="Brevete / Licencia"
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
                  <DocumentoUploadField
                    titulo="SOAT"
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
                  <DocumentoUploadField
                    titulo="Revisión Técnica"
                    imagenFrente={formData.revisionTecnicaImagenFrente}
                    imagenPosterior={formData.revisionTecnicaImagenPosterior}
                    fechaEmision={formData.revisionTecnicaEmision?.toString()}
                    fechaCaducidad={formData.revisionTecnicaCaducidad?.toString()}
                    onFrenteChange={(url) => handleInputChange("revisionTecnicaImagenFrente", url)}
                    onPosteriorChange={(url) => handleInputChange("revisionTecnicaImagenPosterior", url)}
                    onEmisionChange={(fecha) => handleInputChange("revisionTecnicaEmision", fecha)}
                    onCaducidadChange={(fecha) => handleInputChange("revisionTecnicaCaducidad", fecha)}
                    testIdPrefix="revision"
                  />
                  <DocumentoUploadField
                    titulo="Credencial Conductor"
                    imagenFrente={formData.credencialConductorImagenFrente}
                    imagenPosterior={formData.credencialConductorImagenPosterior}
                    fechaEmision={formData.credencialConductorEmision?.toString()}
                    fechaCaducidad={formData.credencialConductorCaducidad?.toString()}
                    onFrenteChange={(url) => handleInputChange("credencialConductorImagenFrente", url)}
                    onPosteriorChange={(url) => handleInputChange("credencialConductorImagenPosterior", url)}
                    onEmisionChange={(fecha) => handleInputChange("credencialConductorEmision", fecha)}
                    onCaducidadChange={(fecha) => handleInputChange("credencialConductorCaducidad", fecha)}
                    testIdPrefix="credencial"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-500" />
                    Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de Vehículo</Label>
                      <Select
                        value={formData.tipoVehiculo || ""}
                        onValueChange={(value) => handleInputChange("tipoVehiculo", value)}
                      >
                        <SelectTrigger data-testid="select-tipo-vehiculo">
                          <SelectValue placeholder="Seleccionar..." />
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
                      <Label className="text-xs">Placa</Label>
                      <Input
                        value={formData.vehiculoPlaca || ""}
                        onChange={(e) => handleInputChange("vehiculoPlaca", e.target.value.toUpperCase())}
                        placeholder="ABC-123"
                        data-testid="input-placa"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs block mb-2">Fotos del Vehículo (4 lados)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <FotoVehiculoField
                        label="Frontal"
                        value={formData.vehiculoFotoFrente}
                        onChange={(url) => handleInputChange("vehiculoFotoFrente", url)}
                        testId="foto-vehiculo-frontal"
                      />
                      <FotoVehiculoField
                        label="Posterior"
                        value={formData.vehiculoFotoPosterior}
                        onChange={(url) => handleInputChange("vehiculoFotoPosterior", url)}
                        testId="foto-vehiculo-posterior"
                      />
                      <FotoVehiculoField
                        label="Lat. Izq"
                        value={formData.vehiculoFotoLateralIzq}
                        onChange={(url) => handleInputChange("vehiculoFotoLateralIzq", url)}
                        testId="foto-vehiculo-lateral-izq"
                      />
                      <FotoVehiculoField
                        label="Lat. Der"
                        value={formData.vehiculoFotoLateralDer}
                        onChange={(url) => handleInputChange("vehiculoFotoLateralDer", url)}
                        testId="foto-vehiculo-lateral-der"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Asignar Roles</CardTitle>
                  <CardDescription className="text-xs">
                    Selecciona el rol principal del usuario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES_DISPONIBLES.map((rol) => {
                      const RolIcon = rol.icon;
                      const isSelected = rolesSeleccionados.includes(rol.id);
                      return (
                        <div
                          key={rol.id}
                          className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                          onClick={() => handleRolToggle(rol.id)}
                          data-testid={`rol-${rol.id}`}
                        >
                          <Checkbox checked={isSelected} />
                          <RolIcon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{rol.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{rol.descripcion}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {!esNuevoUsuario && (
              <TabsContent value="acciones" className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Acciones de Moderación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Motivo (opcional)</Label>
                      <Input
                        value={motivoAccion}
                        onChange={(e) => setMotivoAccion(e.target.value)}
                        placeholder="Motivo de la acción..."
                        data-testid="input-motivo"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {estadoActual !== "suspendido" && (
                        <Button
                          variant="outline"
                          className="text-yellow-600 border-yellow-600"
                          onClick={() => suspenderMutation.mutate()}
                          disabled={isPending}
                          data-testid="button-suspender"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Suspender
                        </Button>
                      )}
                      {estadoActual !== "bloqueado" && (
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-600"
                          onClick={() => bloquearMutation.mutate()}
                          disabled={isPending}
                          data-testid="button-bloquear"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Bloquear
                        </Button>
                      )}
                      {(estadoActual === "suspendido" || estadoActual === "bloqueado") && (
                        <Button
                          variant="outline"
                          className="text-green-600 border-green-600"
                          onClick={() => activarMutation.mutate()}
                          disabled={isPending}
                          data-testid="button-activar"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </ScrollArea>

        <DialogFooter className="p-4 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending} data-testid="button-cancelar">
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={isPending} data-testid="button-guardar">
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {esNuevoUsuario ? "Crear Usuario" : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
