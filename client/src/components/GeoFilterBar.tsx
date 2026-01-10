import { useState, useEffect } from "react";
import { useGeoFilter } from "@/contexts/GeoFilterContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, MapPin, X, ArrowUpDown } from "lucide-react";

interface GeoFilterBarProps {
  mostrarBusqueda?: boolean;
  mostrarOrdenamiento?: boolean;
  placeholderBusqueda?: string;
  className?: string;
}

const BANDERAS_PAISES: Record<string, string> = {
  "peru": "🇵🇪",
  "perú": "🇵🇪",
  "chile": "🇨🇱",
  "argentina": "🇦🇷",
  "bolivia": "🇧🇴",
  "colombia": "🇨🇴",
  "ecuador": "🇪🇨",
  "brasil": "🇧🇷",
  "mexico": "🇲🇽",
  "méxico": "🇲🇽",
  "venezuela": "🇻🇪",
  "uruguay": "🇺🇾",
  "paraguay": "🇵🇾",
  "estados unidos": "🇺🇸",
  "españa": "🇪🇸",
};

const obtenerBandera = (nombrePais: string): string => {
  const nombre = nombrePais.toLowerCase();
  return BANDERAS_PAISES[nombre] || "🌍";
};

export default function GeoFilterBar({
  mostrarBusqueda = true,
  mostrarOrdenamiento = true,
  placeholderBusqueda = "Buscar...",
  className = "",
}: GeoFilterBarProps) {
  const {
    filtros,
    setPaisId,
    setCiudadId,
    setBusqueda,
    setOrdenamiento,
    paises,
    ciudadesFiltradas,
    cargandoPaises,
    cargandoCiudades,
    paisSeleccionado,
  } = useGeoFilter();

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda);
  const [popoverPaisAbierto, setPopoverPaisAbierto] = useState(false);

  useEffect(() => {
    setBusquedaLocal(filtros.busqueda);
  }, [filtros.busqueda]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaLocal);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaLocal, setBusqueda]);

  const opcionesOrdenamiento = [
    { valor: "reciente", etiqueta: "Recientes", icono: "🕐" },
    { valor: "antiguo", etiqueta: "Antiguos", icono: "📅" },
    { valor: "masLikes", etiqueta: "Más likes", icono: "❤️" },
    { valor: "masCompartidos", etiqueta: "Compartidos", icono: "🔗" },
    { valor: "masFavoritos", etiqueta: "Favoritos", icono: "⭐" },
    { valor: "masVistas", etiqueta: "Más vistos", icono: "👁️" },
  ];

  const ordenActual = opcionesOrdenamiento.find(o => o.valor === filtros.ordenamiento);
  const paisesActivos = paises.filter(p => p.activo);

  return (
    <div className={`${className}`} data-testid="geo-filter-bar">
      {/* Layout Desktop/Tablet - Una sola línea */}
      <div className="hidden sm:flex items-center gap-2 w-full">
        {/* Búsqueda - 50% del ancho */}
        {mostrarBusqueda && (
          <div className="relative flex-1 max-w-[50%]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholderBusqueda}
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              className="pl-8 pr-8 h-9 text-sm"
              data-testid="input-busqueda"
            />
            {busquedaLocal && (
              <button
                onClick={() => {
                  setBusquedaLocal("");
                  setBusqueda("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-limpiar-busqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Selector de País con Banderas */}
        <Popover open={popoverPaisAbierto} onOpenChange={setPopoverPaisAbierto}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2 gap-1 min-w-fit"
              disabled={cargandoPaises}
              data-testid="button-pais"
            >
              <span className="text-lg leading-none">
                {paisSeleccionado ? obtenerBandera(paisSeleccionado.nombre) : "🌍"}
              </span>
              <span className="text-xs hidden md:inline">
                {paisSeleccionado?.nombre || "País"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
              <Button
                variant={!filtros.paisId ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 text-lg"
                onClick={() => {
                  setPaisId(null);
                  setPopoverPaisAbierto(false);
                }}
                title="Todos los países"
              >
                🌍
              </Button>
              {paisesActivos.map((pais) => (
                <Button
                  key={pais.id}
                  variant={filtros.paisId === pais.id ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2 text-lg"
                  onClick={() => {
                    setPaisId(pais.id);
                    setPopoverPaisAbierto(false);
                  }}
                  title={pais.nombre}
                >
                  {obtenerBandera(pais.nombre)}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Selector de Ciudad */}
        <Select
          value={filtros.ciudadId || "todas"}
          onValueChange={(value) => setCiudadId(value === "todas" ? null : value)}
          disabled={cargandoCiudades || !filtros.paisId}
        >
          <SelectTrigger className="h-9 w-auto min-w-[100px] max-w-[140px] text-xs" data-testid="select-ciudad">
            <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {ciudadesFiltradas.map((ciudad) => (
              <SelectItem key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de Ordenamiento */}
        {mostrarOrdenamiento && (
          <Select
            value={filtros.ordenamiento}
            onValueChange={(value) => setOrdenamiento(value as any)}
          >
            <SelectTrigger className="h-9 w-auto min-w-[100px] max-w-[130px] text-xs" data-testid="select-ordenamiento">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1 shrink-0" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {opcionesOrdenamiento.map((opcion) => (
                <SelectItem key={opcion.valor} value={opcion.valor}>
                  <span className="flex items-center gap-1.5">
                    <span>{opcion.icono}</span>
                    <span>{opcion.etiqueta}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Layout Móvil - Una sola línea con iconos */}
      <div className="flex sm:hidden items-center gap-1.5 w-full">
        {/* Botón País (icono bandera) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={cargandoPaises}
              data-testid="button-pais-mobile"
            >
              <span className="text-lg">
                {paisSeleccionado ? obtenerBandera(paisSeleccionado.nombre) : "🌍"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
              <Button
                variant={!filtros.paisId ? "default" : "ghost"}
                size="sm"
                className="h-9 w-9 p-0 text-lg"
                onClick={() => setPaisId(null)}
                title="Todos"
              >
                🌍
              </Button>
              {paisesActivos.map((pais) => (
                <Button
                  key={pais.id}
                  variant={filtros.paisId === pais.id ? "default" : "ghost"}
                  size="sm"
                  className="h-9 w-9 p-0 text-lg"
                  onClick={() => setPaisId(pais.id)}
                  title={pais.nombre}
                >
                  {obtenerBandera(pais.nombre)}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Botón Ciudad (icono) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={cargandoCiudades || !filtros.paisId}
              data-testid="button-ciudad-mobile"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              <Button
                variant={!filtros.ciudadId ? "default" : "ghost"}
                size="sm"
                className="h-8 justify-start text-xs"
                onClick={() => setCiudadId(null)}
              >
                Todas las ciudades
              </Button>
              {ciudadesFiltradas.map((ciudad) => (
                <Button
                  key={ciudad.id}
                  variant={filtros.ciudadId === ciudad.id ? "default" : "ghost"}
                  size="sm"
                  className="h-8 justify-start text-xs"
                  onClick={() => setCiudadId(ciudad.id)}
                >
                  {ciudad.nombre}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Botón Ordenamiento (icono) */}
        {mostrarOrdenamiento && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                data-testid="button-orden-mobile"
              >
                <span className="text-sm">{ordenActual?.icono || "🕐"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex flex-col gap-1">
                {opcionesOrdenamiento.map((opcion) => (
                  <Button
                    key={opcion.valor}
                    variant={filtros.ordenamiento === opcion.valor ? "default" : "ghost"}
                    size="sm"
                    className="h-8 justify-start text-xs gap-2"
                    onClick={() => setOrdenamiento(opcion.valor as any)}
                  >
                    <span>{opcion.icono}</span>
                    <span>{opcion.etiqueta}</span>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Búsqueda - Ocupa el resto del espacio */}
        {mostrarBusqueda && (
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholderBusqueda}
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              className="pl-7 pr-7 h-9 text-xs"
              data-testid="input-busqueda-mobile"
            />
            {busquedaLocal && (
              <button
                onClick={() => {
                  setBusquedaLocal("");
                  setBusqueda("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-limpiar-busqueda-mobile"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
