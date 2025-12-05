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
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPublicidadSchema, type RadioOnline, type ListaMp3 } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, Pause, Play, ImageIcon, Facebook, Instagram, Twitter, Youtube, Linkedin, MapPin, ExternalLink, Calendar, Info, Upload, Radio, Music, Volume2, Star, StopCircle, Loader2, Edit } from "lucide-react";
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

  const { data: radios = [], isLoading: loadingRadios } = useQuery<RadioOnline[]>({
    queryKey: ["/api/radios-online"],
  });

  const { data: listas = [], isLoading: loadingListas } = useQuery<ListaMp3[]>({
    queryKey: ["/api/listas-mp3"],
  });

  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showListaModal, setShowListaModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioOnline | null>(null);
  const [selectedLista, setSelectedLista] = useState<ListaMp3 | null>(null);
  const [deleteType, setDeleteType] = useState<"radio" | "lista">("radio");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [radioSubTab, setRadioSubTab] = useState<"radios" | "listas">("radios");

  const [radioForm, setRadioForm] = useState({
    nombre: "",
    url: "",
    iframeCode: "",
    descripcion: "",
    logoUrl: "",
    orden: 0,
    esPredeterminada: false,
    estado: "activo" as string,
  });

  const [listaForm, setListaForm] = useState({
    nombre: "",
    descripcion: "",
    rutaCarpeta: "",
    imagenUrl: "",
    genero: "",
    orden: 0,
    estado: "activo" as string,
  });

  const resetRadioForm = () => {
    setRadioForm({
      nombre: "",
      url: "",
      iframeCode: "",
      descripcion: "",
      logoUrl: "",
      orden: 0,
      esPredeterminada: false,
      estado: "activo",
    });
    setSelectedRadio(null);
  };

  const resetListaForm = () => {
    setListaForm({
      nombre: "",
      descripcion: "",
      rutaCarpeta: "",
      imagenUrl: "",
      genero: "",
      orden: 0,
      estado: "activo",
    });
    setSelectedLista(null);
  };

  const createRadioMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/radios-online", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      setShowRadioModal(false);
      resetRadioForm();
      toast({ title: "Radio creada", description: "La radio se ha creado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al crear la radio", variant: "destructive" });
    },
  });

  const updateRadioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/radios-online/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      setShowRadioModal(false);
      setSelectedRadio(null);
      resetRadioForm();
      toast({ title: "Radio actualizada", description: "La radio se ha actualizado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al actualizar la radio", variant: "destructive" });
    },
  });

  const deleteRadioMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/radios-online/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radios-online"] });
      setShowDeleteDialog(false);
      setDeleteId(null);
      toast({ title: "Radio eliminada", description: "La radio se ha eliminado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al eliminar la radio", variant: "destructive" });
    },
  });

  const createListaMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/listas-mp3", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listas-mp3"] });
      setShowListaModal(false);
      resetListaForm();
      toast({ title: "Lista creada", description: "La lista MP3 se ha creado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al crear la lista", variant: "destructive" });
    },
  });

  const updateListaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/listas-mp3/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listas-mp3"] });
      setShowListaModal(false);
      setSelectedLista(null);
      resetListaForm();
      toast({ title: "Lista actualizada", description: "La lista MP3 se ha actualizado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al actualizar la lista", variant: "destructive" });
    },
  });

  const deleteListaMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/listas-mp3/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listas-mp3"] });
      setShowDeleteDialog(false);
      setDeleteId(null);
      toast({ title: "Lista eliminada", description: "La lista MP3 se ha eliminado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al eliminar la lista", variant: "destructive" });
    },
  });

  const handleEditRadio = (radio: RadioOnline) => {
    setSelectedRadio(radio);
    setRadioForm({
      nombre: radio.nombre,
      url: radio.url || "",
      iframeCode: radio.iframeCode || "",
      descripcion: radio.descripcion || "",
      logoUrl: radio.logoUrl || "",
      orden: radio.orden || 0,
      esPredeterminada: radio.esPredeterminada || false,
      estado: radio.estado || "activo",
    });
    setShowRadioModal(true);
  };

  const handleEditLista = (lista: ListaMp3) => {
    setSelectedLista(lista);
    setListaForm({
      nombre: lista.nombre,
      descripcion: lista.descripcion || "",
      rutaCarpeta: lista.rutaCarpeta || "",
      imagenUrl: lista.imagenUrl || "",
      genero: lista.genero || "",
      orden: lista.orden || 0,
      estado: lista.estado || "activo",
    });
    setShowListaModal(true);
  };

  const handleDeleteRadio = (id: number) => {
    setDeleteType("radio");
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteLista = (id: number) => {
    setDeleteType("lista");
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId === null) return;
    if (deleteType === "radio") {
      deleteRadioMutation.mutate(deleteId);
    } else {
      deleteListaMutation.mutate(deleteId);
    }
  };

  const handleSubmitRadio = () => {
    if (selectedRadio) {
      updateRadioMutation.mutate({ id: selectedRadio.id, data: radioForm });
    } else {
      createRadioMutation.mutate(radioForm);
    }
  };

  const handleSubmitLista = () => {
    if (selectedLista) {
      updateListaMutation.mutate({ id: selectedLista.id, data: listaForm });
    } else {
      createListaMutation.mutate(listaForm);
    }
  };

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
                  onImagesUploaded={async (urls) => {
                    setUploadedImages(urls);
                    
                    // Crear registros de publicidad automáticamente para cada imagen subida
                    // Manejo granular de errores por imagen
                    const resultados = await Promise.allSettled(
                      urls.map(url => 
                        apiRequest("POST", "/api/publicidad", {
                          imagenUrl: url,
                          tipo: activeTab || "carrusel_logos",
                          estado: "activo",
                          titulo: `Nueva Publicidad`,
                          descripcion: "",
                          orden: 0,
                        })
                      )
                    );
                    
                    const exitosos = resultados.filter(r => r.status === 'fulfilled').length;
                    const fallidos = resultados.filter(r => r.status === 'rejected').length;
                    
                    // Refrescar la lista de publicidades
                    await queryClient.invalidateQueries({ queryKey: ["/api/publicidad"] });
                    
                    if (exitosos > 0) {
                      toast({
                        title: fallidos > 0 ? "Guardado parcial" : "Imágenes guardadas",
                        description: fallidos > 0 
                          ? `Se crearon ${exitosos} publicidades. ${fallidos} fallaron. Puedes editarlas para completar su información.`
                          : `Se crearon ${exitosos} publicidades exitosamente. Puedes editarlas para completar su información.`,
                        variant: fallidos > 0 ? "default" : "default",
                      });
                      
                      // Solo cerrar si al menos una se guardó exitosamente
                      setIsMultipleUploadDialogOpen(false);
                    } else {
                      toast({
                        title: "Error al guardar",
                        description: "Las imágenes se subieron pero no se pudieron crear los registros. Intenta crear manualmente desde 'Nueva Publicidad'.",
                        variant: "destructive",
                      });
                    }
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
          <TabsList className="flex flex-wrap h-auto gap-2 p-2 bg-muted/30 rounded-lg w-full">
            <TabsTrigger 
              value="carrusel_logos"
              className="flex-1 min-w-[140px] h-10 font-medium shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=inactive]:bg-background data-[state=inactive]:hover:bg-muted gap-2"
              data-testid="tab-carrusel-logos"
            >
              <ImageIcon className="h-4 w-4" />
              Carrusel Logos
            </TabsTrigger>
            <TabsTrigger 
              value="carrusel_principal"
              className="flex-1 min-w-[140px] h-10 font-medium shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=inactive]:bg-background data-[state=inactive]:hover:bg-muted gap-2"
              data-testid="tab-slider-principal"
            >
              <ImageIcon className="h-4 w-4" />
              Slider Principal
            </TabsTrigger>
            <TabsTrigger 
              value="logos_servicios"
              className="flex-1 min-w-[140px] h-10 font-medium shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=inactive]:bg-background data-[state=inactive]:hover:bg-muted gap-2"
              data-testid="tab-logos-servicios"
            >
              <ImageIcon className="h-4 w-4" />
              Logos Servicios
            </TabsTrigger>
            <TabsTrigger 
              value="popup_emergencia"
              className="flex-1 min-w-[140px] h-10 font-medium shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=inactive]:bg-background data-[state=inactive]:hover:bg-muted gap-2"
              data-testid="tab-popup-emergencia"
            >
              <ImageIcon className="h-4 w-4" />
              Popup Emergencia
            </TabsTrigger>
            <TabsTrigger 
              value="encuestas_apoyo"
              className="flex-1 min-w-[140px] h-10 font-medium shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=inactive]:bg-background data-[state=inactive]:hover:bg-muted gap-2"
              data-testid="tab-encuestas-apoyo"
            >
              <ImageIcon className="h-4 w-4" />
              Encuestas/Apoyo
            </TabsTrigger>
            <TabsTrigger 
              value="radio_online"
              className="flex-1 min-w-[140px] h-10 font-medium shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=inactive]:bg-background data-[state=inactive]:hover:bg-muted gap-2"
              data-testid="tab-radio-online"
            >
              <Radio className="h-4 w-4" />
              Radio y Listas
            </TabsTrigger>
          </TabsList>

          {["carrusel_logos", "carrusel_principal", "logos_servicios", "popup_emergencia", "encuestas_apoyo"].map(tipo => {
            const publicidadesDelTipo = publicidades.filter(p => p.tipo === tipo);
            return (
            <TabsContent key={tipo} value={tipo} className="mt-4">
              {publicidadesDelTipo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay publicidades de tipo "{tipo}" aún. Crea una nueva para comenzar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {publicidadesDelTipo.map(pub => (
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

                      {/* Información mínima en footer con indicadores */}
                      <CardContent className="p-2 space-y-1">
                        <p className="text-xs font-medium truncate" title={pub.titulo || "Sin título"}>
                          {pub.titulo || "Sin título"}
                        </p>
                        
                        {/* Indicadores visuales de información adicional */}
                        <div className="flex flex-wrap gap-1 items-center min-h-[16px]">
                          {/* Indicador de GPS - solo si tiene coordenadas válidas */}
                          {(typeof pub.latitud === 'number' && typeof pub.longitud === 'number' && 
                            Math.abs(pub.latitud) <= 90 && Math.abs(pub.longitud) <= 180 &&
                            pub.latitud !== 0 && pub.longitud !== 0) && (
                            <span title={`GPS: ${pub.latitud}, ${pub.longitud}`}>
                              <MapPin className="h-3 w-3 text-blue-500" />
                            </span>
                          )}
                          
                          {/* Indicadores de redes sociales - solo si tienen contenido válido y formato URL */}
                          {pub.facebook && pub.facebook.trim().length > 5 && 
                            (pub.facebook.includes('facebook.com') || pub.facebook.includes('fb.com') || pub.facebook.startsWith('@')) && (
                            <span title={`Facebook: ${pub.facebook}`}>
                              <Facebook className="h-3 w-3 text-blue-600" />
                            </span>
                          )}
                          {pub.instagram && pub.instagram.trim().length > 3 && 
                            (pub.instagram.includes('instagram.com') || pub.instagram.startsWith('@')) && (
                            <span title={`Instagram: ${pub.instagram}`}>
                              <Instagram className="h-3 w-3 text-pink-600" />
                            </span>
                          )}
                          {pub.whatsapp && pub.whatsapp.trim().length > 5 && (
                            <span title={`WhatsApp: ${pub.whatsapp}`}>
                              <SiWhatsapp className="h-3 w-3 text-green-600" />
                            </span>
                          )}
                          {pub.tiktok && pub.tiktok.trim().length > 3 && 
                            (pub.tiktok.includes('tiktok.com') || pub.tiktok.startsWith('@')) && (
                            <span title={`TikTok: ${pub.tiktok}`}>
                              <SiTiktok className="h-3 w-3 text-gray-800 dark:text-gray-200" />
                            </span>
                          )}
                          {pub.twitter && pub.twitter.trim().length > 3 && 
                            (pub.twitter.includes('twitter.com') || pub.twitter.includes('x.com') || pub.twitter.startsWith('@')) && (
                            <span title={`Twitter/X: ${pub.twitter}`}>
                              <Twitter className="h-3 w-3 text-blue-400" />
                            </span>
                          )}
                          {pub.youtube && pub.youtube.trim().length > 5 && 
                            (pub.youtube.includes('youtube.com') || pub.youtube.includes('youtu.be') || pub.youtube.startsWith('@')) && (
                            <span title={`YouTube: ${pub.youtube}`}>
                              <Youtube className="h-3 w-3 text-red-600" />
                            </span>
                          )}
                          {pub.linkedin && pub.linkedin.trim().length > 5 && 
                            pub.linkedin.includes('linkedin.com') && (
                            <span title={`LinkedIn: ${pub.linkedin}`}>
                              <Linkedin className="h-3 w-3 text-blue-700" />
                            </span>
                          )}
                          
                          {/* Indicador de enlace externo - solo si tiene URL válida */}
                          {pub.enlaceUrl && pub.enlaceUrl.trim().length > 5 && 
                            (pub.enlaceUrl.startsWith('http://') || pub.enlaceUrl.startsWith('https://')) && (
                            <span title={`Enlace: ${pub.enlaceUrl}`}>
                              <ExternalLink className="h-3 w-3 text-purple-500" />
                            </span>
                          )}
                          
                          {/* Indicador de fechas configuradas - solo si tiene al menos una fecha válida */}
                          {(pub.fechaInicio || pub.fechaFin || pub.fechaCaducidad) && (
                            <span title="Tiene fechas configuradas">
                              <Calendar className="h-3 w-3 text-orange-500" />
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
          })}

          {/* Tab de Radio Online y Listas MP3 */}
          <TabsContent value="radio_online" className="mt-4 space-y-4">
            {/* Sub-tabs para Radios y Listas - Estilo profesional consistente */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
              <Button
                variant={radioSubTab === "radios" ? "default" : "outline"}
                onClick={() => setRadioSubTab("radios")}
                className="flex-1 min-w-[140px] h-10 font-medium shadow-sm gap-2"
                data-testid="subtab-radios"
              >
                <Radio className="h-4 w-4" />
                Radios Online ({radios.length})
              </Button>
              <Button
                variant={radioSubTab === "listas" ? "default" : "outline"}
                onClick={() => setRadioSubTab("listas")}
                className="flex-1 min-w-[140px] h-10 font-medium shadow-sm gap-2"
                data-testid="subtab-listas"
              >
                <Music className="h-4 w-4" />
                Listas MP3 ({listas.length})
              </Button>
            </div>

            {/* Contenido de Radios */}
            {radioSubTab === "radios" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Radio className="h-5 w-5 text-purple-600" />
                    Radios Online
                  </h3>
                  <Button
                    onClick={() => {
                      resetRadioForm();
                      setShowRadioModal(true);
                    }}
                    size="sm"
                    className="gap-2"
                    data-testid="button-nueva-radio"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Radio
                  </Button>
                </div>

                {loadingRadios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : radios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay radios configuradas. Agrega una nueva para comenzar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {radios.map((radio) => (
                      <Card key={radio.id} className="group">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {radio.logoUrl ? (
                                <img src={radio.logoUrl} alt={radio.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <Radio className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{radio.nombre}</h4>
                                {radio.esPredeterminada && (
                                  <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              {radio.descripcion && (
                                <p className="text-sm text-muted-foreground truncate">{radio.descripcion}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={radio.estado === "activo" ? "default" : "secondary"}>
                                  {radio.estado}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Orden: {radio.orden}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRadio(radio)}
                              data-testid={`button-editar-radio-${radio.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRadio(radio.id)}
                              data-testid={`button-eliminar-radio-${radio.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contenido de Listas MP3 */}
            {radioSubTab === "listas" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Music className="h-5 w-5 text-green-600" />
                    Listas MP3
                  </h3>
                  <Button
                    onClick={() => {
                      resetListaForm();
                      setShowListaModal(true);
                    }}
                    size="sm"
                    className="gap-2"
                    data-testid="button-nueva-lista"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Lista
                  </Button>
                </div>

                {loadingListas ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : listas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay listas MP3 configuradas. Agrega una nueva para comenzar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listas.map((lista) => (
                      <Card key={lista.id} className="group">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {lista.imagenUrl ? (
                                <img src={lista.imagenUrl} alt={lista.nombre} className="w-full h-full object-cover" />
                              ) : (
                                <Music className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{lista.nombre}</h4>
                              {lista.genero && (
                                <p className="text-sm text-muted-foreground">{lista.genero}</p>
                              )}
                              {lista.descripcion && (
                                <p className="text-sm text-muted-foreground truncate">{lista.descripcion}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={lista.estado === "activo" ? "default" : "secondary"}>
                                  {lista.estado}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Orden: {lista.orden}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLista(lista)}
                              data-testid={`button-editar-lista-${lista.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLista(lista.id)}
                              data-testid={`button-eliminar-lista-${lista.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal para Radio */}
        <Dialog open={showRadioModal} onOpenChange={setShowRadioModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                {selectedRadio ? "Editar Radio" : "Nueva Radio"}
              </DialogTitle>
              <DialogDescription>
                {selectedRadio ? "Modifica los datos de la radio" : "Agrega una nueva radio online"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="radio-nombre">Nombre *</Label>
                <Input
                  id="radio-nombre"
                  value={radioForm.nombre}
                  onChange={(e) => setRadioForm({ ...radioForm, nombre: e.target.value })}
                  placeholder="Nombre de la radio"
                  data-testid="input-radio-nombre"
                />
              </div>
              <div>
                <Label htmlFor="radio-url">URL de Stream</Label>
                <Input
                  id="radio-url"
                  value={radioForm.url}
                  onChange={(e) => setRadioForm({ ...radioForm, url: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-radio-url"
                />
              </div>
              <div>
                <Label htmlFor="radio-iframe">Código Iframe</Label>
                <Textarea
                  id="radio-iframe"
                  value={radioForm.iframeCode}
                  onChange={(e) => setRadioForm({ ...radioForm, iframeCode: e.target.value })}
                  placeholder="<iframe>...</iframe>"
                  className="min-h-[80px]"
                  data-testid="input-radio-iframe"
                />
              </div>
              <div>
                <Label htmlFor="radio-descripcion">Descripcion</Label>
                <Textarea
                  id="radio-descripcion"
                  value={radioForm.descripcion}
                  onChange={(e) => setRadioForm({ ...radioForm, descripcion: e.target.value })}
                  placeholder="Descripcion de la radio"
                  data-testid="input-radio-descripcion"
                />
              </div>
              <div>
                <Label htmlFor="radio-logo">URL del Logo</Label>
                <Input
                  id="radio-logo"
                  value={radioForm.logoUrl}
                  onChange={(e) => setRadioForm({ ...radioForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-radio-logo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="radio-orden">Orden</Label>
                  <Input
                    id="radio-orden"
                    type="number"
                    value={radioForm.orden}
                    onChange={(e) => setRadioForm({ ...radioForm, orden: parseInt(e.target.value) || 0 })}
                    data-testid="input-radio-orden"
                  />
                </div>
                <div>
                  <Label htmlFor="radio-estado">Estado</Label>
                  <Select
                    value={radioForm.estado}
                    onValueChange={(value) => setRadioForm({ ...radioForm, estado: value })}
                  >
                    <SelectTrigger data-testid="select-radio-estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="radio-predeterminada"
                  checked={radioForm.esPredeterminada}
                  onCheckedChange={(checked) => setRadioForm({ ...radioForm, esPredeterminada: checked })}
                  data-testid="switch-radio-predeterminada"
                />
                <Label htmlFor="radio-predeterminada">Es predeterminada</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRadioModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitRadio}
                disabled={!radioForm.nombre || createRadioMutation.isPending || updateRadioMutation.isPending}
                data-testid="button-guardar-radio"
              >
                {createRadioMutation.isPending || updateRadioMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para Lista MP3 */}
        <Dialog open={showListaModal} onOpenChange={setShowListaModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                {selectedLista ? "Editar Lista" : "Nueva Lista MP3"}
              </DialogTitle>
              <DialogDescription>
                {selectedLista ? "Modifica los datos de la lista" : "Agrega una nueva lista de MP3"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lista-nombre">Nombre *</Label>
                <Input
                  id="lista-nombre"
                  value={listaForm.nombre}
                  onChange={(e) => setListaForm({ ...listaForm, nombre: e.target.value })}
                  placeholder="Nombre de la lista"
                  data-testid="input-lista-nombre"
                />
              </div>
              <div>
                <Label htmlFor="lista-genero">Genero</Label>
                <Input
                  id="lista-genero"
                  value={listaForm.genero}
                  onChange={(e) => setListaForm({ ...listaForm, genero: e.target.value })}
                  placeholder="Rock, Pop, Jazz..."
                  data-testid="input-lista-genero"
                />
              </div>
              <div>
                <Label htmlFor="lista-descripcion">Descripcion</Label>
                <Textarea
                  id="lista-descripcion"
                  value={listaForm.descripcion}
                  onChange={(e) => setListaForm({ ...listaForm, descripcion: e.target.value })}
                  placeholder="Descripcion de la lista"
                  data-testid="input-lista-descripcion"
                />
              </div>
              <div>
                <Label htmlFor="lista-carpeta">Ruta de Carpeta</Label>
                <Input
                  id="lista-carpeta"
                  value={listaForm.rutaCarpeta}
                  onChange={(e) => setListaForm({ ...listaForm, rutaCarpeta: e.target.value })}
                  placeholder="/musica/rock/"
                  data-testid="input-lista-carpeta"
                />
              </div>
              <div>
                <Label htmlFor="lista-imagen">URL de Imagen</Label>
                <Input
                  id="lista-imagen"
                  value={listaForm.imagenUrl}
                  onChange={(e) => setListaForm({ ...listaForm, imagenUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-lista-imagen"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lista-orden">Orden</Label>
                  <Input
                    id="lista-orden"
                    type="number"
                    value={listaForm.orden}
                    onChange={(e) => setListaForm({ ...listaForm, orden: parseInt(e.target.value) || 0 })}
                    data-testid="input-lista-orden"
                  />
                </div>
                <div>
                  <Label htmlFor="lista-estado">Estado</Label>
                  <Select
                    value={listaForm.estado}
                    onValueChange={(value) => setListaForm({ ...listaForm, estado: value })}
                  >
                    <SelectTrigger data-testid="select-lista-estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowListaModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitLista}
                disabled={!listaForm.nombre || createListaMutation.isPending || updateListaMutation.isPending}
                data-testid="button-guardar-lista"
              >
                {createListaMutation.isPending || updateListaMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmacion de eliminacion */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estas seguro de eliminar {deleteType === "radio" ? "esta radio" : "esta lista"}? Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirmar-eliminar"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
