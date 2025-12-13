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

interface UsuarioBasico {
  id: string;
  email?: string;
  telefono?: string;
  firstName?: string;
  lastName?: string;
  alias?: string;
  profileImageUrl?: string;
}

interface PersonalNegocio {
  id: string;
  negocioId: string;
  usuarioId: string;
  propietarioId: string;
  funcion: string;
  permisos?: string[];
  estado?: string;
  fechaIngreso?: string;
  notas?: string;
  usuario?: UsuarioBasico;
}

interface PublicidadNegocio {
  id: string;
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  imagenUrl?: string;
  enlaceUrl?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaCaducidad?: string;
  estado?: string;
  usuarioId?: string;
  orden?: number;
  latitud?: number;
  longitud?: number;
  direccion?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  createdAt?: string;
}

interface PedidoNegocio {
  id: string;
  usuarioId: string;
  servicioId: string;
  productos: { productoId: string; cantidad: number }[];
  total: string;
  direccionEntrega: string;
  latitud?: number;
  longitud?: number;
  estado?: string;
  conductorId?: string;
  notas?: string;
  createdAt?: string;
  completedAt?: string;
  cliente?: {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
  };
}

interface EstadisticasPedidos {
  recibidos: number;
  atendidos: number;
  entregados: number;
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
  
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<PersonalNegocio | null>(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioBasico | null>(null);
  const [personalForm, setPersonalForm] = useState({
    funcion: "",
    permisos: [] as string[],
    notas: "",
  });

  const [showPublicidadModal, setShowPublicidadModal] = useState(false);
  const [editingPublicidad, setEditingPublicidad] = useState<PublicidadNegocio | null>(null);
  const [publicidadForm, setPublicidadForm] = useState<Partial<PublicidadNegocio>>({
    titulo: "",
    descripcion: "",
    tipo: "carrusel_principal",
    imagenUrl: "",
    enlaceUrl: "",
    estado: "activo",
    facebook: "",
    instagram: "",
    whatsapp: "",
    tiktok: "",
  });

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

  const { data: miPersonal = [], isLoading: loadingPersonal } = useQuery<PersonalNegocio[]>({
    queryKey: ["/api/mi-personal"],
    enabled: !!miNegocio,
  });

  const { data: miPublicidad = [], isLoading: loadingPublicidad } = useQuery<PublicidadNegocio[]>({
    queryKey: ["/api/mi-publicidad"],
    enabled: !!miNegocio,
  });

  const { data: usuariosBuscados = [], isLoading: buscandoUsuarios } = useQuery<UsuarioBasico[]>({
    queryKey: ["/api/buscar-usuarios", busquedaUsuario],
    enabled: busquedaUsuario.length >= 3,
  });

  const [filtroPedidos, setFiltroPedidos] = useState<string>("todos");

  const { data: estadisticasPedidos = { recibidos: 0, atendidos: 0, entregados: 0 } } = useQuery<EstadisticasPedidos>({
    queryKey: ["/api/mi-negocio/pedidos/estadisticas"],
    enabled: !!miNegocio,
  });

  const { data: misPedidos = [], isLoading: loadingPedidos } = useQuery<PedidoNegocio[]>({
    queryKey: ["/api/mi-negocio/pedidos", filtroPedidos],
    queryFn: async () => {
      const url = filtroPedidos === 'todos' 
        ? '/api/mi-negocio/pedidos' 
        : `/api/mi-negocio/pedidos?estado=${filtroPedidos}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar pedidos');
      return res.json();
    },
    enabled: !!miNegocio,
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

  const guardarPersonalMutation = useMutation({
    mutationFn: (data: { usuarioId: string; funcion: string; permisos?: string[]; notas?: string }) => {
      if (editingPersonal) {
        return apiRequest("PATCH", `/api/mi-personal/${editingPersonal.id}`, data);
      }
      return apiRequest("POST", "/api/mi-personal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-personal"] });
      setShowPersonalModal(false);
      setEditingPersonal(null);
      setUsuarioSeleccionado(null);
      setBusquedaUsuario("");
      setPersonalForm({ funcion: "", permisos: [], notas: "" });
      toast({ title: editingPersonal ? "Personal actualizado" : "Personal agregado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarPersonalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mi-personal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-personal"] });
      toast({ title: "Personal eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const guardarPublicidadMutation = useMutation({
    mutationFn: (data: Partial<PublicidadNegocio>) => {
      if (editingPublicidad) {
        return apiRequest("PATCH", `/api/mi-publicidad/${editingPublicidad.id}`, data);
      }
      return apiRequest("POST", "/api/mi-publicidad", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-publicidad"] });
      setShowPublicidadModal(false);
      setEditingPublicidad(null);
      setPublicidadForm({
        titulo: "",
        descripcion: "",
        tipo: "carrusel_principal",
        imagenUrl: "",
        enlaceUrl: "",
        estado: "activo",
        facebook: "",
        instagram: "",
        whatsapp: "",
        tiktok: "",
      });
      toast({ title: editingPublicidad ? "Publicidad actualizada" : "Publicidad creada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarPublicidadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mi-publicidad/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-publicidad"] });
      toast({ title: "Publicidad eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const actualizarPedidoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => 
      apiRequest("PATCH", `/api/mi-negocio/pedidos/${id}`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/pedidos/estadisticas"] });
      toast({ title: "Estado del pedido actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar pedido", description: error.message, variant: "destructive" });
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

  const handleAgregarPersonal = () => {
    setEditingPersonal(null);
    setUsuarioSeleccionado(null);
    setBusquedaUsuario("");
    setPersonalForm({ funcion: "", permisos: [], notas: "" });
    setShowPersonalModal(true);
  };

  const handleEditarPersonal = (personal: PersonalNegocio) => {
    setEditingPersonal(personal);
    setUsuarioSeleccionado(personal.usuario || null);
    setPersonalForm({
      funcion: personal.funcion || "",
      permisos: personal.permisos || [],
      notas: personal.notas || "",
    });
    setShowPersonalModal(true);
  };

  const handleGuardarPersonal = () => {
    if (!editingPersonal && !usuarioSeleccionado) {
      toast({ title: "Debes seleccionar un usuario", variant: "destructive" });
      return;
    }
    if (!personalForm.funcion) {
      toast({ title: "La función es requerida", variant: "destructive" });
      return;
    }
    guardarPersonalMutation.mutate({
      usuarioId: editingPersonal ? editingPersonal.usuarioId : usuarioSeleccionado!.id,
      funcion: personalForm.funcion,
      permisos: personalForm.permisos,
      notas: personalForm.notas,
    });
  };

  const handleAgregarPublicidad = () => {
    setEditingPublicidad(null);
    setPublicidadForm({
      titulo: "",
      descripcion: "",
      tipo: "carrusel_principal",
      imagenUrl: "",
      enlaceUrl: "",
      estado: "activo",
      facebook: "",
      instagram: "",
      whatsapp: "",
      tiktok: "",
    });
    setShowPublicidadModal(true);
  };

  const handleEditarPublicidad = (pub: PublicidadNegocio) => {
    setEditingPublicidad(pub);
    setPublicidadForm({
      titulo: pub.titulo || "",
      descripcion: pub.descripcion || "",
      tipo: pub.tipo || "carrusel_principal",
      imagenUrl: pub.imagenUrl || "",
      enlaceUrl: pub.enlaceUrl || "",
      estado: pub.estado || "activo",
      facebook: pub.facebook || "",
      instagram: pub.instagram || "",
      whatsapp: pub.whatsapp || "",
      tiktok: pub.tiktok || "",
    });
    setShowPublicidadModal(true);
  };

  const handleGuardarPublicidad = () => {
    if (!publicidadForm.titulo?.trim()) {
      toast({ title: "El título es requerido", variant: "destructive" });
      return;
    }
    guardarPublicidadMutation.mutate(publicidadForm);
  };

  const tiposPublicidad = [
    { value: "carrusel_principal", label: "Carrusel Principal" },
    { value: "logos_servicios", label: "Logos Servicios" },
    { value: "carrusel_logos", label: "Carrusel Logos" },
    { value: "popup_emergencia", label: "Popup Emergencia" },
    { value: "encuestas_apoyo", label: "Encuestas Apoyo" },
  ];

  const funcionesPersonal = [
    { value: "cajero", label: "Cajero" },
    { value: "vendedor", label: "Vendedor" },
    { value: "repartidor", label: "Repartidor" },
    { value: "gerente", label: "Gerente" },
    { value: "cocinero", label: "Cocinero" },
    { value: "mesero", label: "Mesero" },
    { value: "limpieza", label: "Limpieza" },
    { value: "seguridad", label: "Seguridad" },
    { value: "almacen", label: "Almacén" },
  ];

  const permisosDisponibles = [
    { value: "ver_pedidos", label: "Ver Pedidos" },
    { value: "gestionar_pedidos", label: "Gestionar Pedidos" },
    { value: "ver_inventario", label: "Ver Inventario" },
    { value: "gestionar_inventario", label: "Gestionar Inventario" },
    { value: "ver_reportes", label: "Ver Reportes" },
    { value: "gestionar_caja", label: "Gestionar Caja" },
  ];

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
                <Button size="sm" onClick={handleAgregarPersonal} data-testid="button-agregar-personal">
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
              ) : loadingPersonal ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : miPersonal.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aún no tienes personal asignado</p>
                    <p className="text-xs text-muted-foreground mt-2">Busca usuarios por email, teléfono o nombre</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {miPersonal.map((personal) => (
                    <Card key={personal.id} data-testid={`card-personal-${personal.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {personal.usuario?.profileImageUrl ? (
                              <img 
                                src={personal.usuario.profileImageUrl} 
                                alt="" 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {personal.usuario?.firstName || personal.usuario?.alias || "Usuario"}
                              {personal.usuario?.lastName ? ` ${personal.usuario.lastName}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {personal.usuario?.email || personal.usuario?.telefono || "Sin contacto"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <Badge variant="secondary" className="capitalize">
                            {funcionesPersonal.find(f => f.value === personal.funcion)?.label || personal.funcion}
                          </Badge>
                          {personal.permisos && personal.permisos.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {personal.permisos.slice(0, 2).map((p) => (
                                <Badge key={p} variant="outline" className="text-xs">
                                  {permisosDisponibles.find(pd => pd.value === p)?.label || p}
                                </Badge>
                              ))}
                              {personal.permisos.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{personal.permisos.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          {personal.notas && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{personal.notas}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditarPersonal(personal)}
                            data-testid={`button-editar-personal-${personal.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => eliminarPersonalMutation.mutate(personal.id)}
                            data-testid={`button-eliminar-personal-${personal.id}`}
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
          </TabsContent>

          {/* TAB: Publicidad */}
          <TabsContent value="publicidad" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-medium">Publicidad del Negocio</h3>
                  <p className="text-sm text-muted-foreground">Sube imágenes y productos para carruseles, eventos, fotos y videos</p>
                </div>
                <Button size="sm" onClick={handleAgregarPublicidad} data-testid="button-agregar-publicidad">
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
              ) : loadingPublicidad ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : miPublicidad.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tienes publicidad registrada</p>
                    <p className="text-xs text-muted-foreground mt-2">Crea tu primera publicación para aparecer en los carruseles</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {miPublicidad.map((pub) => (
                    <Card key={pub.id} className="overflow-hidden" data-testid={`card-publicidad-${pub.id}`}>
                      {pub.imagenUrl && (
                        <div className="h-32 bg-muted overflow-hidden">
                          <img 
                            src={pub.imagenUrl} 
                            alt={pub.titulo || "Publicidad"} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{pub.titulo || "Sin título"}</h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {tiposPublicidad.find(t => t.value === pub.tipo)?.label || pub.tipo}
                            </Badge>
                          </div>
                          <Badge variant={pub.estado === "activo" ? "default" : "secondary"} className="text-xs shrink-0">
                            {pub.estado === "activo" ? "Activo" : pub.estado}
                          </Badge>
                        </div>
                        {pub.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pub.descripcion}</p>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditarPublicidad(pub)}
                            data-testid={`button-editar-publicidad-${pub.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => eliminarPublicidadMutation.mutate(pub.id)}
                            data-testid={`button-eliminar-publicidad-${pub.id}`}
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
          </TabsContent>

          {/* TAB: Pedidos */}
          <TabsContent value="pedidos" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-medium">Gestión de Pedidos</h3>
                  <p className="text-sm text-muted-foreground">Administra pedidos recibidos, atendidos y entregados</p>
                </div>
                <Select value={filtroPedidos} onValueChange={setFiltroPedidos}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filtro-pedidos">
                    <SelectValue placeholder="Filtrar pedidos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los pedidos</SelectItem>
                    <SelectItem value="pendiente">Recibidos</SelectItem>
                    <SelectItem value="en_preparacion">En preparación</SelectItem>
                    <SelectItem value="entregado">Entregados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card 
                      data-testid="card-pedidos-recibidos"
                      className={`cursor-pointer transition-all ${filtroPedidos === 'pendiente' ? 'ring-2 ring-yellow-500' : ''}`}
                      onClick={() => setFiltroPedidos('pendiente')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          Recibidos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold" data-testid="text-pedidos-recibidos-count">
                          {estadisticasPedidos.recibidos}
                        </p>
                        <p className="text-xs text-muted-foreground">Pedidos pendientes</p>
                      </CardContent>
                    </Card>
                    <Card 
                      data-testid="card-pedidos-atendidos"
                      className={`cursor-pointer transition-all ${filtroPedidos === 'en_preparacion' ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setFiltroPedidos('en_preparacion')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          Atendidos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold" data-testid="text-pedidos-atendidos-count">
                          {estadisticasPedidos.atendidos}
                        </p>
                        <p className="text-xs text-muted-foreground">En preparación</p>
                      </CardContent>
                    </Card>
                    <Card 
                      data-testid="card-pedidos-entregados"
                      className={`cursor-pointer transition-all ${filtroPedidos === 'entregado' ? 'ring-2 ring-green-500' : ''}`}
                      onClick={() => setFiltroPedidos('entregado')}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          Entregados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold" data-testid="text-pedidos-entregados-count">
                          {estadisticasPedidos.entregados}
                        </p>
                        <p className="text-xs text-muted-foreground">Completados hoy</p>
                      </CardContent>
                    </Card>
                  </div>

                  {loadingPedidos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : misPedidos.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {filtroPedidos === 'todos' 
                            ? 'No hay pedidos activos' 
                            : `No hay pedidos ${filtroPedidos === 'pendiente' ? 'recibidos' : filtroPedidos === 'en_preparacion' ? 'en preparación' : 'entregados'}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {misPedidos.map((pedido) => (
                        <Card key={pedido.id} data-testid={`card-pedido-${pedido.id}`}>
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant={
                                      pedido.estado === 'pendiente' ? 'secondary' :
                                      pedido.estado === 'en_preparacion' || pedido.estado === 'preparando' ? 'default' :
                                      'outline'
                                    }
                                    className={
                                      pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                      pedido.estado === 'en_preparacion' || pedido.estado === 'preparando' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }
                                  >
                                    {pedido.estado === 'pendiente' ? 'Recibido' :
                                     pedido.estado === 'en_preparacion' || pedido.estado === 'preparando' ? 'En Preparación' :
                                     'Entregado'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    #{pedido.id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {pedido.cliente?.nombre || 'Cliente'}
                                  </p>
                                  {pedido.cliente?.telefono && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                      <Phone className="h-3 w-3" />
                                      {pedido.cliente.telefono}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {pedido.direccionEntrega}
                                  </p>
                                  {pedido.notas && (
                                    <p className="text-sm text-muted-foreground italic">
                                      Nota: {pedido.notas}
                                    </p>
                                  )}
                                </div>

                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-sm font-medium mb-1">Productos:</p>
                                  <div className="text-sm text-muted-foreground">
                                    {Array.isArray(pedido.productos) && pedido.productos.length > 0 
                                      ? pedido.productos.map((prod, idx) => (
                                          <span key={idx}>
                                            {prod.cantidad}x Producto {prod.productoId.slice(-4)}
                                            {idx < pedido.productos.length - 1 ? ', ' : ''}
                                          </span>
                                        ))
                                      : 'Sin productos detallados'
                                    }
                                  </div>
                                </div>
                              </div>

                              <div className="text-right space-y-2">
                                <p className="text-lg font-bold text-primary">
                                  S/ {parseFloat(pedido.total || '0').toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                  <Clock className="h-3 w-3" />
                                  {pedido.createdAt ? new Date(pedido.createdAt).toLocaleString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Sin fecha'}
                                </p>
                                
                                <div className="flex flex-col gap-1 mt-2">
                                  {pedido.estado === 'pendiente' && (
                                    <Button
                                      size="sm"
                                      onClick={() => actualizarPedidoMutation.mutate({ id: pedido.id, estado: 'en_preparacion' })}
                                      disabled={actualizarPedidoMutation.isPending}
                                      data-testid={`button-atender-pedido-${pedido.id}`}
                                    >
                                      {actualizarPedidoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                      )}
                                      Atender
                                    </Button>
                                  )}
                                  {(pedido.estado === 'en_preparacion' || pedido.estado === 'preparando') && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => actualizarPedidoMutation.mutate({ id: pedido.id, estado: 'entregado' })}
                                      disabled={actualizarPedidoMutation.isPending}
                                      data-testid={`button-entregar-pedido-${pedido.id}`}
                                    >
                                      {actualizarPedidoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Truck className="h-4 w-4 mr-1" />
                                      )}
                                      Marcar Entregado
                                    </Button>
                                  )}
                                  {(pedido.estado === 'entregado' || pedido.estado === 'completado') && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Completado
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
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

        {/* Modal agregar/editar personal */}
        <Dialog open={showPersonalModal} onOpenChange={(open) => {
          setShowPersonalModal(open);
          if (!open) {
            setBusquedaUsuario("");
            setUsuarioSeleccionado(null);
            setEditingPersonal(null);
            setPersonalForm({ funcion: "", permisos: [], notas: "" });
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPersonal ? "Editar Personal" : "Agregar Personal"}</DialogTitle>
              <DialogDescription>
                {editingPersonal ? "Modifica los datos del personal" : "Busca un usuario y asígnale una función"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingPersonal && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Buscar Usuario <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                    placeholder="Email, teléfono o nombre (mín. 3 caracteres)"
                    data-testid="input-buscar-usuario"
                  />
                  {buscandoUsuarios && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </div>
                  )}
                  {busquedaUsuario.length >= 3 && usuariosBuscados.length > 0 && !usuarioSeleccionado && (
                    <ScrollArea className="h-[150px] border rounded-md p-2">
                      {usuariosBuscados.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => setUsuarioSeleccionado(u)}
                          data-testid={`usuario-resultado-${u.id}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {u.profileImageUrl ? (
                              <img src={u.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {u.firstName || u.alias || "Usuario"} {u.lastName || ""}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.email || u.telefono || "Sin contacto"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                  {usuarioSeleccionado && (
                    <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {usuarioSeleccionado.profileImageUrl ? (
                          <img src={usuarioSeleccionado.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {usuarioSeleccionado.firstName || usuarioSeleccionado.alias || "Usuario"} {usuarioSeleccionado.lastName || ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {usuarioSeleccionado.email || usuarioSeleccionado.telefono}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setUsuarioSeleccionado(null)}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {editingPersonal && editingPersonal.usuario && (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {editingPersonal.usuario.profileImageUrl ? (
                      <img src={editingPersonal.usuario.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {editingPersonal.usuario.firstName || editingPersonal.usuario.alias || "Usuario"} {editingPersonal.usuario.lastName || ""}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {editingPersonal.usuario.email || editingPersonal.usuario.telefono}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Función <span className="text-destructive">*</span>
                </Label>
                <Select value={personalForm.funcion} onValueChange={(v) => setPersonalForm({ ...personalForm, funcion: v })}>
                  <SelectTrigger data-testid="select-funcion-personal">
                    <SelectValue placeholder="Selecciona función" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionesPersonal.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permisos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {permisosDisponibles.map((p) => (
                    <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={personalForm.permisos.includes(p.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPersonalForm({ ...personalForm, permisos: [...personalForm.permisos, p.value] });
                          } else {
                            setPersonalForm({ ...personalForm, permisos: personalForm.permisos.filter(x => x !== p.value) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={personalForm.notas}
                  onChange={(e) => setPersonalForm({ ...personalForm, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="min-h-[80px]"
                  data-testid="textarea-notas-personal"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPersonalModal(false)}>Cancelar</Button>
              <Button onClick={handleGuardarPersonal} disabled={guardarPersonalMutation.isPending} data-testid="button-guardar-personal">
                {guardarPersonalMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Crear/Editar Publicidad */}
        <Dialog open={showPublicidadModal} onOpenChange={setShowPublicidadModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPublicidad ? "Editar Publicidad" : "Nueva Publicidad"}</DialogTitle>
              <DialogDescription>
                {editingPublicidad ? "Modifica los datos de tu publicidad" : "Crea una nueva publicación para tu negocio"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo-publicidad">Título *</Label>
                <Input
                  id="titulo-publicidad"
                  value={publicidadForm.titulo || ""}
                  onChange={(e) => setPublicidadForm({ ...publicidadForm, titulo: e.target.value })}
                  placeholder="Título de la publicación"
                  data-testid="input-titulo-publicidad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo-publicidad">Tipo de Publicidad</Label>
                <Select
                  value={publicidadForm.tipo || "carrusel_principal"}
                  onValueChange={(value) => setPublicidadForm({ ...publicidadForm, tipo: value })}
                >
                  <SelectTrigger data-testid="select-tipo-publicidad">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPublicidad.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion-publicidad">Descripción</Label>
                <Textarea
                  id="descripcion-publicidad"
                  value={publicidadForm.descripcion || ""}
                  onChange={(e) => setPublicidadForm({ ...publicidadForm, descripcion: e.target.value })}
                  placeholder="Describe tu publicación..."
                  className="min-h-[80px]"
                  data-testid="textarea-descripcion-publicidad"
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen</Label>
                <ImageUpload
                  value={publicidadForm.imagenUrl}
                  onChange={(url) => setPublicidadForm({ ...publicidadForm, imagenUrl: url || "" })}
                  endpoint="publicidad"
                  enableEditor={true}
                  aspectRatio={16/9}
                  maxSize={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enlace-publicidad">Enlace URL</Label>
                <Input
                  id="enlace-publicidad"
                  value={publicidadForm.enlaceUrl || ""}
                  onChange={(e) => setPublicidadForm({ ...publicidadForm, enlaceUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-enlace-publicidad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado-publicidad">Estado</Label>
                <Select
                  value={publicidadForm.estado || "activo"}
                  onValueChange={(value) => setPublicidadForm({ ...publicidadForm, estado: value })}
                >
                  <SelectTrigger data-testid="select-estado-publicidad">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 mt-4">
                <Label className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4" />
                  Redes Sociales (opcional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Facebook className="h-3 w-3" /> Facebook
                    </Label>
                    <Input
                      value={publicidadForm.facebook || ""}
                      onChange={(e) => setPublicidadForm({ ...publicidadForm, facebook: e.target.value })}
                      placeholder="URL o usuario"
                      className="text-sm"
                      data-testid="input-facebook-publicidad"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> Instagram
                    </Label>
                    <Input
                      value={publicidadForm.instagram || ""}
                      onChange={(e) => setPublicidadForm({ ...publicidadForm, instagram: e.target.value })}
                      placeholder="@usuario"
                      className="text-sm"
                      data-testid="input-instagram-publicidad"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3" /> WhatsApp
                    </Label>
                    <Input
                      value={publicidadForm.whatsapp || ""}
                      onChange={(e) => setPublicidadForm({ ...publicidadForm, whatsapp: e.target.value })}
                      placeholder="+51 999 999 999"
                      className="text-sm"
                      data-testid="input-whatsapp-publicidad"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">TikTok</Label>
                    <Input
                      value={publicidadForm.tiktok || ""}
                      onChange={(e) => setPublicidadForm({ ...publicidadForm, tiktok: e.target.value })}
                      placeholder="@usuario"
                      className="text-sm"
                      data-testid="input-tiktok-publicidad"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublicidadModal(false)}>Cancelar</Button>
              <Button onClick={handleGuardarPublicidad} disabled={guardarPublicidadMutation.isPending} data-testid="button-guardar-publicidad">
                {guardarPublicidadMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
