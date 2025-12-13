import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageUpload } from "@/components/ImageUpload";
import { MapPicker } from "@/components/MapPicker";
import { 
  Store, Package, Plus, Edit, Trash2, Save, MapPin, Phone, Globe, 
  Instagram, Facebook, Image as ImageIcon, Loader2, UtensilsCrossed,
  CheckCircle, XCircle, Users, Megaphone, ShoppingCart, Truck, Map,
  History, Navigation, Heart, Share2, ExternalLink, Clock, DollarSign,
  Package2, ClipboardList, MapPinned, Wallet
} from "lucide-react";

interface DatosNegocio {
  id: string;
  usuarioId: string;
  nombreNegocio: string;
  descripcion?: string;
  logoUrl?: string;
  bannerUrl?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  horarioAtencion?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  paginaWeb?: string;
  tipoNegocio?: string;
  activo?: boolean;
  verificado?: boolean;
}

interface ItemCatalogo {
  id: string;
  negocioId: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  precio?: string;
  precioOferta?: string;
  imagenUrl?: string;
  categoria?: string;
  disponible?: boolean;
  destacado?: boolean;
  tipoItem?: string;
  ingredientes?: string;
  tiempoPreparacion?: string;
}

interface LogoServicio {
  id: string;
  nombre: string;
  logoUrl?: string;
  descripcion?: string;
}

export default function LocalComercialPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("negocio");
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCatalogo | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [showNegocioPopup, setShowNegocioPopup] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const [negocioForm, setNegocioForm] = useState<Partial<DatosNegocio>>({
    nombreNegocio: "",
    descripcion: "",
    direccion: "",
    telefono: "",
    whatsapp: "",
    email: "",
    horarioAtencion: "",
    facebook: "",
    instagram: "",
    paginaWeb: "",
    tipoNegocio: "tienda",
    logoUrl: "",
    latitud: undefined,
    longitud: undefined,
  });

  const [itemForm, setItemForm] = useState<Partial<ItemCatalogo>>({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    tipoItem: "producto",
  });

  const { data: miNegocio, isLoading: loadingNegocio } = useQuery<DatosNegocio | null>({
    queryKey: ["/api/mi-negocio"],
  });

  const { data: miCatalogo = [], isLoading: loadingCatalogo } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/mi-catalogo"],
  });

  const { data: logosServicios = [] } = useQuery<LogoServicio[]>({
    queryKey: ["/api/logos-servicios"],
  });

  useEffect(() => {
    if (miNegocio && !formInitialized) {
      setNegocioForm({
        nombreNegocio: miNegocio.nombreNegocio || "",
        descripcion: miNegocio.descripcion || "",
        direccion: miNegocio.direccion || "",
        telefono: miNegocio.telefono || "",
        whatsapp: miNegocio.whatsapp || "",
        email: miNegocio.email || "",
        horarioAtencion: miNegocio.horarioAtencion || "",
        facebook: miNegocio.facebook || "",
        instagram: miNegocio.instagram || "",
        paginaWeb: miNegocio.paginaWeb || "",
        tipoNegocio: miNegocio.tipoNegocio || "tienda",
        logoUrl: miNegocio.logoUrl || "",
        latitud: miNegocio.latitud,
        longitud: miNegocio.longitud,
      });
      setFormInitialized(true);
    }
  }, [miNegocio, formInitialized]);

  const guardarNegocioMutation = useMutation({
    mutationFn: (data: Partial<DatosNegocio>) => apiRequest("POST", "/api/mi-negocio", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio"] });
      toast({ title: "Datos guardados correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    },
  });

  const guardarItemMutation = useMutation({
    mutationFn: (data: Partial<ItemCatalogo>) => {
      if (editingItem) {
        return apiRequest("PATCH", `/api/mi-catalogo/${editingItem.id}`, data);
      }
      return apiRequest("POST", "/api/mi-catalogo", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo"] });
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({ nombre: "", descripcion: "", precio: "", categoria: "", tipoItem: "producto" });
      toast({ title: editingItem ? "Item actualizado" : "Item agregado al catálogo" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mi-catalogo/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo"] });
      toast({ title: "Item eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleGuardarNegocio = () => {
    if (!negocioForm.nombreNegocio?.trim()) {
      toast({ title: "El nombre del negocio es requerido", variant: "destructive" });
      return;
    }
    guardarNegocioMutation.mutate(negocioForm);
  };

  const handleAgregarItem = () => {
    setEditingItem(null);
    setItemForm({ nombre: "", descripcion: "", precio: "", categoria: "", tipoItem: "producto" });
    setShowItemModal(true);
  };

  const handleEditarItem = (item: ItemCatalogo) => {
    setEditingItem(item);
    setItemForm({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      precio: item.precio || "",
      categoria: item.categoria || "",
      tipoItem: item.tipoItem || "producto",
      ingredientes: item.ingredientes || "",
      tiempoPreparacion: item.tiempoPreparacion || "",
    });
    setShowItemModal(true);
  };

  const handleGuardarItem = () => {
    if (!itemForm.nombre?.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    guardarItemMutation.mutate(itemForm);
  };

  const handleSelectLocation = (lat: number, lng: number) => {
    setNegocioForm({ ...negocioForm, latitud: lat, longitud: lng });
    toast({ title: "Ubicación seleccionada", description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` });
  };

  const handleSelectLogoFromCarrusel = (logo: LogoServicio) => {
    if (logo.logoUrl) {
      setNegocioForm({ ...negocioForm, logoUrl: logo.logoUrl });
      setShowLogoSelector(false);
      toast({ title: "Logo seleccionado" });
    }
  };

  if (loadingNegocio) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card data-testid="panel-local-comercial">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Mi Negocio
        </CardTitle>
        <CardDescription>
          Gestiona los datos de tu negocio, catálogo de productos y menú
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
            <TabsTrigger value="negocio" data-testid="tab-datos-negocio" className="text-xs">
              <Store className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Negocio</span>
            </TabsTrigger>
            <TabsTrigger value="catalogo" data-testid="tab-catalogo" className="text-xs">
              <Package className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
            <TabsTrigger value="personal" data-testid="tab-personal" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="publicidad" data-testid="tab-publicidad" className="text-xs">
              <Megaphone className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Publicidad</span>
            </TabsTrigger>
            <TabsTrigger value="pedidos" data-testid="tab-pedidos" className="text-xs">
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" data-testid="tab-delivery" className="text-xs">
              <Truck className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="mapa" data-testid="tab-mapa" className="text-xs">
              <Map className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="historial" data-testid="tab-historial" className="text-xs">
              <History className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Datos del Negocio */}
          <TabsContent value="negocio" className="space-y-4 mt-4">
            {/* Sección Logo */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logo del Negocio
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Subir nuevo logo</p>
                  <ImageUpload
                    value={negocioForm.logoUrl}
                    onChange={(url) => setNegocioForm({ ...negocioForm, logoUrl: url || "" })}
                    endpoint="servicios"
                    enableEditor={true}
                    aspectRatio={1}
                    maxSize={5}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">O seleccionar del carrusel</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2"
                    onClick={() => setShowLogoSelector(true)}
                    data-testid="button-select-logo-carrusel"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">Seleccionar de Servicios</span>
                  </Button>
                </div>
              </div>
              {negocioForm.logoUrl && (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                  <img 
                    src={negocioForm.logoUrl} 
                    alt="Logo actual" 
                    className="h-12 w-12 object-cover rounded-md cursor-pointer hover:opacity-80"
                    onClick={() => setShowNegocioPopup(true)}
                    data-testid="img-logo-negocio"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Logo actual</p>
                    <p className="text-xs text-muted-foreground">Haz clic para ver vista previa del negocio</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNegocioForm({ ...negocioForm, logoUrl: "" })}
                    data-testid="button-remove-logo"
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreNegocio">Nombre del Negocio *</Label>
                <Input
                  id="nombreNegocio"
                  value={negocioForm.nombreNegocio || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, nombreNegocio: e.target.value })}
                  placeholder="Nombre de tu negocio"
                  data-testid="input-nombre-negocio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoNegocio">Tipo de Negocio</Label>
                <Select
                  value={negocioForm.tipoNegocio || "tienda"}
                  onValueChange={(value) => setNegocioForm({ ...negocioForm, tipoNegocio: value })}
                >
                  <SelectTrigger data-testid="select-tipo-negocio">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurante">Restaurante</SelectItem>
                    <SelectItem value="tienda">Tienda</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="cafe">Cafetería</SelectItem>
                    <SelectItem value="farmacia">Farmacia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={negocioForm.descripcion || ""}
                onChange={(e) => setNegocioForm({ ...negocioForm, descripcion: e.target.value })}
                placeholder="Describe tu negocio..."
                className="min-h-[100px]"
                data-testid="input-descripcion-negocio"
              />
            </div>

            {/* Sección GPS/Ubicación */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Ubicación GPS
              </Label>
              <div className="flex gap-2">
                <Input
                  value={negocioForm.direccion || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, direccion: e.target.value })}
                  placeholder="Av. Principal 123"
                  className="flex-1"
                  data-testid="input-direccion"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowMapPicker(true)}
                  data-testid="button-select-gps"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Seleccionar GPS
                </Button>
              </div>
              {negocioForm.latitud && negocioForm.longitud && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="h-4 w-4 text-green-500" />
                  <span>Lat: {negocioForm.latitud.toFixed(6)}, Lng: {negocioForm.longitud.toFixed(6)}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={negocioForm.telefono || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, telefono: e.target.value })}
                  placeholder="+51 999 999 999"
                  data-testid="input-telefono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={negocioForm.whatsapp || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, whatsapp: e.target.value })}
                  placeholder="+51 999 999 999"
                  data-testid="input-whatsapp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={negocioForm.email || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, email: e.target.value })}
                  placeholder="contacto@minegocio.com"
                  data-testid="input-email-negocio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horario de Atención</Label>
                <Input
                  id="horario"
                  value={negocioForm.horarioAtencion || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, horarioAtencion: e.target.value })}
                  placeholder="Lun-Vie: 9:00 - 18:00, Sáb: 9:00 - 13:00"
                  data-testid="input-horario"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-1">
                  <Facebook className="h-4 w-4" /> Facebook
                </Label>
                <Input
                  id="facebook"
                  value={negocioForm.facebook || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, facebook: e.target.value })}
                  placeholder="facebook.com/minegocio"
                  data-testid="input-facebook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-1">
                  <Instagram className="h-4 w-4" /> Instagram
                </Label>
                <Input
                  id="instagram"
                  value={negocioForm.instagram || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, instagram: e.target.value })}
                  placeholder="@minegocio"
                  data-testid="input-instagram"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paginaWeb" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" /> Página Web
                </Label>
                <Input
                  id="paginaWeb"
                  value={negocioForm.paginaWeb || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, paginaWeb: e.target.value })}
                  placeholder="www.minegocio.com"
                  data-testid="input-pagina-web"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleGuardarNegocio} 
                disabled={guardarNegocioMutation.isPending}
                data-testid="button-guardar-negocio"
              >
                {guardarNegocioMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Datos
              </Button>
            </div>
          </TabsContent>

          {/* TAB: Catálogo */}
          <TabsContent value="catalogo" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                {negocioForm.tipoNegocio === "restaurante" ? "Menú" : "Catálogo de Productos"}
              </h3>
              <Button onClick={handleAgregarItem} size="sm" data-testid="button-agregar-item">
                <Plus className="h-4 w-4 mr-2" />
                Agregar {negocioForm.tipoNegocio === "restaurante" ? "Plato" : "Producto"}
              </Button>
            </div>

            {!miNegocio ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Primero debes configurar los datos de tu negocio
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("negocio")}
                  >
                    Ir a Datos del Negocio
                  </Button>
                </CardContent>
              </Card>
            ) : loadingCatalogo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : miCatalogo.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aún no tienes productos en tu catálogo
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {miCatalogo.map((item) => (
                  <Card key={item.id} className="hover-elevate" data-testid={`card-item-${item.id}`}>
                    <CardContent className="p-4">
                      {item.imagenUrl && (
                        <img 
                          src={item.imagenUrl} 
                          alt={item.nombre}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.nombre}</h4>
                          {item.descripcion && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                        <Badge variant={item.disponible ? "default" : "secondary"}>
                          {item.disponible ? "Disponible" : "Agotado"}
                        </Badge>
                      </div>
                      {item.precio && (
                        <p className="text-lg font-bold text-primary mt-2">
                          S/ {item.precio}
                        </p>
                      )}
                      {item.categoria && (
                        <Badge variant="outline" className="mt-2">
                          {item.categoria}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditarItem(item)}
                          data-testid={`button-editar-item-${item.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => eliminarItemMutation.mutate(item.id)}
                          data-testid={`button-eliminar-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: Personal */}
          <TabsContent value="personal" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Personal del Negocio</h3>
                  <p className="text-sm text-muted-foreground">Asigna usuarios registrados con funciones y permisos</p>
                </div>
                <Button size="sm" data-testid="button-agregar-personal">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Personal
                </Button>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aún no tienes personal asignado</p>
                    <p className="text-xs text-muted-foreground mt-2">Próximamente: Buscar y asignar usuarios con funciones</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB: Publicidad */}
          <TabsContent value="publicidad" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Publicidad del Negocio</h3>
                  <p className="text-sm text-muted-foreground">Sube imágenes y productos para carruseles, eventos, fotos y videos</p>
                </div>
                <Button size="sm" data-testid="button-agregar-publicidad">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Publicación
                </Button>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="w-full">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="hover-elevate cursor-pointer" data-testid="card-carrusel-principal">
                      <CardContent className="p-4 text-center">
                        <ImageIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">Carrusel Principal</p>
                        <p className="text-xs text-muted-foreground">0 imágenes</p>
                      </CardContent>
                    </Card>
                    <Card className="hover-elevate cursor-pointer" data-testid="card-productos-publicidad">
                      <CardContent className="p-4 text-center">
                        <Package2 className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">Productos</p>
                        <p className="text-xs text-muted-foreground">0 productos</p>
                      </CardContent>
                    </Card>
                    <Card className="hover-elevate cursor-pointer" data-testid="card-eventos">
                      <CardContent className="p-4 text-center">
                        <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">Eventos</p>
                        <p className="text-xs text-muted-foreground">0 eventos</p>
                      </CardContent>
                    </Card>
                    <Card className="hover-elevate cursor-pointer" data-testid="card-promociones">
                      <CardContent className="p-4 text-center">
                        <Megaphone className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">Promociones</p>
                        <p className="text-xs text-muted-foreground">0 promos</p>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* TAB: Pedidos */}
          <TabsContent value="pedidos" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Gestión de Pedidos</h3>
                  <p className="text-sm text-muted-foreground">Administra pedidos recibidos, atendidos y entregados</p>
                </div>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card data-testid="card-pedidos-recibidos">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        Recibidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-pedidos-recibidos-count">0</p>
                      <p className="text-xs text-muted-foreground">Pedidos pendientes</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-pedidos-atendidos">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Atendidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-pedidos-atendidos-count">0</p>
                      <p className="text-xs text-muted-foreground">En preparación</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-pedidos-entregados">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Entregados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-pedidos-entregados-count">0</p>
                      <p className="text-xs text-muted-foreground">Completados hoy</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pedidos activos</p>
                  <p className="text-xs text-muted-foreground mt-2">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Delivery */}
          <TabsContent value="delivery" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Gestión de Delivery</h3>
                  <p className="text-sm text-muted-foreground">Solicita delivery/unidad móvil y rastrea entregas</p>
                </div>
                <Button size="sm" data-testid="button-solicitar-delivery">
                  <Truck className="h-4 w-4 mr-2" />
                  Solicitar Delivery
                </Button>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card data-testid="card-delivery-atendido">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        Atendido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-delivery-atendido-count">0</p>
                      <p className="text-xs text-muted-foreground">Esperando repartidor</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-delivery-encamino">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        En Camino
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-delivery-encamino-count">0</p>
                      <p className="text-xs text-muted-foreground">En tránsito</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-delivery-entregado">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Entregado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold" data-testid="text-delivery-entregado-count">0</p>
                      <p className="text-xs text-muted-foreground">Completados hoy</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay entregas activas</p>
                  <p className="text-xs text-muted-foreground mt-2">Solicita un delivery para tus pedidos</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Mapa */}
          <TabsContent value="mapa" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mapa en Tiempo Real</h3>
                  <p className="text-sm text-muted-foreground">Visualiza el recorrido de unidades de delivery</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-expandir-mapa">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Expandir Mapa
                </Button>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0 h-[400px] relative overflow-hidden rounded-lg">
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <MapPinned className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Mapa de seguimiento</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Las unidades de delivery aparecerán aquí en tiempo real
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB: Historial */}
          <TabsContent value="historial" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Historial</h3>
                  <p className="text-sm text-muted-foreground">Revisa el historial de pedidos, billetera y recargas</p>
                </div>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="pedidos-hist" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pedidos-hist" data-testid="tab-historial-pedidos">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="billetera" data-testid="tab-historial-billetera">
                      <Wallet className="h-4 w-4 mr-2" />
                      Billetera
                    </TabsTrigger>
                    <TabsTrigger value="recargas" data-testid="tab-historial-recargas">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Recargas
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pedidos-hist" className="mt-4">
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay historial de pedidos</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="billetera" className="mt-4">
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay movimientos en la billetera</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="recargas" className="mt-4">
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay historial de recargas</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal para agregar/editar item del catálogo */}
        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar" : "Agregar"} {negocioForm.tipoNegocio === "restaurante" ? "Plato" : "Producto"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos del item para tu catálogo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemNombre">Nombre *</Label>
                <Input
                  id="itemNombre"
                  value={itemForm.nombre || ""}
                  onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
                  placeholder="Nombre del producto/plato"
                  data-testid="input-item-nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemDescripcion">Descripción</Label>
                <Textarea
                  id="itemDescripcion"
                  value={itemForm.descripcion || ""}
                  onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })}
                  placeholder="Descripción del item..."
                  data-testid="input-item-descripcion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemPrecio">Precio (S/)</Label>
                  <Input
                    id="itemPrecio"
                    type="number"
                    step="0.01"
                    value={itemForm.precio || ""}
                    onChange={(e) => setItemForm({ ...itemForm, precio: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-item-precio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemCategoria">Categoría</Label>
                  <Input
                    id="itemCategoria"
                    value={itemForm.categoria || ""}
                    onChange={(e) => setItemForm({ ...itemForm, categoria: e.target.value })}
                    placeholder="Ej: Bebidas, Entradas"
                    data-testid="input-item-categoria"
                  />
                </div>
              </div>

              {negocioForm.tipoNegocio === "restaurante" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="itemIngredientes">Ingredientes</Label>
                    <Textarea
                      id="itemIngredientes"
                      value={itemForm.ingredientes || ""}
                      onChange={(e) => setItemForm({ ...itemForm, ingredientes: e.target.value })}
                      placeholder="Lista de ingredientes..."
                      data-testid="input-item-ingredientes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemTiempo">Tiempo de Preparación</Label>
                    <Input
                      id="itemTiempo"
                      value={itemForm.tiempoPreparacion || ""}
                      onChange={(e) => setItemForm({ ...itemForm, tiempoPreparacion: e.target.value })}
                      placeholder="Ej: 15-20 min"
                      data-testid="input-item-tiempo"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardarItem}
                disabled={guardarItemMutation.isPending}
                data-testid="button-guardar-item"
              >
                {guardarItemMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal selector de logos del carrusel */}
        <Dialog open={showLogoSelector} onOpenChange={setShowLogoSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Seleccionar Logo del Carrusel</DialogTitle>
              <DialogDescription>
                Elige un logo de los servicios existentes
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              {logosServicios.length === 0 ? (
                <div className="py-8 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay logos disponibles en el carrusel</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {logosServicios.map((logo) => (
                    <Card 
                      key={logo.id} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => handleSelectLogoFromCarrusel(logo)}
                      data-testid={`logo-servicio-${logo.id}`}
                    >
                      <CardContent className="p-3 text-center">
                        {logo.logoUrl ? (
                          <img 
                            src={logo.logoUrl} 
                            alt={logo.nombre}
                            className="w-16 h-16 object-contain mx-auto rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mx-auto">
                            <Store className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs mt-2 truncate">{logo.nombre}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoSelector(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal popup del negocio */}
        <Dialog open={showNegocioPopup} onOpenChange={setShowNegocioPopup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {negocioForm.logoUrl && (
                  <img 
                    src={negocioForm.logoUrl} 
                    alt="Logo" 
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                {negocioForm.nombreNegocio || "Mi Negocio"}
              </DialogTitle>
              <DialogDescription>
                Vista previa de tu negocio
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {negocioForm.descripcion && (
                <p className="text-sm text-muted-foreground">{negocioForm.descripcion}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {negocioForm.telefono && (
                  <Badge variant="outline" className="gap-1">
                    <Phone className="h-3 w-3" />
                    {negocioForm.telefono}
                  </Badge>
                )}
                {negocioForm.horarioAtencion && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {negocioForm.horarioAtencion}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Me gusta
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Favorito
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              </div>
              
              {negocioForm.latitud && negocioForm.longitud && (
                <Button variant="outline" className="w-full" data-testid="button-ver-ubicacion">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver ubicación en el mapa
                </Button>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNegocioPopup(false)}>
                Cerrar
              </Button>
              <Button data-testid="button-ver-menu">
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Ver Menú / Catálogo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MapPicker para seleccionar ubicación */}
        <MapPicker
          open={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelectLocation={handleSelectLocation}
          initialLat={negocioForm.latitud || -18.0146}
          initialLng={negocioForm.longitud || -70.2536}
        />
      </CardContent>
    </Card>
  );
}
