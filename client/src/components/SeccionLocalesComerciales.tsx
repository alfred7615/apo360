import { useState, type MouseEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useGeoFilter } from "@/contexts/GeoFilterContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Heart, Bookmark, Share2, Eye, Star, Store, ChevronRight, Clock, Package, ShoppingCart, Zap } from "lucide-react";
import GeoFilterBar from "@/components/GeoFilterBar";
import { Checkbox } from "@/components/ui/checkbox";
import type { ItemCatalogo, CatalogoLocal } from "@shared/schema";

interface CatalogoConItems extends CatalogoLocal {
  items: ItemCatalogo[];
}

interface ItemCatalogoExtendido extends ItemCatalogo {
  categoriaNombre?: string;
}

export default function SeccionLocalesComerciales() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { abrirCarrito } = useCart();
  const { filtros, queryParams } = useGeoFilter();
  const [productoSeleccionado, setProductoSeleccionado] = useState<ItemCatalogo | null>(null);
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState<CatalogoConItems | null>(null);
  const [preciosSeleccionados, setPreciosSeleccionados] = useState<number[]>([]);
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [misInteracciones, setMisInteracciones] = useState<Record<string, { like: boolean; favorito: boolean }>>({});
  const [modalPrecio, setModalPrecio] = useState<{ abierto: boolean; item: ItemCatalogo | null; accion: 'carrito' | 'comprar' }>({ abierto: false, item: null, accion: 'carrito' });

  const { data: itemsDestacados = [], isLoading: cargandoDestacados } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/items-destacados", filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.paisId) params.set("paisId", filtros.paisId);
      if (filtros.ciudadId) params.set("ciudadId", filtros.ciudadId);
      if (filtros.busqueda) params.set("busqueda", filtros.busqueda);
      if (filtros.ordenamiento) params.set("orden", filtros.ordenamiento);
      const res = await fetch(`/api/items-destacados?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching items destacados");
      return res.json();
    },
  });

  const { data: itemsRecientes = [], isLoading: cargandoRecientes } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/items-recientes", filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.paisId) params.set("paisId", filtros.paisId);
      if (filtros.ciudadId) params.set("ciudadId", filtros.ciudadId);
      if (filtros.busqueda) params.set("busqueda", filtros.busqueda);
      if (filtros.ordenamiento) params.set("orden", filtros.ordenamiento);
      const res = await fetch(`/api/items-recientes?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching items recientes");
      return res.json();
    },
  });

  const { data: catalogosConItems = [], isLoading: cargandoCatalogos } = useQuery<CatalogoConItems[]>({
    queryKey: ["/api/catalogos-con-items", filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.paisId) params.set("paisId", filtros.paisId);
      if (filtros.ciudadId) params.set("ciudadId", filtros.ciudadId);
      if (filtros.busqueda) params.set("busqueda", filtros.busqueda);
      if (filtros.ordenamiento) params.set("orden", filtros.ordenamiento);
      const res = await fetch(`/api/catalogos-con-items?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching catalogos");
      return res.json();
    },
  });

  const { data: favoritosUsuario = [] } = useQuery<any[]>({
    queryKey: ["/api/favoritos"],
    enabled: isAuthenticated,
  });

  const { data: misFavoritosProductos = [] } = useQuery<any[]>({
    queryKey: ["/api/mis-favoritos-productos"],
    enabled: isAuthenticated,
  });

  const { data: mapaInteraccionesUsuario = {} } = useQuery<Record<string, { like: boolean; favorito: boolean }>>({
    queryKey: ["/api/mis-interacciones-productos"],
    enabled: isAuthenticated,
  });

  const registrarVistaMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("POST", `/api/items-catalogo/${itemId}/vista`);
    },
  });

  const interaccionMutation = useMutation({
    mutationFn: async ({ itemId, tipo }: { itemId: string; tipo: string }) => {
      const res = await apiRequest("POST", `/api/items-catalogo/${itemId}/interaccion`, { tipo });
      return { itemId, tipo, resultado: await res.json() };
    },
    onSuccess: (data) => {
      const { itemId, tipo, resultado } = data;
      setMisInteracciones(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [tipo]: resultado.activo,
        }
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/items-destacados"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items-recientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/catalogos-con-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mis-favoritos-productos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mis-interacciones-productos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favoritos"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar la interacción",
        variant: "destructive",
      });
    },
  });

  const handleVerProducto = (item: ItemCatalogo) => {
    setProductoSeleccionado(item);
    setPreciosSeleccionados([]);
    setCantidadProducto(1);
    registrarVistaMutation.mutate(item.id);
  };

  const togglePrecioSeleccionado = (index: number) => {
    setPreciosSeleccionados(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAgregarSeleccionadosCarrito = async (item: ItemCatalogo): Promise<boolean> => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
      });
      return false;
    }

    const preciosValidos = [
      { precio: item.precio1, etiqueta: item.etiquetaPrecio1 || "Personal", num: 1 },
      { precio: item.precio2, etiqueta: item.etiquetaPrecio2 || "Mediana", num: 2 },
      { precio: item.precio3, etiqueta: item.etiquetaPrecio3 || "Familiar", num: 3 },
      { precio: item.precio4, etiqueta: item.etiquetaPrecio4 || "Extra", num: 4 }
    ].filter(p => p.precio && parseFloat(String(p.precio)) > 0);

    const preciosAComprar = preciosSeleccionados.length > 0
      ? preciosSeleccionados.map(idx => preciosValidos[idx]).filter(Boolean)
      : [preciosValidos[0] || { precio: item.precio, etiqueta: "Unidad", num: 1 }];

    setAgregandoCarrito(true);
    try {
      for (const precioInfo of preciosAComprar) {
        await apiRequest("POST", "/api/carrito", {
          itemCatalogoId: item.id,
          tipoProducto: "item_catalogo",
          cantidad: cantidadProducto,
          precioSeleccionado: precioInfo.num,
          etiquetaPrecio: precioInfo.etiqueta,
          precioUnitario: precioInfo.precio,
          catalogoId: item.catalogoId,
        });
      }
      toast({
        title: "Agregado al carrito",
        description: `${cantidadProducto} x ${item.nombre} (${preciosAComprar.length} tamaño(s)) agregado(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
      setPreciosSeleccionados([]);
      setCantidadProducto(1);
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar al carrito",
        variant: "destructive",
      });
      return false;
    } finally {
      setAgregandoCarrito(false);
    }
  };

  const handleComprarSeleccionados = async (item: ItemCatalogo) => {
    const exito = await handleAgregarSeleccionadosCarrito(item);
    if (exito) {
      setProductoSeleccionado(null);
      toast({
        title: "Producto agregado",
        description: "Ve al carrito para completar tu pedido",
      });
    }
  };

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
    if (misInteracciones[itemId]?.like !== undefined) {
      return misInteracciones[itemId].like;
    }
    return mapaInteraccionesUsuario[itemId]?.like || false;
  };

  const usuarioHaDadoFavorito = (itemId: string): boolean => {
    if (misInteracciones[itemId]?.favorito !== undefined) {
      return misInteracciones[itemId].favorito;
    }
    return mapaInteraccionesUsuario[itemId]?.favorito || false;
  };

  const handleCompartir = async (item: ItemCatalogo) => {
    const shareData = {
      title: item.nombre,
      text: item.descripcion || `Mira este producto: ${item.nombre}`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        if (isAuthenticated) {
          interaccionMutation.mutate({ itemId: item.id, tipo: "compartido" });
        }
      } catch (error) {
        console.log("Error al compartir:", error);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Enlace copiado",
        description: "Comparte este enlace con tus amigos",
      });
    }
  };

  const formatPrecio = (precio: string | number | null | undefined) => {
    if (precio === null || precio === undefined) return "S/ 0.00";
    const num = typeof precio === "string" ? parseFloat(precio) : precio;
    if (isNaN(num)) return "S/ 0.00";
    return `S/ ${num.toFixed(2)}`;
  };

  const obtenerPreciosValidos = (item: ItemCatalogo) => {
    return [
      { precio: item.precio1, etiqueta: item.etiquetaPrecio1 || "Personal", num: 1 },
      { precio: item.precio2, etiqueta: item.etiquetaPrecio2 || "Mediana", num: 2 },
      { precio: item.precio3, etiqueta: item.etiquetaPrecio3 || "Familiar", num: 3 },
      { precio: item.precio4, etiqueta: item.etiquetaPrecio4 || "Extra", num: 4 }
    ].filter(p => p.precio && parseFloat(String(p.precio)) > 0);
  };

  const handleClickCarrito = (item: ItemCatalogo, accion: 'carrito' | 'comprar', e?: MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
      });
      return;
    }
    
    const preciosValidos = obtenerPreciosValidos(item);
    
    if (preciosValidos.length > 1) {
      setModalPrecio({ abierto: true, item, accion });
    } else {
      handleAgregarCarritoDirecto(item, 1, accion);
    }
  };

  const handleAgregarCarritoDirecto = async (item: ItemCatalogo, precioSeleccionado: number = 1, accion: 'carrito' | 'comprar' = 'carrito'): Promise<boolean> => {
    const preciosValidos = obtenerPreciosValidos(item);
    const precioInfo = preciosValidos.find(p => p.num === precioSeleccionado) || preciosValidos[0] || { precio: item.precio, etiqueta: "Unidad", num: 1 };
    
    try {
      await apiRequest("POST", "/api/carrito", {
        itemCatalogoId: item.id,
        tipoProducto: "item_catalogo",
        cantidad: 1,
        precioSeleccionado: precioInfo.num,
        etiquetaPrecio: precioInfo.etiqueta,
        precioUnitario: precioInfo.precio,
        catalogoId: item.catalogoId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
      
      if (accion === 'comprar') {
        abrirCarrito("pago");
      } else {
        toast({
          title: "Agregado al carrito",
          description: `${item.nombre} se agregó correctamente`,
        });
      }
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar al carrito",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleConfirmarPrecioModal = (precioNum: number) => {
    if (modalPrecio.item) {
      handleAgregarCarritoDirecto(modalPrecio.item, precioNum, modalPrecio.accion);
      setModalPrecio({ abierto: false, item: null, accion: 'carrito' });
    }
  };

  const ProductoCard = ({ item, tamanio = "normal" }: { item: ItemCatalogo; tamanio?: "normal" | "pequeno" }) => {
    const esGrande = tamanio === "normal";
    const tieneOferta = item.precioOferta && item.precio && parseFloat(String(item.precioOferta)) < parseFloat(String(item.precio));
    
    const preciosValidos = [
      { precio: item.precio1, etiqueta: item.etiquetaPrecio1 || "Personal" },
      { precio: item.precio2, etiqueta: item.etiquetaPrecio2 || "Mediana" },
      { precio: item.precio3, etiqueta: item.etiquetaPrecio3 || "Familiar" },
      { precio: item.precio4, etiqueta: item.etiquetaPrecio4 || "Extra" }
    ].filter(p => p.precio && parseFloat(String(p.precio)) > 0);
    
    return (
      <Card 
        className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden transition-all flex flex-col h-full"
        onClick={() => handleVerProducto(item)}
        data-testid={`card-producto-${item.id}`}
      >
        <div className={`relative ${esGrande ? 'h-40' : 'h-28'}`}>
          {item.imagenUrl ? (
            <img
              src={item.imagenUrl}
              alt={item.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
              <Package className={`${esGrande ? 'h-10 w-10' : 'h-8 w-8'} text-muted-foreground/50`} />
            </div>
          )}
          
          <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-none">
            {item.destacado ? (
              <div className="bg-yellow-500 text-white px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-[10px] font-semibold">Destacado</span>
              </div>
            ) : <div />}
            
            {tieneOferta && (
              <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-md shadow-md">
                <span className="text-[10px] font-bold">OFERTA</span>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className={`${esGrande ? 'p-3' : 'p-2'} flex flex-col flex-1`}>
          {item.codigo && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-1 rounded">
                {item.codigo}
              </span>
              {(item as ItemCatalogoExtendido).categoriaNombre && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {(item as ItemCatalogoExtendido).categoriaNombre}
                </span>
              )}
            </div>
          )}
          
          <h3 className={`font-semibold leading-tight ${esGrande ? 'text-sm line-clamp-2 min-h-[2.5rem]' : 'text-xs line-clamp-2 min-h-[2rem]'}`}>
            {item.nombre}
          </h3>
          
          <div className={`mt-1.5 flex-1 ${esGrande ? 'space-y-0.5' : ''}`}>
            {preciosValidos.length > 0 ? (
              <div className={`grid ${preciosValidos.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-2 gap-y-0.5`}>
                {preciosValidos.slice(0, esGrande ? 4 : 2).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground truncate">{p.etiqueta}</span>
                    <span className="font-bold text-primary ml-1">{formatPrecio(p.precio)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {tieneOferta ? (
                  <>
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatPrecio(item.precio)}
                    </span>
                    <span className={`font-bold text-green-600 ${esGrande ? 'text-sm' : 'text-xs'}`}>
                      {formatPrecio(item.precioOferta)}
                    </span>
                  </>
                ) : (
                  <span className={`font-bold text-primary ${esGrande ? 'text-sm' : 'text-xs'}`}>
                    {formatPrecio(item.precio)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInteraccion(item.id, "like");
                }}
                className="flex items-center gap-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                data-testid={`button-like-${item.id}`}
              >
                <Heart className={`h-3.5 w-3.5 ${usuarioHaDadoLike(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-500'}`} />
                <span className="text-[10px]">{item.likes || 0}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInteraccion(item.id, "favorito");
                }}
                className="flex items-center gap-0.5 text-muted-foreground hover:text-yellow-500 transition-colors"
                data-testid={`button-favorito-${item.id}`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${usuarioHaDadoFavorito(item.id) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600 dark:text-gray-500'}`} />
                <span className="text-[10px]">{item.favoritos || 0}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompartir(item);
                }}
                className="text-muted-foreground hover:text-blue-500 transition-colors"
                data-testid={`button-compartir-${item.id}`}
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{item.vistas || 0}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 mt-2 ${esGrande ? '' : 'mt-1'}`}>
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 ${esGrande ? 'h-7 text-xs' : 'h-6 text-[10px] px-1'}`}
              onClick={(e) => handleClickCarrito(item, 'carrito', e)}
              data-testid={`button-carrito-${item.id}`}
            >
              <ShoppingCart className={`${esGrande ? 'h-3 w-3 mr-1' : 'h-3 w-3'}`} />
              {esGrande && 'Carrito'}
            </Button>
            <Button
              size="sm"
              className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 ${esGrande ? 'h-7 text-xs' : 'h-6 text-[10px] px-1'}`}
              onClick={(e) => handleClickCarrito(item, 'comprar', e)}
              data-testid={`button-comprar-${item.id}`}
            >
              <Zap className={`${esGrande ? 'h-3 w-3 mr-1' : 'h-3 w-3'}`} />
              {esGrande && 'Comprar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const tieneContenido = itemsDestacados.length > 0 || itemsRecientes.length > 0 || catalogosConItems.length > 0;

  if (!tieneContenido && !cargandoDestacados && !cargandoRecientes && !cargandoCatalogos) {
    return null;
  }

  return (
    <section className="py-8" data-testid="seccion-locales-comerciales">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Tiendas Locales</h2>
          </div>
          <p className="text-muted-foreground">
            Descubre productos y servicios de negocios de tu comunidad
          </p>
        </div>

        {/* Barra de Filtros */}
        <div className="mb-6">
          <GeoFilterBar 
            mostrarBusqueda={true}
            mostrarOrdenamiento={true}
            placeholderBusqueda="Buscar productos o tiendas..."
          />
        </div>

        {itemsDestacados.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                Productos Destacados
              </h3>
            </div>
            
            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full"
              data-testid="carrusel-productos-destacados"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {itemsDestacados.map((item) => (
                  <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <ProductoCard item={item} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" data-testid="button-carrusel-anterior" />
              <CarouselNext className="hidden md:flex -right-4" data-testid="button-carrusel-siguiente" />
            </Carousel>
          </div>
        )}

        {itemsRecientes.length > 0 && (
          <div className="mb-8" data-testid="seccion-productos-recientes">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Productos Recientes
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="grid-productos-recientes">
              {itemsRecientes.slice(0, 12).map((item) => (
                <ProductoCard key={item.id} item={item} tamanio="pequeno" />
              ))}
            </div>
          </div>
        )}

        {catalogosConItems.length > 0 && (
          <div className="space-y-8" data-testid="seccion-negocios-locales">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5 text-purple-500" />
              Negocios Locales
            </h3>
            
            {catalogosConItems.map((catalogo) => (
              catalogo.items.length > 0 && (
                <Card key={catalogo.id} className="p-4" data-testid={`catalogo-${catalogo.id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {catalogo.logoUrl ? (
                        <img
                          src={catalogo.logoUrl}
                          alt={catalogo.nombre}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">{catalogo.nombre}</h4>
                        {catalogo.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {catalogo.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCatalogoSeleccionado(catalogo)}
                      data-testid={`button-ver-catalogo-${catalogo.id}`}
                    >
                      Ver todo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {catalogo.items.slice(0, 6).map((item) => (
                      <ProductoCard key={item.id} item={item} tamanio="pequeno" />
                    ))}
                  </div>
                </Card>
              )
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!productoSeleccionado} onOpenChange={() => setProductoSeleccionado(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {productoSeleccionado && (
            <>
              <DialogHeader>
                <DialogTitle>{productoSeleccionado.nombre}</DialogTitle>
                {productoSeleccionado.descripcion && (
                  <DialogDescription>
                    {productoSeleccionado.descripcion}
                  </DialogDescription>
                )}
              </DialogHeader>
              
              <div className="space-y-4">
                {productoSeleccionado.imagenUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={productoSeleccionado.imagenUrl}
                      alt={productoSeleccionado.nombre}
                      className="w-full h-full object-cover"
                    />
                    {productoSeleccionado.destacado && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Selecciona tamaños para comprar:</h4>
                    {productoSeleccionado.tiempoPreparacion && (
                      <Badge variant="outline" className="shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {productoSeleccionado.tiempoPreparacion}
                      </Badge>
                    )}
                  </div>
                  {(() => {
                    const preciosValidos = [
                      { precio: productoSeleccionado.precio1, etiqueta: productoSeleccionado.etiquetaPrecio1 || "Personal" },
                      { precio: productoSeleccionado.precio2, etiqueta: productoSeleccionado.etiquetaPrecio2 || "Mediana" },
                      { precio: productoSeleccionado.precio3, etiqueta: productoSeleccionado.etiquetaPrecio3 || "Familiar" },
                      { precio: productoSeleccionado.precio4, etiqueta: productoSeleccionado.etiquetaPrecio4 || "Extra" }
                    ].filter(p => p.precio && parseFloat(String(p.precio)) > 0);
                    
                    if (preciosValidos.length > 0) {
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {preciosValidos.map((p, idx) => (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                preciosSeleccionados.includes(idx) 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                togglePrecioSeleccionado(idx);
                              }}
                              data-testid={`checkbox-precio-${idx}`}
                            >
                              <Checkbox 
                                checked={preciosSeleccionados.includes(idx)}
                                onCheckedChange={() => togglePrecioSeleccionado(idx)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Seleccionar ${p.etiqueta}`}
                              />
                              <div className="flex-1 flex items-center justify-between">
                                <span className="text-sm font-medium">{p.etiqueta}</span>
                                <span className="font-bold text-primary">{formatPrecio(p.precio)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (productoSeleccionado.precioOferta && productoSeleccionado.precio &&
                       parseFloat(String(productoSeleccionado.precioOferta)) < parseFloat(String(productoSeleccionado.precio))) {
                      return (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span className="text-lg text-muted-foreground line-through">
                            {formatPrecio(productoSeleccionado.precio)}
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrecio(productoSeleccionado.precioOferta)}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrecio(productoSeleccionado.precio)}
                        </span>
                      </div>
                    );
                  })()}
                  
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <span className="text-sm font-medium">Cantidad:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCantidadProducto(Math.max(1, cantidadProducto - 1))}
                        disabled={cantidadProducto <= 1}
                        data-testid="button-decrementar-cantidad"
                      >
                        <span className="text-lg font-bold">-</span>
                      </Button>
                      <span className="text-xl font-bold w-8 text-center" data-testid="text-cantidad">
                        {cantidadProducto}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCantidadProducto(cantidadProducto + 1)}
                        data-testid="button-incrementar-cantidad"
                      >
                        <span className="text-lg font-bold">+</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleAgregarSeleccionadosCarrito(productoSeleccionado)}
                      disabled={agregandoCarrito}
                      data-testid="button-agregar-carrito-modal"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {agregandoCarrito ? "Agregando..." : "Agregar al Carrito"}
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                      onClick={() => handleComprarSeleccionados(productoSeleccionado)}
                      disabled={agregandoCarrito}
                      data-testid="button-comprar-modal"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Comprar Ahora
                    </Button>
                  </div>
                  
                  {preciosSeleccionados.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {preciosSeleccionados.length} tamaño(s) seleccionado(s)
                    </p>
                  )}
                </div>
                
                {productoSeleccionado.ingredientes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Ingredientes</h4>
                    <p className="text-sm text-muted-foreground">
                      {productoSeleccionado.ingredientes}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className={`h-4 w-4 ${usuarioHaDadoLike(productoSeleccionado.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      <span className="text-sm">{productoSeleccionado.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className={`h-4 w-4 ${usuarioHaDadoFavorito(productoSeleccionado.id) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                      <span className="text-sm">{productoSeleccionado.favoritos || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{productoSeleccionado.vistas || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant={usuarioHaDadoLike(productoSeleccionado.id) ? "default" : "outline"}
                      className={usuarioHaDadoLike(productoSeleccionado.id) ? "bg-red-500 hover:bg-red-600" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraccion(productoSeleccionado.id, "like");
                      }}
                      data-testid="button-like-producto"
                    >
                      <Heart className={`h-4 w-4 ${usuarioHaDadoLike(productoSeleccionado.id) ? 'fill-white text-white' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant={usuarioHaDadoFavorito(productoSeleccionado.id) ? "default" : "outline"}
                      className={usuarioHaDadoFavorito(productoSeleccionado.id) ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraccion(productoSeleccionado.id, "favorito");
                      }}
                      data-testid="button-favorito-producto"
                    >
                      <Bookmark className={`h-4 w-4 ${usuarioHaDadoFavorito(productoSeleccionado.id) ? 'fill-white text-white' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompartir(productoSeleccionado);
                      }}
                      data-testid="button-compartir-producto"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!catalogoSeleccionado} onOpenChange={() => setCatalogoSeleccionado(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {catalogoSeleccionado && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {catalogoSeleccionado.logoUrl ? (
                    <img
                      src={catalogoSeleccionado.logoUrl}
                      alt={catalogoSeleccionado.nombre}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <DialogTitle>{catalogoSeleccionado.nombre}</DialogTitle>
                    {catalogoSeleccionado.descripcion && (
                      <DialogDescription>
                        {catalogoSeleccionado.descripcion}
                      </DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {catalogoSeleccionado.items.map((item) => (
                  <ProductoCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={modalPrecio.abierto} onOpenChange={(open) => !open && setModalPrecio({ abierto: false, item: null, accion: 'carrito' })}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" data-testid="modal-seleccion-precio">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Selecciona el tamaño
            </DialogTitle>
            <DialogDescription>
              {modalPrecio.item?.nombre}
            </DialogDescription>
          </DialogHeader>
          
          {modalPrecio.item && (
            <div className="grid gap-2 py-4">
              {obtenerPreciosValidos(modalPrecio.item).map((opcion) => (
                <Button
                  key={opcion.num}
                  variant="outline"
                  className="w-full justify-between h-12 text-left"
                  onClick={() => handleConfirmarPrecioModal(opcion.num)}
                  data-testid={`button-precio-${opcion.num}`}
                >
                  <span className="font-medium">{opcion.etiqueta}</span>
                  <Badge variant="secondary" className="text-base font-bold">
                    {formatPrecio(opcion.precio)}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
