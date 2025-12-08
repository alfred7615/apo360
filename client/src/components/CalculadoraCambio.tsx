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
  const [monedaOrigen, setMonedaOrigen] = useState<string>("PEN");
  const [monedaDestino, setMonedaDestino] = useState<string>("USD");
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
    <div className="space-y-5" data-testid="card-calculadora-cambio">
      {!sinCard && (
        <div className="flex flex-row items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20">
              <Calculator className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100" data-testid="title-calculadora">Calculadora de Cambio</h3>
          </div>
          <Badge 
            variant="outline" 
            className={calcularCambio.fuente === "local" 
              ? "border-rose-500/50 bg-rose-500/10 text-rose-300" 
              : "border-gray-500/50 bg-gray-700/50 text-gray-300"
            }
          >
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
          <Badge 
            variant="outline"
            className={calcularCambio.fuente === "local" 
              ? "border-rose-500/50 bg-rose-500/10 text-rose-300" 
              : "border-gray-500/50 bg-gray-700/50 text-gray-300"
            }
          >
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
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/80 p-1 rounded-lg">
          <TabsTrigger 
            value="compra" 
            data-testid="tab-compra"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md transition-all"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Compra
          </TabsTrigger>
          <TabsTrigger 
            value="venta" 
            data-testid="tab-venta"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md transition-all"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Venta
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="space-y-2">
          <label className="text-sm font-medium text-rose-300/80">Tengo</label>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-[140px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400/70 text-sm font-medium">
                {getMonedaInfo(monedaOrigen).simbolo}
              </span>
              <Input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="pl-9 text-base font-semibold bg-gray-700/60 border-gray-600/50 text-gray-100 placeholder:text-gray-500 focus:border-rose-500/50 focus:ring-rose-500/20"
                placeholder="0.00"
                data-testid="input-monto-origen"
              />
            </div>
            <Select value={monedaOrigen} onValueChange={setMonedaOrigen}>
              <SelectTrigger 
                className="w-24 bg-gray-700/60 border-gray-600/50 text-gray-100 focus:border-rose-500/50" 
                data-testid="select-moneda-origen"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {monedas.map((m) => (
                  <SelectItem 
                    key={m.codigo} 
                    value={m.codigo} 
                    data-testid={`option-origen-${m.codigo}`}
                    className="text-gray-100 focus:bg-rose-500/20 focus:text-gray-100"
                  >
                    <span className="flex items-center gap-2">
                      <span>{m.bandera}</span>
                      <span className="font-medium">{m.codigo}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-400">{getMonedaInfo(monedaOrigen).nombre}</p>
        </div>

        <div className="flex justify-center py-2 md:py-0">
          <Button
            size="icon"
            variant="outline"
            onClick={intercambiarMonedas}
            className="rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-400/50 hover:bg-rose-500/30 transition-all"
            data-testid="button-intercambiar"
          >
            <ArrowRightLeft className="h-4 w-4 text-rose-300" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-emerald-300/80">Recibo</label>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-[140px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/70 text-sm font-medium">
                {getMonedaInfo(monedaDestino).simbolo}
              </span>
              <Input
                type="text"
                value={formatearNumero(calcularCambio.resultado)}
                readOnly
                className="pl-9 text-base font-semibold bg-gray-600/40 border-gray-600/50 text-emerald-300"
                data-testid="input-monto-resultado"
              />
            </div>
            <Select value={monedaDestino} onValueChange={setMonedaDestino}>
              <SelectTrigger 
                className="w-24 bg-gray-700/60 border-gray-600/50 text-gray-100 focus:border-rose-500/50" 
                data-testid="select-moneda-destino"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {monedas.map((m) => (
                  <SelectItem 
                    key={m.codigo} 
                    value={m.codigo} 
                    data-testid={`option-destino-${m.codigo}`}
                    className="text-gray-100 focus:bg-rose-500/20 focus:text-gray-100"
                  >
                    <span className="flex items-center gap-2">
                      <span>{m.bandera}</span>
                      <span className="font-medium">{m.codigo}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-400">{getMonedaInfo(monedaDestino).nombre}</p>
        </div>
      </div>

      <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-md bg-rose-500/20">
              <Banknote className="h-4 w-4 text-rose-400" />
            </div>
            <span className="text-gray-400">Tipo de cambio:</span>
            <span className="font-semibold text-gray-100" data-testid="text-tasa-cambio">
              1 {monedaOrigen} = {formatearNumero(calcularCambio.tasaUsada, 4)} {monedaDestino}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              refetchPromedio();
            }}
            disabled={isLoading}
            className="h-8 w-8 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
            data-testid="button-actualizar-tasa"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full text-gray-400 hover:text-rose-300 hover:bg-rose-500/10"
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
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-4" data-testid="section-detalles-tasas">
          <h4 className="font-medium flex items-center gap-2 text-gray-200">
            <Clock className="h-4 w-4 text-rose-400" />
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
                    className="flex items-center justify-between p-3 bg-gray-700/40 rounded-lg text-sm border border-gray-600/30"
                    data-testid={`item-tasa-local-${tasa.id}`}
                  >
                    <span className="text-gray-300">
                      {tasa.ubicacion || "Cambista Local"}
                    </span>
                    <div className="flex gap-4">
                      <span>
                        <span className="text-xs text-gray-500">Compra:</span>{" "}
                        <span className="font-medium text-emerald-400">
                          {formatearNumero(parseFloat(tasa.tasaCompra), 4)}
                        </span>
                      </span>
                      <span>
                        <span className="text-xs text-gray-500">Venta:</span>{" "}
                        <span className="font-medium text-rose-400">
                          {formatearNumero(parseFloat(tasa.tasaVenta), 4)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              
              {promedioLocal && (promedioLocal.promedioCompra || promedioLocal.promedioVenta) && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-lg text-sm mt-2 border border-rose-500/20">
                  <span className="font-medium text-gray-200">Promedio Local</span>
                  <div className="flex gap-4">
                    {promedioLocal.promedioCompra && (
                      <span>
                        <span className="text-xs text-gray-500">Compra:</span>{" "}
                        <span className="font-bold text-emerald-400">
                          {formatearNumero(promedioLocal.promedioCompra, 4)}
                        </span>
                      </span>
                    )}
                    {promedioLocal.promedioVenta && (
                      <span>
                        <span className="text-xs text-gray-500">Venta:</span>{" "}
                        <span className="font-bold text-rose-400">
                          {formatearNumero(promedioLocal.promedioVenta, 4)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
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
            variant="outline"
            onClick={() => setMonedaOrigen(m.codigo)}
            className={`text-xs transition-all ${
              monedaOrigen === m.codigo 
                ? "bg-gradient-to-r from-rose-500 to-pink-500 border-rose-500 text-white hover:from-rose-600 hover:to-pink-600" 
                : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600/50 hover:border-rose-500/30 hover:text-rose-300"
            }`}
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
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border-gray-700/50 shadow-xl shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20">
            <Calculator className="h-5 w-5 text-rose-400" />
          </div>
          <CardTitle className="text-gray-100" data-testid="title-calculadora">Calculadora de Cambio</CardTitle>
        </div>
        <Badge 
          variant="outline"
          className={calcularCambio.fuente === "local" 
            ? "border-rose-500/50 bg-rose-500/10 text-rose-300" 
            : "border-gray-600/50 bg-gray-700/50 text-gray-400"
          }
        >
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
      <CardContent className="pt-5">
        {contenido}
      </CardContent>
    </Card>
  );
}
