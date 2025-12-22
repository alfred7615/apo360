import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trash2, Minus, Plus, ShoppingBag, Store, ArrowRight, Loader2, 
  CreditCard, Wallet, Upload, Check, Phone, Building2, ArrowLeft,
  CheckCircle2, AlertCircle, Receipt, MapPin, Copy, CheckCheck
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TicketModal from "./TicketModal";

interface DatosTicket {
  numeroTicket: string;
  fechaHora: Date;
  negocio: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    ruc?: string;
  };
  items: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number; }[];
  subtotal: number;
  descuento?: number;
  total: number;
  moneda: string;
  metodoPago: string;
  cliente?: { nombre?: string; telefono?: string; };
  notas?: string;
}

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
  codigoProducto: string | null;
  nombreCategoria: string | null;
  codigoCategoria: string | null;
  etiquetaPrecio: string | null;
  precioUnitario: string | null;
  cantidad: number;
  imagenProducto: string | null;
  notas: string | null;
}

interface LugarUsuario {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  direccion: string | null;
}

interface SaldoUsuario {
  saldo: string;
  moneda: string;
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

interface FormaPago {
  id: string;
  negocioId: string;
  tipo: string;
  nombre: string;
  telefono?: string;
  banco?: string;
  numeroCuenta?: string;
  cci?: string;
  qrImageUrl?: string;
  instrucciones?: string;
  aceptaBilletera?: boolean;
}

const MONEDAS = [
  { codigo: "PEN", nombre: "Sol Peruano", bandera: "🇵🇪", simbolo: "S/" },
  { codigo: "USD", nombre: "Dólar USA", bandera: "🇺🇸", simbolo: "$" },
  { codigo: "CLP", nombre: "Peso Chileno", bandera: "🇨🇱", simbolo: "CLP$" },
  { codigo: "ARS", nombre: "Peso Argentino", bandera: "🇦🇷", simbolo: "AR$" },
  { codigo: "BOB", nombre: "Boliviano", bandera: "🇧🇴", simbolo: "Bs" },
];

const TIPOS_PAGO_ICONOS: Record<string, string> = {
  yape: "📱",
  plin: "📲",
  transferencia: "🏦",
  efectivo: "💵",
  billetera: "👛",
  otro: "💳",
};

type PasoCheckout = "carrito" | "pago" | "confirmacion";

export default function CartModal({ abierto, onClose }: CartModalProps) {
  const { toast } = useToast();
  const [paso, setPaso] = useState<PasoCheckout>("carrito");
  const [monedaSeleccionada, setMonedaSeleccionada] = useState("PEN");
  const [totalConvertido, setTotalConvertido] = useState<number | null>(null);
  const [tasaUsada, setTasaUsada] = useState<number>(1);
  const [convirtiendo, setConvirtiendo] = useState(false);
  
  // Checkout state - ahora por negocio
  const [pagosPorNegocio, setPagosPorNegocio] = useState<Record<string, { formaPago: FormaPago | null; usarBilletera: boolean }>>({});
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [notasPedido, setNotasPedido] = useState("");
  const [procesando, setProcesando] = useState(false);
  
  // Ticket state
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [datosTicket, setDatosTicket] = useState<DatosTicket | null>(null);
  
  // Ubicación delivery state
  const [lugarSeleccionadoId, setLugarSeleccionadoId] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  
  // Formas de pago por catálogo
  const [formasPagoPorCatalogo, setFormasPagoPorCatalogo] = useState<Record<string, FormaPago[]>>({});
  const [cargandoFormasPago, setCargandoFormasPago] = useState(false);

  const { data: resumen, isLoading } = useQuery<ResumenCarrito>({
    queryKey: ["/api/carrito/resumen"],
    enabled: abierto,
  });

  // Obtener formas de pago de TODOS los negocios en el carrito
  useEffect(() => {
    const fetchFormasPago = async () => {
      if (!resumen?.grupos || paso !== "pago") return;
      
      setCargandoFormasPago(true);
      const nuevasFormasPago: Record<string, FormaPago[]> = {};
      
      for (const grupo of resumen.grupos) {
        if (!grupo.catalogoId) continue;
        try {
          const res = await fetch(`/api/carta-digital/${grupo.catalogoId}/formas-pago`);
          if (res.ok) {
            const formas = await res.json();
            nuevasFormasPago[grupo.catalogoId] = formas;
          } else {
            nuevasFormasPago[grupo.catalogoId] = [];
          }
        } catch {
          nuevasFormasPago[grupo.catalogoId] = [];
        }
      }
      
      setFormasPagoPorCatalogo(nuevasFormasPago);
      setCargandoFormasPago(false);
    };
    
    fetchFormasPago();
  }, [resumen?.grupos, paso]);
  
  // Compatibilidad con código existente (para primer negocio)
  const primerCatalogoId = resumen?.grupos?.[0]?.catalogoId;
  const formasPagoNegocio = primerCatalogoId ? (formasPagoPorCatalogo[primerCatalogoId] || []) : [];
  
  // Variables de compatibilidad para el código existente
  const pagoActual = primerCatalogoId ? pagosPorNegocio[primerCatalogoId] : null;
  const formaPagoSeleccionada = pagoActual?.formaPago || null;
  const usarBilletera = pagoActual?.usarBilletera || false;
  
  const setFormaPagoSeleccionada = (forma: FormaPago | null) => {
    if (!primerCatalogoId) return;
    setPagosPorNegocio(prev => ({
      ...prev,
      [primerCatalogoId]: { formaPago: forma, usarBilletera: false }
    }));
  };
  
  const setUsarBilletera = (usar: boolean) => {
    if (!primerCatalogoId) return;
    setPagosPorNegocio(prev => ({
      ...prev,
      [primerCatalogoId]: { formaPago: null, usarBilletera: usar }
    }));
  };
  
  // Obtener lugares del usuario
  const { data: lugaresUsuario = [] } = useQuery<LugarUsuario[]>({
    queryKey: ["/api/lugares-usuario"],
    enabled: paso === "pago",
  });
  
  // Obtener saldo de la billetera
  const { data: saldoUsuario } = useQuery<SaldoUsuario>({
    queryKey: ["/api/saldos/mi-saldo"],
    enabled: paso === "pago",
  });
  
  const saldoDisponible = parseFloat(saldoUsuario?.saldo || "0");
  const saldoSuficiente = saldoDisponible >= (totalConvertido || resumen?.totalGeneral || 0);

  // Reset state when modal closes
  useEffect(() => {
    if (!abierto) {
      setPaso("carrito");
      setPagosPorNegocio({});
      setFormasPagoPorCatalogo({});
      setVoucherFile(null);
      setVoucherPreview(null);
      setNotasPedido("");
      setMostrarTicket(false);
      setDatosTicket(null);
      setLugarSeleccionadoId(null);
      setCopiado(null);
    }
  }, [abierto]);
  
  const copiarAlPortapapeles = async (texto: string, id: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      toast({
        title: "Copiado",
        description: "Número copiado al portapapeles",
      });
      setTimeout(() => setCopiado(null), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar al portapapeles",
      });
    }
  };

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

  const crearPedidoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pedidos", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrito"] });
      queryClient.invalidateQueries({ queryKey: ["/api/carrito/resumen"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mis-pedidos"] });
      setPaso("confirmacion");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error al crear pedido",
        description: error.message || "No se pudo procesar tu pedido",
      });
      setProcesando(false);
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

  const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoucherFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generarNumeroTicket = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `APO-${año}${mes}${dia}-${random}`;
  };

  const handleConfirmarCompra = async () => {
    if (!formaPagoSeleccionada && !usarBilletera) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona una forma de pago",
      });
      return;
    }

    setProcesando(true);

    try {
      // Si hay voucher, primero subirlo
      let voucherUrl = null;
      if (voucherFile && (formaPagoSeleccionada?.tipo === "yape" || formaPagoSeleccionada?.tipo === "plin")) {
        const formData = new FormData();
        formData.append("archivo", voucherFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          voucherUrl = uploadData.url;
        }
      }

      // Obtener datos de ubicación si se seleccionó
      let direccionEntrega = null;
      let latitudEntrega = null;
      let longitudEntrega = null;
      let referenciaEntrega = null;
      
      const tieneUbicacion = lugarSeleccionadoId && lugarSeleccionadoId !== "none";
      if (tieneUbicacion) {
        const lugar = lugaresUsuario.find(l => l.id === lugarSeleccionadoId);
        if (lugar) {
          direccionEntrega = lugar.direccion || lugar.nombre;
          latitudEntrega = lugar.latitud;
          longitudEntrega = lugar.longitud;
          referenciaEntrega = lugar.nombre;
        }
      }

      // Crear pedido para cada grupo/negocio
      for (const grupo of resumen?.grupos || []) {
        await crearPedidoMutation.mutateAsync({
          catalogoId: grupo.catalogoId,
          localComercialId: grupo.localComercialId,
          items: grupo.items.map(item => ({
            itemCatalogoId: item.itemCatalogoId,
            productoId: item.productoId,
            nombreProducto: item.nombreProducto,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
          })),
          total: grupo.subtotal.toString(),
          moneda: monedaSeleccionada,
          metodoPago: usarBilletera ? "billetera" : formaPagoSeleccionada?.tipo,
          formaPagoId: formaPagoSeleccionada?.id,
          voucherUrl,
          notas: notasPedido,
          tipoEntrega: tieneUbicacion ? "delivery" : "recoger",
          direccionEntrega,
          latitudEntrega,
          longitudEntrega,
          referenciaEntrega,
        });
        
        // Generar datos del ticket para el primer negocio
        if (!datosTicket) {
          const itemsTicket = grupo.items.map(item => ({
            nombre: item.nombreProducto || "Producto",
            cantidad: item.cantidad,
            precioUnitario: parseFloat(item.precioUnitario || "0"),
            subtotal: parseFloat(item.precioUnitario || "0") * item.cantidad,
          }));
          
          setDatosTicket({
            numeroTicket: generarNumeroTicket(),
            fechaHora: new Date(),
            negocio: {
              nombre: grupo.nombreNegocio,
            },
            items: itemsTicket,
            subtotal: grupo.subtotal,
            total: totalConvertido || grupo.subtotal,
            moneda: monedaSeleccionada,
            metodoPago: usarBilletera ? "Billetera APO-360" : (formaPagoSeleccionada?.nombre || formaPagoSeleccionada?.tipo || ""),
            notas: notasPedido || undefined,
          });
        }
      }
    } catch (error) {
      console.error("Error al confirmar compra:", error);
      setProcesando(false);
    }
  };

  const carritoVacio = !resumen?.grupos || resumen.grupos.length === 0;

  const renderCarrito = () => (
    <>
      <div 
        className="flex-1 overflow-y-auto px-4 overscroll-contain"
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      >
        <div className="space-y-4 pb-4">
          {resumen?.grupos.map((grupo, index) => (
            <div key={grupo.catalogoId || `grupo-${index}`} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/30 p-2 rounded-lg">
                <Store className="h-4 w-4" />
                <span>{grupo.nombreNegocio}</span>
              </div>
              
              {grupo.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border bg-card"
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="flex gap-3">
                    {item.imagenProducto ? (
                      <img
                        src={item.imagenProducto}
                        alt={item.nombreProducto || "Producto"}
                        className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Categoría en letras pequeñas */}
                      {item.codigoCategoria && item.nombreCategoria && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                          {item.codigoCategoria} {item.nombreCategoria}
                        </p>
                      )}
                      
                      {/* Código + Nombre del producto */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {item.codigoProducto && (
                            <span className="text-purple-600">{item.codigoProducto} </span>
                          )}
                          {item.nombreProducto || "Producto"}
                        </p>
                        {/* Precio a la derecha */}
                        <p className="text-sm text-purple-600 font-bold whitespace-nowrap">
                          S/ {parseFloat(item.precioUnitario || "0").toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Etiqueta de precio (tamaño) */}
                      {item.etiquetaPrecio && (
                        <Badge variant="secondary" className="text-[10px] h-4 mt-1">
                          {item.etiquetaPrecio}
                        </Badge>
                      )}
                      
                      {item.notas && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.notas}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Cantidad abajo */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Cantidad:</span>
                    <div className="flex items-center gap-2">
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
                        className="h-7 w-7 text-destructive hover:text-destructive ml-2"
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
              
              <div className="flex justify-between text-sm px-1 py-1 bg-muted/50 rounded">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">S/ {formatearPrecio(grupo.subtotal)}</span>
              </div>
              
              {index < (resumen?.grupos.length || 0) - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>
      </div>

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
          onClick={() => setPaso("pago")}
          data-testid="button-realizar-compra"
        >
          Realizar Compra
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </>
  );

  const renderPago = () => (
    <>
      <div className="flex-1 overflow-y-auto px-4" style={{ maxHeight: 'calc(85vh - 200px)' }}>
        <div className="space-y-4 pb-6">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Total a pagar:</span>
            <span className="font-bold text-lg text-purple-600">
              {monedaActual.simbolo} {formatearPrecio(totalConvertido || 0)}
            </span>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">Selecciona forma de pago</Label>
            
            {/* Billetera APO-360 */}
            <Card 
              className={`cursor-pointer transition-all ${!saldoSuficiente ? 'opacity-60' : ''} ${usarBilletera ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950' : 'hover-elevate'}`}
              onClick={() => {
                if (saldoSuficiente) {
                  setUsarBilletera(true);
                  setFormaPagoSeleccionada(null);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Saldo insuficiente",
                    description: formasPagoNegocio.length > 0 
                      ? "Recarga tu billetera o selecciona otra forma de pago del negocio"
                      : "Este negocio solo acepta Billetera APO-360. Recarga tu saldo para continuar.",
                  });
                }
              }}
              data-testid="card-pago-billetera"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Billetera APO-360</p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: <span className={saldoSuficiente ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        S/ {formatearPrecio(saldoDisponible)}
                      </span>
                    </p>
                  </div>
                  {usarBilletera && saldoSuficiente && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                {!saldoSuficiente && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {formasPagoNegocio.length > 0 
                      ? "Saldo insuficiente. Usa las formas de pago del negocio."
                      : "Saldo insuficiente. Este negocio solo acepta Billetera APO-360. Recarga tu saldo."}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cargando formas de pago */}
            {cargandoFormasPago && (
              <div className="p-4 border rounded-lg bg-muted/30 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                <span className="text-sm text-muted-foreground">Cargando métodos de pago del negocio...</span>
              </div>
            )}

            {/* Mensaje cuando el negocio no tiene formas de pago configuradas */}
            {!cargandoFormasPago && formasPagoNegocio.length === 0 && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>Este negocio no ha configurado métodos de pago adicionales</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Solo puedes pagar con tu Billetera APO-360. Si no tienes saldo suficiente, 
                  ve a tu perfil y recarga tu billetera para continuar con la compra.
                </p>
              </div>
            )}

            {/* Formas de pago del negocio */}
            {!cargandoFormasPago && formasPagoNegocio.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Store className="h-4 w-4" />
                  <span>Métodos del negocio</span>
                </div>

                {formasPagoNegocio.map((forma) => (
                  <Card 
                    key={forma.id}
                    className={`cursor-pointer transition-all ${formaPagoSeleccionada?.id === forma.id ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950' : 'hover-elevate'}`}
                    onClick={() => {
                      setFormaPagoSeleccionada(forma);
                      setUsarBilletera(false);
                    }}
                    data-testid={`card-forma-pago-${forma.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                          {TIPOS_PAGO_ICONOS[forma.tipo] || "💳"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{forma.nombre}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {forma.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {forma.telefono}
                                {(forma.tipo === "yape" || forma.tipo === "plin") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copiarAlPortapapeles(forma.telefono!, `tel-${forma.id}`);
                                    }}
                                    data-testid={`btn-copiar-telefono-${forma.id}`}
                                  >
                                    {copiado === `tel-${forma.id}` ? (
                                      <CheckCheck className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </span>
                            )}
                            {forma.banco && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {forma.banco}
                              </span>
                            )}
                          </div>
                          {forma.numeroCuenta && (
                            <div className="flex items-center gap-1 mt-1">
                              <p className="text-xs text-muted-foreground">
                                Cuenta: {forma.numeroCuenta}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copiarAlPortapapeles(forma.numeroCuenta!, `cuenta-${forma.id}`);
                                }}
                                data-testid={`btn-copiar-cuenta-${forma.id}`}
                              >
                                {copiado === `cuenta-${forma.id}` ? (
                                  <CheckCheck className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                        {formaPagoSeleccionada?.id === forma.id && (
                          <Check className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      
                      {forma.instrucciones && formaPagoSeleccionada?.id === forma.id && (
                        <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
                          {forma.instrucciones}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Subir voucher para Yape/Plin */}
            {formaPagoSeleccionada && (formaPagoSeleccionada.tipo === "yape" || formaPagoSeleccionada.tipo === "plin") && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Adjuntar comprobante (voucher)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleVoucherChange}
                    className="flex-1"
                    data-testid="input-voucher"
                  />
                </div>
                {voucherPreview && (
                  <div className="relative">
                    <img 
                      src={voucherPreview} 
                      alt="Voucher" 
                      className="w-full max-h-40 object-contain rounded-md border"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                      onClick={() => {
                        setVoucherFile(null);
                        setVoucherPreview(null);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Sube una captura del pago realizado por {formaPagoSeleccionada.tipo === "yape" ? "Yape" : "Plin"}
                </p>
              </div>
            )}

            {/* Notas del pedido y ubicación */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Notas adicionales (opcional)</Label>
                  <Textarea
                    value={notasPedido}
                    onChange={(e) => setNotasPedido(e.target.value)}
                    placeholder="Referencias para llegar, detalles del pedido..."
                    className="resize-none"
                    rows={2}
                    data-testid="textarea-notas-pedido"
                  />
                </div>
                
                {/* Selector de ubicación */}
                <div className="w-1/3 space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Ubicación
                  </Label>
                  <Select
                    value={lugarSeleccionadoId || "none"}
                    onValueChange={(value) => setLugarSeleccionadoId(value === "none" ? null : value)}
                  >
                    <SelectTrigger className="w-full" data-testid="select-ubicacion">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin ubicación (recoger en local)</SelectItem>
                      {lugaresUsuario.map((lugar) => (
                        <SelectItem key={lugar.id} value={lugar.id}>
                          {lugar.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lugarSeleccionadoId && lugarSeleccionadoId !== "none" && (
                    <p className="text-xs text-muted-foreground">
                      {lugaresUsuario.find(l => l.id === lugarSeleccionadoId)?.direccion || "GPS guardado"}
                    </p>
                  )}
                </div>
              </div>
              
              {lugaresUsuario.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Puedes guardar tus ubicaciones en tu perfil para delivery
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t bg-muted/30 p-4 space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setPaso("carrito")}
          data-testid="button-volver-carrito"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al carrito
        </Button>
        
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleConfirmarCompra}
          disabled={
            procesando || 
            (!formaPagoSeleccionada && !usarBilletera) ||
            (formasPagoNegocio.length === 0 && !saldoSuficiente)
          }
          data-testid="button-confirmar-compra"
        >
          {procesando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          {formasPagoNegocio.length === 0 && !saldoSuficiente 
            ? "Recarga tu billetera" 
            : "Confirmar Compra"}
        </Button>
      </div>
    </>
  );

  const renderConfirmacion = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Pedido Enviado</h3>
      <p className="text-muted-foreground mb-4">
        Tu pedido ha sido enviado al negocio para confirmación.
      </p>
      <div className="bg-muted/50 rounded-lg p-4 w-full text-left space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>El negocio revisará tu pedido y voucher de pago</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Recibirás una notificación cuando sea confirmado</span>
        </div>
      </div>
      
      {datosTicket && (
        <Button 
          variant="outline"
          onClick={() => setMostrarTicket(true)} 
          className="w-full mb-3 border-purple-500 text-purple-600 hover:bg-purple-50"
          data-testid="button-ver-ticket"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Ver Ticket de Compra
        </Button>
      )}
      
      <Button 
        onClick={onClose} 
        className="w-full"
        data-testid="button-cerrar-confirmacion"
      >
        Entendido
      </Button>
    </div>
  );

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {paso === "carrito" && (
              <>
                <ShoppingBag className="h-5 w-5 text-purple-600" />
                Mi Carrito
                {resumen?.totalItems ? (
                  <Badge variant="secondary" className="ml-2">
                    {resumen.totalItems} {resumen.totalItems === 1 ? "item" : "items"}
                  </Badge>
                ) : null}
              </>
            )}
            {paso === "pago" && (
              <>
                <CreditCard className="h-5 w-5 text-purple-600" />
                Forma de Pago
              </>
            )}
            {paso === "confirmacion" && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Confirmación
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {paso === "carrito" && "Revisa tu pedido y selecciona la moneda de pago"}
            {paso === "pago" && "Elige cómo deseas pagar tu pedido"}
            {paso === "confirmacion" && "Tu pedido está siendo procesado"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : carritoVacio && paso === "carrito" ? (
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
            {paso === "carrito" && renderCarrito()}
            {paso === "pago" && renderPago()}
            {paso === "confirmacion" && renderConfirmacion()}
          </>
        )}
      </DialogContent>
      
      <TicketModal
        abierto={mostrarTicket}
        onClose={() => setMostrarTicket(false)}
        datos={datosTicket}
      />
    </Dialog>
  );
}
