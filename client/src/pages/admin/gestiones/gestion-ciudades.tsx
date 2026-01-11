import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  Image,
  Video,
  Upload,
  Calendar,
  Play,
  Pause,
  Ban,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Pais {
  id: string;
  nombre: string;
  codigoIso: string | null;
  bandera: string | null;
  activo: boolean | null;
  orden: number | null;
}

interface Ciudad {
  id: string;
  paisId: string;
  nombre: string;
  slug: string | null;
  departamento: string | null;
  region: string | null;
  latitud: number | null;
  longitud: number | null;
  zonaHoraria: string | null;
  activo: boolean | null;
  orden: number | null;
}

function PaisesSection() {
  const { toast } = useToast();
  const [showFormPais, setShowFormPais] = useState(false);
  const [paisEditando, setPaisEditando] = useState<Pais | null>(null);
  const [formPais, setFormPais] = useState({
    nombre: "",
    codigoIso: "",
    bandera: "",
    activo: true,
    orden: 0,
  });

  const { data: paises = [], isLoading } = useQuery<Pais[]>({
    queryKey: ["/api/paises"],
  });

  const crearPaisMutation = useMutation({
    mutationFn: (data: typeof formPais) => apiRequest("POST", "/api/admin/paises", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paises"] });
      resetForm();
      toast({ title: "País creado", description: "El país se ha creado correctamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const actualizarPaisMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<typeof formPais> }) =>
      apiRequest("PUT", `/api/admin/paises/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paises"] });
      resetForm();
      toast({ title: "País actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarPaisMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/paises/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paises"] });
      toast({ title: "País eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setShowFormPais(false);
    setPaisEditando(null);
    setFormPais({ nombre: "", codigoIso: "", bandera: "", activo: true, orden: 0 });
  };

  const handleEditar = (pais: Pais) => {
    setPaisEditando(pais);
    setFormPais({
      nombre: pais.nombre,
      codigoIso: pais.codigoIso || "",
      bandera: pais.bandera || "",
      activo: pais.activo ?? true,
      orden: pais.orden ?? 0,
    });
    setShowFormPais(true);
  };

  const handleGuardar = () => {
    if (!formPais.nombre.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (paisEditando) {
      actualizarPaisMutation.mutate({ id: paisEditando.id, updates: formPais });
    } else {
      crearPaisMutation.mutate(formPais);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Países Disponibles
        </h3>
        <Button onClick={() => setShowFormPais(true)} size="sm" data-testid="btn-nuevo-pais">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo País
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : paises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay países configurados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paises.map((pais) => (
            <Card key={pais.id} className={!pais.activo ? "opacity-50" : ""} data-testid={`card-pais-${pais.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{pais.bandera}</span>
                    <div>
                      <p className="font-medium">{pais.nombre}</p>
                      <p className="text-xs text-muted-foreground">{pais.codigoIso}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditar(pais)} data-testid={`btn-editar-pais-${pais.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => eliminarPaisMutation.mutate(pais.id)} data-testid={`btn-eliminar-pais-${pais.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={pais.activo ? "default" : "secondary"}>
                    {pais.activo ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Orden: {pais.orden}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showFormPais} onOpenChange={setShowFormPais}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{paisEditando ? "Editar País" : "Nuevo País"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formPais.nombre}
                onChange={(e) => setFormPais({ ...formPais, nombre: e.target.value })}
                placeholder="Ej: Perú"
                data-testid="input-pais-nombre"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoIso">Código ISO</Label>
                <Input
                  id="codigoIso"
                  value={formPais.codigoIso}
                  onChange={(e) => setFormPais({ ...formPais, codigoIso: e.target.value })}
                  placeholder="PE"
                  maxLength={3}
                  data-testid="input-pais-codigo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bandera">Bandera (emoji)</Label>
                <Input
                  id="bandera"
                  value={formPais.bandera}
                  onChange={(e) => setFormPais({ ...formPais, bandera: e.target.value })}
                  placeholder="🇵🇪"
                  data-testid="input-pais-bandera"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orden">Orden</Label>
                <Input
                  id="orden"
                  type="number"
                  value={formPais.orden}
                  onChange={(e) => setFormPais({ ...formPais, orden: parseInt(e.target.value) || 0 })}
                  data-testid="input-pais-orden"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="activo"
                  checked={formPais.activo}
                  onCheckedChange={(checked) => setFormPais({ ...formPais, activo: checked })}
                  data-testid="switch-pais-activo"
                />
                <Label htmlFor="activo">Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={crearPaisMutation.isPending || actualizarPaisMutation.isPending} data-testid="btn-guardar-pais">
              {(crearPaisMutation.isPending || actualizarPaisMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CiudadesSection() {
  const { toast } = useToast();
  const [paisSeleccionado, setPaisSeleccionado] = useState<string>("");
  const [showFormCiudad, setShowFormCiudad] = useState(false);
  const [ciudadEditando, setCiudadEditando] = useState<Ciudad | null>(null);
  const [formCiudad, setFormCiudad] = useState({
    paisId: "",
    nombre: "",
    slug: "",
    departamento: "",
    region: "",
    activo: true,
    orden: 0,
  });

  const { data: paises = [] } = useQuery<Pais[]>({
    queryKey: ["/api/paises"],
  });

  const { data: ciudades = [], isLoading } = useQuery<Ciudad[]>({
    queryKey: ["/api/ciudades", paisSeleccionado],
    queryFn: async () => {
      const url = paisSeleccionado ? `/api/ciudades?paisId=${paisSeleccionado}` : "/api/ciudades";
      const response = await fetch(url);
      return response.json();
    },
  });

  const crearCiudadMutation = useMutation({
    mutationFn: (data: typeof formCiudad) => apiRequest("POST", "/api/admin/ciudades", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ciudades"] });
      resetForm();
      toast({ title: "Ciudad creada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const actualizarCiudadMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<typeof formCiudad> }) =>
      apiRequest("PUT", `/api/admin/ciudades/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ciudades"] });
      resetForm();
      toast({ title: "Ciudad actualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarCiudadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/ciudades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ciudades"] });
      toast({ title: "Ciudad eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setShowFormCiudad(false);
    setCiudadEditando(null);
    setFormCiudad({ paisId: "", nombre: "", slug: "", departamento: "", region: "", activo: true, orden: 0 });
  };

  const handleEditar = (ciudad: Ciudad) => {
    setCiudadEditando(ciudad);
    setFormCiudad({
      paisId: ciudad.paisId,
      nombre: ciudad.nombre,
      slug: ciudad.slug || "",
      departamento: ciudad.departamento || "",
      region: ciudad.region || "",
      activo: ciudad.activo ?? true,
      orden: ciudad.orden ?? 0,
    });
    setShowFormCiudad(true);
  };

  const handleNuevaCiudad = () => {
    setFormCiudad({ ...formCiudad, paisId: paisSeleccionado });
    setShowFormCiudad(true);
  };

  const handleGuardar = () => {
    if (!formCiudad.nombre.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (!formCiudad.paisId) {
      toast({ title: "Error", description: "Debe seleccionar un país", variant: "destructive" });
      return;
    }
    if (ciudadEditando) {
      actualizarCiudadMutation.mutate({ id: ciudadEditando.id, updates: formCiudad });
    } else {
      crearCiudadMutation.mutate(formCiudad);
    }
  };

  const getPaisNombre = (paisId: string) => paises.find(p => p.id === paisId)?.nombre || paisId;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Ciudades
        </h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={paisSeleccionado} onValueChange={setPaisSeleccionado}>
            <SelectTrigger className="w-[200px]" data-testid="select-filtro-pais">
              <SelectValue placeholder="Todos los países" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los países</SelectItem>
              {paises.map((pais) => (
                <SelectItem key={pais.id} value={pais.id}>
                  {pais.bandera} {pais.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleNuevaCiudad} size="sm" data-testid="btn-nueva-ciudad">
            <Plus className="h-4 w-4 mr-1" />
            Nueva Ciudad
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : ciudades.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay ciudades configuradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ciudades.map((ciudad) => (
            <Card key={ciudad.id} className={!ciudad.activo ? "opacity-50" : ""} data-testid={`card-ciudad-${ciudad.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ciudad.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPaisNombre(ciudad.paisId)} • {ciudad.departamento || ciudad.region || ciudad.slug}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditar(ciudad)} data-testid={`btn-editar-ciudad-${ciudad.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => eliminarCiudadMutation.mutate(ciudad.id)} data-testid={`btn-eliminar-ciudad-${ciudad.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={ciudad.activo ? "default" : "secondary"}>
                    {ciudad.activo ? "Activa" : "Inactiva"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Orden: {ciudad.orden}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showFormCiudad} onOpenChange={setShowFormCiudad}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ciudadEditando ? "Editar Ciudad" : "Nueva Ciudad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paisId">País</Label>
              <Select value={formCiudad.paisId} onValueChange={(value) => setFormCiudad({ ...formCiudad, paisId: value })}>
                <SelectTrigger data-testid="select-ciudad-pais">
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  {paises.map((pais) => (
                    <SelectItem key={pais.id} value={pais.id}>
                      {pais.bandera} {pais.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreCiudad">Nombre</Label>
              <Input
                id="nombreCiudad"
                value={formCiudad.nombre}
                onChange={(e) => setFormCiudad({ ...formCiudad, nombre: e.target.value })}
                placeholder="Ej: Tacna"
                data-testid="input-ciudad-nombre"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formCiudad.slug}
                  onChange={(e) => setFormCiudad({ ...formCiudad, slug: e.target.value })}
                  placeholder="tacna"
                  data-testid="input-ciudad-slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordenCiudad">Orden</Label>
                <Input
                  id="ordenCiudad"
                  type="number"
                  value={formCiudad.orden}
                  onChange={(e) => setFormCiudad({ ...formCiudad, orden: parseInt(e.target.value) || 0 })}
                  data-testid="input-ciudad-orden"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Input
                  id="departamento"
                  value={formCiudad.departamento}
                  onChange={(e) => setFormCiudad({ ...formCiudad, departamento: e.target.value })}
                  placeholder="Tacna"
                  data-testid="input-ciudad-departamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regionCiudad">Región</Label>
                <Input
                  id="regionCiudad"
                  value={formCiudad.region}
                  onChange={(e) => setFormCiudad({ ...formCiudad, region: e.target.value })}
                  placeholder="Tacna"
                  data-testid="input-ciudad-region"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="activoCiudad"
                checked={formCiudad.activo}
                onCheckedChange={(checked) => setFormCiudad({ ...formCiudad, activo: checked })}
                data-testid="switch-ciudad-activo"
              />
              <Label htmlFor="activoCiudad">Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={crearCiudadMutation.isPending || actualizarCiudadMutation.isPending} data-testid="btn-guardar-ciudad">
              {(crearCiudadMutation.isPending || actualizarCiudadMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MediaCiudad {
  id: string;
  ciudadId: string;
  tipo: "imagen" | "video";
  url: string;
  titulo: string | null;
  descripcion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: "activo" | "pausado" | "suspendido";
  orden: number | null;
  creadoEn: string | null;
}

function MediaCiudadesSection() {
  const { toast } = useToast();
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>("");
  const [showFormMedia, setShowFormMedia] = useState(false);
  const [mediaEditando, setMediaEditando] = useState<MediaCiudad | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [formMedia, setFormMedia] = useState({
    tipo: "imagen" as "imagen" | "video",
    url: "",
    titulo: "",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "activo" as "activo" | "pausado" | "suspendido",
    orden: 0,
  });

  const { data: paises = [] } = useQuery<Pais[]>({
    queryKey: ["/api/paises"],
  });

  const { data: ciudades = [] } = useQuery<Ciudad[]>({
    queryKey: ["/api/ciudades"],
  });

  const { data: mediaList = [], isLoading: loadingMedia } = useQuery<MediaCiudad[]>({
    queryKey: ["/api/admin/media-ciudades", ciudadSeleccionada],
    enabled: !!ciudadSeleccionada,
    queryFn: async () => {
      const response = await fetch(`/api/admin/media-ciudades/${ciudadSeleccionada}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al cargar media");
      return response.json();
    },
  });

  const crearMediaMutation = useMutation({
    mutationFn: (data: typeof formMedia & { ciudadId: string }) =>
      apiRequest("POST", "/api/admin/media-ciudades", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media-ciudades", ciudadSeleccionada] });
      resetForm();
      toast({ title: "Media creado", description: "El media se ha agregado correctamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const actualizarMediaMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<typeof formMedia> }) =>
      apiRequest("PUT", `/api/admin/media-ciudades/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media-ciudades", ciudadSeleccionada] });
      resetForm();
      toast({ title: "Media actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarMediaMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/media-ciudades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media-ciudades", ciudadSeleccionada] });
      toast({ title: "Media eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setShowFormMedia(false);
    setMediaEditando(null);
    setFormMedia({
      tipo: "imagen",
      url: "",
      titulo: "",
      descripcion: "",
      fechaInicio: "",
      fechaFin: "",
      estado: "activo",
      orden: 0,
    });
  };

  const handleEditar = (media: MediaCiudad) => {
    setMediaEditando(media);
    setFormMedia({
      tipo: media.tipo,
      url: media.url,
      titulo: media.titulo || "",
      descripcion: media.descripcion || "",
      fechaInicio: media.fechaInicio ? media.fechaInicio.split("T")[0] : "",
      fechaFin: media.fechaFin ? media.fechaFin.split("T")[0] : "",
      estado: media.estado,
      orden: media.orden ?? 0,
    });
    setShowFormMedia(true);
  };

  const handleGuardar = () => {
    if (!formMedia.url.trim()) {
      toast({ title: "Error", description: "Debe subir un archivo", variant: "destructive" });
      return;
    }
    if (mediaEditando) {
      actualizarMediaMutation.mutate({ id: mediaEditando.id, updates: formMedia });
    } else {
      crearMediaMutation.mutate({ ...formMedia, ciudadId: ciudadSeleccionada });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("archivo", file);

    setSubiendo(true);
    try {
      const response = await fetch("/api/upload/media-ciudades", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al subir archivo");
      }

      const result = await response.json();
      setFormMedia({
        ...formMedia,
        url: result.url,
        tipo: result.tipo as "imagen" | "video",
      });
      toast({ title: "Archivo subido correctamente" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubiendo(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500"><Play className="h-3 w-3 mr-1" /> Activo</Badge>;
      case "pausado":
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" /> Pausado</Badge>;
      case "suspendido":
        return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Suspendido</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const ciudadActual = ciudades.find(c => c.id === ciudadSeleccionada);
  const paisCiudad = ciudadActual ? paises.find(p => p.id === ciudadActual.paisId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Media por Ciudad
        </h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={ciudadSeleccionada} onValueChange={setCiudadSeleccionada}>
            <SelectTrigger className="w-full sm:w-[280px]" data-testid="select-ciudad-media">
              <SelectValue placeholder="Seleccionar ciudad..." />
            </SelectTrigger>
            <SelectContent>
              {ciudades.map((ciudad) => {
                const pais = paises.find(p => p.id === ciudad.paisId);
                return (
                  <SelectItem key={ciudad.id} value={ciudad.id}>
                    {pais?.bandera} {ciudad.nombre}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {ciudadSeleccionada && (
            <Button onClick={() => setShowFormMedia(true)} size="sm" data-testid="btn-nuevo-media">
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>
      </div>

      {!ciudadSeleccionada ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona una ciudad para ver y gestionar su media</p>
          </CardContent>
        </Card>
      ) : loadingMedia ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : mediaList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay media para {paisCiudad?.bandera} {ciudadActual?.nombre}</p>
            <Button onClick={() => setShowFormMedia(true)} className="mt-4" variant="outline" data-testid="btn-agregar-primer-media">
              <Plus className="h-4 w-4 mr-1" />
              Agregar primer media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mediaList.map((media) => (
            <Card key={media.id} className={media.estado !== "activo" ? "opacity-70" : ""} data-testid={`card-media-${media.id}`}>
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                {media.tipo === "imagen" ? (
                  <img src={media.url} alt={media.titulo || "Media"} className="w-full h-full object-cover" />
                ) : (
                  <video src={media.url} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80">
                    {media.tipo === "imagen" ? <Image className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                    {media.tipo}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{media.titulo || "Sin título"}</p>
                  {getEstadoBadge(media.estado)}
                </div>
                {(media.fechaInicio || media.fechaFin) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {media.fechaInicio ? new Date(media.fechaInicio).toLocaleDateString() : "∞"} - {media.fechaFin ? new Date(media.fechaFin).toLocaleDateString() : "∞"}
                  </p>
                )}
                <div className="flex gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditar(media)} data-testid={`btn-editar-media-${media.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => eliminarMediaMutation.mutate(media.id)} data-testid={`btn-eliminar-media-${media.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showFormMedia} onOpenChange={setShowFormMedia}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mediaEditando ? "Editar Media" : "Nuevo Media"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pb-2">
            <div className="space-y-2">
              <Label>Archivo (imagen o video)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={subiendo}
                  data-testid="input-media-archivo"
                />
                {subiendo && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formMedia.url && (
                <div className="mt-2 relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {formMedia.tipo === "imagen" ? (
                    <img src={formMedia.url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={formMedia.url} className="w-full h-full object-cover" controls />
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tituloMedia">Título (opcional)</Label>
              <Input
                id="tituloMedia"
                value={formMedia.titulo}
                onChange={(e) => setFormMedia({ ...formMedia, titulo: e.target.value })}
                placeholder="Ej: Bienvenida Tacna"
                data-testid="input-media-titulo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicioMedia">Fecha Inicio</Label>
                <Input
                  id="fechaInicioMedia"
                  type="date"
                  value={formMedia.fechaInicio}
                  onChange={(e) => setFormMedia({ ...formMedia, fechaInicio: e.target.value })}
                  data-testid="input-media-fecha-inicio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinMedia">Fecha Fin</Label>
                <Input
                  id="fechaFinMedia"
                  type="date"
                  value={formMedia.fechaFin}
                  onChange={(e) => setFormMedia({ ...formMedia, fechaFin: e.target.value })}
                  data-testid="input-media-fecha-fin"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estadoMedia">Estado</Label>
                <Select value={formMedia.estado} onValueChange={(value: "activo" | "pausado" | "suspendido") => setFormMedia({ ...formMedia, estado: value })}>
                  <SelectTrigger data-testid="select-media-estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordenMedia">Orden</Label>
                <Input
                  id="ordenMedia"
                  type="number"
                  value={formMedia.orden}
                  onChange={(e) => setFormMedia({ ...formMedia, orden: parseInt(e.target.value) || 0 })}
                  data-testid="input-media-orden"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={crearMediaMutation.isPending || actualizarMediaMutation.isPending || !formMedia.url} data-testid="btn-guardar-media">
              {(crearMediaMutation.isPending || actualizarMediaMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GestionCiudades() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Gestión de Países, Ciudades y Media
        </h1>
        <p className="text-muted-foreground text-sm">
          Administra los países, ciudades y contenido multimedia del sistema multi-ciudad
        </p>
      </div>

      <Tabs defaultValue="paises" className="w-full">
        <TabsList>
          <TabsTrigger value="paises" data-testid="tab-paises">
            <Globe className="h-4 w-4 mr-1" />
            Países
          </TabsTrigger>
          <TabsTrigger value="ciudades" data-testid="tab-ciudades">
            <MapPin className="h-4 w-4 mr-1" />
            Ciudades
          </TabsTrigger>
          <TabsTrigger value="media" data-testid="tab-media">
            <Image className="h-4 w-4 mr-1" />
            Media
          </TabsTrigger>
        </TabsList>
        <TabsContent value="paises" className="mt-4">
          <PaisesSection />
        </TabsContent>
        <TabsContent value="ciudades" className="mt-4">
          <CiudadesSection />
        </TabsContent>
        <TabsContent value="media" className="mt-4">
          <MediaCiudadesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
