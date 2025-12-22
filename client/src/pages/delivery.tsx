import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Store, Search, Star, Clock, Heart, Bookmark, Share2, Eye, 
  Package, ShoppingCart, Zap, Loader2, MapPin, Truck, Filter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface Servicio {
  id: string;
  categoria: string;
  nombreServicio: string;
  descripcion?: string;
  logoUrl?: string;
  direccion?: string;
  telefono?: string;
  horario?: string;
  estado: string;
}

interface LogoServicio {
  id: string;
  nombre: string;
  logoUrl?: string;
  categoria?: string;
  subcategoria?: string;
  estado: string;
}

interface ItemCatalogo {
  id: string;
  catalogoId: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  precio?: string;
  precio1?: string;
  precio2?: string;
  precio3?: string;
  precio4?: string;
  etiquetaPrecio1?: string;
  etiquetaPrecio2?: string;
  etiquetaPrecio3?: string;
  etiquetaPrecio4?: string;
  precioOferta?: string;
  codigo?: string;
  destacado?: boolean;
  disponible?: boolean;
  vistas?: number;
  likes?: number;
  favoritos?: number;
}

interface CatalogoConItems {
  id: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  logoUrl?: string;
  estado: string;
  items: ItemCatalogo[];
}

export default function DeliveryPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { abrirCarrito } = useCart();
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosVisibles, setProductosVisibles] = useState<ItemCatalogo[]>([]);
  const [cargandoMas, setCargandoMas] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const centinelaRef = useRef<HTMLDivElement>(null);
  const PRODUCTOS_POR_PAGINA = 12;

  const { data: servicios = [] } = useQuery<Servicio[]>({
    queryKey: ["/api/servicios"],
  });

  const { data: logosServicio = [] } = useQuery<LogoServicio[]>({
    queryKey: ["/api/logos-servicio"],
  });

  const { data: catalogosConItems = [] } = useQuery<CatalogoConItems[]>({
    queryKey: ["/api/catalogos-con-items"],
  });

  const { data: itemsDestacados = [] } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/items-destacados"],
  });

  const { data: mapaInteraccionesUsuario = {} } = useQuery<Record<string, { like: boolean; favorito: boolean }>>({
    queryKey: ["/api/mis-interacciones-productos"],
    enabled: isAuthenticated,
  });

  const todosLosProductos = catalogosConItems.flatMap(c => c.items);

  useEffect(() => {
    const productosIniciales = todosLosProductos.slice(0, PRODUCTOS_POR_PAGINA);
    setProductosVisibles(productosIniciales);
    setPaginaActual(1);
  }, [catalogosConItems]);

  const cargarMasProductos = useCallback(() => {
    if (cargandoMas) return;
    
    const inicio = paginaActual * PRODUCTOS_POR_PAGINA;
    const fin = inicio + PRODUCTOS_POR_PAGINA;
    const nuevosProductos = todosLosProductos.slice(inicio, fin);
    
    if (nuevosProductos.length > 0) {
      setCargandoMas(true);
      setTimeout(() => {
        setProductosVisibles(prev => [...prev, ...nuevosProductos]);
        setPaginaActual(prev => prev + 1);
        setCargandoMas(false);
      }, 500);
    }
  }, [paginaActual, todosLosProductos, cargandoMas]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cargarMasProductos();
        }
      },
      { threshold: 0.1 }
    );

    if (centinelaRef.current) {
      observerRef.current.observe(centinelaRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [cargarMasProductos]);

  const interaccionMutation = useMutation({
    mutationFn: async ({ itemId, tipo }: { itemId: string; tipo: string }) => {
      const res = await apiRequest("POST", `/api/items-catalogo/${itemId}/interaccion`, { tipo });
      return { itemId, tipo, resultado: await res.json() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalogos-con-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mis-interacciones-productos"] });
    },
  });

  const handleInteraccion = (itemId: string, tipo: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para interactuar con los productos",
      });
      return;
    }
    interaccionMutation.mutate({ itemId, tipo });
  };

  const usuarioHaDadoLike = (itemId: string): boolean => {
    return mapaInteraccionesUsuario[itemId]?.like || false;
  };

  const usuarioHaDadoFavorito = (itemId: string): boolean => {
    return mapaInteraccionesUsuario[itemId]?.favorito || false;
  };

  const formatPrecio = (precio: string | number | null | undefined) => {
    if (precio === null || precio === undefined) return "S/ 0.00";
    const num = typeof precio === "string" ? parseFloat(precio) : precio;
    if (isNaN(num)) return "S/ 0.00";
    return `S/ ${num.toFixed(2)}`;
  };

  const handleAgregarCarrito = async (item: ItemCatalogo, irAPago: boolean = false) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/carrito", {
        itemCatalogoId: item.id,
        tipoProducto: "item_catalogo",
        cantidad: 1,
        precioSeleccionado: 1,
        etiquetaPrecio: item.etiquetaPrecio1 || "Unidad",
        precioUnitario: item.precio1 || item.precio,
        catalogoId: item.catalogoId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      
      if (irAPago) {
        abrirCarrito("pago");
      } else {
        toast({
          title: "Agregado al carrito",
          description: `${item.nombre} se agregó correctamente`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar al carrito",
        variant: "destructive",
      });
    }
  };

  const productosFiltrados = busqueda
    ? productosVisibles.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : productosVisibles;

  const serviciosFiltrados = busqueda
    ? servicios.filter(s => 
        s.nombreServicio.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.categoria?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : servicios;

  const hayMasProductos = productosVisibles.length < todosLosProductos.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-12 z-30 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios, productos, tiendas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
                data-testid="input-buscar-delivery"
              />
            </div>
            <Button variant="outline" size="icon" data-testid="button-filtrar">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {logosServicio.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-500" />
              Servicios Disponibles
            </h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {logosServicio.slice(0, 12).map((logo) => (
                  <Card 
                    key={logo.id} 
                    className="flex-shrink-0 w-20 hover-elevate cursor-pointer"
                    data-testid={`card-logo-servicio-${logo.id}`}
                  >
                    <CardContent className="p-3 flex flex-col items-center gap-2">
                      {logo.logoUrl ? (
                        <img
                          src={logo.logoUrl}
                          alt={logo.nombre}
                          className="h-10 w-10 object-contain rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Store className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="text-[10px] text-center font-medium line-clamp-2">
                        {logo.nombre}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        {itemsDestacados.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Recomendados
            </h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {itemsDestacados.map((item) => (
                  <Card 
                    key={item.id} 
                    className="flex-shrink-0 w-40 hover-elevate cursor-pointer overflow-hidden"
                    data-testid={`card-recomendado-${item.id}`}
                  >
                    <div className="h-28 relative">
                      {item.imagenUrl ? (
                        <img
                          src={item.imagenUrl}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      {item.destacado && (
                        <Badge className="absolute top-1 left-1 bg-yellow-500 text-white text-[8px] px-1">
                          <Star className="h-2 w-2 fill-current mr-0.5" />
                          Top
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <h3 className="text-xs font-medium line-clamp-2 mb-1">{item.nombre}</h3>
                      <p className="text-sm font-bold text-primary">{formatPrecio(item.precio1 || item.precio)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        {catalogosConItems.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-green-500" />
              Tiendas Locales
            </h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {catalogosConItems.map((catalogo) => (
                  <Card 
                    key={catalogo.id} 
                    className="flex-shrink-0 w-36 hover-elevate cursor-pointer"
                    data-testid={`card-tienda-${catalogo.id}`}
                  >
                    <CardContent className="p-3 flex flex-col items-center gap-2">
                      {catalogo.logoUrl ? (
                        <img
                          src={catalogo.logoUrl}
                          alt={catalogo.nombre}
                          className="h-14 w-14 object-cover rounded-full"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Store className="h-7 w-7 text-white" />
                        </div>
                      )}
                      <span className="text-xs text-center font-medium line-clamp-2">
                        {catalogo.nombre}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {catalogo.items.length} productos
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Todos los Productos
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {productosFiltrados.map((item) => (
              <Card 
                key={item.id} 
                className="hover-elevate cursor-pointer overflow-hidden flex flex-col"
                data-testid={`card-producto-${item.id}`}
              >
                <div className="h-28 relative overflow-hidden">
                  {item.imagenUrl ? (
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  {item.precioOferta && parseFloat(item.precioOferta) < parseFloat(item.precio || "0") && (
                    <Badge className="absolute top-1 right-1 bg-red-500 text-white text-[8px]">
                      Oferta
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-2 flex flex-col flex-1">
                  {item.codigo && (
                    <span className="text-[9px] font-mono text-primary font-semibold bg-primary/10 px-1 rounded w-fit mb-0.5">
                      {item.codigo}
                    </span>
                  )}
                  <h3 className="text-xs font-medium line-clamp-2 mb-1 flex-1">{item.nombre}</h3>
                  <p className="text-sm font-bold text-primary mb-2">{formatPrecio(item.precio1 || item.precio)}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInteraccion(item.id, "like");
                        }}
                        className="flex items-center gap-0.5"
                        data-testid={`button-like-${item.id}`}
                      >
                        <Heart className={`h-3 w-3 ${usuarioHaDadoLike(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-500'}`} />
                        <span className="text-[9px] text-muted-foreground">{item.likes || 0}</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInteraccion(item.id, "favorito");
                        }}
                        className="flex items-center gap-0.5"
                        data-testid={`button-favorito-${item.id}`}
                      >
                        <Bookmark className={`h-3 w-3 ${usuarioHaDadoFavorito(item.id) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600 dark:text-gray-500'}`} />
                        <span className="text-[9px] text-muted-foreground">{item.favoritos || 0}</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{item.vistas || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-6 text-[10px] px-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAgregarCarrito(item, false);
                      }}
                      data-testid={`button-carrito-${item.id}`}
                    >
                      <ShoppingCart className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-6 text-[10px] px-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAgregarCarrito(item, true);
                      }}
                      data-testid={`button-comprar-${item.id}`}
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {hayMasProductos && (
            <div 
              ref={centinelaRef} 
              className="flex justify-center py-8"
              data-testid="loading-sentinel"
            >
              {cargandoMas ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando más productos...</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Desliza para ver más productos
                </span>
              )}
            </div>
          )}
          
          {!hayMasProductos && productosVisibles.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-sm">Has visto todos los productos disponibles</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
