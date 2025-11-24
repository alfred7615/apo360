import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRadioOnlineSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Pause, Play, Radio as RadioIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageUpload } from "@/components/ImageUpload";

type RadioOnline = {
  id: string;
  nombre: string;
  url: string;
  descripcion: string | null;
  logoUrl: string | null;
  orden: number | null;
  estado: string | null;
  createdAt: Date | null;
};

const formSchema = insertRadioOnlineSchema
  .omit({ orden: true })
  .extend({
    orden: z.preprocess((v) => v === "" || v === null || v === undefined ? 0 : Number(v), z.number().min(0)),
  });

type FormData = z.infer<typeof formSchema>;

export default function RadiosOnlineSection() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState<RadioOnline | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      url: "",
      descripcion: "",
      logoUrl: "",
      orden: 0,
      estado: "activo",
    },
  });

  const { data: radios = [], isLoading } = useQuery<RadioOnline[]>({
    queryKey: ["/api/radios-online"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/radios-online", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      toast({
        title: "Radio creada",
        description: "La radio se creó correctamente",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la radio",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      return await apiRequest("PUT", `/api/radios-online/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      toast({
        title: "Radio actualizada",
        description: "La radio se actualizó correctamente",
      });
      setIsDialogOpen(false);
      setEditingRadio(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la radio",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/radios-online/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      toast({
        title: "Radio eliminada",
        description: "La radio se eliminó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la radio",
        variant: "destructive",
      });
    },
  });

  const toggleEstadoMutation = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: string }) => {
      return await apiRequest("PUT", `/api/radios-online/${id}`, { estado: nuevoEstado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la radio se actualizó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingRadio) {
      updateMutation.mutate({ id: editingRadio.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (radio: RadioOnline) => {
    setEditingRadio(radio);
    form.reset({
      nombre: radio.nombre || "",
      url: radio.url || "",
      descripcion: radio.descripcion || "",
      logoUrl: radio.logoUrl || "",
      orden: radio.orden || 0,
      estado: (radio.estado || "activo") as any,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta radio?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleEstado = (radio: RadioOnline) => {
    const nuevoEstado = radio.estado === "activo" ? "pausado" : "activo";
    toggleEstadoMutation.mutate({ id: radio.id, nuevoEstado });
  };

  const radiosOrdenadas = [...radios].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RadioIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Gestión de Radios Online
          </CardTitle>
          <CardDescription>
            Administra las radios en vivo disponibles en la plataforma
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRadio(null);
                form.reset();
              }}
              data-testid="button-crear-radio"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Radio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle>
                  {editingRadio ? "Editar Radio" : "Nueva Radio"}
                </DialogTitle>
                <DialogDescription>
                  Complete los datos de la radio online
                </DialogDescription>
              </DialogHeader>
            </div>
            <form 
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        {...form.register("nombre")}
                        value={form.watch("nombre") || ""}
                        onChange={(e) => form.setValue("nombre", e.target.value)}
                        placeholder="Nombre de la radio"
                        data-testid="input-nombre"
                      />
                      {form.formState.errors.nombre && (
                        <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">URL de Stream *</Label>
                      <Input
                        id="url"
                        {...form.register("url")}
                        value={form.watch("url") || ""}
                        onChange={(e) => form.setValue("url", e.target.value)}
                        placeholder="https://stream.radio.com/..."
                        data-testid="input-url"
                      />
                      {form.formState.errors.url && (
                        <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        {...form.register("descripcion")}
                        value={form.watch("descripcion") || ""}
                        onChange={(e) => form.setValue("descripcion", e.target.value)}
                        placeholder="Descripción de la radio"
                        rows={3}
                        data-testid="input-descripcion"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Logo (Opcional)</Label>
                      <ImageUpload
                        value={form.watch("logoUrl") || ""}
                        onChange={(url) => form.setValue("logoUrl", url || "")}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        endpoint="servicios"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="orden">Orden</Label>
                        <Input
                          id="orden"
                          type="number"
                          {...form.register("orden")}
                          value={form.watch("orden")?.toString() || "0"}
                          onChange={(e) => form.setValue("orden", e.target.value ? Number(e.target.value) : 0)}
                          placeholder="0"
                          data-testid="input-orden"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select
                          value={form.watch("estado") || undefined}
                          onValueChange={(value) => form.setValue("estado", value as any)}
                        >
                          <SelectTrigger data-testid="select-estado">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="pausado">Pausado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-6 pt-4 border-t">
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingRadio(null);
                      form.reset();
                    }}
                    data-testid="button-cancelar"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-guardar"
                  >
                    {editingRadio ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando radios...</p>
        ) : radiosOrdenadas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay radios registradas</p>
        ) : (
          <div className="space-y-3">
            {radiosOrdenadas.map((radio) => (
              <Card key={radio.id} className="p-4">
                <div className="flex items-center gap-4">
                  {radio.logoUrl && (
                    <img 
                      src={radio.logoUrl} 
                      alt={radio.nombre} 
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{radio.nombre}</h3>
                    <p className="text-sm text-muted-foreground truncate">{radio.url}</p>
                    {radio.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1">{radio.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={radio.estado === "activo" ? "default" : "secondary"}>
                      {radio.estado === "activo" ? "Activo" : "Pausado"}
                    </Badge>
                    <Badge variant="outline">Orden: {radio.orden || 0}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleEstado(radio)}
                      data-testid={`button-toggle-${radio.id}`}
                    >
                      {radio.estado === "activo" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(radio)}
                      data-testid={`button-edit-${radio.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(radio.id)}
                      data-testid={`button-delete-${radio.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
