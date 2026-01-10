import { useState } from "react";
import { useGeoFilter } from "@/contexts/GeoFilterContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, ChevronDown, Globe, Navigation } from "lucide-react";

const CODIGOS_PAISES: Record<string, string> = {
  "peru": "PE",
  "perú": "PE",
  "chile": "CL",
  "argentina": "AR",
  "bolivia": "BO",
  "colombia": "CO",
  "ecuador": "EC",
  "brasil": "BR",
  "mexico": "MX",
  "méxico": "MX",
  "venezuela": "VE",
  "uruguay": "UY",
  "paraguay": "PY",
  "estados unidos": "US",
  "españa": "ES",
};

const obtenerCodigo = (nombrePais: string): string => {
  const nombre = nombrePais.toLowerCase();
  return CODIGOS_PAISES[nombre] || "GL";
};

interface SelectorUbicacionHeaderProps {
  variante?: "desktop" | "mobile";
  className?: string;
}

export default function SelectorUbicacionHeader({ 
  variante = "desktop",
  className = "" 
}: SelectorUbicacionHeaderProps) {
  const {
    filtros,
    setPaisId,
    setCiudadId,
    paises,
    ciudadesFiltradas,
    cargandoPaises,
    cargandoCiudades,
    paisSeleccionado,
    ciudadSeleccionada,
  } = useGeoFilter();

  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const paisesActivos = paises.filter(p => p.activo);

  if (variante === "mobile") {
    return (
      <div className={`space-y-3 ${className}`} data-testid="selector-ubicacion-mobile">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>Ubicación Activa</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!filtros.paisId ? "default" : "ghost"}
            size="sm"
            className="h-9 px-3 gap-1"
            onClick={() => setPaisId(null)}
            title="Todos los países"
            data-testid="button-pais-todos-mobile"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs">Todos</span>
          </Button>
          {paisesActivos.map((pais) => (
            <Button
              key={pais.id}
              variant={filtros.paisId === pais.id ? "default" : "ghost"}
              size="sm"
              className="h-9 px-3 gap-1"
              onClick={() => setPaisId(pais.id)}
              title={pais.nombre}
              data-testid={`button-pais-${pais.id}-mobile`}
            >
              <span className="text-xs font-bold">{obtenerCodigo(pais.nombre)}</span>
              <span className="text-xs">{pais.nombre}</span>
            </Button>
          ))}
        </div>

        {filtros.paisId && (
          <Select
            value={filtros.ciudadId || "todas"}
            onValueChange={(value) => setCiudadId(value === "todas" ? null : value)}
            disabled={cargandoCiudades}
          >
            <SelectTrigger className="w-full h-9" data-testid="select-ciudad-mobile">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Seleccionar ciudad" />
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
        )}
      </div>
    );
  }

  const ciudadMostrar = ciudadSeleccionada?.nombre || "Tacna";

  return (
    <Popover open={popoverAbierto} onOpenChange={setPopoverAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-white hover:bg-white/20 gap-1.5 px-2 h-8 ${className}`}
          disabled={cargandoPaises}
          data-testid="button-ubicacion-header"
        >
          <Navigation className="h-4 w-4 text-green-400" />
          <span className="text-xs font-medium">
            {ciudadMostrar}
          </span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end" data-testid="popover-ubicacion">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Filtrar por Ubicación</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={!filtros.paisId ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2 gap-1"
              onClick={() => {
                setPaisId(null);
              }}
              title="Todos los países"
              data-testid="button-pais-todos"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs">Global</span>
            </Button>
            {paisesActivos.map((pais) => (
              <Button
                key={pais.id}
                variant={filtros.paisId === pais.id ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => {
                  setPaisId(pais.id);
                }}
                title={pais.nombre}
                data-testid={`button-pais-${pais.id}`}
              >
                <span className="text-xs font-bold">{obtenerCodigo(pais.nombre)}</span>
              </Button>
            ))}
          </div>

          {filtros.paisId && (
            <Select
              value={filtros.ciudadId || "todas"}
              onValueChange={(value) => {
                setCiudadId(value === "todas" ? null : value);
              }}
              disabled={cargandoCiudades}
            >
              <SelectTrigger className="w-full h-9" data-testid="select-ciudad-header">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleccionar ciudad" />
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
          )}

          <p className="text-xs text-muted-foreground">
            Filtra publicidad, eventos, encuestas y noticias por ubicación
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
