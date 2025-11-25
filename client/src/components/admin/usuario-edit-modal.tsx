import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, MapPin, FileText, Shield, Star, 
  Car, Briefcase, AlertTriangle, Ban, 
  Check, X, Save, Loader2 
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Usuario } from "@shared/schema";

interface UsuarioEditModalProps {
  usuario: Usuario | null;
  open: boolean;
  onClose: () => void;
}

const ROLES_DISPONIBLES = [
  { id: "usuario", label: "Usuario", descripcion: "Usuario básico del sistema" },
  { id: "conductor", label: "Conductor", descripcion: "Taxista, delivery, mudanzas" },
  { id: "local", label: "Local Comercial", descripcion: "Propietario de negocio" },
  { id: "serenazgo", label: "Serenazgo", descripcion: "Personal de seguridad municipal" },
  { id: "policia", label: "Policía", descripcion: "Miembro de la PNP" },
  { id: "bombero", label: "Bombero", descripcion: "Miembro del cuerpo de bomberos" },
  { id: "samu", label: "SAMU", descripcion: "Personal de emergencias médicas" },
  { id: "supervisor", label: "Supervisor", descripcion: "Supervisor de operaciones" },
  { id: "admin_operaciones", label: "Admin Operaciones", descripcion: "Administrador de operaciones" },
  { id: "admin_cartera", label: "Admin Cartera", descripcion: "Administrador de cartera/saldos" },
  { id: "admin_publicidad", label: "Admin Publicidad", descripcion: "Administrador de publicidad" },
  { id: "admin_radio", label: "Admin Radio", descripcion: "Administrador de radio online" },
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
          className={`h-4 w-4 ${n <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">Nivel {nivel}</span>
    </div>
  );
};

export function UsuarioEditModal({ usuario, open, onClose }: UsuarioEditModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basico");
  const [formData, setFormData] = useState<Partial<Usuario>>({});
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const [motivoAccion, setMotivoAccion] = useState("");
  
  useEffect(() => {
    if (usuario) {
      setFormData({ ...usuario });
      setRolesSeleccionados(usuario.rol ? [usuario.rol] : []);
    } else {
      setFormData({});
      setRolesSeleccionados([]);
    }
  }, [usuario]);

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
      toast({ title: "Usuario suspendido", description: "El usuario ha sido suspendido" });
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
      toast({ title: "Usuario bloqueado", description: "El usuario ha sido bloqueado" });
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
      toast({ title: "Usuario activado", description: "El usuario ha sido reactivado" });
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

  const handleGuardar = () => {
    const rolPrincipal = rolesSeleccionados[0] || "usuario";
    const nivelCalculado = calcularNivelUsuario(formData);
    
    updateMutation.mutate({
      ...formData,
      rol: rolPrincipal,
      nivelUsuario: nivelCalculado,
    });
  };

  if (!usuario) return null;

  const nivelActual = calcularNivelUsuario(formData);
  const isPending = updateMutation.isPending || suspenderMutation.isPending || bloquearMutation.isPending || activarMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="modal-editar-usuario">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>Editar Usuario</span>
              <div className="flex items-center gap-2 mt-1">
                {renderEstrellas(nivelActual)}
                <Badge 
                  className={
                    usuario.estado === "activo" ? "bg-green-500" :
                    usuario.estado === "suspendido" ? "bg-yellow-500" :
                    usuario.estado === "bloqueado" ? "bg-red-500" : "bg-gray-500"
                  }
                >
                  {usuario.estado || "activo"}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basico" data-testid="tab-basico">
                <User className="h-4 w-4 mr-2" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="ubicacion" data-testid="tab-ubicacion">
                <MapPin className="h-4 w-4 mr-2" />
                Ubicación
              </TabsTrigger>
              <TabsTrigger value="documentos" data-testid="tab-documentos">
                <FileText className="h-4 w-4 mr-2" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="roles" data-testid="tab-roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="acciones" data-testid="tab-acciones">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Acciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    Nivel 1 - Básico
                  </CardTitle>
                  <CardDescription>Información mínima requerida</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alias">Alias</Label>
                    <Input
                      id="alias"
                      value={formData.alias || ""}
                      onChange={(e) => handleInputChange("alias", e.target.value)}
                      placeholder="Nombre de usuario"
                      data-testid="input-alias"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
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
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <Star className="h-4 w-4 text-yellow-400" />
                    Nivel 2 - Servicio Chat
                  </CardTitle>
                  <CardDescription>Datos personales para servicios de chat</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombres</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ""}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Nombres completos"
                      data-testid="input-nombres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName || ""}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Apellidos completos"
                      data-testid="input-apellidos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Número Celular</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ""}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="+51 999 999 999"
                      data-testid="input-telefono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      value={formData.dni || ""}
                      onChange={(e) => handleInputChange("dni", e.target.value)}
                      placeholder="12345678"
                      data-testid="input-dni"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ubicacion" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {[1, 2, 3].map((n) => (
                      <Star key={n} className="h-4 w-4 text-yellow-400" />
                    ))}
                    Nivel 3 - Ubicación
                  </CardTitle>
                  <CardDescription>Ubicación geográfica del usuario</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      value={formData.pais || ""}
                      onChange={(e) => handleInputChange("pais", e.target.value)}
                      placeholder="Perú"
                      data-testid="input-pais"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={formData.departamento || ""}
                      onChange={(e) => handleInputChange("departamento", e.target.value)}
                      placeholder="Tacna"
                      data-testid="input-departamento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distrito">Distrito</Label>
                    <Input
                      id="distrito"
                      value={formData.distrito || ""}
                      onChange={(e) => handleInputChange("distrito", e.target.value)}
                      placeholder="Alto de la Alianza"
                      data-testid="input-distrito"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector</Label>
                    <Input
                      id="sector"
                      value={formData.sector || ""}
                      onChange={(e) => handleInputChange("sector", e.target.value)}
                      placeholder="Sector o zona"
                      data-testid="input-sector"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <Star key={n} className="h-4 w-4 text-yellow-400" />
                    ))}
                    Nivel 4 - Dirección
                  </CardTitle>
                  <CardDescription>Dirección exacta con GPS</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion || ""}
                      onChange={(e) => handleInputChange("direccion", e.target.value)}
                      placeholder="Dirección completa"
                      data-testid="input-direccion"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manzanaLote">Manzana / Lote / Número</Label>
                    <Input
                      id="manzanaLote"
                      value={formData.manzanaLote || ""}
                      onChange={(e) => handleInputChange("manzanaLote", e.target.value)}
                      placeholder="Mz A Lt 15"
                      data-testid="input-manzana-lote"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avenidaCalle">Avenida / Calle</Label>
                    <Input
                      id="avenidaCalle"
                      value={formData.avenidaCalle || ""}
                      onChange={(e) => handleInputChange("avenidaCalle", e.target.value)}
                      placeholder="Av. Coronel Mendoza"
                      data-testid="input-avenida-calle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpsLatitud">GPS Latitud</Label>
                    <Input
                      id="gpsLatitud"
                      type="number"
                      step="any"
                      value={formData.gpsLatitud || ""}
                      onChange={(e) => handleInputChange("gpsLatitud", parseFloat(e.target.value))}
                      placeholder="-18.0146"
                      data-testid="input-gps-latitud"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpsLongitud">GPS Longitud</Label>
                    <Input
                      id="gpsLongitud"
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

            <TabsContent value="documentos" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-4 w-4 text-yellow-400" />
                    ))}
                    Nivel 5 - Marketplace
                  </CardTitle>
                  <CardDescription>Datos para venta de productos o servicios</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreLocal">Nombre del Local / Empresa</Label>
                    <Input
                      id="nombreLocal"
                      value={formData.nombreLocal || ""}
                      onChange={(e) => handleInputChange("nombreLocal", e.target.value)}
                      placeholder="Mi Negocio SAC"
                      data-testid="input-nombre-local"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruc">RUC</Label>
                    <Input
                      id="ruc"
                      value={formData.ruc || ""}
                      onChange={(e) => handleInputChange("ruc", e.target.value)}
                      placeholder="20123456789"
                      data-testid="input-ruc"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="direccionLocal">Dirección del Local</Label>
                    <Input
                      id="direccionLocal"
                      value={formData.direccionLocal || ""}
                      onChange={(e) => handleInputChange("direccionLocal", e.target.value)}
                      placeholder="Dirección del local comercial"
                      data-testid="input-direccion-local"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="h-5 w-5 text-orange-500" />
                    Documentos de Conductor
                  </CardTitle>
                  <CardDescription>Brevete, SOAT, revisión técnica y credenciales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="col-span-2">
                      <h4 className="font-medium">Brevete</h4>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Emisión</Label>
                      <Input
                        type="date"
                        value={formData.breveteEmision || ""}
                        onChange={(e) => handleInputChange("breveteEmision", e.target.value)}
                        data-testid="input-brevete-emision"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Caducidad</Label>
                      <Input
                        type="date"
                        value={formData.breveteCaducidad || ""}
                        onChange={(e) => handleInputChange("breveteCaducidad", e.target.value)}
                        data-testid="input-brevete-caducidad"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="col-span-2">
                      <h4 className="font-medium">SOAT</h4>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Emisión</Label>
                      <Input
                        type="date"
                        value={formData.soatEmision || ""}
                        onChange={(e) => handleInputChange("soatEmision", e.target.value)}
                        data-testid="input-soat-emision"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Caducidad</Label>
                      <Input
                        type="date"
                        value={formData.soatCaducidad || ""}
                        onChange={(e) => handleInputChange("soatCaducidad", e.target.value)}
                        data-testid="input-soat-caducidad"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="col-span-2">
                      <h4 className="font-medium">Revisión Técnica</h4>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Emisión</Label>
                      <Input
                        type="date"
                        value={formData.revisionTecnicaEmision || ""}
                        onChange={(e) => handleInputChange("revisionTecnicaEmision", e.target.value)}
                        data-testid="input-revision-emision"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Caducidad</Label>
                      <Input
                        type="date"
                        value={formData.revisionTecnicaCaducidad || ""}
                        onChange={(e) => handleInputChange("revisionTecnicaCaducidad", e.target.value)}
                        data-testid="input-revision-caducidad"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehiculoModelo">Modelo Vehículo</Label>
                      <Input
                        id="vehiculoModelo"
                        value={formData.vehiculoModelo || ""}
                        onChange={(e) => handleInputChange("vehiculoModelo", e.target.value)}
                        placeholder="Toyota Yaris 2020"
                        data-testid="input-vehiculo-modelo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehiculoPlaca">Placa</Label>
                      <Input
                        id="vehiculoPlaca"
                        value={formData.vehiculoPlaca || ""}
                        onChange={(e) => handleInputChange("vehiculoPlaca", e.target.value)}
                        placeholder="ABC-123"
                        data-testid="input-vehiculo-placa"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Asignar Roles</CardTitle>
                  <CardDescription>
                    Un usuario puede tener múltiples roles (taxista, serenazgo, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES_DISPONIBLES.map((rol) => (
                      <div
                        key={rol.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          rolesSeleccionados.includes(rol.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleRolToggle(rol.id)}
                        data-testid={`checkbox-rol-${rol.id}`}
                      >
                        <Checkbox
                          checked={rolesSeleccionados.includes(rol.id)}
                          onCheckedChange={() => handleRolToggle(rol.id)}
                        />
                        <div>
                          <p className="font-medium">{rol.label}</p>
                          <p className="text-sm text-muted-foreground">{rol.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {rolesSeleccionados.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Roles asignados:</p>
                      <div className="flex flex-wrap gap-2">
                        {rolesSeleccionados.map((rolId) => {
                          const rol = ROLES_DISPONIBLES.find(r => r.id === rolId);
                          return (
                            <Badge key={rolId} variant="secondary">
                              {rol?.label || rolId}
                              <X 
                                className="h-3 w-3 ml-1 cursor-pointer" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRolToggle(rolId);
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="acciones" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Suspender Usuario
                  </CardTitle>
                  <CardDescription>
                    Suspender temporalmente el acceso del usuario al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Motivo de suspensión</Label>
                    <Textarea
                      value={motivoAccion}
                      onChange={(e) => setMotivoAccion(e.target.value)}
                      placeholder="Explique el motivo de la suspensión..."
                      data-testid="input-motivo-suspension"
                    />
                  </div>
                  {usuario.estado === "suspendido" ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => activarMutation.mutate()}
                      disabled={isPending}
                      data-testid="button-reactivar"
                    >
                      {activarMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Reactivar Usuario
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                      onClick={() => suspenderMutation.mutate()}
                      disabled={isPending || !motivoAccion.trim()}
                      data-testid="button-suspender"
                    >
                      {suspenderMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      )}
                      Suspender Usuario
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    Bloquear Usuario
                  </CardTitle>
                  <CardDescription>
                    Bloquear permanentemente el acceso del usuario al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Motivo de bloqueo</Label>
                    <Textarea
                      value={motivoAccion}
                      onChange={(e) => setMotivoAccion(e.target.value)}
                      placeholder="Explique el motivo del bloqueo..."
                      data-testid="input-motivo-bloqueo"
                    />
                  </div>
                  {usuario.estado === "bloqueado" ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => activarMutation.mutate()}
                      disabled={isPending}
                      data-testid="button-desbloquear"
                    >
                      {activarMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Desbloquear Usuario
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => bloquearMutation.mutate()}
                      disabled={isPending || !motivoAccion.trim()}
                      data-testid="button-bloquear"
                    >
                      {bloquearMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4 mr-2" />
                      )}
                      Bloquear Usuario
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancelar">
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardar} 
            disabled={isPending}
            data-testid="button-guardar-usuario"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
