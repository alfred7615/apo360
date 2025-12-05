import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface RadioOnline {
  id: number | string;
  nombre: string;
  url: string;
  iframeCode?: string;
  logoUrl?: string;
  orden: number;
  esPredeterminada: boolean;
  estado: string;
}

interface ListaMp3 {
  id: number;
  nombre: string;
  descripcion?: string;
  rutaCarpeta?: string;
  imagenUrl?: string;
  genero?: string;
  orden: number;
  estado: string;
}

interface ArchivoMp3 {
  id: number;
  listaId?: number;
  titulo: string;
  artista?: string;
  archivoUrl: string;
  duracion?: number;
  orden: number;
  estado: string;
}

type TipoFuente = "radio" | "lista";

interface AudioControllerState {
  tipoFuente: TipoFuente;
  radioSeleccionadaId: number | string | null;
  listaSeleccionadaId: number | null;
  pistaActual: number;
  reproduciendo: boolean;
  volumen: number;
  silenciado: boolean;
  radiosActivas: RadioOnline[];
  listasActivas: ListaMp3[];
  archivosDeLista: ArchivoMp3[];
  radioActual: RadioOnline | null;
  listaActual: ListaMp3 | null;
  archivoActual: ArchivoMp3 | null;
  tituloActual: string;
  artistaActual: string | null;
  urlActual: string | null;
  usandoIframe: boolean;
  iframeCode: string | null;
}

interface AudioControllerActions {
  seleccionarRadio: (radioId: number | string) => void;
  seleccionarLista: (listaId: number) => void;
  reproducir: () => void;
  pausar: () => void;
  alternarReproduccion: () => void;
  siguientePista: () => void;
  anteriorPista: () => void;
  setVolumen: (volumen: number) => void;
  toggleSilencio: () => void;
  cambiarTipoFuente: (tipo: TipoFuente) => void;
}

interface AudioControllerContextValue extends AudioControllerState, AudioControllerActions {
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioControllerContext = createContext<AudioControllerContextValue | null>(null);

const AUDIO_PLAYER_ID = "apo-360-global-audio-player";
const STORAGE_KEY = "apo-360-audio-state";

function getStoredState(): Partial<{
  volumen: number;
  silenciado: boolean;
  tipoFuente: TipoFuente;
  radioSeleccionadaId: number | string | null;
  listaSeleccionadaId: number | null;
}> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error leyendo estado de audio:", e);
  }
  return {};
}

export function AudioControllerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const inicializadoRef = useRef(false);
  const storedState = getStoredState();
  
  const [tipoFuente, setTipoFuente] = useState<TipoFuente>(storedState.tipoFuente || "radio");
  const [radioSeleccionadaId, setRadioSeleccionadaId] = useState<number | string | null>(storedState.radioSeleccionadaId || null);
  const [listaSeleccionadaId, setListaSeleccionadaId] = useState<number | null>(storedState.listaSeleccionadaId || null);
  const [pistaActual, setPistaActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [volumen, setVolumenState] = useState(storedState.volumen || 70);
  const [silenciado, setSilenciado] = useState(storedState.silenciado || false);
  const [autoReproducir, setAutoReproducir] = useState(false);
  const [primeraVez, setPrimeraVez] = useState(true);

  const { data: radios = [] } = useQuery<RadioOnline[]>({
    queryKey: ["/api/radios-online"],
  });

  const { data: listas = [] } = useQuery<ListaMp3[]>({
    queryKey: ["/api/listas-mp3"],
  });

  const { data: todosArchivos = [] } = useQuery<ArchivoMp3[]>({
    queryKey: ["/api/archivos-mp3"],
  });

  const radiosActivas = radios.filter((r) => r.estado === "activo").sort((a, b) => a.orden - b.orden);
  const listasActivas = listas.filter((l) => l.estado === "activo").sort((a, b) => a.orden - b.orden);

  const radioActual = radiosActivas.find((r) => r.id === radioSeleccionadaId) || null;
  const listaActual = listasActivas.find((l) => l.id === listaSeleccionadaId) || null;

  const archivosDeLista = listaSeleccionadaId
    ? todosArchivos.filter((m) => m.listaId === listaSeleccionadaId && m.estado === "activo").sort((a, b) => a.orden - b.orden)
    : [];

  const archivoActual = archivosDeLista[pistaActual] || null;

  const urlActual = tipoFuente === "radio" ? radioActual?.url || null : archivoActual?.archivoUrl || null;
  const tituloActual = tipoFuente === "radio" ? radioActual?.nombre || "" : archivoActual?.titulo || "";
  const artistaActual = tipoFuente === "lista" ? archivoActual?.artista || null : null;

  useEffect(() => {
    if (radiosActivas.length > 0 && radioSeleccionadaId === null) {
      const predeterminada = radiosActivas.find((r) => r.esPredeterminada);
      const tacnaFm = radiosActivas.find((r) => 
        r.nombre.toLowerCase().includes("tacnafm") || 
        r.nombre.toLowerCase().includes("tacna fm") ||
        r.nombre.toLowerCase().includes("tacna")
      );
      const radioInicial = predeterminada?.id || tacnaFm?.id || radiosActivas[0].id;
      setRadioSeleccionadaId(radioInicial);
      
      if (primeraVez && !inicializadoRef.current) {
        inicializadoRef.current = true;
        setPrimeraVez(false);
        setAutoReproducir(true);
      }
    }
  }, [radiosActivas, radioSeleccionadaId, primeraVez]);

  useEffect(() => {
    if (listasActivas.length > 0 && listaSeleccionadaId === null) {
      setListaSeleccionadaId(listasActivas[0].id);
    }
  }, [listasActivas, listaSeleccionadaId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = silenciado ? 0 : volumen / 100;
    }
  }, [volumen, silenciado]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        volumen,
        silenciado,
        tipoFuente,
        radioSeleccionadaId,
        listaSeleccionadaId,
      }));
    } catch (e) {
      console.error("Error guardando estado de audio:", e);
    }
  }, [volumen, silenciado, tipoFuente, radioSeleccionadaId, listaSeleccionadaId]);

  useEffect(() => {
    if (autoReproducir && urlActual && audioRef.current) {
      const audio = audioRef.current;
      audio.src = urlActual;
      audio.load();
      audio.play()
        .then(() => {
          setReproduciendo(true);
          setAutoReproducir(false);
        })
        .catch((error) => {
          setAutoReproducir(false);
          setReproduciendo(false);
        });
    }
  }, [autoReproducir, urlActual]);

  const pausarOtrosAudios = useCallback(() => {
    const allAudios = document.querySelectorAll("audio");
    allAudios.forEach((audio) => {
      if (audio.id !== AUDIO_PLAYER_ID && !audio.paused) {
        audio.pause();
      }
    });
  }, []);

  const reproducir = useCallback(() => {
    if (!audioRef.current || !urlActual) return;
    pausarOtrosAudios();
    audioRef.current.play()
      .then(() => setReproduciendo(true))
      .catch((error) => console.error("Error al reproducir:", error));
  }, [urlActual, pausarOtrosAudios]);

  const pausar = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setReproduciendo(false);
  }, []);

  const alternarReproduccion = useCallback(() => {
    if (reproduciendo) {
      pausar();
    } else {
      reproducir();
    }
  }, [reproduciendo, pausar, reproducir]);

  const seleccionarRadio = useCallback((radioId: number | string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTipoFuente("radio");
    setRadioSeleccionadaId(radioId);
    setReproduciendo(false);
    setAutoReproducir(true);
  }, []);

  const seleccionarLista = useCallback((listaId: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTipoFuente("lista");
    setListaSeleccionadaId(listaId);
    setPistaActual(0);
    setReproduciendo(false);
    setAutoReproducir(true);
  }, []);

  const siguientePista = useCallback(() => {
    if (archivosDeLista.length === 0) return;
    setPistaActual((prev) => (prev + 1) % archivosDeLista.length);
    setAutoReproducir(true);
  }, [archivosDeLista.length]);

  const anteriorPista = useCallback(() => {
    if (archivosDeLista.length === 0) return;
    setPistaActual((prev) => (prev === 0 ? archivosDeLista.length - 1 : prev - 1));
    setAutoReproducir(true);
  }, [archivosDeLista.length]);

  const setVolumen = useCallback((v: number) => {
    setVolumenState(v);
  }, []);

  const toggleSilencio = useCallback(() => {
    setSilenciado((prev) => !prev);
  }, []);

  const cambiarTipoFuente = useCallback((tipo: TipoFuente) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTipoFuente(tipo);
    setReproduciendo(false);
  }, []);

  const usandoIframe = tipoFuente === "radio" && !!radioActual?.iframeCode;
  const iframeCode = usandoIframe ? radioActual?.iframeCode || null : null;

  const value: AudioControllerContextValue = {
    tipoFuente,
    radioSeleccionadaId,
    listaSeleccionadaId,
    pistaActual,
    reproduciendo,
    volumen,
    silenciado,
    radiosActivas,
    listasActivas,
    archivosDeLista,
    radioActual,
    listaActual,
    archivoActual,
    tituloActual,
    artistaActual,
    urlActual,
    usandoIframe,
    iframeCode,
    audioRef,
    seleccionarRadio,
    seleccionarLista,
    reproducir,
    pausar,
    alternarReproduccion,
    siguientePista,
    anteriorPista,
    setVolumen,
    toggleSilencio,
    cambiarTipoFuente,
  };

  return (
    <AudioControllerContext.Provider value={value}>
      {children}
      {urlActual && (
        <audio
          id={AUDIO_PLAYER_ID}
          ref={audioRef}
          src={urlActual}
          onEnded={() => {
            if (tipoFuente === "lista" && archivosDeLista.length > 0) {
              siguientePista();
            }
          }}
          onPlay={() => setReproduciendo(true)}
          onPause={() => setReproduciendo(false)}
          style={{ display: "none" }}
        />
      )}
    </AudioControllerContext.Provider>
  );
}

export function useAudioController() {
  const context = useContext(AudioControllerContext);
  if (!context) {
    throw new Error("useAudioController debe usarse dentro de AudioControllerProvider");
  }
  return context;
}
