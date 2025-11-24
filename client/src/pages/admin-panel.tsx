import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ImageIcon, Radio, Users, Wallet, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("publicidad");

  if (!user || (user.rol !== "super_admin" && !user.rolesSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permiso para acceder al panel de administración.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Panel Super Administrador</h1>
          <p className="text-white/90">Gestión centralizada de SEG-APO</p>
          <Badge className="mt-3 bg-white/20 text-white border-white/30">Super Admin</Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
            <TabsTrigger value="publicidad" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Publicidad</span>
            </TabsTrigger>
            <TabsTrigger value="radio" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Radio</span>
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="cartera" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Cartera</span>
            </TabsTrigger>
            <TabsTrigger value="encuestas" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Encuestas</span>
            </TabsTrigger>
          </TabsList>

          {/* 1.1 PUBLICIDAD */}
          <TabsContent value="publicidad" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Publicidad</CardTitle>
                <CardDescription>Administra logos, carruseles y popups publicitarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Sección 1.1: Crear, editar, eliminar, pausar/reanudar publicidades con fechas de emisión
                  </AlertDescription>
                </Alert>
                <Button className="w-full" size="lg">+ Crear Nueva Publicidad</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 1.2 RADIO ONLINE Y MP3 */}
          <TabsContent value="radio" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Radios Online</CardTitle>
                  <CardDescription>Gestiona URLs de radios en vivo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Sección 1.2a: Agregar, modificar, eliminar, pausar/reanudar radios
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" size="lg">+ Nueva Radio</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Listas MP3</CardTitle>
                  <CardDescription>Gestiona playlists por categoría</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Sección 1.2b: Crear listas, agregar MP3, reordenar, pausar/reanudar
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" size="lg">+ Nueva Lista</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 1.3 USUARIOS Y ADMINISTRADORES */}
          <TabsContent value="usuarios" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Panel de Usuarios y Administradores</CardTitle>
                <CardDescription>Gestiona usuarios, roles y administradores de segundo nivel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Sección 1.3: Gestionar usuarios, crear admins de segundo nivel, asignar múltiples roles
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button size="lg">Ver Usuarios</Button>
                  <Button size="lg">Crear Admin Nivel 2</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 1.4 CARTERA Y SALDOS */}
          <TabsContent value="cartera" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cartera y Saldos</CardTitle>
                <CardDescription>Configura costos, consulta saldos y métodos de pago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Sección 1.4: Configurar porcentajes/montos, ver reportes, métodos de pago (Yape, Plin, PayPal, bancario)
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button size="lg">Configurar Costos</Button>
                  <Button size="lg">Reportes de Saldos</Button>
                  <Button size="lg">Métodos de Pago</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 1.5 ENCUESTAS Y POPUPS */}
          <TabsContent value="encuestas" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Encuestas</CardTitle>
                  <CardDescription>Crear encuestas con preguntas e imágenes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Sección 1.5a: Crear encuestas, subir imágenes, ver resultados en tiempo real
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" size="lg">+ Nueva Encuesta</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popups Publicitarios</CardTitle>
                  <CardDescription>Gestiona publicidad emergente tipo YouTube</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✅ Sección 1.5b: Crear popups, duración, opción omitir, imágenes/videos
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" size="lg">+ Nuevo Popup</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer con info */}
        <div className="mt-12 p-6 bg-card rounded-lg border">
          <h3 className="font-bold mb-3">Pantallas Adicionales (en desarrollo)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Badge className="mb-2">Pantalla 2</Badge>
              <p className="text-muted-foreground">Chat y Notificaciones</p>
            </div>
            <div>
              <Badge className="mb-2">Pantalla 3</Badge>
              <p className="text-muted-foreground">Geolocalización</p>
            </div>
            <div>
              <Badge className="mb-2">Pantalla 4</Badge>
              <p className="text-muted-foreground">Grupos/Empresas</p>
            </div>
            <div>
              <Badge className="mb-2">Pantalla 5</Badge>
              <p className="text-muted-foreground">Google Maps Ampliado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
