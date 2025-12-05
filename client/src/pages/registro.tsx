import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Star, User, MessageCircle, MapPin, Home, Store, 
  ArrowLeft, ArrowRight, Eye, EyeOff, Check, AlertCircle 
} from "lucide-react";

const NIVELES = [
  { nivel: 1, titulo: "Básico", icono: Star, descripcion: "Acceso a la aplicación" },
  { nivel: 2, titulo: "Chat", icono: MessageCircle, descripcion: "Mensajería y comunicación" },
  { nivel: 3, titulo: "Ubicación", icono: MapPin, descripcion: "Servicios por zona" },
  { nivel: 4, titulo: "Dirección", icono: Home, descripcion: "Entregas y servicios locales" },
  { nivel: 5, titulo: "Marketplace", icono: Store, descripcion: "Vender productos y servicios" },
];

const PAISES = ["Perú", "Bolivia", "Chile", "Ecuador", "Colombia", "Argentina"];
const DEPARTAMENTOS_PERU = ["Tacna", "Lima", "Arequipa", "Puno", "Moquegua", "Cusco"];
const DISTRITOS_TACNA = ["Tacna", "Alto de la Alianza", "Calana", "Ciudad Nueva", "Coronel Gregorio Albarracín", "Pocollay"];

interface FormData {
  alias: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  dni: string;
  dniImagenFrente: string;
  dniImagenPosterior: string;
  dniEmision: string;
  dniCaducidad: string;
  telefono: string;
  pais: string;
  departamento: string;
  distrito: string;
  sector: string;
  direccion: string;
  manzanaLote: string;
  avenidaCalle: string;
  gpsLatitud: string;
  gpsLongitud: string;
  nombreLocal: string;
  direccionLocal: string;
  gpsLocalLatitud: string;
  gpsLocalLongitud: string;
  ruc: string;
}

export default function RegistroPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [nivelActual, setNivelActual] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    alias: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    profileImageUrl: "",
    dni: "",
    dniImagenFrente: "",
    dniImagenPosterior: "",
    dniEmision: "",
    dniCaducidad: "",
    telefono: "",
    pais: "Perú",
    departamento: "",
    distrito: "",
    sector: "",
    direccion: "",
    manzanaLote: "",
    avenidaCalle: "",
    gpsLatitud: "",
    gpsLongitud: "",
    nombreLocal: "",
    direccionLocal: "",
    gpsLocalLatitud: "",
    gpsLocalLongitud: "",
    ruc: "",
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const registroMutation = useMutation({
    mutationFn: async (data: Partial<FormData> & { nivelUsuario: number }) => {
      return apiRequest("POST", "/api/auth/registro", data);
    },
    onSuccess: () => {
      toast({
        title: "Registro exitoso",
        description: `Tu cuenta ha sido creada con nivel ${nivelActual} estrella${nivelActual > 1 ? 's' : ''}.`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error en el registro",
        description: error.message || "No se pudo crear la cuenta. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const validarNivel = (nivel: number): boolean => {
    switch (nivel) {
      case 1:
        if (!formData.alias || !formData.email || !formData.password) {
          toast({ title: "Campos requeridos", description: "Completa alias, email y contraseña", variant: "destructive" });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
          return false;
        }
        if (formData.password.length < 6) {
          toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (!formData.firstName || !formData.lastName || !formData.dni || !formData.telefono) {
          toast({ title: "Campos requeridos", description: "Completa nombres, apellidos, DNI y teléfono", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        if (!formData.pais || !formData.departamento || !formData.distrito) {
          toast({ title: "Campos requeridos", description: "Completa país, departamento y distrito", variant: "destructive" });
          return false;
        }
        return true;
      case 4:
        if (!formData.direccion) {
          toast({ title: "Campos requeridos", description: "Completa la dirección", variant: "destructive" });
          return false;
        }
        return true;
      case 5:
        if (!formData.nombreLocal || !formData.ruc) {
          toast({ title: "Campos requeridos", description: "Completa nombre del local y RUC", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSiguiente = () => {
    if (!validarNivel(nivelActual)) return;
    if (nivelActual < 5) {
      setNivelActual(nivelActual + 1);
    }
  };

  const handleAnterior = () => {
    if (nivelActual > 1) {
      setNivelActual(nivelActual - 1);
    }
  };

  const handleGuardar = () => {
    if (!validarNivel(nivelActual)) return;

    const datosRegistro: Record<string, string | number> = {
      alias: formData.alias,
      email: formData.email,
      password: formData.password,
      nivelUsuario: nivelActual,
    };

    if (nivelActual >= 2) {
      datosRegistro.firstName = formData.firstName;
      datosRegistro.lastName = formData.lastName;
      datosRegistro.dni = formData.dni;
      datosRegistro.telefono = formData.telefono;
      datosRegistro.dniImagenFrente = formData.dniImagenFrente;
      datosRegistro.dniImagenPosterior = formData.dniImagenPosterior;
      datosRegistro.dniEmision = formData.dniEmision;
      datosRegistro.dniCaducidad = formData.dniCaducidad;
      datosRegistro.profileImageUrl = formData.profileImageUrl;
    }

    if (nivelActual >= 3) {
      datosRegistro.pais = formData.pais;
      datosRegistro.departamento = formData.departamento;
      datosRegistro.distrito = formData.distrito;
      datosRegistro.sector = formData.sector;
    }

    if (nivelActual >= 4) {
      datosRegistro.direccion = formData.direccion;
      datosRegistro.manzanaLote = formData.manzanaLote;
      datosRegistro.avenidaCalle = formData.avenidaCalle;
      if (formData.gpsLatitud) datosRegistro.gpsLatitud = formData.gpsLatitud;
      if (formData.gpsLongitud) datosRegistro.gpsLongitud = formData.gpsLongitud;
    }

    if (nivelActual >= 5) {
      datosRegistro.nombreLocal = formData.nombreLocal;
      datosRegistro.direccionLocal = formData.direccionLocal;
      datosRegistro.ruc = formData.ruc;
      if (formData.gpsLocalLatitud) datosRegistro.gpsLocalLatitud = formData.gpsLocalLatitud;
      if (formData.gpsLocalLongitud) datosRegistro.gpsLocalLongitud = formData.gpsLocalLongitud;
    }

    registroMutation.mutate(datosRegistro as Partial<FormData> & { nivelUsuario: number });
  };

  const renderEstrellas = (cantidad: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < cantidad ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
      />
    ));
  };

  const renderFormularioNivel = () => {
    switch (nivelActual) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-1 mb-2">{renderEstrellas(1)}</div>
              <h3 className="font-semibold text-lg">Registro Básico</h3>
              <p className="text-sm text-muted-foreground">Acceso a la aplicación</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="alias">Alias *</Label>
                <Input
                  id="alias"
                  placeholder="Tu nombre de usuario"
                  value={formData.alias}
                  onChange={(e) => updateField("alias", e.target.value)}
                  data-testid="input-alias"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-1 mb-2">{renderEstrellas(2)}</div>
              <h3 className="font-semibold text-lg">Servicio de Chat</h3>
              <p className="text-sm text-muted-foreground">Datos personales para mensajería</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">Nombres *</Label>
                <Input
                  id="firstName"
                  placeholder="Tus nombres"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellidos *</Label>
                <Input
                  id="lastName"
                  placeholder="Tus apellidos"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dni">Número de DNI *</Label>
              <Input
                id="dni"
                placeholder="12345678"
                value={formData.dni}
                onChange={(e) => updateField("dni", e.target.value)}
                maxLength={8}
                data-testid="input-dni"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dniEmision">Fecha de Emisión</Label>
                <Input
                  id="dniEmision"
                  type="date"
                  value={formData.dniEmision}
                  onChange={(e) => updateField("dniEmision", e.target.value)}
                  data-testid="input-dni-emision"
                />
              </div>
              <div>
                <Label htmlFor="dniCaducidad">Fecha de Caducidad</Label>
                <Input
                  id="dniCaducidad"
                  type="date"
                  value={formData.dniCaducidad}
                  onChange={(e) => updateField("dniCaducidad", e.target.value)}
                  data-testid="input-dni-caducidad"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>DNI Frente</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="dni-frente"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateField("dniImagenFrente", URL.createObjectURL(file));
                      }
                    }}
                    data-testid="input-dni-frente"
                  />
                  <label htmlFor="dni-frente" className="cursor-pointer">
                    {formData.dniImagenFrente ? (
                      <img src={formData.dniImagenFrente} alt="DNI Frente" className="h-20 mx-auto object-cover rounded" />
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        <User className="h-8 w-8 mx-auto mb-1" />
                        Foto frontal
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div>
                <Label>DNI Posterior</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="dni-posterior"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateField("dniImagenPosterior", URL.createObjectURL(file));
                      }
                    }}
                    data-testid="input-dni-posterior"
                  />
                  <label htmlFor="dni-posterior" className="cursor-pointer">
                    {formData.dniImagenPosterior ? (
                      <img src={formData.dniImagenPosterior} alt="DNI Posterior" className="h-20 mx-auto object-cover rounded" />
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        <User className="h-8 w-8 mx-auto mb-1" />
                        Foto posterior
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="telefono">Número de Celular *</Label>
              <Input
                id="telefono"
                placeholder="+51 999 999 999"
                value={formData.telefono}
                onChange={(e) => updateField("telefono", e.target.value)}
                data-testid="input-telefono"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-1 mb-2">{renderEstrellas(3)}</div>
              <h3 className="font-semibold text-lg">Ubicación</h3>
              <p className="text-sm text-muted-foreground">Servicios disponibles en tu zona</p>
            </div>
            <div>
              <Label htmlFor="pais">País *</Label>
              <Select value={formData.pais} onValueChange={(v) => updateField("pais", v)}>
                <SelectTrigger data-testid="select-pais">
                  <SelectValue placeholder="Selecciona país" />
                </SelectTrigger>
                <SelectContent>
                  {PAISES.map((pais) => (
                    <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departamento">Departamento *</Label>
              <Select value={formData.departamento} onValueChange={(v) => updateField("departamento", v)}>
                <SelectTrigger data-testid="select-departamento">
                  <SelectValue placeholder="Selecciona departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS_PERU.map((dep) => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="distrito">Distrito *</Label>
              <Select value={formData.distrito} onValueChange={(v) => updateField("distrito", v)}>
                <SelectTrigger data-testid="select-distrito">
                  <SelectValue placeholder="Selecciona distrito" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRITOS_TACNA.map((dist) => (
                    <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                placeholder="Ej: Centro, Norte, Sur"
                value={formData.sector}
                onChange={(e) => updateField("sector", e.target.value)}
                data-testid="input-sector"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-1 mb-2">{renderEstrellas(4)}</div>
              <h3 className="font-semibold text-lg">Dirección</h3>
              <p className="text-sm text-muted-foreground">Para entregas y servicios locales</p>
            </div>
            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                placeholder="Tu dirección completa"
                value={formData.direccion}
                onChange={(e) => updateField("direccion", e.target.value)}
                data-testid="input-direccion"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="manzanaLote">Manzana / Lote</Label>
                <Input
                  id="manzanaLote"
                  placeholder="Ej: Mz A Lt 10"
                  value={formData.manzanaLote}
                  onChange={(e) => updateField("manzanaLote", e.target.value)}
                  data-testid="input-manzana-lote"
                />
              </div>
              <div>
                <Label htmlFor="avenidaCalle">Avenida / Calle</Label>
                <Input
                  id="avenidaCalle"
                  placeholder="Nombre de la calle"
                  value={formData.avenidaCalle}
                  onChange={(e) => updateField("avenidaCalle", e.target.value)}
                  data-testid="input-avenida-calle"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gpsLatitud">GPS Latitud</Label>
                <Input
                  id="gpsLatitud"
                  type="number"
                  step="any"
                  placeholder="-18.0146"
                  value={formData.gpsLatitud}
                  onChange={(e) => updateField("gpsLatitud", e.target.value)}
                  data-testid="input-gps-latitud"
                />
              </div>
              <div>
                <Label htmlFor="gpsLongitud">GPS Longitud</Label>
                <Input
                  id="gpsLongitud"
                  type="number"
                  step="any"
                  placeholder="-70.2536"
                  value={formData.gpsLongitud}
                  onChange={(e) => updateField("gpsLongitud", e.target.value)}
                  data-testid="input-gps-longitud"
                />
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      updateField("gpsLatitud", position.coords.latitude.toString());
                      updateField("gpsLongitud", position.coords.longitude.toString());
                      toast({ title: "Ubicación obtenida", description: "Coordenadas GPS actualizadas" });
                    },
                    () => {
                      toast({ title: "Error", description: "No se pudo obtener la ubicación", variant: "destructive" });
                    }
                  );
                }
              }}
              data-testid="button-obtener-gps"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Obtener mi ubicación GPS
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="flex justify-center gap-1 mb-2">{renderEstrellas(5)}</div>
              <h3 className="font-semibold text-lg">Marketplace</h3>
              <p className="text-sm text-muted-foreground">Vender productos y servicios</p>
            </div>
            <div>
              <Label htmlFor="nombreLocal">Nombre del Local / Empresa *</Label>
              <Input
                id="nombreLocal"
                placeholder="Nombre de tu negocio"
                value={formData.nombreLocal}
                onChange={(e) => updateField("nombreLocal", e.target.value)}
                data-testid="input-nombre-local"
              />
            </div>
            <div>
              <Label htmlFor="direccionLocal">Dirección del Local</Label>
              <Input
                id="direccionLocal"
                placeholder="Dirección de tu negocio"
                value={formData.direccionLocal}
                onChange={(e) => updateField("direccionLocal", e.target.value)}
                data-testid="input-direccion-local"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gpsLocalLatitud">GPS Local Latitud</Label>
                <Input
                  id="gpsLocalLatitud"
                  type="number"
                  step="any"
                  placeholder="-18.0146"
                  value={formData.gpsLocalLatitud}
                  onChange={(e) => updateField("gpsLocalLatitud", e.target.value)}
                  data-testid="input-gps-local-latitud"
                />
              </div>
              <div>
                <Label htmlFor="gpsLocalLongitud">GPS Local Longitud</Label>
                <Input
                  id="gpsLocalLongitud"
                  type="number"
                  step="any"
                  placeholder="-70.2536"
                  value={formData.gpsLocalLongitud}
                  onChange={(e) => updateField("gpsLocalLongitud", e.target.value)}
                  data-testid="input-gps-local-longitud"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ruc">Número de RUC *</Label>
              <Input
                id="ruc"
                placeholder="20123456789"
                value={formData.ruc}
                onChange={(e) => updateField("ruc", e.target.value)}
                maxLength={11}
                data-testid="input-ruc"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Crear Cuenta
            </CardTitle>
            <CardDescription>
              Regístrate para acceder a APO-360
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2 flex-wrap">
              {NIVELES.map((nivel) => (
                <Badge
                  key={nivel.nivel}
                  variant={nivelActual >= nivel.nivel ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    nivelActual === nivel.nivel ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  onClick={() => {
                    if (nivel.nivel <= nivelActual || validarNivel(nivelActual)) {
                      setNivelActual(nivel.nivel);
                    }
                  }}
                  data-testid={`badge-nivel-${nivel.nivel}`}
                >
                  <nivel.icono className="h-3 w-3 mr-1" />
                  {nivel.titulo}
                </Badge>
              ))}
            </div>

            <Progress value={(nivelActual / 5) * 100} className="h-2" />

            <div className="bg-muted/50 p-1 rounded-lg text-center mb-4">
              <p className="text-xs text-muted-foreground">
                Completa más niveles para desbloquear más funcionalidades
              </p>
            </div>

            {renderFormularioNivel()}

            <div className="flex gap-3 pt-4">
              {nivelActual > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAnterior}
                  className="flex-1"
                  data-testid="button-anterior"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleGuardar}
                className="flex-1"
                disabled={registroMutation.isPending}
                data-testid="button-guardar-registro"
              >
                {registroMutation.isPending ? (
                  "Guardando..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Guardar ({nivelActual}★)
                  </>
                )}
              </Button>

              {nivelActual < 5 && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSiguiente}
                  className="flex-1"
                  data-testid="button-siguiente"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Button 
                  variant="ghost" 
                  className="p-0 h-auto text-primary underline hover:no-underline"
                  onClick={() => setLocation("/")}
                  data-testid="link-iniciar-sesion"
                >
                  Iniciar sesión
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
