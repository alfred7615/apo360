import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Shield, User, Car, Store, Building2, Flame, Ambulance, 
  Eye, EyeOff, LogIn, UserPlus, ChevronRight, Lock,
  Mail, Phone, ArrowLeft, CheckCircle2, AlertCircle, Ban
} from "lucide-react";
import FranjaEmergencia from "@/components/FranjaEmergencia";
import {
  loginSchema,
  registroNivel1ConConfirmacionSchema,
  rolesRegistroValidos,
  rolesConAprobacion,
  type LoginInput,
  type RegistroNivel1ConConfirmacion,
  type RolRegistro,
} from "@shared/schema";

type RolInfo = {
  id: RolRegistro;
  label: string;
  descripcion: string;
  icon: any;
  bgGradient: string;
};

const ROLES_DISPONIBLES: RolInfo[] = [
  {
    id: "usuario",
    label: "Ciudadano",
    descripcion: "Usuario básico de la comunidad",
    icon: User,
    bgGradient: "from-blue-500 to-blue-600",
  },
  {
    id: "conductor",
    label: "Conductor",
    descripcion: "Taxista, delivery o mudanzas",
    icon: Car,
    bgGradient: "from-yellow-500 to-yellow-600",
  },
  {
    id: "local",
    label: "Comercio Local",
    descripcion: "Propietario de negocio",
    icon: Store,
    bgGradient: "from-green-500 to-green-600",
  },
  {
    id: "serenazgo",
    label: "Serenazgo",
    descripcion: "Personal de seguridad municipal",
    icon: Shield,
    bgGradient: "from-purple-500 to-purple-600",
  },
  {
    id: "policia",
    label: "Policía",
    descripcion: "Miembro de la PNP",
    icon: Building2,
    bgGradient: "from-indigo-500 to-indigo-600",
  },
  {
    id: "bombero",
    label: "Bombero",
    descripcion: "Cuerpo de bomberos",
    icon: Flame,
    bgGradient: "from-red-500 to-red-600",
  },
  {
    id: "samu",
    label: "SAMU",
    descripcion: "Emergencias médicas",
    icon: Ambulance,
    bgGradient: "from-cyan-500 to-cyan-600",
  },
];

export default function IniciarSesion() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "registro">("login");
  const [selectedRol, setSelectedRol] = useState<RolRegistro | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: configRoles, isLoading: loadingConfig } = useQuery<Record<string, { habilitado: boolean }>>({
    queryKey: ["/api/configuracion/roles"],
    retry: false,
  });

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registroForm = useForm<RegistroNivel1ConConfirmacion>({
    resolver: zodResolver(registroNivel1ConConfirmacionSchema),
    defaultValues: {
      alias: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      rol: "usuario",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido de nuevo, ${data.nombre || data.email}`,
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    },
  });

  const registroMutation = useMutation({
    mutationFn: async (data: RegistroNivel1ConConfirmacion) => {
      const { confirmPassword, ...registroData } = data;
      const response = await apiRequest("POST", "/api/auth/registro", {
        ...registroData,
        nivelUsuario: 1,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (data.requiereAprobacion) {
        toast({
          title: "Registro enviado",
          description: "Tu solicitud será revisada por un administrador.",
        });
        setLocation("/landing");
      } else {
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
        });
        setActiveTab("login");
        setSelectedRol(null);
        registroForm.reset();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error en registro",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  const handleRegistro = (data: RegistroNivel1ConConfirmacion) => {
    registroMutation.mutate(data);
  };

  const handleSocialLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSelectRol = (rol: RolRegistro) => {
    if (!isRolHabilitado(rol)) {
      toast({
        title: "Rol no disponible",
        description: "Este tipo de cuenta no está habilitado actualmente",
        variant: "destructive",
      });
      return;
    }
    setSelectedRol(rol);
    registroForm.setValue("rol", rol);
  };

  const isRolHabilitado = (rolId: string): boolean => {
    if (!configRoles) return true;
    return configRoles[rolId]?.habilitado !== false;
  };

  const requiereAprobacionRol = (rol: RolRegistro): boolean => {
    return rolesConAprobacion.includes(rol);
  };

  const rolesDeshabilitados = ROLES_DISPONIBLES.filter(r => !isRolHabilitado(r.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-background to-pink-50 dark:from-purple-900/10 dark:via-background dark:to-pink-900/10" data-testid="page-iniciar-sesion">
      <FranjaEmergencia />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-titulo">
              SEG-APO
            </h1>
            <p className="text-muted-foreground">
              Seguridad y Apoyo para tu Comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Acceso a la Plataforma</CardTitle>
                <CardDescription>
                  Inicia sesión o crea tu cuenta para acceder a todos los servicios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" data-testid="tab-login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Iniciar Sesión
                    </TabsTrigger>
                    <TabsTrigger value="registro" data-testid="tab-registro">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrarse
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correo Electrónico</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="pl-10"
                                    data-testid="input-email-login"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    data-testid="input-password-login"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                          data-testid="button-login"
                        >
                          {loginMutation.isPending ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                          )}
                          Iniciar Sesión
                        </Button>

                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleSocialLogin}
                          data-testid="button-login-social"
                        >
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continuar con Google
                        </Button>

                        <p className="text-center text-sm text-muted-foreground mt-4">
                          ¿Olvidaste tu contraseña?{" "}
                          <a href="/recuperar" className="text-primary hover:underline" data-testid="link-recuperar">
                            Recupérala aquí
                          </a>
                        </p>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="registro">
                    {!selectedRol ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Selecciona el tipo de cuenta que deseas crear:
                        </p>
                        
                        {loadingConfig && (
                          <div className="flex justify-center py-4">
                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-3">
                          {ROLES_DISPONIBLES.map((rol) => {
                            const habilitado = isRolHabilitado(rol.id);
                            const requiereAprobacion = requiereAprobacionRol(rol.id);
                            
                            return (
                              <div
                                key={rol.id}
                                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                  habilitado 
                                    ? "cursor-pointer hover:border-primary/50 hover:bg-muted/50" 
                                    : "opacity-50 cursor-not-allowed bg-muted/30"
                                }`}
                                onClick={() => handleSelectRol(rol.id)}
                                data-testid={`select-rol-${rol.id}`}
                              >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${rol.bgGradient} text-white shrink-0 ${!habilitado ? "grayscale" : ""}`}>
                                  <rol.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">{rol.label}</span>
                                    {!habilitado && (
                                      <Badge variant="secondary" className="text-[10px] gap-1">
                                        <Ban className="h-3 w-3" />
                                        No disponible
                                      </Badge>
                                    )}
                                    {habilitado && requiereAprobacion && (
                                      <Badge variant="outline" className="text-[10px]">
                                        Requiere aprobación
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{rol.descripcion}</p>
                                </div>
                                {habilitado && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                              </div>
                            );
                          })}
                        </div>
                        
                        {rolesDeshabilitados.length > 0 && (
                          <p className="text-xs text-muted-foreground text-center mt-4">
                            Algunos tipos de cuenta no están habilitados por el administrador
                          </p>
                        )}
                      </div>
                    ) : (
                      <Form {...registroForm}>
                        <form onSubmit={registroForm.handleSubmit(handleRegistro)} className="space-y-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRol(null);
                              registroForm.setValue("rol", "usuario");
                            }}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                            data-testid="button-volver-roles"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Cambiar tipo de cuenta
                          </button>

                          {(() => {
                            const rolInfo = ROLES_DISPONIBLES.find(r => r.id === selectedRol);
                            if (!rolInfo) return null;
                            const requiereAprobacion = requiereAprobacionRol(selectedRol);
                            return (
                              <div className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${rolInfo.bgGradient} text-white mb-4`}>
                                <rolInfo.icon className="h-6 w-6" />
                                <div>
                                  <span className="font-semibold">{rolInfo.label}</span>
                                  {requiereAprobacion && (
                                    <p className="text-xs text-white/80">Registro pendiente de aprobación</p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          <FormField
                            control={registroForm.control}
                            name="alias"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre de Usuario</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Tu alias en la comunidad"
                                    data-testid="input-alias"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Solo letras, números y guión bajo. Mín. 3 caracteres.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registroForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="email"
                                      placeholder="tu@email.com"
                                      className="pl-10"
                                      data-testid="input-email-registro"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registroForm.control}
                            name="telefono"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono (opcional)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="tel"
                                      placeholder="+51 999 999 999"
                                      className="pl-10"
                                      data-testid="input-telefono"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registroForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Mínimo 8 caracteres"
                                      className="pl-10 pr-10"
                                      data-testid="input-password-registro"
                                      {...field}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Mín. 8 caracteres, incluir mayúscula y número.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registroForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Contraseña</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Repite tu contraseña"
                                      className="pl-10"
                                      data-testid="input-confirm-password"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <input type="hidden" {...registroForm.register("rol")} />

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={registroMutation.isPending}
                            data-testid="button-registro"
                          >
                            {registroMutation.isPending ? (
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Crear Cuenta
                          </Button>

                          <p className="text-xs text-muted-foreground text-center mt-4">
                            Al registrarte, aceptas nuestros{" "}
                            <a href="/terminos" className="text-primary hover:underline">Términos de Servicio</a>
                            {" "}y{" "}
                            <a href="/privacidad" className="text-primary hover:underline">Política de Privacidad</a>
                          </p>
                        </form>
                      </Form>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-lg border-0 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                  <h3 className="text-xl font-bold mb-2">Beneficios de Unirte</h3>
                  <p className="text-white/90 text-sm">
                    Sé parte de la comunidad más segura de Tacna
                  </p>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Alertas en Tiempo Real</p>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones de emergencias en tu zona</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Botón de Pánico</p>
                        <p className="text-sm text-muted-foreground">Acceso rápido a servicios de emergencia</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Chat Comunitario</p>
                        <p className="text-sm text-muted-foreground">Conecta con vecinos y grupos locales</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Servicios Locales</p>
                        <p className="text-sm text-muted-foreground">Taxi, delivery y comercios de confianza</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Roles Especiales</h4>
                      <p className="text-sm text-muted-foreground">
                        Si eres conductor, comerciante o miembro de servicios de emergencia,
                        tu registro será verificado por un administrador antes de activar
                        tu cuenta con permisos especiales.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="ghost" asChild>
                  <a href="/landing" data-testid="link-volver-inicio">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al inicio
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
