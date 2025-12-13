import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown, DollarSign, 
  Banknote, Calculator, Clock, ChevronDown, ChevronUp, X, ArrowLeft, 
  FlaskConical, Lock, Delete, RotateCcw, Percent, Divide, Pi,
  Download, FileSpreadsheet, Image, Share2, Users, Send, Check
} from "lucide-react";
import * as math from "mathjs";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ConfiguracionMoneda, TasaCambioLocal, Usuario } from "@shared/schema";

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

type ModoCalculadora = "moneda" | "normal" | "cientifica";

interface CalculadoraCambioProps {
  sinCard?: boolean;
  modoInicial?: ModoCalculadora;
  onCerrar?: () => void;
  onRetroceder?: () => void;
  mostrarHeader?: boolean;
  usuario?: Usuario | null;
  tieneMembresiaActiva?: boolean;
}

interface EjercicioCompartido {
  expresion: string;
  resultado: string;
  modoAngulo: string;
  historial: string[];
  fecha: string;
}

const formatearNumeroConComas = (valor: number, decimalesInput?: number): string => {
  const decimales = decimalesInput !== undefined ? decimalesInput : 2;
  return valor.toLocaleString("en-US", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

const parsearNumeroConComas = (valor: string): number => {
  const limpio = valor.replace(/,/g, "");
  return parseFloat(limpio) || 0;
};

export function CalculadoraCambio({ 
  sinCard = false, 
  modoInicial = "moneda",
  onCerrar,
  onRetroceder,
  mostrarHeader = true,
  usuario,
  tieneMembresiaActiva = false
}: CalculadoraCambioProps) {
  const { toast } = useToast();
  const [modo, setModo] = useState<ModoCalculadora>(modoInicial);
  const [monto, setMonto] = useState<string>("100.00");
  const [montoDisplay, setMontoDisplay] = useState<string>("100.00");
  const [decimalesActuales, setDecimalesActuales] = useState<number>(2);
  const [monedaOrigen, setMonedaOrigen] = useState<string>("PEN");
  const [monedaDestino, setMonedaDestino] = useState<string>("USD");
  const [mostrarDetalles, setMostrarDetalles] = useState<boolean>(false);
  const [tipoTasa, setTipoTasa] = useState<"compra" | "venta">("compra");
  const [expresionCientifica, setExpresionCientifica] = useState<string>("");
  const [resultadoCientifica, setResultadoCientifica] = useState<string>("0");
  const [historialCientifica, setHistorialCientifica] = useState<string[]>([]);
  const [modoAngulo, setModoAngulo] = useState<"deg" | "rad">("deg");
  const [mostrarFuncionesAvanzadas, setMostrarFuncionesAvanzadas] = useState(false);
  
  const [expresionNormal, setExpresionNormal] = useState<string>("");
  const [resultadoNormal, setResultadoNormal] = useState<string>("0");
  const [historialNormal, setHistorialNormal] = useState<string[]>([]);
  
  const [mostrarModalCompartir, setMostrarModalCompartir] = useState(false);
  const [usuariosParaCompartir, setUsuariosParaCompartir] = useState<string[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");

  const { data: usuariosDisponibles } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios/lista"],
    enabled: mostrarModalCompartir,
  });

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
    const cantidad = parsearNumeroConComas(monto);
    if (!cantidad || isNaN(cantidad)) return { resultado: 0, tasaUsada: 0, fuente: "internet" };
    
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

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const limpio = valor.replace(/[^0-9.]/g, "");
    setMonto(limpio);
    setMontoDisplay(limpio);
    
    const partes = limpio.split(".");
    if (partes.length > 1) {
      const decimales = partes[1].length;
      setDecimalesActuales(Math.max(2, Math.min(decimales, 4)));
    } else {
      setDecimalesActuales(2);
    }
  };

  const handleMontoBlur = () => {
    const numero = parsearNumeroConComas(monto);
    if (!isNaN(numero)) {
      setMontoDisplay(formatearNumeroConComas(numero, decimalesActuales));
      setMonto(numero.toString());
    }
  };

  const handleMontoFocus = () => {
    const numero = parsearNumeroConComas(monto);
    if (!isNaN(numero)) {
      setMontoDisplay(numero.toString());
    }
  };

  const cambiarModo = (nuevoModo: ModoCalculadora) => {
    if (nuevoModo === "cientifica" && !tieneMembresiaActiva) {
      toast({
        title: "Membresía Requerida",
        description: "La calculadora científica requiere membresía activa.",
        variant: "destructive",
      });
      return;
    }
    setModo(nuevoModo);
  };

  const getTituloModo = () => {
    switch (modo) {
      case "moneda": return "Calculadora de Cambio";
      case "normal": return "Calculadora Normal";
      case "cientifica": return "Calculadora Científica";
    }
  };

  const getIconoModo = () => {
    switch (modo) {
      case "moneda": return <DollarSign className="h-4 w-4 text-rose-400" />;
      case "normal": return <Calculator className="h-4 w-4 text-blue-400" />;
      case "cientifica": return <FlaskConical className="h-4 w-4 text-purple-400" />;
    }
  };

  const evaluarExpresionNormal = useCallback(() => {
    try {
      if (!expresionNormal.trim()) {
        setResultadoNormal("0");
        return;
      }
      const resultado = math.evaluate(expresionNormal);
      const resultadoStr = math.format(resultado, { precision: 10 });
      setResultadoNormal(resultadoStr);
      setHistorialNormal(prev => [...prev.slice(-9), `${expresionNormal} = ${resultadoStr}`]);
    } catch (error) {
      setResultadoNormal("Error");
    }
  }, [expresionNormal]);

  const insertarEnExpresionNormal = useCallback((texto: string) => {
    setExpresionNormal(prev => prev + texto);
  }, []);

  const limpiarTodoNormal = useCallback(() => {
    setExpresionNormal("");
    setResultadoNormal("0");
  }, []);

  const borrarUltimoNormal = useCallback(() => {
    setExpresionNormal(prev => prev.slice(0, -1));
  }, []);

  const limpiarEntradaNormal = useCallback(() => {
    setExpresionNormal("");
  }, []);

  const limpiarHistorialNormal = useCallback(() => {
    setHistorialNormal([]);
  }, []);

  const compartirEjercicioCientifico = useCallback(async () => {
    if (usuariosParaCompartir.length === 0) {
      toast({
        title: "Selecciona usuarios",
        description: "Debes seleccionar al menos un usuario para compartir.",
        variant: "destructive",
      });
      return;
    }

    const ejercicio: EjercicioCompartido = {
      expresion: expresionCientifica,
      resultado: resultadoCientifica,
      modoAngulo,
      historial: historialCientifica,
      fecha: new Date().toISOString(),
    };

    try {
      await apiRequest("POST", "/api/calculadora/compartir", {
        ejercicio,
        destinatarios: usuariosParaCompartir,
      });
      
      toast({
        title: "Ejercicio compartido",
        description: `Se compartió el ejercicio con ${usuariosParaCompartir.length} usuario(s).`,
      });
      
      setMostrarModalCompartir(false);
      setUsuariosParaCompartir([]);
    } catch (error) {
      toast({
        title: "Error al compartir",
        description: "No se pudo compartir el ejercicio. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }, [expresionCientifica, resultadoCientifica, modoAngulo, historialCientifica, usuariosParaCompartir, toast]);

  const toggleUsuarioCompartir = (userId: string) => {
    setUsuariosParaCompartir(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getNombreCompleto = (u: Usuario) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    if (u.firstName) return u.firstName;
    if (u.lastName) return u.lastName;
    return u.email || "Usuario";
  };

  const usuariosFiltrados = useMemo(() => {
    if (!usuariosDisponibles) return [];
    if (!busquedaUsuario.trim()) return usuariosDisponibles.filter(u => u.id !== usuario?.id);
    const busqueda = busquedaUsuario.toLowerCase();
    return usuariosDisponibles.filter(u => 
      u.id !== usuario?.id &&
      (getNombreCompleto(u).toLowerCase().includes(busqueda) || 
       u.email?.toLowerCase().includes(busqueda))
    );
  }, [usuariosDisponibles, busquedaUsuario, usuario?.id]);

  const isLoading = cargandoMonedas || cargandoTasasLocales || cargandoPromedio;

  const descargarExcel = useCallback(() => {
    let datos: (string | number)[][];
    let nombreHoja: string;
    
    if (modo === "moneda") {
      datos = [
        ["Calculadora de Cambio - APO-360"],
        [""],
        ["Tipo de Operación", tipoTasa === "compra" ? "Compra" : "Venta"],
        ["Moneda Origen", monedaOrigen],
        ["Moneda Destino", monedaDestino],
        ["Monto Original", parsearNumeroConComas(monto)],
        ["Tipo de Cambio", calcularCambio.tasaUsada],
        ["Monto Resultante", calcularCambio.resultado],
        ["Fuente de Tasa", calcularCambio.fuente === "local" ? "Cambistas Locales" : "Internet"],
        ["Fecha", new Date().toLocaleString("es-PE")],
      ];
      nombreHoja = "Cambio";
    } else if (modo === "normal") {
      datos = [
        ["Calculadora Normal - APO-360"],
        [""],
        ["Expresión", expresionNormal],
        ["Resultado", resultadoNormal],
        [""],
        ["Historial:"],
        ...historialNormal.map((h, i) => [`${i + 1}. ${h}`]),
        [""],
        ["Fecha", new Date().toLocaleString("es-PE")],
      ];
      nombreHoja = "Normal";
    } else {
      datos = [
        ["Calculadora Científica - APO-360"],
        [""],
        ["Expresión", expresionCientifica],
        ["Resultado", resultadoCientifica],
        ["Modo Ángulo", modoAngulo.toUpperCase()],
        [""],
        ["Historial:"],
        ...historialCientifica.map((h, i) => [`${i + 1}. ${h}`]),
        [""],
        ["Fecha", new Date().toLocaleString("es-PE")],
      ];
      nombreHoja = "Científica";
    }
    
    const ws = XLSX.utils.aoa_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    XLSX.writeFile(wb, `calculadora_${modo}_${Date.now()}.xlsx`);
  }, [modo, tipoTasa, monedaOrigen, monedaDestino, monto, calcularCambio, expresionCientifica, resultadoCientifica, modoAngulo, historialCientifica, expresionNormal, resultadoNormal, historialNormal]);

  const descargarPNG = useCallback(async () => {
    const elemento = document.querySelector('[data-testid="card-calculadora-cambio"], [data-testid="calculadora-cientifica"], [data-testid="calculadora-normal"]');
    if (!elemento) return;
    
    try {
      const canvas = await html2canvas(elemento as HTMLElement, {
        backgroundColor: "#1f2937",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `calculadora_${modo}_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error al generar imagen:", error);
    }
  }, [modo]);

  const headerComponent = mostrarHeader && (
    <div className="border-b border-gray-700/50">
      <div className="flex items-center justify-between p-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={onCerrar}
          className="h-8 w-8 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
          data-testid="button-cerrar"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1">
          {modo !== "moneda" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setModo("moneda")}
              className="h-8 w-8 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
              data-testid="button-regresar-moneda"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => cambiarModo("normal")}
            className={`h-8 w-8 ${modo === "normal" ? "bg-blue-500/20 text-blue-300" : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"}`}
            data-testid="button-calculadora-normal"
            title="Calculadora Normal"
          >
            <Calculator className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => cambiarModo("cientifica")}
            className={`h-8 w-8 relative ${modo === "cientifica" ? "bg-purple-500/20 text-purple-300" : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"}`}
            data-testid="button-calculadora-cientifica"
            title="Calculadora Científica"
          >
            <FlaskConical className="h-5 w-5" />
            {!tieneMembresiaActiva && (
              <Lock className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-yellow-500" />
            )}
          </Button>
        </div>
      </div>
      <div className="px-3 pb-2">
        <h2 className="text-base font-semibold text-gray-100">
          {modo === "moneda" ? "Cambio de Moneda" : getTituloModo()}
        </h2>
        <p className="text-xs text-gray-400">
          {modo === "moneda" 
            ? "Calcula el tipo de cambio entre monedas" 
            : modo === "normal" 
              ? "Operaciones matemáticas básicas"
              : "Funciones matemáticas avanzadas"}
        </p>
      </div>
    </div>
  );

  const calculadoraMoneda = (
    <div className="space-y-5" data-testid="card-calculadora-cambio">
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
              <TrendingUp className="h-3 w-3" /> Cambistas
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Internet
            </span>
          )}
        </Badge>
      </div>
      
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
            <div className="flex-1">
              <Input
                type="text"
                value={montoDisplay}
                onChange={handleMontoChange}
                onBlur={handleMontoBlur}
                onFocus={handleMontoFocus}
                className="text-right text-base font-semibold bg-gray-700/60 border-gray-600/50 text-gray-100 placeholder:text-gray-500 focus:border-rose-500/50 focus:ring-rose-500/20"
                placeholder="0.00"
                data-testid="input-monto-origen"
              />
            </div>
            <Select value={monedaOrigen} onValueChange={setMonedaOrigen}>
              <SelectTrigger 
                className="w-20 bg-gray-700/60 border-gray-600/50 text-gray-100 focus:border-rose-500/50" 
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
                    <span className="font-medium">{m.codigo}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <div className="flex-1">
              <Input
                type="text"
                value={formatearNumeroConComas(calcularCambio.resultado, decimalesActuales)}
                readOnly
                className="text-right text-base font-semibold bg-gray-600/40 border-gray-600/50 text-emerald-300"
                data-testid="input-monto-resultado"
              />
            </div>
            <Select value={monedaDestino} onValueChange={setMonedaDestino}>
              <SelectTrigger 
                className="w-20 bg-gray-700/60 border-gray-600/50 text-gray-100 focus:border-rose-500/50" 
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
                    <span className="font-medium">{m.codigo}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            Comparación de Tasas: Cambistas vs Internet
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-3 rounded-lg border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Promedio Cambistas</span>
              </div>
              {promedioLocal && (promedioLocal.promedioCompra || promedioLocal.promedioVenta) ? (
                <div className="space-y-1">
                  {promedioLocal.promedioCompra && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Compra:</span>
                      <span className="font-bold text-emerald-400">{formatearNumero(promedioLocal.promedioCompra, 4)}</span>
                    </div>
                  )}
                  {promedioLocal.promedioVenta && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Venta:</span>
                      <span className="font-bold text-rose-400">{formatearNumero(promedioLocal.promedioVenta, 4)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Sin datos de cambistas</p>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-3 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Tasa Internet</span>
              </div>
              {(() => {
                const origenInfo = monedas.find(m => m.codigo === monedaOrigen);
                const destinoInfo = monedas.find(m => m.codigo === monedaDestino);
                const tasaInternet = origenInfo && destinoInfo ? origenInfo.tasaUSD / destinoInfo.tasaUSD : null;
                return tasaInternet ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tasa:</span>
                    <span className="font-bold text-blue-400">{formatearNumero(tasaInternet, 4)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No disponible</p>
                );
              })()}
            </div>
          </div>
          
          {tasasLocales && tasasLocales.filter(t => t.monedaOrigenCodigo === monedaOrigen && t.monedaDestinoCodigo === monedaDestino).length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-xs text-gray-400 font-medium">Detalle por cambista:</p>
              {tasasLocales
                .filter(t => t.monedaOrigenCodigo === monedaOrigen && t.monedaDestinoCodigo === monedaDestino)
                .slice(0, 5)
                .map((tasa) => (
                  <div
                    key={tasa.id}
                    className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg text-xs border border-gray-600/20"
                    data-testid={`item-tasa-local-${tasa.id}`}
                  >
                    <span className="text-gray-300">{tasa.ubicacion || "Cambista"}</span>
                    <div className="flex gap-3">
                      <span className="text-emerald-400">C: {formatearNumero(parseFloat(tasa.tasaCompra), 4)}</span>
                      <span className="text-rose-400">V: {formatearNumero(parseFloat(tasa.tasaVenta), 4)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-2">
        {monedas.map((m) => (
          <Button
            key={m.codigo}
            size="icon"
            variant="outline"
            onClick={() => setMonedaOrigen(m.codigo)}
            className={`h-10 w-10 text-xl transition-all ${
              monedaOrigen === m.codigo 
                ? "bg-gradient-to-r from-rose-500 to-pink-500 border-rose-500 hover:from-rose-600 hover:to-pink-600" 
                : "bg-gray-700/50 border-gray-600/50 hover:bg-gray-600/50 hover:border-rose-500/30"
            }`}
            data-testid={`button-moneda-rapida-${m.codigo}`}
            title={m.nombre}
          >
            {m.bandera}
          </Button>
        ))}
      </div>
    </div>
  );

  const evaluarExpresion = useCallback(() => {
    try {
      if (!expresionCientifica.trim()) {
        setResultadoCientifica("0");
        return;
      }
      
      let expr = expresionCientifica;
      
      if (modoAngulo === "deg") {
        expr = expr.replace(/\bsin\(/g, "sin(pi/180*");
        expr = expr.replace(/\bcos\(/g, "cos(pi/180*");
        expr = expr.replace(/\btan\(/g, "tan(pi/180*");
        expr = expr.replace(/\basin\(/g, "(180/pi)*asin(");
        expr = expr.replace(/\bacos\(/g, "(180/pi)*acos(");
        expr = expr.replace(/\batan\(/g, "(180/pi)*atan(");
      }
      
      expr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s*$/g, "($1/100)");
      expr = expr.replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*%/g, "($1*(1+$2/100))");
      expr = expr.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/g, "($1*(1-$2/100))");
      expr = expr.replace(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)\s*%/g, "($1*$2/100)");
      expr = expr.replace(/\(([^)]+)\)\s*%/g, "(($1)/100)");
      
      const resultado = math.evaluate(expr);
      const resultadoStr = typeof resultado === "number" 
        ? math.format(resultado, { precision: 10 })
        : math.typeOf(resultado) === "Complex"
        ? math.format(resultado, { precision: 6 })
        : String(resultado);
      
      setResultadoCientifica(resultadoStr);
      setHistorialCientifica(prev => [...prev.slice(-9), `${expresionCientifica} = ${resultadoStr}`]);
    } catch (error) {
      setResultadoCientifica("Error");
    }
  }, [expresionCientifica, modoAngulo]);

  const insertarEnExpresion = useCallback((texto: string) => {
    setExpresionCientifica(prev => prev + texto);
  }, []);

  const limpiarTodo = useCallback(() => {
    setExpresionCientifica("");
    setResultadoCientifica("0");
  }, []);

  const borrarUltimo = useCallback(() => {
    setExpresionCientifica(prev => prev.slice(0, -1));
  }, []);

  const limpiarEntrada = useCallback(() => {
    setExpresionCientifica("");
  }, []);

  const limpiarHistorial = useCallback(() => {
    setHistorialCientifica([]);
  }, []);

  const botonesNumericos = [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "0", value: "0" },
    { label: ".", value: "." },
    { label: "±", value: "-" },
  ];

  const botonesOperadores = [
    { label: "÷", value: "/" },
    { label: "×", value: "*" },
    { label: "−", value: "-" },
    { label: "+", value: "+" },
    { label: "^", value: "^" },
    { label: "(", value: "(" },
    { label: ")", value: ")" },
    { label: "%", value: "%" },
  ];

  const botonesFunciones = [
    { label: "sin", value: "sin(" },
    { label: "cos", value: "cos(" },
    { label: "tan", value: "tan(" },
    { label: "√", value: "sqrt(" },
    { label: "log", value: "log10(" },
    { label: "ln", value: "log(" },
    { label: "π", value: "pi" },
    { label: "e", value: "e" },
    { label: "x²", value: "^2" },
    { label: "x³", value: "^3" },
    { label: "10ˣ", value: "10^" },
    { label: "eˣ", value: "exp(" },
  ];

  const botonesFuncionesAvanzadas = [
    { label: "asin", value: "asin(" },
    { label: "acos", value: "acos(" },
    { label: "atan", value: "atan(" },
    { label: "sinh", value: "sinh(" },
    { label: "cosh", value: "cosh(" },
    { label: "tanh", value: "tanh(" },
    { label: "abs", value: "abs(" },
    { label: "ceil", value: "ceil(" },
    { label: "floor", value: "floor(" },
    { label: "round", value: "round(" },
    { label: "n!", value: "factorial(" },
    { label: "mod", value: " mod " },
    { label: "nCr", value: "combinations(n,k)" },
    { label: "nPr", value: "permutations(n,k)" },
    { label: "+i", value: "+i*" },
    { label: "Re", value: "re(" },
    { label: "Im", value: "im(" },
    { label: "conj", value: "conj(" },
  ];

  const calculadoraCientifica = (
    <div className="space-y-3" data-testid="calculadora-cientifica">
      {!tieneMembresiaActiva ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="p-4 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <Lock className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100">Membresía Requerida</h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            La calculadora científica está disponible exclusivamente para usuarios con membresía activa.
          </p>
          <Button
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
            data-testid="button-obtener-membresia"
          >
            Obtener Membresía
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={modoAngulo === "deg" ? "default" : "ghost"}
                  onClick={() => setModoAngulo("deg")}
                  className="h-6 text-xs px-2"
                  data-testid="button-modo-deg"
                >
                  DEG
                </Button>
                <Button
                  size="sm"
                  variant={modoAngulo === "rad" ? "default" : "ghost"}
                  onClick={() => setModoAngulo("rad")}
                  className="h-6 text-xs px-2"
                  data-testid="button-modo-rad"
                >
                  RAD
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMostrarFuncionesAvanzadas(!mostrarFuncionesAvanzadas)}
                className="h-6 text-xs px-2 text-purple-400"
                data-testid="button-funciones-avanzadas"
              >
                {mostrarFuncionesAvanzadas ? "Básico" : "Avanzado"}
              </Button>
            </div>
            
            <Input
              type="text"
              value={expresionCientifica}
              onChange={(e) => setExpresionCientifica(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && evaluarExpresion()}
              className="text-lg font-mono bg-gray-900/50 border-gray-600/50 text-gray-100 text-right mb-2"
              placeholder="0"
              data-testid="input-expresion-cientifica"
            />
            <div 
              className="text-right text-2xl font-bold text-emerald-400 min-h-[2rem] break-all" 
              data-testid="resultado-cientifica"
            >
              {resultadoCientifica}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={limpiarTodo}
              className="bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
              data-testid="button-limpiar-todo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={limpiarEntrada}
              className="bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
              data-testid="button-limpiar-entrada"
            >
              CE
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={borrarUltimo}
              className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30"
              data-testid="button-borrar-ultimo"
            >
              <Delete className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={evaluarExpresion}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              data-testid="button-evaluar"
            >
              =
            </Button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {botonesFunciones.map((btn) => (
              <Button
                key={btn.label}
                size="sm"
                variant="outline"
                onClick={() => insertarEnExpresion(btn.value)}
                className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                data-testid={`button-funcion-${btn.label}`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {mostrarFuncionesAvanzadas && (
            <div className="grid grid-cols-6 gap-1">
              {botonesFuncionesAvanzadas.map((btn) => (
                <Button
                  key={btn.label}
                  size="sm"
                  variant="outline"
                  onClick={() => insertarEnExpresion(btn.value)}
                  className="text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                  data-testid={`button-funcion-avanzada-${btn.label}`}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-1">
            <div className="col-span-3 grid grid-cols-3 gap-1">
              {botonesNumericos.map((btn) => (
                <Button
                  key={btn.label}
                  size="sm"
                  variant="outline"
                  onClick={() => insertarEnExpresion(btn.value)}
                  className="text-lg font-semibold bg-gray-700/50 border-gray-600/50 text-gray-100 hover:bg-gray-600/50"
                  data-testid={`button-numero-${btn.label}`}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {botonesOperadores.slice(0, 4).map((btn) => (
                <Button
                  key={btn.label}
                  size="sm"
                  variant="outline"
                  onClick={() => insertarEnExpresion(btn.value)}
                  className="text-lg font-semibold bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
                  data-testid={`button-operador-${btn.label}`}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {botonesOperadores.slice(4).map((btn) => (
              <Button
                key={btn.label}
                size="sm"
                variant="outline"
                onClick={() => insertarEnExpresion(btn.value)}
                className="text-sm bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                data-testid={`button-operador-${btn.label}`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {historialCientifica.length > 0 && (
            <div className="bg-gray-800/40 rounded-lg p-2 border border-gray-700/30 max-h-24 overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Historial:</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={limpiarHistorial}
                  className="h-5 text-xs px-1 text-gray-500 hover:text-rose-400"
                  data-testid="button-limpiar-historial"
                >
                  Limpiar
                </Button>
              </div>
              {historialCientifica.slice().reverse().map((item, idx) => (
                <div 
                  key={idx} 
                  className="text-xs text-gray-400 font-mono truncate"
                  data-testid={`historial-item-${idx}`}
                >
                  {item}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-2 pt-3 border-t border-gray-700/30">
            <Button
              size="sm"
              variant="outline"
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              data-testid="button-descargar-excel-cientifica"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={descargarPNG}
              className="flex items-center gap-2 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
              data-testid="button-descargar-png-cientifica"
            >
              <Image className="h-4 w-4" />
              Imagen
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMostrarModalCompartir(true)}
              className="flex items-center gap-2 bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
              data-testid="button-compartir-cientifica"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const calculadoraNormal = (
    <div className="space-y-3" data-testid="calculadora-normal">
      <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
        <Input
          type="text"
          value={expresionNormal}
          onChange={(e) => setExpresionNormal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && evaluarExpresionNormal()}
          className="text-lg font-mono bg-gray-900/50 border-gray-600/50 text-gray-100 text-right mb-2"
          placeholder="0"
          data-testid="input-expresion-normal"
        />
        <div 
          className="text-right text-2xl font-bold text-emerald-400 min-h-[2rem] break-all" 
          data-testid="resultado-normal"
        >
          {resultadoNormal}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={limpiarTodoNormal}
          className="bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30"
          data-testid="button-limpiar-todo-normal"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={limpiarEntradaNormal}
          className="bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
          data-testid="button-limpiar-entrada-normal"
        >
          CE
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={borrarUltimoNormal}
          className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30"
          data-testid="button-borrar-ultimo-normal"
        >
          <Delete className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={evaluarExpresionNormal}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
          data-testid="button-evaluar-normal"
        >
          =
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <div className="col-span-3 grid grid-cols-3 gap-1">
          {botonesNumericos.map((btn) => (
            <Button
              key={btn.label}
              size="sm"
              variant="outline"
              onClick={() => insertarEnExpresionNormal(btn.value)}
              className="text-lg font-semibold bg-gray-700/50 border-gray-600/50 text-gray-100 hover:bg-gray-600/50"
              data-testid={`button-numero-normal-${btn.label}`}
            >
              {btn.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-1">
          {botonesOperadores.slice(0, 4).map((btn) => (
            <Button
              key={btn.label}
              size="sm"
              variant="outline"
              onClick={() => insertarEnExpresionNormal(btn.value)}
              className="text-lg font-semibold bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              data-testid={`button-operador-normal-${btn.label}`}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {botonesOperadores.slice(4).map((btn) => (
          <Button
            key={btn.label}
            size="sm"
            variant="outline"
            onClick={() => insertarEnExpresionNormal(btn.value)}
            className="text-sm bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
            data-testid={`button-operador-normal-${btn.label}`}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {historialNormal.length > 0 && (
        <div className="bg-gray-800/40 rounded-lg p-2 border border-gray-700/30 max-h-24 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Historial:</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={limpiarHistorialNormal}
              className="h-5 text-xs px-1 text-gray-500 hover:text-rose-400"
              data-testid="button-limpiar-historial-normal"
            >
              Limpiar
            </Button>
          </div>
          {historialNormal.slice().reverse().map((item, idx) => (
            <div 
              key={idx} 
              className="text-xs text-gray-400 font-mono truncate"
              data-testid={`historial-normal-item-${idx}`}
            >
              {item}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2 pt-3 border-t border-gray-700/30">
        <Button
          size="sm"
          variant="outline"
          onClick={descargarExcel}
          className="flex items-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          data-testid="button-descargar-excel-normal"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Excel
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={descargarPNG}
          className="flex items-center gap-2 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          data-testid="button-descargar-png-normal"
        >
          <Image className="h-4 w-4" />
          Imagen
        </Button>
      </div>
    </div>
  );

  const getCalculadoraActual = () => {
    switch (modo) {
      case "moneda": return calculadoraMoneda;
      case "normal": return calculadoraNormal;
      case "cientifica": return calculadoraCientifica;
    }
  };

  const modalCompartir = (
    <Dialog open={mostrarModalCompartir} onOpenChange={setMostrarModalCompartir}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-300">
            <Share2 className="h-5 w-5" />
            Compartir Ejercicio
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecciona los usuarios con quienes deseas compartir tu ejercicio de calculadora científica.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
            <p className="text-xs text-gray-500 mb-1">Ejercicio a compartir:</p>
            <p className="text-sm font-mono text-purple-300">{expresionCientifica || "(vacío)"}</p>
            <p className="text-lg font-bold text-emerald-400">= {resultadoCientifica}</p>
          </div>

          <div>
            <Input
              type="text"
              placeholder="Buscar usuario..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
              data-testid="input-buscar-usuario"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {usuariosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay usuarios disponibles
              </p>
            ) : (
              usuariosFiltrados.map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleUsuarioCompartir(u.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    usuariosParaCompartir.includes(u.id)
                      ? "bg-purple-500/20 border border-purple-500/50"
                      : "bg-gray-800/40 border border-transparent hover:bg-gray-700/50"
                  }`}
                  data-testid={`usuario-compartir-${u.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {getNombreCompleto(u)}
                      </p>
                      {u.email && (
                        <p className="text-xs text-gray-500">{u.email}</p>
                      )}
                    </div>
                  </div>
                  {usuariosParaCompartir.includes(u.id) && (
                    <Check className="h-4 w-4 text-purple-400" />
                  )}
                </div>
              ))
            )}
          </div>

          {usuariosParaCompartir.length > 0 && (
            <p className="text-xs text-purple-400">
              {usuariosParaCompartir.length} usuario(s) seleccionado(s)
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setMostrarModalCompartir(false);
                setUsuariosParaCompartir([]);
                setBusquedaUsuario("");
              }}
              className="text-gray-400"
              data-testid="button-cancelar-compartir"
            >
              Cancelar
            </Button>
            <Button
              onClick={compartirEjercicioCientifico}
              disabled={usuariosParaCompartir.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              data-testid="button-enviar-compartir"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const contenidoPrincipal = (
    <div className="flex flex-col h-full">
      {headerComponent}
      <div className="flex-1 overflow-auto p-4">
        {getCalculadoraActual()}
      </div>
      {modalCompartir}
    </div>
  );

  if (sinCard) {
    return contenidoPrincipal;
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border-gray-700/50 shadow-xl shadow-black/20 overflow-hidden md:h-auto h-full md:rounded-lg rounded-none md:border border-0">
      {contenidoPrincipal}
    </Card>
  );
}
