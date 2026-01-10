import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Globe, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";

interface GeoFilterBarProps {
  mostrarBusqueda?: boolean;
  mostrarOrdenamiento?: boolean;
  placeholderBusqueda?: string;
  className?: string;
}

export default function GeoFilterBar({
  mostrarBusqueda = true,
  mostrarOrdenamiento = true,
  placeholderBusqueda = "Buscar por nombre de local o producto...",
  className = "",
}: GeoFilterBarProps) {
  const {
    filtros,
    setPaisId,
    setCiudadId,
    setBusqueda,
    setOrdenamiento,
    limpiarFiltros,
    paises,
    ciudadesFiltradas,
    cargandoPaises,
    cargandoCiudades,
    paisSeleccionado,
    ciudadSeleccionada,
    tieneFilrosActivos,
  } = useGeoFilter();

  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda);

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
    { valor: "reciente", etiqueta: "Más recientes" },
    { valor: "antiguo", etiqueta: "Más antiguos" },
    { valor: "masLikes", etiqueta: "Más me gusta" },
    { valor: "masCompartidos", etiqueta: "Más compartidos" },
    { valor: "masFavoritos", etiqueta: "Más favoritos" },
    { valor: "masVistas", etiqueta: "Más vistos" },
  ];

  return (
    <div className={`bg-card border rounded-lg p-4 shadow-sm ${className}`} data-testid="geo-filter-bar">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={filtros.paisId || "todos"}
              onValueChange={(value) => setPaisId(value === "todos" ? null : value)}
              disabled={cargandoPaises}
            >
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-pais">
                <SelectValue placeholder="Todos los países" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los países</SelectItem>
                {paises.filter(p => p.activo).map((pais) => (
                  <SelectItem key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={filtros.ciudadId || "todas"}
              onValueChange={(value) => setCiudadId(value === "todas" ? null : value)}
              disabled={cargandoCiudades || !filtros.paisId}
            >
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-ciudad">
                <SelectValue placeholder={filtros.paisId ? "Todas las ciudades" : "Selecciona un país"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las ciudades</SelectItem>
                {ciudadesFiltradas.map((ciudad) => (
                  <SelectItem key={ciudad.id} value={ciudad.id}>
                    {ciudad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mostrarOrdenamiento && (
            <div className="flex items-center gap-2 flex-1">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={filtros.ordenamiento}
                onValueChange={(value) => setOrdenamiento(value as any)}
              >
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-ordenamiento">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {opcionesOrdenamiento.map((opcion) => (
                    <SelectItem key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {mostrarBusqueda && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholderBusqueda}
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              className="pl-10 pr-10"
              data-testid="input-busqueda"
            />
            {busquedaLocal && (
              <button
                onClick={() => {
                  setBusquedaLocal("");
                  setBusqueda("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-limpiar-busqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {tieneFilrosActivos && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {paisSeleccionado && (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                {paisSeleccionado.nombre}
              </Badge>
            )}
            {ciudadSeleccionada && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {ciudadSeleccionada.nombre}
              </Badge>
            )}
            {filtros.busqueda && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                "{filtros.busqueda}"
              </Badge>
            )}
            {filtros.ordenamiento !== "reciente" && (
              <Badge variant="secondary" className="gap-1">
                <ArrowUpDown className="h-3 w-3" />
                {opcionesOrdenamiento.find(o => o.valor === filtros.ordenamiento)?.etiqueta}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarFiltros}
              className="h-6 px-2 text-xs"
              data-testid="button-limpiar-filtros"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar todo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
