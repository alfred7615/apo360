import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ClipboardList, Image, Plus, Edit, Trash2, Eye, BarChart3, 
  Calendar, Clock, X, Play, AlertCircle, Users, Heart, 
  MessageCircle, Share2, Bookmark 
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Pregunta {
  pregunta: string;
  opciones: string[];
}

interface Encuesta {
  id: string;
  titulo: string;
  descripcion?: string;
  preguntas?: Pregunta[];
  imagenUrl?: string;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
  totalRespuestas?: number;
  createdAt: string;
}

interface Popup {
  id: string;
  titulo?: string;
  descripcion?: string;
  imagenUrl?: string;
  videoUrl?: string;
  tipo: string;
  duracionSegundos: number;
  segundosObligatorios: number;
  puedeOmitir: boolean;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
  vistas: number;
  createdAt: string;
}

interface ResultadoEncuesta {
  preguntaIndex: number;
  opcion: number;
  cantidad: number;
}

export default function GestionEncuestasScreen() {
  const [activeTab, setActiveTab] = useState("encuestas");
  const [modalEncuestaOpen, setModalEncuestaOpen] = useState(false);
  const [modalPopupOpen, setModalPopupOpen] = useState(false);
  const [modalResultadosOpen, setModalResultadosOpen] = useState(false);
  const [encuestaEditando, setEncuestaEditando] = useState<Encuesta | null>(null);
  const [popupEditando, setPopupEditando] = useState<Popup | null>(null);
  const [encuestaResultados, setEncuestaResultados] = useState<Encuesta | null>(null);
  const [resultados, setResultados] = useState<ResultadoEncuesta[]>([]);
  const { toast } = useToast();

  const [formEncuesta, setFormEncuesta] = useState({
    titulo: "",
    descripcion: "",
    imagenUrl: "",
    estado: "activa",
    fechaInicio: "",
    fechaFin: "",
    preguntas: [{ pregunta: "", opciones: ["", ""] }] as Pregunta[],
  });

  const [formPopup, setFormPopup] = useState({
    titulo: "",
    descripcion: "",
    imagenUrl: "",
    videoUrl: "",
    tipo: "publicidad",
    duracionSegundos: 30,
    segundosObligatorios: 5,
    puedeOmitir: true,
    estado: "activo",
    fechaInicio: "",
    fechaFin: "",
  });

  const { data: encuestas = [], isLoading: loadingEncuestas } = useQuery<Encuesta[]>({
    queryKey: ["/api/encuestas"],
  });

  const { data: popups = [], isLoading: loadingPopups } = useQuery<Popup[]>({
    queryKey: ["/api/popups"],
  });

  const crearEncuestaMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/encuestas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encuestas"] });
      toast({ title: "Encuesta creada exitosamente" });
      setModalEncuestaOpen(false);
      resetFormEncuesta();
    },
    onError: (error: any) => {
      toast({ title: "Error al crear encuesta", description: error.message, variant: "destructive" });
    },
  });

  const actualizarEncuestaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/encuestas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encuestas"] });
      toast({ title: "Encuesta actualizada exitosamente" });
      setModalEncuestaOpen(false);
      resetFormEncuesta();
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar encuesta", description: error.message, variant: "destructive" });
    },
  });

  const eliminarEncuestaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/encuestas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encuestas"] });
      toast({ title: "Encuesta eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar encuesta", description: error.message, variant: "destructive" });
    },
  });

  const crearPopupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/popups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/popups"] });
      toast({ title: "Popup creado exitosamente" });
      setModalPopupOpen(false);
      resetFormPopup();
    },
    onError: (error: any) => {
      toast({ title: "Error al crear popup", description: error.message, variant: "destructive" });
    },
  });

  const actualizarPopupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/popups/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/popups"] });
      toast({ title: "Popup actualizado exitosamente" });
      setModalPopupOpen(false);
      resetFormPopup();
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar popup", description: error.message, variant: "destructive" });
    },
  });

  const eliminarPopupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/popups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/popups"] });
      toast({ title: "Popup eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar popup", description: error.message, variant: "destructive" });
    },
  });

  const resetFormEncuesta = () => {
    setFormEncuesta({
      titulo: "",
      descripcion: "",
      imagenUrl: "",
      estado: "activa",
      fechaInicio: "",
      fechaFin: "",
      preguntas: [{ pregunta: "", opciones: ["", ""] }],
    });
    setEncuestaEditando(null);
  };

  const resetFormPopup = () => {
    setFormPopup({
      titulo: "",
      descripcion: "",
      imagenUrl: "",
      videoUrl: "",
      tipo: "publicidad",
      duracionSegundos: 30,
      segundosObligatorios: 5,
      puedeOmitir: true,
      estado: "activo",
      fechaInicio: "",
      fechaFin: "",
    });
    setPopupEditando(null);
  };

  const abrirModalEncuesta = (encuesta?: Encuesta) => {
    if (encuesta) {
      setEncuestaEditando(encuesta);
      setFormEncuesta({
        titulo: encuesta.titulo,
        descripcion: encuesta.descripcion || "",
        imagenUrl: encuesta.imagenUrl || "",
        estado: encuesta.estado,
        fechaInicio: encuesta.fechaInicio ? encuesta.fechaInicio.split("T")[0] : "",
        fechaFin: encuesta.fechaFin ? encuesta.fechaFin.split("T")[0] : "",
        preguntas: encuesta.preguntas || [{ pregunta: "", opciones: ["", ""] }],
      });
    } else {
      resetFormEncuesta();
    }
    setModalEncuestaOpen(true);
  };

  const abrirModalPopup = (popup?: Popup) => {
    if (popup) {
      setPopupEditando(popup);
      setFormPopup({
        titulo: popup.titulo || "",
        descripcion: popup.descripcion || "",
        imagenUrl: popup.imagenUrl || "",
        videoUrl: popup.videoUrl || "",
        tipo: popup.tipo,
        duracionSegundos: popup.duracionSegundos,
        segundosObligatorios: popup.segundosObligatorios,
        puedeOmitir: popup.puedeOmitir,
        estado: popup.estado,
        fechaInicio: popup.fechaInicio ? popup.fechaInicio.split("T")[0] : "",
        fechaFin: popup.fechaFin ? popup.fechaFin.split("T")[0] : "",
      });
    } else {
      resetFormPopup();
    }
    setModalPopupOpen(true);
  };

  const verResultados = async (encuesta: Encuesta) => {
    try {
      const response = await fetch(`/api/encuestas/${encuesta.id}/resultados`);
      const data = await response.json();
      setEncuestaResultados(data.encuesta);
      setResultados(data.resultados);
      setModalResultadosOpen(true);
    } catch (error) {
      toast({ title: "Error al cargar resultados", variant: "destructive" });
    }
  };

  const guardarEncuesta = () => {
    const data = {
      ...formEncuesta,
      fechaInicio: formEncuesta.fechaInicio || null,
      fechaFin: formEncuesta.fechaFin || null,
    };

    if (encuestaEditando) {
      actualizarEncuestaMutation.mutate({ id: encuestaEditando.id, data });
    } else {
      crearEncuestaMutation.mutate(data);
    }
  };

  const guardarPopup = () => {
    const data = {
      ...formPopup,
      fechaInicio: formPopup.fechaInicio || null,
      fechaFin: formPopup.fechaFin || null,
    };

    if (popupEditando) {
      actualizarPopupMutation.mutate({ id: popupEditando.id, data });
    } else {
      crearPopupMutation.mutate(data);
    }
  };

  const agregarPregunta = () => {
    setFormEncuesta(prev => ({
      ...prev,
      preguntas: [...prev.preguntas, { pregunta: "", opciones: ["", ""] }],
    }));
  };

  const eliminarPregunta = (index: number) => {
    if (formEncuesta.preguntas.length > 1) {
      setFormEncuesta(prev => ({
        ...prev,
        preguntas: prev.preguntas.filter((_, i) => i !== index),
      }));
    }
  };

  const actualizarPregunta = (index: number, campo: string, valor: string) => {
    setFormEncuesta(prev => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => 
        i === index ? { ...p, [campo]: valor } : p
      ),
    }));
  };

  const agregarOpcion = (preguntaIndex: number) => {
    setFormEncuesta(prev => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => 
        i === preguntaIndex ? { ...p, opciones: [...p.opciones, ""] } : p
      ),
    }));
  };

  const eliminarOpcion = (preguntaIndex: number, opcionIndex: number) => {
    const pregunta = formEncuesta.preguntas[preguntaIndex];
    if (pregunta.opciones.length > 2) {
      setFormEncuesta(prev => ({
        ...prev,
        preguntas: prev.preguntas.map((p, i) => 
          i === preguntaIndex 
            ? { ...p, opciones: p.opciones.filter((_, oi) => oi !== opcionIndex) }
            : p
        ),
      }));
    }
  };

  const actualizarOpcion = (preguntaIndex: number, opcionIndex: number, valor: string) => {
    setFormEncuesta(prev => ({
      ...prev,
      preguntas: prev.preguntas.map((p, i) => 
        i === preguntaIndex 
          ? { ...p, opciones: p.opciones.map((o, oi) => oi === opcionIndex ? valor : o) }
          : p
      ),
    }));
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activa":
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "pausada":
      case "pausado":
        return <Badge className="bg-yellow-500">Pausado</Badge>;
      case "finalizada":
      case "finalizado":
        return <Badge className="bg-gray-500">Finalizado</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "publicidad":
        return <Badge className="bg-blue-500">Publicidad</Badge>;
      case "persona_desaparecida":
        return <Badge className="bg-red-500">Persona Desaparecida</Badge>;
      case "mascota_desaparecida":
        return <Badge className="bg-orange-500">Mascota Desaparecida</Badge>;
      case "evento":
        return <Badge className="bg-purple-500">Evento</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  const encuestasActivas = encuestas.filter(e => e.estado === "activa").length;
  const totalRespuestas = encuestas.reduce((acc, e) => acc + (e.totalRespuestas || 0), 0);
  const popupsActivos = popups.filter(p => p.estado === "activo").length;
  const totalVistas = popups.reduce((acc, p) => acc + (p.vistas || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden" data-testid="screen-gestion-encuestas">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="p-2 rounded-lg bg-primary/10 w-fit">
          <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold">Gestión de Encuestas e Imágenes Popup</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Crea encuestas y configura popups informativos</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="encuestas" data-testid="tab-encuestas" className="text-xs sm:text-sm">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span>Encuestas</span>
            </TabsTrigger>
            <TabsTrigger value="popups" data-testid="tab-popups" className="text-xs sm:text-sm">
              <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span>Popups</span>
            </TabsTrigger>
          </TabsList>
          <Button 
            onClick={() => activeTab === "encuestas" ? abrirModalEncuesta() : abrirModalPopup()}
            data-testid="button-agregar"
            className="w-full sm:w-auto text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            {activeTab === "encuestas" ? "Nueva Encuesta" : "Nuevo Popup"}
          </Button>
        </div>

        <TabsContent value="encuestas" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Activas</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <span className="text-xl sm:text-2xl font-bold" data-testid="text-encuestas-activas">{encuestasActivas}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Respuestas</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <span className="text-xl sm:text-2xl font-bold" data-testid="text-total-respuestas">{totalRespuestas}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <span className="text-xl sm:text-2xl font-bold">{encuestas.length}</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Lista de Encuestas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Encuestas creadas para recopilar feedback</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loadingEncuestas ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Cargando encuestas...</div>
              ) : encuestas.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                  No hay encuestas configuradas. Crea una nueva encuesta para comenzar.
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {encuestas.map((encuesta) => (
                    <div 
                      key={encuesta.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                      data-testid={`card-encuesta-${encuesta.id}`}
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        {encuesta.imagenUrl && (
                          <img 
                            src={encuesta.imagenUrl} 
                            alt={encuesta.titulo}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{encuesta.titulo}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {encuesta.preguntas?.length || 0} preg. | {encuesta.totalRespuestas || 0} resp.
                          </p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                            {getEstadoBadge(encuesta.estado)}
                            {encuesta.fechaInicio && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {format(new Date(encuesta.fechaInicio), "dd/MM/yy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => verResultados(encuesta)}
                          data-testid={`button-resultados-${encuesta.id}`}
                        >
                          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => abrirModalEncuesta(encuesta)}
                          data-testid={`button-editar-encuesta-${encuesta.id}`}
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => eliminarEncuestaMutation.mutate(encuesta.id)}
                          data-testid={`button-eliminar-encuesta-${encuesta.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popups" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Activos</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <span className="text-lg sm:text-2xl font-bold" data-testid="text-popups-activos">{popupsActivos}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Vistas</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <span className="text-lg sm:text-2xl font-bold" data-testid="text-total-vistas">{totalVistas}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Publicidad</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <span className="text-lg sm:text-2xl font-bold">{popups.filter(p => p.tipo === "publicidad").length}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-2 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Desaparec.</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <span className="text-lg sm:text-2xl font-bold">
                  {popups.filter(p => p.tipo === "persona_desaparecida" || p.tipo === "mascota_desaparecida").length}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Lista de Popups</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Imágenes y videos mostrados a usuarios</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loadingPopups ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">Cargando popups...</div>
              ) : popups.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                  No hay popups configurados. Agrega un nuevo popup para comenzar.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {popups.map((popup) => (
                    <Card key={popup.id} className="overflow-hidden" data-testid={`card-popup-${popup.id}`}>
                      {popup.imagenUrl && (
                        <div className="relative h-32 sm:h-40">
                          <img 
                            src={popup.imagenUrl} 
                            alt={popup.titulo || "Popup"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-wrap gap-1 max-w-[80%] justify-end">
                            {getEstadoBadge(popup.estado)}
                            {getTipoBadge(popup.tipo)}
                          </div>
                        </div>
                      )}
                      {popup.videoUrl && (
                        <div className="relative h-32 sm:h-40 bg-gray-900 flex items-center justify-center">
                          <Play className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-wrap gap-1 max-w-[80%] justify-end">
                            {getEstadoBadge(popup.estado)}
                            {getTipoBadge(popup.tipo)}
                          </div>
                        </div>
                      )}
                      <CardContent className="p-3 sm:p-4">
                        <h4 className="font-semibold truncate text-sm sm:text-base">{popup.titulo || "Sin título"}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{popup.descripcion}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{popup.duracionSegundos}s ({popup.segundosObligatorios}s oblig.)</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{popup.vistas || 0} vistas</span>
                        </div>
                        <div className="flex justify-end gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => abrirModalPopup(popup)}
                            data-testid={`button-editar-popup-${popup.id}`}
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => eliminarPopupMutation.mutate(popup.id)}
                            data-testid={`button-eliminar-popup-${popup.id}`}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalEncuestaOpen} onOpenChange={setModalEncuestaOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{encuestaEditando ? "Editar Encuesta" : "Nueva Encuesta"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {encuestaEditando ? "Modifica los datos de la encuesta" : "Completa los campos para crear una nueva encuesta"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="titulo" className="text-xs sm:text-sm">Título de la Encuesta</Label>
                <Input
                  id="titulo"
                  value={formEncuesta.titulo}
                  onChange={(e) => setFormEncuesta(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Encuesta de satisfacción"
                  data-testid="input-titulo-encuesta"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="descripcion" className="text-xs sm:text-sm">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formEncuesta.descripcion}
                  onChange={(e) => setFormEncuesta(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe brevemente la encuesta"
                  data-testid="input-descripcion-encuesta"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="imagenUrl" className="text-xs sm:text-sm">URL de Imagen (opcional)</Label>
                <Input
                  id="imagenUrl"
                  value={formEncuesta.imagenUrl}
                  onChange={(e) => setFormEncuesta(prev => ({ ...prev, imagenUrl: e.target.value }))}
                  placeholder="https://..."
                  data-testid="input-imagen-encuesta"
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="fechaInicio" className="text-xs sm:text-sm">Fecha de Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={formEncuesta.fechaInicio}
                    onChange={(e) => setFormEncuesta(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    data-testid="input-fecha-inicio-encuesta"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="fechaFin" className="text-xs sm:text-sm">Fecha de Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={formEncuesta.fechaFin}
                    onChange={(e) => setFormEncuesta(prev => ({ ...prev, fechaFin: e.target.value }))}
                    data-testid="input-fecha-fin-encuesta"
                    className="text-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estado" className="text-xs sm:text-sm">Estado</Label>
                <Select
                  value={formEncuesta.estado}
                  onValueChange={(v) => setFormEncuesta(prev => ({ ...prev, estado: v }))}
                >
                  <SelectTrigger data-testid="select-estado-encuesta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="font-semibold text-sm sm:text-base">Preguntas</h4>
                <Button variant="outline" size="sm" onClick={agregarPregunta} data-testid="button-agregar-pregunta" className="text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {formEncuesta.preguntas.map((pregunta, pIndex) => (
                  <div key={pIndex} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <Label className="text-xs sm:text-sm">Pregunta {pIndex + 1}</Label>
                      {formEncuesta.preguntas.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => eliminarPregunta(pIndex)}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={pregunta.pregunta}
                      onChange={(e) => actualizarPregunta(pIndex, "pregunta", e.target.value)}
                      placeholder="Escribe la pregunta"
                      className="mb-2 sm:mb-3 text-sm"
                      data-testid={`input-pregunta-${pIndex}`}
                    />
                    
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Opciones de respuesta</Label>
                      {pregunta.opciones.map((opcion, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-1.5 sm:gap-2">
                          <Input
                            value={opcion}
                            onChange={(e) => actualizarOpcion(pIndex, oIndex, e.target.value)}
                            placeholder={`Opción ${oIndex + 1}`}
                            data-testid={`input-opcion-${pIndex}-${oIndex}`}
                            className="text-sm"
                          />
                          {pregunta.opciones.length > 2 && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                              onClick={() => eliminarOpcion(pIndex, oIndex)}
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => agregarOpcion(pIndex)}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Agregar Opción
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
              <Button variant="outline" onClick={() => setModalEncuestaOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button 
                onClick={guardarEncuesta}
                disabled={crearEncuestaMutation.isPending || actualizarEncuestaMutation.isPending}
                data-testid="button-guardar-encuesta"
                className="w-full sm:w-auto"
              >
                {crearEncuestaMutation.isPending || actualizarEncuestaMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalPopupOpen} onOpenChange={setModalPopupOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{popupEditando ? "Editar Popup" : "Nuevo Popup"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {popupEditando ? "Modifica los datos del popup" : "Completa los campos para crear un nuevo popup"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div>
              <Label htmlFor="tituloPopup" className="text-xs sm:text-sm">Título</Label>
              <Input
                id="tituloPopup"
                value={formPopup.titulo}
                onChange={(e) => setFormPopup(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título del popup"
                data-testid="input-titulo-popup"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="descripcionPopup" className="text-xs sm:text-sm">Descripción</Label>
              <Textarea
                id="descripcionPopup"
                value={formPopup.descripcion}
                onChange={(e) => setFormPopup(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción del popup"
                data-testid="input-descripcion-popup"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="tipoPopup" className="text-xs sm:text-sm">Tipo</Label>
              <Select
                value={formPopup.tipo}
                onValueChange={(v) => setFormPopup(prev => ({ ...prev, tipo: v }))}
              >
                <SelectTrigger data-testid="select-tipo-popup" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publicidad">Publicidad</SelectItem>
                  <SelectItem value="persona_desaparecida">Persona Desaparecida</SelectItem>
                  <SelectItem value="mascota_desaparecida">Mascota Desaparecida</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="imagenUrlPopup" className="text-xs sm:text-sm">URL de Imagen</Label>
              <Input
                id="imagenUrlPopup"
                value={formPopup.imagenUrl}
                onChange={(e) => setFormPopup(prev => ({ ...prev, imagenUrl: e.target.value }))}
                placeholder="https://..."
                data-testid="input-imagen-popup"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="videoUrlPopup" className="text-xs sm:text-sm">URL de Video (opcional)</Label>
              <Input
                id="videoUrlPopup"
                value={formPopup.videoUrl}
                onChange={(e) => setFormPopup(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://..."
                data-testid="input-video-popup"
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="duracion" className="text-xs sm:text-sm">Duración (segundos)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={formPopup.duracionSegundos}
                  onChange={(e) => setFormPopup(prev => ({ ...prev, duracionSegundos: parseInt(e.target.value) || 30 }))}
                  data-testid="input-duracion-popup"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="obligatorios" className="text-xs sm:text-sm">Seg. Obligatorios</Label>
                <Input
                  id="obligatorios"
                  type="number"
                  value={formPopup.segundosObligatorios}
                  onChange={(e) => setFormPopup(prev => ({ ...prev, segundosObligatorios: parseInt(e.target.value) || 5 }))}
                  data-testid="input-obligatorios-popup"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="fechaInicioPopup" className="text-xs sm:text-sm">Fecha de Inicio</Label>
                <Input
                  id="fechaInicioPopup"
                  type="date"
                  value={formPopup.fechaInicio}
                  onChange={(e) => setFormPopup(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  data-testid="input-fecha-inicio-popup"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="fechaFinPopup" className="text-xs sm:text-sm">Fecha de Fin</Label>
                <Input
                  id="fechaFinPopup"
                  type="date"
                  value={formPopup.fechaFin}
                  onChange={(e) => setFormPopup(prev => ({ ...prev, fechaFin: e.target.value }))}
                  data-testid="input-fecha-fin-popup"
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="estadoPopup" className="text-xs sm:text-sm">Estado</Label>
              <Select
                value={formPopup.estado}
                onValueChange={(v) => setFormPopup(prev => ({ ...prev, estado: v }))}
              >
                <SelectTrigger data-testid="select-estado-popup" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
              <Button variant="outline" onClick={() => setModalPopupOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button 
                onClick={guardarPopup}
                disabled={crearPopupMutation.isPending || actualizarPopupMutation.isPending}
                data-testid="button-guardar-popup"
                className="w-full sm:w-auto"
              >
                {crearPopupMutation.isPending || actualizarPopupMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalResultadosOpen} onOpenChange={setModalResultadosOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Resultados de la Encuesta</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {encuestaResultados?.titulo} - {encuestaResultados?.totalRespuestas || 0} respuestas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {encuestaResultados?.preguntas?.map((pregunta, pIndex) => {
              const respuestasPregunta = resultados.filter(r => r.preguntaIndex === pIndex);
              const totalPregunta = respuestasPregunta.reduce((acc, r) => acc + r.cantidad, 0);

              return (
                <div key={pIndex} className="border rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{pregunta.pregunta}</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {pregunta.opciones.map((opcion, oIndex) => {
                      const resultado = respuestasPregunta.find(r => r.opcion === oIndex);
                      const cantidad = resultado?.cantidad || 0;
                      const porcentaje = totalPregunta > 0 ? (cantidad / totalPregunta) * 100 : 0;

                      return (
                        <div key={oIndex}>
                          <div className="flex justify-between text-xs sm:text-sm mb-1 gap-2">
                            <span className="truncate flex-1">{opcion}</span>
                            <span className="font-medium flex-shrink-0">{cantidad} ({porcentaje.toFixed(0)}%)</span>
                          </div>
                          <Progress value={porcentaje} className="h-1.5 sm:h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
