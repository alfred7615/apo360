import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Radio } from "lucide-react";
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
  id: string;
  nombre: string;
  url: string;
  logoUrl?: string;
}

interface ArchivoMp3 {
  id: string;
  titulo: string;
  archivoUrl: string;
  orden: number;
}

export default function ModuloAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [volumen, setVolumen] = useState(70);
  const [silenciado, setSilenciado] = useState(false);
  const [modoRadio, setModoRadio] = useState(true);
  const [radioSeleccionada, setRadioSeleccionada] = useState<string>("");
  const [mp3Actual, setMp3Actual] = useState(0);

  const { data: radios = [] } = useQuery<RadioOnline[]>({
    queryKey: ["/api/radios-online"],
  });

  const { data: archivosMp3 = [] } = useQuery<ArchivoMp3[]>({
    queryKey: ["/api/archivos-mp3"],
  });

  const radiosActivas = radios.filter((r: any) => r.estado === "activo").sort((a: any, b: any) => a.orden - b.orden);
  const mp3Activos = archivosMp3.filter((m: any) => m.estado === "activo").sort((a, b) => a.orden - b.orden);

  useEffect(() => {
    if (radiosActivas.length > 0 && !radioSeleccionada) {
      setRadioSeleccionada(radiosActivas[0].id);
    }
  }, [radiosActivas]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = silenciado ? 0 : volumen / 100;
    }
  }, [volumen, silenciado]);

  const alternarReproduccion = () => {
    if (!audioRef.current) return;

    if (reproduciendo) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error al reproducir:", error);
      });
    }
    setReproduciendo(!reproduciendo);
  };

  const cambiarRadio = (radioId: string) => {
    setRadioSeleccionada(radioId);
    setReproduciendo(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const anteriorMp3 = () => {
    if (mp3Activos.length === 0) return;
    setMp3Actual((prev) => (prev === 0 ? mp3Activos.length - 1 : prev - 1));
    setReproduciendo(false);
  };

  const siguienteMp3 = () => {
    if (mp3Activos.length === 0) return;
    setMp3Actual((prev) => (prev + 1) % mp3Activos.length);
    setReproduciendo(false);
  };

  const urlActual = modoRadio
    ? radiosActivas.find((r) => r.id === radioSeleccionada)?.url
    : mp3Activos[mp3Actual]?.archivoUrl;

  const tituloActual = modoRadio
    ? radiosActivas.find((r) => r.id === radioSeleccionada)?.nombre
    : mp3Activos[mp3Actual]?.titulo;

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800" data-testid="module-audio">
      <div className="flex flex-col gap-4">
        {/* Selector de modo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Audio</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={modoRadio ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setModoRadio(true);
                setReproduciendo(false);
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
              }}
              data-testid="button-mode-mp3"
            >
              Lista MP3
            </Button>
          </div>
        </div>

        {/* Selector de radio o información de MP3 */}
        {modoRadio ? (
          <Select value={radioSeleccionada} onValueChange={cambiarRadio}>
            <SelectTrigger className="w-full" data-testid="select-radio">
              <SelectValue placeholder="Selecciona una radio" />
            </SelectTrigger>
            <SelectContent>
              {radiosActivas.map((radio) => (
                <SelectItem key={radio.id} value={radio.id}>
                  <div className="flex items-center gap-2">
                    {radio.logoUrl && (
                      <img src={radio.logoUrl} alt={radio.nombre} className="h-4 w-4 rounded" />
                    )}
                    <span>{radio.nombre}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center justify-between bg-white/50 dark:bg-black/20 p-3 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" data-testid="text-current-song">
                {tituloActual || "Sin archivos MP3"}
              </p>
              <p className="text-xs text-muted-foreground">
                {mp3Activos.length > 0 ? `${mp3Actual + 1} de ${mp3Activos.length}` : "Lista vacía"}
              </p>
            </div>
            {mp3Activos.length > 0 && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={anteriorMp3}
                  data-testid="button-prev-song"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={siguienteMp3}
                  data-testid="button-next-song"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Controles de reproducción */}
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="icon"
            onClick={alternarReproduccion}
            disabled={!urlActual}
            className="shrink-0"
            data-testid="button-play-pause"
          >
            {reproduciendo ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
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

        {/* Audio element */}
        {urlActual && (
          <audio
            ref={audioRef}
            src={urlActual}
            onEnded={() => {
              if (!modoRadio) {
                siguienteMp3();
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
