import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { filtrarPublicidadesActivas, type Publicidad } from "@/lib/publicidadUtils";
import VisualizadorPantallaCompleta from "./VisualizadorPantallaCompleta";
import "@/styles/carrusel-infinito.css";

interface CarruselPublicidadProps {
  tipo: "carrusel_logos" | "carrusel_principal" | "logos_servicios";
}

export default function CarruselPublicidad({ tipo }: CarruselPublicidadProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [visualizadorAbierto, setVisualizadorAbierto] = useState(false);
  const [publicidadSeleccionada, setPublicidadSeleccionada] = useState<Publicidad | null>(null);
  const [pausaAutoScroll, setPausaAutoScroll] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

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

  useEffect(() => {
    if (pausaAutoScroll) {
      const timeout = setTimeout(() => setPausaAutoScroll(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [pausaAutoScroll]);

  const abrirVisualizador = (publicidad: Publicidad) => {
    setPublicidadSeleccionada(publicidad);
    setVisualizadorAbierto(true);
  };

  const cerrarVisualizador = () => {
    setVisualizadorAbierto(false);
    setPublicidadSeleccionada(null);
  };

  if (publicidadesActivas.length === 0) {
    const alturaVacia = tipo === "carrusel_principal" ? "350px" : "100px";
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
      <>
        <div
          className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
          style={{ height: "350px" }}
          data-testid="carousel-principal"
        >
          <div 
            className="relative h-full w-full flex items-center justify-center cursor-pointer"
            onClick={() => abrirVisualizador(publicidadActual)}
          >
            <img
              src={publicidadActual.imagenUrl || undefined}
              alt={publicidadActual.titulo || "Publicidad"}
              className="h-[350px] w-auto object-contain transition-opacity duration-500 hover:opacity-90"
              data-testid="img-carousel-principal"
            />
          </div>

          {publicidadesActivas.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => { e.stopPropagation(); irAnterior(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
                data-testid="button-carousel-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => { e.stopPropagation(); irSiguiente(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg"
                data-testid="button-carousel-next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        <VisualizadorPantallaCompleta
          publicidad={publicidadSeleccionada}
          isOpen={visualizadorAbierto}
          onClose={cerrarVisualizador}
        />
      </>
    );
  }

  const itemsMultiplicados = [...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setPausaAutoScroll(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const umbral = 50;

    if (Math.abs(diff) > umbral) {
      const container = e.currentTarget.querySelector('.carrusel-track') as HTMLElement;
      if (container) {
        const scrollAmount = diff > 0 ? 200 : -200;
        container.style.transform = `translateX(${-scrollAmount}px)`;
        setTimeout(() => {
          container.style.transform = '';
        }, 300);
      }
    }
    setTouchStartX(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStartX(e.clientX);
    setPausaAutoScroll(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX === null) return;
    const diff = mouseStartX - e.clientX;
    const umbral = 30;

    if (Math.abs(diff) > umbral) {
      const container = e.currentTarget.querySelector('.carrusel-track') as HTMLElement;
      if (container) {
        const scrollAmount = diff > 0 ? 200 : -200;
        container.style.transition = 'transform 0.3s ease';
        container.style.transform = `translateX(${-scrollAmount}px)`;
        setTimeout(() => {
          container.style.transition = '';
          container.style.transform = '';
        }, 300);
      }
    }
    setMouseStartX(null);
  };

  const renderImagen = (pub: Publicidad, idx: number) => {
    const esCarruselLogos = tipo === "carrusel_logos";
    
    const contenido = (
      <img
        src={pub.imagenUrl || undefined}
        alt={pub.titulo || `Imagen ${idx + 1}`}
        className={`h-[90px] w-auto object-contain flex-shrink-0 ${
          esCarruselLogos 
            ? 'drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)] hover:drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:-translate-y-1' 
            : ''
        }`}
        style={{ 
          maxWidth: "none",
          ...(esCarruselLogos && {
            filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))',
            transform: 'perspective(500px) rotateX(2deg)',
          })
        }}
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
          className="flex-shrink-0 hover:opacity-90 transition-all duration-300"
          style={{ marginLeft: "8px", marginRight: "8px" }}
        >
          {contenido}
        </a>
      );
    }

    return (
      <div
        key={`${pub.id}-${idx}`}
        className="flex-shrink-0"
        style={{ marginLeft: "8px", marginRight: "8px" }}
      >
        {contenido}
      </div>
    );
  };

  const fondoClase = tipo === "logos_servicios" 
    ? "bg-gray-100 dark:bg-gray-800/50" 
    : "bg-white dark:bg-gray-900";

  const esCarruselLogos = tipo === "carrusel_logos";

  return (
    <div
      className={`w-full overflow-hidden ${fondoClase} ${
        esCarruselLogos 
          ? 'shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] relative z-10' 
          : 'border-y border-border/30'
      }`}
      style={{ 
        height: esCarruselLogos ? "110px" : "100px",
        ...(esCarruselLogos && {
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(245,245,245,0.95))',
        })
      }}
      data-testid={`carousel-${tipo}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div 
        className={`carrusel-infinito h-full flex items-center ${pausaAutoScroll ? 'carrusel-pausado' : 'carrusel-lento'}`}
        style={{ cursor: 'grab' }}
      >
        <div className="carrusel-track">
          {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx))}
          {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx + itemsMultiplicados.length))}
        </div>
      </div>
    </div>
  );
}
