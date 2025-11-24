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
import { Plus, Pencil, Trash2, Pause, Play, ImageIcon, Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { SiTiktok, SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImageUpload } from "@/components/ImageUpload";
import { ScrollArea } from "@/components/ui/scroll-area";

type Publicidad = {
  id: string;
  titulo: string | null;
  descripcion: string | null;
  tipo: string | null;
  imagenUrl: string | null;
  enlaceUrl: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  fechaCaducidad: Date | null;
  estado: string | null;
  usuarioId: string | null;
  orden: number | null;
  facebook: string | null;
  instagram: string | null;
  whatsapp: string | null;
  tiktok: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const formSchema = insertPublicidadSchema
  .omit({ fechaInicio: true, fechaFin: true, fechaCaducidad: true })
  .extend({
    fechaInicio: z.string().optional(),
    fechaFin: z.string().optional(),
    fechaCaducidad: z.string().optional(),
  });

type FormData = z.infer<typeof formSchema>;

const convertFormDataToApi = (data: FormData) => {
  return {
    ...data,
    fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
    fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
    fechaCaducidad: data.fechaCaducidad ? new Date(data.fechaCaducidad) : null,
  };
};

export default function PublicidadSection() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPublicidad, setEditingPublicidad] = useState<Publicidad | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      fechaCaducidad: "",
      estado: "activo",
      orden: 0,
      facebook: "",
      instagram: "",
      whatsapp: "",
      tiktok: "",
      twitter: "",
      youtube: "",
      linkedin: "",
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
      const apiData = convertFormDataToApi(data as FormData);
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
      fechaCaducidad: formatDateToInput(publicidad.fechaCaducidad),
      estado: (publicidad.estado || "activo") as any,
      orden: publicidad.orden || 0,
      facebook: publicidad.facebook || "",
      instagram: publicidad.instagram || "",
      whatsapp: publicidad.whatsapp || "",
      tiktok: publicidad.tiktok || "",
      twitter: publicidad.twitter || "",
      youtube: publicidad.youtube || "",
      linkedin: publicidad.linkedin || "",
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
            Gestión de Publicidad
          </CardTitle>
          <CardDescription>
            Administra logos, carruseles y popups con información de redes sociales
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              Galería
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              Lista
            </Button>
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
                Nueva Publicidad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingPublicidad ? "Editar Publicidad" : "Nueva Publicidad"}
                </DialogTitle>
                <DialogDescription>
                  Complete los datos de la publicidad incluyendo redes sociales
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4">
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información Básica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="titulo">Título *</Label>
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

                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          {...form.register("descripcion")}
                          placeholder="Descripción de la publicidad"
                          rows={3}
                          data-testid="input-descripcion"
                        />
                      </div>

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
                            <SelectItem value="finalizado">Finalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Imagen */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Imagen de Publicidad</h3>
                    <ImageUpload
                      value={form.watch("imagenUrl") || ""}
                      onChange={(url) => form.setValue("imagenUrl", url || "")}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      endpoint="publicidad"
                    />
                    {form.formState.errors.imagenUrl && (
                      <p className="text-sm text-destructive">{form.formState.errors.imagenUrl.message}</p>
                    )}
                  </div>

                  {/* Enlaces */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Enlaces</h3>
                    <div className="space-y-2">
                      <Label htmlFor="enlaceUrl">URL de Enlace (opcional)</Label>
                      <Input
                        id="enlaceUrl"
                        {...form.register("enlaceUrl")}
                        placeholder="https://ejemplo.com"
                        data-testid="input-enlace-url"
                      />
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Fechas de Vigencia</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                        <Input
                          id="fechaInicio"
                          type="date"
                          {...form.register("fechaInicio")}
                          data-testid="input-fecha-inicio"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fechaFin">Fecha Fin</Label>
                        <Input
                          id="fechaFin"
                          type="date"
                          {...form.register("fechaFin")}
                          data-testid="input-fecha-fin"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fechaCaducidad">Fecha Caducidad</Label>
                        <Input
                          id="fechaCaducidad"
                          type="date"
                          {...form.register("fechaCaducidad")}
                          data-testid="input-fecha-caducidad"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Redes Sociales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Redes Sociales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          Facebook
                        </Label>
                        <Input
                          id="facebook"
                          {...form.register("facebook")}
                          placeholder="https://facebook.com/..."
                          data-testid="input-facebook"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          {...form.register("instagram")}
                          placeholder="https://instagram.com/..."
                          data-testid="input-instagram"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                          <SiWhatsapp className="h-4 w-4 text-green-600" />
                          WhatsApp
                        </Label>
                        <Input
                          id="whatsapp"
                          {...form.register("whatsapp")}
                          placeholder="+51 999 999 999"
                          data-testid="input-whatsapp"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tiktok" className="flex items-center gap-2">
                          <SiTiktok className="h-4 w-4" />
                          TikTok
                        </Label>
                        <Input
                          id="tiktok"
                          {...form.register("tiktok")}
                          placeholder="https://tiktok.com/@..."
                          data-testid="input-tiktok"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-sky-500" />
                          Twitter / X
                        </Label>
                        <Input
                          id="twitter"
                          {...form.register("twitter")}
                          placeholder="https://twitter.com/..."
                          data-testid="input-twitter"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="youtube" className="flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-600" />
                          YouTube
                        </Label>
                        <Input
                          id="youtube"
                          {...form.register("youtube")}
                          placeholder="https://youtube.com/..."
                          data-testid="input-youtube"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-blue-700" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          {...form.register("linkedin")}
                          placeholder="https://linkedin.com/..."
                          data-testid="input-linkedin"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-6 pt-4">
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
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Cargando publicidades...</p>
        ) : publicidades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay publicidades registradas. Crea la primera publicidad.
          </p>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {publicidades.map((pub) => (
              <Card key={pub.id} className="overflow-hidden hover-elevate" data-testid={`card-publicidad-${pub.id}`}>
                <div className="relative aspect-square bg-muted">
                  {pub.imagenUrl ? (
                    <img
                      src={pub.imagenUrl}
                      alt={pub.titulo || "Publicidad"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {getEstadoBadge(pub.estado)}
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <h4 className="font-semibold text-sm line-clamp-2">{pub.titulo || "Sin título"}</h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {getTipoBadge(pub.tipo)}
                    <span>Orden: {pub.orden}</span>
                  </div>
                  {pub.fechaCaducidad && (
                    <div className="text-xs text-muted-foreground">
                      Caduca: {format(new Date(pub.fechaCaducidad), "dd/MM/yyyy")}
                    </div>
                  )}
                  {(pub.facebook || pub.instagram || pub.whatsapp || pub.tiktok || pub.twitter || pub.youtube || pub.linkedin) && (
                    <div className="flex gap-1 flex-wrap">
                      {pub.facebook && <Facebook className="h-3 w-3 text-blue-600" />}
                      {pub.instagram && <Instagram className="h-3 w-3 text-pink-600" />}
                      {pub.whatsapp && <SiWhatsapp className="h-3 w-3 text-green-600" />}
                      {pub.tiktok && <SiTiktok className="h-3 w-3" />}
                      {pub.twitter && <Twitter className="h-3 w-3 text-sky-500" />}
                      {pub.youtube && <Youtube className="h-3 w-3 text-red-600" />}
                      {pub.linkedin && <Linkedin className="h-3 w-3 text-blue-700" />}
                    </div>
                  )}
                  <div className="flex gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleEstadoMutation.mutate({ id: pub.id, estado: pub.estado })}
                      data-testid={`button-toggle-${pub.id}`}
                    >
                      {pub.estado === "activo" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(pub)}
                      data-testid={`button-editar-${pub.id}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(pub.id)}
                      data-testid={`button-eliminar-${pub.id}`}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {publicidades.map((pub) => (
              <Card key={pub.id} className="p-4 hover-elevate" data-testid={`row-publicidad-${pub.id}`}>
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                    {pub.imagenUrl ? (
                      <img
                        src={pub.imagenUrl}
                        alt={pub.titulo || "Publicidad"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{pub.titulo || "Sin título"}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{pub.descripcion}</p>
                      </div>
                      <div className="flex gap-2">
                        {getEstadoBadge(pub.estado)}
                        {getTipoBadge(pub.tipo)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Orden: {pub.orden}</span>
                      {pub.fechaInicio && (
                        <span>Inicio: {format(new Date(pub.fechaInicio), "dd/MM/yyyy")}</span>
                      )}
                      {pub.fechaFin && (
                        <span>Fin: {format(new Date(pub.fechaFin), "dd/MM/yyyy")}</span>
                      )}
                      {pub.fechaCaducidad && (
                        <span className="text-destructive">Caduca: {format(new Date(pub.fechaCaducidad), "dd/MM/yyyy")}</span>
                      )}
                    </div>
                    {(pub.facebook || pub.instagram || pub.whatsapp || pub.tiktok || pub.twitter || pub.youtube || pub.linkedin) && (
                      <div className="flex gap-2">
                        {pub.facebook && (
                          <a href={pub.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 text-blue-600" />
                          </a>
                        )}
                        {pub.instagram && (
                          <a href={pub.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 text-pink-600" />
                          </a>
                        )}
                        {pub.whatsapp && (
                          <a href={`https://wa.me/${pub.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <SiWhatsapp className="h-4 w-4 text-green-600" />
                          </a>
                        )}
                        {pub.tiktok && (
                          <a href={pub.tiktok} target="_blank" rel="noopener noreferrer">
                            <SiTiktok className="h-4 w-4" />
                          </a>
                        )}
                        {pub.twitter && (
                          <a href={pub.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 text-sky-500" />
                          </a>
                        )}
                        {pub.youtube && (
                          <a href={pub.youtube} target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-4 w-4 text-red-600" />
                          </a>
                        )}
                        {pub.linkedin && (
                          <a href={pub.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4 text-blue-700" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleEstadoMutation.mutate({ id: pub.id, estado: pub.estado })}
                      data-testid={`button-toggle-${pub.id}`}
                    >
                      {pub.estado === "activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
