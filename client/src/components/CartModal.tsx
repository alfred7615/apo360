import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Minus, Plus, ShoppingBag, Store, ArrowRight, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartModalProps {
  abierto: boolean;
  onClose: () => void;
}

interface CarritoItem {
  id: string;
  productoId: string | null;
  itemCatalogoId: string | null;
  catalogoId: string | null;
  nombreProducto: string | null;
  precioUnitario: string | null;
  cantidad: number;
  imagenProducto: string | null;
  notas: string | null;
}

interface ResumenGrupo {
  catalogoId: string | null;
  localComercialId: string | null;
  nombreNegocio: string;
  items: CarritoItem[];
  subtotal: number;
}

interface ResumenCarrito {
  grupos: ResumenGrupo[];
  totalGeneral: number;
  totalItems: number;
  moneda: string;
}

const MONEDAS = [
  { codigo: "PEN", nombre: "Sol Peruano", bandera: "🇵🇪", simbolo: "S/" },
  { codigo: "USD", nombre: "Dólar USA", bandera: "🇺🇸", simbolo: "$" },
  { codigo: "CLP", nombre: "Peso Chileno", bandera: "🇨🇱", simbolo: "CLP$" },
  { codigo: "ARS", nombre: "Peso Argentino", bandera: "🇦🇷", simbolo: "AR$" },
  { codigo: "BOB", nombre: "Boliviano", bandera: "🇧🇴", simbolo: "Bs" },
];

export default function CartModal({ abierto, onClose }: CartModalProps) {
  const { toast } = useToast();
  const [monedaSeleccionada, setMonedaSeleccionada] = useState("PEN");
  const [totalConvertido, setTotalConvertido] = useState<number | null>(null);
  const [tasaUsada, setTasaUsada] = useState<number>(1);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const { data: resumen, isLoading } = useQuery<ResumenCarrito>({
    queryKey: ["/api/carrito/resumen"],
    enabled: abierto,
  });

  useEffect(() => {
    const convertir = async () => {
      if (!resumen?.totalGeneral || monedaSeleccionada === "PEN") {
        setTotalConvertido(resumen?.totalGeneral || 0);
        setTasaUsada(1);
        return;
      }

      setConvirtiendo(true);
      try {
        const resp = await fetch(
          `/api/convertir-precio?monto=${resumen.totalGeneral}&monedaOrigen=PEN&monedaDestino=${monedaSeleccionada}`
        );
        const data = await resp.json();
        setTotalConvertido(data.montoConvertido);
        setTasaUsada(data.tasaUsada);
      } catch (error) {
        console.error("Error al convertir:", error);
        setTotalConvertido(resumen.totalGeneral);
        setTasaUsada(1);
      } finally {
        setConvirtiendo(false);
      }
    };

    convertir();
  }, [resumen?.totalGeneral, monedaSeleccionada]);

  const actualizarCantidadMutation = useMutation({
    mutationFn: async ({ id, cantidad }: { id: string; cantidad: number }) => {
      await apiRequest("PATCH", `/api/carrito/${id}`, { cantidad });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la cantidad",
      });
    },
  });

  const eliminarItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/carrito/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
      toast({
        title: "Eliminado",
        description: "Producto eliminado del carrito",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
      });
    },
  });

  const monedaActual = MONEDAS.find((m) => m.codigo === monedaSeleccionada) || MONEDAS[0];

  const formatearPrecio = (precio: number) => {
    return precio.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCambiarCantidad = (item: CarritoItem, delta: number) => {
    const nuevaCantidad = Math.max(1, item.cantidad + delta);
    actualizarCantidadMutation.mutate({ id: item.id, cantidad: nuevaCantidad });
  };

  const handleEliminar = (id: string) => {
    eliminarItemMutation.mutate(id);
  };

  const handleProcederPago = () => {
    onClose();
    window.location.href = "/mi-panel?tab=tienda";
  };

  const carritoVacio = !resumen?.grupos || resumen.grupos.length === 0;

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            Mi Carrito
            {resumen?.totalItems ? (
              <Badge variant="secondary" className="ml-2">
                {resumen.totalItems} {resumen.totalItems === 1 ? "item" : "items"}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Revisa tu pedido y selecciona la moneda de pago
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : carritoVacio ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Tu carrito está vacío</p>
            <p className="text-sm text-muted-foreground/70">
              Explora nuestros productos y agrega lo que te guste
            </p>
            <Button onClick={onClose} className="mt-4" data-testid="button-explorar-productos">
              Explorar productos
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pb-4">
                {resumen?.grupos.map((grupo, index) => (
                  <div key={grupo.catalogoId || `grupo-${index}`} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Store className="h-4 w-4" />
                      <span>{grupo.nombreNegocio}</span>
                    </div>
                    
                    {grupo.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 rounded-lg border bg-card"
                        data-testid={`cart-item-${item.id}`}
                      >
                        {item.imagenProducto ? (
                          <img
                            src={item.imagenProducto}
                            alt={item.nombreProducto || "Producto"}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.nombreProducto || "Producto"}
                          </p>
                          <p className="text-sm text-purple-600 font-semibold">
                            S/ {parseFloat(item.precioUnitario || "0").toFixed(2)}
                          </p>
                          {item.notas && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.notas}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCambiarCantidad(item, -1)}
                              disabled={item.cantidad <= 1 || actualizarCantidadMutation.isPending}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.cantidad}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCambiarCantidad(item, 1)}
                              disabled={actualizarCantidadMutation.isPending}
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive ml-auto"
                              onClick={() => handleEliminar(item.id)}
                              disabled={eliminarItemMutation.isPending}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">S/ {formatearPrecio(grupo.subtotal)}</span>
                    </div>
                    
                    {index < (resumen?.grupos.length || 0) - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t bg-muted/30 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Ver precio en:
                </label>
                <Select
                  value={monedaSeleccionada}
                  onValueChange={setMonedaSeleccionada}
                >
                  <SelectTrigger className="flex-1" data-testid="select-moneda">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{monedaActual.bandera}</span>
                        <span>{monedaActual.codigo}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MONEDAS.map((moneda) => (
                      <SelectItem key={moneda.codigo} value={moneda.codigo}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{moneda.bandera}</span>
                          <span>{moneda.nombre}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {monedaSeleccionada !== "PEN" && tasaUsada !== 1 && (
                <p className="text-xs text-muted-foreground text-center">
                  Tasa de cambio: 1 PEN = {tasaUsada.toFixed(4)} {monedaSeleccionada}
                </p>
              )}

              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total:</span>
                <div className="text-right">
                  {convirtiendo ? (
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  ) : (
                    <>
                      <span className="font-bold text-xl text-purple-600">
                        {monedaActual.simbolo} {formatearPrecio(totalConvertido || 0)}
                      </span>
                      {monedaSeleccionada !== "PEN" && (
                        <p className="text-xs text-muted-foreground">
                          (S/ {formatearPrecio(resumen?.totalGeneral || 0)} PEN)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleProcederPago}
                data-testid="button-proceder-pago"
              >
                Proceder al pago
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
