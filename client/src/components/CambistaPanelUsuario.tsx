import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Coins, Plus, TrendingUp, TrendingDown, History, 
  RefreshCw, MapPin, Clock, Phone, Loader2, Edit, Save, X
} from "lucide-react";
import type { TasaCambioLocal, ConfiguracionMoneda } from "@shared/schema";

interface HistorialTasa {
  id: string;
  cambistaId: string;
  monedaOrigenCodigo: string;
  monedaDestinoCodigo: string;
  tasaCompraAnterior: string | null;
  tasaVentaAnterior: string | null;
  tasaCompraNueva: string;
  tasaVentaNueva: string;
  tipoAccion: string;
  notas: string | null;
  createdAt: string;
}

const monedasDisponibles = [
  { codigo: "PEN", nombre: "Sol Peruano", simbolo: "S/", bandera: "🇵🇪" },
  { codigo: "USD", nombre: "Dólar", simbolo: "$", bandera: "🇺🇸" },
  { codigo: "CLP", nombre: "Peso Chileno", simbolo: "$", bandera: "🇨🇱" },
  { codigo: "ARS", nombre: "Peso Argentino", simbolo: "$", bandera: "🇦🇷" },
  { codigo: "BOB", nombre: "Boliviano", simbolo: "Bs", bandera: "🇧🇴" },
];

export default function CambistaPanelUsuario() {
  const { toast } = useToast();
  const [showNuevaTasaModal, setShowNuevaTasaModal] = useState(false);
  const [editandoTasa, setEditandoTasa] = useState<TasaCambioLocal | null>(null);
  
  const [monedaOrigen, setMonedaOrigen] = useState("USD");
  const [monedaDestino, setMonedaDestino] = useState("PEN");
  const [tasaCompra, setTasaCompra] = useState("");
  const [tasaVenta, setTasaVenta] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [telefono, setTelefono] = useState("");

  const { data: misTasas = [], isLoading: cargandoTasas, refetch: refetchTasas } = useQuery<TasaCambioLocal[]>({
    queryKey: ["/api/monedas/mis-tasas"],
  });

  const { data: historial = [], isLoading: cargandoHistorial } = useQuery<HistorialTasa[]>({
    queryKey: ["/api/monedas/historial-cambista"],
  });

  const { data: monedas = [] } = useQuery<ConfiguracionMoneda[]>({
    queryKey: ["/api/monedas/configuracion"],
  });

  const crearTasaMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/monedas/tasas-locales", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monedas/mis-tasas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monedas/historial-cambista"] });
      setShowNuevaTasaModal(false);
      limpiarFormulario();
      toast({ title: "Tasa registrada", description: "Tu tasa de cambio ha sido registrada correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const actualizarTasaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/monedas/tasas-locales/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monedas/mis-tasas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monedas/historial-cambista"] });
      setEditandoTasa(null);
      limpiarFormulario();
      toast({ title: "Tasa actualizada", description: "La tasa de cambio ha sido actualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const limpiarFormulario = () => {
    setMonedaOrigen("USD");
    setMonedaDestino("PEN");
    setTasaCompra("");
    setTasaVenta("");
    setUbicacion("");
    setTelefono("");
  };

  const handleGuardarTasa = () => {
    if (!tasaCompra || !tasaVenta) {
      toast({ title: "Error", description: "Ingresa las tasas de compra y venta", variant: "destructive" });
      return;
    }

    const data = {
      monedaOrigenCodigo: monedaOrigen,
      monedaDestinoCodigo: monedaDestino,
      tasaCompra: parseFloat(tasaCompra),
      tasaVenta: parseFloat(tasaVenta),
      ubicacion: ubicacion || null,
      telefono: telefono || null,
    };

    if (editandoTasa) {
      actualizarTasaMutation.mutate({ id: editandoTasa.id, data });
    } else {
      crearTasaMutation.mutate(data);
    }
  };

  const handleEditarTasa = (tasa: TasaCambioLocal) => {
    setEditandoTasa(tasa);
    setMonedaOrigen(tasa.monedaOrigenCodigo);
    setMonedaDestino(tasa.monedaDestinoCodigo);
    setTasaCompra(tasa.tasaCompra);
    setTasaVenta(tasa.tasaVenta);
    setUbicacion(tasa.ubicacion || "");
    setTelefono(tasa.telefono || "");
    setShowNuevaTasaModal(true);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMonedaInfo = (codigo: string) => {
    return monedasDisponibles.find(m => m.codigo === codigo) || monedasDisponibles[0];
  };

  return (
    <div className="space-y-6" data-testid="panel-cambista">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Coins className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Panel de Cambista</h2>
            <p className="text-sm text-muted-foreground">Gestiona tus tasas de cambio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchTasas()}
            data-testid="button-actualizar-tasas"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${cargandoTasas ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button 
            onClick={() => {
              limpiarFormulario();
              setEditandoTasa(null);
              setShowNuevaTasaModal(true);
            }}
            data-testid="button-nueva-tasa"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tasa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-stat-tasas-activas">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{misTasas.filter(t => t.activo).length}</span>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-actualizaciones">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actualizaciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {historial.filter(h => 
                new Date(h.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </span>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-pares">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pares de Monedas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{misTasas.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Mis Tasas de Cambio
            </CardTitle>
            <CardDescription>Tasas que has configurado para tus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {cargandoTasas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : misTasas.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No tienes tasas de cambio registradas</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowNuevaTasaModal(true)}
                  data-testid="button-agregar-primera-tasa"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Tasa
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {misTasas.map((tasa) => (
                    <div 
                      key={tasa.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`item-tasa-${tasa.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xl">{getMonedaInfo(tasa.monedaOrigenCodigo).bandera}</span>
                          <span className="font-medium">{tasa.monedaOrigenCodigo}</span>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xl">{getMonedaInfo(tasa.monedaDestinoCodigo).bandera}</span>
                          <span className="font-medium">{tasa.monedaDestinoCodigo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Compra</p>
                          <p className="font-semibold text-green-600">{parseFloat(tasa.tasaCompra).toFixed(4)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Venta</p>
                          <p className="font-semibold text-red-600">{parseFloat(tasa.tasaVenta).toFixed(4)}</p>
                        </div>
                        <Badge variant={tasa.activo ? "default" : "secondary"}>
                          {tasa.activo ? "Activa" : "Inactiva"}
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleEditarTasa(tasa)}
                          data-testid={`button-editar-tasa-${tasa.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Historial de Cambios
            </CardTitle>
            <CardDescription>Registro de actualizaciones de tasas</CardDescription>
          </CardHeader>
          <CardContent>
            {cargandoHistorial ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Sin historial de cambios</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {historial.slice(0, 20).map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-muted/30 rounded-lg text-sm"
                      data-testid={`item-historial-${item.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.tipoAccion === 'creacion' ? 'default' : 'secondary'} className="text-xs">
                            {item.tipoAccion === 'creacion' ? 'Nueva' : 'Actualiz.'}
                          </Badge>
                          <span>{getMonedaInfo(item.monedaOrigenCodigo).bandera}</span>
                          <span className="font-medium">{item.monedaOrigenCodigo}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{getMonedaInfo(item.monedaDestinoCodigo).bandera}</span>
                          <span className="font-medium">{item.monedaDestinoCodigo}</span>
                        </div>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatearFecha(item.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {item.tasaCompraAnterior && (
                          <span className="text-muted-foreground line-through">
                            C: {parseFloat(item.tasaCompraAnterior).toFixed(4)}
                          </span>
                        )}
                        <span className="text-green-600 font-medium">
                          C: {parseFloat(item.tasaCompraNueva).toFixed(4)}
                        </span>
                        {item.tasaVentaAnterior && (
                          <span className="text-muted-foreground line-through">
                            V: {parseFloat(item.tasaVentaAnterior).toFixed(4)}
                          </span>
                        )}
                        <span className="text-red-600 font-medium">
                          V: {parseFloat(item.tasaVentaNueva).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNuevaTasaModal} onOpenChange={setShowNuevaTasaModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              {editandoTasa ? "Actualizar Tasa de Cambio" : "Nueva Tasa de Cambio"}
            </DialogTitle>
            <DialogDescription>
              {editandoTasa ? "Modifica las tasas para este par de monedas" : "Ingresa las tasas de compra y venta para un par de monedas"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monedaOrigen">Moneda Origen</Label>
                <Select value={monedaOrigen} onValueChange={setMonedaOrigen} disabled={!!editandoTasa}>
                  <SelectTrigger className="mt-2" data-testid="select-moneda-origen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monedasDisponibles.map((m) => (
                      <SelectItem key={m.codigo} value={m.codigo}>
                        <span className="flex items-center gap-2">
                          <span>{m.bandera}</span>
                          <span>{m.codigo}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monedaDestino">Moneda Destino</Label>
                <Select value={monedaDestino} onValueChange={setMonedaDestino} disabled={!!editandoTasa}>
                  <SelectTrigger className="mt-2" data-testid="select-moneda-destino">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monedasDisponibles.filter(m => m.codigo !== monedaOrigen).map((m) => (
                      <SelectItem key={m.codigo} value={m.codigo}>
                        <span className="flex items-center gap-2">
                          <span>{m.bandera}</span>
                          <span>{m.codigo}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tasaCompra" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Tasa Compra
                </Label>
                <Input
                  id="tasaCompra"
                  type="number"
                  step="0.0001"
                  value={tasaCompra}
                  onChange={(e) => setTasaCompra(e.target.value)}
                  placeholder="3.7500"
                  className="mt-2"
                  data-testid="input-tasa-compra"
                />
              </div>
              <div>
                <Label htmlFor="tasaVenta" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Tasa Venta
                </Label>
                <Input
                  id="tasaVenta"
                  type="number"
                  step="0.0001"
                  value={tasaVenta}
                  onChange={(e) => setTasaVenta(e.target.value)}
                  placeholder="3.8000"
                  className="mt-2"
                  data-testid="input-tasa-venta"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ubicacion" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicacion (opcional)
              </Label>
              <Input
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Centro de Tacna"
                className="mt-2"
                data-testid="input-ubicacion"
              />
            </div>

            <div>
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefono (opcional)
              </Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="999888777"
                className="mt-2"
                data-testid="input-telefono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNuevaTasaModal(false);
                setEditandoTasa(null);
                limpiarFormulario();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarTasa}
              disabled={crearTasaMutation.isPending || actualizarTasaMutation.isPending}
              data-testid="button-guardar-tasa"
            >
              {(crearTasaMutation.isPending || actualizarTasaMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editandoTasa ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
