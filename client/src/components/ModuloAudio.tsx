import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Radio, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface RadioOnline {
  id: number;
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

const AUDIO_PLAYER_ID = "apo-360-audio-player";

export default function ModuloAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [volumen, setVolumen] = useState(70);
  const [silenciado, setSilenciado] = useState(false);
  const [modoRadio, setModoRadio] = useState(true);
  const [radioSeleccionada, setRadioSeleccionada] = useState<number | null>(null);
  const [listaSeleccionada, setListaSeleccionada] = useState<number | null>(null);
  const [mp3Actual, setMp3Actual] = useState(0);
  const [usandoIframe, setUsandoIframe] = useState(false);

  const { data: radios = [] } = useQuery<RadioOnline[]>({
    queryKey: ["/api/radios-online"],
  });

  const { data: listas = [] } = useQuery<ListaMp3[]>({
    queryKey: ["/api/listas-mp3"],
  });

  const { data: todosArchivosMp3 = [] } = useQuery<ArchivoMp3[]>({
    queryKey: ["/api/archivos-mp3"],
  });

  const radiosActivas = radios.filter((r) => r.estado === "activo").sort((a, b) => a.orden - b.orden);
  const listasActivas = listas.filter((l) => l.estado === "activo").sort((a, b) => a.orden - b.orden);

  const archivosDeLista = listaSeleccionada
    ? todosArchivosMp3.filter((m) => m.listaId === listaSeleccionada && m.estado === "activo").sort((a, b) => a.orden - b.orden)
    : [];

  const pausarOtrosAudios = useCallback(() => {
    const allAudios = document.querySelectorAll("audio");
    allAudios.forEach((audio) => {
      if (audio.id !== AUDIO_PLAYER_ID && !audio.paused) {
        audio.pause();
      }
    });
    const allIframes = document.querySelectorAll("iframe");
    allIframes.forEach((iframe) => {
      if (iframe !== iframeRef.current) {
        try {
          iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
        } catch (e) {
        }
      }
    });
  }, []);

  useEffect(() => {
    if (radiosActivas.length > 0 && radioSeleccionada === null) {
      const predeterminada = radiosActivas.find((r) => r.esPredeterminada);
      const tacnaFm = radiosActivas.find((r) => r.nombre.toLowerCase().includes("tacnafm") || r.nombre.toLowerCase().includes("tacna fm"));
      setRadioSeleccionada(predeterminada?.id || tacnaFm?.id || radiosActivas[0].id);
    }
  }, [radiosActivas, radioSeleccionada]);

  useEffect(() => {
    if (listasActivas.length > 0 && listaSeleccionada === null) {
      setListaSeleccionada(listasActivas[0].id);
    }
  }, [listasActivas, listaSeleccionada]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = silenciado ? 0 : volumen / 100;
    }
  }, [volumen, silenciado]);

  const radioActual = radiosActivas.find((r) => r.id === radioSeleccionada);

  const alternarReproduccion = () => {
    if (modoRadio && radioActual?.iframeCode) {
      setUsandoIframe(!usandoIframe);
      if (!usandoIframe) {
        pausarOtrosAudios();
      }
      setReproduciendo(!reproduciendo);
      return;
    }

    if (!audioRef.current) return;

    if (reproduciendo) {
      audioRef.current.pause();
    } else {
      pausarOtrosAudios();
      audioRef.current.play().catch((error) => {
        console.error("Error al reproducir:", error);
      });
    }
    setReproduciendo(!reproduciendo);
  };

  const cambiarRadio = (radioIdStr: string) => {
    const radioId = parseInt(radioIdStr, 10);
    setRadioSeleccionada(radioId);
    setReproduciendo(false);
    setUsandoIframe(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const cambiarLista = (listaIdStr: string) => {
    const listaId = parseInt(listaIdStr, 10);
    setListaSeleccionada(listaId);
    setMp3Actual(0);
    setReproduciendo(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const anteriorMp3 = () => {
    if (archivosDeLista.length === 0) return;
    setMp3Actual((prev) => (prev === 0 ? archivosDeLista.length - 1 : prev - 1));
    setReproduciendo(false);
  };

  const siguienteMp3 = () => {
    if (archivosDeLista.length === 0) return;
    setMp3Actual((prev) => (prev + 1) % archivosDeLista.length);
    setReproduciendo(false);
  };

  const urlActual = modoRadio
    ? radioActual?.url
    : archivosDeLista[mp3Actual]?.archivoUrl;

  const tituloActual = modoRadio
    ? radioActual?.nombre
    : archivosDeLista[mp3Actual]?.titulo;

  const artistaActual = !modoRadio ? archivosDeLista[mp3Actual]?.artista : null;

  const tieneIframe = modoRadio && radioActual?.iframeCode;

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800" data-testid="module-audio">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {modoRadio ? (
              <Radio className="h-5 w-5 text-primary" />
            ) : (
              <Music className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-semibold">Audio</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={modoRadio ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setModoRadio(true);
                setReproduciendo(false);
                setUsandoIframe(false);
                if (audioRef.current) audioRef.current.pause();
              }}
              data-testid="button-mode-radio"
            >
              Radio Online
            </Button>
            <Button
              variant={!modoRadio ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setModoRadio(false);
                setReproduciendo(false);
                setUsandoIframe(false);
                if (audioRef.current) audioRef.current.pause();
              }}
              data-testid="button-mode-mp3"
            >
              Lista MP3
            </Button>
          </div>
        </div>

        {modoRadio ? (
          <Select value={radioSeleccionada?.toString() || ""} onValueChange={cambiarRadio}>
            <SelectTrigger className="w-full" data-testid="select-radio">
              <SelectValue placeholder="Selecciona una radio" />
            </SelectTrigger>
            <SelectContent>
              {radiosActivas.map((radio) => (
                <SelectItem key={radio.id} value={radio.id.toString()}>
                  <div className="flex items-center gap-2">
                    {radio.logoUrl && (
                      <img src={radio.logoUrl} alt={radio.nombre} className="h-4 w-4 rounded" />
                    )}
                    <span>{radio.nombre}</span>
                    {radio.esPredeterminada && (
                      <span className="text-xs text-muted-foreground">(Predeterminada)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-col gap-2">
            <Select value={listaSeleccionada?.toString() || ""} onValueChange={cambiarLista}>
              <SelectTrigger className="w-full" data-testid="select-lista">
                <SelectValue placeholder="Selecciona una lista" />
              </SelectTrigger>
              <SelectContent>
                {listasActivas.map((lista) => (
                  <SelectItem key={lista.id} value={lista.id.toString()}>
                    <div className="flex items-center gap-2">
                      {lista.imagenUrl && (
                        <img src={lista.imagenUrl} alt={lista.nombre} className="h-4 w-4 rounded" />
                      )}
                      <span>{lista.nombre}</span>
                      {lista.genero && (
                        <span className="text-xs text-muted-foreground">({lista.genero})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-3 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" data-testid="text-current-song">
                  {tituloActual || "Sin archivos MP3"}
                </p>
                {artistaActual && (
                  <p className="text-xs text-muted-foreground truncate">{artistaActual}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {archivosDeLista.length > 0 ? `${mp3Actual + 1} de ${archivosDeLista.length}` : "Lista vacía"}
                </p>
              </div>
              {archivosDeLista.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={anteriorMp3}
                    data-testid="button-prev-song"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={siguienteMp3}
                    data-testid="button-next-song"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="icon"
            onClick={alternarReproduccion}
            disabled={modoRadio ? !radioSeleccionada : archivosDeLista.length === 0}
            className="shrink-0"
            data-testid="button-play-pause"
          >
            {reproduciendo ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSilenciado(!silenciado)}
              data-testid="button-mute"
            >
              {silenciado || volumen === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volumen]}
              onValueChange={(value) => setVolumen(value[0])}
              max={100}
              step={1}
              className="flex-1"
              data-testid="slider-volume"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {volumen}%
            </span>
          </div>
        </div>

        {tieneIframe && usandoIframe && reproduciendo && (
          <div className="w-full rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: radioActual.iframeCode! }} />
        )}

        {urlActual && !usandoIframe && (
          <audio
            id={AUDIO_PLAYER_ID}
            ref={audioRef}
            src={urlActual}
            onEnded={() => {
              if (!modoRadio && archivosDeLista.length > 0) {
                siguienteMp3();
                setTimeout(() => {
                  pausarOtrosAudios();
                  audioRef.current?.play();
                }, 100);
              }
            }}
            onPlay={() => setReproduciendo(true)}
            onPause={() => setReproduciendo(false)}
          />
        )}
      </div>
    </Card>
  );
}
