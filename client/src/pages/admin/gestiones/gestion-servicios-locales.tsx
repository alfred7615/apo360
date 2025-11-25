import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Store, Grid3X3, Package, Search, Plus, Edit, Trash2, Eye, 
  Phone, MapPin, Heart, Star, Share2, MessageCircle, Settings,
  DollarSign, Percent, CheckCircle, XCircle, MoreHorizontal
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CategoriaServicio, LogoServicio, ProductoServicio } from "@shared/schema";

export default function GestionServiciosLocalesScreen() {
  const [activeTab, setActiveTab] = useState("categorias");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showProductosListModal, setShowProductosListModal] = useState(false);
  const [showConfigCobrosModal, setShowConfigCobrosModal] = useState(false);

  const [editingCategoria, setEditingCategoria] = useState<CategoriaServicio | null>(null);
  const [editingLogo, setEditingLogo] = useState<LogoServicio | null>(null);
  const [editingProducto, setEditingProducto] = useState<ProductoServicio | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

  const [formCategoria, setFormCategoria] = useState({
    nombre: "", descripcion: "", imagenUrl: "", icono: "", orden: 0, estado: "activo"
  });

  const [formLogo, setFormLogo] = useState({
    categoriaId: "", nombre: "", descripcion: "", logoUrl: "", direccion: "",
    telefono: "", whatsapp: "", email: "", horario: "", estado: "activo",
    gpsLatitud: 0, gpsLongitud: 0
  });

  const [formProducto, setFormProducto] = useState({
    logoServicioId: "", codigo: "", nombre: "", descripcion: "", precio: "",
    precioOferta: "", imagenUrl: "", categoria: "", stock: 0, disponible: true, orden: 0
  });

  const [formConfigCobros, setFormConfigCobros] = useState({
    tipoValor: "monto", valor: "0", activo: true
  });

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery<CategoriaServicio[]>({
    queryKey: ["/api/categorias-servicio"],
  });

  const { data: logos = [], isLoading: loadingLogos } = useQuery<LogoServicio[]>({
    queryKey: ["/api/logos-servicio"],
  });

  const { data: productosDelLogo = [], isLoading: loadingProductos } = useQuery<ProductoServicio[]>({
    queryKey: ["/api/logos-servicio", selectedLogoId, "productos"],
    enabled: !!selectedLogoId,
  });

  const { data: configCobros } = useQuery({
    queryKey: ["/api/configuracion-cobros"],
  });

  const createCategoriaMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/categorias-servicio", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-servicio"] });
      toast({ title: "Categoría creada exitosamente" });
      setShowCategoriaModal(false);
      resetFormCategoria();
    },
    onError: (error: any) => {
      toast({ title: "Error al crear categoría", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/categorias-servicio/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-servicio"] });
      toast({ title: "Categoría actualizada" });
      setShowCategoriaModal(false);
      setEditingCategoria(null);
      resetFormCategoria();
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar categoría", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categorias-servicio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-servicio"] });
      toast({ title: "Categoría eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar categoría", description: error.message, variant: "destructive" });
    },
  });

  const createLogoMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/logos-servicio", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio"] });
      toast({ title: "Logo de servicio creado" });
      setShowLogoModal(false);
      resetFormLogo();
    },
    onError: (error: any) => {
      toast({ title: "Error al crear logo", description: error.message, variant: "destructive" });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/logos-servicio/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio"] });
      toast({ title: "Logo actualizado" });
      setShowLogoModal(false);
      setEditingLogo(null);
      resetFormLogo();
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar logo", description: error.message, variant: "destructive" });
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/logos-servicio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio"] });
      toast({ title: "Logo eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar logo", description: error.message, variant: "destructive" });
    },
  });

  const createProductoMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/productos-servicio", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio", selectedLogoId, "productos"] });
      toast({ title: "Producto creado", description: response.mensaje });
      setShowProductoModal(false);
      resetFormProducto();
    },
    onError: (error: any) => {
      toast({ title: "Error al crear producto", description: error.message, variant: "destructive" });
    },
  });

  const updateProductoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/productos-servicio/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio", selectedLogoId, "productos"] });
      toast({ title: "Producto actualizado" });
      setShowProductoModal(false);
      setEditingProducto(null);
      resetFormProducto();
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar producto", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/productos-servicio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio", selectedLogoId, "productos"] });
      toast({ title: "Producto eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar producto", description: error.message, variant: "destructive" });
    },
  });

  const updateConfigCobrosMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/configuracion-cobros", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuracion-cobros"] });
      toast({ title: "Configuración de cobros actualizada" });
      setShowConfigCobrosModal(false);
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar configuración", description: error.message, variant: "destructive" });
    },
  });

  const resetFormCategoria = () => {
    setFormCategoria({ nombre: "", descripcion: "", imagenUrl: "", icono: "", orden: 0, estado: "activo" });
  };

  const resetFormLogo = () => {
    setFormLogo({
      categoriaId: "", nombre: "", descripcion: "", logoUrl: "", direccion: "",
      telefono: "", whatsapp: "", email: "", horario: "", estado: "activo",
      gpsLatitud: 0, gpsLongitud: 0
    });
  };

  const resetFormProducto = () => {
    setFormProducto({
      logoServicioId: selectedLogoId || "", codigo: "", nombre: "", descripcion: "", precio: "",
      precioOferta: "", imagenUrl: "", categoria: "", stock: 0, disponible: true, orden: 0
    });
  };

  const handleEditCategoria = (cat: CategoriaServicio) => {
    setEditingCategoria(cat);
    setFormCategoria({
      nombre: cat.nombre,
      descripcion: cat.descripcion || "",
      imagenUrl: cat.imagenUrl || "",
      icono: cat.icono || "",
      orden: cat.orden || 0,
      estado: cat.estado || "activo"
    });
    setShowCategoriaModal(true);
  };

  const handleEditLogo = (logo: LogoServicio) => {
    setEditingLogo(logo);
    setFormLogo({
      categoriaId: logo.categoriaId || "",
      nombre: logo.nombre,
      descripcion: logo.descripcion || "",
      logoUrl: logo.logoUrl || "",
      direccion: logo.direccion || "",
      telefono: logo.telefono || "",
      whatsapp: logo.whatsapp || "",
      email: logo.email || "",
      horario: logo.horario || "",
      estado: logo.estado || "activo",
      gpsLatitud: logo.gpsLatitud || 0,
      gpsLongitud: logo.gpsLongitud || 0
    });
    setShowLogoModal(true);
  };

  const handleEditProducto = (producto: ProductoServicio) => {
    setEditingProducto(producto);
    setFormProducto({
      logoServicioId: producto.logoServicioId,
      codigo: producto.codigo || "",
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      precio: producto.precio || "",
      precioOferta: producto.precioOferta || "",
      imagenUrl: producto.imagenUrl || "",
      categoria: producto.categoria || "",
      stock: producto.stock || 0,
      disponible: producto.disponible ?? true,
      orden: producto.orden || 0
    });
    setShowProductoModal(true);
  };

  const handleViewProductos = (logoId: string) => {
    setSelectedLogoId(logoId);
    setShowProductosListModal(true);
  };

  const handleSaveCategoria = () => {
    if (editingCategoria) {
      updateCategoriaMutation.mutate({ id: editingCategoria.id, data: formCategoria });
    } else {
      createCategoriaMutation.mutate(formCategoria);
    }
  };

  const handleSaveLogo = () => {
    if (editingLogo) {
      updateLogoMutation.mutate({ id: editingLogo.id, data: formLogo });
    } else {
      createLogoMutation.mutate(formLogo);
    }
  };

  const handleSaveProducto = () => {
    const data = { ...formProducto, logoServicioId: selectedLogoId };
    if (editingProducto) {
      updateProductoMutation.mutate({ id: editingProducto.id, data });
    } else {
      createProductoMutation.mutate(data);
    }
  };

  const filteredCategorias = categorias.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogos = logos.filter(l =>
    l.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="screen-gestion-servicios-locales">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gestión de Servicios Locales</h2>
            <p className="text-muted-foreground">Administra categorías, negocios y sus productos</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowConfigCobrosModal(true)} data-testid="button-config-cobros">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Cobros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold" data-testid="stat-categorias">{categorias.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logos/Negocios</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold" data-testid="stat-logos">{logos.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {logos.filter(l => l.estado === "activo").length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {logos.filter(l => l.estado === "suspendido").length}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="categorias" data-testid="tab-categorias">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Categorías ({categorias.length})
          </TabsTrigger>
          <TabsTrigger value="logos" data-testid="tab-logos">
            <Store className="h-4 w-4 mr-2" />
            Logos/Negocios ({logos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Categorías de Servicios</CardTitle>
                <CardDescription>Agrupa los servicios locales en categorías</CardDescription>
              </div>
              <Button onClick={() => { resetFormCategoria(); setEditingCategoria(null); setShowCategoriaModal(true); }} data-testid="button-nueva-categoria">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCategorias ? (
                <div className="text-center py-8 text-muted-foreground">Cargando categorías...</div>
              ) : filteredCategorias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay categorías. Agrega una nueva categoría para comenzar.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredCategorias.map((cat) => (
                    <Card key={cat.id} className="hover-elevate cursor-pointer group" data-testid={`card-categoria-${cat.id}`}>
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={cat.imagenUrl || ""} alt={cat.nombre} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {cat.nombre.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-medium text-sm">{cat.nombre}</h3>
                        <Badge variant={cat.estado === "activo" ? "default" : "secondary"} className="mt-1">
                          {cat.estado}
                        </Badge>
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleEditCategoria(cat)} data-testid={`button-edit-categoria-${cat.id}`}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteCategoriaMutation.mutate(cat.id)} data-testid={`button-delete-categoria-${cat.id}`}>
                            <Trash2 className="h-3 w-3 text-destructive" />
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

        <TabsContent value="logos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Logos de Servicios</CardTitle>
                <CardDescription>Negocios y locales con sus productos</CardDescription>
              </div>
              <Button onClick={() => { resetFormLogo(); setEditingLogo(null); setShowLogoModal(true); }} data-testid="button-nuevo-logo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Logo
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLogos ? (
                <div className="text-center py-8 text-muted-foreground">Cargando logos...</div>
              ) : filteredLogos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay logos de servicios. Agrega uno nuevo para comenzar.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredLogos.map((logo) => (
                    <Card key={logo.id} className="hover-elevate cursor-pointer group" data-testid={`card-logo-${logo.id}`}>
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <div 
                          className="relative cursor-pointer" 
                          onClick={() => handleViewProductos(logo.id)}
                        >
                          <Avatar className="h-20 w-20 mb-2 ring-2 ring-primary/20">
                            <AvatarImage src={logo.logoUrl || ""} alt={logo.nombre} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xl">
                              {logo.nombre.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {logo.verificado && (
                            <CheckCircle className="absolute bottom-0 right-0 h-5 w-5 text-green-500 bg-white rounded-full" />
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate w-full">{logo.nombre}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Heart className="h-3 w-3" /> {logo.totalLikes || 0}
                          <Star className="h-3 w-3 ml-2" /> {logo.totalFavoritos || 0}
                        </div>
                        <Badge 
                          variant={logo.estado === "activo" ? "default" : logo.estado === "suspendido" ? "destructive" : "secondary"} 
                          className="mt-1"
                        >
                          {logo.estado}
                        </Badge>
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleViewProductos(logo.id)} data-testid={`button-view-productos-${logo.id}`}>
                            <Package className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditLogo(logo)} data-testid={`button-edit-logo-${logo.id}`}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteLogoMutation.mutate(logo.id)} data-testid={`button-delete-logo-${logo.id}`}>
                            <Trash2 className="h-3 w-3 text-destructive" />
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

      <Dialog open={showCategoriaModal} onOpenChange={setShowCategoriaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategoria ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            <DialogDescription>Configura los datos de la categoría</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formCategoria.nombre}
                onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                placeholder="Nombre de la categoría"
                data-testid="input-categoria-nombre"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formCategoria.descripcion}
                onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
                placeholder="Descripción de la categoría"
                data-testid="input-categoria-descripcion"
              />
            </div>
            <div>
              <Label>URL de Imagen (circular)</Label>
              <Input
                value={formCategoria.imagenUrl}
                onChange={(e) => setFormCategoria({ ...formCategoria, imagenUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-categoria-imagen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icono</Label>
                <Input
                  value={formCategoria.icono}
                  onChange={(e) => setFormCategoria({ ...formCategoria, icono: e.target.value })}
                  placeholder="store, shop, etc"
                  data-testid="input-categoria-icono"
                />
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={formCategoria.orden}
                  onChange={(e) => setFormCategoria({ ...formCategoria, orden: parseInt(e.target.value) || 0 })}
                  data-testid="input-categoria-orden"
                />
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formCategoria.estado} onValueChange={(v) => setFormCategoria({ ...formCategoria, estado: v })}>
                <SelectTrigger data-testid="select-categoria-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoriaModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategoria} disabled={createCategoriaMutation.isPending || updateCategoriaMutation.isPending} data-testid="button-guardar-categoria">
              {editingCategoria ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogoModal} onOpenChange={setShowLogoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLogo ? "Editar Logo de Servicio" : "Nuevo Logo de Servicio"}</DialogTitle>
            <DialogDescription>Configura los datos del negocio/local</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Categoría</Label>
              <Select value={formLogo.categoriaId} onValueChange={(v) => setFormLogo({ ...formLogo, categoriaId: v })}>
                <SelectTrigger data-testid="select-logo-categoria">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre del Negocio</Label>
              <Input
                value={formLogo.nombre}
                onChange={(e) => setFormLogo({ ...formLogo, nombre: e.target.value })}
                placeholder="Nombre del negocio"
                data-testid="input-logo-nombre"
              />
            </div>
            <div className="col-span-2">
              <Label>Descripción</Label>
              <Textarea
                value={formLogo.descripcion}
                onChange={(e) => setFormLogo({ ...formLogo, descripcion: e.target.value })}
                placeholder="Descripción del negocio"
                data-testid="input-logo-descripcion"
              />
            </div>
            <div>
              <Label>URL del Logo</Label>
              <Input
                value={formLogo.logoUrl}
                onChange={(e) => setFormLogo({ ...formLogo, logoUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-logo-url"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formLogo.telefono}
                onChange={(e) => setFormLogo({ ...formLogo, telefono: e.target.value })}
                placeholder="+51 999 999 999"
                data-testid="input-logo-telefono"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formLogo.whatsapp}
                onChange={(e) => setFormLogo({ ...formLogo, whatsapp: e.target.value })}
                placeholder="+51 999 999 999"
                data-testid="input-logo-whatsapp"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={formLogo.email}
                onChange={(e) => setFormLogo({ ...formLogo, email: e.target.value })}
                placeholder="email@ejemplo.com"
                data-testid="input-logo-email"
              />
            </div>
            <div className="col-span-2">
              <Label>Dirección</Label>
              <Input
                value={formLogo.direccion}
                onChange={(e) => setFormLogo({ ...formLogo, direccion: e.target.value })}
                placeholder="Dirección del local"
                data-testid="input-logo-direccion"
              />
            </div>
            <div>
              <Label>Horario</Label>
              <Input
                value={formLogo.horario}
                onChange={(e) => setFormLogo({ ...formLogo, horario: e.target.value })}
                placeholder="Lun-Vie 9am-6pm"
                data-testid="input-logo-horario"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formLogo.estado} onValueChange={(v) => setFormLogo({ ...formLogo, estado: v })}>
                <SelectTrigger data-testid="select-logo-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveLogo} disabled={createLogoMutation.isPending || updateLogoMutation.isPending} data-testid="button-guardar-logo">
              {editingLogo ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductosListModal} onOpenChange={setShowProductosListModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>Productos del Servicio</span>
              <Button size="sm" onClick={() => { resetFormProducto(); setEditingProducto(null); setShowProductoModal(true); }} data-testid="button-nuevo-producto">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </DialogTitle>
            <DialogDescription>Administra los productos de este local</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh]">
            {loadingProductos ? (
              <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>
            ) : productosDelLogo.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos. Agrega uno nuevo para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {productosDelLogo.map((producto) => (
                  <Card key={producto.id} className="hover-elevate" data-testid={`card-producto-${producto.id}`}>
                    <CardContent className="p-3">
                      {producto.imagenUrl && (
                        <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-24 object-cover rounded mb-2" />
                      )}
                      <h4 className="font-medium text-sm truncate">{producto.nombre}</h4>
                      {producto.codigo && <p className="text-xs text-muted-foreground">Código: {producto.codigo}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">S/. {producto.precio || "0.00"}</span>
                        <Badge variant={producto.disponible ? "default" : "secondary"}>
                          {producto.disponible ? "Disponible" : "Agotado"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Heart className="h-3 w-3" /> {producto.totalLikes || 0}
                        <Star className="h-3 w-3 ml-2" /> {producto.totalFavoritos || 0}
                      </div>
                      <div className="flex gap-1 mt-2 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => handleEditProducto(producto)} data-testid={`button-edit-producto-${producto.id}`}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteProductoMutation.mutate(producto.id)} data-testid={`button-delete-producto-${producto.id}`}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductoModal} onOpenChange={setShowProductoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProducto ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>Configura los datos del producto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input
                  value={formProducto.codigo}
                  onChange={(e) => setFormProducto({ ...formProducto, codigo: e.target.value })}
                  placeholder="SKU-001"
                  data-testid="input-producto-codigo"
                />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formProducto.nombre}
                  onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })}
                  placeholder="Nombre del producto"
                  data-testid="input-producto-nombre"
                />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formProducto.descripcion}
                onChange={(e) => setFormProducto({ ...formProducto, descripcion: e.target.value })}
                placeholder="Descripción del producto"
                data-testid="input-producto-descripcion"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formProducto.precio}
                  onChange={(e) => setFormProducto({ ...formProducto, precio: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-producto-precio"
                />
              </div>
              <div>
                <Label>Precio Oferta (S/.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formProducto.precioOferta}
                  onChange={(e) => setFormProducto({ ...formProducto, precioOferta: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-producto-precio-oferta"
                />
              </div>
            </div>
            <div>
              <Label>URL de Imagen</Label>
              <Input
                value={formProducto.imagenUrl}
                onChange={(e) => setFormProducto({ ...formProducto, imagenUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-producto-imagen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Input
                  value={formProducto.categoria}
                  onChange={(e) => setFormProducto({ ...formProducto, categoria: e.target.value })}
                  placeholder="Categoría del producto"
                  data-testid="input-producto-categoria"
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formProducto.stock}
                  onChange={(e) => setFormProducto({ ...formProducto, stock: parseInt(e.target.value) || 0 })}
                  data-testid="input-producto-stock"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formProducto.disponible}
                onCheckedChange={(checked) => setFormProducto({ ...formProducto, disponible: checked })}
                data-testid="switch-producto-disponible"
              />
              <Label>Disponible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductoModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveProducto} disabled={createProductoMutation.isPending || updateProductoMutation.isPending} data-testid="button-guardar-producto">
              {editingProducto ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfigCobrosModal} onOpenChange={setShowConfigCobrosModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Cobros</DialogTitle>
            <DialogDescription>Define el monto o porcentaje a cobrar al agregar productos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Cobro</Label>
              <Select 
                value={formConfigCobros.tipoValor} 
                onValueChange={(v) => setFormConfigCobros({ ...formConfigCobros, tipoValor: v })}
              >
                <SelectTrigger data-testid="select-tipo-cobro">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monto">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monto Fijo (Soles)
                    </div>
                  </SelectItem>
                  <SelectItem value="porcentaje">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Porcentaje del precio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {formConfigCobros.tipoValor === "monto" ? "Monto en Soles (S/.)" : "Porcentaje (%)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formConfigCobros.valor}
                onChange={(e) => setFormConfigCobros({ ...formConfigCobros, valor: e.target.value })}
                placeholder={formConfigCobros.tipoValor === "monto" ? "5.00" : "10"}
                data-testid="input-cobro-valor"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formConfigCobros.activo}
                onCheckedChange={(checked) => setFormConfigCobros({ ...formConfigCobros, activo: checked })}
                data-testid="switch-cobro-activo"
              />
              <Label>Cobros Activos</Label>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">Vista Previa:</p>
              <p className="text-muted-foreground">
                {formConfigCobros.activo ? (
                  formConfigCobros.tipoValor === "monto" 
                    ? `Se cobrará S/. ${formConfigCobros.valor || "0.00"} por cada producto agregado`
                    : `Se cobrará ${formConfigCobros.valor || "0"}% del precio del producto`
                ) : (
                  "Los cobros están desactivados - no se cobrará nada"
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigCobrosModal(false)}>Cancelar</Button>
            <Button onClick={() => updateConfigCobrosMutation.mutate(formConfigCobros)} disabled={updateConfigCobrosMutation.isPending} data-testid="button-guardar-cobros">
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
