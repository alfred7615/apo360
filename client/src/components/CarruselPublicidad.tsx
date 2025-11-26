import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Link2, MapPin, Calendar, Info } from "lucide-react";
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
  const [imagenSeleccionadaId, setImagenSeleccionadaId] = useState<string | null>(null);
  const [pausaAutoScroll, setPausaAutoScroll] = useState(false);
  const [arrastrandoX, setArrastrandoX] = useState<number | null>(null);
  const [desplazamientoManual, setDesplazamientoManual] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

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

  // Reanudar auto-scroll después de 3 segundos de inactividad
  useEffect(() => {
    if (pausaAutoScroll) {
      const timeout = setTimeout(() => {
        setPausaAutoScroll(false);
        setDesplazamientoManual(0);
      }, 3000);
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

  // Manejo de clics: primer clic = efecto 3D, segundo clic = abrir modal
  const manejarClicImagen = (pub: Publicidad, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (imagenSeleccionadaId === pub.id) {
      // Segundo clic - abrir modal
      abrirVisualizador(pub);
      setImagenSeleccionadaId(null);
    } else {
      // Primer clic - seleccionar para efecto 3D
      setImagenSeleccionadaId(pub.id);
    }
  };

  // Navegación táctil
  const handleTouchStart = (e: React.TouchEvent) => {
    setArrastrandoX(e.touches[0].clientX);
    setPausaAutoScroll(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (arrastrandoX === null) return;
    const diff = arrastrandoX - e.touches[0].clientX;
    setDesplazamientoManual(diff);
  };

  const handleTouchEnd = () => {
    setArrastrandoX(null);
    // El desplazamiento se mantiene y el auto-scroll reanuda después de 3 segundos
  };

  // Navegación con mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    setArrastrandoX(e.clientX);
    setPausaAutoScroll(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (arrastrandoX === null) return;
    const diff = arrastrandoX - e.clientX;
    setDesplazamientoManual(diff);
  };

  const handleMouseUp = () => {
    setArrastrandoX(null);
  };

  const handleMouseLeave = () => {
    if (arrastrandoX !== null) {
      setArrastrandoX(null);
    }
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

  // Renderizado de imágenes para carrusel de logos
  const itemsMultiplicados = [...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas];

  const tieneInfoAdicional = (pub: Publicidad) => {
    return pub.enlaceUrl || pub.latitud || pub.longitud || pub.fechaInicio || pub.fechaFin;
  };

  const renderIconosInfo = (pub: Publicidad) => {
    const iconos: JSX.Element[] = [];
    
    if (pub.enlaceUrl) {
      iconos.push(
        <div key="url" className="bg-blue-500 rounded-full p-1" title="Tiene enlace">
          <Link2 className="h-2.5 w-2.5 text-white" />
        </div>
      );
    }
    
    if (pub.latitud || pub.longitud) {
      iconos.push(
        <div key="gps" className="bg-green-500 rounded-full p-1" title="Tiene ubicación GPS">
          <MapPin className="h-2.5 w-2.5 text-white" />
        </div>
      );
    }
    
    if (pub.fechaInicio || pub.fechaFin) {
      iconos.push(
        <div key="fecha" className="bg-orange-500 rounded-full p-1" title="Tiene fechas">
          <Calendar className="h-2.5 w-2.5 text-white" />
        </div>
      );
    }
    
    if (pub.descripcion) {
      iconos.push(
        <div key="info" className="bg-gray-600 rounded-full p-1" title="Tiene descripción">
          <Info className="h-2.5 w-2.5 text-white" />
        </div>
      );
    }

    if (iconos.length === 0) return null;

    return (
      <div className="absolute bottom-1 right-1 flex gap-0.5 z-20">
        {iconos}
      </div>
    );
  };

  const renderImagen = (pub: Publicidad, idx: number) => {
    const esSeleccionada = imagenSeleccionadaId === pub.id;
    const esCarruselLogos = tipo === "carrusel_logos";
    
    return (
      <div
        key={`${pub.id}-${idx}`}
        className="flex-shrink-0 relative"
        style={{ marginLeft: "10px", marginRight: "10px" }}
        onClick={(e) => manejarClicImagen(pub, e)}
      >
        <div 
          className={`relative transition-all duration-300 cursor-pointer ${
            esCarruselLogos ? 'logo-3d-container' : ''
          } ${esSeleccionada ? 'logo-3d-activo' : ''}`}
          style={{
            transform: esSeleccionada 
              ? 'perspective(800px) rotateX(-8deg) rotateY(5deg) translateY(-8px) scale(1.15)' 
              : esCarruselLogos 
                ? 'perspective(800px) rotateX(3deg)' 
                : 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          <img
            src={pub.imagenUrl || undefined}
            alt={pub.titulo || `Imagen ${idx + 1}`}
            className={`h-[85px] w-auto object-contain flex-shrink-0 transition-all duration-300 ${
              esCarruselLogos 
                ? 'rounded-lg' 
                : ''
            }`}
            style={{ 
              maxWidth: "none",
              boxShadow: esSeleccionada
                ? '0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3)'
                : esCarruselLogos
                  ? '0 8px 16px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15)'
                  : 'none',
              border: esSeleccionada ? '2px solid rgba(139, 92, 246, 0.6)' : 'none',
            }}
            data-testid={`img-carousel-${tipo}-${idx}`}
          />
          
          {/* Iconos de información adicional */}
          {esCarruselLogos && renderIconosInfo(pub)}
          
          {/* Indicador visual de "toca de nuevo para ver más" */}
          {esSeleccionada && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-purple-600 dark:text-purple-400 whitespace-nowrap font-medium">
              Toca de nuevo para ver más
            </div>
          )}
        </div>
      </div>
    );
  };

  const fondoClase = tipo === "logos_servicios" 
    ? "bg-gray-100 dark:bg-gray-800/50" 
    : "";

  const esCarruselLogos = tipo === "carrusel_logos";

  return (
    <>
      <div
        ref={contenedorRef}
        className={`w-full overflow-hidden ${fondoClase} ${
          esCarruselLogos 
            ? 'relative z-10' 
            : 'border-y border-border/30'
        }`}
        style={{ 
          height: esCarruselLogos ? "120px" : "100px",
          background: esCarruselLogos 
            ? 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 50%, #f0f0f0 100%)' 
            : undefined,
          boxShadow: esCarruselLogos 
            ? '0 12px 30px -8px rgba(0,0,0,0.35), 0 6px 15px -5px rgba(0,0,0,0.2)' 
            : undefined,
        }}
        data-testid={`carousel-${tipo}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`carrusel-infinito h-full flex items-center ${pausaAutoScroll ? 'carrusel-pausado' : 'carrusel-lento'}`}
          style={{ 
            cursor: arrastrandoX !== null ? 'grabbing' : 'grab',
          }}
        >
          <div 
            className="carrusel-track"
            style={{
              transform: pausaAutoScroll ? `translateX(${-desplazamientoManual}px)` : undefined,
            }}
          >
            {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx))}
            {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx + itemsMultiplicados.length))}
          </div>
        </div>
      </div>

      {/* Modal para ver información completa */}
      <VisualizadorPantallaCompleta
        publicidad={publicidadSeleccionada}
        isOpen={visualizadorAbierto}
        onClose={cerrarVisualizador}
      />
    </>
  );
}
