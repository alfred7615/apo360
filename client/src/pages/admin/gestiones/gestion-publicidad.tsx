import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import PublicidadSection from "@/components/admin/publicidad-section";
import { Image, Code, Plus, Copy, Eye, Trash2, Settings, RefreshCw, ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Widget {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  activo: boolean;
  ancho: string;
  alto: string;
  colorFondo: string;
  colorTexto?: string;
  bordes: boolean;
  autoplay: boolean;
  intervalo: number;
  itemsPorVista: number;
  mostrarControles: boolean;
  estilosPersonalizados?: string;
  categoriaId?: string;
  limite: number;
  orden: string;
  dominiosPermitidos?: string[];
  requiereApiKey: boolean;
  apiKey?: string;
  totalVisualizaciones: number;
  totalClicks: number;
  createdAt: string;
}

const TIPOS_WIDGET = [
  { valor: "carrusel_logos", nombre: "Carrusel de Logos", descripcion: "Logos de servicios locales en carrusel" },
  { valor: "slider_principal", nombre: "Slider Principal", descripcion: "Banner principal de publicidad" },
  { valor: "logos_servicios", nombre: "Logos de Servicios", descripcion: "Grid de logos de servicios" },
  { valor: "popup_emergencia", nombre: "Popup de Emergencia", descripcion: "Popup con información importante" },
  { valor: "encuestas", nombre: "Encuestas", descripcion: "Encuestas y votaciones" },
  { valor: "radio_listas", nombre: "Radio y Listas", descripcion: "Radios online y listas de música" },
  { valor: "productos_destacados", nombre: "Productos Destacados", descripcion: "Productos marcados como destacados" },
  { valor: "productos_recientes", nombre: "Productos Recientes", descripcion: "Últimos productos agregados" },
  { valor: "categorias_servicios", nombre: "Categorías de Servicios", descripcion: "Lista de categorías disponibles" },
];

function WidgetsSection() {
  const { toast } = useToast();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [widgetEditando, setWidgetEditando] = useState<Widget | null>(null);
  const [codigoEmbed, setCodigoEmbed] = useState<string>("");
  const [dialogoCodigo, setDialogoCodigo] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "carrusel_logos",
    descripcion: "",
    activo: true,
    ancho: "100%",
    alto: "auto",
    colorFondo: "transparent",
    colorTexto: "",
    bordes: false,
    autoplay: true,
    intervalo: 5000,
    itemsPorVista: 4,
    mostrarControles: true,
    estilosPersonalizados: "",
    limite: 10,
    orden: "reciente",
    requiereApiKey: false,
    dominiosPermitidos: [] as string[],
  });

  const { data: widgets = [], isLoading } = useQuery<Widget[]>({
    queryKey: ["/api/widgets"],
  });

  const crearMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/widgets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      setDialogoAbierto(false);
      resetForm();
      toast({ title: "Widget creado exitosamente" });
    },
    onError: () => toast({ title: "Error al crear widget", variant: "destructive" }),
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/widgets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      setDialogoAbierto(false);
      setWidgetEditando(null);
      resetForm();
      toast({ title: "Widget actualizado" });
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/widgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      toast({ title: "Widget eliminado" });
    },
    onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "carrusel_logos",
      descripcion: "",
      activo: true,
      ancho: "100%",
      alto: "auto",
      colorFondo: "transparent",
      colorTexto: "",
      bordes: false,
      autoplay: true,
      intervalo: 5000,
      itemsPorVista: 4,
      mostrarControles: true,
      estilosPersonalizados: "",
      limite: 10,
      orden: "reciente",
      requiereApiKey: false,
      dominiosPermitidos: [],
    });
  };

  const abrirEditar = (widget: Widget) => {
    setWidgetEditando(widget);
    setFormData({
      nombre: widget.nombre,
      tipo: widget.tipo,
      descripcion: widget.descripcion || "",
      activo: widget.activo,
      ancho: widget.ancho,
      alto: widget.alto,
      colorFondo: widget.colorFondo,
      colorTexto: widget.colorTexto || "",
      bordes: widget.bordes,
      autoplay: widget.autoplay,
      intervalo: widget.intervalo,
      itemsPorVista: widget.itemsPorVista,
      mostrarControles: widget.mostrarControles,
      estilosPersonalizados: widget.estilosPersonalizados || "",
      limite: widget.limite,
      orden: widget.orden,
      requiereApiKey: widget.requiereApiKey,
      dominiosPermitidos: widget.dominiosPermitidos || [],
    });
    setDialogoAbierto(true);
  };

  const guardar = () => {
    if (!formData.nombre || !formData.tipo) {
      toast({ title: "Nombre y tipo son requeridos", variant: "destructive" });
      return;
    }
    if (widgetEditando) {
      actualizarMutation.mutate({ id: widgetEditando.id, data: formData });
    } else {
      crearMutation.mutate(formData);
    }
  };

  const obtenerCodigoEmbed = async (widget: Widget) => {
    try {
      const response = await fetch(`/api/widgets/${widget.id}/embed-code`);
      const data = await response.json();
      setCodigoEmbed(data.embedCode);
      setDialogoCodigo(true);
    } catch {
      toast({ title: "Error al obtener código", variant: "destructive" });
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoEmbed);
    toast({ title: "Código copiado al portapapeles" });
  };

  const getTipoNombre = (tipo: string) => {
    return TIPOS_WIDGET.find(t => t.valor === tipo)?.nombre || tipo;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Widgets Embebibles</h3>
          <p className="text-sm text-muted-foreground">
            Crea widgets para compartir en otros sitios web
          </p>
        </div>
        <Dialog open={dialogoAbierto} onOpenChange={(open) => {
          setDialogoAbierto(open);
          if (!open) { setWidgetEditando(null); resetForm(); }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-nuevo-widget">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{widgetEditando ? "Editar Widget" : "Crear Nuevo Widget"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Mi Widget"
                    data-testid="input-widget-nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                    <SelectTrigger data-testid="select-widget-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_WIDGET.map(t => (
                        <SelectItem key={t.valor} value={t.valor}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del widget..."
                  data-testid="input-widget-descripcion"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ancho</Label>
                  <Input 
                    value={formData.ancho}
                    onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    placeholder="100%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alto</Label>
                  <Input 
                    value={formData.alto}
                    onChange={(e) => setFormData({...formData, alto: e.target.value})}
                    placeholder="auto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Límite items</Label>
                  <Input 
                    type="number"
                    value={formData.limite}
                    onChange={(e) => setFormData({...formData, limite: parseInt(e.target.value) || 10})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color de fondo</Label>
                  <Input 
                    value={formData.colorFondo}
                    onChange={(e) => setFormData({...formData, colorFondo: e.target.value})}
                    placeholder="transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color de texto</Label>
                  <Input 
                    value={formData.colorTexto}
                    onChange={(e) => setFormData({...formData, colorTexto: e.target.value})}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intervalo autoplay (ms)</Label>
                  <Input 
                    type="number"
                    value={formData.intervalo}
                    onChange={(e) => setFormData({...formData, intervalo: parseInt(e.target.value) || 5000})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Items por vista</Label>
                  <Input 
                    type="number"
                    value={formData.itemsPorVista}
                    onChange={(e) => setFormData({...formData, itemsPorVista: parseInt(e.target.value) || 4})}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.activo}
                    onCheckedChange={(v) => setFormData({...formData, activo: v})}
                  />
                  <Label>Activo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.autoplay}
                    onCheckedChange={(v) => setFormData({...formData, autoplay: v})}
                  />
                  <Label>Autoplay</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.bordes}
                    onCheckedChange={(v) => setFormData({...formData, bordes: v})}
                  />
                  <Label>Bordes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.mostrarControles}
                    onCheckedChange={(v) => setFormData({...formData, mostrarControles: v})}
                  />
                  <Label>Controles</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.requiereApiKey}
                    onCheckedChange={(v) => setFormData({...formData, requiereApiKey: v})}
                  />
                  <Label>Requiere API Key</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estilos CSS personalizados</Label>
                <Textarea 
                  value={formData.estilosPersonalizados}
                  onChange={(e) => setFormData({...formData, estilosPersonalizados: e.target.value})}
                  placeholder=".mi-clase { color: red; }"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoAbierto(false)}>Cancelar</Button>
              <Button 
                onClick={guardar}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
                data-testid="button-guardar-widget"
              >
                {(crearMutation.isPending || actualizarMutation.isPending) && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                {widgetEditando ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando widgets...</div>
      ) : widgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No hay widgets creados</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer widget para compartirlo en otros sitios web
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <Card key={widget.id} data-testid={`card-widget-${widget.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{widget.nombre}</h4>
                      <Badge variant={widget.activo ? "default" : "secondary"}>
                        {widget.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="outline">{getTipoNombre(widget.tipo)}</Badge>
                    </div>
                    {widget.descripcion && (
                      <p className="text-sm text-muted-foreground mb-2">{widget.descripcion}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Vistas: {widget.totalVisualizaciones || 0}</span>
                      <span>Clicks: {widget.totalClicks || 0}</span>
                      {widget.requiereApiKey && <span className="text-amber-600">Requiere API Key</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => obtenerCodigoEmbed(widget)}
                      data-testid={`button-codigo-${widget.id}`}
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Código
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/api/embed/${widget.id}`, '_blank')}
                      data-testid={`button-preview-${widget.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => abrirEditar(widget)}
                      data-testid={`button-editar-${widget.id}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Eliminar este widget?")) {
                          eliminarMutation.mutate(widget.id);
                        }
                      }}
                      data-testid={`button-eliminar-${widget.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogoCodigo} onOpenChange={setDialogoCodigo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Código de Embed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copia este código y pégalo en cualquier sitio web donde quieras mostrar el widget:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {codigoEmbed}
              </pre>
              <Button 
                size="sm" 
                className="absolute top-2 right-2"
                onClick={copiarCodigo}
                data-testid="button-copiar-codigo"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GestionPublicidadScreen() {
  return (
    <div className="space-y-6" data-testid="screen-gestion-publicidad">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Image className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Publicidad</h2>
          <p className="text-muted-foreground">Administra logos, carruseles, popups y widgets embebibles</p>
        </div>
      </div>
      
      <Tabs defaultValue="publicidad" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="publicidad" data-testid="tab-publicidad">
            <Image className="h-4 w-4 mr-2" />
            Publicidad
          </TabsTrigger>
          <TabsTrigger value="widgets" data-testid="tab-widgets">
            <Code className="h-4 w-4 mr-2" />
            Widgets
          </TabsTrigger>
        </TabsList>
        <TabsContent value="publicidad" className="mt-4">
          <PublicidadSection />
        </TabsContent>
        <TabsContent value="widgets" className="mt-4">
          <WidgetsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
