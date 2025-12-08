import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

const AUDIO_AUTOPLAY_KEY = "apo-360-audio-autoplay";

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
  activarAudio: () => void;
  necesitaActivacion: boolean;
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
  const interaccionUsuarioRef = useRef(false);
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
  const [intentoAutoplay, setIntentoAutoplay] = useState(false);
  const [autoplayBloqueado, setAutoplayBloqueado] = useState(false);

  const necesitaActivacion = autoplayBloqueado && !reproduciendo;

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
    const habilitarAutoplay = () => {
      interaccionUsuarioRef.current = true;
      if (autoplayBloqueado && urlActual && audioRef.current) {
        console.log("🎵 Interacción detectada, intentando reproducir...");
        audioRef.current.play()
          .then(() => {
            setReproduciendo(true);
            setAutoplayBloqueado(false);
          })
          .catch(err => console.log("Error en reproducción tras interacción:", err));
      }
    };
    
    document.addEventListener("click", habilitarAutoplay);
    document.addEventListener("touchstart", habilitarAutoplay);
    document.addEventListener("keydown", habilitarAutoplay);
    
    return () => {
      document.removeEventListener("click", habilitarAutoplay);
      document.removeEventListener("touchstart", habilitarAutoplay);
      document.removeEventListener("keydown", habilitarAutoplay);
    };
  }, [autoplayBloqueado, urlActual]);

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
    }
  }, [radiosActivas, radioSeleccionadaId]);

  useEffect(() => {
    if (primeraVez && urlActual && !intentoAutoplay && !reproduciendo && audioRef.current) {
      setIntentoAutoplay(true);
      inicializadoRef.current = true;
      setPrimeraVez(false);
      
      console.log("🎵 Intentando autoplay inicial con:", urlActual);
      
      const audio = audioRef.current;
      audio.src = urlActual;
      audio.load();
      
      audio.play()
        .then(() => {
          console.log("✅ Autoplay exitoso");
          setReproduciendo(true);
          setAutoplayBloqueado(false);
        })
        .catch((error) => {
          console.log("⚠️ Autoplay bloqueado por el navegador:", error.name);
          setAutoplayBloqueado(true);
          setReproduciendo(false);
        });
    }
  }, [primeraVez, urlActual, intentoAutoplay, reproduciendo]);

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
      
      console.log("Intentando autoplay para:", urlActual);
      
      audio.src = urlActual;
      audio.load();
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Autoplay exitoso");
            setReproduciendo(true);
            setAutoReproducir(false);
            interaccionUsuarioRef.current = true;
          })
          .catch((error) => {
            console.log("Autoplay bloqueado:", error.name, "- interaccionUsuario:", interaccionUsuarioRef.current);
            
            if (interaccionUsuarioRef.current) {
              setTimeout(() => {
                console.log("Reintentando reproduccion tras interaccion...");
                audio.play()
                  .then(() => {
                    console.log("Reintento exitoso");
                    setReproduciendo(true);
                    setAutoReproducir(false);
                  })
                  .catch((err) => {
                    console.error("Reintento fallido:", err);
                    setAutoReproducir(false);
                    setReproduciendo(false);
                  });
              }, 100);
            } else {
              console.log("No hay interaccion del usuario, autoplay desactivado");
              setAutoReproducir(false);
              setReproduciendo(false);
            }
          });
      }
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
    if (!audioRef.current || !urlActual) {
      console.log("reproducir: no hay audioRef o urlActual", { audioRef: !!audioRef.current, urlActual });
      return;
    }
    
    pausarOtrosAudios();
    const audio = audioRef.current;
    
    if (audio.src !== urlActual) {
      audio.src = urlActual;
      audio.load();
    }
    
    audio.play()
      .then(() => {
        console.log("Audio reproduciendose correctamente");
        setReproduciendo(true);
      })
      .catch((error) => {
        console.error("Error al reproducir:", error);
        setReproduciendo(false);
      });
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
    interaccionUsuarioRef.current = true;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setTipoFuente("radio");
    setRadioSeleccionadaId(radioId);
    setReproduciendo(false);
    
    const radioSeleccionada = radiosActivas.find(r => r.id === radioId);
    if (radioSeleccionada?.iframeCode) {
      setReproduciendo(true);
    } else {
      setAutoReproducir(true);
    }
  }, [radiosActivas]);

  const seleccionarLista = useCallback((listaId: number) => {
    interaccionUsuarioRef.current = true;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
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

  const activarAudio = useCallback(() => {
    interaccionUsuarioRef.current = true;
    setAutoplayBloqueado(false);
    
    if (!audioRef.current || !urlActual) {
      console.log("activarAudio: no hay audioRef o urlActual, usando autoReproducir");
      setAutoReproducir(true);
      return;
    }
    
    pausarOtrosAudios();
    const audio = audioRef.current;
    
    if (audio.src !== urlActual) {
      audio.src = urlActual;
      audio.load();
    }
    
    audio.play()
      .then(() => {
        console.log("✅ Audio activado y reproduciéndose");
        setReproduciendo(true);
        setAutoplayBloqueado(false);
      })
      .catch((error) => {
        console.error("Error al activar audio:", error);
        setAutoReproducir(true);
      });
  }, [urlActual, pausarOtrosAudios]);

  useEffect(() => {
    if ("mediaSession" in navigator && reproduciendo) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: tituloActual || "APO-360 Radio",
        artist: artistaActual || "Radio Comunitaria",
        album: tipoFuente === "radio" ? "Radio Online" : "Lista MP3",
      });

      navigator.mediaSession.setActionHandler("play", () => {
        reproducir();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        pausar();
      });
      
      if (tipoFuente === "lista") {
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          anteriorPista();
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          siguientePista();
        });
      }
    }
  }, [reproduciendo, tituloActual, artistaActual, tipoFuente, reproducir, pausar, anteriorPista, siguientePista]);

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
    activarAudio,
    necesitaActivacion,
  };

  return (
    <AudioControllerContext.Provider value={value}>
      {children}
      <audio
        id={AUDIO_PLAYER_ID}
        ref={audioRef}
        onEnded={() => {
          if (tipoFuente === "lista" && archivosDeLista.length > 0) {
            siguientePista();
          }
        }}
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        style={{ display: "none" }}
      />
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
