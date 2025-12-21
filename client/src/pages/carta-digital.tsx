import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, Plus, Minus, Store, MapPin, Phone, Clock, 
  Search, ArrowLeft, Loader2, Check
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ItemCatalogo {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  precioOferta: string | null;
  imagenUrl: string | null;
  disponible: boolean;
  destacado: boolean;
  orden: number;
}

interface CategoriaCatalogo {
  id: string;
  catalogoId: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  orden: number;
  activo: boolean;
}

interface CatalogoData {
  catalogo: {
    id: string;
    localComercialId: string;
    nombre: string;
    descripcion: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    colorPrimario: string;
    colorSecundario: string;
    moneda: string;
    activo: boolean;
  };
  negocio: {
    id: string;
    nombreNegocio: string;
    direccion: string | null;
    telefono: string | null;
    horarioAtencion: string | null;
    logoUrl: string | null;
  };
  categorias: (CategoriaCatalogo & { items: ItemCatalogo[] })[];
}

interface CarritoItem {
  itemId: string;
  cantidad: number;
}

export default function CartaDigital() {
  const [, params] = useRoute("/carta/:catalogoId");
  const catalogoId = params?.catalogoId;
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<Map<string, CarritoItem>>(new Map());
  const [agregando, setAgregando] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<CatalogoData>({
    queryKey: ["/api/carta-digital", catalogoId],
    enabled: !!catalogoId,
  });

  const agregarAlCarritoMutation = useMutation({
    mutationFn: async ({ itemId, cantidad }: { itemId: string; cantidad: number }) => {
      return await apiRequest("POST", "/api/carrito", {
        itemCatalogoId: itemId,
        catalogoId: catalogoId,
        cantidad,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
      toast({
        title: "Agregado al carrito",
        description: "El producto se agregó correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar al carrito",
        variant: "destructive",
      });
    },
  });

  const agregarAlCarrito = (item: ItemCatalogo) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
        variant: "destructive",
      });
      return;
    }

    setAgregando(item.id);
    
    const actual = carrito.get(item.id);
    const nuevaCantidad = (actual?.cantidad || 0) + 1;
    
    setCarrito(prev => {
      const nuevo = new Map(prev);
      nuevo.set(item.id, { itemId: item.id, cantidad: nuevaCantidad });
      return nuevo;
    });

    agregarAlCarritoMutation.mutate(
      { itemId: item.id, cantidad: 1 },
      {
        onSettled: () => setAgregando(null),
      }
    );
  };

  const formatPrecio = (precio: string, moneda: string = "PEN") => {
    const simbolos: Record<string, string> = {
      PEN: "S/",
      USD: "$",
      CLP: "CLP$",
      ARS: "AR$",
      BOB: "Bs",
    };
    return `${simbolos[moneda] || "S/"} ${parseFloat(precio).toFixed(2)}`;
  };

  const itemsFiltrados = data?.categorias
    .filter(cat => !categoriaActiva || cat.id === categoriaActiva)
    .flatMap(cat => 
      cat.items.filter(item => 
        item.disponible && 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-carta">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" data-testid="error-carta">
        <Store className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Catálogo no encontrado</h2>
        <p className="text-muted-foreground mb-4">Este catálogo no existe o no está disponible</p>
        <Button onClick={() => window.history.back()} variant="outline" data-testid="button-volver">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const { catalogo, negocio, categorias } = data;

  return (
    <div className="min-h-screen bg-background">
      {catalogo.bannerUrl && (
        <div 
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${catalogo.bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6" data-testid="card-negocio-info">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {(catalogo.logoUrl || negocio.logoUrl) && (
                <img 
                  src={catalogo.logoUrl || negocio.logoUrl || ""} 
                  alt={negocio.nombreNegocio}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold" data-testid="text-nombre-negocio">
                  {catalogo.nombre || negocio.nombreNegocio}
                </h1>
                {catalogo.descripcion && (
                  <p className="text-muted-foreground mt-1">{catalogo.descripcion}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                  {negocio.direccion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {negocio.direccion}
                    </span>
                  )}
                  {negocio.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {negocio.telefono}
                    </span>
                  )}
                  {negocio.horarioAtencion && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {negocio.horarioAtencion}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-0 z-10 bg-background py-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
              data-testid="input-buscar-producto"
            />
          </div>
          
          {categorias.length > 1 && (
            <ScrollArea className="w-full mt-3">
              <div className="flex gap-2 pb-2">
                <Badge
                  variant={!categoriaActiva ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setCategoriaActiva(null)}
                  data-testid="badge-categoria-todas"
                >
                  Todas
                </Badge>
                {categorias.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={categoriaActiva === cat.id ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setCategoriaActiva(cat.id)}
                    data-testid={`badge-categoria-${cat.id}`}
                  >
                    {cat.nombre}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {categorias.map((categoria) => {
          if (categoriaActiva && categoria.id !== categoriaActiva) return null;
          
          const itemsCategoria = categoria.items.filter(
            item => item.disponible && item.nombre.toLowerCase().includes(busqueda.toLowerCase())
          );
          
          if (itemsCategoria.length === 0) return null;

          return (
            <div key={categoria.id} className="mb-8" data-testid={`seccion-categoria-${categoria.id}`}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {categoria.imagenUrl && (
                  <img src={categoria.imagenUrl} alt="" className="w-6 h-6 rounded" />
                )}
                {categoria.nombre}
              </h2>
              
              <div className="grid gap-3">
                {itemsCategoria.map((item) => (
                  <Card key={item.id} className="overflow-hidden" data-testid={`card-producto-${item.id}`}>
                    <CardContent className="p-0">
                      <div className="flex">
                        {item.imagenUrl && (
                          <img
                            src={item.imagenUrl}
                            alt={item.nombre}
                            className="w-24 h-24 object-cover"
                          />
                        )}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium" data-testid={`text-nombre-item-${item.id}`}>
                                {item.nombre}
                              </h3>
                              {item.destacado && (
                                <Badge variant="secondary" className="text-xs">
                                  Destacado
                                </Badge>
                              )}
                            </div>
                            {item.descripcion && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              {item.precioOferta ? (
                                <>
                                  <span className="font-bold text-primary" data-testid={`text-precio-${item.id}`}>
                                    {formatPrecio(item.precioOferta, catalogo.moneda)}
                                  </span>
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatPrecio(item.precio, catalogo.moneda)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-bold" data-testid={`text-precio-${item.id}`}>
                                  {formatPrecio(item.precio, catalogo.moneda)}
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => agregarAlCarrito(item)}
                              disabled={agregando === item.id}
                              data-testid={`button-agregar-${item.id}`}
                            >
                              {agregando === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : carrito.has(item.id) ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  {carrito.get(item.id)?.cantidad}
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {itemsFiltrados.length === 0 && (
          <div className="text-center py-12" data-testid="empty-productos">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
