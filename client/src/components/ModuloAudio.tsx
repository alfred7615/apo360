import { Radio, Music, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
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
import { useAudioController } from "@/contexts/AudioControllerContext";

export default function ModuloAudio() {
  const audio = useAudioController();

  const cambiarRadio = (radioIdStr: string) => {
    const radioId = radioIdStr.includes('-') ? radioIdStr : parseInt(radioIdStr, 10);
    audio.seleccionarRadio(radioId);
  };

  const cambiarLista = (listaIdStr: string) => {
    const listaId = parseInt(listaIdStr, 10);
    audio.seleccionarLista(listaId);
  };

  const tieneIframe = audio.tipoFuente === "radio" && audio.usandoIframe;

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800" data-testid="module-audio">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {audio.tipoFuente === "radio" ? (
              <Radio className="h-5 w-5 text-primary" />
            ) : (
              <Music className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-semibold">Audio</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={audio.tipoFuente === "radio" ? "default" : "outline"}
              size="sm"
              onClick={() => audio.cambiarTipoFuente("radio")}
              data-testid="button-mode-radio"
            >
              Radio Online
            </Button>
            <Button
              variant={audio.tipoFuente === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => audio.cambiarTipoFuente("lista")}
              data-testid="button-mode-mp3"
            >
              Lista MP3
            </Button>
          </div>
        </div>

        {audio.tipoFuente === "radio" ? (
          <Select value={audio.radioSeleccionadaId?.toString() || ""} onValueChange={cambiarRadio}>
            <SelectTrigger className="w-full" data-testid="select-radio">
              <SelectValue placeholder="Selecciona una radio" />
            </SelectTrigger>
            <SelectContent>
              {audio.radiosActivas.map((radio) => (
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
            <Select value={audio.listaSeleccionadaId?.toString() || ""} onValueChange={cambiarLista}>
              <SelectTrigger className="w-full" data-testid="select-lista">
                <SelectValue placeholder="Selecciona una lista" />
              </SelectTrigger>
              <SelectContent>
                {audio.listasActivas.map((lista) => (
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
                  {audio.archivoActual?.titulo || "Sin archivos MP3"}
                </p>
                {audio.artistaActual && (
                  <p className="text-xs text-muted-foreground truncate">{audio.artistaActual}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {audio.archivosDeLista.length > 0 
                    ? `${audio.pistaActual + 1} de ${audio.archivosDeLista.length}` 
                    : "Lista vacía"}
                </p>
              </div>
              {audio.archivosDeLista.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={audio.anteriorPista}
                    data-testid="button-prev-song"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={audio.siguientePista}
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
            onClick={audio.alternarReproduccion}
            disabled={audio.tipoFuente === "radio" ? !audio.radioSeleccionadaId : audio.archivosDeLista.length === 0}
            className="shrink-0"
            data-testid="button-play-pause"
          >
            {audio.reproduciendo ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={audio.toggleSilencio}
              data-testid="button-mute"
            >
              {audio.silenciado || audio.volumen === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[audio.volumen]}
              onValueChange={(value) => audio.setVolumen(value[0])}
              max={100}
              step={1}
              className="flex-1"
              data-testid="slider-volume"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {audio.volumen}%
            </span>
          </div>
        </div>

        {tieneIframe && audio.iframeCode && audio.reproduciendo && (
          <div className="w-full rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: audio.iframeCode }} />
        )}

        {audio.urlActual && (
          <div className="text-xs text-muted-foreground text-center">
            {audio.reproduciendo ? (
              <span className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Reproduciendo: {audio.tituloActual}
              </span>
            ) : (
              <span>Listo para reproducir</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
