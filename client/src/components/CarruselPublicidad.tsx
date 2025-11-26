import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { filtrarPublicidadesActivas, type Publicidad } from "@/lib/publicidadUtils";
import "@/styles/carrusel-infinito.css";

interface CarruselPublicidadProps {
  tipo: "carrusel_logos" | "carrusel_principal" | "logos_servicios";
  altura?: string;
}

export default function CarruselPublicidad({ tipo }: CarruselPublicidadProps) {
  const [indiceActual, setIndiceActual] = useState(0);

  const { data: publicidades = [] } = useQuery<Publicidad[]>({
    queryKey: ["/api/publicidad"],
  });

  const publicidadesActivas = filtrarPublicidadesActivas(
    publicidades.filter(p => p.tipo === tipo)
  );

  useEffect(() => {
    if (tipo !== "carrusel_principal" || publicidadesActivas.length === 0) return;

    const intervalo = setInterval(() => {
      setIndiceActual((prev) => (prev + 1) % publicidadesActivas.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [publicidadesActivas.length, tipo]);

  useEffect(() => {
    setIndiceActual((prev) => {
      if (publicidadesActivas.length === 0) return 0;
      if (prev >= publicidadesActivas.length) {
        return Math.max(publicidadesActivas.length - 1, 0);
      }
      return prev;
    });
  }, [publicidadesActivas.length]);

  if (publicidadesActivas.length === 0) {
    const alturaVacia = tipo === "carrusel_principal" ? "430px" : "140px";
    return (
      <div
        className="w-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center"
        style={{ height: alturaVacia }}
        data-testid={`carousel-${tipo}-empty`}
      >
        <p className="text-muted-foreground text-sm">No hay publicidad disponible</p>
      </div>
    );
  }

  if (tipo === "carrusel_principal") {
    const publicidadActual = publicidadesActivas[indiceActual];

    const irAnterior = () => {
      setIndiceActual((prev) =>
        prev === 0 ? publicidadesActivas.length - 1 : prev - 1
      );
    };

    const irSiguiente = () => {
      setIndiceActual((prev) => (prev + 1) % publicidadesActivas.length);
    };

    return (
      <div
        className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
        style={{ height: "430px" }}
        data-testid="carousel-principal"
      >
        <div className="relative h-full w-full flex items-center justify-center">
          {publicidadActual.enlaceUrl ? (
            <a 
              href={publicidadActual.enlaceUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-full w-full flex items-center justify-center"
            >
              <img
                src={publicidadActual.imagenUrl || undefined}
                alt={publicidadActual.titulo || "Publicidad"}
                className="max-h-full max-w-full object-contain transition-opacity duration-500"
                data-testid="img-carousel-principal"
              />
            </a>
          ) : (
            <img
              src={publicidadActual.imagenUrl || undefined}
              alt={publicidadActual.titulo || "Publicidad"}
              className="max-h-full max-w-full object-contain transition-opacity duration-500"
              data-testid="img-carousel-principal"
            />
          )}
        </div>

        {publicidadesActivas.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={irAnterior}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
              data-testid="button-carousel-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={irSiguiente}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
              data-testid="button-carousel-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {publicidadesActivas.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setIndiceActual(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === indiceActual 
                      ? "w-8 bg-purple-600" 
                      : "w-2 bg-gray-400 dark:bg-gray-600"
                  }`}
                  data-testid={`button-carousel-dot-${idx}`}
                  aria-label={`Ir a imagen ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const itemsMultiplicados = [...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas];

  const renderImagen = (pub: Publicidad, idx: number) => {
    const contenido = (
      <img
        src={pub.imagenUrl || undefined}
        alt={pub.titulo || `Imagen ${idx + 1}`}
        className="h-[130px] w-auto object-contain flex-shrink-0"
        style={{ maxWidth: "none" }}
        data-testid={`img-carousel-${tipo}-${idx}`}
      />
    );

    if (pub.enlaceUrl) {
      return (
        <a
          key={`${pub.id}-${idx}`}
          href={pub.enlaceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 mx-6 hover:opacity-80 transition-opacity"
        >
          {contenido}
        </a>
      );
    }

    return (
      <div
        key={`${pub.id}-${idx}`}
        className="flex-shrink-0 mx-6"
      >
        {contenido}
      </div>
    );
  };

  const fondoClase = tipo === "logos_servicios" 
    ? "bg-gray-100 dark:bg-gray-800/50" 
    : "bg-white dark:bg-gray-900";

  return (
    <div
      className={`w-full overflow-hidden ${fondoClase} border-y border-border/30`}
      style={{ height: "140px" }}
      data-testid={`carousel-${tipo}`}
    >
      <div className="carrusel-infinito carrusel-lento h-full flex items-center">
        <div className="carrusel-track">
          {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx))}
          {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx + itemsMultiplicados.length))}
        </div>
      </div>
    </div>
  );
}
