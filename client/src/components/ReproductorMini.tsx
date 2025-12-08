import { useState } from "react";
import { Radio, Music, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ChevronUp, ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioController } from "@/contexts/AudioControllerContext";

interface ReproductorMiniProps {
  onAbrirSelector: () => void;
}

export default function ReproductorMini({ onAbrirSelector }: ReproductorMiniProps) {
  const audio = useAudioController();
  const [expandido, setExpandido] = useState(false);
  
  const hayContenido = audio.urlActual || audio.usandoIframe;
  
  if (!hayContenido && !audio.necesitaActivacion) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80"
      data-testid="reproductor-mini"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-2xl overflow-hidden">
        {audio.necesitaActivacion && (
          <div 
            className="p-3 flex items-center gap-3 cursor-pointer"
            onClick={audio.activarAudio}
            data-testid="button-activar-audio"
          >
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <Play className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                Toca para reproducir
              </p>
              <p className="text-white/70 text-xs truncate">
                {audio.tituloActual || "Radio APO-360"}
              </p>
            </div>
          </div>
        )}

        {!audio.necesitaActivacion && (
          <>
            <div 
              className="p-3 flex items-center gap-3 cursor-pointer"
              onClick={() => setExpandido(!expandido)}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                audio.tipoFuente === "radio" 
                  ? "bg-white/20" 
                  : "bg-green-500/30"
              }`}>
                {audio.tipoFuente === "radio" ? (
                  <Radio className="h-5 w-5 text-white" />
                ) : (
                  <Music className="h-5 w-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {audio.tituloActual || "Sin selección"}
                </p>
                {audio.artistaActual && (
                  <p className="text-white/70 text-xs truncate">
                    {audio.artistaActual}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    audio.alternarReproduccion();
                  }}
                  data-testid="button-play-pause-mini"
                >
                  {audio.reproduciendo ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                {expandido ? (
                  <ChevronDown className="h-4 w-4 text-white/70" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-white/70" />
                )}
              </div>
            </div>

            {expandido && (
              <div className="px-3 pb-3 space-y-3 border-t border-white/10">
                {audio.tipoFuente === "lista" && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={audio.anteriorPista}
                      data-testid="button-anterior-mini"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-white hover:bg-white/20"
                      onClick={audio.alternarReproduccion}
                      data-testid="button-play-pause-grande"
                    >
                      {audio.reproduciendo ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={audio.siguientePista}
                      data-testid="button-siguiente-mini"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20 shrink-0"
                    onClick={audio.toggleSilencio}
                    data-testid="button-silencio-mini"
                  >
                    {audio.silenciado ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[audio.silenciado ? 0 : audio.volumen]}
                    max={100}
                    step={1}
                    onValueChange={(value) => audio.setVolumen(value[0])}
                    className="flex-1 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_.bg-primary]:bg-white/80 [&_.bg-secondary]:bg-white/30"
                    data-testid="slider-volumen-mini"
                  />
                </div>

                <Button
                  variant="ghost"
                  className="w-full h-9 text-white hover:bg-white/20 gap-2"
                  onClick={onAbrirSelector}
                  data-testid="button-cambiar-fuente"
                >
                  <Settings2 className="h-4 w-4" />
                  Cambiar fuente de audio
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
