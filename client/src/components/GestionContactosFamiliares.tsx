import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Plus, Trash2, Save, Loader2, Phone, Mail, User, 
  GripVertical, AlertTriangle, Check, Download
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactoFamiliar {
  id: string;
  usuarioId: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  relacion?: string | null;
  esContactoPrincipal: boolean;
  notificarEmergencias: boolean;
  orden: number;
  createdAt: string;
  updatedAt: string;
}

interface FormContacto {
  nombre: string;
  telefono: string;
  email: string;
  relacion: string;
  esContactoPrincipal: boolean;
  notificarEmergencias: boolean;
}

const RELACIONES = [
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "esposo", label: "Esposo/a" },
  { value: "hijo", label: "Hijo/a" },
  { value: "hermano", label: "Hermano/a" },
  { value: "abuelo", label: "Abuelo/a" },
  { value: "tio", label: "Tío/a" },
  { value: "primo", label: "Primo/a" },
  { value: "amigo", label: "Amigo/a" },
  { value: "vecino", label: "Vecino/a" },
  { value: "importado_google", label: "Importado de Google" },
  { value: "otro", label: "Otro" },
];

const formVacio: FormContacto = {
  nombre: "",
  telefono: "",
  email: "",
  relacion: "",
  esContactoPrincipal: false,
  notificarEmergencias: true,
};

export default function GestionContactosFamiliares() {
  const { toast } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormContacto>(formVacio);
  const [contactoEliminar, setContactoEliminar] = useState<string | null>(null);

  const { data: contactos = [], isLoading } = useQuery<ContactoFamiliar[]>({
    queryKey: ["/api/contactos-familiares"],
  });

  const crearMutation = useMutation({
    mutationFn: async (datos: FormContacto) => {
      return await apiRequest("POST", "/api/contactos-familiares", datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contactos-familiares"] });
      toast({
        title: "Contacto agregado",
        description: "El contacto familiar ha sido agregado exitosamente.",
      });
      cerrarModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el contacto.",
        variant: "destructive",
      });
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<FormContacto> }) => {
      return await apiRequest("PATCH", `/api/contactos-familiares/${id}`, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contactos-familiares"] });
      toast({
        title: "Contacto actualizado",
        description: "Los cambios han sido guardados.",
      });
      cerrarModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el contacto.",
        variant: "destructive",
      });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contactos-familiares/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contactos-familiares"] });
      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado.",
      });
      setContactoEliminar(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contacto.",
        variant: "destructive",
      });
    },
  });

  const importarGoogleMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/contactos-familiares/importar-google");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contactos-familiares"] });
      toast({
        title: "Importación exitosa",
        description: data.message || `Se importaron ${data.importados} contactos de Google`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "";
      const requiresReauth = error?.requiresReauth || errorMessage.includes("expirada") || errorMessage.includes("401");
      
      if (requiresReauth) {
        toast({
          title: "Sesión de Google expirada",
          description: "Cerrando sesión para renovar permisos. Vuelve a iniciar sesión.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/logout";
        }, 2000);
      } else {
        toast({
          title: "Error al importar",
          description: errorMessage || "No se pudieron importar los contactos. Inicia sesión de nuevo.",
          variant: "destructive",
        });
      }
    },
  });

  const abrirModalNuevo = () => {
    setFormData(formVacio);
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (contacto: ContactoFamiliar) => {
    setFormData({
      nombre: contacto.nombre,
      telefono: contacto.telefono || "",
      email: contacto.email || "",
      relacion: contacto.relacion || "",
      esContactoPrincipal: contacto.esContactoPrincipal,
      notificarEmergencias: contacto.notificarEmergencias,
    });
    setEditando(contacto.id);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setFormData(formVacio);
  };

  const guardarContacto = () => {
    if (!formData.nombre.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa el nombre del contacto.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.telefono.trim() && !formData.email.trim()) {
      toast({
        title: "Contacto requerido",
        description: "Por favor ingresa un teléfono o email.",
        variant: "destructive",
      });
      return;
    }

    if (editando) {
      actualizarMutation.mutate({ id: editando, datos: formData });
    } else {
      crearMutation.mutate(formData);
    }
  };

  const contactosActivos = contactos.filter(c => c.notificarEmergencias);
  const isPending = crearMutation.isPending || actualizarMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-contactos-familiares">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-base">Contactos Familiares</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => importarGoogleMutation.mutate()}
                disabled={importarGoogleMutation.isPending}
                data-testid="button-importar-google"
              >
                {importarGoogleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <SiGoogle className="h-4 w-4 mr-1" />
                )}
                Importar
              </Button>
              <Button 
                size="sm" 
                onClick={abrirModalNuevo}
                data-testid="button-agregar-contacto"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Estos contactos serán notificados cuando uses el botón de pánico con la opción "Familia"
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contactos.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No tienes contactos familiares registrados
              </p>
              <Button variant="outline" size="sm" onClick={abrirModalNuevo}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar primer contacto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {contactos.map((contacto) => (
                <div
                  key={contacto.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    contacto.notificarEmergencias 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                      : 'bg-muted/50 border-border'
                  }`}
                  data-testid={`contacto-${contacto.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{contacto.nombre}</p>
                      {contacto.esContactoPrincipal && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                      {contacto.notificarEmergencias && (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {contacto.relacion && (
                        <span className="capitalize">{contacto.relacion}</span>
                      )}
                      {contacto.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contacto.telefono}
                        </span>
                      )}
                      {contacto.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contacto.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => abrirModalEditar(contacto)}
                      data-testid={`button-editar-${contacto.id}`}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setContactoEliminar(contacto.id)}
                      data-testid={`button-eliminar-${contacto.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {contactosActivos.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {contactosActivos.length} contacto{contactosActivos.length > 1 ? 's' : ''} recibirá{contactosActivos.length > 1 ? 'n' : ''} alertas de emergencia
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-contacto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {editando ? "Editar Contacto" : "Agregar Contacto"}
            </DialogTitle>
            <DialogDescription>
              {editando 
                ? "Modifica los datos del contacto familiar"
                : "Agrega un nuevo contacto para notificaciones de emergencia"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm">Nombre completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez López"
                data-testid="input-contacto-nombre"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+51 999 999 999"
                  data-testid="input-contacto-telefono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  data-testid="input-contacto-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relacion" className="text-sm">Relación</Label>
              <Select
                value={formData.relacion}
                onValueChange={(value) => setFormData({ ...formData, relacion: value })}
              >
                <SelectTrigger data-testid="select-contacto-relacion">
                  <SelectValue placeholder="Selecciona la relación" />
                </SelectTrigger>
                <SelectContent>
                  {RELACIONES.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium">Notificar emergencias</p>
                    <p className="text-xs text-muted-foreground">
                      Recibirá alertas del botón de pánico
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.notificarEmergencias}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificarEmergencias: checked })}
                  data-testid="switch-notificar-emergencias"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Contacto principal</p>
                    <p className="text-xs text-muted-foreground">
                      Aparece primero en la lista
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.esContactoPrincipal}
                  onCheckedChange={(checked) => setFormData({ ...formData, esContactoPrincipal: checked })}
                  data-testid="switch-contacto-principal"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button 
              onClick={guardarContacto} 
              disabled={isPending}
              data-testid="button-guardar-contacto"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {editando ? "Guardar cambios" : "Agregar contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!contactoEliminar} onOpenChange={() => setContactoEliminar(null)}>
        <AlertDialogContent data-testid="dialog-eliminar-contacto">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente y no recibirá más notificaciones de emergencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => contactoEliminar && eliminarMutation.mutate(contactoEliminar)}
              disabled={eliminarMutation.isPending}
            >
              {eliminarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
