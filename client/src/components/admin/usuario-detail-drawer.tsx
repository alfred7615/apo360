import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Star, User, Mail, Phone, MapPin, Building, Car, 
  FileText, Shield, Calendar, AlertTriangle, Ban, Check,
  IdCard, Globe, Home, Store
} from "lucide-react";
import type { Usuario } from "@shared/schema";

interface UsuarioDetailDrawerProps {
  usuario: Usuario | null;
  open: boolean;
  onClose: () => void;
}

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

const renderEstrellas = (nivel: number, size: "sm" | "lg" = "sm") => {
  const sizeClass = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sizeClass} ${n <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

const NIVEL_DESCRIPCIONES = [
  { nivel: 1, titulo: "Básico", descripcion: "Alias, Email y Contraseña", icon: User },
  { nivel: 2, titulo: "Servicio Chat", descripcion: "Nombres, DNI, Foto, Celular", icon: IdCard },
  { nivel: 3, titulo: "Ubicación", descripcion: "País, Departamento, Distrito, Sector", icon: Globe },
  { nivel: 4, titulo: "Dirección", descripcion: "Dirección completa con GPS", icon: Home },
  { nivel: 5, titulo: "Marketplace", descripcion: "Local comercial, RUC", icon: Store },
];

const formatFecha = (fecha: any): string => {
  if (!fecha) return "No registrada";
  try {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "Fecha inválida";
  }
};

export function UsuarioDetailDrawer({ usuario, open, onClose }: UsuarioDetailDrawerProps) {
  if (!usuario) return null;

  const nivelActual = calcularNivelUsuario(usuario);
  const nombreCompleto = [usuario.firstName, usuario.lastName].filter(Boolean).join(" ") || "Sin nombre";
  const iniciales = nombreCompleto.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const getEstadoBadge = () => {
    switch (usuario.estado) {
      case "activo":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Activo</Badge>;
      case "suspendido":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Suspendido</Badge>;
      case "bloqueado":
        return <Badge className="bg-red-500"><Ban className="h-3 w-3 mr-1" />Bloqueado</Badge>;
      default:
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Activo</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl" data-testid="drawer-detalle-usuario">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={usuario.profileImageUrl || undefined} alt={nombreCompleto} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {iniciales || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <SheetTitle className="text-xl">{nombreCompleto}</SheetTitle>
              <div className="flex items-center gap-2">
                {renderEstrellas(nivelActual, "lg")}
                <span className="text-sm text-muted-foreground">Nivel {nivelActual}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary">{usuario.rol}</Badge>
            {getEstadoBadge()}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  Progreso de Nivel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {NIVEL_DESCRIPCIONES.map((item) => {
                  const Icon = item.icon;
                  const completado = nivelActual >= item.nivel;
                  return (
                    <div 
                      key={item.nivel}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        completado ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        completado ? 'bg-green-500 text-white' : 'bg-muted'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.titulo}</span>
                          {renderEstrellas(item.nivel)}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                      </div>
                      {completado && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Alias</p>
                    <p className="font-medium">{usuario.alias || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">DNI</p>
                    <p className="font-medium">{usuario.dni || "No registrado"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{usuario.email || "No registrado"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{usuario.telefono || "No registrado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">País</p>
                    <p className="font-medium">{usuario.pais || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">{usuario.departamento || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distrito</p>
                    <p className="font-medium">{usuario.distrito || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="font-medium">{usuario.sector || "No registrado"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{usuario.direccion || "No registrada"}</p>
                </div>
                
                {(usuario.gpsLatitud || usuario.gpsLongitud) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Coordenadas GPS</p>
                    <p className="font-mono text-sm">
                      {usuario.gpsLatitud}, {usuario.gpsLongitud}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(usuario.rol === "conductor" || usuario.modoTaxi === "conductor") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Información de Conductor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehículo</p>
                      <p className="font-medium">{usuario.vehiculoModelo || "No registrado"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Placa</p>
                      <p className="font-medium">{usuario.vehiculoPlaca || "No registrada"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Brevete</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Vence: {formatFecha(usuario.breveteCaducidad)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>SOAT</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Vence: {formatFecha(usuario.soatCaducidad)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Revisión Técnica</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Vence: {formatFecha(usuario.revisionTecnicaCaducidad)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(usuario.rol === "local" || usuario.nombreLocal) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Información del Local
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre del Local</p>
                    <p className="font-medium">{usuario.nombreLocal || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RUC</p>
                    <p className="font-medium">{usuario.ruc || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoría</p>
                    <p className="font-medium">{usuario.categoriaLocal || "No registrada"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección del Local</p>
                    <p className="font-medium">{usuario.direccionLocal || "No registrada"}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(usuario.estado === "suspendido" || usuario.estado === "bloqueado") && (
              <Card className={usuario.estado === "bloqueado" ? "border-red-500" : "border-yellow-500"}>
                <CardHeader>
                  <CardTitle className={`text-base flex items-center gap-2 ${
                    usuario.estado === "bloqueado" ? "text-red-600" : "text-yellow-600"
                  }`}>
                    {usuario.estado === "bloqueado" ? (
                      <Ban className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {usuario.estado === "bloqueado" ? "Usuario Bloqueado" : "Usuario Suspendido"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Motivo</p>
                    <p className="font-medium">
                      {usuario.estado === "bloqueado" 
                        ? (usuario.motivoBloqueo || "Sin motivo especificado")
                        : (usuario.motivoSuspension || "Sin motivo especificado")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {usuario.estado === "bloqueado" 
                        ? formatFecha(usuario.fechaBloqueo)
                        : formatFecha(usuario.fechaSuspension)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                    <p className="font-medium">{formatFecha(usuario.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Actualización</p>
                    <p className="font-medium">{formatFecha(usuario.updatedAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Conexión</p>
                  <p className="font-medium">{formatFecha(usuario.ultimaConexion)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID de Usuario</p>
                  <p className="font-mono text-xs text-muted-foreground">{usuario.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
