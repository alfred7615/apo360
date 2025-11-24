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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { insertPublicidadSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Pause, Play, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Publicidad = {
  id: string;
  titulo: string | null;
  descripcion: string | null;
  tipo: string | null;
  imagenUrl: string | null;
  enlaceUrl: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  estado: string | null;
  usuarioId: string | null;
  orden: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const formSchema = insertPublicidadSchema.omit({ fechaInicio: true, fechaFin: true }).extend({
  fechaInicio: z.string().min(1, "Fecha de inicio requerida"),
  fechaFin: z.string().min(1, "Fecha de fin requerida"),
});

type FormData = z.infer<typeof formSchema>;

const convertFormDataToApi = (data: FormData) => {
  return {
    ...data,
    fechaInicio: new Date(data.fechaInicio),
    fechaFin: new Date(data.fechaFin),
  };
};

export default function PublicidadSection() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPublicidad, setEditingPublicidad] = useState<Publicidad | null>(null);

  const { data: publicidades = [], isLoading } = useQuery<Publicidad[]>({
    queryKey: ["/api/publicidad"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      tipo: "carrusel_principal",
      imagenUrl: "",
      enlaceUrl: "",
      fechaInicio: "",
      fechaFin: "",
      estado: "activo",
      orden: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const apiData = convertFormDataToApi(data);
      return await apiRequest("/api/publicidad", "POST", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publicidad"] });
      toast({
        title: "Publicidad creada",
        description: "La publicidad se ha creado exitosamente.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la publicidad.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const apiData = data.fechaInicio && data.fechaFin ? convertFormDataToApi(data as FormData) : data;
      return await apiRequest(`/api/publicidad/${id}`, "PATCH", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publicidad"] });
      toast({
        title: "Publicidad actualizada",
        description: "Los cambios se han guardado exitosamente.",
      });
      setIsDialogOpen(false);
      setEditingPublicidad(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la publicidad.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/publicidad/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publicidad"] });
      toast({
        title: "Publicidad eliminada",
        description: "La publicidad se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la publicidad.",
        variant: "destructive",
      });
    },
  });

  const toggleEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string | null }) => {
      const currentEstado = estado || "activo";
      const nuevoEstado = currentEstado === "activo" ? "pausado" : "activo";
      return await apiRequest(`/api/publicidad/${id}`, "PATCH", { estado: nuevoEstado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publicidad"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la publicidad se ha actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingPublicidad) {
      updateMutation.mutate({ id: editingPublicidad.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (publicidad: Publicidad) => {
    setEditingPublicidad(publicidad);
    
    const formatDateToInput = (dateValue: Date | string | null): string => {
      if (!dateValue) return "";
      try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        if (isNaN(date.getTime())) return "";
        return format(date, "yyyy-MM-dd");
      } catch {
        return "";
      }
    };
    
    form.reset({
      titulo: publicidad.titulo || "",
      descripcion: publicidad.descripcion || "",
      tipo: (publicidad.tipo || "carrusel_principal") as any,
      imagenUrl: publicidad.imagenUrl || "",
      enlaceUrl: publicidad.enlaceUrl || "",
      fechaInicio: formatDateToInput(publicidad.fechaInicio),
      fechaFin: formatDateToInput(publicidad.fechaFin),
      estado: (publicidad.estado || "activo") as any,
      orden: publicidad.orden || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta publicidad?")) {
      deleteMutation.mutate(id);
    }
  };

  const getEstadoBadge = (estado: string | null) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500" data-testid={`badge-estado-activo`}>Activo</Badge>;
      case "pausado":
        return <Badge className="bg-yellow-500" data-testid={`badge-estado-pausado`}>Pausado</Badge>;
      case "finalizado":
        return <Badge className="bg-gray-500" data-testid={`badge-estado-finalizado`}>Finalizado</Badge>;
      default:
        return <Badge data-testid={`badge-estado-unknown`}>{estado}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string | null) => {
    const labels: Record<string, string> = {
      carrusel_logos: "Carrusel Logos",
      carrusel_principal: "Carrusel Principal",
      popup: "Popup",
    };
    return <Badge variant="outline" data-testid={`badge-tipo-${tipo}`}>{labels[tipo || ""] || tipo}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Publicidad
          </CardTitle>
          <CardDescription>
            Gestión de logos, carruseles y popups publicitarios
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPublicidad(null);
                form.reset();
              }}
              data-testid="button-crear-publicidad"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Publicidad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPublicidad ? "Editar Publicidad" : "Nueva Publicidad"}
              </DialogTitle>
              <DialogDescription>
                Complete los datos de la publicidad
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  {...form.register("titulo")}
                  placeholder="Título de la publicidad"
                  data-testid="input-titulo"
                />
                {form.formState.errors.titulo && (
                  <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...form.register("descripcion")}
                  placeholder="Descripción de la publicidad"
                  data-testid="input-descripcion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={form.watch("tipo") || undefined}
                    onValueChange={(value) => form.setValue("tipo", value as any)}
                  >
                    <SelectTrigger data-testid="select-tipo">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carrusel_logos">Carrusel Logos</SelectItem>
                      <SelectItem value="carrusel_principal">Carrusel Principal</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    {...form.register("orden", { valueAsNumber: true })}
                    placeholder="0"
                    data-testid="input-orden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagenUrl">URL de Imagen</Label>
                <Input
                  id="imagenUrl"
                  {...form.register("imagenUrl")}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  data-testid="input-imagen-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enlaceUrl">URL de Enlace (opcional)</Label>
                <Input
                  id="enlaceUrl"
                  {...form.register("enlaceUrl")}
                  placeholder="https://ejemplo.com"
                  data-testid="input-enlace-url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    {...form.register("fechaInicio")}
                    data-testid="input-fecha-inicio"
                  />
                  {form.formState.errors.fechaInicio && (
                    <p className="text-sm text-destructive">{form.formState.errors.fechaInicio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    {...form.register("fechaFin")}
                    data-testid="input-fecha-fin"
                  />
                  {form.formState.errors.fechaFin && (
                    <p className="text-sm text-destructive">{form.formState.errors.fechaFin.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPublicidad(null);
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
                  {editingPublicidad ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Cargando publicidades...</p>
        ) : publicidades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay publicidades registradas. Crea la primera publicidad.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicidades.map((pub) => (
                  <TableRow key={pub.id} data-testid={`row-publicidad-${pub.id}`}>
                    <TableCell className="font-medium">{pub.titulo}</TableCell>
                    <TableCell>{getTipoBadge(pub.tipo)}</TableCell>
                    <TableCell>{getEstadoBadge(pub.estado)}</TableCell>
                    <TableCell>
                      {pub.fechaInicio ? (() => {
                        try {
                          const date = typeof pub.fechaInicio === 'string' 
                            ? new Date(pub.fechaInicio) 
                            : pub.fechaInicio;
                          return isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy", { locale: es });
                        } catch {
                          return "-";
                        }
                      })() : "-"}
                    </TableCell>
                    <TableCell>
                      {pub.fechaFin ? (() => {
                        try {
                          const date = typeof pub.fechaFin === 'string' 
                            ? new Date(pub.fechaFin) 
                            : pub.fechaFin;
                          return isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy", { locale: es });
                        } catch {
                          return "-";
                        }
                      })() : "-"}
                    </TableCell>
                    <TableCell>{pub.orden}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleEstadoMutation.mutate({ id: pub.id, estado: pub.estado })}
                          data-testid={`button-toggle-${pub.id}`}
                        >
                          {pub.estado === "activo" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pub)}
                          data-testid={`button-editar-${pub.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pub.id)}
                          data-testid={`button-eliminar-${pub.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
