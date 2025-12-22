import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { MapPicker } from "@/components/MapPicker";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Store, Package, Plus, Edit, Trash2, Save, MapPin, Phone, Globe, 
  Instagram, Facebook, Image as ImageIcon, Loader2, UtensilsCrossed, Utensils,
  CheckCircle, XCircle, Users, Megaphone, ShoppingCart, Truck, Map,
  History, Navigation, Heart, Share2, ExternalLink, Clock, DollarSign,
  Package2, ClipboardList, MapPinned, Wallet, RefreshCw, Eye, Bookmark, Star,
  CreditCard, QrCode, Building2, FileText
} from "lucide-react";
import { CartaDigitalModal } from "@/components/CartaDigitalModal";
import { FranjaEstadoPedido } from "@/components/BarraEstadoPedido";

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

interface CatalogoLocal {
  id: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  logoUrl?: string;
  bannerUrl?: string;
  activo?: boolean;
  orden?: number;
  categorias?: CategoriaCatalogoLocal[];
  items?: ItemCatalogoLocal[];
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
  subcategorias?: CategoriaCatalogoLocal[];
  etiquetaPrecio1?: string;
  etiquetaPrecio2?: string;
  etiquetaPrecio3?: string;
  etiquetaPrecio4?: string;
  habilitarPrecio1?: boolean;
  habilitarPrecio2?: boolean;
  habilitarPrecio3?: boolean;
  habilitarPrecio4?: boolean;
}

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
  // Etiquetas personalizables por producto (ej: "Mitad", "Entero", "1/4", "Promoción")
  etiquetaPrecio1?: string;
  etiquetaPrecio2?: string;
  etiquetaPrecio3?: string;
  etiquetaPrecio4?: string;
  precio?: string;
  precioOferta?: string;
  imagenUrl?: string;
  imagenes?: string[];
  ingredientes?: string;
  tiempoPreparacion?: string;
  disponible?: boolean;
  destacado?: boolean;
  likes?: number;
  favoritos?: number;
  compartidos?: number;
  vistas?: number;
  orden?: number;
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
  tipoEntrega?: string;
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

interface EstadisticasDelivery {
  atendido: number;
  enCamino: number;
  entregado: number;
}

interface EntregaActiva {
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
}

const negocioIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: #8B5CF6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const deliveryEnCaminoIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: #3B82F6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const deliveryPendienteIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: #EAB308; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

interface HistorialPedido {
  id: string;
  total: string;
  estado?: string;
  completedAt?: string;
  createdAt?: string;
  cliente?: {
    id: string;
    nombre: string;
    telefono?: string;
  };
}

interface TransaccionBilletera {
  id: string;
  usuarioId: string;
  tipo: string;
  monto: string;
  descripcion?: string;
  referencia?: string;
  createdAt?: string;
}

interface SolicitudRecarga {
  id: string;
  tipo: string;
  monto: string;
  moneda?: string;
  estado?: string;
  notas?: string;
  createdAt?: string;
}

interface FormaPago {
  id: string;
  negocioId: string;
  catalogoId?: string;
  tipo: string;
  nombre: string;
  telefono?: string;
  banco?: string;
  numeroCuenta?: string;
  cci?: string;
  qrImageUrl?: string;
  instrucciones?: string;
  aceptaBilletera?: boolean;
  comision?: string;
  orden?: number;
  activo?: boolean;
}

const TIPOS_PAGO = [
  { value: "yape", label: "Yape", icon: "📱" },
  { value: "plin", label: "Plin", icon: "📲" },
  { value: "transferencia", label: "Transferencia Bancaria", icon: "🏦" },
  { value: "efectivo", label: "Efectivo", icon: "💵" },
  { value: "billetera", label: "Billetera Virtual", icon: "👛" },
  { value: "otro", label: "Otro", icon: "💳" },
];

interface TicketFacturacion {
  id: string;
  numeroTicket: string;
  negocioId: string;
  pedidoId?: string;
  clienteId?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  descripcionCompra?: string;
  itemsJson?: string;
  cantidadItems: number;
  subtotal: string;
  descuento?: string;
  total: string;
  moneda: string;
  metodoPago?: string;
  empleadoId?: string;
  nombreEmpleado?: string;
  funcionEmpleado?: string;
  estado: string;
  fechaEmision: string;
}

interface ProductoFacturado {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface DatosFacturacion {
  fecha: string;
  totalPedidos: number;
  totalGeneral: number;
  productos: ProductoFacturado[];
  moneda: string;
}

function SeccionFacturacion({ negocioId }: { negocioId: string | null }) {
  const { toast } = useToast();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [generandoReporte, setGenerandoReporte] = useState(false);

  const { data: datosFacturacion, isLoading } = useQuery<DatosFacturacion>({
    queryKey: ["/api/mi-negocio/facturacion", fechaSeleccionada],
    enabled: !!negocioId,
  });

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleGenerarReporte = async () => {
    setGenerandoReporte(true);
    try {
      const response = await fetch('/api/mi-negocio/facturacion/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fecha: fechaSeleccionada }),
      });
      
      if (!response.ok) throw new Error('Error al generar reporte');
      
      const html = await response.text();
      const ventana = window.open('', '_blank', 'width=800,height=600');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
        setTimeout(() => ventana.print(), 500);
      }
      
      toast({ title: "Reporte generado", description: "Se abrió una ventana para imprimir" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setGenerandoReporte(false);
    }
  };

  if (!negocioId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Facturación del Día
          </h3>
          <p className="text-sm text-muted-foreground">
            Resumen de ventas por producto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-[180px]"
            data-testid="input-fecha-facturacion"
          />
          <Button
            variant="default"
            onClick={handleGenerarReporte}
            disabled={generandoReporte || !datosFacturacion?.productos.length}
            data-testid="button-imprimir-reporte"
          >
            {generandoReporte ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* Resumen de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-ventas-facturacion">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600" data-testid="text-total-dia">
              S/ {datosFacturacion?.totalGeneral?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatearFecha(fechaSeleccionada)}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="card-pedidos-completados">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              Pedidos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600" data-testid="text-total-pedidos">
              {datosFacturacion?.totalPedidos || 0}
            </p>
            <p className="text-xs text-muted-foreground">Pedidos entregados</p>
          </CardContent>
        </Card>
        <Card data-testid="card-productos-vendidos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              Productos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600" data-testid="text-cantidad-productos">
              {datosFacturacion?.productos?.reduce((sum, p) => sum + p.cantidad, 0) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Unidades vendidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de productos vendidos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !datosFacturacion?.productos?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay ventas registradas este día</p>
            <p className="text-xs text-muted-foreground mt-2">
              Las ventas aparecerán cuando se completen pedidos
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Detalle de Ventas por Producto</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th className="text-left py-3 px-4 font-medium">Código</th>
                    <th className="text-left py-3 px-4 font-medium">Producto</th>
                    <th className="text-center py-3 px-4 font-medium">Cantidad</th>
                    <th className="text-right py-3 px-4 font-medium">P. Unit.</th>
                    <th className="text-right py-3 px-4 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFacturacion.productos.map((producto, idx) => (
                    <tr 
                      key={producto.codigo + idx} 
                      className={idx % 2 === 0 ? 'bg-muted/30' : 'bg-background'}
                      data-testid={`row-producto-${idx}`}
                    >
                      <td className="py-3 px-4 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs">{producto.codigo}</td>
                      <td className="py-3 px-4">{producto.nombre}</td>
                      <td className="py-3 px-4 text-center font-medium">{producto.cantidad}</td>
                      <td className="py-3 px-4 text-right">S/ {producto.precioUnitario.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium">S/ {producto.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-purple-100 dark:bg-purple-900/30 font-bold">
                    <td colSpan={3} className="py-3 px-4">TOTAL GENERAL</td>
                    <td className="py-3 px-4 text-center">
                      {datosFacturacion.productos.reduce((sum, p) => sum + p.cantidad, 0)}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right text-primary">
                      S/ {datosFacturacion.totalGeneral.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FormasPagoTab({ miNegocio }: { miNegocio: DatosNegocio | null }) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingFormaPago, setEditingFormaPago] = useState<FormaPago | null>(null);
  const [formData, setFormData] = useState<Partial<FormaPago>>({
    tipo: "yape",
    nombre: "",
    telefono: "",
    banco: "",
    numeroCuenta: "",
    cci: "",
    qrImageUrl: "",
    instrucciones: "",
    aceptaBilletera: false,
  });

  const { data: formasPago = [], isLoading } = useQuery<FormaPago[]>({
    queryKey: ["/api/mis-formas-pago"],
    enabled: !!miNegocio,
  });

  const crearMutation = useMutation({
    mutationFn: async (data: Partial<FormaPago>) => {
      const res = await apiRequest("POST", "/api/mis-formas-pago", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mis-formas-pago"] });
      toast({ title: "Método de pago creado" });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormaPago> }) => {
      const res = await apiRequest("PATCH", `/api/mis-formas-pago/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mis-formas-pago"] });
      toast({ title: "Método de pago actualizado" });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/mis-formas-pago/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mis-formas-pago"] });
      toast({ title: "Método de pago eliminado" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: "yape",
      nombre: "",
      telefono: "",
      banco: "",
      numeroCuenta: "",
      cci: "",
      qrImageUrl: "",
      instrucciones: "",
      aceptaBilletera: false,
    });
    setEditingFormaPago(null);
  };

  const handleEditar = (forma: FormaPago) => {
    setEditingFormaPago(forma);
    setFormData({
      tipo: forma.tipo,
      nombre: forma.nombre,
      telefono: forma.telefono || "",
      banco: forma.banco || "",
      numeroCuenta: forma.numeroCuenta || "",
      cci: forma.cci || "",
      qrImageUrl: forma.qrImageUrl || "",
      instrucciones: forma.instrucciones || "",
      aceptaBilletera: forma.aceptaBilletera || false,
    });
    setShowModal(true);
  };

  const handleGuardar = () => {
    if (!formData.nombre?.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El nombre es requerido" });
      return;
    }
    if (editingFormaPago) {
      actualizarMutation.mutate({ id: editingFormaPago.id, data: formData });
    } else {
      crearMutation.mutate(formData);
    }
  };

  const getTipoInfo = (tipo: string) => {
    return TIPOS_PAGO.find(t => t.value === tipo) || { value: tipo, label: tipo, icon: "💳" };
  };

  if (!miNegocio) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Formas de Pago</h3>
            <p className="text-sm text-muted-foreground">Configura los métodos de pago que aceptas</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-medium">Formas de Pago</h3>
          <p className="text-sm text-muted-foreground">Configura los métodos de pago que aceptas para tus ventas</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="button-agregar-forma-pago"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Método
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : formasPago.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes métodos de pago configurados</p>
            <p className="text-xs text-muted-foreground mt-2">
              Agrega Yape, Plin, transferencias bancarias u otros métodos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formasPago.map((forma) => {
            const tipoInfo = getTipoInfo(forma.tipo);
            return (
              <Card key={forma.id} className="hover-elevate" data-testid={`card-forma-pago-${forma.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                      {tipoInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{forma.nombre}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {tipoInfo.label}
                        </Badge>
                      </div>
                      {forma.telefono && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {forma.telefono}
                        </p>
                      )}
                      {forma.banco && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {forma.banco}
                        </p>
                      )}
                      {forma.numeroCuenta && (
                        <p className="text-xs text-muted-foreground truncate">
                          Cuenta: {forma.numeroCuenta}
                        </p>
                      )}
                      {forma.aceptaBilletera && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Wallet className="h-3 w-3 mr-1" />
                          Acepta billetera
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditar(forma)}
                      data-testid={`button-editar-forma-pago-${forma.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => eliminarMutation.mutate(forma.id)}
                      data-testid={`button-eliminar-forma-pago-${forma.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para agregar/editar forma de pago */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFormaPago ? "Editar" : "Agregar"} Método de Pago
            </DialogTitle>
            <DialogDescription>
              Configura un método de pago para tus clientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Pago</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(val) => setFormData({ ...formData, tipo: val })}
              >
                <SelectTrigger data-testid="select-tipo-pago">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PAGO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <span className="flex items-center gap-2">
                        <span>{tipo.icon}</span>
                        <span>{tipo.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre / Titular *</Label>
              <Input
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                data-testid="input-nombre-pago"
              />
            </div>

            {(formData.tipo === "yape" || formData.tipo === "plin") && (
              <div className="space-y-2">
                <Label>Número de Teléfono</Label>
                <Input
                  value={formData.telefono || ""}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="999 999 999"
                  data-testid="input-telefono-pago"
                />
              </div>
            )}

            {formData.tipo === "transferencia" && (
              <>
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={formData.banco || ""}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Ej: BCP, BBVA, Interbank..."
                    data-testid="input-banco-pago"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Cuenta</Label>
                    <Input
                      value={formData.numeroCuenta || ""}
                      onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                      placeholder="Número de cuenta"
                      data-testid="input-cuenta-pago"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CCI (opcional)</Label>
                    <Input
                      value={formData.cci || ""}
                      onChange={(e) => setFormData({ ...formData, cci: e.target.value })}
                      placeholder="Código interbancario"
                      data-testid="input-cci-pago"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Instrucciones (opcional)</Label>
              <Textarea
                value={formData.instrucciones || ""}
                onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                placeholder="Instrucciones adicionales para el cliente..."
                data-testid="input-instrucciones-pago"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="aceptaBilletera"
                checked={formData.aceptaBilletera || false}
                onCheckedChange={(checked) => setFormData({ ...formData, aceptaBilletera: !!checked })}
                data-testid="checkbox-acepta-billetera"
              />
              <Label htmlFor="aceptaBilletera" className="text-sm cursor-pointer">
                También acepto pagos con billetera virtual de APO-360
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} data-testid="button-cancelar-forma-pago">
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardar}
              disabled={crearMutation.isPending || actualizarMutation.isPending}
              data-testid="button-guardar-forma-pago"
            >
              {(crearMutation.isPending || actualizarMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HistorialTab({ miNegocio }: { miNegocio: DatosNegocio | null }) {
  const { data: historialPedidos = [], isLoading: loadingPedidos } = useQuery<HistorialPedido[]>({
    queryKey: ["/api/mi-negocio/historial/pedidos"],
    enabled: !!miNegocio,
  });

  const { data: historialBilletera = [], isLoading: loadingBilletera } = useQuery<TransaccionBilletera[]>({
    queryKey: ["/api/mi-negocio/historial/billetera"],
    enabled: !!miNegocio,
  });

  const { data: historialRecargas = [], isLoading: loadingRecargas } = useQuery<SolicitudRecarga[]>({
    queryKey: ["/api/mi-negocio/historial/recargas"],
    enabled: !!miNegocio,
  });

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonto = (monto?: string) => {
    if (!monto) return "S/ 0.00";
    const num = parseFloat(monto);
    return `S/ ${num.toFixed(2)}`;
  };

  if (!miNegocio) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Historial</h3>
            <p className="text-sm text-muted-foreground">Revisa el historial de pedidos, billetera y recargas</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Historial</h3>
          <p className="text-sm text-muted-foreground">Revisa el historial de pedidos, billetera y recargas</p>
        </div>
      </div>
      
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
          {loadingPedidos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : historialPedidos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay historial de pedidos</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {historialPedidos.map((pedido) => (
                <Card key={pedido.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          pedido.estado === 'entregado' || pedido.estado === 'completado'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {pedido.estado === 'entregado' || pedido.estado === 'completado' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Pedido #{pedido.id.slice(-6)}</p>
                          <p className="text-sm text-muted-foreground">
                            {pedido.cliente?.nombre || 'Cliente'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatMonto(pedido.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(pedido.completedAt || pedido.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="billetera" className="mt-4">
          {loadingBilletera ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : historialBilletera.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay movimientos en la billetera</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {historialBilletera.map((transaccion) => (
                <Card key={transaccion.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaccion.tipo === 'ingreso' || transaccion.tipo === 'recarga'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-orange-100 dark:bg-orange-900/30'
                        }`}>
                          {transaccion.tipo === 'ingreso' || transaccion.tipo === 'recarga' ? (
                            <DollarSign className="h-5 w-5 text-green-600" />
                          ) : (
                            <RefreshCw className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaccion.tipo}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaccion.descripcion || transaccion.referencia || 'Movimiento'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaccion.tipo === 'ingreso' || transaccion.tipo === 'recarga'
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}>
                          {transaccion.tipo === 'ingreso' || transaccion.tipo === 'recarga' ? '+' : '-'}
                          {formatMonto(transaccion.monto)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(transaccion.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recargas" className="mt-4">
          {loadingRecargas ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : historialRecargas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay historial de recargas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {historialRecargas.map((recarga) => (
                <Card key={recarga.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          recarga.estado === 'aprobado' || recarga.estado === 'completado'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {recarga.estado === 'aprobado' || recarga.estado === 'completado' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{recarga.tipo}</p>
                          <Badge variant={
                            recarga.estado === 'aprobado' || recarga.estado === 'completado'
                              ? 'default'
                              : 'destructive'
                          } className="text-xs">
                            {recarga.estado}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatMonto(recarga.monto)}
                          {recarga.moneda && recarga.moneda !== 'PEN' && ` ${recarga.moneda}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(recarga.createdAt)}
                        </p>
                      </div>
                    </div>
                    {recarga.notas && (
                      <p className="text-sm text-muted-foreground mt-2 pl-13">
                        {recarga.notas}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LocalComercialPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("negocio");
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCatalogo | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [showNegocioPopup, setShowNegocioPopup] = useState(false);
  const [showSugerirLogoModal, setShowSugerirLogoModal] = useState(false);
  const [logoSugerido, setLogoSugerido] = useState({ nombre: "", logoUrl: "", descripcion: "" });
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
    queryKey: ["/api/logos-servicio"],
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
    queryFn: async () => {
      const res = await fetch(`/api/buscar-usuarios?q=${encodeURIComponent(busquedaUsuario)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al buscar usuarios');
      return res.json();
    },
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

  const { data: estadisticasDelivery = { atendido: 0, enCamino: 0, entregado: 0 } } = useQuery<EstadisticasDelivery>({
    queryKey: ["/api/mi-negocio/delivery/estadisticas"],
    enabled: !!miNegocio,
  });

  const { data: entregasActivas = [], isLoading: loadingEntregas } = useQuery<EntregaActiva[]>({
    queryKey: ["/api/mi-negocio/delivery/activas"],
    enabled: !!miNegocio,
  });

  const [showSolicitarDeliveryModal, setShowSolicitarDeliveryModal] = useState(false);
  const [showMapaExpandido, setShowMapaExpandido] = useState(false);

  // Estados para Catálogo Local Jerárquico
  const [showCatalogoLocalModal, setShowCatalogoLocalModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showItemLocalModal, setShowItemLocalModal] = useState(false);
  const [showCartaDigitalModal, setShowCartaDigitalModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaCatalogoLocal | null>(null);
  const [editingItemLocal, setEditingItemLocal] = useState<ItemCatalogoLocal | null>(null);
  const [categoriaForm, setCategoriaForm] = useState<Partial<CategoriaCatalogoLocal>>({
    codigo: "",
    nombre: "",
    descripcion: "",
    icono: "",
    categoriaPadreId: null,
    etiquetaPrecio1: "Personal",
    etiquetaPrecio2: "Mediana",
    etiquetaPrecio3: "Familiar",
    etiquetaPrecio4: "Extra",
  });
  const [itemLocalForm, setItemLocalForm] = useState<Partial<ItemCatalogoLocal>>({
    nombre: "",
    descripcion: "",
    codigo: "",
    precio1: "",
    precio2: "",
    precio3: "",
    precio4: "",
    categoriaId: null,
    imagenUrl: "",
    ingredientes: "",
    tiempoPreparacion: "",
    disponible: true,
    destacado: false,
  });

  // Query para Catálogo Local
  const { data: miCatalogoLocal, isLoading: loadingCatalogoLocal } = useQuery<CatalogoLocal | null>({
    queryKey: ["/api/mi-catalogo-local"],
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

  const sugerirLogoMutation = useMutation({
    mutationFn: (data: { nombre: string; logoUrl: string; descripcion?: string }) => 
      apiRequest("POST", "/api/logos-servicios/sugerir", data),
    onSuccess: () => {
      setShowSugerirLogoModal(false);
      setLogoSugerido({ nombre: "", logoUrl: "", descripcion: "" });
      toast({ 
        title: "Logo enviado para aprobación", 
        description: "El administrador revisará tu logo y lo aprobará pronto." 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error al enviar logo", description: error.message, variant: "destructive" });
    },
  });

  const actualizarPedidoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => 
      apiRequest("PATCH", `/api/mi-negocio/pedidos/${id}`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/pedidos/estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/delivery/estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/delivery/activas"] });
      toast({ title: "Estado del pedido actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar pedido", description: error.message, variant: "destructive" });
    },
  });

  // Mutations para Catálogo Local
  const crearCatalogoLocalMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string }) => 
      apiRequest("POST", "/api/mi-catalogo-local", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo-local"] });
      setShowCatalogoLocalModal(false);
      toast({ title: "Catálogo creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear catálogo", description: error.message, variant: "destructive" });
    },
  });

  const guardarCategoriaLocalMutation = useMutation({
    mutationFn: (data: Partial<CategoriaCatalogoLocal>) => {
      const payload = {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        icono: data.icono,
        categoriaPadreId: data.categoriaPadreId,
        etiquetaPrecio1: data.etiquetaPrecio1,
        etiquetaPrecio2: data.etiquetaPrecio2,
        etiquetaPrecio3: data.etiquetaPrecio3,
        etiquetaPrecio4: data.etiquetaPrecio4,
        habilitarPrecio1: data.habilitarPrecio1,
        habilitarPrecio2: data.habilitarPrecio2,
        habilitarPrecio3: data.habilitarPrecio3,
        habilitarPrecio4: data.habilitarPrecio4,
      };
      if (editingCategoria) {
        return apiRequest("PUT", `/api/mi-catalogo-local/categorias/${editingCategoria.id}`, payload);
      }
      return apiRequest("POST", "/api/mi-catalogo-local/categorias", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo-local"] });
      setShowCategoriaModal(false);
      setEditingCategoria(null);
      setCategoriaForm({ codigo: "", nombre: "", descripcion: "", icono: "", categoriaPadreId: null, etiquetaPrecio1: "Personal", etiquetaPrecio2: "Mediana", etiquetaPrecio3: "Familiar", etiquetaPrecio4: "Extra", habilitarPrecio1: true, habilitarPrecio2: true, habilitarPrecio3: true, habilitarPrecio4: true });
      toast({ title: editingCategoria ? "Categoría actualizada" : "Categoría creada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarCategoriaLocalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mi-catalogo-local/categorias/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo-local"] });
      toast({ title: "Categoría eliminada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const guardarItemLocalMutation = useMutation({
    mutationFn: (data: Partial<ItemCatalogoLocal>) => {
      const payload = {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio1: data.precio1,
        precio2: data.precio2,
        precio3: data.precio3,
        precio4: data.precio4,
        categoriaId: data.categoriaId,
        imagenUrl: data.imagenUrl,
        ingredientes: data.ingredientes,
        tiempoPreparacion: data.tiempoPreparacion,
        disponible: data.disponible,
        destacado: data.destacado,
      };
      if (editingItemLocal) {
        return apiRequest("PUT", `/api/mi-catalogo-local/items/${editingItemLocal.id}`, payload);
      }
      return apiRequest("POST", "/api/mi-catalogo-local/items", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo-local"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-saldo"] });
      setShowItemLocalModal(false);
      setEditingItemLocal(null);
      setItemLocalForm({ codigo: "", nombre: "", descripcion: "", precio1: "", precio2: "", precio3: "", precio4: "", categoriaId: null, imagenUrl: "", ingredientes: "", tiempoPreparacion: "", disponible: true, destacado: false });
      toast({ title: editingItemLocal ? "Producto actualizado" : "Producto creado", description: !editingItemLocal ? "Se descontó S/ 0.20 de tu saldo" : undefined });
    },
    onError: (error: any) => {
      if (error.message?.includes('Saldo insuficiente') || error.tipoError === 'saldo_insuficiente') {
        toast({ 
          title: "Saldo Insuficiente", 
          description: error.message || "No tienes saldo suficiente para crear un producto. Recarga tu saldo desde el Panel de Usuario.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const eliminarItemLocalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mi-catalogo-local/items/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo-local"] });
      toast({ title: "Producto eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const solicitarDeliveryMutation = useMutation({
    mutationFn: (pedidoId: string) => 
      apiRequest("POST", `/api/mi-negocio/delivery/solicitar/${pedidoId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/pedidos/estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/delivery/estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/delivery/activas"] });
      setShowSolicitarDeliveryModal(false);
      toast({ title: "Delivery solicitado", description: "Se está buscando un repartidor" });
    },
    onError: (error: any) => {
      toast({ title: "Error al solicitar delivery", description: error.message, variant: "destructive" });
    },
  });

  const pedidosListosParaEnvio = misPedidos.filter(p => 
    p.estado === 'en_preparacion' || p.estado === 'preparando'
  );

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
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1">
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
            <TabsTrigger value="pagos" data-testid="tab-pagos" className="text-xs">
              <CreditCard className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Pagos</span>
            </TabsTrigger>
            <TabsTrigger value="facturacion" data-testid="tab-facturacion" className="text-xs">
              <ClipboardList className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Facturación</span>
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
            <div className="space-y-6">
              {/* Sección Catálogo Local Jerárquico */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      Mi Catálogo Local
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Organiza tus productos en categorías jerárquicas
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {!miCatalogoLocal ? (
                      <Button 
                        size="sm" 
                        onClick={() => setShowCatalogoLocalModal(true)}
                        data-testid="button-crear-catalogo"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Catálogo
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowCategoriaModal(true)}
                          data-testid="button-crear-categoria"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Categoría
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setShowItemLocalModal(true)}
                          data-testid="button-crear-producto-local"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Producto
                        </Button>
                        <Button 
                          variant="default"
                          size="sm" 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => setShowCartaDigitalModal(true)}
                          data-testid="button-ver-carta-digital"
                        >
                          <UtensilsCrossed className="h-4 w-4 mr-2" />
                          Carta Digital
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {loadingCatalogoLocal ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !miCatalogoLocal ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Crea tu catálogo para organizar productos en categorías
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Podrás crear categorías, subcategorías y agregar productos con precios e imágenes
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">

                    {/* Categorías y productos */}
                    {(!miCatalogoLocal.categorias || miCatalogoLocal.categorias.length === 0) && 
                     (!miCatalogoLocal.items || miCatalogoLocal.items.length === 0) ? (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            Tu catálogo está vacío
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Agrega categorías y productos para comenzar
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {/* Mostrar categorías en formato lista */}
                        {miCatalogoLocal.categorias && miCatalogoLocal.categorias.filter(c => !c.categoriaPadreId).map((categoria) => (
                          <div key={categoria.id} className="border rounded-lg overflow-hidden" data-testid={`card-categoria-${categoria.id}`}>
                            {/* Header de categoría - formato: CÓDIGO | NOMBRE */}
                            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-primary text-lg min-w-[50px]">
                                  {categoria.codigo || "-"}
                                </span>
                                <span className="font-semibold text-base uppercase flex items-center gap-2">
                                  {categoria.icono && <span>{categoria.icono}</span>}
                                  {categoria.nombre}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingCategoria(categoria);
                                    setCategoriaForm({
                                      codigo: categoria.codigo || "",
                                      nombre: categoria.nombre,
                                      descripcion: categoria.descripcion || "",
                                      icono: categoria.icono || "",
                                      categoriaPadreId: categoria.categoriaPadreId,
                                      etiquetaPrecio1: categoria.etiquetaPrecio1 || "Personal",
                                      etiquetaPrecio2: categoria.etiquetaPrecio2 || "Mediana",
                                      etiquetaPrecio3: categoria.etiquetaPrecio3 || "Familiar",
                                      etiquetaPrecio4: categoria.etiquetaPrecio4 || "Extra",
                                      habilitarPrecio1: categoria.habilitarPrecio1 !== false,
                                      habilitarPrecio2: categoria.habilitarPrecio2 !== false,
                                      habilitarPrecio3: categoria.habilitarPrecio3 !== false,
                                      habilitarPrecio4: categoria.habilitarPrecio4 !== false,
                                    });
                                    setShowCategoriaModal(true);
                                  }}
                                  data-testid={`button-editar-categoria-${categoria.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => eliminarCategoriaLocalMutation.mutate(categoria.id)}
                                  data-testid={`button-eliminar-categoria-${categoria.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {categoria.descripcion && (
                              <p className="px-4 py-2 text-sm text-muted-foreground border-b">{categoria.descripcion}</p>
                            )}
                            <div className="p-4">
                              {/* Subcategorías */}
                              {(miCatalogoLocal.categorias?.filter(sub => sub.categoriaPadreId === categoria.id)?.length ?? 0) > 0 && (
                                <div className="mb-4 space-y-1">
                                  {miCatalogoLocal.categorias?.filter(sub => sub.categoriaPadreId === categoria.id).map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium text-primary min-w-[50px]">
                                          {sub.codigo || "-"}
                                        </span>
                                        <span className="text-sm font-medium flex items-center gap-2">
                                          {sub.icono && <span>{sub.icono}</span>}
                                          {sub.nombre}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => {
                                            setEditingCategoria(sub);
                                            setCategoriaForm({
                                              codigo: sub.codigo || "",
                                              nombre: sub.nombre,
                                              descripcion: sub.descripcion || "",
                                              icono: sub.icono || "",
                                              categoriaPadreId: sub.categoriaPadreId,
                                              etiquetaPrecio1: sub.etiquetaPrecio1 || "Personal",
                                              etiquetaPrecio2: sub.etiquetaPrecio2 || "Mediana",
                                              etiquetaPrecio3: sub.etiquetaPrecio3 || "Familiar",
                                              etiquetaPrecio4: sub.etiquetaPrecio4 || "Extra",
                                              habilitarPrecio1: sub.habilitarPrecio1 !== false,
                                              habilitarPrecio2: sub.habilitarPrecio2 !== false,
                                              habilitarPrecio3: sub.habilitarPrecio3 !== false,
                                              habilitarPrecio4: sub.habilitarPrecio4 !== false,
                                            });
                                            setShowCategoriaModal(true);
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => eliminarCategoriaLocalMutation.mutate(sub.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Productos de esta categoría */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {miCatalogoLocal.items?.filter(item => item.categoriaId === categoria.id).map((item) => (
                                  <Card key={item.id} className="hover-elevate" data-testid={`card-item-local-${item.id}`}>
                                    <CardContent className="p-3">
                                      {(item.imagenUrl || (item.imagenes && item.imagenes[0])) && (
                                        <img 
                                          src={item.imagenUrl || item.imagenes?.[0]} 
                                          alt={item.nombre}
                                          className="w-full h-24 object-cover rounded mb-2"
                                        />
                                      )}
                                      <div className="flex items-center gap-2">
                                        {item.codigo && (
                                          <Badge variant="outline" className="text-xs shrink-0">{item.codigo}</Badge>
                                        )}
                                        <h5 className="font-medium text-sm truncate">{item.nombre}</h5>
                                      </div>
                                      {/* Sistema de 4 precios flexible con etiquetas del producto */}
                                      {(item.precio1 || item.precio2 || item.precio3 || item.precio4) && (
                                        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                                          {item.precio1 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio1 || categoria.etiquetaPrecio1 || "Personal"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio1}</span>
                                            </div>
                                          )}
                                          {item.precio2 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio2 || categoria.etiquetaPrecio2 || "Mediana"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio2}</span>
                                            </div>
                                          )}
                                          {item.precio3 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio3 || categoria.etiquetaPrecio3 || "Familiar"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio3}</span>
                                            </div>
                                          )}
                                          {item.precio4 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio4 || categoria.etiquetaPrecio4 || "Extra"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio4}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1" title="Likes">
                                          <Heart className="h-3 w-3 text-pink-500" /> {item.likes || 0}
                                        </span>
                                        <span className="flex items-center gap-1" title="Favoritos">
                                          <Bookmark className="h-3 w-3 text-yellow-500" /> {item.favoritos || 0}
                                        </span>
                                        <span className="flex items-center gap-1" title="Compartidos">
                                          <Share2 className="h-3 w-3 text-blue-500" /> {item.compartidos || 0}
                                        </span>
                                        <span className="flex items-center gap-1" title="Vistas">
                                          <Eye className="h-3 w-3 text-gray-400" /> {item.vistas || 0}
                                        </span>
                                        {item.destacado && (
                                          <span title="Destacado">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="flex-1 h-7 text-xs"
                                          onClick={() => {
                                            setEditingItemLocal(item);
                                            setItemLocalForm({
                                              codigo: item.codigo || "",
                                              nombre: item.nombre,
                                              descripcion: item.descripcion || "",
                                              precio1: item.precio1 || "",
                                              precio2: item.precio2 || "",
                                              precio3: item.precio3 || "",
                                              precio4: item.precio4 || "",
                                              etiquetaPrecio1: item.etiquetaPrecio1 || "Personal",
                                              etiquetaPrecio2: item.etiquetaPrecio2 || "Mediana",
                                              etiquetaPrecio3: item.etiquetaPrecio3 || "Familiar",
                                              etiquetaPrecio4: item.etiquetaPrecio4 || "Extra",
                                              categoriaId: item.categoriaId,
                                              imagenUrl: item.imagenUrl || "",
                                              ingredientes: item.ingredientes || "",
                                              tiempoPreparacion: item.tiempoPreparacion || "",
                                              disponible: item.disponible ?? true,
                                              destacado: item.destacado ?? false,
                                            });
                                            setShowItemLocalModal(true);
                                          }}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Editar
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-7 text-destructive hover:text-destructive"
                                          onClick={() => eliminarItemLocalMutation.mutate(item.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Productos sin categoría */}
                        {miCatalogoLocal.items && miCatalogoLocal.items.filter(item => !item.categoriaId).length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Sin categoría</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {miCatalogoLocal.items.filter(item => !item.categoriaId).map((item) => (
                                  <Card key={item.id} className="hover-elevate" data-testid={`card-item-local-${item.id}`}>
                                    <CardContent className="p-3">
                                      {(item.imagenUrl || (item.imagenes && item.imagenes[0])) && (
                                        <img 
                                          src={item.imagenUrl || item.imagenes?.[0]} 
                                          alt={item.nombre}
                                          className="w-full h-24 object-cover rounded mb-2"
                                        />
                                      )}
                                      <div className="flex items-center gap-2">
                                        {item.codigo && (
                                          <Badge variant="outline" className="text-xs shrink-0">{item.codigo}</Badge>
                                        )}
                                        <h5 className="font-medium text-sm truncate">{item.nombre}</h5>
                                      </div>
                                      {/* Sistema de 4 precios flexible con etiquetas del producto */}
                                      {(item.precio1 || item.precio2 || item.precio3 || item.precio4) && (
                                        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                                          {item.precio1 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio1 || "Personal"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio1}</span>
                                            </div>
                                          )}
                                          {item.precio2 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio2 || "Mediana"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio2}</span>
                                            </div>
                                          )}
                                          {item.precio3 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio3 || "Familiar"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio3}</span>
                                            </div>
                                          )}
                                          {item.precio4 && (
                                            <div className="flex items-center justify-between">
                                              <span className="text-muted-foreground">{item.etiquetaPrecio4 || "Extra"}:</span>
                                              <span className="font-bold text-primary">S/ {item.precio4}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1" title="Likes">
                                          <Heart className="h-3 w-3 text-pink-500" /> {item.likes || 0}
                                        </span>
                                        <span className="flex items-center gap-1" title="Favoritos">
                                          <Bookmark className="h-3 w-3 text-yellow-500" /> {item.favoritos || 0}
                                        </span>
                                        <span className="flex items-center gap-1" title="Compartidos">
                                          <Share2 className="h-3 w-3 text-blue-500" /> {item.compartidos || 0}
                                        </span>
                                        <span className="flex items-center gap-1" title="Vistas">
                                          <Eye className="h-3 w-3 text-gray-400" /> {item.vistas || 0}
                                        </span>
                                        {item.destacado && (
                                          <span title="Destacado">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="flex-1 h-7 text-xs"
                                          onClick={() => {
                                            setEditingItemLocal(item);
                                            setItemLocalForm({
                                              codigo: item.codigo || "",
                                              nombre: item.nombre,
                                              descripcion: item.descripcion || "",
                                              precio1: item.precio1 || "",
                                              precio2: item.precio2 || "",
                                              precio3: item.precio3 || "",
                                              precio4: item.precio4 || "",
                                              etiquetaPrecio1: item.etiquetaPrecio1 || "Personal",
                                              etiquetaPrecio2: item.etiquetaPrecio2 || "Mediana",
                                              etiquetaPrecio3: item.etiquetaPrecio3 || "Familiar",
                                              etiquetaPrecio4: item.etiquetaPrecio4 || "Extra",
                                              categoriaId: item.categoriaId,
                                              imagenUrl: item.imagenUrl || "",
                                              ingredientes: item.ingredientes || "",
                                              tiempoPreparacion: item.tiempoPreparacion || "",
                                              disponible: item.disponible ?? true,
                                              destacado: item.destacado ?? false,
                                            });
                                            setShowItemLocalModal(true);
                                          }}
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Editar
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-7 text-destructive hover:text-destructive"
                                          onClick={() => eliminarItemLocalMutation.mutate(item.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    {negocioForm.tipoNegocio === "restaurante" ? "Menú Rápido" : "Catálogo Simple"}
                  </h3>
                  <Button onClick={handleAgregarItem} size="sm" variant="outline" data-testid="button-agregar-item">
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
                        Aún no tienes productos en tu catálogo simple
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
              </div>
            </div>
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

          {/* TAB: Formas de Pago */}
          <TabsContent value="pagos" className="mt-4">
            <FormasPagoTab miNegocio={miNegocio ?? null} />
          </TabsContent>

          {/* TAB: Facturación - Historial de tickets emitidos */}
          <TabsContent value="facturacion" className="mt-4">
            <SeccionFacturacion negocioId={miNegocio?.id || null} />
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
                          {/* Franja de estado del pedido */}
                          <FranjaEstadoPedido 
                            estado={pedido.estado || "pendiente"} 
                            tipoEntrega={pedido.tipoEntrega}
                            compact={true}
                          />
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between flex-wrap gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge 
                                    variant={
                                      pedido.estado === 'pendiente' ? 'secondary' :
                                      ['aceptado', 'preparando', 'en_preparacion'].includes(pedido.estado || '') ? 'default' :
                                      ['listo', 'listo_para_envio'].includes(pedido.estado || '') ? 'secondary' :
                                      pedido.estado === 'en_camino' ? 'default' :
                                      'outline'
                                    }
                                    className={
                                      pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                      pedido.estado === 'aceptado' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                      ['preparando', 'en_preparacion'].includes(pedido.estado || '') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                      ['listo', 'listo_para_envio'].includes(pedido.estado || '') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                      pedido.estado === 'en_camino' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }
                                  >
                                    {pedido.estado === 'pendiente' ? 'Recibido' :
                                     pedido.estado === 'aceptado' ? 'Aceptado' :
                                     ['preparando', 'en_preparacion'].includes(pedido.estado || '') ? 'Preparando' :
                                     ['listo', 'listo_para_envio'].includes(pedido.estado || '') ? 'Listo' :
                                     pedido.estado === 'en_camino' ? 'En Camino' :
                                     ['entregado', 'completado', 'recibido_conforme'].includes(pedido.estado || '') ? 'Entregado' :
                                     pedido.estado}
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
                                  {/* FLUJO: pendiente → aceptado → preparando → listo → en_camino → entregado → recibido_conforme */}
                                  {pedido.estado === 'pendiente' && (
                                    <Button
                                      size="sm"
                                      onClick={() => actualizarPedidoMutation.mutate({ id: pedido.id, estado: 'aceptado' })}
                                      disabled={actualizarPedidoMutation.isPending}
                                      data-testid={`button-aceptar-pedido-${pedido.id}`}
                                    >
                                      {actualizarPedidoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                      )}
                                      Aceptar Pedido
                                    </Button>
                                  )}
                                  {pedido.estado === 'aceptado' && (
                                    <Button
                                      size="sm"
                                      onClick={() => actualizarPedidoMutation.mutate({ id: pedido.id, estado: 'preparando' })}
                                      disabled={actualizarPedidoMutation.isPending}
                                      data-testid={`button-preparar-pedido-${pedido.id}`}
                                    >
                                      {actualizarPedidoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Utensils className="h-4 w-4 mr-1" />
                                      )}
                                      Iniciar Preparación
                                    </Button>
                                  )}
                                  {(pedido.estado === 'preparando' || pedido.estado === 'en_preparacion') && (
                                    <Button
                                      size="sm"
                                      onClick={() => actualizarPedidoMutation.mutate({ id: pedido.id, estado: 'listo' })}
                                      disabled={actualizarPedidoMutation.isPending}
                                      data-testid={`button-listo-pedido-${pedido.id}`}
                                    >
                                      {actualizarPedidoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Package2 className="h-4 w-4 mr-1" />
                                      )}
                                      Marcar Listo
                                    </Button>
                                  )}
                                  {(pedido.estado === 'listo' || pedido.estado === 'listo_para_envio') && (
                                    <Button
                                      size="sm"
                                      onClick={() => actualizarPedidoMutation.mutate({ id: pedido.id, estado: 'en_camino' })}
                                      disabled={actualizarPedidoMutation.isPending}
                                      data-testid={`button-enviar-pedido-${pedido.id}`}
                                    >
                                      {actualizarPedidoMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Truck className="h-4 w-4 mr-1" />
                                      )}
                                      Entregar a Delivery
                                    </Button>
                                  )}
                                  {pedido.estado === 'en_camino' && (
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
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                      )}
                                      Confirmar Entrega
                                    </Button>
                                  )}
                                  {(pedido.estado === 'entregado' || pedido.estado === 'completado' || pedido.estado === 'recibido_conforme') && (
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
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-medium">Gestión de Delivery</h3>
                  <p className="text-sm text-muted-foreground">Solicita delivery/unidad móvil y rastrea entregas</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowSolicitarDeliveryModal(true)}
                  disabled={pedidosListosParaEnvio.length === 0}
                  data-testid="button-solicitar-delivery"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Solicitar Delivery
                  {pedidosListosParaEnvio.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{pedidosListosParaEnvio.length}</Badge>
                  )}
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card data-testid="card-delivery-atendido" className="hover-elevate cursor-pointer">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          Listo para Envío
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold" data-testid="text-delivery-atendido-count">
                          {estadisticasDelivery.atendido}
                        </p>
                        <p className="text-xs text-muted-foreground">Esperando repartidor</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-delivery-encamino" className="hover-elevate cursor-pointer">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          En Camino
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold" data-testid="text-delivery-encamino-count">
                          {estadisticasDelivery.enCamino}
                        </p>
                        <p className="text-xs text-muted-foreground">En tránsito</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-delivery-entregado" className="hover-elevate cursor-pointer">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          Entregado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold" data-testid="text-delivery-entregado-count">
                          {estadisticasDelivery.entregado}
                        </p>
                        <p className="text-xs text-muted-foreground">Completados hoy</p>
                      </CardContent>
                    </Card>
                  </div>

                  {loadingEntregas ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : entregasActivas.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay entregas activas</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {pedidosListosParaEnvio.length > 0 
                            ? `Tienes ${pedidosListosParaEnvio.length} pedido(s) listo(s) para enviar`
                            : 'Prepara un pedido para solicitar delivery'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Entregas Activas ({entregasActivas.length})</h4>
                      {entregasActivas.map((entrega) => (
                        <Card key={entrega.id} data-testid={`card-entrega-${entrega.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={entrega.estado === 'en_camino' ? 'default' : 'secondary'}
                                    className={
                                      entrega.estado === 'en_camino' 
                                        ? 'bg-blue-500 hover:bg-blue-600' 
                                        : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                    }
                                  >
                                    {entrega.estado === 'en_camino' ? 'En Camino' : 'Listo para Envío'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    #{entrega.id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {entrega.direccionEntrega}
                                </div>
                                <div className="text-sm">
                                  {Array.isArray(entrega.productos) && entrega.productos.length > 0 
                                    ? `${entrega.productos.reduce((acc, p) => acc + p.cantidad, 0)} producto(s)`
                                    : 'Sin productos detallados'
                                  }
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="text-lg font-bold text-primary">
                                  S/ {parseFloat(entrega.total || '0').toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                  <Clock className="h-3 w-3" />
                                  {entrega.createdAt ? new Date(entrega.createdAt).toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '--:--'}
                                </p>
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

          {/* TAB: Mapa */}
          <TabsContent value="mapa" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-medium">Mapa en Tiempo Real</h3>
                  <p className="text-sm text-muted-foreground">Visualiza tu negocio y entregas activas</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio/delivery/activas"] });
                    }}
                    data-testid="button-refrescar-mapa"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowMapaExpandido(true)}
                    data-testid="button-expandir-mapa"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Expandir
                  </Button>
                </div>
              </div>
              
              {!miNegocio ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Primero configura los datos de tu negocio</p>
                  </CardContent>
                </Card>
              ) : !miNegocio.latitud || !miNegocio.longitud ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <MapPinned className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Configura la ubicación GPS de tu negocio</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ve a la pestaña "Negocio" y selecciona la ubicación en el mapa
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-0 h-[400px] relative overflow-hidden rounded-lg">
                      <MapContainer
                        center={[miNegocio.latitud, miNegocio.longitud]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker 
                          position={[miNegocio.latitud, miNegocio.longitud]}
                          icon={negocioIcon}
                        >
                          <Popup>
                            <div className="text-center p-1">
                              <p className="font-semibold">{miNegocio.nombreNegocio}</p>
                              <p className="text-xs text-muted-foreground">{miNegocio.direccion || 'Tu negocio'}</p>
                            </div>
                          </Popup>
                        </Marker>
                        {entregasActivas.map((entrega) => (
                          entrega.latitud && entrega.longitud && (
                            <Marker
                              key={entrega.id}
                              position={[entrega.latitud, entrega.longitud]}
                              icon={entrega.estado === 'en_camino' ? deliveryEnCaminoIcon : deliveryPendienteIcon}
                            >
                              <Popup>
                                <div className="p-1">
                                  <p className="font-semibold text-sm">Entrega #{entrega.id.slice(-6)}</p>
                                  <p className="text-xs">{entrega.direccionEntrega}</p>
                                  <Badge 
                                    variant={entrega.estado === 'en_camino' ? 'default' : 'secondary'}
                                    className="mt-1 text-xs"
                                  >
                                    {entrega.estado === 'en_camino' ? 'En camino' : 
                                     entrega.estado === 'listo_para_envio' ? 'Esperando repartidor' : 
                                     entrega.estado}
                                  </Badge>
                                  <p className="text-xs font-medium mt-1">S/ {parseFloat(entrega.total || '0').toFixed(2)}</p>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}
                      </MapContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3 text-center">
                        <Store className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Tu Negocio</p>
                        <p className="font-medium text-sm truncate">{miNegocio.nombreNegocio}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                      <CardContent className="p-3 text-center">
                        <Package2 className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Esperando</p>
                        <p className="font-medium text-lg">{entregasActivas.filter(e => e.estado === 'listo_para_envio').length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/20">
                      <CardContent className="p-3 text-center">
                        <Truck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">En Camino</p>
                        <p className="font-medium text-lg">{entregasActivas.filter(e => e.estado === 'en_camino').length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-500/5 border-green-500/20">
                      <CardContent className="p-3 text-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Entregadas Hoy</p>
                        <p className="font-medium text-lg">{estadisticasDelivery.entregado}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {entregasActivas.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Entregas en el Mapa
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {entregasActivas.map((entrega) => (
                          <div 
                            key={entrega.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                entrega.estado === 'en_camino' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`} />
                              <div>
                                <p className="text-sm font-medium">#{entrega.id.slice(-6)}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {entrega.direccionEntrega}
                                </p>
                              </div>
                            </div>
                            <Badge variant={entrega.estado === 'en_camino' ? 'default' : 'secondary'}>
                              {entrega.estado === 'en_camino' ? 'En camino' : 'Esperando'}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* TAB: Historial */}
          <TabsContent value="historial" className="mt-4">
            <HistorialTab miNegocio={miNegocio ?? null} />
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
                <div className="grid grid-cols-5 gap-3">
                  {logosServicios.map((logo) => (
                    <div 
                      key={logo.id} 
                      className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleSelectLogoFromCarrusel(logo)}
                      data-testid={`logo-servicio-${logo.id}`}
                    >
                      {logo.logoUrl ? (
                        <img 
                          src={logo.logoUrl} 
                          alt={logo.nombre}
                          className="w-14 h-14 object-contain rounded-full bg-transparent"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                          <Store className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs mt-1 truncate w-full text-center">{logo.nombre}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                ¿No encuentras el logo que buscas?
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowLogoSelector(false);
                  setShowSugerirLogoModal(true);
                }}
                data-testid="button-sugerir-logo"
              >
                <Plus className="h-4 w-4 mr-2" />
                Sugerir un nuevo logo para aprobación
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoSelector(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal sugerir logo propio */}
        <Dialog open={showSugerirLogoModal} onOpenChange={setShowSugerirLogoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sugerir Nuevo Logo</DialogTitle>
              <DialogDescription>
                Sube un logo de tu servicio. El administrador lo revisará y aprobará para que aparezca en el carrusel de servicios.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-logo">Nombre del Servicio *</Label>
                <Input
                  id="nombre-logo"
                  value={logoSugerido.nombre}
                  onChange={(e) => setLogoSugerido({ ...logoSugerido, nombre: e.target.value })}
                  placeholder="Ej: Mi Restaurante"
                  data-testid="input-nombre-logo-sugerido"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion-logo">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion-logo"
                  value={logoSugerido.descripcion}
                  onChange={(e) => setLogoSugerido({ ...logoSugerido, descripcion: e.target.value })}
                  placeholder="Breve descripción del servicio..."
                  className="min-h-[80px]"
                  data-testid="input-descripcion-logo-sugerido"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo del Servicio *</Label>
                <ImageUpload
                  value={logoSugerido.logoUrl}
                  onChange={(url) => setLogoSugerido({ ...logoSugerido, logoUrl: url || "" })}
                  endpoint="servicios"
                  enableEditor={true}
                  aspectRatio={1}
                  maxSize={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSugerirLogoModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!logoSugerido.nombre?.trim()) {
                    toast({ title: "El nombre es requerido", variant: "destructive" });
                    return;
                  }
                  if (!logoSugerido.logoUrl) {
                    toast({ title: "Debes subir una imagen del logo", variant: "destructive" });
                    return;
                  }
                  sugerirLogoMutation.mutate(logoSugerido);
                }}
                disabled={sugerirLogoMutation.isPending}
                data-testid="button-enviar-logo-sugerido"
              >
                {sugerirLogoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enviar para Aprobación
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

        {/* Modal Solicitar Delivery */}
        <Dialog open={showSolicitarDeliveryModal} onOpenChange={setShowSolicitarDeliveryModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Solicitar Delivery
              </DialogTitle>
              <DialogDescription>
                Selecciona un pedido listo para solicitar un repartidor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pedidosListosParaEnvio.length === 0 ? (
                <div className="text-center py-8">
                  <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay pedidos listos para envío</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Primero atiende un pedido desde la pestaña de Pedidos
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {pedidosListosParaEnvio.map((pedido) => (
                      <Card 
                        key={pedido.id} 
                        className="hover-elevate cursor-pointer"
                        data-testid={`card-solicitar-delivery-${pedido.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                                  En Preparación
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  #{pedido.id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {pedido.direccionEntrega}
                              </div>
                              {pedido.cliente && (
                                <div className="text-sm">
                                  Cliente: {pedido.cliente.nombre}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-bold text-primary">
                                S/ {parseFloat(pedido.total || '0').toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => solicitarDeliveryMutation.mutate(pedido.id)}
                                disabled={solicitarDeliveryMutation.isPending}
                                data-testid={`button-confirmar-delivery-${pedido.id}`}
                              >
                                {solicitarDeliveryMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Truck className="h-4 w-4 mr-1" />
                                    Enviar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSolicitarDeliveryModal(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Mapa Expandido */}
        <Dialog open={showMapaExpandido} onOpenChange={setShowMapaExpandido}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Mapa en Tiempo Real - {miNegocio?.nombreNegocio}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full min-h-[500px]">
              {miNegocio?.latitud && miNegocio?.longitud && (
                <MapContainer
                  center={[miNegocio.latitud, miNegocio.longitud]}
                  zoom={15}
                  style={{ height: "100%", width: "100%", borderRadius: "8px" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker 
                    position={[miNegocio.latitud, miNegocio.longitud]}
                    icon={negocioIcon}
                  >
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-semibold">{miNegocio.nombreNegocio}</p>
                        <p className="text-xs text-muted-foreground">{miNegocio.direccion || 'Tu negocio'}</p>
                      </div>
                    </Popup>
                  </Marker>
                  {entregasActivas.map((entrega) => (
                    entrega.latitud && entrega.longitud && (
                      <Marker
                        key={entrega.id}
                        position={[entrega.latitud, entrega.longitud]}
                        icon={entrega.estado === 'en_camino' ? deliveryEnCaminoIcon : deliveryPendienteIcon}
                      >
                        <Popup>
                          <div className="p-1">
                            <p className="font-semibold text-sm">Entrega #{entrega.id.slice(-6)}</p>
                            <p className="text-xs">{entrega.direccionEntrega}</p>
                            <Badge 
                              variant={entrega.estado === 'en_camino' ? 'default' : 'secondary'}
                              className="mt-1 text-xs"
                            >
                              {entrega.estado === 'en_camino' ? 'En camino' : 
                               entrega.estado === 'listo_para_envio' ? 'Esperando repartidor' : 
                               entrega.estado}
                            </Badge>
                            <p className="text-xs font-medium mt-1">S/ {parseFloat(entrega.total || '0').toFixed(2)}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para crear catálogo local */}
        <Dialog open={showCatalogoLocalModal} onOpenChange={setShowCatalogoLocalModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Mi Catálogo Local</DialogTitle>
              <DialogDescription>
                Crea tu catálogo para organizar productos en categorías
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombreCatalogo">Nombre del Catálogo *</Label>
                <Input
                  id="nombreCatalogo"
                  placeholder="Mi Tienda Online"
                  data-testid="input-nombre-catalogo"
                  onChange={(e) => {}}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcionCatalogo">Descripción</Label>
                <Textarea
                  id="descripcionCatalogo"
                  placeholder="Describe tu catálogo..."
                  data-testid="input-descripcion-catalogo"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCatalogoLocalModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  const nombreInput = document.getElementById('nombreCatalogo') as HTMLInputElement;
                  const descInput = document.getElementById('descripcionCatalogo') as HTMLTextAreaElement;
                  if (nombreInput?.value) {
                    crearCatalogoLocalMutation.mutate({
                      nombre: nombreInput.value,
                      descripcion: descInput?.value || undefined,
                    });
                  }
                }}
                disabled={crearCatalogoLocalMutation.isPending}
                data-testid="button-guardar-catalogo"
              >
                {crearCatalogoLocalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Crear Catálogo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para crear/editar categoría */}
        <Dialog open={showCategoriaModal} onOpenChange={(open) => {
          setShowCategoriaModal(open);
          if (!open) {
            setEditingCategoria(null);
            setCategoriaForm({ codigo: "", nombre: "", descripcion: "", icono: "", categoriaPadreId: null, etiquetaPrecio1: "Personal", etiquetaPrecio2: "Mediana", etiquetaPrecio3: "Familiar", etiquetaPrecio4: "Extra", habilitarPrecio1: true, habilitarPrecio2: true, habilitarPrecio3: true, habilitarPrecio4: true });
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategoria ? "Editar" : "Nueva"} Categoría</DialogTitle>
              <DialogDescription>
                {editingCategoria ? "Modifica los datos de la categoría" : "Crea una nueva categoría para tu catálogo"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4 px-1">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigoCategoria">Código</Label>
                    <Input
                      id="codigoCategoria"
                      value={categoriaForm.codigo || ""}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, codigo: e.target.value })}
                      placeholder="1.00"
                      data-testid="input-codigo-categoria"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nombreCategoria">Nombre *</Label>
                    <Input
                      id="nombreCategoria"
                      value={categoriaForm.nombre || ""}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                      placeholder="Ej: PIZZAS CLASICAS"
                      data-testid="input-nombre-categoria"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcionCategoria">Descripción</Label>
                  <Textarea
                    id="descripcionCategoria"
                    value={categoriaForm.descripcion || ""}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })}
                    placeholder="Descripción de la categoría..."
                    data-testid="input-descripcion-categoria"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iconoCategoria">Icono (emoji)</Label>
                    <Input
                      id="iconoCategoria"
                      value={categoriaForm.icono || ""}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, icono: e.target.value })}
                      placeholder="🍕"
                      data-testid="input-icono-categoria"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría Padre</Label>
                    <Select
                      value={categoriaForm.categoriaPadreId || "none"}
                      onValueChange={(value) => setCategoriaForm({ 
                        ...categoriaForm, 
                        categoriaPadreId: value === "none" ? null : value 
                      })}
                    >
                      <SelectTrigger data-testid="select-categoria-padre">
                        <SelectValue placeholder="Sin categoría padre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría padre</SelectItem>
                        {miCatalogoLocal?.categorias?.filter(c => !c.categoriaPadreId && c.id !== editingCategoria?.id).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.codigo && <span className="text-muted-foreground mr-1">{cat.codigo}</span>}
                            {cat.icono} {cat.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Etiquetas de precios personalizables */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Etiquetas de Tamaños/Precios
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Personaliza los nombres de cada columna de precio. Desmarca para ocultar columnas.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio1"
                          checked={categoriaForm.habilitarPrecio1 !== false}
                          onCheckedChange={(checked) => setCategoriaForm({ ...categoriaForm, habilitarPrecio1: !!checked })}
                          data-testid="checkbox-habilitar-precio-1"
                        />
                        <Label htmlFor="habilitarPrecio1" className="text-xs text-muted-foreground">Precio 1</Label>
                      </div>
                      <Input
                        id="etiquetaPrecio1"
                        value={categoriaForm.etiquetaPrecio1 || "Personal"}
                        onChange={(e) => setCategoriaForm({ ...categoriaForm, etiquetaPrecio1: e.target.value })}
                        placeholder="Personal"
                        disabled={categoriaForm.habilitarPrecio1 === false}
                        data-testid="input-etiqueta-precio-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio2"
                          checked={categoriaForm.habilitarPrecio2 !== false}
                          onCheckedChange={(checked) => setCategoriaForm({ ...categoriaForm, habilitarPrecio2: !!checked })}
                          data-testid="checkbox-habilitar-precio-2"
                        />
                        <Label htmlFor="habilitarPrecio2" className="text-xs text-muted-foreground">Precio 2</Label>
                      </div>
                      <Input
                        id="etiquetaPrecio2"
                        value={categoriaForm.etiquetaPrecio2 || "Mediana"}
                        onChange={(e) => setCategoriaForm({ ...categoriaForm, etiquetaPrecio2: e.target.value })}
                        placeholder="Mediana"
                        disabled={categoriaForm.habilitarPrecio2 === false}
                        data-testid="input-etiqueta-precio-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio3"
                          checked={categoriaForm.habilitarPrecio3 !== false}
                          onCheckedChange={(checked) => setCategoriaForm({ ...categoriaForm, habilitarPrecio3: !!checked })}
                          data-testid="checkbox-habilitar-precio-3"
                        />
                        <Label htmlFor="habilitarPrecio3" className="text-xs text-muted-foreground">Precio 3</Label>
                      </div>
                      <Input
                        id="etiquetaPrecio3"
                        value={categoriaForm.etiquetaPrecio3 || "Familiar"}
                        onChange={(e) => setCategoriaForm({ ...categoriaForm, etiquetaPrecio3: e.target.value })}
                        placeholder="Familiar"
                        disabled={categoriaForm.habilitarPrecio3 === false}
                        data-testid="input-etiqueta-precio-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio4"
                          checked={categoriaForm.habilitarPrecio4 !== false}
                          onCheckedChange={(checked) => setCategoriaForm({ ...categoriaForm, habilitarPrecio4: !!checked })}
                          data-testid="checkbox-habilitar-precio-4"
                        />
                        <Label htmlFor="habilitarPrecio4" className="text-xs text-muted-foreground">Precio 4</Label>
                      </div>
                      <Input
                        id="etiquetaPrecio4"
                        value={categoriaForm.etiquetaPrecio4 || "Extra"}
                        onChange={(e) => setCategoriaForm({ ...categoriaForm, etiquetaPrecio4: e.target.value })}
                        placeholder="Extra"
                        disabled={categoriaForm.habilitarPrecio4 === false}
                        data-testid="input-etiqueta-precio-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoriaModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (categoriaForm.nombre) {
                    guardarCategoriaLocalMutation.mutate(categoriaForm);
                  }
                }}
                disabled={guardarCategoriaLocalMutation.isPending || !categoriaForm.nombre}
                data-testid="button-guardar-categoria"
              >
                {guardarCategoriaLocalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingCategoria ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para crear/editar producto local */}
        <Dialog open={showItemLocalModal} onOpenChange={(open) => {
          setShowItemLocalModal(open);
          if (!open) {
            setEditingItemLocal(null);
            setItemLocalForm({ nombre: "", descripcion: "", codigo: "", precio1: "", precio2: "", precio3: "", precio4: "", categoriaId: null, imagenUrl: "", ingredientes: "", tiempoPreparacion: "", disponible: true, destacado: false });
          }
        }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingItemLocal ? "Editar" : "Nuevo"} Producto</DialogTitle>
              <DialogDescription>
                {editingItemLocal ? "Modifica los datos del producto" : "Agrega un nuevo producto a tu catálogo"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4 px-1">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="codigoItemLocal">Código</Label>
                    <Input
                      id="codigoItemLocal"
                      value={itemLocalForm.codigo || ""}
                      onChange={(e) => setItemLocalForm({ ...itemLocalForm, codigo: e.target.value })}
                      placeholder="1.01"
                      data-testid="input-codigo-item-local"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nombreItemLocal">Nombre *</Label>
                    <Input
                      id="nombreItemLocal"
                      value={itemLocalForm.nombre || ""}
                      onChange={(e) => setItemLocalForm({ ...itemLocalForm, nombre: e.target.value })}
                      placeholder="Nombre del producto"
                      data-testid="input-nombre-item-local"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcionItemLocal">Descripción</Label>
                  <Textarea
                    id="descripcionItemLocal"
                    value={itemLocalForm.descripcion || ""}
                    onChange={(e) => setItemLocalForm({ ...itemLocalForm, descripcion: e.target.value })}
                    placeholder="Descripción del producto..."
                    data-testid="input-descripcion-item-local"
                  />
                </div>
                
                {/* Sistema de 4 Precios con etiquetas editables */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Precios por Tamaño (etiquetas editables)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Precio 1 */}
                    <div className="space-y-1 p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio1"
                          checked={!!itemLocalForm.precio1}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              setItemLocalForm({ ...itemLocalForm, precio1: "" });
                            }
                          }}
                          data-testid="checkbox-precio1-item"
                        />
                        <Input
                          value={itemLocalForm.etiquetaPrecio1 || "Personal"}
                          onChange={(e) => setItemLocalForm({ ...itemLocalForm, etiquetaPrecio1: e.target.value })}
                          className="h-7 text-xs font-medium flex-1 px-2"
                          placeholder="Etiqueta"
                          data-testid="input-etiqueta-precio1"
                        />
                      </div>
                      <Input
                        id="precio1ItemLocal"
                        type="number"
                        step="0.01"
                        value={itemLocalForm.precio1 || ""}
                        onChange={(e) => setItemLocalForm({ ...itemLocalForm, precio1: e.target.value })}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val && !isNaN(parseFloat(val))) {
                            setItemLocalForm({ ...itemLocalForm, precio1: parseFloat(val).toFixed(2) });
                          }
                        }}
                        placeholder="0.00"
                        data-testid="input-precio1-item-local"
                      />
                    </div>
                    {/* Precio 2 */}
                    <div className="space-y-1 p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio2"
                          checked={!!itemLocalForm.precio2}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              setItemLocalForm({ ...itemLocalForm, precio2: "" });
                            }
                          }}
                          data-testid="checkbox-precio2-item"
                        />
                        <Input
                          value={itemLocalForm.etiquetaPrecio2 || "Mediana"}
                          onChange={(e) => setItemLocalForm({ ...itemLocalForm, etiquetaPrecio2: e.target.value })}
                          className="h-7 text-xs font-medium flex-1 px-2"
                          placeholder="Etiqueta"
                          data-testid="input-etiqueta-precio2"
                        />
                      </div>
                      <Input
                        id="precio2ItemLocal"
                        type="number"
                        step="0.01"
                        value={itemLocalForm.precio2 || ""}
                        onChange={(e) => setItemLocalForm({ ...itemLocalForm, precio2: e.target.value })}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val && !isNaN(parseFloat(val))) {
                            setItemLocalForm({ ...itemLocalForm, precio2: parseFloat(val).toFixed(2) });
                          }
                        }}
                        placeholder="0.00"
                        data-testid="input-precio2-item-local"
                      />
                    </div>
                    {/* Precio 3 */}
                    <div className="space-y-1 p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio3"
                          checked={!!itemLocalForm.precio3}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              setItemLocalForm({ ...itemLocalForm, precio3: "" });
                            }
                          }}
                          data-testid="checkbox-precio3-item"
                        />
                        <Input
                          value={itemLocalForm.etiquetaPrecio3 || "Familiar"}
                          onChange={(e) => setItemLocalForm({ ...itemLocalForm, etiquetaPrecio3: e.target.value })}
                          className="h-7 text-xs font-medium flex-1 px-2"
                          placeholder="Etiqueta"
                          data-testid="input-etiqueta-precio3"
                        />
                      </div>
                      <Input
                        id="precio3ItemLocal"
                        type="number"
                        step="0.01"
                        value={itemLocalForm.precio3 || ""}
                        onChange={(e) => setItemLocalForm({ ...itemLocalForm, precio3: e.target.value })}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val && !isNaN(parseFloat(val))) {
                            setItemLocalForm({ ...itemLocalForm, precio3: parseFloat(val).toFixed(2) });
                          }
                        }}
                        placeholder="0.00"
                        data-testid="input-precio3-item-local"
                      />
                    </div>
                    {/* Precio 4 */}
                    <div className="space-y-1 p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="habilitarPrecio4"
                          checked={!!itemLocalForm.precio4}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              setItemLocalForm({ ...itemLocalForm, precio4: "" });
                            }
                          }}
                          data-testid="checkbox-precio4-item"
                        />
                        <Input
                          value={itemLocalForm.etiquetaPrecio4 || "Extra"}
                          onChange={(e) => setItemLocalForm({ ...itemLocalForm, etiquetaPrecio4: e.target.value })}
                          className="h-7 text-xs font-medium flex-1 px-2"
                          placeholder="Etiqueta"
                          data-testid="input-etiqueta-precio4"
                        />
                      </div>
                      <Input
                        id="precio4ItemLocal"
                        type="number"
                        step="0.01"
                        value={itemLocalForm.precio4 || ""}
                        onChange={(e) => setItemLocalForm({ ...itemLocalForm, precio4: e.target.value })}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val && !isNaN(parseFloat(val))) {
                            setItemLocalForm({ ...itemLocalForm, precio4: parseFloat(val).toFixed(2) });
                          }
                        }}
                        placeholder="0.00"
                        data-testid="input-precio4-item-local"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={itemLocalForm.categoriaId || "none"}
                    onValueChange={(value) => setItemLocalForm({ 
                      ...itemLocalForm, 
                      categoriaId: value === "none" ? null : value 
                    })}
                  >
                    <SelectTrigger data-testid="select-categoria-item">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {miCatalogoLocal?.categorias?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.codigo && <span className="text-muted-foreground mr-1">{cat.codigo}</span>}
                          {cat.icono} {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ingredientesItemLocal">Ingredientes</Label>
                    <Textarea
                      id="ingredientesItemLocal"
                      value={itemLocalForm.ingredientes || ""}
                      onChange={(e) => setItemLocalForm({ ...itemLocalForm, ingredientes: e.target.value })}
                      placeholder="Lista de ingredientes..."
                      className="h-20"
                      data-testid="input-ingredientes-item-local"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiempoItemLocal">Tiempo Preparación</Label>
                    <Input
                      id="tiempoItemLocal"
                      value={itemLocalForm.tiempoPreparacion || ""}
                      onChange={(e) => setItemLocalForm({ ...itemLocalForm, tiempoPreparacion: e.target.value })}
                      placeholder="15-20 min"
                      data-testid="input-tiempo-item-local"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Imagen del Producto</Label>
                  <ImageUpload
                    value={itemLocalForm.imagenUrl}
                    onChange={(url) => setItemLocalForm({ 
                      ...itemLocalForm, 
                      imagenUrl: url || "" 
                    })}
                    endpoint="servicios"
                    enableEditor={true}
                    aspectRatio={1}
                    maxSize={5}
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="disponibleItemLocal"
                      checked={itemLocalForm.disponible ?? true}
                      onChange={(e) => setItemLocalForm({ ...itemLocalForm, disponible: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="disponibleItemLocal" className="cursor-pointer">Disponible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="destacadoItemLocal"
                      checked={itemLocalForm.destacado ?? false}
                      onChange={(e) => setItemLocalForm({ ...itemLocalForm, destacado: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="destacadoItemLocal" className="cursor-pointer">Destacado</Label>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemLocalModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (itemLocalForm.nombre) {
                    guardarItemLocalMutation.mutate(itemLocalForm);
                  }
                }}
                disabled={guardarItemLocalMutation.isPending || !itemLocalForm.nombre}
                data-testid="button-guardar-item-local"
              >
                {guardarItemLocalMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingItemLocal ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Carta Digital */}
        <CartaDigitalModal
          open={showCartaDigitalModal}
          onOpenChange={setShowCartaDigitalModal}
          catalogo={miCatalogoLocal || null}
          datosNegocio={miNegocio ? {
            nombreNegocio: miNegocio.nombreNegocio,
            logoUrl: miNegocio.logoUrl,
            bannerUrl: miNegocio.bannerUrl,
          } : null}
        />

      </CardContent>
    </Card>
  );
}
