import { useState, useRef } from "react";
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
import { Radio, Music, Plus, Edit, Trash2, Star, Volume2, Loader2, FolderOpen, Upload, X, FileAudio } from "lucide-react";
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

  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [creandoLista, setCreandoLista] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

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
    setArchivosSeleccionados([]);
  };

  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const nuevosArchivos = Array.from(files).filter(
        file => file.type === "audio/mpeg" || file.type === "audio/mp3" || file.name.toLowerCase().endsWith('.mp3')
      );
      setArchivosSeleccionados(prev => [...prev, ...nuevosArchivos]);
    }
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }
  };

  const handleQuitarArchivo = (index: number) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  const handleSubmitLista = async () => {
    if (!listaForm.nombre.trim()) {
      toast({ title: "Error", description: "El nombre de la lista es requerido", variant: "destructive" });
      return;
    }
    if (archivosSeleccionados.length === 0) {
      toast({ title: "Error", description: "Debes seleccionar al menos un archivo MP3", variant: "destructive" });
      return;
    }

    setCreandoLista(true);
    try {
      const listaResponse = await apiRequest("POST", "/api/listas-mp3", { 
        nombre: listaForm.nombre.trim(),
        estado: "activo"
      });
      const nuevaLista = await listaResponse.json();

      const formData = new FormData();
      archivosSeleccionados.forEach(archivo => {
        formData.append("archivos", archivo);
      });

      const uploadResponse = await fetch(`/api/listas-mp3/${nuevaLista.id}/subir`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir los archivos");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/listas-mp3"] });
      setShowListaModal(false);
      resetListaForm();
      toast({ 
        title: "Lista creada", 
        description: `Se creo la lista "${nuevaLista.nombre}" con ${archivosSeleccionados.length} archivo(s)` 
      });
    } catch (error: any) {
      console.error("Error al crear lista:", error);
      toast({ title: "Error", description: error.message || "Error al crear la lista", variant: "destructive" });
    } finally {
      setCreandoLista(false);
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

      <Dialog open={showListaModal} onOpenChange={(open) => {
        if (!open && !creandoLista) {
          setShowListaModal(false);
          resetListaForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Lista MP3</DialogTitle>
            <DialogDescription>
              Crea una nueva lista con archivos de musica MP3
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lista-nombre">Titulo de la Lista *</Label>
              <Input
                id="lista-nombre"
                placeholder="Ej: Rock Clasico, Exitos 80s, Cumbia Mix"
                value={listaForm.nombre}
                onChange={(e) => setListaForm({ ...listaForm, nombre: e.target.value })}
                data-testid="input-lista-nombre"
                disabled={creandoLista}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Archivos MP3 *</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".mp3,audio/mpeg,audio/mp3"
                  multiple
                  onChange={handleSeleccionarArchivos}
                  className="hidden"
                  id="input-archivos-mp3"
                  data-testid="input-archivos-mp3"
                  disabled={creandoLista}
                />
                <label 
                  htmlFor="input-archivos-mp3" 
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Haz clic para seleccionar archivos MP3
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Puedes seleccionar uno o varios archivos a la vez
                  </span>
                </label>
              </div>
              
              {archivosSeleccionados.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{archivosSeleccionados.length} archivo(s) seleccionado(s)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setArchivosSeleccionados([])}
                      disabled={creandoLista}
                    >
                      Limpiar todo
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-lg p-2">
                    {archivosSeleccionados.map((archivo, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        data-testid={`archivo-seleccionado-${index}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileAudio className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm truncate">{archivo.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({formatFileSize(archivo.size)})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => handleQuitarArchivo(index)}
                          disabled={creandoLista}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowListaModal(false);
                resetListaForm();
              }}
              disabled={creandoLista}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitLista}
              disabled={!listaForm.nombre.trim() || archivosSeleccionados.length === 0 || creandoLista}
              data-testid="button-guardar-lista"
            >
              {creandoLista && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {creandoLista ? "Creando..." : "Crear Lista"}
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
