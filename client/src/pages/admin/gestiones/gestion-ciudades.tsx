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

export default function GestionCiudades() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Gestión de Países y Ciudades
        </h1>
        <p className="text-muted-foreground text-sm">
          Administra los países y ciudades disponibles en el sistema multi-ciudad
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
        </TabsList>
        <TabsContent value="paises" className="mt-4">
          <PaisesSection />
        </TabsContent>
        <TabsContent value="ciudades" className="mt-4">
          <CiudadesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
