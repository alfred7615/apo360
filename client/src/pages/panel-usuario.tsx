import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, Store, Package, Heart, MapPin,
  Trash2, Share2, Car, CreditCard, ShoppingBag,
  Plus, Edit, Loader2, Crown, CheckCircle,
  User, Camera, AlertCircle, Wallet, DollarSign,
  Clock, Check, X, ArrowRight, Upload, Image as ImageIcon, ZoomIn, Copy, Building, Phone,
  History, TrendingUp, TrendingDown, Megaphone, UtensilsCrossed, Wrench, FileText, Coins, ThumbsUp
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link, useSearch } from "wouter";
import BloqueoServicio, { useVerificarPerfil } from "@/components/BloqueoServicio";
import LocalComercialPanel from "@/components/LocalComercialPanel";
import CambistaPanelUsuario from "@/components/CambistaPanelUsuario";

interface RolUsuario {
  id: string;
  usuarioId: string;
  rol: string;
  categoriaRolId?: string;
  subcategoriaRolId?: string;
  categoria?: any;
  subcategoria?: any;
}

interface PlanMembresia {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMeses: number;
  precioNormal: string;
  precioDescuento: string | null;
  porcentajeDescuento: number | null;
  beneficios: string[] | null;
  productosIncluidos: number;
  destacado: boolean;
  activo: boolean;
  orden: number;
}

interface SaldoUsuario {
  id: number;
  usuarioId: string;
  saldo: string;
  totalIngresos: string;
  totalEgresos: string;
  monedaPreferida: string;
}

interface TransaccionSaldo {
  id: string;
  usuarioId: string;
  tipo: string;
  concepto: string;
  monto: string;
  saldoAnterior: string;
  saldoNuevo: string;
  referenciaId?: string;
  referenciaTipo?: string;
  estado: string;
  notas?: string;
  createdAt: string;
}

interface ViajeTaxi {
  id: string;
  pasajeroId: string;
  conductorId: string | null;
  origenLatitud: number;
  origenLongitud: number;
  origenDireccion: string | null;
  destinoLatitud: number;
  destinoLongitud: number;
  destinoDireccion: string | null;
  precio: string | null;
  estado: string | null;
  tipoServicio: string | null;
  createdAt: string;
  iniciadoAt: string | null;
  completadoAt: string | null;
}

export default function PanelUsuarioPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const searchString = useSearch();
  const [activeTab, setActiveTab] = useState("favoritos");
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showRecargaModal, setShowRecargaModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Detectar si viene con parámetro de recarga para abrir el modal automáticamente
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("recarga") === "true") {
      setShowRecargaModal(true);
      setActiveTab("membresia");
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', '/mi-panel');
    }
    if (params.get("tab")) {
      setActiveTab(params.get("tab") || "favoritos");
    }
  }, [searchString]);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanMembresia | null>(null);
  const [montoRecarga, setMontoRecarga] = useState("10.00");
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [imagenComprobante, setImagenComprobante] = useState<File | null>(null);
  const [imagenComprobanteUrl, setImagenComprobanteUrl] = useState("");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const { toast } = useToast();
  
  const { 
    verificacion, 
    isLoading: loadingVerificacion,
    vendedorHabilitado,
    conductorHabilitado,
  } = useVerificarPerfil();

  const [productoForm, setProductoForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    imagenUrl: "",
    categoria: "",
  });

  const { data: favoritos = [], isLoading: loadingFavoritos } = useQuery<any[]>({
    queryKey: ["/api/favoritos"],
    enabled: isAuthenticated,
  });

  const { data: misProductos = [], isLoading: loadingProductos } = useQuery<any[]>({
    queryKey: ["/api/mis-productos"],
    enabled: isAuthenticated,
  });

  const { data: membresia, isLoading: loadingMembresia } = useQuery<any>({
    queryKey: ["/api/mi-membresia"],
    enabled: isAuthenticated,
  });

  const { data: planesMembresia = [], isLoading: loadingPlanes } = useQuery<PlanMembresia[]>({
    queryKey: ["/api/planes-membresia"],
    enabled: isAuthenticated,
  });

  const { data: miSaldo, isLoading: loadingSaldo } = useQuery<SaldoUsuario>({
    queryKey: ["/api/saldos/mi-saldo"],
    enabled: isAuthenticated,
  });

  const { data: metodosPago = [], isLoading: loadingMetodos } = useQuery<any[]>({
    queryKey: ["/api/metodos-pago", { esPlataforma: true }],
    queryFn: () => fetch("/api/metodos-pago?esPlataforma=true").then(res => res.json()),
    enabled: isAuthenticated,
  });

  const { data: transacciones = [], isLoading: loadingTransacciones } = useQuery<TransaccionSaldo[]>({
    queryKey: ["/api/transacciones-saldo"],
    enabled: isAuthenticated,
  });

  const { data: historialViajes = [], isLoading: loadingHistorialViajes } = useQuery<ViajeTaxi[]>({
    queryKey: ["/api/taxi/historial-conductor"],
    enabled: isAuthenticated && user?.modoTaxi === "conductor",
  });

  const { data: misRoles = [] } = useQuery<RolUsuario[]>({
    queryKey: ["/api/mis-roles"],
    enabled: isAuthenticated,
  });

  const tieneRolLocal = misRoles.some(r => 
    r.rol === "local" || r.rol === "local_comercial" || user?.rol === "local"
  );

  const tieneRolCambista = misRoles.some(r => r.rol === "cambista") || user?.rol === "cambista";

  const contratarMembresiaMutation = useMutation({
    mutationFn: (planId: string) => apiRequest("POST", "/api/membresias/contratar", { planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-membresia"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saldos/mi-saldo"] });
      setShowPlanModal(false);
      setPlanSeleccionado(null);
      toast({ title: "Membresia contratada exitosamente", description: "Tu membresia ha sido registrada y esta pendiente de aprobacion" });
    },
    onError: (error: any) => {
      toast({ title: "Error al contratar membresia", description: error.message, variant: "destructive" });
    },
  });

  const solicitarRecargaMutation = useMutation({
    mutationFn: (data: { monto: string; metodoPagoId: string; comprobante: string; numeroOperacion?: string }) => 
      apiRequest("POST", "/api/solicitudes-saldo", { 
        tipo: "recarga", 
        monto: data.monto,
        metodoPagoId: data.metodoPagoId,
        comprobante: data.comprobante,
        numeroOperacion: data.numeroOperacion || null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saldos/mi-saldo"] });
      setShowRecargaModal(false);
      setMontoRecarga("10.00");
      setMetodoPagoId("");
      setNumeroOperacion("");
      setImagenComprobante(null);
      setImagenComprobanteUrl("");
      toast({ title: "Solicitud de recarga enviada", description: "Tu solicitud sera procesada pronto. Un administrador la revisara." });
    },
    onError: (error: any) => {
      toast({ title: "Error al solicitar recarga", description: error.message, variant: "destructive" });
    },
  });

  const handleSubirComprobante = async (file: File) => {
    setSubiendoComprobante(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      
      const response = await fetch('/api/upload/comprobantes', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }
      
      const data = await response.json();
      setImagenComprobanteUrl(data.url);
      setImagenComprobante(file);
      toast({ title: "Imagen subida correctamente" });
    } catch (error: any) {
      toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const quitarFavoritoMutation = useMutation({
    mutationFn: (data: { tipoContenido: string; contenidoId: string }) => 
      apiRequest("POST", "/api/interacciones", {
        tipoContenido: data.tipoContenido,
        contenidoId: data.contenidoId,
        tipoInteraccion: 'favorito'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favoritos"] });
      toast({ title: "Eliminado de favoritos" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Mi Panel</h2>
            <p className="text-muted-foreground mb-4">
              Inicia sesión para acceder a tu panel personal
            </p>
            <Link href="/iniciar-sesion">
              <Button data-testid="button-login">Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const favoritosLogos = favoritos.filter(f => f.tipoContenido === 'logo_servicio');
  const favoritosProductos = favoritos.filter(f => f.tipoContenido === 'producto_servicio');
  const favoritosPopups = favoritos.filter(f => f.tipoContenido === 'popup');

  const handleQuitarFavorito = (tipoContenido: string, contenidoId: string) => {
    quitarFavoritoMutation.mutate({ tipoContenido, contenidoId });
  };

  const handleCompartir = async (item: any) => {
    const url = window.location.origin;
    const texto = `Mira ${item.detalle?.nombre || 'este contenido'} en APO-360`;
    
    try {
      if (navigator.share) {
        await navigator.share({ title: texto, url });
        toast({ title: "Contenido compartido" });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Enlace copiado al portapapeles" });
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  const esConductor = user?.modoTaxi === "conductor";
  const tieneMembresia = membresia?.activa;

  return (
    <div className="container mx-auto p-4 md:p-6" data-testid="screen-panel-usuario">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
          <AvatarImage src={user?.imagenPerfil} alt={user?.primerNombre || user?.nombre} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {(user?.primerNombre || user?.nombre || 'U').substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {user?.primerNombre || user?.nombre} {user?.apellido || ''}
          </h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{user?.rol || 'Usuario'}</Badge>
            {esConductor && <Badge className="bg-blue-500">Conductor</Badge>}
            {tieneMembresia && <Badge className="bg-yellow-500"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>}
          </div>
        </div>
        <Link href="/perfil">
          <Button variant="outline" data-testid="button-editar-perfil">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <span className="text-2xl font-bold">{favoritos.length}</span>
            <p className="text-sm text-muted-foreground">Favoritos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <span className="text-2xl font-bold">{misProductos.length}</span>
            <p className="text-sm text-muted-foreground">Mis Productos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <span className="text-2xl font-bold">{esConductor ? 'Activo' : '-'}</span>
            <p className="text-sm text-muted-foreground">Conductor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <span className="text-2xl font-bold">{tieneMembresia ? 'Activa' : '-'}</span>
            <p className="text-sm text-muted-foreground">Membresia</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <span className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-mi-saldo">
              S/ {miSaldo?.saldo || '0.00'}
            </span>
            <p className="text-sm text-muted-foreground">Mi Saldo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Botones de navegación responsivos y centrados */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full max-w-3xl">
            <Button
              variant={activeTab === "favoritos" ? "default" : "outline"}
              onClick={() => setActiveTab("favoritos")}
              className="flex items-center justify-center gap-2 h-auto py-3"
              data-testid="tab-favoritos"
            >
              <Star className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Favoritos</span>
            </Button>
            <Button
              variant={activeTab === "historial" ? "default" : "outline"}
              onClick={() => setActiveTab("historial")}
              className="flex items-center justify-center gap-2 h-auto py-3"
              data-testid="tab-historial"
            >
              <History className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Historial</span>
            </Button>
            <Button
              variant={activeTab === "marketplace" ? "default" : "outline"}
              onClick={() => setActiveTab("marketplace")}
              className="flex items-center justify-center gap-2 h-auto py-3"
              data-testid="tab-marketplace"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Mi Tienda</span>
            </Button>
            <Button
              variant={activeTab === "conductor" ? "default" : "outline"}
              onClick={() => setActiveTab("conductor")}
              className="flex items-center justify-center gap-2 h-auto py-3"
              data-testid="tab-conductor"
            >
              <Car className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Conductor</span>
            </Button>
            <Button
              variant={activeTab === "membresia" ? "default" : "outline"}
              onClick={() => setActiveTab("membresia")}
              className="flex items-center justify-center gap-2 h-auto py-3 col-span-2 sm:col-span-1"
              data-testid="tab-membresia"
            >
              <Crown className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Membresia</span>
            </Button>
            {tieneRolLocal && (
              <Button
                variant={activeTab === "negocio" ? "default" : "outline"}
                onClick={() => setActiveTab("negocio")}
                className="flex items-center justify-center gap-2 h-auto py-3 col-span-2 sm:col-span-1"
                data-testid="tab-negocio"
              >
                <Store className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Mi Negocio</span>
              </Button>
            )}
            {tieneRolCambista && (
              <Button
                variant={activeTab === "cambista" ? "default" : "outline"}
                onClick={() => setActiveTab("cambista")}
                className="flex items-center justify-center gap-2 h-auto py-3 col-span-2 sm:col-span-1"
                data-testid="tab-cambista"
              >
                <Coins className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Cambista</span>
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="favoritos" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Mis Favoritos
              </CardTitle>
              <CardDescription>Contenido que has guardado organizado por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFavoritos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : favoritos.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Sin favoritos</h3>
                  <p className="text-muted-foreground text-sm">
                    Explora negocios y productos para agregarlos a tus favoritos
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const favPublicidad = favoritos.filter((f: any) => f.tipoContenido === 'popup' || f.tipoContenido === 'publicidad');
                    const favProductos = favoritos.filter((f: any) => f.tipoContenido === 'producto_servicio');
                    const favNegocios = favoritos.filter((f: any) => f.tipoContenido === 'logo_servicio');
                    const favOtros = favoritos.filter((f: any) => 
                      !['popup', 'publicidad', 'producto_servicio', 'logo_servicio'].includes(f.tipoContenido)
                    );

                    const renderFavoritoCard = (fav: any) => (
                      <Card key={fav.id} className="hover-elevate" data-testid={`card-favorito-${fav.id}`}>
                        <CardContent className="p-4">
                          {fav.tipoContenido === 'logo_servicio' && fav.detalle && (
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                <AvatarImage src={fav.detalle.logoUrl || ""} alt={fav.detalle.nombre} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {fav.detalle.nombre?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{fav.detalle.nombre}</h3>
                                {fav.detalle.direccion && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {fav.detalle.direccion}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Heart className="h-3 w-3" /> {fav.detalle.totalLikes || 0}
                                  <Star className="h-3 w-3 ml-2" /> {fav.detalle.totalFavoritos || 0}
                                </div>
                              </div>
                            </div>
                          )}

                          {fav.tipoContenido === 'producto_servicio' && fav.detalle && (
                            <div>
                              {fav.detalle.imagenUrl && (
                                <img 
                                  src={fav.detalle.imagenUrl} 
                                  alt={fav.detalle.nombre} 
                                  className="w-full h-24 object-cover rounded mb-3" 
                                />
                              )}
                              <h3 className="font-medium truncate">{fav.detalle.nombre}</h3>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-primary">
                                  S/. {fav.detalle.precio || "0.00"}
                                </span>
                                <Badge variant={fav.detalle.disponible ? "default" : "secondary"}>
                                  {fav.detalle.disponible ? "Disponible" : "Agotado"}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {(fav.tipoContenido === 'popup' || fav.tipoContenido === 'publicidad') && fav.detalle && (
                            <div>
                              {fav.detalle.imagenUrl && (
                                <img 
                                  src={fav.detalle.imagenUrl} 
                                  alt={fav.detalle.titulo} 
                                  className="w-full h-32 object-cover rounded mb-3" 
                                />
                              )}
                              <h3 className="font-medium truncate">{fav.detalle.titulo}</h3>
                              <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline">
                                  {fav.detalle.tipo || "publicidad"}
                                </Badge>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" /> {fav.detalle.totalLikes || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" /> {fav.detalle.totalFavoritos || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {!['popup', 'publicidad', 'producto_servicio', 'logo_servicio'].includes(fav.tipoContenido) && fav.detalle && (
                            <div>
                              <h3 className="font-medium truncate">{fav.detalle.nombre || fav.detalle.titulo || 'Sin nombre'}</h3>
                              <Badge variant="outline" className="mt-1">{fav.tipoContenido}</Badge>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleCompartir(fav)}
                              data-testid={`button-compartir-${fav.id}`}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Compartir
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleQuitarFavorito(fav.tipoContenido, fav.contenidoId)}
                              disabled={quitarFavoritoMutation.isPending}
                              data-testid={`button-quitar-favorito-${fav.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );

                    return (
                      <>
                        {favPublicidad.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Megaphone className="h-5 w-5 text-purple-500" />
                              <h3 className="font-semibold">Publicidad ({favPublicidad.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {favPublicidad.map(renderFavoritoCard)}
                            </div>
                          </div>
                        )}

                        {favProductos.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <ShoppingBag className="h-5 w-5 text-green-500" />
                              <h3 className="font-semibold">Productos y Servicios ({favProductos.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {favProductos.map(renderFavoritoCard)}
                            </div>
                          </div>
                        )}

                        {favNegocios.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Store className="h-5 w-5 text-blue-500" />
                              <h3 className="font-semibold">Negocios Locales ({favNegocios.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {favNegocios.map(renderFavoritoCard)}
                            </div>
                          </div>
                        )}

                        {favOtros.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <h3 className="font-semibold">Otros Favoritos ({favOtros.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {favOtros.map(renderFavoritoCard)}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Historial de Cartera
              </CardTitle>
              <CardDescription>Registro de todos tus movimientos de saldo</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransacciones ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transacciones.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Sin movimientos</h3>
                  <p className="text-muted-foreground text-sm">
                    Aún no tienes transacciones en tu historial
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Total Ingresos</p>
                      <p className="font-bold text-green-600">S/ {miSaldo?.totalIngresos || "0.00"}</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                      <TrendingDown className="h-5 w-5 text-red-600 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Total Egresos</p>
                      <p className="font-bold text-red-600">S/ {miSaldo?.totalEgresos || "0.00"}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                      <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Transacciones</p>
                      <p className="font-bold text-blue-600">{transacciones.length}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                      <Wallet className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Saldo Actual</p>
                      <p className="font-bold text-purple-600">S/ {miSaldo?.saldo || "0.00"}</p>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="hidden md:grid grid-cols-6 gap-2 p-3 bg-muted/50 text-sm font-medium">
                      <span>Fecha/Hora</span>
                      <span>Concepto</span>
                      <span>Tipo</span>
                      <span className="text-right">Monto</span>
                      <span className="text-right">Saldo Anterior</span>
                      <span className="text-right">Saldo Nuevo</span>
                    </div>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {transacciones.map((t) => (
                        <div 
                          key={t.id} 
                          className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 text-sm hover:bg-muted/30 transition-colors"
                          data-testid={`row-transaccion-${t.id}`}
                        >
                          <div className="md:col-span-1">
                            <p className="font-medium">{format(new Date(t.createdAt), "dd MMM yyyy", { locale: es })}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "HH:mm")}</p>
                          </div>
                          <div className="md:col-span-1">
                            <p className="truncate">{t.concepto}</p>
                            {t.notas && <p className="text-xs text-muted-foreground truncate">{t.notas}</p>}
                          </div>
                          <div className="hidden md:block">
                            <Badge 
                              variant="outline" 
                              className={t.tipo === 'ingreso' ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}
                            >
                              {t.tipo === 'ingreso' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {t.tipo}
                            </Badge>
                          </div>
                          <div className={`text-right font-medium ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.tipo === 'ingreso' ? '+' : '-'} S/ {t.monto}
                          </div>
                          <div className="text-right text-muted-foreground hidden md:block">
                            S/ {t.saldoAnterior}
                          </div>
                          <div className="text-right font-medium hidden md:block">
                            S/ {t.saldoNuevo}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-0">
          {loadingVerificacion ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !vendedorHabilitado ? (
            <BloqueoServicio
              titulo="Completa tu perfil para vender"
              descripcion="Necesitas completar ciertos datos de tu perfil para poder publicar y vender productos en APO-360"
              icono={<ShoppingBag className="h-8 w-8 text-yellow-600" />}
              porcentaje={verificacion?.vendedor?.porcentaje || 0}
              camposFaltantes={verificacion?.vendedor?.camposFaltantes || []}
            />
          ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                  Mi Tienda Online
                </CardTitle>
                <CardDescription>Publica y vende tus productos o servicios</CardDescription>
              </div>
              <Button onClick={() => setShowProductoModal(true)} data-testid="button-nuevo-producto">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </CardHeader>
            <CardContent>
              {loadingProductos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : misProductos.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Sin productos</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Comienza a vender publicando tu primer producto o servicio
                  </p>
                  <Button onClick={() => setShowProductoModal(true)} data-testid="button-publicar-primer-producto">
                    <Plus className="h-4 w-4 mr-2" />
                    Publicar Producto
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {misProductos.map((producto: any) => (
                    <Card key={producto.id} className="hover-elevate" data-testid={`card-producto-${producto.id}`}>
                      <CardContent className="p-4">
                        {producto.imagenUrl && (
                          <img 
                            src={producto.imagenUrl} 
                            alt={producto.nombre} 
                            className="w-full h-32 object-cover rounded mb-3" 
                          />
                        )}
                        <h3 className="font-medium truncate">{producto.nombre}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {producto.descripcion}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-primary">S/. {producto.precio}</span>
                          <Badge variant={producto.activo ? "default" : "secondary"}>
                            {producto.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Button variant="ghost" size="sm" className="flex-1" data-testid={`button-editar-producto-${producto.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </TabsContent>

        <TabsContent value="conductor" className="mt-0">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-500" />
                  Estado de Conductor
                </CardTitle>
                <CardDescription>Gestiona tu perfil de conductor y documentos</CardDescription>
              </CardHeader>
              <CardContent>
                {esConductor ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">Conductor Activo</h3>
                        <p className="text-sm text-muted-foreground">Tu perfil de conductor está habilitado</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Vehículo</p>
                        <p className="font-medium">{user?.vehiculoModelo || 'No registrado'}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Placa</p>
                        <p className="font-medium">{user?.vehiculoPlaca || 'No registrada'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${user?.disponibleTaxi ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Car className={`h-5 w-5 ${user?.disponibleTaxi ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium">Disponibilidad</p>
                          <p className="text-sm text-muted-foreground">
                            {user?.disponibleTaxi ? 'Disponible para viajes' : 'No disponible'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={user?.disponibleTaxi ? "default" : "secondary"}>
                        {user?.disponibleTaxi ? 'En línea' : 'Fuera de línea'}
                      </Badge>
                    </div>

                    <Link href="/taxi">
                      <Button className="w-full" data-testid="button-ir-taxi">
                        <Car className="h-4 w-4 mr-2" />
                        Ir a Panel de Taxi
                      </Button>
                    </Link>

                    {/* Historial de Viajes del Conductor */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Historial de Pasajeros Atendidos
                      </h4>
                      {loadingHistorialViajes ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : historialViajes.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          Aún no tienes viajes completados como conductor
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {historialViajes.map((viaje) => (
                            <div 
                              key={viaje.id} 
                              className="flex items-center justify-between p-3 border rounded-lg"
                              data-testid={`card-viaje-${viaje.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span className="text-sm truncate">{viaje.origenDireccion || 'Origen no especificado'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                                  <span className="text-sm truncate">{viaje.destinoDireccion || 'Destino no especificado'}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(viaje.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                {viaje.precio && (
                                  <span className="font-medium text-green-600">
                                    S/ {parseFloat(viaje.precio).toFixed(2)}
                                  </span>
                                )}
                                <Badge 
                                  variant={viaje.estado === 'completado' ? 'default' : 'secondary'}
                                  className={viaje.estado === 'completado' ? 'bg-green-500' : ''}
                                >
                                  {viaje.estado || 'Pendiente'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {historialViajes.length > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total viajes:</span>
                            <span className="font-medium">{historialViajes.length}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-muted-foreground">Viajes completados:</span>
                            <span className="font-medium text-green-600">
                              {historialViajes.filter(v => v.estado === 'completado').length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-muted-foreground">Ganancias totales:</span>
                            <span className="font-medium text-green-600">
                              S/ {historialViajes
                                .filter(v => v.estado === 'completado' && v.precio)
                                .reduce((sum, v) => sum + parseFloat(v.precio || '0'), 0)
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No eres conductor</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Para ser conductor necesitas completar tu perfil con tus documentos de conducción
                    </p>
                    <Link href="/perfil">
                      <Button data-testid="button-registrar-conductor">
                        Registrarme como Conductor
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Membresías
                </CardTitle>
                <CardDescription>Planes premium con beneficios exclusivos</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMembresia ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : tieneMembresia ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <Crown className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h3 className="font-medium">Membresía {membresia.tipo}</h3>
                        <p className="text-sm text-muted-foreground">
                          Válida hasta: {new Date(membresia.fechaExpiracion).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Beneficios incluidos:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Comisiones reducidas en taxi
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Publicación de productos ilimitada
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Insignia Premium en perfil
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Sin membresía activa</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Obtén beneficios exclusivos con nuestras membresías premium
                    </p>
                    <Button data-testid="button-ver-membresias">
                      <Crown className="h-4 w-4 mr-2" />
                      Ver Planes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="membresia" className="mt-0">
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Mi Saldo
                  </CardTitle>
                  <CardDescription>Saldo disponible para servicios</CardDescription>
                </div>
                <Button onClick={() => setShowRecargaModal(true)} data-testid="button-recargar-saldo">
                  <Plus className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
              </CardHeader>
              <CardContent>
                {loadingSaldo ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-muted-foreground">Saldo Actual</p>
                      <p className="text-3xl font-bold text-green-600" data-testid="text-saldo-actual-membresia">
                        S/ {miSaldo?.saldo || '0.00'}
                      </p>
                      {(() => {
                        const saldoNum = parseFloat(miSaldo?.saldo || '0');
                        return (miSaldo === undefined || isNaN(saldoNum) || saldoNum < 0.50);
                      })() && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1" data-testid="text-saldo-bajo-warning">
                          <AlertCircle className="h-3 w-3" />
                          Saldo bajo - recarga para usar servicios
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Ingresos</p>
                      <p className="text-xl font-bold text-green-500">
                        S/ {miSaldo?.totalIngresos || '0.00'}
                      </p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Egresos</p>
                      <p className="text-xl font-bold text-red-500">
                        S/ {miSaldo?.totalEgresos || '0.00'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Planes de Membresia
                </CardTitle>
                <CardDescription>
                  {tieneMembresia 
                    ? "Tu membresia esta activa. Disfruta de todos los beneficios."
                    : "Elige un plan para acceder a beneficios exclusivos"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tieneMembresia ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                      <Crown className="h-10 w-10 text-yellow-500" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">Membresia {membresia?.plan?.nombre || 'Premium'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Estado: <Badge className="bg-green-500 ml-1">Activa</Badge>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Valida hasta: {membresia?.fechaFin ? new Date(membresia.fechaFin).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Productos creados</p>
                        <p className="text-2xl font-bold">{membresia?.productosCreados || 0}</p>
                      </div>
                    </div>
                    
                    {membresia?.plan?.beneficios && membresia.plan.beneficios.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Tus beneficios:</h4>
                        <ul className="space-y-1">
                          {membresia.plan.beneficios.map((beneficio: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500" />
                              {beneficio}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : loadingPlanes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : planesMembresia.length === 0 ? (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No hay planes disponibles</h3>
                    <p className="text-muted-foreground text-sm">
                      Pronto tendras opciones de membresia disponibles
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {planesMembresia.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          plan.destacado ? 'ring-2 ring-primary border-primary' : ''
                        }`}
                        onClick={() => { setPlanSeleccionado(plan); setShowPlanModal(true); }}
                        data-testid={`card-plan-usuario-${plan.id}`}
                      >
                        {plan.destacado && (
                          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                            Recomendado
                          </Badge>
                        )}
                        <div className="text-center pt-2">
                          <Crown className={`h-8 w-8 mx-auto mb-2 ${plan.destacado ? 'text-primary' : 'text-yellow-500'}`} />
                          <h3 className="font-bold">{plan.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{plan.duracionMeses} mes{plan.duracionMeses > 1 ? 'es' : ''}</p>
                        </div>
                        <div className="text-center my-4">
                          {plan.precioDescuento ? (
                            <>
                              <span className="text-2xl font-bold text-primary">S/ {plan.precioDescuento}</span>
                              <span className="text-sm line-through text-muted-foreground ml-2">S/ {plan.precioNormal}</span>
                              {plan.porcentajeDescuento && (
                                <Badge variant="outline" className="ml-2 text-green-600">-{plan.porcentajeDescuento}%</Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-2xl font-bold">S/ {plan.precioNormal}</span>
                          )}
                        </div>
                        <p className="text-center text-sm text-muted-foreground mb-3">
                          {plan.productosIncluidos === 9999 ? 'Productos ilimitados' : `${plan.productosIncluidos} productos incluidos`}
                        </p>
                        {plan.beneficios && plan.beneficios.length > 0 && (
                          <ul className="space-y-1 text-xs border-t pt-3">
                            {plan.beneficios.slice(0, 3).map((beneficio, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Check className="h-3 w-3 text-green-500 mt-0.5" />
                                <span className="text-muted-foreground">{beneficio}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <Button className="w-full mt-4" size="sm" data-testid={`button-seleccionar-plan-${plan.id}`}>
                          Seleccionar
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  Opciones de Pago
                </CardTitle>
                <CardDescription>Dos formas de acceder a los servicios premium</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <Crown className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Membresia Premium</h4>
                        <p className="text-sm text-muted-foreground">Pago unico mensual</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Acceso a todos los servicios
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Sin limites de publicacion
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Descuentos en comisiones
                      </li>
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("membresia")}
                      data-testid="button-ver-planes-membresia"
                    >
                      Ver Planes
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Wallet className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Recarga de Saldo</h4>
                        <p className="text-sm text-muted-foreground">Paga solo lo que uses</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Recarga minima: S/ 1.00
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Cobro por servicio usado
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Sin compromisos mensuales
                      </li>
                    </ul>
                    <Button 
                      className="w-full"
                      onClick={() => setShowRecargaModal(true)}
                      data-testid="button-recargar-saldo-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Recargar Saldo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {tieneRolLocal && (
          <TabsContent value="negocio" className="mt-0">
            <LocalComercialPanel />
          </TabsContent>
        )}

        {tieneRolCambista && (
          <TabsContent value="cambista" className="mt-0">
            <CambistaPanelUsuario />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showRecargaModal} onOpenChange={setShowRecargaModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              Recargar Saldo
            </DialogTitle>
            <DialogDescription>
              Recarga tu saldo para usar los servicios de la plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            <div>
              <Label htmlFor="monto">Monto a Recargar (minimo S/ 1.00)</Label>
              <Input
                id="monto"
                type="number"
                step="0.50"
                min="1"
                value={montoRecarga}
                onChange={(e) => setMontoRecarga(e.target.value)}
                placeholder="10.00"
                className={`mt-2 ${montoRecarga !== '' && (isNaN(parseFloat(montoRecarga)) || parseFloat(montoRecarga) < 1) ? 'border-red-500' : ''}`}
                data-testid="input-monto-recarga"
              />
              {montoRecarga !== '' && (isNaN(parseFloat(montoRecarga)) || parseFloat(montoRecarga) < 1) && (
                <p className="text-xs text-red-500 mt-1" data-testid="text-error-monto-minimo">
                  El monto minimo de recarga es S/ 1.00
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['5.00', '10.00', '20.00', '50.00'].map((monto) => (
                <Button
                  key={monto}
                  type="button"
                  variant={montoRecarga === monto ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMontoRecarga(monto)}
                  data-testid={`button-monto-${monto}`}
                >
                  S/ {monto}
                </Button>
              ))}
            </div>
            <div>
              <Label htmlFor="metodoPago" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Metodo de Pago - Selecciona y copia el numero
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Toca el numero de cuenta para copiarlo al portapapeles
              </p>
              {loadingMetodos ? (
                <div className="py-2 text-center text-muted-foreground text-sm">Cargando metodos...</div>
              ) : !Array.isArray(metodosPago) || metodosPago.length === 0 ? (
                <div className="py-2 text-center text-muted-foreground text-sm">
                  No hay metodos de pago disponibles
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {metodosPago.filter(m => m.activo).map((metodo: any) => (
                    <div
                      key={metodo.id}
                      className={`p-3 border rounded-lg transition-all ${
                        metodoPagoId === metodo.id ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                      }`}
                      data-testid={`card-metodo-pago-${metodo.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div 
                          className="flex-1 cursor-pointer" 
                          onClick={() => setMetodoPagoId(metodo.id)}
                        >
                          <p className="font-medium flex items-center gap-2">
                            {metodo.nombre}
                            <Badge variant="outline" className="text-xs">{metodo.tipo?.replace('_', ' ')}</Badge>
                          </p>
                          {metodo.titular && (
                            <p className="text-xs text-muted-foreground">Titular: {metodo.titular}</p>
                          )}
                        </div>
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            metodoPagoId === metodo.id ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}
                          onClick={() => setMetodoPagoId(metodo.id)}
                        >
                          {metodoPagoId === metodo.id && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                      
                      {/* Numero de telefono para Yape/Plin */}
                      {metodo.telefono && (metodo.tipo === 'yape' || metodo.tipo === 'plin' || metodo.tipo === 'billetera_digital') && (
                        <div
                          className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors mb-1"
                          onClick={() => {
                            navigator.clipboard.writeText(metodo.telefono);
                            toast({ title: "Numero copiado", description: `${metodo.telefono} copiado - Pegalo en tu app de ${metodo.tipo?.charAt(0).toUpperCase() + metodo.tipo?.slice(1)}` });
                          }}
                          data-testid={`button-copiar-telefono-${metodo.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-green-700 dark:text-green-400">Numero {metodo.tipo?.toUpperCase()}</p>
                              <p className="font-mono text-lg font-bold text-green-800 dark:text-green-300">{metodo.telefono}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <Copy className="h-5 w-5" />
                            <span className="text-xs">Copiar</span>
                          </div>
                        </div>
                      )}

                      {/* Cuenta bancaria */}
                      {(metodo.numeroCuenta || metodo.numero) && (
                        <div
                          className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors mb-1"
                          onClick={() => {
                            const cuenta = metodo.numeroCuenta || metodo.numero;
                            navigator.clipboard.writeText(cuenta);
                            toast({ title: "Cuenta copiada", description: `${cuenta} - Pegalo en tu app bancaria` });
                          }}
                          data-testid={`button-copiar-cuenta-${metodo.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-700 dark:text-blue-400">Cuenta Bancaria</p>
                              <p className="font-mono text-sm font-bold text-blue-800 dark:text-blue-300">{metodo.numeroCuenta || metodo.numero}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Copy className="h-5 w-5" />
                            <span className="text-xs">Copiar</span>
                          </div>
                        </div>
                      )}
                      
                      {/* CCI - Cuenta Interbancaria */}
                      {metodo.cci && (
                        <div
                          className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors mb-1"
                          onClick={() => {
                            navigator.clipboard.writeText(metodo.cci);
                            toast({ title: "CCI copiado", description: `${metodo.cci} - Pegalo para transferencia interbancaria` });
                          }}
                          data-testid={`button-copiar-cci-${metodo.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-xs text-purple-700 dark:text-purple-400">Cuenta Interbancaria (CCI)</p>
                              <p className="font-mono text-sm font-bold text-purple-800 dark:text-purple-300">{metodo.cci}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-purple-600">
                            <Copy className="h-5 w-5" />
                            <span className="text-xs">Copiar</span>
                          </div>
                        </div>
                      )}

                      {/* Email para PayPal */}
                      {metodo.email && metodo.tipo === 'paypal' && (
                        <div
                          className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors mb-1"
                          onClick={() => {
                            navigator.clipboard.writeText(metodo.email);
                            toast({ title: "PayPal copiado", description: `${metodo.email} - Pegalo en PayPal para enviar pago` });
                          }}
                          data-testid={`button-copiar-paypal-${metodo.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-yellow-600" />
                            <div>
                              <p className="text-xs text-yellow-700 dark:text-yellow-400">Cuenta PayPal</p>
                              <p className="font-mono text-sm font-bold text-yellow-800 dark:text-yellow-300">{metodo.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Copy className="h-5 w-5" />
                            <span className="text-xs">Copiar</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="imagenComprobante" className="flex items-center gap-1">
                Imagen del Boucher / Comprobante
                <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sube una foto clara del comprobante de pago (obligatorio)
              </p>
              {imagenComprobanteUrl ? (
                <div className="relative mt-2">
                  <img 
                    src={imagenComprobanteUrl} 
                    alt="Comprobante" 
                    className="w-full h-40 object-contain border rounded-lg bg-muted"
                    data-testid="img-comprobante-preview"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagenComprobante(null);
                      setImagenComprobanteUrl("");
                    }}
                    data-testid="button-eliminar-comprobante"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-2"
                  data-testid="label-upload-comprobante"
                >
                  {subiendoComprobante ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span className="text-sm text-muted-foreground">Subiendo imagen...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Toca para subir foto del boucher</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG hasta 25MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSubirComprobante(file);
                    }}
                    disabled={subiendoComprobante}
                    data-testid="input-file-comprobante"
                  />
                </label>
              )}
            </div>
            <div>
              <Label htmlFor="numeroOperacion">Numero de Operacion (opcional)</Label>
              <Input
                id="numeroOperacion"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                placeholder="Ej: 123456789"
                className="mt-2"
                data-testid="input-numero-operacion"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecargaModal(false)} data-testid="button-cancelar-recarga">
              Cancelar
            </Button>
            <Button 
              onClick={() => solicitarRecargaMutation.mutate({ 
                monto: montoRecarga, 
                metodoPagoId, 
                comprobante: imagenComprobanteUrl,
                numeroOperacion 
              })}
              disabled={
                isNaN(parseFloat(montoRecarga)) || 
                parseFloat(montoRecarga) < 1 || 
                !metodoPagoId || 
                !imagenComprobanteUrl || 
                subiendoComprobante ||
                solicitarRecargaMutation.isPending
              }
              data-testid="button-enviar-recarga"
            >
              {solicitarRecargaMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanModal} onOpenChange={(open) => { setShowPlanModal(open); if (!open) setPlanSeleccionado(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Contratar Membresia
            </DialogTitle>
            <DialogDescription>
              Confirma tu suscripcion al plan seleccionado
            </DialogDescription>
          </DialogHeader>
          {planSeleccionado && (
            <div className="py-4">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg mb-4">
                <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold">{planSeleccionado.nombre}</h3>
                <p className="text-sm text-muted-foreground">{planSeleccionado.duracionMeses} mes{planSeleccionado.duracionMeses > 1 ? 'es' : ''}</p>
                <div className="mt-3">
                  {planSeleccionado.precioDescuento ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-primary">S/ {planSeleccionado.precioDescuento}</span>
                      <span className="text-lg line-through text-muted-foreground">S/ {planSeleccionado.precioNormal}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">S/ {planSeleccionado.precioNormal}</span>
                  )}
                </div>
              </div>

              {planSeleccionado.descripcion && (
                <p className="text-sm text-muted-foreground mb-4">{planSeleccionado.descripcion}</p>
              )}

              <div className="mb-4">
                <h4 className="font-medium mb-2">Incluye:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {planSeleccionado.productosIncluidos === 9999 ? 'Productos ilimitados' : `${planSeleccionado.productosIncluidos} productos para publicar`}
                  </li>
                  {planSeleccionado.beneficios?.map((beneficio, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {beneficio}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Tu membresia quedara pendiente de aprobacion y se activara una vez confirmado el pago.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPlanModal(false); setPlanSeleccionado(null); }} data-testid="button-cancelar-membresia">
              Cancelar
            </Button>
            <Button 
              onClick={() => planSeleccionado && contratarMembresiaMutation.mutate(planSeleccionado.id)}
              disabled={!planSeleccionado || contratarMembresiaMutation.isPending}
              data-testid="button-confirmar-membresia"
            >
              {contratarMembresiaMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Contratar Membresia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductoModal} onOpenChange={setShowProductoModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
            <DialogDescription>
              Publica un producto o servicio para vender
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre del producto *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Celular Samsung Galaxy"
                value={productoForm.nombre}
                onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                data-testid="input-producto-nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe tu producto..."
                value={productoForm.descripcion}
                onChange={(e) => setProductoForm({ ...productoForm, descripcion: e.target.value })}
                data-testid="input-producto-descripcion"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="precio">Precio (S/.)</Label>
                <Input
                  id="precio"
                  type="number"
                  placeholder="0.00"
                  value={productoForm.precio}
                  onChange={(e) => setProductoForm({ ...productoForm, precio: e.target.value })}
                  data-testid="input-producto-precio"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  placeholder="Ej: Electrónica"
                  value={productoForm.categoria}
                  onChange={(e) => setProductoForm({ ...productoForm, categoria: e.target.value })}
                  data-testid="input-producto-categoria"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Imagen del producto</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para subir una imagen
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast({ title: "Producto publicado (demo)", description: "Esta funcionalidad se implementará próximamente" });
              setShowProductoModal(false);
            }} data-testid="button-guardar-producto">
              Publicar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
