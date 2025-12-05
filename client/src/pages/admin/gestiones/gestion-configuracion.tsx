import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Globe, Bell, Shield, Palette, Mail, Save, Database, Server } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionConfiguracionScreen() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6" data-testid="screen-gestion-configuracion">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground">Ajustes generales, notificaciones, seguridad y apariencia</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" data-testid="tab-general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notificaciones" data-testid="tab-notificaciones">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="seguridad" data-testid="tab-seguridad">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="apariencia" data-testid="tab-apariencia">
            <Palette className="h-4 w-4 mr-2" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="email" data-testid="tab-email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Ajustes básicos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input id="siteName" defaultValue="APO-360" data-testid="input-site-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL del Sitio</Label>
                  <Input id="siteUrl" defaultValue="https://tacnafm.com" data-testid="input-site-url" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input id="contactEmail" type="email" placeholder="contacto@tacnafm.com" data-testid="input-contact-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <Input id="contactPhone" placeholder="+51 999 888 777" data-testid="input-contact-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Sitio</Label>
                <Textarea 
                  id="description" 
                  placeholder="Descripción de APO-360..."
                  className="min-h-[100px]"
                  data-testid="textarea-description"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Modo Mantenimiento</p>
                  <p className="text-sm text-muted-foreground">Mostrar página de mantenimiento a usuarios</p>
                </div>
                <Switch data-testid="switch-maintenance" />
              </div>
              <Button className="w-full md:w-auto" data-testid="button-save-general">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Gestiona las notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificaciones Push</p>
                  <p className="text-sm text-muted-foreground">Enviar notificaciones push a dispositivos</p>
                </div>
                <Switch defaultChecked data-testid="switch-push" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificaciones por Email</p>
                  <p className="text-sm text-muted-foreground">Enviar emails para eventos importantes</p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notif" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificaciones de Emergencia</p>
                  <p className="text-sm text-muted-foreground">Alertas inmediatas para emergencias</p>
                </div>
                <Switch defaultChecked data-testid="switch-emergency" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Sonido de Notificaciones</p>
                  <p className="text-sm text-muted-foreground">Reproducir sonido al recibir notificaciones</p>
                </div>
                <Switch data-testid="switch-sound" />
              </div>
              <Button className="w-full md:w-auto" data-testid="button-save-notifications">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguridad" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Ajustes de seguridad y acceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Autenticación de Dos Factores</p>
                  <p className="text-sm text-muted-foreground">Requerir 2FA para administradores</p>
                </div>
                <Switch data-testid="switch-2fa" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Registro de Actividad</p>
                  <p className="text-sm text-muted-foreground">Mantener log de acciones de administradores</p>
                </div>
                <Switch defaultChecked data-testid="switch-activity-log" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Bloqueo por Intentos Fallidos</p>
                  <p className="text-sm text-muted-foreground">Bloquear cuenta después de 5 intentos fallidos</p>
                </div>
                <Switch defaultChecked data-testid="switch-lockout" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                <Input 
                  id="sessionTimeout" 
                  type="number" 
                  defaultValue="60"
                  className="w-32"
                  data-testid="input-session-timeout"
                />
              </div>
              <Button className="w-full md:w-auto" data-testid="button-save-security">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apariencia" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Apariencia</CardTitle>
              <CardDescription>Personaliza el aspecto visual del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color Primario</Label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary border" />
                  <Input defaultValue="#8B5CF6" className="w-32" data-testid="input-primary-color" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color Secundario</Label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-pink-500 border" />
                  <Input defaultValue="#EC4899" className="w-32" data-testid="input-secondary-color" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Modo Oscuro por Defecto</p>
                  <p className="text-sm text-muted-foreground">Activar modo oscuro para nuevos usuarios</p>
                </div>
                <Switch data-testid="switch-dark-mode" />
              </div>
              <Button className="w-full md:w-auto" data-testid="button-save-appearance">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Email (SMTP)</CardTitle>
              <CardDescription>Configuración del servidor de correo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input id="smtpHost" placeholder="smtp.gmail.com" data-testid="input-smtp-host" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Puerto</Label>
                  <Input id="smtpPort" type="number" defaultValue="587" data-testid="input-smtp-port" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Usuario</Label>
                  <Input id="smtpUser" placeholder="usuario@gmail.com" data-testid="input-smtp-user" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Contraseña</Label>
                  <Input id="smtpPassword" type="password" placeholder="••••••••" data-testid="input-smtp-password" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Usar SSL/TLS</p>
                  <p className="text-sm text-muted-foreground">Conexión segura al servidor SMTP</p>
                </div>
                <Switch defaultChecked data-testid="switch-smtp-ssl" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" data-testid="button-test-email">
                  <Mail className="h-4 w-4 mr-2" />
                  Probar Conexión
                </Button>
                <Button data-testid="button-save-email">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
