import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Wallet, CreditCard, TrendingUp, TrendingDown, Search, Plus, DollarSign, 
  Percent, Check, X, Clock, AlertCircle, Banknote, Building, Smartphone,
  Globe, ArrowUpRight, ArrowDownRight, RefreshCw, Eye, Trash2, Edit, ZoomIn, Image as ImageIcon,
  Phone, MessageCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiWhatsapp } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

type MetodoPago = {
  id: string;
  tipo: string;
  nombre: string;
  numeroCuenta?: string;
  cci?: string;
  numero?: string;
  telefono?: string;
  email?: string;
  titular?: string;
  banco?: string;
  moneda: string;
  esPlataforma: boolean;
  activo: boolean;
  orden: number;
  usuarioId?: string;
};

type Moneda = {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  activo: boolean;
  tasaCambio?: string;
  orden: number;
};

type SaldoUsuario = {
  id: string;
  usuarioId: string;
  saldo: string;
  monedaPreferida: string;
  totalIngresos: string;
  totalEgresos: string;
};

type SolicitudSaldo = {
  id: string;
  usuarioId: string;
  tipo: string;
  monto: string;
  metodoPagoId?: string;
  numeroOperacion?: string;
  comprobante?: string;
  estado: string;
  notas?: string;
  motivoRechazo?: string;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  createdAt: string;
};

type TransaccionSaldo = {
  id: string;
  usuarioId: string;
  tipo: string;
  concepto: string;
  monto: string;
  saldoAnterior: string;
  saldoNuevo: string;
  estado: string;
  createdAt: string;
};

type PlanMembresia = {
  id: string;
  nombre: string;
  descripcion?: string;
  duracionMeses: number;
  precioNormal: string;
  precioDescuento?: string;
  porcentajeDescuento?: number;
  beneficios?: string[];
  productosIncluidos: number;
  destacado: boolean;
  activo: boolean;
  orden: number;
};

type MembresiaUsuario = {
  id: string;
  usuarioId: string;
  planId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  montoTotal: string;
  metodoPago?: string;
  productosCreados: number;
  renovacionAutomatica: boolean;
  createdAt: string;
};

type ConfiguracionCosto = {
  id: string;
  tipoServicio: string;
  nombre: string;
  descripcion?: string;
  montoFijo?: string;
  porcentaje?: string;
  usarMontoFijo: boolean;
  saldoMinimo?: string;
  activo: boolean;
};

export default function GestionCarteraScreen() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("solicitudes");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMetodoModal, setShowMetodoModal] = useState(false);
  const [showMonedaModal, setShowMonedaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudSaldo | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [showContactoModal, setShowContactoModal] = useState(false);
  const [usuarioContacto, setUsuarioContacto] = useState<any>(null);
  const [nuevoMetodo, setNuevoMetodo] = useState({
    tipo: "cuenta_bancaria",
    nombre: "",
    numeroCuenta: "",
    cci: "",
    telefono: "",
    email: "",
    titular: "",
    moneda: "PEN",
    esPlataforma: true,
    activo: true,
    orden: 1,
  });
  const [metodoEditando, setMetodoEditando] = useState<MetodoPago | null>(null);
  const [monedaEditando, setMonedaEditando] = useState<Moneda | null>(null);
  const [nuevaMoneda, setNuevaMoneda] = useState({
    codigo: "",
    nombre: "",
    simbolo: "",
    tasaCambio: "1.00",
    activo: true,
    orden: 1,
  });
  const { toast } = useToast();

  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery<any[]>({
    queryKey: ["/api/usuarios"],
  });

  const { data: saldos = [], isLoading: loadingSaldos } = useQuery<SaldoUsuario[]>({
    queryKey: ["/api/saldos"],
  });

  const { data: solicitudes = [], isLoading: loadingSolicitudes } = useQuery<SolicitudSaldo[]>({
    queryKey: ["/api/solicitudes-saldo"],
  });

  const { data: transacciones = [], isLoading: loadingTransacciones } = useQuery<TransaccionSaldo[]>({
    queryKey: ["/api/transacciones-saldo"],
  });

  const { data: metodosPago = [], isLoading: loadingMetodos } = useQuery<MetodoPago[]>({
    queryKey: ["/api/metodos-pago", { esPlataforma: true }],
    queryFn: () => fetch("/api/metodos-pago?esPlataforma=true").then(res => res.json()),
  });

  const { data: monedas = [], isLoading: loadingMonedas } = useQuery<Moneda[]>({
    queryKey: ["/api/monedas"],
  });

  const { data: planes = [], isLoading: loadingPlanes } = useQuery<PlanMembresia[]>({
    queryKey: ["/api/planes-membresia", { todos: true }],
    queryFn: () => fetch("/api/planes-membresia?todos=true").then(res => res.json()),
  });

  const { data: membresias = [], isLoading: loadingMembresias } = useQuery<MembresiaUsuario[]>({
    queryKey: ["/api/membresias"],
  });

  const { data: configuracionCostos = [], isLoading: loadingCostos } = useQuery<ConfiguracionCosto[]>({
    queryKey: ["/api/configuracion-costos"],
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planEditando, setPlanEditando] = useState<PlanMembresia | null>(null);
  const [nuevoPlan, setNuevoPlan] = useState({
    nombre: "",
    descripcion: "",
    duracionMeses: 1,
    precioNormal: "",
    precioDescuento: "",
    porcentajeDescuento: 0,
    beneficios: [] as string[],
    productosIncluidos: 10,
    destacado: false,
    activo: true,
    orden: 1,
  });
  const [nuevoBeneficio, setNuevoBeneficio] = useState("");

  const [showCostoModal, setShowCostoModal] = useState(false);
  const [costoEditando, setCostoEditando] = useState<ConfiguracionCosto | null>(null);

  const aprobarMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/solicitudes-saldo/${id}/aprobar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes-saldo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saldos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transacciones-saldo"] });
      toast({ title: "Solicitud aprobada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al aprobar solicitud", variant: "destructive" });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, motivoRechazo }: { id: string; motivoRechazo: string }) =>
      apiRequest("POST", `/api/solicitudes-saldo/${id}/rechazar`, { motivoRechazo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes-saldo"] });
      setShowRechazoModal(false);
      setMotivoRechazo("");
      setSelectedSolicitud(null);
      toast({ title: "Solicitud rechazada" });
    },
    onError: () => {
      toast({ title: "Error al rechazar solicitud", variant: "destructive" });
    },
  });

  const observarMutation = useMutation({
    mutationFn: ({ id, notas }: { id: string; notas?: string }) =>
      apiRequest("POST", `/api/solicitudes-saldo/${id}/observar`, { notas }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes-saldo"] });
      toast({ title: "Solicitud marcada como observada", description: "Requiere revisión adicional" });
    },
    onError: () => {
      toast({ title: "Error al observar solicitud", variant: "destructive" });
    },
  });

  const crearMetodoMutation = useMutation({
    mutationFn: (data: typeof nuevoMetodo) => apiRequest("POST", "/api/metodos-pago", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metodos-pago", { esPlataforma: true }] });
      setShowMetodoModal(false);
      resetMetodoForm();
      toast({ title: "Metodo de pago creado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al crear metodo de pago", variant: "destructive" });
    },
  });

  const eliminarMetodoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/metodos-pago/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metodos-pago", { esPlataforma: true }] });
      toast({ title: "Metodo de pago eliminado" });
    },
    onError: () => {
      toast({ title: "Error al eliminar metodo de pago", variant: "destructive" });
    },
  });

  const actualizarMetodoMutation = useMutation({
    mutationFn: (data: { id: string } & Partial<typeof nuevoMetodo>) => 
      apiRequest("PATCH", `/api/metodos-pago/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metodos-pago", { esPlataforma: true }] });
      setShowMetodoModal(false);
      setMetodoEditando(null);
      resetMetodoForm();
      toast({ title: "Metodo de pago actualizado" });
    },
    onError: () => {
      toast({ title: "Error al actualizar metodo de pago", variant: "destructive" });
    },
  });

  const toggleMetodoActivoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => 
      apiRequest("PATCH", `/api/metodos-pago/${id}`, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metodos-pago", { esPlataforma: true }] });
      toast({ title: "Estado actualizado" });
    },
    onError: () => {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    },
  });

  const crearMonedaMutation = useMutation({
    mutationFn: (data: typeof nuevaMoneda) => apiRequest("POST", "/api/monedas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monedas"] });
      setShowMonedaModal(false);
      resetMonedaForm();
      toast({ title: "Moneda creada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al crear moneda", variant: "destructive" });
    },
  });

  const eliminarMonedaMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/monedas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monedas"] });
      toast({ title: "Moneda eliminada" });
    },
    onError: () => {
      toast({ title: "Error al eliminar moneda", variant: "destructive" });
    },
  });

  const actualizarMonedaMutation = useMutation({
    mutationFn: (data: { id: string } & Partial<typeof nuevaMoneda>) => 
      apiRequest("PATCH", `/api/monedas/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monedas"] });
      setShowMonedaModal(false);
      setMonedaEditando(null);
      resetMonedaForm();
      toast({ title: "Moneda actualizada" });
    },
    onError: () => {
      toast({ title: "Error al actualizar moneda", variant: "destructive" });
    },
  });

  const toggleMonedaActivaMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => 
      apiRequest("PATCH", `/api/monedas/${id}`, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monedas"] });
      toast({ title: "Estado actualizado" });
    },
    onError: () => {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    },
  });

  const crearPlanMutation = useMutation({
    mutationFn: (data: typeof nuevoPlan) => apiRequest("POST", "/api/planes-membresia", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planes-membresia", { todos: true }] });
      setShowPlanModal(false);
      resetPlanForm();
      toast({ title: "Plan creado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al crear plan", variant: "destructive" });
    },
  });

  const actualizarPlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof nuevoPlan> }) =>
      apiRequest("PATCH", `/api/planes-membresia/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planes-membresia", { todos: true }] });
      setShowPlanModal(false);
      setPlanEditando(null);
      resetPlanForm();
      toast({ title: "Plan actualizado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al actualizar plan", variant: "destructive" });
    },
  });

  const eliminarPlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/planes-membresia/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planes-membresia", { todos: true }] });
      toast({ title: "Plan eliminado" });
    },
    onError: () => {
      toast({ title: "Error al eliminar plan", variant: "destructive" });
    },
  });

  const aprobarMembresiaMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/membresias/${id}/aprobar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membresias"] });
      toast({ title: "Membresia aprobada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al aprobar membresia", variant: "destructive" });
    },
  });

  const actualizarCostoMutation = useMutation({
    mutationFn: (data: Partial<ConfiguracionCosto>) => apiRequest("POST", "/api/configuracion-costos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuracion-costos"] });
      setShowCostoModal(false);
      setCostoEditando(null);
      toast({ title: "Configuracion actualizada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al actualizar configuracion", variant: "destructive" });
    },
  });

  const resetPlanForm = () => {
    setNuevoPlan({
      nombre: "",
      descripcion: "",
      duracionMeses: 1,
      precioNormal: "",
      precioDescuento: "",
      porcentajeDescuento: 0,
      beneficios: [],
      productosIncluidos: 10,
      destacado: false,
      activo: true,
      orden: 1,
    });
    setNuevoBeneficio("");
  };

  const agregarBeneficio = () => {
    if (nuevoBeneficio.trim()) {
      setNuevoPlan(prev => ({
        ...prev,
        beneficios: [...prev.beneficios, nuevoBeneficio.trim()]
      }));
      setNuevoBeneficio("");
    }
  };

  const eliminarBeneficio = (index: number) => {
    setNuevoPlan(prev => ({
      ...prev,
      beneficios: prev.beneficios.filter((_, i) => i !== index)
    }));
  };

  const abrirEditarPlan = (plan: PlanMembresia) => {
    setPlanEditando(plan);
    setNuevoPlan({
      nombre: plan.nombre,
      descripcion: plan.descripcion || "",
      duracionMeses: plan.duracionMeses,
      precioNormal: plan.precioNormal,
      precioDescuento: plan.precioDescuento || "",
      porcentajeDescuento: plan.porcentajeDescuento || 0,
      beneficios: plan.beneficios || [],
      productosIncluidos: plan.productosIncluidos,
      destacado: plan.destacado,
      activo: plan.activo,
      orden: plan.orden,
    });
    setShowPlanModal(true);
  };

  const guardarPlan = () => {
    if (planEditando) {
      actualizarPlanMutation.mutate({ id: planEditando.id, data: nuevoPlan });
    } else {
      crearPlanMutation.mutate(nuevoPlan);
    }
  };

  const getPlanNombre = (planId: string) => {
    const plan = planes.find(p => p.id === planId);
    return plan?.nombre || "Plan desconocido";
  };

  const getEstadoMembresia = (estado: string) => {
    switch (estado) {
      case "activa":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Activa</Badge>;
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "vencida":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Vencida</Badge>;
      case "cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const resetMetodoForm = () => {
    setNuevoMetodo({
      tipo: "cuenta_bancaria",
      nombre: "",
      numeroCuenta: "",
      cci: "",
      telefono: "",
      email: "",
      titular: "",
      moneda: "PEN",
      esPlataforma: true,
      activo: true,
      orden: 1,
    });
  };

  const editarMetodo = (metodo: MetodoPago) => {
    setMetodoEditando(metodo);
    setNuevoMetodo({
      tipo: metodo.tipo || "cuenta_bancaria",
      nombre: metodo.nombre || "",
      numeroCuenta: metodo.numeroCuenta || metodo.numero || "",
      cci: metodo.cci || "",
      telefono: metodo.telefono || "",
      email: metodo.email || "",
      titular: metodo.titular || "",
      moneda: metodo.moneda || "PEN",
      esPlataforma: metodo.esPlataforma ?? true,
      activo: metodo.activo ?? true,
      orden: metodo.orden || 1,
    });
    setShowMetodoModal(true);
  };

  const resetMonedaForm = () => {
    setNuevaMoneda({
      codigo: "",
      nombre: "",
      simbolo: "",
      tasaCambio: "1.00",
      activo: true,
      orden: 1,
    });
  };

  const editarMoneda = (moneda: Moneda) => {
    setMonedaEditando(moneda);
    setNuevaMoneda({
      codigo: moneda.codigo || "",
      nombre: moneda.nombre || "",
      simbolo: moneda.simbolo || "",
      tasaCambio: moneda.tasaCambio || "1.00",
      activo: moneda.activo ?? true,
      orden: moneda.orden || 1,
    });
    setShowMonedaModal(true);
  };

  const getUserName = (userId: string) => {
    const user = usuarios.find((u: any) => u.id === userId);
    return user?.nombre || user?.primerNombre || user?.email || "Usuario desconocido";
  };

  const getUser = (userId: string) => {
    return usuarios.find((u: any) => u.id === userId);
  };

  const getUserSaldo = (userId: string) => {
    const saldo = saldos.find((s: SaldoUsuario) => s.usuarioId === userId);
    return parseFloat(saldo?.saldo || "0");
  };

  const calcularSaldoFinal = (solicitud: SolicitudSaldo) => {
    const saldoActual = getUserSaldo(solicitud.usuarioId);
    const monto = parseFloat(solicitud.monto);
    if (solicitud.tipo === 'recarga') {
      // Para recargas: saldo actual + monto de recarga
      return (saldoActual + monto).toFixed(2);
    } else {
      // Para retiros: saldo actual - monto de retiro (sin permitir negativo)
      const resultado = saldoActual - monto;
      return Math.max(0, resultado).toFixed(2);
    }
  };

  const abrirContacto = (userId: string) => {
    const user = getUser(userId);
    setUsuarioContacto(user);
    setShowContactoModal(true);
  };

  const formatearTelefono = (telefono: string) => {
    // Limpiar el número de cualquier carácter que no sea dígito
    return telefono?.replace(/\D/g, '') || '';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "aprobado":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><Check className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case "rechazado":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><X className="h-3 w-3 mr-1" />Rechazado</Badge>;
      case "observado":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300"><Eye className="h-3 w-3 mr-1" />Observado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "cuenta_bancaria":
        return <Building className="h-4 w-4" />;
      case "interbancaria":
        return <Globe className="h-4 w-4" />;
      case "yape":
      case "plin":
        return <Smartphone className="h-4 w-4" />;
      case "paypal":
        return <Globe className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const totalSaldos = saldos.reduce((sum, s) => sum + parseFloat(s.saldo || "0"), 0);
  const totalIngresos = saldos.reduce((sum, s) => sum + parseFloat(s.totalIngresos || "0"), 0);
  const totalEgresos = saldos.reduce((sum, s) => sum + parseFloat(s.totalEgresos || "0"), 0);
  const solicitudesPendientes = solicitudes.filter(s => s.estado === "pendiente").length;

  const filteredSolicitudes = solicitudes.filter(s =>
    getUserName(s.usuarioId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransacciones = transacciones.filter(t =>
    getUserName(t.usuarioId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.concepto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="screen-gestion-cartera">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestion de Cartera y Saldos</h2>
          <p className="text-muted-foreground">Administra saldos, recargas, retiros y metodos de pago</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total en Carteras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold" data-testid="text-total-saldos">S/ {totalSaldos.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold" data-testid="text-total-ingresos">S/ {totalIngresos.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold" data-testid="text-total-egresos">S/ {totalEgresos.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold" data-testid="text-solicitudes-pendientes">{solicitudesPendientes}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="solicitudes" data-testid="tab-solicitudes">
              <Clock className="h-4 w-4 mr-2" />
              Solicitudes
            </TabsTrigger>
            <TabsTrigger value="saldos" data-testid="tab-saldos">
              <Wallet className="h-4 w-4 mr-2" />
              Saldos
            </TabsTrigger>
            <TabsTrigger value="transacciones" data-testid="tab-transacciones">
              <CreditCard className="h-4 w-4 mr-2" />
              Transacciones
            </TabsTrigger>
            <TabsTrigger value="metodos" data-testid="tab-metodos">
              <Banknote className="h-4 w-4 mr-2" />
              Metodos de Pago
            </TabsTrigger>
            <TabsTrigger value="monedas" data-testid="tab-monedas">
              <DollarSign className="h-4 w-4 mr-2" />
              Monedas
            </TabsTrigger>
            <TabsTrigger value="planes" data-testid="tab-planes">
              <CreditCard className="h-4 w-4 mr-2" />
              Planes
            </TabsTrigger>
            <TabsTrigger value="membresias" data-testid="tab-membresias">
              <Check className="h-4 w-4 mr-2" />
              Membresias
            </TabsTrigger>
            <TabsTrigger value="costos" data-testid="tab-costos">
              <Percent className="h-4 w-4 mr-2" />
              Costos
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-cartera"
              />
            </div>
          </div>
        </div>

        <TabsContent value="solicitudes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Recarga y Retiro</CardTitle>
              <CardDescription>Gestiona las solicitudes pendientes de los usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSolicitudes ? (
                <div className="text-center py-8 text-muted-foreground">Cargando solicitudes...</div>
              ) : filteredSolicitudes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay solicitudes registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSolicitudes.map((solicitud) => {
                    const usuario = getUser(solicitud.usuarioId);
                    const saldoActual = getUserSaldo(solicitud.usuarioId);
                    const saldoFinal = calcularSaldoFinal(solicitud);
                    
                    return (
                    <div key={solicitud.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4" data-testid={`card-solicitud-${solicitud.id}`}>
                      <div className="flex items-center gap-3">
                        {/* Foto de perfil */}
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={usuario?.imagenPerfil} alt={getUserName(solicitud.usuarioId)} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getUserName(solicitud.usuarioId).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`p-2 rounded-full flex-shrink-0 ${solicitud.tipo === 'recarga' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {solicitud.tipo === 'recarga' ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <p className="font-medium truncate">{getUserName(solicitud.usuarioId)}</p>
                          
                          {/* Botón de celular clickeable */}
                          {usuario?.celular && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-sm text-blue-600 hover:text-blue-800 font-normal"
                              onClick={() => abrirContacto(solicitud.usuarioId)}
                              data-testid={`button-telefono-${solicitud.id}`}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              {usuario.celular}
                            </Button>
                          )}
                          
                          <p className="text-sm text-muted-foreground capitalize">{solicitud.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(solicitud.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        {/* Información de montos */}
                        <div className="text-left md:text-right space-y-0.5">
                          {/* Saldo Final (si es pendiente) */}
                          {solicitud.estado === "pendiente" && (
                            <div className="text-xs text-muted-foreground">
                              Saldo actual: S/ {saldoActual.toFixed(2)}
                            </div>
                          )}
                          
                          {/* Saldo Final calculado */}
                          {solicitud.estado === "pendiente" && (
                            <p className="text-sm font-semibold text-primary">
                              Saldo Final: S/ {saldoFinal}
                            </p>
                          )}
                          
                          <p className={`text-lg font-bold ${solicitud.tipo === 'recarga' ? 'text-green-600' : 'text-red-600'}`}>
                            {solicitud.tipo === 'recarga' ? '+' : '-'} S/ {solicitud.monto}
                          </p>
                          {solicitud.numeroOperacion && (
                            <p className="text-xs text-muted-foreground">Op: {solicitud.numeroOperacion}</p>
                          )}
                        </div>
                        
                        {/* Botón ver comprobante (solo icono) */}
                        {solicitud.comprobante && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setComprobanteUrl(solicitud.comprobante!);
                              setSelectedSolicitud(solicitud);
                              setShowComprobanteModal(true);
                            }}
                            data-testid={`button-ver-comprobante-${solicitud.id}`}
                            title="Ver comprobante"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {getEstadoBadge(solicitud.estado)}
                        
                        {(solicitud.estado === "pendiente" || solicitud.estado === "observado") && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => aprobarMutation.mutate(solicitud.id)}
                              disabled={aprobarMutation.isPending}
                              data-testid={`button-aprobar-${solicitud.id}`}
                              title="Aprobar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            {solicitud.estado === "pendiente" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                onClick={() => observarMutation.mutate({ id: solicitud.id })}
                                disabled={observarMutation.isPending}
                                data-testid={`button-observar-${solicitud.id}`}
                                title="Marcar como observado"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedSolicitud(solicitud);
                                setShowRechazoModal(true);
                              }}
                              data-testid={`button-rechazar-${solicitud.id}`}
                              title="Rechazar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saldos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saldos de Usuarios</CardTitle>
              <CardDescription>Balance actual de cada usuario en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSaldos ? (
                <div className="text-center py-8 text-muted-foreground">Cargando saldos...</div>
              ) : saldos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay saldos registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {saldos.map((saldo) => (
                    <div key={saldo.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-saldo-${saldo.usuarioId}`}>
                      <div>
                        <p className="font-medium">{getUserName(saldo.usuarioId)}</p>
                        <p className="text-sm text-muted-foreground">Moneda: {saldo.monedaPreferida}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Ingresos</p>
                          <p className="text-green-600 font-medium">S/ {saldo.totalIngresos}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Egresos</p>
                          <p className="text-red-600 font-medium">S/ {saldo.totalEgresos}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Saldo</p>
                          <p className="text-2xl font-bold text-primary">S/ {saldo.saldo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacciones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
              <CardDescription>Movimientos de dinero en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransacciones ? (
                <div className="text-center py-8 text-muted-foreground">Cargando transacciones...</div>
              ) : filteredTransacciones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay transacciones registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransacciones.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-transaccion-${tx.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${tx.tipo === 'recarga' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.tipo === 'recarga' ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{getUserName(tx.usuarioId)}</p>
                          <p className="text-sm text-muted-foreground">{tx.concepto}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${tx.tipo === 'recarga' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.tipo === 'recarga' ? '+' : '-'} S/ {tx.monto}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: S/ {tx.saldoAnterior} → S/ {tx.saldoNuevo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metodos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Metodos de Pago de la Plataforma</CardTitle>
                <CardDescription>Cuentas donde los usuarios pueden depositar para recargar saldo</CardDescription>
              </div>
              <Button onClick={() => setShowMetodoModal(true)} data-testid="button-nuevo-metodo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Metodo
              </Button>
            </CardHeader>
            <CardContent>
              {loadingMetodos ? (
                <div className="text-center py-8 text-muted-foreground">Cargando metodos...</div>
              ) : metodosPago.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay metodos de pago configurados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(metodosPago) && metodosPago.map((metodo) => (
                    <div key={metodo.id} className={`p-4 border rounded-lg transition-all ${metodo.activo ? 'bg-background' : 'bg-muted/30 opacity-75'}`} data-testid={`card-metodo-${metodo.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(metodo.tipo)}
                          <span className="font-medium">{metodo.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant={metodo.activo ? "default" : "secondary"}
                            className={`text-xs px-2 ${metodo.activo ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                            onClick={() => toggleMetodoActivoMutation.mutate({ id: metodo.id, activo: !metodo.activo })}
                            disabled={toggleMetodoActivoMutation.isPending}
                            data-testid={`button-toggle-metodo-${metodo.id}`}
                          >
                            {metodo.activo ? "Activo" : "Suspendido"}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => editarMetodo(metodo)}
                            data-testid={`button-editar-metodo-${metodo.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => eliminarMetodoMutation.mutate(metodo.id)}
                            data-testid={`button-eliminar-metodo-${metodo.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Tipo:</span> {metodo.tipo?.replace('_', ' ')}
                        </p>
                        {metodo.titular && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Titular:</span> {metodo.titular}
                          </p>
                        )}
                        {(metodo.numeroCuenta || metodo.numero) && (
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">Cuenta Bancaria</p>
                            <p className="font-mono font-medium">{metodo.numeroCuenta || metodo.numero}</p>
                          </div>
                        )}
                        {metodo.cci && (
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground mb-1">Cuenta Interbancaria (CCI)</p>
                            <p className="font-mono font-medium">{metodo.cci}</p>
                          </div>
                        )}
                        <p className="text-muted-foreground">
                          <span className="font-medium">Moneda:</span> {metodo.moneda}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monedas" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monedas Soportadas</CardTitle>
                <CardDescription>Configuracion de monedas y tipos de cambio</CardDescription>
              </div>
              <Button onClick={() => setShowMonedaModal(true)} data-testid="button-nueva-moneda">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Moneda
              </Button>
            </CardHeader>
            <CardContent>
              {loadingMonedas ? (
                <div className="text-center py-8 text-muted-foreground">Cargando monedas...</div>
              ) : monedas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay monedas configuradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {monedas.map((moneda) => (
                    <div key={moneda.id} className={`p-4 border rounded-lg transition-all ${moneda.activo ? 'bg-background' : 'bg-muted/30 opacity-75'}`} data-testid={`card-moneda-${moneda.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{moneda.simbolo}</span>
                          <span className="font-medium">{moneda.codigo}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant={moneda.activo ? "default" : "secondary"}
                            className={`text-xs px-2 ${moneda.activo ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                            onClick={() => toggleMonedaActivaMutation.mutate({ id: moneda.id, activo: !moneda.activo })}
                            disabled={toggleMonedaActivaMutation.isPending}
                            data-testid={`button-toggle-moneda-${moneda.id}`}
                          >
                            {moneda.activo ? "Activa" : "Suspendida"}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => editarMoneda(moneda)}
                            data-testid={`button-editar-moneda-${moneda.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => eliminarMonedaMutation.mutate(moneda.id)}
                            data-testid={`button-eliminar-moneda-${moneda.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{moneda.nombre}</p>
                      {moneda.tasaCambio && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Tasa:</span> {moneda.tasaCambio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Planes de Membresia</CardTitle>
                <CardDescription>Gestiona los planes disponibles para usuarios premium</CardDescription>
              </div>
              <Button onClick={() => { resetPlanForm(); setPlanEditando(null); setShowPlanModal(true); }} data-testid="button-nuevo-plan">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPlanes ? (
                <div className="text-center py-8 text-muted-foreground">Cargando planes...</div>
              ) : planes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay planes configurados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {planes.map((plan) => (
                    <div 
                      key={plan.id} 
                      className={`p-4 border rounded-lg ${plan.destacado ? 'ring-2 ring-primary' : ''} ${!plan.activo ? 'opacity-50' : ''}`}
                      data-testid={`card-plan-${plan.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold">{plan.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{plan.duracionMeses} mes{plan.duracionMeses > 1 ? 'es' : ''}</p>
                        </div>
                        <div className="flex gap-1">
                          {plan.destacado && <Badge className="bg-primary">Destacado</Badge>}
                          <Badge variant={plan.activo ? "default" : "secondary"}>
                            {plan.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        {plan.precioDescuento ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">S/ {plan.precioDescuento}</span>
                            <span className="text-sm line-through text-muted-foreground">S/ {plan.precioNormal}</span>
                            {plan.porcentajeDescuento && (
                              <Badge variant="outline" className="text-green-600">-{plan.porcentajeDescuento}%</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-2xl font-bold">S/ {plan.precioNormal}</span>
                        )}
                      </div>

                      <div className="mb-3 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Productos:</span> {plan.productosIncluidos === 9999 ? 'Ilimitados' : plan.productosIncluidos}
                        </p>
                      </div>

                      {plan.beneficios && plan.beneficios.length > 0 && (
                        <ul className="text-sm space-y-1 mb-3">
                          {plan.beneficios.slice(0, 3).map((beneficio, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              <span className="text-muted-foreground text-xs">{beneficio}</span>
                            </li>
                          ))}
                          {plan.beneficios.length > 3 && (
                            <li className="text-xs text-muted-foreground">+{plan.beneficios.length - 3} mas...</li>
                          )}
                        </ul>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => abrirEditarPlan(plan)}
                          data-testid={`button-editar-plan-${plan.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => eliminarPlanMutation.mutate(plan.id)}
                          data-testid={`button-eliminar-plan-${plan.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membresias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Membresias de Usuarios</CardTitle>
              <CardDescription>Usuarios con membresias activas y pendientes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMembresias ? (
                <div className="text-center py-8 text-muted-foreground">Cargando membresias...</div>
              ) : membresias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay membresias registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {membresias.map((membresia) => (
                    <div 
                      key={membresia.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`card-membresia-${membresia.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{getUserName(membresia.usuarioId)}</p>
                          <p className="text-sm text-muted-foreground">{getPlanNombre(membresia.planId)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(membresia.fechaInicio), "dd/MM/yyyy")} - {format(new Date(membresia.fechaFin), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">S/ {membresia.montoTotal}</p>
                          <p className="text-xs text-muted-foreground">Productos: {membresia.productosCreados}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getEstadoMembresia(membresia.estado)}
                          {membresia.estado === 'pendiente' && (
                            <Button 
                              size="sm"
                              onClick={() => aprobarMembresiaMutation.mutate(membresia.id)}
                              data-testid={`button-aprobar-membresia-${membresia.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de Costos</CardTitle>
              <CardDescription>Define los montos o porcentajes que se cobran por cada servicio</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCostos ? (
                <div className="text-center py-8 text-muted-foreground">Cargando configuracion...</div>
              ) : configuracionCostos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay configuraciones de costos.
                </div>
              ) : (
                <div className="space-y-4">
                  {configuracionCostos.map((costo) => (
                    <div 
                      key={costo.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`card-costo-${costo.tipoServicio}`}
                    >
                      <div>
                        <p className="font-medium">{costo.nombre}</p>
                        <p className="text-sm text-muted-foreground">{costo.descripcion}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Monto fijo: S/ {costo.montoFijo || '0.00'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Porcentaje: {costo.porcentaje || '0'}%
                          </span>
                          <span className="text-muted-foreground">
                            Usa: {costo.usarMontoFijo ? 'Monto fijo' : 'Porcentaje'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={costo.activo ? "default" : "secondary"}>
                          {costo.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => { setCostoEditando(costo); setShowCostoModal(true); }}
                          data-testid={`button-editar-costo-${costo.tipoServicio}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showRechazoModal} onOpenChange={setShowRechazoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo de esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="motivoRechazo">Motivo del Rechazo</Label>
              <Textarea
                id="motivoRechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Escribe el motivo del rechazo..."
                className="mt-2"
                data-testid="input-motivo-rechazo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRechazoModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedSolicitud && motivoRechazo) {
                  rechazarMutation.mutate({ id: selectedSolicitud.id, motivoRechazo });
                }
              }}
              disabled={!motivoRechazo || rechazarMutation.isPending}
              data-testid="button-confirmar-rechazo"
            >
              Rechazar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showComprobanteModal} onOpenChange={setShowComprobanteModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Comprobante de Pago
            </DialogTitle>
            <DialogDescription>
              {selectedSolicitud && (
                <span className="flex items-center gap-2 flex-wrap">
                  Usuario: <strong>{getUserName(selectedSolicitud.usuarioId)}</strong>
                  {" - "}
                  Monto: <strong className={selectedSolicitud.tipo === 'recarga' ? 'text-green-600' : 'text-red-600'}>
                    S/ {selectedSolicitud.monto}
                  </strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center p-2 md:p-4 bg-muted/30 rounded-lg min-h-[200px] md:min-h-[400px]">
              {comprobanteUrl ? (
                <img 
                  src={comprobanteUrl} 
                  alt="Comprobante de pago" 
                  className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded-lg shadow-lg"
                  data-testid="img-comprobante-fullscreen"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No hay imagen disponible</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0 pt-4 space-y-3">
            {/* Botones de contacto */}
            {selectedSolicitud && (() => {
              const usuario = getUser(selectedSolicitud.usuarioId);
              if (!usuario) return null;
              const telefono = formatearTelefono(usuario.celular || '');
              
              return (
                <div className="flex flex-wrap gap-2 justify-center border-t pt-3">
                  <span className="text-sm text-muted-foreground w-full text-center mb-1">Contactar al usuario:</span>
                  
                  {telefono && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${telefono}`, '_self')}
                        data-testid="button-llamar-comprobante"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Llamar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        onClick={() => window.open(`https://wa.me/51${telefono}`, '_blank')}
                        data-testid="button-whatsapp-comprobante"
                      >
                        <SiWhatsapp className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    onClick={() => {
                      setShowComprobanteModal(false);
                      setLocation(`/chat?userId=${selectedSolicitud.usuarioId}`);
                    }}
                    data-testid="button-chat-comprobante"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat Interno
                  </Button>
                </div>
              );
            })()}
            
            <DialogFooter className="flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowComprobanteModal(false)}
                data-testid="button-cerrar-comprobante"
              >
                Cerrar
              </Button>
              {comprobanteUrl && (
                <Button 
                  onClick={() => window.open(comprobanteUrl, '_blank')}
                  data-testid="button-abrir-nueva-pestaña"
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Ver Ampliado
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de contacto rápido */}
      <Dialog open={showContactoModal} onOpenChange={setShowContactoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contactar Usuario
            </DialogTitle>
            <DialogDescription>
              Selecciona cómo deseas comunicarte con el usuario
            </DialogDescription>
          </DialogHeader>
          
          {usuarioContacto && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={usuarioContacto.imagenPerfil} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(usuarioContacto.nombre || usuarioContacto.primerNombre || usuarioContacto.email || '??').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{usuarioContacto.nombre || usuarioContacto.primerNombre || usuarioContacto.email}</p>
                  {usuarioContacto.celular && (
                    <p className="text-sm text-muted-foreground">{usuarioContacto.celular}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {usuarioContacto.celular && (
                  <>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => {
                        const tel = formatearTelefono(usuarioContacto.celular);
                        window.open(`tel:${tel}`, '_self');
                        setShowContactoModal(false);
                      }}
                      data-testid="button-llamar-modal"
                    >
                      <Phone className="h-5 w-5 mr-3 text-blue-600" />
                      Llamar al {usuarioContacto.celular}
                    </Button>
                    
                    <Button
                      className="w-full justify-start text-green-600 border-green-300 hover:bg-green-50"
                      variant="outline"
                      onClick={() => {
                        const tel = formatearTelefono(usuarioContacto.celular);
                        window.open(`https://wa.me/51${tel}`, '_blank');
                        setShowContactoModal(false);
                      }}
                      data-testid="button-whatsapp-modal"
                    >
                      <SiWhatsapp className="h-5 w-5 mr-3" />
                      Enviar WhatsApp
                    </Button>
                  </>
                )}
                
                <Button
                  className="w-full justify-start text-purple-600 border-purple-300 hover:bg-purple-50"
                  variant="outline"
                  onClick={() => {
                    setShowContactoModal(false);
                    setLocation(`/chat?userId=${usuarioContacto.id}`);
                  }}
                  data-testid="button-chat-modal"
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Abrir Chat Interno
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactoModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMetodoModal} onOpenChange={(open) => { 
        setShowMetodoModal(open); 
        if (!open) { 
          setMetodoEditando(null); 
          resetMetodoForm();
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{metodoEditando ? 'Editar Metodo de Pago' : 'Nuevo Metodo de Pago'}</DialogTitle>
            <DialogDescription>
              {metodoEditando ? 'Modifica los datos del metodo de pago.' : 'Agrega una cuenta donde los usuarios puedan depositar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div>
              <Label htmlFor="tipo">Tipo de Metodo</Label>
              <Select
                value={nuevoMetodo.tipo}
                onValueChange={(value) => setNuevoMetodo(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger data-testid="select-tipo-metodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cuenta_bancaria">Cuenta Bancaria</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="plin">Plin</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nombre">Nombre del Banco / Metodo</Label>
              <Input
                id="nombre"
                value={nuevoMetodo.nombre}
                onChange={(e) => setNuevoMetodo(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: BCP, BBVA, Interbank, Yape"
                data-testid="input-nombre-metodo"
              />
            </div>
            {nuevoMetodo.tipo === "cuenta_bancaria" && (
              <>
                <div>
                  <Label htmlFor="numeroCuenta">Numero de Cuenta Bancaria</Label>
                  <Input
                    id="numeroCuenta"
                    value={nuevoMetodo.numeroCuenta}
                    onChange={(e) => setNuevoMetodo(prev => ({ ...prev, numeroCuenta: e.target.value }))}
                    placeholder="Ej: 191-123456789-0-01"
                    data-testid="input-numero-cuenta"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Este numero se mostrara para que el usuario lo copie</p>
                </div>
                <div>
                  <Label htmlFor="cci">Numero de Cuenta Interbancaria (CCI)</Label>
                  <Input
                    id="cci"
                    value={nuevoMetodo.cci}
                    onChange={(e) => setNuevoMetodo(prev => ({ ...prev, cci: e.target.value }))}
                    placeholder="Ej: 00219100123456789001"
                    data-testid="input-cci"
                  />
                  <p className="text-xs text-muted-foreground mt-1">20 digitos para transferencias desde otros bancos</p>
                </div>
              </>
            )}
            {(nuevoMetodo.tipo === "yape" || nuevoMetodo.tipo === "plin") && (
              <div>
                <Label htmlFor="telefono">Numero de Celular</Label>
                <Input
                  id="telefono"
                  value={nuevoMetodo.telefono}
                  onChange={(e) => setNuevoMetodo(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej: 999888777"
                  data-testid="input-numero-celular"
                />
                <p className="text-xs text-muted-foreground mt-1">Este numero se mostrara para que el usuario lo copie y pague por {nuevoMetodo.tipo?.toUpperCase()}</p>
              </div>
            )}
            {nuevoMetodo.tipo === "paypal" && (
              <div>
                <Label htmlFor="email">Email o Usuario de PayPal</Label>
                <Input
                  id="email"
                  type="email"
                  value={nuevoMetodo.email}
                  onChange={(e) => setNuevoMetodo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej: cuenta@email.com"
                  data-testid="input-email-paypal"
                />
                <p className="text-xs text-muted-foreground mt-1">Este email se mostrara para que el usuario lo copie y envie pago por PayPal</p>
              </div>
            )}
            <div>
              <Label htmlFor="titular">Nombre del Titular</Label>
              <Input
                id="titular"
                value={nuevoMetodo.titular}
                onChange={(e) => setNuevoMetodo(prev => ({ ...prev, titular: e.target.value }))}
                placeholder="Nombre completo del titular"
                data-testid="input-titular"
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={nuevoMetodo.moneda}
                onValueChange={(value) => setNuevoMetodo(prev => ({ ...prev, moneda: value }))}
              >
                <SelectTrigger data-testid="select-moneda-metodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">Soles (PEN)</SelectItem>
                  <SelectItem value="USD">Dolares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4">
            <Button variant="outline" onClick={() => setShowMetodoModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (metodoEditando) {
                  actualizarMetodoMutation.mutate({ id: metodoEditando.id, ...nuevoMetodo });
                } else {
                  crearMetodoMutation.mutate(nuevoMetodo);
                }
              }}
              disabled={
                !nuevoMetodo.nombre || 
                crearMetodoMutation.isPending || 
                actualizarMetodoMutation?.isPending ||
                (nuevoMetodo.tipo === "cuenta_bancaria" && !nuevoMetodo.numeroCuenta) ||
                ((nuevoMetodo.tipo === "yape" || nuevoMetodo.tipo === "plin") && !nuevoMetodo.telefono) ||
                (nuevoMetodo.tipo === "paypal" && !nuevoMetodo.email)
              }
              data-testid="button-guardar-metodo"
            >
              {metodoEditando ? 'Actualizar' : 'Guardar'} Metodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMonedaModal} onOpenChange={(open) => { 
        setShowMonedaModal(open); 
        if (!open) { 
          setMonedaEditando(null); 
          resetMonedaForm();
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{monedaEditando ? 'Editar Moneda' : 'Nueva Moneda'}</DialogTitle>
            <DialogDescription>
              {monedaEditando ? 'Modifica los datos de la moneda.' : 'Configura una nueva moneda para el sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div>
              <Label htmlFor="codigo">Codigo (ISO)</Label>
              <Input
                id="codigo"
                value={nuevaMoneda.codigo}
                onChange={(e) => setNuevaMoneda(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ej: PEN, USD, EUR"
                maxLength={3}
                data-testid="input-codigo-moneda"
              />
            </div>
            <div>
              <Label htmlFor="nombreMoneda">Nombre</Label>
              <Input
                id="nombreMoneda"
                value={nuevaMoneda.nombre}
                onChange={(e) => setNuevaMoneda(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Sol Peruano"
                data-testid="input-nombre-moneda"
              />
            </div>
            <div>
              <Label htmlFor="simbolo">Simbolo</Label>
              <Input
                id="simbolo"
                value={nuevaMoneda.simbolo}
                onChange={(e) => setNuevaMoneda(prev => ({ ...prev, simbolo: e.target.value }))}
                placeholder="Ej: S/, $, €"
                maxLength={3}
                data-testid="input-simbolo-moneda"
              />
            </div>
            <div>
              <Label htmlFor="tasaCambio">Tasa de Cambio (vs PEN)</Label>
              <Input
                id="tasaCambio"
                type="number"
                step="0.01"
                value={nuevaMoneda.tasaCambio}
                onChange={(e) => setNuevaMoneda(prev => ({ ...prev, tasaCambio: e.target.value }))}
                placeholder="1.00"
                data-testid="input-tasa-cambio"
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4">
            <Button variant="outline" onClick={() => setShowMonedaModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (monedaEditando) {
                  actualizarMonedaMutation.mutate({ id: monedaEditando.id, ...nuevaMoneda });
                } else {
                  crearMonedaMutation.mutate(nuevaMoneda);
                }
              }}
              disabled={!nuevaMoneda.codigo || !nuevaMoneda.nombre || !nuevaMoneda.simbolo || crearMonedaMutation.isPending || actualizarMonedaMutation?.isPending}
              data-testid="button-guardar-moneda"
            >
              {monedaEditando ? 'Actualizar' : 'Guardar'} Moneda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanModal} onOpenChange={(open) => { setShowPlanModal(open); if (!open) { setPlanEditando(null); resetPlanForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{planEditando ? 'Editar Plan' : 'Nuevo Plan de Membresia'}</DialogTitle>
            <DialogDescription>
              Configura los detalles del plan de membresia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombrePlan">Nombre del Plan</Label>
                <Input
                  id="nombrePlan"
                  value={nuevoPlan.nombre}
                  onChange={(e) => setNuevoPlan(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Plan Premium"
                  data-testid="input-nombre-plan"
                />
              </div>
              <div>
                <Label htmlFor="duracion">Duracion (meses)</Label>
                <Select
                  value={nuevoPlan.duracionMeses.toString()}
                  onValueChange={(value) => setNuevoPlan(prev => ({ ...prev, duracionMeses: parseInt(value) }))}
                >
                  <SelectTrigger data-testid="select-duracion-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mes</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="descripcionPlan">Descripcion</Label>
              <Textarea
                id="descripcionPlan"
                value={nuevoPlan.descripcion}
                onChange={(e) => setNuevoPlan(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe los beneficios del plan..."
                data-testid="input-descripcion-plan"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="precioNormal">Precio Normal (S/)</Label>
                <Input
                  id="precioNormal"
                  type="number"
                  step="0.01"
                  value={nuevoPlan.precioNormal}
                  onChange={(e) => setNuevoPlan(prev => ({ ...prev, precioNormal: e.target.value }))}
                  placeholder="29.90"
                  data-testid="input-precio-normal"
                />
              </div>
              <div>
                <Label htmlFor="precioDescuento">Precio con Descuento</Label>
                <Input
                  id="precioDescuento"
                  type="number"
                  step="0.01"
                  value={nuevoPlan.precioDescuento}
                  onChange={(e) => setNuevoPlan(prev => ({ ...prev, precioDescuento: e.target.value }))}
                  placeholder="24.90"
                  data-testid="input-precio-descuento"
                />
              </div>
              <div>
                <Label htmlFor="porcentajeDescuento">% Descuento</Label>
                <Input
                  id="porcentajeDescuento"
                  type="number"
                  value={nuevoPlan.porcentajeDescuento}
                  onChange={(e) => setNuevoPlan(prev => ({ ...prev, porcentajeDescuento: parseInt(e.target.value) || 0 }))}
                  placeholder="10"
                  data-testid="input-porcentaje-descuento"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="productosIncluidos">Productos Incluidos</Label>
              <Input
                id="productosIncluidos"
                type="number"
                value={nuevoPlan.productosIncluidos}
                onChange={(e) => setNuevoPlan(prev => ({ ...prev, productosIncluidos: parseInt(e.target.value) || 0 }))}
                placeholder="10"
                data-testid="input-productos-incluidos"
              />
              <p className="text-xs text-muted-foreground mt-1">Usa 9999 para productos ilimitados</p>
            </div>
            <div>
              <Label>Beneficios</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={nuevoBeneficio}
                  onChange={(e) => setNuevoBeneficio(e.target.value)}
                  placeholder="Agregar beneficio..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarBeneficio())}
                  data-testid="input-nuevo-beneficio"
                />
                <Button type="button" variant="outline" onClick={agregarBeneficio} data-testid="button-agregar-beneficio">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {nuevoPlan.beneficios.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {nuevoPlan.beneficios.map((beneficio, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {beneficio}
                      <button 
                        type="button" 
                        onClick={() => eliminarBeneficio(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nuevoPlan.destacado}
                  onChange={(e) => setNuevoPlan(prev => ({ ...prev, destacado: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Plan Destacado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nuevoPlan.activo}
                  onChange={(e) => setNuevoPlan(prev => ({ ...prev, activo: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Activo</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPlanModal(false); setPlanEditando(null); resetPlanForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={guardarPlan}
              disabled={!nuevoPlan.nombre || !nuevoPlan.precioNormal || crearPlanMutation.isPending || actualizarPlanMutation.isPending}
              data-testid="button-guardar-plan"
            >
              {planEditando ? 'Actualizar Plan' : 'Crear Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCostoModal} onOpenChange={(open) => { setShowCostoModal(open); if (!open) setCostoEditando(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Configuracion de Costo</DialogTitle>
            <DialogDescription>
              Modifica los valores de cobro para este servicio.
            </DialogDescription>
          </DialogHeader>
          {costoEditando && (
            <div className="space-y-4">
              <div>
                <Label>Servicio</Label>
                <p className="font-medium">{costoEditando.nombre}</p>
                <p className="text-sm text-muted-foreground">{costoEditando.descripcion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="montoFijoCosto">Monto Fijo (S/)</Label>
                  <Input
                    id="montoFijoCosto"
                    type="number"
                    step="0.01"
                    defaultValue={costoEditando.montoFijo || '0'}
                    onChange={(e) => setCostoEditando(prev => prev ? { ...prev, montoFijo: e.target.value } : null)}
                    data-testid="input-monto-fijo-costo"
                  />
                </div>
                <div>
                  <Label htmlFor="porcentajeCosto">Porcentaje (%)</Label>
                  <Input
                    id="porcentajeCosto"
                    type="number"
                    step="0.1"
                    defaultValue={costoEditando.porcentaje || '0'}
                    onChange={(e) => setCostoEditando(prev => prev ? { ...prev, porcentaje: e.target.value } : null)}
                    data-testid="input-porcentaje-costo"
                  />
                </div>
              </div>
              <div>
                <Label>Tipo de Cobro</Label>
                <Select
                  value={costoEditando.usarMontoFijo ? 'fijo' : 'porcentaje'}
                  onValueChange={(value) => setCostoEditando(prev => prev ? { ...prev, usarMontoFijo: value === 'fijo' } : null)}
                >
                  <SelectTrigger data-testid="select-tipo-cobro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fijo">Usar Monto Fijo</SelectItem>
                    <SelectItem value="porcentaje">Usar Porcentaje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="saldoMinimoCosto">Saldo Minimo Requerido (S/)</Label>
                <Input
                  id="saldoMinimoCosto"
                  type="number"
                  step="0.01"
                  defaultValue={costoEditando.saldoMinimo || '0.50'}
                  onChange={(e) => setCostoEditando(prev => prev ? { ...prev, saldoMinimo: e.target.value } : null)}
                  data-testid="input-saldo-minimo"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={costoEditando.activo}
                  onChange={(e) => setCostoEditando(prev => prev ? { ...prev, activo: e.target.checked } : null)}
                  className="rounded"
                />
                <span className="text-sm">Cobro Activo</span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCostoModal(false); setCostoEditando(null); }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => costoEditando && actualizarCostoMutation.mutate(costoEditando)}
              disabled={actualizarCostoMutation.isPending}
              data-testid="button-guardar-costo"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
