import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Radio, Music, Plus, Play, Pause, Edit, Trash2, Star, StopCircle, Volume2, Loader2, FolderOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RadioOnline, ListaMp3 } from "@shared/schema";
import GestorArchivosMp3 from "@/components/admin/GestorArchivosMp3";

export default function GestionRadioMp3Screen() {
  const [activeTab, setActiveTab] = useState("radios");
  const { toast } = useToast();

  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showListaModal, setShowListaModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioOnline | null>(null);
  const [selectedLista, setSelectedLista] = useState<ListaMp3 | null>(null);
  const [vistaArchivos, setVistaArchivos] = useState<ListaMp3 | null>(null);
  const [deleteType, setDeleteType] = useState<"radio" | "lista">("radio");
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  const { data: radios = [], isLoading: loadingRadios } = useQuery<RadioOnline[]>({
    queryKey: ["/api/radios-online"],
  });

  const { data: listas = [], isLoading: loadingListas } = useQuery<ListaMp3[]>({
    queryKey: ["/api/listas-mp3"],
  });

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
  };

  const handleEditRadio = (radio: RadioOnline) => {
    setSelectedRadio(radio);
    setRadioForm({
      nombre: radio.nombre,
      url: radio.url,
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

  const toggleRadioEstado = (radio: RadioOnline, nuevoEstado: string) => {
    updateRadioMutation.mutate({ id: radio.id, data: { estado: nuevoEstado } });
  };

  const toggleListaEstado = (lista: ListaMp3, nuevoEstado: string) => {
    updateListaMutation.mutate({ id: lista.id, data: { estado: nuevoEstado } });
  };

  const getEstadoBadge = (estado: string | null) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "pausado":
        return <Badge className="bg-yellow-500">Pausado</Badge>;
      case "suspendido":
        return <Badge className="bg-red-500">Suspendido</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const radiosActivas = radios.filter(r => r.estado === "activo").length;
  const listasActivas = listas.filter(l => l.estado === "activo").length;

  if (vistaArchivos) {
    return (
      <div className="space-y-6" data-testid="screen-gestor-archivos-mp3">
        <GestorArchivosMp3 
          lista={vistaArchivos} 
          onBack={() => setVistaArchivos(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="screen-gestion-radio-mp3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Radio className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestion de Radio Online y Listas MP3</h2>
          <p className="text-muted-foreground">Configura radios en streaming y listas de reproduccion MP3</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Radios Online</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{radios.length}</div>
            <p className="text-xs text-muted-foreground">{radiosActivas} activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Listas MP3</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listas.length}</div>
            <p className="text-xs text-muted-foreground">{listasActivas} activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Radio Predeterminada</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {radios.find(r => r.esPredeterminada)?.nombre || "No configurada"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">En Reproduccion</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">-</div>
            <p className="text-xs text-muted-foreground">Sin audio activo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="radios" data-testid="tab-radios">
              <Radio className="h-4 w-4 mr-2" />
              Radios Online ({radios.length})
            </TabsTrigger>
            <TabsTrigger value="listas" data-testid="tab-listas">
              <Music className="h-4 w-4 mr-2" />
              Listas MP3 ({listas.length})
            </TabsTrigger>
          </TabsList>
          <Button 
            onClick={() => {
              if (activeTab === "radios") {
                setSelectedRadio(null);
                resetRadioForm();
                setShowRadioModal(true);
              } else {
                setSelectedLista(null);
                resetListaForm();
                setShowListaModal(true);
              }
            }}
            data-testid="button-agregar-audio"
          >
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "radios" ? "Nueva Radio" : "Nueva Lista"}
          </Button>
        </div>

        <TabsContent value="radios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Radios Online Configuradas</CardTitle>
              <CardDescription>URLs de streaming de radio para reproduccion en la app</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRadios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : radios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay radios configuradas. Agrega una nueva radio para comenzar.
                </div>
              ) : (
                <div className="space-y-3">
                  {radios.map((radio) => (
                    <div 
                      key={radio.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`radio-item-${radio.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Radio className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{radio.nombre}</p>
                            {radio.esPredeterminada && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{radio.url}</p>
                          {radio.descripcion && (
                            <p className="text-xs text-muted-foreground mt-1">{radio.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getEstadoBadge(radio.estado)}
                        <Select
                          value={radio.estado || "activo"}
                          onValueChange={(value) => toggleRadioEstado(radio, value)}
                        >
                          <SelectTrigger className="w-[130px]" data-testid={`select-estado-radio-${radio.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="pausado">Pausado</SelectItem>
                            <SelectItem value="suspendido">Suspendido</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEditRadio(radio)}
                          data-testid={`button-edit-radio-${radio.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeleteRadio(radio.id)}
                          data-testid={`button-delete-radio-${radio.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Listas de Reproduccion MP3</CardTitle>
              <CardDescription>Colecciones de musica organizadas por genero</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingListas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : listas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay listas MP3. Crea una nueva lista para comenzar.
                </div>
              ) : (
                <div className="space-y-3">
                  {listas.map((lista) => (
                    <div 
                      key={lista.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`lista-item-${lista.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-full bg-green-500/10">
                          <Music className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{lista.nombre}</p>
                          {lista.genero && (
                            <Badge variant="outline" className="mt-1">{lista.genero}</Badge>
                          )}
                          {lista.rutaCarpeta && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{lista.rutaCarpeta}</p>
                          )}
                          {lista.descripcion && (
                            <p className="text-xs text-muted-foreground">{lista.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <Badge variant="secondary">Orden: {lista.orden || 0}</Badge>
                        {getEstadoBadge(lista.estado)}
                        <Select
                          value={lista.estado || "activo"}
                          onValueChange={(value) => toggleListaEstado(lista, value)}
                        >
                          <SelectTrigger className="w-[130px]" data-testid={`select-estado-lista-${lista.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="pausado">Pausado</SelectItem>
                            <SelectItem value="suspendido">Suspendido</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => setVistaArchivos(lista)}
                          className="touch-manipulation"
                          data-testid={`button-ver-archivos-${lista.id}`}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Archivos</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEditLista(lista)}
                          data-testid={`button-edit-lista-${lista.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeleteLista(lista.id)}
                          data-testid={`button-delete-lista-${lista.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showRadioModal} onOpenChange={setShowRadioModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedRadio ? "Editar Radio Online" : "Nueva Radio Online"}</DialogTitle>
            <DialogDescription>
              {selectedRadio ? "Modifica los datos de la radio" : "Agrega una nueva radio de streaming"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Radio TacnaFM"
                value={radioForm.nombre}
                onChange={(e) => setRadioForm({ ...radioForm, nombre: e.target.value })}
                data-testid="input-radio-nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL de Streaming *</Label>
              <Input
                id="url"
                placeholder="https://mediastreamm.com/8158/"
                value={radioForm.url}
                onChange={(e) => setRadioForm({ ...radioForm, url: e.target.value })}
                data-testid="input-radio-url"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iframeCode">Codigo Iframe (opcional)</Label>
              <Textarea
                id="iframeCode"
                placeholder='<iframe src="..."></iframe>'
                value={radioForm.iframeCode}
                onChange={(e) => setRadioForm({ ...radioForm, iframeCode: e.target.value })}
                data-testid="input-radio-iframe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripcion de la radio..."
                value={radioForm.descripcion}
                onChange={(e) => setRadioForm({ ...radioForm, descripcion: e.target.value })}
                data-testid="input-radio-descripcion"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  value={radioForm.orden}
                  onChange={(e) => setRadioForm({ ...radioForm, orden: parseInt(e.target.value) || 0 })}
                  data-testid="input-radio-orden"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={radioForm.estado}
                  onValueChange={(value) => setRadioForm({ ...radioForm, estado: value })}
                >
                  <SelectTrigger data-testid="select-radio-estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="esPredeterminada"
                checked={radioForm.esPredeterminada}
                onCheckedChange={(checked) => setRadioForm({ ...radioForm, esPredeterminada: checked })}
                data-testid="switch-radio-predeterminada"
              />
              <Label htmlFor="esPredeterminada">Radio predeterminada (se reproduce al cargar la app)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRadioModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitRadio}
              disabled={!radioForm.nombre || !radioForm.url || createRadioMutation.isPending || updateRadioMutation.isPending}
              data-testid="button-guardar-radio"
            >
              {(createRadioMutation.isPending || updateRadioMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedRadio ? "Guardar Cambios" : "Crear Radio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showListaModal} onOpenChange={setShowListaModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedLista ? "Editar Lista MP3" : "Nueva Lista MP3"}</DialogTitle>
            <DialogDescription>
              {selectedLista ? "Modifica los datos de la lista" : "Crea una nueva coleccion de musica"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lista-nombre">Nombre *</Label>
              <Input
                id="lista-nombre"
                placeholder="Ej: Rock Moderna"
                value={listaForm.nombre}
                onChange={(e) => setListaForm({ ...listaForm, nombre: e.target.value })}
                data-testid="input-lista-nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lista-genero">Genero</Label>
              <Select
                value={listaForm.genero}
                onValueChange={(value) => setListaForm({ ...listaForm, genero: value })}
              >
                <SelectTrigger data-testid="select-lista-genero">
                  <SelectValue placeholder="Selecciona un genero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rock">Rock</SelectItem>
                  <SelectItem value="Cumbia">Cumbia</SelectItem>
                  <SelectItem value="Exitos">Exitos Variados</SelectItem>
                  <SelectItem value="Mix">Mix Variado</SelectItem>
                  <SelectItem value="Romantica">Romantica</SelectItem>
                  <SelectItem value="Salsa">Salsa</SelectItem>
                  <SelectItem value="Reggaeton">Reggaeton</SelectItem>
                  <SelectItem value="Pop">Pop</SelectItem>
                  <SelectItem value="Electronica">Electronica</SelectItem>
                  <SelectItem value="Clasica">Clasica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lista-ruta">Ruta de Carpeta</Label>
              <Input
                id="lista-ruta"
                placeholder="/public_html/assets/mp3/lista1"
                value={listaForm.rutaCarpeta}
                onChange={(e) => setListaForm({ ...listaForm, rutaCarpeta: e.target.value })}
                data-testid="input-lista-ruta"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lista-descripcion">Descripcion</Label>
              <Textarea
                id="lista-descripcion"
                placeholder="Descripcion de la lista..."
                value={listaForm.descripcion}
                onChange={(e) => setListaForm({ ...listaForm, descripcion: e.target.value })}
                data-testid="input-lista-descripcion"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lista-orden">Orden</Label>
                <Input
                  id="lista-orden"
                  type="number"
                  value={listaForm.orden}
                  onChange={(e) => setListaForm({ ...listaForm, orden: parseInt(e.target.value) || 0 })}
                  data-testid="input-lista-orden"
                />
              </div>
              <div className="grid gap-2">
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
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
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
              {(createListaMutation.isPending || updateListaMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedLista ? "Guardar Cambios" : "Crear Lista"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente 
              {deleteType === "radio" ? " esta radio online" : " esta lista MP3"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-eliminar"
            >
              {(deleteRadioMutation.isPending || deleteListaMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
