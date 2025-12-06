import { Radio, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioController } from "@/contexts/AudioControllerContext";
import { useState, useEffect } from "react";

export default function BannerActivarAudio() {
  const audio = useAudioController();
  const [visible, setVisible] = useState(false);
  const [minimizado, setMinimizado] = useState(false);

  useEffect(() => {
    if (audio.necesitaActivacion && audio.radiosActivas.length > 0) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [audio.necesitaActivacion, audio.radiosActivas.length]);

  if (!visible || audio.reproduciendo) {
    return null;
  }

  const handleActivar = () => {
    audio.activarAudio();
    setVisible(false);
  };

  const handleCerrar = () => {
    setMinimizado(true);
  };

  if (minimizado) {
    return (
      <div 
        className="fixed bottom-20 right-4 z-50 cursor-pointer"
        onClick={() => setMinimizado(false)}
        data-testid="banner-audio-minimizado"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:scale-110 transition-transform animate-pulse">
          <Volume2 className="h-6 w-6" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300"
      data-testid="banner-activar-audio"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4 shadow-2xl relative">
        <button
          onClick={handleCerrar}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
          data-testid="button-cerrar-banner-audio"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shrink-0">
            <Radio className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">Radio Comunitaria</h4>
            <p className="text-sm text-white/80 mb-3">
              Toca para escuchar la radio predeterminada. El audio continuará incluso con la pantalla bloqueada.
            </p>
            <Button
              onClick={handleActivar}
              variant="secondary"
              size="sm"
              className="w-full bg-white text-purple-700 hover:bg-white/90"
              data-testid="button-activar-audio"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Activar Audio
            </Button>
          </div>
        </div>

        {audio.radioActual && (
          <div className="mt-3 pt-3 border-t border-white/20 text-sm text-white/80 flex items-center gap-2">
            {audio.radioActual.logoUrl && (
              <img 
                src={audio.radioActual.logoUrl} 
                alt={audio.radioActual.nombre}
                className="h-6 w-6 rounded"
              />
            )}
            <span>Listo: {audio.radioActual.nombre}</span>
          </div>
        )}
      </div>
    </div>
  );
}
