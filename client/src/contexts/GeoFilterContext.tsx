import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface Pais {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

interface Ciudad {
  id: string;
  paisId: string;
  nombre: string;
  codigoPostal: string | null;
  activo: boolean;
}

type TipoOrdenamiento = "reciente" | "antiguo" | "masLikes" | "masCompartidos" | "masFavoritos" | "masVistas";

interface GeoFilterState {
  paisId: string | null;
  ciudadId: string | null;
  busqueda: string;
  ordenamiento: TipoOrdenamiento;
}

interface GeoFilterContextValue {
  filtros: GeoFilterState;
  setPaisId: (paisId: string | null) => void;
  setCiudadId: (ciudadId: string | null) => void;
  setBusqueda: (busqueda: string) => void;
  setOrdenamiento: (ordenamiento: TipoOrdenamiento) => void;
  limpiarFiltros: () => void;
  paises: Pais[];
  ciudades: Ciudad[];
  ciudadesFiltradas: Ciudad[];
  cargandoPaises: boolean;
  cargandoCiudades: boolean;
  paisSeleccionado: Pais | null;
  ciudadSeleccionada: Ciudad | null;
  tieneFilrosActivos: boolean;
  queryParams: string;
}

const GeoFilterContext = createContext<GeoFilterContextValue | null>(null);

const ESTADO_INICIAL: GeoFilterState = {
  paisId: null,
  ciudadId: null,
  busqueda: "",
  ordenamiento: "reciente",
};

export function GeoFilterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState<GeoFilterState>(ESTADO_INICIAL);

  const { data: paises = [], isLoading: cargandoPaises } = useQuery<Pais[]>({
    queryKey: ["/api/paises"],
  });

  const { data: ciudades = [], isLoading: cargandoCiudades } = useQuery<Ciudad[]>({
    queryKey: ["/api/ciudades"],
  });

  useEffect(() => {
    if (user && user.paisIdActual && !filtros.paisId) {
      setFiltros(prev => ({
        ...prev,
        paisId: user.paisIdActual || null,
        ciudadId: user.ciudadIdActual || null,
      }));
    }
  }, [user, filtros.paisId]);

  const ciudadesFiltradas = filtros.paisId 
    ? ciudades.filter(c => c.paisId === filtros.paisId && c.activo)
    : ciudades.filter(c => c.activo);

  const paisSeleccionado = paises.find(p => p.id === filtros.paisId) || null;
  const ciudadSeleccionada = ciudades.find(c => c.id === filtros.ciudadId) || null;

  const setPaisId = useCallback((paisId: string | null) => {
    setFiltros(prev => ({
      ...prev,
      paisId,
      ciudadId: null,
    }));
  }, []);

  const setCiudadId = useCallback((ciudadId: string | null) => {
    setFiltros(prev => ({
      ...prev,
      ciudadId,
    }));
  }, []);

  const setBusqueda = useCallback((busqueda: string) => {
    setFiltros(prev => ({
      ...prev,
      busqueda,
    }));
  }, []);

  const setOrdenamiento = useCallback((ordenamiento: TipoOrdenamiento) => {
    setFiltros(prev => ({
      ...prev,
      ordenamiento,
    }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltros(ESTADO_INICIAL);
  }, []);

  const tieneFilrosActivos = Boolean(
    filtros.paisId || 
    filtros.ciudadId || 
    filtros.busqueda || 
    filtros.ordenamiento !== "reciente"
  );

  const queryParams = [
    filtros.paisId && `paisId=${filtros.paisId}`,
    filtros.ciudadId && `ciudadId=${filtros.ciudadId}`,
    filtros.busqueda && `busqueda=${encodeURIComponent(filtros.busqueda)}`,
    filtros.ordenamiento && `orden=${filtros.ordenamiento}`,
  ].filter(Boolean).join("&");

  return (
    <GeoFilterContext.Provider
      value={{
        filtros,
        setPaisId,
        setCiudadId,
        setBusqueda,
        setOrdenamiento,
        limpiarFiltros,
        paises,
        ciudades,
        ciudadesFiltradas,
        cargandoPaises,
        cargandoCiudades,
        paisSeleccionado,
        ciudadSeleccionada,
        tieneFilrosActivos,
        queryParams,
      }}
    >
      {children}
    </GeoFilterContext.Provider>
  );
}

export function useGeoFilter() {
  const context = useContext(GeoFilterContext);
  if (!context) {
    throw new Error("useGeoFilter debe usarse dentro de GeoFilterProvider");
  }
  return context;
}
