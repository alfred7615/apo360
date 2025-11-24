import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { insertArchivoMp3Schema } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Pause, Play, Music as MusicIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ArchivoMp3 = {
  id: string;
  titulo: string;
  categoria: string | null;
  archivoUrl: string;
  duracion: number | null;
  orden: number | null;
  estado: string | null;
  createdAt: Date | null;
};

const formSchema = insertArchivoMp3Schema
  .omit({ orden: true, duracion: true })
  .extend({
    orden: z.preprocess((v) => v === "" || v === null || v === undefined ? 0 : Number(v), z.number().min(0)),
    duracion: z.preprocess((v) => v === "" || v === null || v === undefined ? undefined : Number(v), z.number().optional()),
  });

type FormData = z.infer<typeof formSchema>;

const CATEGORIAS = ["Rock", "Cumbia", "Éxitos", "Mix", "Romántica", "Salsa", "Reggaeton", "Clásica"];

export default function ArchivosMp3Section() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArchivo, setEditingArchivo] = useState<ArchivoMp3 | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      categoria: "",
      archivoUrl: "",
      duracion: undefined,
      orden: 0,
      estado: "activo",
    },
  });

  const { data: archivos = [], isLoading } = useQuery<ArchivoMp3[]>({
    queryKey: ["/api/archivos-mp3"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/archivos-mp3", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3"] });
      toast({
        title: "Archivo MP3 creado",
        description: "El archivo se creó correctamente",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el archivo",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      return await apiRequest("PUT", `/api/archivos-mp3/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3"] });
      toast({
        title: "Archivo MP3 actualizado",
        description: "El archivo se actualizó correctamente",
      });
      setIsDialogOpen(false);
      setEditingArchivo(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el archivo",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/archivos-mp3/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3"] });
      toast({
        title: "Archivo MP3 eliminado",
        description: "El archivo se eliminó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    },
  });

  const toggleEstadoMutation = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string; nuevoEstado: string }) => {
      return await apiRequest("PUT", `/api/archivos-mp3/${id}`, { estado: nuevoEstado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del archivo se actualizó correctamente",
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
    if (editingArchivo) {
      updateMutation.mutate({ id: editingArchivo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (archivo: ArchivoMp3) => {
    setEditingArchivo(archivo);
    form.reset({
      titulo: archivo.titulo || "",
      categoria: archivo.categoria || "",
      archivoUrl: archivo.archivoUrl || "",
      duracion: archivo.duracion || undefined,
      orden: archivo.orden || 0,
      estado: (archivo.estado || "activo") as any,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este archivo MP3?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleEstado = (archivo: ArchivoMp3) => {
    const nuevoEstado = archivo.estado === "activo" ? "pausado" : "activo";
    toggleEstadoMutation.mutate({ id: archivo.id, nuevoEstado });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const archivosOrdenados = [...archivos].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MusicIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            Gestión de Listas MP3
          </CardTitle>
          <CardDescription>
            Administra los archivos MP3 disponibles por categoría
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingArchivo(null);
                form.reset();
              }}
              data-testid="button-crear-mp3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo MP3
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle>
                  {editingArchivo ? "Editar Archivo MP3" : "Nuevo Archivo MP3"}
                </DialogTitle>
                <DialogDescription>
                  Complete los datos del archivo MP3
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
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        {...form.register("titulo")}
                        value={form.watch("titulo") || ""}
                        onChange={(e) => form.setValue("titulo", e.target.value)}
                        placeholder="Título de la canción"
                        data-testid="input-titulo"
                      />
                      {form.formState.errors.titulo && (
                        <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select
                        value={form.watch("categoria") || undefined}
                        onValueChange={(value) => form.setValue("categoria", value)}
                      >
                        <SelectTrigger data-testid="select-categoria">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="archivoUrl">URL del Archivo MP3 *</Label>
                      <Input
                        id="archivoUrl"
                        {...form.register("archivoUrl")}
                        value={form.watch("archivoUrl") || ""}
                        onChange={(e) => form.setValue("archivoUrl", e.target.value)}
                        placeholder="https://storage.example.com/song.mp3"
                        data-testid="input-archivo-url"
                      />
                      {form.formState.errors.archivoUrl && (
                        <p className="text-sm text-destructive">{form.formState.errors.archivoUrl.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duracion">Duración (segundos)</Label>
                        <Input
                          id="duracion"
                          type="number"
                          {...form.register("duracion")}
                          value={form.watch("duracion")?.toString() || ""}
                          onChange={(e) => form.setValue("duracion", e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="180"
                          data-testid="input-duracion"
                        />
                      </div>

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
                      setEditingArchivo(null);
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
                    {editingArchivo ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando archivos MP3...</p>
        ) : archivosOrdenados.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay archivos MP3 registrados</p>
        ) : (
          <div className="space-y-3">
            {archivosOrdenados.map((archivo) => (
              <Card key={archivo.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{archivo.titulo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {archivo.categoria && (
                        <Badge variant="outline">{archivo.categoria}</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(archivo.duracion)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={archivo.estado === "activo" ? "default" : "secondary"}>
                      {archivo.estado === "activo" ? "Activo" : "Pausado"}
                    </Badge>
                    <Badge variant="outline">Orden: {archivo.orden || 0}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleEstado(archivo)}
                      data-testid={`button-toggle-${archivo.id}`}
                    >
                      {archivo.estado === "activo" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(archivo)}
                      data-testid={`button-edit-${archivo.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(archivo.id)}
                      data-testid={`button-delete-${archivo.id}`}
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
