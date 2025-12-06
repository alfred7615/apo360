import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, TrendingUp, TrendingDown, DollarSign, Edit, RefreshCw, History, Users, Calculator, Settings } from "lucide-react";
import { CambistasSection } from "@/components/admin/cambistas-section";
import type { ConfiguracionMoneda, TasaCambioLocal } from "@shared/schema";

export default function GestionMonedaScreen() {
  const [activeTab, setActiveTab] = useState("calculadora");

  const { data: monedas, isLoading: cargandoMonedas, refetch: refetchMonedas } = useQuery<ConfiguracionMoneda[]>({
    queryKey: ["/api/monedas/configuracion"],
  });

  const { data: tasasLocales, isLoading: cargandoTasas, refetch: refetchTasas } = useQuery<TasaCambioLocal[]>({
    queryKey: ["/api/monedas/tasas-locales"],
  });

  const tasaUsdPen = monedas?.find(m => m.codigo === "USD")?.tasaPromedioInternet;
  const cantidadTasasActivas = tasasLocales?.filter(t => t.activo).length || 0;

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
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Calculadora</CardTitle>
              <CardDescription>
                Así se verá la calculadora para los usuarios. Accede desde /calculadora-cambio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="max-w-lg mx-auto space-y-4">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-primary mb-2" />
                    <h3 className="text-xl font-bold">Calculadora de Cambio</h3>
                    <p className="text-sm text-muted-foreground">
                      Los usuarios pueden convertir entre 5 monedas con tasas actualizadas
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 justify-center">
                    {monedas?.slice(0, 5).map((m) => (
                      <div 
                        key={m.codigo} 
                        className="text-center p-2 bg-background rounded-lg"
                      >
                        <span className="text-lg">{m.banderaUrl || "💱"}</span>
                        <p className="text-xs font-medium">{m.codigo}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => window.open("/calculadora-cambio", "_blank")}
                    data-testid="button-abrir-calculadora"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Abrir Calculadora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <CardHeader>
              <CardTitle>Historial de Tasas</CardTitle>
              <CardDescription>Cambios recientes en las tasas de cambio locales</CardDescription>
            </CardHeader>
            <CardContent>
              {tasasLocales && tasasLocales.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {tasasLocales.map((tasa) => (
                      <div 
                        key={tasa.id} 
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                        data-testid={`item-historial-${tasa.id}`}
                      >
                        <div>
                          <span className="font-medium">
                            {tasa.monedaOrigenCodigo} → {tasa.monedaDestinoCodigo}
                          </span>
                          {tasa.ubicacion && (
                            <span className="text-muted-foreground ml-2">({tasa.ubicacion})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-green-600">
                            C: {parseFloat(tasa.tasaCompra).toFixed(4)}
                          </span>
                          <span className="text-red-600">
                            V: {parseFloat(tasa.tasaVenta).toFixed(4)}
                          </span>
                          <Badge variant={tasa.activo ? "default" : "secondary"} className="text-xs">
                            {tasa.activo ? "Activa" : "Inactiva"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tasa.updatedAt 
                              ? new Date(tasa.updatedAt).toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay tasas de cambio registradas.</p>
                  <p className="text-sm">Los cambistas pueden agregar sus tasas desde su panel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
