import { Radio, Music, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useAudioController } from "@/contexts/AudioControllerContext";

interface SelectorAudioProps {
  abierto: boolean;
  onClose: () => void;
}

export default function SelectorAudio({ abierto, onClose }: SelectorAudioProps) {
  const audio = useAudioController();

  const seleccionarYReproducir = (tipo: "radio" | "lista", id: number | string) => {
    if (tipo === "radio") {
      audio.seleccionarRadio(id);
    } else {
      audio.seleccionarLista(id as number);
    }
  };

  const hayContenidoSeleccionado = audio.urlActual || audio.usandoIframe;

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 bg-gradient-to-r from-purple-600 to-pink-600 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Music className="h-5 w-5" />
              Audio APO-360
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Selecciona y controla la reproducción de radios online y listas de música MP3
          </DialogDescription>
        </DialogHeader>

        {hayContenidoSeleccionado && (
          <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center shrink-0 ${
                audio.tipoFuente === "radio" 
                  ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                  : "bg-gradient-to-br from-green-500 to-teal-500"
              }`}>
                {audio.tipoFuente === "radio" ? (
                  <Radio className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                ) : (
                  <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-foreground text-sm sm:text-base" data-testid="text-audio-now-playing">
                  {audio.tituloActual || "Sin selección"}
                </p>
                {audio.artistaActual && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{audio.artistaActual}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {audio.tipoFuente === "radio" ? "Radio Online" : audio.listaActual?.nombre}
                </p>
              </div>
              {audio.reproduciendo && (
                <div className="flex gap-0.5">
                  <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse delay-150"></div>
                </div>
              )}
            </div>

            {audio.usandoIframe && audio.iframeCode ? (
              <div className="w-full rounded-lg overflow-hidden">
                <div 
                  dangerouslySetInnerHTML={{ __html: audio.iframeCode }}
                  data-testid="iframe-radio-player-modal"
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Usa los controles del reproductor de arriba para controlar el audio
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                {audio.tipoFuente === "lista" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={audio.anteriorPista}
                    disabled={audio.archivosDeLista.length === 0}
                    className="h-10 w-10 touch-manipulation"
                    data-testid="button-prev-track-modal"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                )}
                
                <Button
                  variant="default"
                  size="icon"
                  onClick={audio.alternarReproduccion}
                  disabled={!audio.urlActual}
                  className="h-12 w-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 touch-manipulation"
                  data-testid="button-play-pause-modal"
                >
                  {audio.reproduciendo ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                {audio.tipoFuente === "lista" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={audio.siguientePista}
                    disabled={audio.archivosDeLista.length === 0}
                    className="h-10 w-10 touch-manipulation"
                    data-testid="button-next-track-modal"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                )}
                
                <div className="flex items-center gap-1 flex-1 ml-1 sm:ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={audio.toggleSilencio}
                    className="h-10 w-10 touch-manipulation"
                    data-testid="button-mute-modal"
                  >
                    {audio.silenciado || audio.volumen === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <Slider
                    value={[audio.volumen]}
                    onValueChange={(value) => audio.setVolumen(value[0])}
                    max={100}
                    step={1}
                    className="flex-1 touch-manipulation"
                    data-testid="slider-volume-modal"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2">
            {audio.radiosActivas.length > 0 && (
              <div className="space-y-1">
                {audio.radiosActivas.map((radio) => {
                  const isSelected = audio.radioSeleccionadaId === radio.id && audio.tipoFuente === "radio";
                  return (
                    <button
                      key={`radio-${radio.id}`}
                      onClick={() => seleccionarYReproducir("radio", radio.id)}
                      className={`w-full flex items-center gap-2 sm:gap-3 p-3 rounded-lg text-left transition-all touch-manipulation active:scale-[0.98] ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300 dark:border-purple-700"
                          : "hover:bg-purple-100/50 dark:hover:bg-purple-900/30 active:bg-purple-200/50 dark:active:bg-purple-800/30"
                      }`}
                      data-testid={`button-select-radio-${radio.id}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Radio className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm sm:text-base">{radio.nombre}</p>
                        {radio.esPredeterminada && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Predeterminada</span>
                        )}
                      </div>
                      {isSelected && audio.reproduciendo ? (
                        <div className="flex gap-0.5 mr-1">
                          <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {audio.listasActivas.length > 0 && (
              <div className="space-y-1 mt-2">
                {audio.listasActivas.map((lista) => {
                  const isSelected = audio.listaSeleccionadaId === lista.id && audio.tipoFuente === "lista";
                  return (
                    <button
                      key={`lista-${lista.id}`}
                      onClick={() => seleccionarYReproducir("lista", lista.id)}
                      className={`w-full flex items-center gap-2 sm:gap-3 p-3 rounded-lg text-left transition-all touch-manipulation active:scale-[0.98] ${
                        isSelected
                          ? "bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-300 dark:border-green-700"
                          : "hover:bg-green-100/50 dark:hover:bg-green-900/30 active:bg-green-200/50 dark:active:bg-green-800/30"
                      }`}
                      data-testid={`button-select-lista-${lista.id}`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Music className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm sm:text-base">{lista.nombre}</p>
                      </div>
                      {isSelected && audio.reproduciendo ? (
                        <div className="flex gap-0.5 mr-1">
                          <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {audio.radiosActivas.length === 0 && audio.listasActivas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Music className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No hay audio disponible</p>
                <p className="text-xs mt-1">Contacta al administrador</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-white/50 dark:bg-black/20 shrink-0">
          <Button
            variant="outline"
            className="w-full h-11 touch-manipulation"
            onClick={onClose}
            data-testid="button-close-audio-selector"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
