import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Info, MapPin, Calendar, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { filtrarPublicidadesActivas, type Publicidad, getGoogleMapsUrl } from "@/lib/publicidadUtils";
import VisualizadorPantallaCompleta from "./VisualizadorPantallaCompleta";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "@/styles/carrusel-infinito.css";

interface CarruselPublicidadProps {
  tipo: "carrusel_logos" | "carrusel_principal" | "logos_servicios";
}

function tieneContenidoAdicional(pub: Publicidad): boolean {
  // Solo estos campos cuentan como información:
  // - Redes sociales (facebook, instagram, tiktok, twitter, youtube, linkedin)
  // - WhatsApp
  // - Descripción
  // - Ubicación GPS
  return !!(
    pub.descripcion ||
    pub.latitud ||
    pub.longitud ||
    pub.facebook ||
    pub.instagram ||
    pub.whatsapp ||
    pub.tiktok ||
    pub.twitter ||
    pub.youtube ||
    pub.linkedin
  );
}

export default function CarruselPublicidad({ tipo }: CarruselPublicidadProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [visualizadorAbierto, setVisualizadorAbierto] = useState(false);
  const [publicidadSeleccionada, setPublicidadSeleccionada] = useState<Publicidad | null>(null);
  const [modalInfoAbierto, setModalInfoAbierto] = useState(false);
  const [pausaAutoScroll, setPausaAutoScroll] = useState(false);
  const [arrastreInicio, setArrastreInicio] = useState<number | null>(null);
  const [posicionScroll, setPosicionScroll] = useState(0);
  const [seMovio, setSeMovio] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  // Reanudar auto-scroll después de 5 segundos de inactividad
  useEffect(() => {
    if (pausaAutoScroll) {
      const timeout = setTimeout(() => {
        setPausaAutoScroll(false);
        setPosicionScroll(0);
      }, 5000);
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

  const abrirModalInfo = (publicidad: Publicidad, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPublicidadSeleccionada(publicidad);
    setModalInfoAbierto(true);
  };

  const cerrarModalInfo = () => {
    setModalInfoAbierto(false);
    setPublicidadSeleccionada(null);
  };

  // Capturar posición actual del track cuando se pausa
  const capturarPosicionActual = () => {
    if (trackRef.current && !pausaAutoScroll) {
      const computedStyle = window.getComputedStyle(trackRef.current);
      const matrix = new DOMMatrix(computedStyle.transform);
      const currentX = Math.abs(matrix.m41);
      setPosicionScroll(currentX);
    }
  };

  // Navegación con arrastre - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    capturarPosicionActual();
    setArrastreInicio(e.touches[0].clientX);
    setPausaAutoScroll(true);
    setSeMovio(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (arrastreInicio === null || !trackRef.current) return;
    setSeMovio(true);
    const diff = arrastreInicio - e.touches[0].clientX;
    trackRef.current.style.transform = `translateX(${-posicionScroll - diff}px)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (arrastreInicio === null || !trackRef.current) return;
    
    if (seMovio) {
      const diff = arrastreInicio - e.changedTouches[0].clientX;
      const nuevaPosicion = posicionScroll + diff;
      const maxScroll = trackRef.current.scrollWidth / 2;
      const posicionFinal = Math.max(0, Math.min(nuevaPosicion, maxScroll));
      setPosicionScroll(posicionFinal);
      trackRef.current.style.transform = `translateX(${-posicionFinal}px)`;
    }
    
    setArrastreInicio(null);
    setSeMovio(false);
  };

  // Navegación con arrastre - Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    capturarPosicionActual();
    setArrastreInicio(e.clientX);
    setPausaAutoScroll(true);
    setSeMovio(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (arrastreInicio === null || !trackRef.current) return;
    const diff = Math.abs(arrastreInicio - e.clientX);
    if (diff > 5) {
      setSeMovio(true);
    }
    const desplazamiento = arrastreInicio - e.clientX;
    trackRef.current.style.transform = `translateX(${-posicionScroll - desplazamiento}px)`;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (arrastreInicio === null || !trackRef.current) return;
    
    if (seMovio) {
      const diff = arrastreInicio - e.clientX;
      const nuevaPosicion = posicionScroll + diff;
      const maxScroll = trackRef.current.scrollWidth / 2;
      const posicionFinal = Math.max(0, Math.min(nuevaPosicion, maxScroll));
      setPosicionScroll(posicionFinal);
      trackRef.current.style.transform = `translateX(${-posicionFinal}px)`;
    }
    
    setArrastreInicio(null);
    setSeMovio(false);
  };

  const handleMouseLeave = () => {
    if (arrastreInicio !== null && trackRef.current) {
      trackRef.current.style.transform = `translateX(${-posicionScroll}px)`;
      setArrastreInicio(null);
      setSeMovio(false);
    }
  };

  // Click simple para pausar
  const handleClick = (e: React.MouseEvent) => {
    if (!seMovio) {
      capturarPosicionActual();
      setPausaAutoScroll(true);
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

  // Carrusel de logos
  const itemsMultiplicados = [...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas, ...publicidadesActivas];

  const renderImagen = (pub: Publicidad, idx: number) => {
    const tieneDatos = tieneContenidoAdicional(pub);
    
    return (
      <div
        key={`${pub.id}-${idx}`}
        className="flex-shrink-0 relative"
        style={{ marginLeft: "10px", marginRight: "10px" }}
      >
        <img
          src={pub.imagenUrl || undefined}
          alt={pub.titulo || `Imagen ${idx + 1}`}
          className="h-[85px] w-auto object-contain flex-shrink-0 rounded-md shadow-md"
          style={{ maxWidth: "none" }}
          data-testid={`img-carousel-${tipo}-${idx}`}
        />
        
        {/* Icono de información - solo si tiene contenido proporcionado por admin */}
        {tieneDatos && (
          <button
            onClick={(e) => abrirModalInfo(pub, e)}
            onTouchEnd={(e) => {
              e.stopPropagation();
              abrirModalInfo(pub, e);
            }}
            className="absolute bottom-1 right-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1 shadow-lg transition-all hover:scale-110 z-20"
            title="Ver información"
            data-testid={`btn-info-${pub.id}-${idx}`}
          >
            <Info className="h-3 w-3" />
          </button>
        )}
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
            ? 'shadow-lg relative z-10' 
            : 'border-y border-border/30'
        }`}
        style={{ 
          height: esCarruselLogos ? "95px" : "100px",
          backgroundColor: esCarruselLogos ? "rgb(219, 182, 200)" : undefined
        }}
        data-testid={`carousel-${tipo}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div 
          className="h-full flex items-center"
          style={{ cursor: arrastreInicio !== null ? 'grabbing' : 'grab' }}
        >
          <div 
            ref={trackRef}
            className={`flex items-center ${!pausaAutoScroll ? 'carrusel-track-animado' : ''}`}
            style={{
              transform: pausaAutoScroll ? `translateX(${-posicionScroll}px)` : undefined,
            }}
          >
            {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx))}
            {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx + itemsMultiplicados.length))}
          </div>
        </div>
      </div>

      {/* Modal de información */}
      <Dialog open={modalInfoAbierto} onOpenChange={setModalInfoAbierto}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{publicidadSeleccionada?.titulo || "Información"}</DialogTitle>
          </DialogHeader>
          
          {publicidadSeleccionada && (
            <div className="space-y-4">
              {publicidadSeleccionada.imagenUrl && (
                <img 
                  src={publicidadSeleccionada.imagenUrl} 
                  alt={publicidadSeleccionada.titulo || "Imagen"} 
                  className="w-full h-auto rounded-lg"
                />
              )}
              
              {publicidadSeleccionada.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {publicidadSeleccionada.descripcion}
                </p>
              )}
              
              {(publicidadSeleccionada.fechaInicio || publicidadSeleccionada.fechaFin) && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>
                    {publicidadSeleccionada.fechaInicio && format(new Date(publicidadSeleccionada.fechaInicio), "dd MMM yyyy", { locale: es })}
                    {publicidadSeleccionada.fechaFin && ` - ${format(new Date(publicidadSeleccionada.fechaFin), "dd MMM yyyy", { locale: es })}`}
                  </span>
                </div>
              )}
              
              {(publicidadSeleccionada.latitud && publicidadSeleccionada.longitud) && (
                <a 
                  href={getGoogleMapsUrl(publicidadSeleccionada.latitud, publicidadSeleccionada.longitud)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-600 hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  Ver ubicación en Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {publicidadSeleccionada.enlaceUrl && (
                <a 
                  href={publicidadSeleccionada.enlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Link2 className="h-4 w-4" />
                  Visitar sitio web
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {/* Redes sociales */}
              {(publicidadSeleccionada.facebook || publicidadSeleccionada.instagram || 
                publicidadSeleccionada.whatsapp || publicidadSeleccionada.tiktok ||
                publicidadSeleccionada.twitter || publicidadSeleccionada.youtube ||
                publicidadSeleccionada.linkedin) && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Redes sociales:</p>
                  <div className="flex flex-wrap gap-2">
                    {publicidadSeleccionada.facebook && (
                      <a href={publicidadSeleccionada.facebook} target="_blank" rel="noopener noreferrer" 
                         className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Facebook</a>
                    )}
                    {publicidadSeleccionada.instagram && (
                      <a href={publicidadSeleccionada.instagram} target="_blank" rel="noopener noreferrer"
                         className="text-xs bg-pink-600 text-white px-2 py-1 rounded">Instagram</a>
                    )}
                    {publicidadSeleccionada.whatsapp && (
                      <a href={`https://wa.me/${publicidadSeleccionada.whatsapp}`} target="_blank" rel="noopener noreferrer"
                         className="text-xs bg-green-600 text-white px-2 py-1 rounded">WhatsApp</a>
                    )}
                    {publicidadSeleccionada.tiktok && (
                      <a href={publicidadSeleccionada.tiktok} target="_blank" rel="noopener noreferrer"
                         className="text-xs bg-black text-white px-2 py-1 rounded">TikTok</a>
                    )}
                    {publicidadSeleccionada.twitter && (
                      <a href={publicidadSeleccionada.twitter} target="_blank" rel="noopener noreferrer"
                         className="text-xs bg-sky-500 text-white px-2 py-1 rounded">Twitter</a>
                    )}
                    {publicidadSeleccionada.youtube && (
                      <a href={publicidadSeleccionada.youtube} target="_blank" rel="noopener noreferrer"
                         className="text-xs bg-red-600 text-white px-2 py-1 rounded">YouTube</a>
                    )}
                    {publicidadSeleccionada.linkedin && (
                      <a href={publicidadSeleccionada.linkedin} target="_blank" rel="noopener noreferrer"
                         className="text-xs bg-blue-700 text-white px-2 py-1 rounded">LinkedIn</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
