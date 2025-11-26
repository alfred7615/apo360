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
  Globe, ArrowUpRight, ArrowDownRight, RefreshCw, Eye, Trash2, Edit
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type MetodoPago = {
  id: string;
  tipo: string;
  nombre: string;
  numero?: string;
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

export default function GestionCarteraScreen() {
  const [activeTab, setActiveTab] = useState("solicitudes");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMetodoModal, setShowMetodoModal] = useState(false);
  const [showMonedaModal, setShowMonedaModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudSaldo | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [nuevoMetodo, setNuevoMetodo] = useState({
    tipo: "cuenta_bancaria",
    nombre: "",
    numero: "",
    titular: "",
    banco: "",
    moneda: "PEN",
    esPlataforma: true,
    activo: true,
    orden: 1,
  });
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

  const crearMetodoMutation = useMutation({
    mutationFn: (data: typeof nuevoMetodo) => apiRequest("POST", "/api/metodos-pago", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metodos-pago"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/metodos-pago"] });
      toast({ title: "Metodo de pago eliminado" });
    },
    onError: () => {
      toast({ title: "Error al eliminar metodo de pago", variant: "destructive" });
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

  const resetMetodoForm = () => {
    setNuevoMetodo({
      tipo: "cuenta_bancaria",
      nombre: "",
      numero: "",
      titular: "",
      banco: "",
      moneda: "PEN",
      esPlataforma: true,
      activo: true,
      orden: 1,
    });
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

  const getUserName = (userId: string) => {
    const user = usuarios.find((u: any) => u.id === userId);
    return user?.nombre || user?.email || "Usuario desconocido";
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "aprobado":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><Check className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case "rechazado":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><X className="h-3 w-3 mr-1" />Rechazado</Badge>;
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
                  {filteredSolicitudes.map((solicitud) => (
                    <div key={solicitud.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-solicitud-${solicitud.id}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${solicitud.tipo === 'recarga' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {solicitud.tipo === 'recarga' ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{getUserName(solicitud.usuarioId)}</p>
                          <p className="text-sm text-muted-foreground capitalize">{solicitud.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(solicitud.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${solicitud.tipo === 'recarga' ? 'text-green-600' : 'text-red-600'}`}>
                            {solicitud.tipo === 'recarga' ? '+' : '-'} S/ {solicitud.monto}
                          </p>
                          {solicitud.numeroOperacion && (
                            <p className="text-xs text-muted-foreground">Op: {solicitud.numeroOperacion}</p>
                          )}
                        </div>
                        {getEstadoBadge(solicitud.estado)}
                        {solicitud.estado === "pendiente" && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => aprobarMutation.mutate(solicitud.id)}
                              disabled={aprobarMutation.isPending}
                              data-testid={`button-aprobar-${solicitud.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedSolicitud(solicitud);
                                setShowRechazoModal(true);
                              }}
                              data-testid={`button-rechazar-${solicitud.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                  {metodosPago.map((metodo) => (
                    <div key={metodo.id} className="p-4 border rounded-lg" data-testid={`card-metodo-${metodo.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(metodo.tipo)}
                          <span className="font-medium">{metodo.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={metodo.activo ? "default" : "secondary"}>
                            {metodo.activo ? "Activo" : "Inactivo"}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => eliminarMetodoMutation.mutate(metodo.id)}
                            data-testid={`button-eliminar-metodo-${metodo.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium">Tipo:</span> {metodo.tipo.replace('_', ' ')}</p>
                        {metodo.banco && <p><span className="font-medium">Banco:</span> {metodo.banco}</p>}
                        {metodo.numero && <p><span className="font-medium">Numero:</span> {metodo.numero}</p>}
                        {metodo.titular && <p><span className="font-medium">Titular:</span> {metodo.titular}</p>}
                        <p><span className="font-medium">Moneda:</span> {metodo.moneda}</p>
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
                    <div key={moneda.id} className="p-4 border rounded-lg" data-testid={`card-moneda-${moneda.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{moneda.simbolo}</span>
                          <span className="font-medium">{moneda.codigo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={moneda.activo ? "default" : "secondary"}>
                            {moneda.activo ? "Activa" : "Inactiva"}
                          </Badge>
                          <Button 
                            size="sm" 
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

      <Dialog open={showMetodoModal} onOpenChange={setShowMetodoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Metodo de Pago</DialogTitle>
            <DialogDescription>
              Agrega una cuenta donde los usuarios puedan depositar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  <SelectItem value="interbancaria">Cuenta Interbancaria</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="plin">Plin</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nombre">Nombre del Metodo</Label>
              <Input
                id="nombre"
                value={nuevoMetodo.nombre}
                onChange={(e) => setNuevoMetodo(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: BCP Soles"
                data-testid="input-nombre-metodo"
              />
            </div>
            {(nuevoMetodo.tipo === "cuenta_bancaria" || nuevoMetodo.tipo === "interbancaria") && (
              <div>
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={nuevoMetodo.banco}
                  onChange={(e) => setNuevoMetodo(prev => ({ ...prev, banco: e.target.value }))}
                  placeholder="Ej: BCP, BBVA, Interbank"
                  data-testid="input-banco"
                />
              </div>
            )}
            <div>
              <Label htmlFor="numero">Numero de Cuenta/Celular</Label>
              <Input
                id="numero"
                value={nuevoMetodo.numero}
                onChange={(e) => setNuevoMetodo(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="Ej: 191-123456789-0-01"
                data-testid="input-numero-metodo"
              />
            </div>
            <div>
              <Label htmlFor="titular">Titular</Label>
              <Input
                id="titular"
                value={nuevoMetodo.titular}
                onChange={(e) => setNuevoMetodo(prev => ({ ...prev, titular: e.target.value }))}
                placeholder="Nombre del titular de la cuenta"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetodoModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => crearMetodoMutation.mutate(nuevoMetodo)}
              disabled={!nuevoMetodo.nombre || !nuevoMetodo.numero || crearMetodoMutation.isPending}
              data-testid="button-guardar-metodo"
            >
              Guardar Metodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMonedaModal} onOpenChange={setShowMonedaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Moneda</DialogTitle>
            <DialogDescription>
              Configura una nueva moneda para el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMonedaModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => crearMonedaMutation.mutate(nuevaMoneda)}
              disabled={!nuevaMoneda.codigo || !nuevaMoneda.nombre || !nuevaMoneda.simbolo || crearMonedaMutation.isPending}
              data-testid="button-guardar-moneda"
            >
              Guardar Moneda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
