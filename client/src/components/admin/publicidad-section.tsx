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
import { insertPublicidadSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Pause, Play, ImageIcon, Facebook, Instagram, Twitter, Youtube, Linkedin, MapPin, ExternalLink, Calendar, Info, Upload } from "lucide-react";
import { SiTiktok, SiWhatsapp } from "react-icons/si";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImageUpload } from "@/components/ImageUpload";
import { MultipleImageUpload } from "@/components/MultipleImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPublicidadCaducada, getGoogleMapsUrl } from "@/lib/publicidadUtils";

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
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
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
  .omit({ id: true, fechaInicio: true, fechaFin: true, fechaCaducidad: true, orden: true, latitud: true, longitud: true })
  .extend({
    fechaInicio: z.string().optional(),
    fechaFin: z.string().optional(),
    fechaCaducidad: z.string().optional(),
    orden: z.preprocess((v) => v === "" || v === null || v === undefined ? 0 : Number(v), z.number().min(0)),
    latitud: z.preprocess((v) => v === "" || v === null || v === undefined ? undefined : Number(v), z.number().optional()),
    longitud: z.preprocess((v) => v === "" || v === null || v === undefined ? undefined : Number(v), z.number().optional()),
  });

type FormData = z.infer<typeof formSchema>;

const convertFormDataToApi = (data: FormData) => {
  const convertirFecha = (fecha: string | undefined) => {
    if (!fecha || fecha === "") return null;
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? null : date;
  };

  return {
    ...data,
    fechaInicio: convertirFecha(data.fechaInicio),
    fechaFin: convertirFecha(data.fechaFin),
    fechaCaducidad: convertirFecha(data.fechaCaducidad),
  };
};

export default function PublicidadSection() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMultipleUploadDialogOpen, setIsMultipleUploadDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [editingPublicidad, setEditingPublicidad] = useState<Publicidad | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('carrusel_logos');

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
      latitud: undefined,
      longitud: undefined,
      direccion: "",
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
      return await apiRequest("POST", "/api/publicidad", apiData);
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
        title: "Error al crear publicidad",
        description: error.message || "No se pudo crear la publicidad.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const apiData = convertFormDataToApi(data as FormData);
      return await apiRequest("PATCH", `/api/publicidad/${id}`, apiData);
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
      return await apiRequest("DELETE", `/api/publicidad/${id}`);
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
      return await apiRequest("PATCH", `/api/publicidad/${id}`, { estado: nuevoEstado });
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
      latitud: publicidad.latitud !== null ? publicidad.latitud : undefined,
      longitud: publicidad.longitud !== null ? publicidad.longitud : undefined,
      direccion: publicidad.direccion || "",
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
      logos_servicios: "Logos Servicios",
      popup: "Popup",
    };
    return <Badge variant="outline" data-testid={`badge-tipo-${tipo}`}>{labels[tipo || ""] || tipo}</Badge>;
  };

  const publicidadesFiltradas = publicidades.filter(p => !activeTab || p.tipo === activeTab);

  if (isLoading) {
    return <div className="text-center py-8">Cargando publicidad...</div>;
  }

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
          <Dialog open={isMultipleUploadDialogOpen} onOpenChange={setIsMultipleUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setUploadedImages([])}
                data-testid="button-cargar-multiples"
              >
                <Upload className="h-4 w-4 mr-2" />
                Cargar Múltiples
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Cargar Múltiples Imágenes
                </DialogTitle>
                <DialogDescription>
                  Sube varias imágenes a la vez. Después podrás editar y completar la información de cada una.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <MultipleImageUpload
                  onImagesUploaded={(urls) => {
                    setUploadedImages(urls);
                    toast({
                      title: "Imágenes subidas",
                      description: `Se subieron ${urls.length} imágenes exitosamente. Ahora puedes editar cada una para completar su información.`,
                    });
                  }}
                  endpoint="publicidad"
                  maxSize={15}
                  maxFiles={10}
                />
              </div>
              {uploadedImages.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {uploadedImages.length} imágenes subidas. Cierra este diálogo para editar cada una desde la grilla.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) form.reset(); }}>
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
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
              <div className="p-6 pb-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    {editingPublicidad ? "Editar Publicidad" : "Nueva Publicidad"}
                  </DialogTitle>
                  <DialogDescription>
                    Complete todos los campos necesarios. Use las pestañas para navegar entre secciones.
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <form 
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div className="flex-1 px-6 py-4 overflow-y-auto">
                  <Tabs defaultValue="basico" className="flex flex-col">
                    <TabsList className="grid w-full grid-cols-5 mb-4 sticky top-0 z-10 bg-background">
                      <TabsTrigger value="basico" data-testid="tab-basico">
                        <Info className="h-4 w-4 mr-1" />
                        Básico
                      </TabsTrigger>
                      <TabsTrigger value="imagen" data-testid="tab-imagen">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Imagen
                      </TabsTrigger>
                      <TabsTrigger value="fechas" data-testid="tab-fechas">
                        <Calendar className="h-4 w-4 mr-1" />
                        Fechas
                      </TabsTrigger>
                      <TabsTrigger value="ubicacion" data-testid="tab-ubicacion">
                        <MapPin className="h-4 w-4 mr-1" />
                        Ubicación
                      </TabsTrigger>
                      <TabsTrigger value="redes" data-testid="tab-redes">
                        <Facebook className="h-4 w-4 mr-1" />
                        Redes
                      </TabsTrigger>
                    </TabsList>

                      <TabsContent value="basico" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="titulo">Título *</Label>
                            <Input
                              id="titulo"
                              value={form.watch("titulo") || ""}
                              onChange={(e) => form.setValue("titulo", e.target.value)}
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
                              value={form.watch("descripcion") || ""}
                              onChange={(e) => form.setValue("descripcion", e.target.value)}
                              placeholder="Descripción de la publicidad"
                              rows={3}
                              data-testid="input-descripcion"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tipo">Tipo *</Label>
                              <Select
                                value={form.watch("tipo") || undefined}
                                onValueChange={(value) => form.setValue("tipo", value as any)}
                              >
                                <SelectTrigger data-testid="select-tipo">
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="carrusel_logos">1. Carrusel Logos</SelectItem>
                                  <SelectItem value="carrusel_principal">2. Slider Principal</SelectItem>
                                  <SelectItem value="logos_servicios">3. Logos de Servicios</SelectItem>
                                  <SelectItem value="popup_emergencia">4. Popup Avisos Emergencia</SelectItem>
                                  <SelectItem value="encuestas_apoyo">5. Encuestas/Apoyo/Avisos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="orden">Orden de Visualización</Label>
                              <Input
                                id="orden"
                                type="number"
                                value={form.watch("orden") || 0}
                                onChange={(e) => form.setValue("orden", parseInt(e.target.value) || 0)}
                                placeholder="0"
                                data-testid="input-orden"
                              />
                            </div>
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

                          <div className="space-y-2">
                            <Label htmlFor="enlaceUrl">URL de Enlace (opcional)</Label>
                            <Input
                              id="enlaceUrl"
                              value={form.watch("enlaceUrl") || ""}
                              onChange={(e) => form.setValue("enlaceUrl", e.target.value)}
                              placeholder="https://ejemplo.com"
                              data-testid="input-enlace-url"
                            />
                            <p className="text-xs text-muted-foreground">
                              Si agregas un enlace, la publicidad será clickeable
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="imagen" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                              <ImageIcon className="h-5 w-5 text-purple-600" />
                              Imagen de Publicidad
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Sube una imagen para tu publicidad. Formatos permitidos: JPG, PNG, GIF
                            </p>
                          </div>
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
                      </TabsContent>

                      <TabsContent value="fechas" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Fechas de Vigencia</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Define el período de publicación y caducidad de tu anuncio
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="fechaInicio">Fecha de Inicio de Publicación</Label>
                              <Input
                                id="fechaInicio"
                                type="date"
                                value={form.watch("fechaInicio") || ""}
                                onChange={(e) => form.setValue("fechaInicio", e.target.value)}
                                data-testid="input-fecha-inicio"
                              />
                              <p className="text-xs text-muted-foreground">
                                Fecha en que la publicidad comenzará a mostrarse
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="fechaFin">Fecha de Fin de Publicación</Label>
                              <Input
                                id="fechaFin"
                                type="date"
                                value={form.watch("fechaFin") || ""}
                                onChange={(e) => form.setValue("fechaFin", e.target.value)}
                                data-testid="input-fecha-fin"
                              />
                              <p className="text-xs text-muted-foreground">
                                Fecha en que la publicidad dejará de mostrarse
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="fechaCaducidad">Fecha de Caducidad</Label>
                              <Input
                                id="fechaCaducidad"
                                type="date"
                                value={form.watch("fechaCaducidad") || ""}
                                onChange={(e) => form.setValue("fechaCaducidad", e.target.value)}
                                data-testid="input-fecha-caducidad"
                              />
                              <p className="text-xs text-muted-foreground">
                                Fecha de vencimiento definitivo (se marcará como caducada)
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="ubicacion" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-purple-600" />
                              Ubicación GPS (Opcional)
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Agrega la ubicación de tu negocio. Los usuarios podrán ver cómo llegar con un botón de GPS
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="latitud">Latitud</Label>
                                <Input
                                  id="latitud"
                                  type="number"
                                  step="any"
                                  value={form.watch("latitud") || ""}
                                  onChange={(e) => form.setValue("latitud", e.target.value ? parseFloat(e.target.value) : undefined)}
                                  placeholder="-18.0000"
                                  data-testid="input-latitud"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="longitud">Longitud</Label>
                                <Input
                                  id="longitud"
                                  type="number"
                                  step="any"
                                  value={form.watch("longitud") || ""}
                                  onChange={(e) => form.setValue("longitud", e.target.value ? parseFloat(e.target.value) : undefined)}
                                  placeholder="-70.0000"
                                  data-testid="input-longitud"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="direccion">Dirección</Label>
                              <Input
                                id="direccion"
                                value={form.watch("direccion") || ""}
                                onChange={(e) => form.setValue("direccion", e.target.value)}
                                placeholder="Av. Principal 123, Tacna"
                                data-testid="input-direccion"
                              />
                            </div>

                            <div className="bg-muted p-4 rounded-md">
                              <p className="text-sm font-medium mb-2">¿Cómo obtener las coordenadas?</p>
                              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                <li>Abre Google Maps</li>
                                <li>Busca tu ubicación</li>
                                <li>Haz clic derecho en el punto exacto</li>
                                <li>Las coordenadas aparecerán en la parte superior</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="redes" className="space-y-4 mt-0">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Redes Sociales</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Agrega los enlaces a tus redes sociales. Aparecerán como botones en tu publicidad
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="facebook" className="flex items-center gap-2">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                Facebook
                              </Label>
                              <Input
                                id="facebook"
                                value={form.watch("facebook") || ""}
                                onChange={(e) => form.setValue("facebook", e.target.value)}
                                placeholder="https://facebook.com/tunegocio"
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
                                value={form.watch("instagram") || ""}
                                onChange={(e) => form.setValue("instagram", e.target.value)}
                                placeholder="https://instagram.com/tunegocio"
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
                                value={form.watch("whatsapp") || ""}
                                onChange={(e) => form.setValue("whatsapp", e.target.value)}
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
                                value={form.watch("tiktok") || ""}
                                onChange={(e) => form.setValue("tiktok", e.target.value)}
                                placeholder="@tunegocio"
                                data-testid="input-tiktok"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="twitter" className="flex items-center gap-2">
                                <Twitter className="h-4 w-4 text-blue-400" />
                                Twitter / X
                              </Label>
                              <Input
                                id="twitter"
                                value={form.watch("twitter") || ""}
                                onChange={(e) => form.setValue("twitter", e.target.value)}
                                placeholder="https://twitter.com/tunegocio"
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
                                value={form.watch("youtube") || ""}
                                onChange={(e) => form.setValue("youtube", e.target.value)}
                                placeholder="https://youtube.com/@tunegocio"
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
                                value={form.watch("linkedin") || ""}
                                onChange={(e) => form.setValue("linkedin", e.target.value)}
                                placeholder="https://linkedin.com/company/tunegocio"
                                data-testid="input-linkedin"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancelar"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-guardar"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="carrusel_logos">Carrusel Logos</TabsTrigger>
            <TabsTrigger value="carrusel_principal">Slider Principal</TabsTrigger>
            <TabsTrigger value="logos_servicios">Logos Servicios</TabsTrigger>
            <TabsTrigger value="popup_emergencia">Popup Emergencia</TabsTrigger>
            <TabsTrigger value="encuestas_apoyo">Encuestas/Apoyo</TabsTrigger>
          </TabsList>

          {["carrusel_logos", "carrusel_principal", "logos_servicios", "popup_emergencia", "encuestas_apoyo"].map(tipo => (
            <TabsContent key={tipo} value={tipo} className="mt-4">
              {publicidadesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay publicidades de tipo "{tipo}" aún. Crea una nueva para comenzar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {publicidadesFiltradas.map(pub => (
                    <Card key={pub.id} className="group overflow-hidden relative">
                      {/* Imagen a pantalla completa */}
                      <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center relative">
                        {pub.imagenUrl ? (
                          <img 
                            src={pub.imagenUrl} 
                            alt={pub.titulo || ""} 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-muted-foreground" />
                        )}
                        
                        {/* Badge de estado en esquina superior derecha */}
                        <div className="absolute top-2 right-2">
                          {getEstadoBadge(pub.estado)}
                        </div>

                        {/* Overlay con acciones - aparece al hacer hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => handleEdit(pub)}
                            data-testid={`button-editar-${pub.id}`}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => toggleEstadoMutation.mutate({ id: pub.id, estado: pub.estado })}
                            data-testid={`button-toggle-${pub.id}`}
                            title={pub.estado === "activo" ? "Suspender" : "Activar"}
                          >
                            {pub.estado === "activo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(pub.id)}
                            data-testid={`button-eliminar-${pub.id}`}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Información mínima en footer */}
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate" title={pub.titulo || "Sin título"}>
                          {pub.titulo || "Sin título"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
