import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown, DollarSign, Banknote, Calculator, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { ConfiguracionMoneda, TasaCambioLocal } from "@shared/schema";

interface TasaPromedioLocal {
  promedioCompra: number | null;
  promedioVenta: number | null;
}

interface MonedaInfo {
  codigo: string;
  nombre: string;
  simbolo: string;
  bandera: string;
  tasaUSD: number;
}

const monedasDefault: MonedaInfo[] = [
  { codigo: "PEN", nombre: "Sol Peruano", simbolo: "S/", bandera: "🇵🇪", tasaUSD: 3.72 },
  { codigo: "USD", nombre: "Dólar Estadounidense", simbolo: "$", bandera: "🇺🇸", tasaUSD: 1.00 },
  { codigo: "CLP", nombre: "Peso Chileno", simbolo: "$", bandera: "🇨🇱", tasaUSD: 890.50 },
  { codigo: "ARS", nombre: "Peso Argentino", simbolo: "$", bandera: "🇦🇷", tasaUSD: 850.00 },
  { codigo: "BOB", nombre: "Boliviano", simbolo: "Bs", bandera: "🇧🇴", tasaUSD: 6.91 },
];

interface CalculadoraCambioProps {
  sinCard?: boolean;
}

export function CalculadoraCambio({ sinCard = false }: CalculadoraCambioProps) {
  const [monto, setMonto] = useState<string>("100");
  const [monedaOrigen, setMonedaOrigen] = useState<string>("USD");
  const [monedaDestino, setMonedaDestino] = useState<string>("PEN");
  const [mostrarDetalles, setMostrarDetalles] = useState<boolean>(false);
  const [tipoTasa, setTipoTasa] = useState<"compra" | "venta">("compra");

  const { data: configuracionMonedas, isLoading: cargandoMonedas } = useQuery<ConfiguracionMoneda[]>({
    queryKey: ["/api/monedas/configuracion"],
    staleTime: 60000,
  });

  const { data: tasasLocales, isLoading: cargandoTasasLocales } = useQuery<TasaCambioLocal[]>({
    queryKey: ["/api/monedas/tasas-locales"],
    staleTime: 30000,
  });

  const { data: promedioLocal, isLoading: cargandoPromedio, refetch: refetchPromedio } = useQuery<TasaPromedioLocal>({
    queryKey: ["/api/monedas/promedio", monedaOrigen, monedaDestino],
    enabled: monedaOrigen !== monedaDestino,
    staleTime: 30000,
  });

  const monedas = useMemo(() => {
    if (!configuracionMonedas || configuracionMonedas.length === 0) {
      return monedasDefault;
    }
    return configuracionMonedas
      .filter(m => m.activo)
      .map(m => ({
        codigo: m.codigo,
        nombre: m.nombre,
        simbolo: m.simbolo,
        bandera: m.banderaUrl || "",
        tasaUSD: parseFloat(m.tasaPromedioInternet || "1"),
      }));
  }, [configuracionMonedas]);

  const calcularCambio = useMemo(() => {
    if (!monto || isNaN(parseFloat(monto))) return { resultado: 0, tasaUsada: 0, fuente: "internet" };
    
    const cantidad = parseFloat(monto);
    const origenInfo = monedas.find(m => m.codigo === monedaOrigen);
    const destinoInfo = monedas.find(m => m.codigo === monedaDestino);
    
    if (!origenInfo || !destinoInfo || monedaOrigen === monedaDestino) {
      return { resultado: cantidad, tasaUsada: 1, fuente: "directo" };
    }

    let tasaFinal: number;
    let fuente = "internet";

    if (promedioLocal && (tipoTasa === "compra" ? promedioLocal.promedioCompra : promedioLocal.promedioVenta)) {
      tasaFinal = tipoTasa === "compra" ? promedioLocal.promedioCompra! : promedioLocal.promedioVenta!;
      fuente = "local";
      const resultado = cantidad * tasaFinal;
      return { resultado, tasaUsada: tasaFinal, fuente };
    } else {
      tasaFinal = origenInfo.tasaUSD / destinoInfo.tasaUSD;
      const resultado = cantidad * tasaFinal;
      return { resultado, tasaUsada: tasaFinal, fuente: "internet" };
    }
  }, [monto, monedaOrigen, monedaDestino, monedas, promedioLocal, tipoTasa]);

  const intercambiarMonedas = () => {
    const temp = monedaOrigen;
    setMonedaOrigen(monedaDestino);
    setMonedaDestino(temp);
  };

  const formatearNumero = (num: number, decimales: number = 2) => {
    return num.toLocaleString("es-PE", {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });
  };

  const getMonedaInfo = (codigo: string) => {
    return monedas.find(m => m.codigo === codigo) || monedasDefault[0];
  };

  const isLoading = cargandoMonedas || cargandoTasasLocales || cargandoPromedio;

  const contenido = (
    <div className="space-y-6" data-testid="card-calculadora-cambio">
      {!sinCard && (
        <div className="flex flex-row items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold" data-testid="title-calculadora">Calculadora de Cambio</h3>
          </div>
          <Badge variant={calcularCambio.fuente === "local" ? "default" : "secondary"}>
            {calcularCambio.fuente === "local" ? (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Tasa Local
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Tasa Referencia
              </span>
            )}
          </Badge>
        </div>
      )}
      {sinCard && (
        <div className="flex justify-center mb-2">
          <Badge variant={calcularCambio.fuente === "local" ? "default" : "secondary"}>
            {calcularCambio.fuente === "local" ? (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Tasa Local
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Tasa Referencia
              </span>
            )}
          </Badge>
        </div>
      )}
        <Tabs value={tipoTasa} onValueChange={(v) => setTipoTasa(v as "compra" | "venta")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compra" data-testid="tab-compra">
              <TrendingUp className="h-4 w-4 mr-2" />
              Compra
            </TabsTrigger>
            <TabsTrigger value="venta" data-testid="tab-venta">
              <TrendingDown className="h-4 w-4 mr-2" />
              Venta
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tengo</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getMonedaInfo(monedaOrigen).simbolo}
                </span>
                <Input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="pl-10 text-lg font-semibold"
                  placeholder="0.00"
                  data-testid="input-monto-origen"
                />
              </div>
              <Select value={monedaOrigen} onValueChange={setMonedaOrigen}>
                <SelectTrigger className="w-28" data-testid="select-moneda-origen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monedas.map((m) => (
                    <SelectItem key={m.codigo} value={m.codigo} data-testid={`option-origen-${m.codigo}`}>
                      <span className="flex items-center gap-2">
                        <span>{m.bandera}</span>
                        <span>{m.codigo}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{getMonedaInfo(monedaOrigen).nombre}</p>
          </div>

          <div className="flex justify-center">
            <Button
              size="icon"
              variant="outline"
              onClick={intercambiarMonedas}
              className="rounded-full"
              data-testid="button-intercambiar"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Recibo</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getMonedaInfo(monedaDestino).simbolo}
                </span>
                <Input
                  type="text"
                  value={formatearNumero(calcularCambio.resultado)}
                  readOnly
                  className="pl-10 text-lg font-semibold bg-muted/50"
                  data-testid="input-monto-resultado"
                />
              </div>
              <Select value={monedaDestino} onValueChange={setMonedaDestino}>
                <SelectTrigger className="w-28" data-testid="select-moneda-destino">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monedas.map((m) => (
                    <SelectItem key={m.codigo} value={m.codigo} data-testid={`option-destino-${m.codigo}`}>
                      <span className="flex items-center gap-2">
                        <span>{m.bandera}</span>
                        <span>{m.codigo}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{getMonedaInfo(monedaDestino).nombre}</p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Banknote className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Tipo de cambio:</span>
              <span className="font-semibold" data-testid="text-tasa-cambio">
                1 {monedaOrigen} = {formatearNumero(calcularCambio.tasaUsada, 4)} {monedaDestino}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                refetchPromedio();
              }}
              disabled={isLoading}
              data-testid="button-actualizar-tasa"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setMostrarDetalles(!mostrarDetalles)}
          data-testid="button-toggle-detalles"
        >
          {mostrarDetalles ? (
            <span className="flex items-center gap-2">
              <ChevronUp className="h-4 w-4" />
              Ocultar detalles
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              Ver tasas locales
            </span>
          )}
        </Button>

        {mostrarDetalles && (
          <div className="border rounded-lg p-4 space-y-4" data-testid="section-detalles-tasas">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tasas de Cambistas Locales
            </h4>
            
            {tasasLocales && tasasLocales.length > 0 ? (
              <div className="space-y-2">
                {tasasLocales
                  .filter(t => 
                    t.monedaOrigenCodigo === monedaOrigen && 
                    t.monedaDestinoCodigo === monedaDestino
                  )
                  .slice(0, 5)
                  .map((tasa) => (
                    <div
                      key={tasa.id}
                      className="flex items-center justify-between p-2 bg-muted/20 rounded-lg text-sm"
                      data-testid={`item-tasa-local-${tasa.id}`}
                    >
                      <span className="text-muted-foreground">
                        {tasa.ubicacion || "Cambista Local"}
                      </span>
                      <div className="flex gap-4">
                        <span>
                          <span className="text-xs text-muted-foreground">Compra:</span>{" "}
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatearNumero(parseFloat(tasa.tasaCompra), 4)}
                          </span>
                        </span>
                        <span>
                          <span className="text-xs text-muted-foreground">Venta:</span>{" "}
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {formatearNumero(parseFloat(tasa.tasaVenta), 4)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                
                {promedioLocal && (promedioLocal.promedioCompra || promedioLocal.promedioVenta) && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg text-sm mt-2">
                    <span className="font-medium">Promedio Local</span>
                    <div className="flex gap-4">
                      {promedioLocal.promedioCompra && (
                        <span>
                          <span className="text-xs text-muted-foreground">Compra:</span>{" "}
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {formatearNumero(promedioLocal.promedioCompra, 4)}
                          </span>
                        </span>
                      )}
                      {promedioLocal.promedioVenta && (
                        <span>
                          <span className="text-xs text-muted-foreground">Venta:</span>{" "}
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {formatearNumero(promedioLocal.promedioVenta, 4)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tasas locales disponibles para este par de monedas.
                <br />
                Se usa la tasa de referencia de internet.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {monedas.map((m) => (
            <Button
              key={m.codigo}
              size="sm"
              variant={monedaOrigen === m.codigo ? "default" : "outline"}
              onClick={() => setMonedaOrigen(m.codigo)}
              className="text-xs"
              data-testid={`button-moneda-rapida-${m.codigo}`}
            >
              <span className="mr-1">{m.bandera}</span>
              {m.codigo}
            </Button>
          ))}
        </div>
    </div>
  );

  if (sinCard) {
    return contenido;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <CardTitle data-testid="title-calculadora">Calculadora de Cambio</CardTitle>
        </div>
        <Badge variant={calcularCambio.fuente === "local" ? "default" : "secondary"}>
          {calcularCambio.fuente === "local" ? (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Tasa Local
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Tasa Referencia
            </span>
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        {contenido}
      </CardContent>
    </Card>
  );
}
