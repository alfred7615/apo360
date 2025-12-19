import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
import { Heart, Bookmark, Share2, Eye, Star, Store, ChevronRight, Clock, Package } from "lucide-react";
import type { ItemCatalogo, CatalogoLocal } from "@shared/schema";

interface CatalogoConItems extends CatalogoLocal {
  items: ItemCatalogo[];
}

export default function SeccionLocalesComerciales() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [productoSeleccionado, setProductoSeleccionado] = useState<ItemCatalogo | null>(null);
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState<CatalogoConItems | null>(null);

  const { data: itemsDestacados = [], isLoading: cargandoDestacados } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/items-destacados"],
  });

  const { data: itemsRecientes = [], isLoading: cargandoRecientes } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/items-recientes"],
  });

  const { data: catalogosConItems = [], isLoading: cargandoCatalogos } = useQuery<CatalogoConItems[]>({
    queryKey: ["/api/catalogos-con-items"],
  });

  const registrarVistaMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("POST", `/api/items-catalogo/${itemId}/vista`);
    },
  });

  const interaccionMutation = useMutation({
    mutationFn: async ({ itemId, tipo }: { itemId: string; tipo: string }) => {
      return await apiRequest("POST", `/api/items-catalogo/${itemId}/interaccion`, { tipo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items-destacados"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items-recientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/catalogos-con-items"] });
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
    registrarVistaMutation.mutate(item.id);
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

  const ProductoCard = ({ item, tamanio = "normal" }: { item: ItemCatalogo; tamanio?: "normal" | "pequeno" }) => {
    const esGrande = tamanio === "normal";
    
    return (
      <Card 
        className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden transition-all"
        onClick={() => handleVerProducto(item)}
        data-testid={`card-producto-${item.id}`}
      >
        <div className={`relative ${esGrande ? 'h-48' : 'h-32'}`}>
          {item.imagenUrl ? (
            <img
              src={item.imagenUrl}
              alt={item.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {item.destacado && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Destacado
            </Badge>
          )}
          
          {item.precioOferta && item.precio && parseFloat(item.precioOferta) < parseFloat(item.precio) && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
              Oferta
            </Badge>
          )}
        </div>
        
        <CardContent className={`${esGrande ? 'p-4' : 'p-3'}`}>
          <h3 className={`font-semibold truncate ${esGrande ? 'text-base' : 'text-sm'}`}>
            {item.nombre}
          </h3>
          
          {esGrande && item.descripcion && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {item.descripcion}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              {item.precioOferta && item.precio && parseFloat(item.precioOferta) < parseFloat(item.precio) ? (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrecio(item.precio)}
                  </span>
                  <span className="font-bold text-green-600">
                    {formatPrecio(item.precioOferta)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-primary">
                  {formatPrecio(item.precio)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-1 text-xs">
                <Heart className="h-3 w-3" />
                <span>{item.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Eye className="h-3 w-3" />
                <span>{item.vistas || 0}</span>
              </div>
            </div>
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Tiendas Locales</h2>
          </div>
          <p className="text-muted-foreground">
            Descubre productos y servicios de negocios de tu comunidad
          </p>
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
        <DialogContent className="max-w-lg">
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
                
                <div className="flex items-center justify-between">
                  <div>
                    {productoSeleccionado.precioOferta && productoSeleccionado.precio &&
                     parseFloat(productoSeleccionado.precioOferta) < parseFloat(productoSeleccionado.precio) ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrecio(productoSeleccionado.precio)}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrecio(productoSeleccionado.precioOferta)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {formatPrecio(productoSeleccionado.precio)}
                      </span>
                    )}
                  </div>
                  
                  {productoSeleccionado.tiempoPreparacion && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {productoSeleccionado.tiempoPreparacion}
                    </Badge>
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
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{productoSeleccionado.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bookmark className="h-4 w-4" />
                      <span className="text-sm">{productoSeleccionado.favoritos || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{productoSeleccionado.vistas || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraccion(productoSeleccionado.id, "like");
                      }}
                      data-testid="button-like-producto"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraccion(productoSeleccionado.id, "favorito");
                      }}
                      data-testid="button-favorito-producto"
                    >
                      <Bookmark className="h-4 w-4" />
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
    </section>
  );
}
