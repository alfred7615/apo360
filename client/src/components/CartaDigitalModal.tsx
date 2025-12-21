import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, Minus, Share2, ShoppingCart, Store, Star, 
  UtensilsCrossed, MessageCircle, X
} from "lucide-react";
import { SiFacebook, SiWhatsapp, SiInstagram } from "react-icons/si";

interface ItemCatalogoLocal {
  id: string;
  catalogoId: string;
  categoriaId?: string | null;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  precio1?: string;
  precio2?: string;
  precio3?: string;
  precio4?: string;
  etiquetaPrecio1?: string;
  etiquetaPrecio2?: string;
  etiquetaPrecio3?: string;
  etiquetaPrecio4?: string;
  precio?: string;
  precioOferta?: string;
  imagenUrl?: string;
  disponible?: boolean;
  destacado?: boolean;
}

interface CategoriaCatalogoLocal {
  id: string;
  catalogoId: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  imagenUrl?: string;
  orden?: number;
  activo?: boolean;
  categoriaPadreId?: string | null;
  etiquetaPrecio1?: string;
  etiquetaPrecio2?: string;
  etiquetaPrecio3?: string;
  etiquetaPrecio4?: string;
}

interface CatalogoLocal {
  id: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  logoUrl?: string;
  bannerUrl?: string;
  activo?: boolean;
  categorias?: CategoriaCatalogoLocal[];
  items?: ItemCatalogoLocal[];
}

interface DatosNegocio {
  nombreNegocio?: string;
  logoUrl?: string;
  bannerUrl?: string;
  fotoLocal1?: string;
  fotoLocal2?: string;
}

interface TasaCambio {
  monedaOrigenCodigo: string;
  monedaDestinoCodigo: string;
  tasaVenta: string;
}

interface SeleccionPrecio {
  precioIndex: number;
  cantidad: number;
  precio: number;
  etiqueta: string;
}

interface CartaDigitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogo: CatalogoLocal | null;
  datosNegocio?: DatosNegocio | null;
}

const MONEDAS = [
  { codigo: "PEN", simbolo: "S/", nombre: "Sol Peruano" },
  { codigo: "USD", simbolo: "$", nombre: "Dólar" },
  { codigo: "CLP", simbolo: "$", nombre: "Peso Chileno" },
  { codigo: "BOB", simbolo: "Bs", nombre: "Boliviano" },
  { codigo: "ARS", simbolo: "$", nombre: "Peso Argentino" },
];

export function CartaDigitalModal({ open, onOpenChange, catalogo, datosNegocio }: CartaDigitalModalProps) {
  const { toast } = useToast();
  const [monedaSeleccionada, setMonedaSeleccionada] = useState("PEN");
  const [selecciones, setSelecciones] = useState<Record<string, SeleccionPrecio[]>>({});

  const { data: tasasCambio = [] } = useQuery<TasaCambio[]>({
    queryKey: ["/api/monedas/tasas-locales"],
    enabled: open,
  });

  const obtenerTasaConversion = (monedaDestino: string): number => {
    if (monedaDestino === "PEN") return 1;
    const tasa = tasasCambio.find(
      (t) => t.monedaOrigenCodigo === "PEN" && t.monedaDestinoCodigo === monedaDestino
    );
    return tasa ? parseFloat(tasa.tasaVenta) : 1;
  };

  const convertirPrecio = (precioPEN: number): number => {
    const tasa = obtenerTasaConversion(monedaSeleccionada);
    return precioPEN * tasa;
  };

  const formatearPrecio = (precio: number): string => {
    const moneda = MONEDAS.find((m) => m.codigo === monedaSeleccionada);
    return `${moneda?.simbolo || "S/"} ${precio.toFixed(2)}`;
  };

  const obtenerPreciosItem = (item: ItemCatalogoLocal) => {
    const precios: { index: number; precio: number; etiqueta: string }[] = [];
    
    if (item.precio1 && parseFloat(item.precio1) > 0) {
      precios.push({ index: 1, precio: parseFloat(item.precio1), etiqueta: item.etiquetaPrecio1 || "Personal" });
    }
    if (item.precio2 && parseFloat(item.precio2) > 0) {
      precios.push({ index: 2, precio: parseFloat(item.precio2), etiqueta: item.etiquetaPrecio2 || "Mediana" });
    }
    if (item.precio3 && parseFloat(item.precio3) > 0) {
      precios.push({ index: 3, precio: parseFloat(item.precio3), etiqueta: item.etiquetaPrecio3 || "Familiar" });
    }
    if (item.precio4 && parseFloat(item.precio4) > 0) {
      precios.push({ index: 4, precio: parseFloat(item.precio4), etiqueta: item.etiquetaPrecio4 || "Extra" });
    }
    
    if (precios.length === 0 && item.precio) {
      precios.push({ index: 0, precio: parseFloat(item.precio), etiqueta: "Precio" });
    }
    if (precios.length === 0 && item.precioOferta) {
      precios.push({ index: 0, precio: parseFloat(item.precioOferta), etiqueta: "Oferta" });
    }
    
    return precios;
  };

  const actualizarCantidad = (itemId: string, precioIndex: number, precio: number, etiqueta: string, delta: number) => {
    setSelecciones((prev) => {
      const itemSelecciones = prev[itemId] || [];
      const existente = itemSelecciones.find((s) => s.precioIndex === precioIndex);
      
      if (existente) {
        const nuevaCantidad = Math.max(0, existente.cantidad + delta);
        if (nuevaCantidad === 0) {
          return {
            ...prev,
            [itemId]: itemSelecciones.filter((s) => s.precioIndex !== precioIndex),
          };
        }
        return {
          ...prev,
          [itemId]: itemSelecciones.map((s) =>
            s.precioIndex === precioIndex ? { ...s, cantidad: nuevaCantidad } : s
          ),
        };
      } else if (delta > 0) {
        return {
          ...prev,
          [itemId]: [...itemSelecciones, { precioIndex, cantidad: 1, precio, etiqueta }],
        };
      }
      return prev;
    });
  };

  const obtenerCantidad = (itemId: string, precioIndex: number): number => {
    const itemSelecciones = selecciones[itemId] || [];
    return itemSelecciones.find((s) => s.precioIndex === precioIndex)?.cantidad || 0;
  };

  const calcularTotal = (): number => {
    let total = 0;
    Object.values(selecciones).forEach((itemSels) => {
      itemSels.forEach((sel) => {
        total += sel.precio * sel.cantidad;
      });
    });
    return total;
  };

  const totalItems = useMemo(() => {
    let count = 0;
    Object.values(selecciones).forEach((itemSels) => {
      itemSels.forEach((sel) => {
        count += sel.cantidad;
      });
    });
    return count;
  }, [selecciones]);

  const agregarAlCarrito = async () => {
    if (!catalogo) return;
    
    try {
      for (const [itemId, itemSels] of Object.entries(selecciones)) {
        const item = (catalogo.items || []).find((i) => i.id === itemId);
        if (!item) continue;
        
        for (const sel of itemSels) {
          await apiRequest("POST", "/api/carrito", {
            itemCatalogoId: itemId,
            catalogoId: catalogo.id,
            cantidad: sel.cantidad,
            tipoProducto: "item_catalogo",
            precioUnitario: sel.precio.toString(),
            etiquetaPrecio: `${item.nombre} - ${sel.etiqueta}`,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
      
      toast({
        title: "Agregado al carrito",
        description: `${totalItems} producto(s) agregado(s)`,
      });
      
      setSelecciones({});
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo agregar al carrito",
      });
    }
  };

  const compartirWhatsApp = () => {
    const url = window.location.origin + `/carta/${catalogo?.id}`;
    const mensaje = encodeURIComponent(
      `¡Mira la carta digital de ${datosNegocio?.nombreNegocio || catalogo?.nombre}! ${url}`
    );
    window.open(`https://wa.me/?text=${mensaje}`, "_blank");
  };

  const compartirFacebook = () => {
    const url = window.location.origin + `/carta/${catalogo?.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const generarCodigoCategoria = (index: number): string => {
    return `${index + 1}.00`;
  };

  const generarCodigoItem = (catIndex: number, itemIndex: number): string => {
    return `${catIndex + 1}.${String(itemIndex + 1).padStart(2, "0")}`;
  };

  if (!catalogo) return null;

  const categoriasPrincipales = (catalogo.categorias || []).filter((c) => !c.categoriaPadreId);
  const items = catalogo.items || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[95vh] max-h-[95vh] p-0 flex flex-col overflow-hidden" data-testid="modal-carta-digital">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={datosNegocio?.logoUrl || catalogo.logoUrl} alt="Logo" />
                <AvatarFallback>
                  <Store className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg truncate flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-primary shrink-0" />
                  Carta Digital
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {datosNegocio?.nombreNegocio || catalogo.nombre}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              {(datosNegocio?.bannerUrl || catalogo.bannerUrl) && (
                <img
                  src={datosNegocio?.bannerUrl || catalogo.bannerUrl}
                  alt="Local"
                  className="h-12 w-20 object-cover rounded"
                />
              )}
              {datosNegocio?.fotoLocal1 && (
                <img
                  src={datosNegocio.fotoLocal1}
                  alt="Local"
                  className="h-12 w-20 object-cover rounded hidden sm:block"
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
            <Select value={monedaSeleccionada} onValueChange={setMonedaSeleccionada}>
              <SelectTrigger className="w-[140px]" data-testid="select-moneda">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map((m) => (
                  <SelectItem key={m.codigo} value={m.codigo}>
                    {m.simbolo} {m.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-1">
              <Button size="icon" variant="outline" onClick={compartirWhatsApp} data-testid="btn-compartir-whatsapp">
                <SiWhatsapp className="h-4 w-4 text-green-500" />
              </Button>
              <Button size="icon" variant="outline" onClick={compartirFacebook} data-testid="btn-compartir-facebook">
                <SiFacebook className="h-4 w-4 text-blue-600" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={async () => {
                  const url = window.location.origin + `/carta/${catalogo?.id}`;
                  const shareData = {
                    title: `Carta Digital - ${datosNegocio?.nombreNegocio || catalogo?.nombre}`,
                    text: `¡Mira la carta digital de ${datosNegocio?.nombreNegocio || catalogo?.nombre}!`,
                    url: url,
                  };
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch (err) {
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Enlace copiado",
                        description: "El enlace ha sido copiado al portapapeles",
                      });
                    }
                  } else {
                    navigator.clipboard.writeText(url);
                    toast({
                      title: "Enlace copiado",
                      description: "El enlace ha sido copiado al portapapeles",
                    });
                  }
                }}
                data-testid="btn-compartir-general"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto touch-pan-y" data-testid="scroll-carta">
          <div className="p-4 space-y-6">
            {categoriasPrincipales.length === 0 && items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay productos en este catálogo</p>
              </div>
            )}

            {categoriasPrincipales.map((categoria, catIndex) => {
              const itemsCategoria = items.filter(
                (item) => item.categoriaId === categoria.id && item.disponible !== false
              );
              const subcategorias = (catalogo.categorias || []).filter(
                (sub) => sub.categoriaPadreId === categoria.id
              );

              if (itemsCategoria.length === 0 && subcategorias.length === 0) return null;

              return (
                <div key={categoria.id} className="space-y-3" data-testid={`categoria-${categoria.id}`}>
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {categoria.codigo || generarCodigoCategoria(catIndex)}
                    </Badge>
                    {categoria.icono && <span className="text-lg">{categoria.icono}</span>}
                    <h3 className="font-semibold text-lg">{categoria.nombre}</h3>
                  </div>

                  <div className="grid gap-3">
                    {itemsCategoria.map((item, itemIndex) => {
                      const precios = obtenerPreciosItem(item);
                      const codigoItem = item.codigo || generarCodigoItem(catIndex, itemIndex);

                      return (
                        <Card key={item.id} className="overflow-hidden" data-testid={`carta-item-${item.id}`}>
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                              {item.imagenUrl && (
                                <img
                                  src={item.imagenUrl}
                                  alt={item.nombre}
                                  className="w-full sm:w-24 h-32 sm:h-24 object-cover"
                                />
                              )}
                              <div className="flex-1 p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {codigoItem}
                                    </Badge>
                                    <h4 className="font-medium">{item.nombre}</h4>
                                    {item.destacado && (
                                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {item.descripcion && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {item.descripcion}
                                  </p>
                                )}

                                {precios.length > 0 ? (
                                  <div className="space-y-2">
                                    {precios.map((p) => (
                                      <div
                                        key={p.index}
                                        className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {p.etiqueta}
                                          </Badge>
                                          <span className="font-bold text-primary">
                                            {formatearPrecio(convertirPrecio(p.precio))}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, -1)
                                            }
                                            data-testid={`btn-menos-${item.id}-${p.index}`}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <Input
                                            type="number"
                                            min={0}
                                            value={obtenerCantidad(item.id, p.index)}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                                              const current = obtenerCantidad(item.id, p.index);
                                              actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, val - current);
                                            }}
                                            className="w-14 h-8 text-center"
                                            data-testid={`input-cantidad-${item.id}-${p.index}`}
                                          />
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, 1)
                                            }
                                            data-testid={`btn-mas-${item.id}-${p.index}`}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Sin precio definido</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {subcategorias.map((subcategoria, subIndex) => {
                      const itemsSub = items.filter(
                        (item) => item.categoriaId === subcategoria.id && item.disponible !== false
                      );
                      if (itemsSub.length === 0) return null;

                      return (
                        <div key={subcategoria.id} className="ml-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {subcategoria.codigo || `${catIndex + 1}.${subIndex + 1}`}
                            </Badge>
                            {subcategoria.icono && <span>{subcategoria.icono}</span>}
                            <h4 className="font-medium text-muted-foreground">{subcategoria.nombre}</h4>
                          </div>
                          
                          {itemsSub.map((item, itemIndex) => {
                            const precios = obtenerPreciosItem(item);
                            const codigoItem = item.codigo || `${catIndex + 1}.${subIndex + 1}.${String(itemIndex + 1).padStart(2, "0")}`;

                            return (
                              <Card key={item.id} className="overflow-hidden" data-testid={`carta-item-${item.id}`}>
                                <CardContent className="p-0">
                                  <div className="flex flex-col sm:flex-row">
                                    {item.imagenUrl && (
                                      <img
                                        src={item.imagenUrl}
                                        alt={item.nombre}
                                        className="w-full sm:w-20 h-28 sm:h-20 object-cover"
                                      />
                                    )}
                                    <div className="flex-1 p-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                          {codigoItem}
                                        </Badge>
                                        <h5 className="font-medium text-sm">{item.nombre}</h5>
                                      </div>
                                      
                                      {precios.length > 0 && (
                                        <div className="space-y-1">
                                          {precios.map((p) => (
                                            <div
                                              key={p.index}
                                              className="flex items-center justify-between gap-2 text-sm"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{p.etiqueta}:</span>
                                                <span className="font-bold text-primary">
                                                  {formatearPrecio(convertirPrecio(p.precio))}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-6 w-6"
                                                  onClick={() =>
                                                    actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, -1)
                                                  }
                                                >
                                                  <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center text-sm">
                                                  {obtenerCantidad(item.id, p.index)}
                                                </span>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-6 w-6"
                                                  onClick={() =>
                                                    actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, 1)
                                                  }
                                                >
                                                  <Plus className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {items.filter((item) => !item.categoriaId && item.disponible !== false).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Badge variant="outline" className="font-mono text-xs">0.00</Badge>
                  <h3 className="font-semibold text-lg">Otros productos</h3>
                </div>
                <div className="grid gap-3">
                  {items
                    .filter((item) => !item.categoriaId && item.disponible !== false)
                    .map((item, itemIndex) => {
                      const precios = obtenerPreciosItem(item);
                      const codigoItem = item.codigo || `0.${String(itemIndex + 1).padStart(2, "0")}`;

                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                              {item.imagenUrl && (
                                <img
                                  src={item.imagenUrl}
                                  alt={item.nombre}
                                  className="w-full sm:w-24 h-32 sm:h-24 object-cover"
                                />
                              )}
                              <div className="flex-1 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {codigoItem}
                                  </Badge>
                                  <h4 className="font-medium">{item.nombre}</h4>
                                </div>
                                
                                {precios.length > 0 && (
                                  <div className="space-y-2">
                                    {precios.map((p) => (
                                      <div
                                        key={p.index}
                                        className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {p.etiqueta}
                                          </Badge>
                                          <span className="font-bold text-primary">
                                            {formatearPrecio(convertirPrecio(p.precio))}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, -1)
                                            }
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <Input
                                            type="number"
                                            min={0}
                                            value={obtenerCantidad(item.id, p.index)}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                                              const current = obtenerCantidad(item.id, p.index);
                                              actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, val - current);
                                            }}
                                            className="w-14 h-8 text-center"
                                          />
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              actualizarCantidad(item.id, p.index, p.precio, p.etiqueta, 1)
                                            }
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-background shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Total ({totalItems} items)</p>
                <p className="text-2xl font-bold text-primary" data-testid="total-carta">
                  {formatearPrecio(convertirPrecio(calcularTotal()))}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelecciones({});
                  onOpenChange(false);
                }}
                data-testid="btn-cerrar-carta"
              >
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </Button>
              <Button
                onClick={agregarAlCarrito}
                disabled={totalItems === 0}
                className="gap-2"
                data-testid="btn-agregar-carrito"
              >
                <ShoppingCart className="h-4 w-4" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
