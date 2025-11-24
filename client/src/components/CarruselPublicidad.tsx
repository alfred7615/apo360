import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { filtrarPublicidadesActivas, type Publicidad } from "@/lib/publicidadUtils";

interface CarruselPublicidadProps {
  tipo: "carrusel_logos" | "carrusel_principal" | "logos_servicios";
  altura?: string;
}

export default function CarruselPublicidad({ tipo, altura = "400px" }: CarruselPublicidadProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [hoverPausado, setHoverPausado] = useState(false);

  const { data: publicidades = [] } = useQuery<Publicidad[]>({
    queryKey: ["/api/publicidad"],
  });

  const publicidadesActivas = filtrarPublicidadesActivas(
    publicidades.filter(p => p.tipo === tipo)
  );

  // Clamp indiceActual cuando cambia la longitud de publicidades
  useEffect(() => {
    setIndiceActual((prev) => {
      if (publicidadesActivas.length === 0) return 0;
      if (prev >= publicidadesActivas.length) {
        return Math.max(publicidadesActivas.length - 1, 0);
      }
      return prev; // No change needed
    });
  }, [publicidadesActivas.length]);

  useEffect(() => {
    if (pausado || hoverPausado || publicidadesActivas.length === 0) return;

    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % publicidadesActivas.length);
    }, tipo === "carrusel_logos" ? 3000 : 5000);

    return () => clearInterval(intervalo);
  }, [pausado, hoverPausado, publicidadesActivas.length, tipo]);

  const irAnterior = () => {
    setIndiceActual((prev) =>
      prev === 0 ? publicidadesActivas.length - 1 : prev - 1
    );
  };

  const irSiguiente = () => {
    setIndiceActual((prev) => (prev + 1) % publicidadesActivas.length);
  };

  if (publicidadesActivas.length === 0) {
    return (
      <div
        className="w-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center rounded-lg"
        style={{ height: altura }}
        data-testid={`carousel-${tipo}-empty`}
      >
        <p className="text-muted-foreground">No hay publicidad disponible</p>
      </div>
    );
  }

  const publicidadActual = publicidadesActivas[indiceActual];

  if (tipo === "carrusel_logos" || tipo === "logos_servicios") {
    const logosConDuplicados = publicidadesActivas.length > 0 
      ? [...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas]
      : [];
    
    const logosVisibles = logosConDuplicados.slice(
      indiceActual, 
      indiceActual + 5
    );

    return (
      <div 
        className="relative w-full bg-white dark:bg-gray-800 py-6 border-y" 
        data-testid={`carousel-${tipo}`}
        onMouseEnter={() => setHoverPausado(true)}
        onMouseLeave={() => setHoverPausado(false)}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={irAnterior}
              className="shrink-0"
              data-testid="button-carousel-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 px-4">
                {logosVisibles.map((pub, idx) => {
                  const uniqueKey = `${pub.id}-${indiceActual}-${idx}`;
                  return (
                    <div
                      key={uniqueKey}
                      className="flex items-center justify-center transition-all duration-300 hover-elevate"
                    >
                      {pub.enlaceUrl ? (
                        <a 
                          href={pub.enlaceUrl || undefined} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex flex-col items-center gap-2"
                        >
                          <img
                            src={pub.imagenUrl || undefined}
                            alt={pub.titulo || undefined}
                            className="h-20 w-20 object-contain rounded-lg"
                            data-testid={`img-logo-${idx}`}
                          />
                          {tipo === "logos_servicios" && pub.titulo && (
                            <span className="text-sm text-center font-medium">
                              {pub.titulo}
                            </span>
                          )}
                        </a>
                      ) : (
                        <div className="w-full flex flex-col items-center gap-2">
                          <img
                            src={pub.imagenUrl || undefined}
                            alt={pub.titulo || undefined}
                            className="h-20 w-20 object-contain rounded-lg"
                            data-testid={`img-logo-${idx}`}
                          />
                          {tipo === "logos_servicios" && pub.titulo && (
                            <span className="text-sm text-center font-medium">
                              {pub.titulo}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={irSiguiente}
              className="shrink-0"
              data-testid="button-carousel-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPausado(!pausado)}
              className="shrink-0"
              data-testid="button-carousel-pause"
            >
              {pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Carrusel principal (imágenes grandes)
  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg" 
      style={{ height: altura }} 
      data-testid="carousel-main"
      onMouseEnter={() => setHoverPausado(true)}
      onMouseLeave={() => setHoverPausado(false)}
    >
      {/* Imagen actual */}
      <div className="relative h-full w-full">
        {publicidadActual.enlaceUrl ? (
          <a href={publicidadActual.enlaceUrl || undefined} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
            <img
              src={publicidadActual.imagenUrl || undefined}
              alt={publicidadActual.titulo || undefined}
              className="h-full w-full object-cover"
              data-testid="img-carousel-main"
            />
          </a>
        ) : (
          <img
            src={publicidadActual.imagenUrl || undefined}
            alt={publicidadActual.titulo || undefined}
            className="h-full w-full object-cover"
            data-testid="img-carousel-main"
          />
        )}

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Información de la publicidad */}
        {(publicidadActual.titulo || publicidadActual.descripcion) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-2xl font-bold mb-2" data-testid="text-carousel-title">
              {publicidadActual.titulo}
            </h3>
            {publicidadActual.descripcion && (
              <p className="text-sm opacity-90" data-testid="text-carousel-description">
                {publicidadActual.descripcion}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Controles de navegación */}
      <Button
        variant="secondary"
        size="icon"
        onClick={irAnterior}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
        data-testid="button-carousel-prev"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        onClick={irSiguiente}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
        data-testid="button-carousel-next"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Botón pausar/reproducir */}
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setPausado(!pausado)}
        className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white"
        data-testid="button-carousel-pause"
      >
        {pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>

      {/* Indicadores de puntos */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {publicidadesActivas.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setIndiceActual(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === indiceActual ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            data-testid={`button-carousel-dot-${idx}`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
