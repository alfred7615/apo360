import { useState } from "react";
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
  User, Camera, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import BloqueoServicio, { useVerificarPerfil } from "@/components/BloqueoServicio";

export default function PanelUsuarioPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("favoritos");
  const [showProductoModal, setShowProductoModal] = useState(false);
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            <p className="text-sm text-muted-foreground">Membresía</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="favoritos" className="gap-2" data-testid="tab-favoritos">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Favoritos</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2" data-testid="tab-marketplace">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Mi Tienda</span>
          </TabsTrigger>
          <TabsTrigger value="conductor" className="gap-2" data-testid="tab-conductor">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Conductor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favoritos" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Mis Favoritos
              </CardTitle>
              <CardDescription>Contenido que has guardado</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoritos.map((fav) => (
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

                        {fav.tipoContenido === 'popup' && fav.detalle && (
                          <div>
                            {fav.detalle.imagenUrl && (
                              <img 
                                src={fav.detalle.imagenUrl} 
                                alt={fav.detalle.titulo} 
                                className="w-full h-24 object-cover rounded mb-3" 
                              />
                            )}
                            <h3 className="font-medium truncate">{fav.detalle.titulo}</h3>
                            <Badge variant="outline" className="mt-1">
                              {fav.detalle.tipo || "publicidad"}
                            </Badge>
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
                  ))}
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
      </Tabs>

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
