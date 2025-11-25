import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, MapPin, FileText, Briefcase, Star, 
  Save, Loader2, Check, Camera
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ProfileImageCapture } from "@/components/ProfileImageCapture";
import type { Usuario } from "@shared/schema";

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

export default function PerfilPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basico");
  const [formData, setFormData] = useState<Partial<Usuario>>({});

  const { data: perfil, isLoading } = useQuery<Usuario>({
    queryKey: ["/api/usuarios/me"],
    enabled: !!user,
  });

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

  const handleGuardar = () => {
    const nivelCalculado = calcularNivelUsuario(formData);
    updateMutation.mutate({
      ...formData,
      nivelUsuario: nivelCalculado,
    });
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

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="page-perfil">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-titulo-perfil">
          <User className="h-6 w-6" />
          Mi Perfil
        </h1>
        <p className="text-muted-foreground">Completa tu información para desbloquear más funciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card data-testid="card-foto-perfil">
            <CardContent className="p-6 flex flex-col items-center">
              <ProfileImageCapture
                usuarioId={user.id}
                imagenActual={formData.profileImageUrl || undefined}
                nombre={formData.firstName || user.nombre || "Usuario"}
                size="xl"
                onImageUpdated={(url) => handleInputChange("profileImageUrl", url)}
              />
              <h2 className="mt-4 text-lg font-semibold" data-testid="text-nombre-usuario">
                {formData.firstName || user.nombre || "Usuario"}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Nivel de Perfil</span>
                  {renderEstrellas(nivelActual)}
                </div>
                <Progress value={progresoNivel} className="h-2" data-testid="progress-nivel" />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {nivelActual} de 5 niveles completados
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-niveles">
            <CardHeader>
              <CardTitle className="text-sm">Niveles de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {NIVELES_INFO.map((info) => (
                <div 
                  key={info.nivel}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    nivelActual >= info.nivel ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'
                  }`}
                  data-testid={`nivel-info-${info.nivel}`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    nivelActual >= info.nivel ? 'bg-green-500' : 'bg-muted-foreground/30'
                  }`}>
                    {nivelActual >= info.nivel ? <Check className="h-3 w-3" /> : info.nivel}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{info.titulo}</p>
                    <p className="text-xs text-muted-foreground">{info.descripcion}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2" data-testid="card-formulario-perfil">
          <CardHeader>
            <CardTitle>Información del Perfil</CardTitle>
            <CardDescription>Completa cada sección para subir de nivel</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico" data-testid="tab-perfil-basico">
                  <User className="h-4 w-4 mr-2" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="ubicacion" data-testid="tab-perfil-ubicacion">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ubicación
                </TabsTrigger>
                <TabsTrigger value="documentos" data-testid="tab-perfil-documentos">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="negocio" data-testid="tab-perfil-negocio">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Negocio
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
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alias">Alias / Apodo</Label>
                      <Input
                        id="alias"
                        value={formData.alias || ""}
                        onChange={(e) => handleInputChange("alias", e.target.value)}
                        placeholder="Tu nombre de usuario"
                        data-testid="input-perfil-alias"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || user.email || ""}
                        disabled
                        className="bg-muted"
                        data-testid="input-perfil-email"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      Nivel 2 - Chat
                    </CardTitle>
                    <CardDescription>Datos para usar el chat comunitario</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombres</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName || ""}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="Tus nombres"
                        data-testid="input-perfil-nombres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName || ""}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Tus apellidos"
                        data-testid="input-perfil-apellidos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono || ""}
                        onChange={(e) => handleInputChange("telefono", e.target.value)}
                        placeholder="+51 999 999 999"
                        data-testid="input-perfil-telefono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI</Label>
                      <Input
                        id="dni"
                        value={formData.dni || ""}
                        onChange={(e) => handleInputChange("dni", e.target.value)}
                        placeholder="12345678"
                        maxLength={8}
                        data-testid="input-perfil-dni"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ubicacion" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      Nivel 3 - Ubicación
                    </CardTitle>
                    <CardDescription>Tu ubicación general</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pais">País</Label>
                      <Input
                        id="pais"
                        value={formData.pais || "Perú"}
                        onChange={(e) => handleInputChange("pais", e.target.value)}
                        data-testid="input-perfil-pais"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        id="departamento"
                        value={formData.departamento || ""}
                        onChange={(e) => handleInputChange("departamento", e.target.value)}
                        placeholder="Tacna"
                        data-testid="input-perfil-departamento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distrito">Distrito</Label>
                      <Input
                        id="distrito"
                        value={formData.distrito || ""}
                        onChange={(e) => handleInputChange("distrito", e.target.value)}
                        placeholder="Tacna"
                        data-testid="input-perfil-distrito"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector</Label>
                      <Input
                        id="sector"
                        value={formData.sector || ""}
                        onChange={(e) => handleInputChange("sector", e.target.value)}
                        placeholder="Centro"
                        data-testid="input-perfil-sector"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      Nivel 4 - Dirección
                    </CardTitle>
                    <CardDescription>Tu dirección completa</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="avenidaCalle">Avenida / Calle</Label>
                      <Input
                        id="avenidaCalle"
                        value={formData.avenidaCalle || ""}
                        onChange={(e) => handleInputChange("avenidaCalle", e.target.value)}
                        placeholder="Av. Principal"
                        data-testid="input-perfil-avenida"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manzanaLote">Manzana / Lote</Label>
                      <Input
                        id="manzanaLote"
                        value={formData.manzanaLote || ""}
                        onChange={(e) => handleInputChange("manzanaLote", e.target.value)}
                        placeholder="Mz. A Lt. 10"
                        data-testid="input-perfil-manzana"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="direccion">Dirección Completa</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion || ""}
                        onChange={(e) => handleInputChange("direccion", e.target.value)}
                        placeholder="Dirección completa"
                        data-testid="input-perfil-direccion"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gpsLatitud">Latitud GPS</Label>
                      <Input
                        id="gpsLatitud"
                        type="number"
                        step="any"
                        value={formData.gpsLatitud || ""}
                        onChange={(e) => handleInputChange("gpsLatitud", parseFloat(e.target.value))}
                        placeholder="-18.0065"
                        data-testid="input-perfil-latitud"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gpsLongitud">Longitud GPS</Label>
                      <Input
                        id="gpsLongitud"
                        type="number"
                        step="any"
                        value={formData.gpsLongitud || ""}
                        onChange={(e) => handleInputChange("gpsLongitud", parseFloat(e.target.value))}
                        placeholder="-70.2463"
                        data-testid="input-perfil-longitud"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documentos" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documentos de Identidad</CardTitle>
                    <CardDescription>
                      Sube fotos de tu DNI para verificar tu identidad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      La carga de documentos estará disponible próximamente
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="negocio" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      Nivel 5 - Marketplace
                    </CardTitle>
                    <CardDescription>Datos de tu negocio para el marketplace</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreLocal">Nombre del Local</Label>
                      <Input
                        id="nombreLocal"
                        value={formData.nombreLocal || ""}
                        onChange={(e) => handleInputChange("nombreLocal", e.target.value)}
                        placeholder="Mi Negocio"
                        data-testid="input-perfil-nombre-local"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ruc">RUC</Label>
                      <Input
                        id="ruc"
                        value={formData.ruc || ""}
                        onChange={(e) => handleInputChange("ruc", e.target.value)}
                        placeholder="20123456789"
                        maxLength={11}
                        data-testid="input-perfil-ruc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoriaLocal">Categoría del Negocio</Label>
                      <Input
                        id="categoriaLocal"
                        value={formData.categoriaLocal || ""}
                        onChange={(e) => handleInputChange("categoriaLocal", e.target.value)}
                        placeholder="Restaurante, Tienda, etc."
                        data-testid="input-perfil-categoria-local"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
