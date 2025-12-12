import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, TrendingUp, TrendingDown, DollarSign, Edit, RefreshCw, History, Users, Calculator, Settings, Globe, MapPin, Database, Loader2, Clock } from "lucide-react";
import { CambistasSection } from "@/components/admin/cambistas-section";
import { CalculadoraCambio } from "@/components/CalculadoraCambio";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ConfiguracionMoneda, TasaCambioLocal, HistorialTasaCambio } from "@shared/schema";

export default function GestionMonedaScreen() {
  const [activeTab, setActiveTab] = useState("calculadora");
  const { toast } = useToast();

  const { data: monedas, isLoading: cargandoMonedas, refetch: refetchMonedas } = useQuery<ConfiguracionMoneda[]>({
    queryKey: ["/api/monedas/configuracion"],
  });

  const { data: tasasLocales, isLoading: cargandoTasas, refetch: refetchTasas } = useQuery<TasaCambioLocal[]>({
    queryKey: ["/api/monedas/tasas-locales"],
  });

  const { data: historialTasas, isLoading: cargandoHistorial, refetch: refetchHistorial } = useQuery<HistorialTasaCambio[]>({
    queryKey: ["/api/admin/historial-tasas-cambio"],
  });

  const setupHistorialMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/setup-historial-tasas"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/historial-tasas-cambio"] });
      toast({ title: "Historial configurado", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const tasaUsdPen = monedas?.find(m => m.codigo === "USD")?.tasaPromedioInternet;
  const cantidadTasasActivas = tasasLocales?.filter(t => t.activo).length || 0;

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const monedasInfo: Record<string, { bandera: string }> = {
    PEN: { bandera: "🇵🇪" },
    USD: { bandera: "🇺🇸" },
    CLP: { bandera: "🇨🇱" },
    ARS: { bandera: "🇦🇷" },
    BOB: { bandera: "🇧🇴" },
  };

  return (
    <div className="space-y-6" data-testid="screen-gestion-moneda">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Cambio de Moneda</h2>
          <p className="text-muted-foreground">Configura tipos de cambio, cambistas y calculadora de divisas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-usd">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">USD / PEN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {tasaUsdPen ? parseFloat(tasaUsdPen).toFixed(2) : "3.75"}
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-monedas">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monedas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{monedas?.filter(m => m.activo).length || 0}</span>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-tasas">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasas Locales</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{cantidadTasasActivas}</span>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-volumen">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Última Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-medium">
              {monedas?.[0]?.ultimaActualizacion 
                ? new Date(monedas[0].ultimaActualizacion).toLocaleDateString("es-PE")
                : "N/A"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="calculadora" data-testid="tab-calculadora">
              <Calculator className="h-4 w-4 mr-2" />
              Calculadora
            </TabsTrigger>
            <TabsTrigger value="cambistas" data-testid="tab-cambistas">
              <Users className="h-4 w-4 mr-2" />
              Cambistas
            </TabsTrigger>
            <TabsTrigger value="monedas" data-testid="tab-monedas">
              <Coins className="h-4 w-4 mr-2" />
              Monedas
            </TabsTrigger>
            <TabsTrigger value="historial" data-testid="tab-historial">
              <History className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { refetchMonedas(); refetchTasas(); }}
            data-testid="button-actualizar-tasas"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${cargandoMonedas || cargandoTasas ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <TabsContent value="calculadora" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CalculadoraCambio />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Tasas de Referencia
                </CardTitle>
                <CardDescription>
                  Comparación de tasas Internet vs Locales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monedas?.filter(m => !m.esPrincipal).map((moneda) => (
                    <div 
                      key={moneda.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      data-testid={`item-comparacion-${moneda.codigo}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{moneda.banderaUrl || "💱"}</span>
                        <div>
                          <p className="font-medium">{moneda.codigo}</p>
                          <p className="text-xs text-muted-foreground">{moneda.nombreCorto}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-blue-500">
                            <Globe className="h-3 w-3" />
                            <span className="text-xs">Internet</span>
                          </div>
                          <p className="font-semibold">
                            {moneda.tasaPromedioInternet 
                              ? parseFloat(moneda.tasaPromedioInternet).toFixed(4) 
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-500">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">Local</span>
                          </div>
                          <p className="font-semibold text-green-600">
                            {moneda.tasaPromedioLocal 
                              ? parseFloat(moneda.tasaPromedioLocal).toFixed(4) 
                              : "Sin datos"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                      Las tasas locales se calculan como promedio de los cambistas activos.
                      <br />
                      Actualización automática cada hora.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cambistas" className="mt-6">
          <CambistasSection />
        </TabsContent>

        <TabsContent value="monedas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Monedas</CardTitle>
              <CardDescription>Monedas disponibles en el sistema de cambio</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {monedas?.map((moneda) => (
                    <div 
                      key={moneda.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`item-moneda-${moneda.codigo}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                          {moneda.banderaUrl || moneda.simbolo}
                        </div>
                        <div>
                          <p className="font-medium">{moneda.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {moneda.codigo} - {moneda.nombreCorto}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Tasa Internet (vs PEN)</p>
                          <p className="font-semibold">
                            {moneda.tasaPromedioInternet 
                              ? parseFloat(moneda.tasaPromedioInternet).toFixed(4) 
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Tasa Local</p>
                          <p className="font-semibold text-primary">
                            {moneda.tasaPromedioLocal 
                              ? parseFloat(moneda.tasaPromedioLocal).toFixed(4) 
                              : "Sin datos"}
                          </p>
                        </div>
                        <Badge variant={moneda.activo ? "default" : "secondary"}>
                          {moneda.activo ? "Activa" : "Inactiva"}
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          data-testid={`button-edit-moneda-${moneda.codigo}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Cambios de Tasas</CardTitle>
                <CardDescription>Registro de todas las actualizaciones de tasas de cambio</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchHistorial()}
                  data-testid="button-refetch-historial"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${cargandoHistorial ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setupHistorialMutation.mutate()}
                  disabled={setupHistorialMutation.isPending}
                  data-testid="button-setup-historial"
                >
                  {setupHistorialMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Configurar Datos de Prueba
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cargandoHistorial ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : historialTasas && historialTasas.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {historialTasas.map((registro) => (
                      <div 
                        key={registro.id} 
                        className="p-3 bg-muted/30 rounded-lg text-sm"
                        data-testid={`item-historial-${registro.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={registro.tipoAccion === 'creacion' ? 'default' : 'secondary'} className="text-xs">
                              {registro.tipoAccion === 'creacion' ? 'Creación' : 'Actualización'}
                            </Badge>
                            <span>{monedasInfo[registro.monedaOrigenCodigo]?.bandera || "💱"}</span>
                            <span className="font-medium">{registro.monedaOrigenCodigo}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>{monedasInfo[registro.monedaDestinoCodigo]?.bandera || "💱"}</span>
                            <span className="font-medium">{registro.monedaDestinoCodigo}</span>
                          </div>
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {registro.createdAt ? formatearFecha(String(registro.createdAt)) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs flex-wrap">
                          {registro.tasaCompraAnterior && (
                            <span className="text-muted-foreground line-through">
                              Compra: {parseFloat(registro.tasaCompraAnterior).toFixed(4)}
                            </span>
                          )}
                          <span className="text-green-600 font-medium">
                            Compra: {parseFloat(registro.tasaCompraNueva).toFixed(4)}
                          </span>
                          {registro.tasaVentaAnterior && (
                            <span className="text-muted-foreground line-through">
                              Venta: {parseFloat(registro.tasaVentaAnterior).toFixed(4)}
                            </span>
                          )}
                          <span className="text-red-600 font-medium">
                            Venta: {parseFloat(registro.tasaVentaNueva).toFixed(4)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay historial de cambios registrado.</p>
                  <p className="text-sm mt-2">Usa el botón "Configurar Datos de Prueba" para crear registros de ejemplo.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setupHistorialMutation.mutate()}
                    disabled={setupHistorialMutation.isPending}
                  >
                    {setupHistorialMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Configurar Historial con Datos de Prueba
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
