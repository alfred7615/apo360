import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Store, ChevronLeft, ChevronRight } from "lucide-react";
import "@/styles/carrusel-infinito.css";

interface CatalogoConItems {
  id: string;
  nombre: string;
  logoUrl: string | null;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  usuarioId: string;
  totalItems: number;
}

export default function FranjaCartasDigitales() {
  const [, setLocation] = useLocation();
  const [pausaAutoScroll, setPausaAutoScroll] = useState(false);
  const [arrastreInicio, setArrastreInicio] = useState<number | null>(null);
  const [posicionScroll, setPosicionScroll] = useState(0);
  const [seMovio, setSeMovio] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { data: catalogos = [] } = useQuery<CatalogoConItems[]>({
    queryKey: ["/api/catalogos-con-items"],
  });

  // Filtrar solo catálogos que tienen items (carta digital activa)
  const catalogosActivos = catalogos.filter(c => c.totalItems > 0);
  const necesitaCarrusel = catalogosActivos.length > 10;

  // Reanudar auto-scroll después de 5 segundos de inactividad
  useEffect(() => {
    if (pausaAutoScroll && necesitaCarrusel) {
      const timeout = setTimeout(() => {
        setPausaAutoScroll(false);
        setPosicionScroll(0);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [pausaAutoScroll, necesitaCarrusel]);

  // Capturar posición actual del track cuando se pausa
  const capturarPosicionActual = () => {
    if (trackRef.current && !pausaAutoScroll && necesitaCarrusel) {
      const computedStyle = window.getComputedStyle(trackRef.current);
      const matrix = new DOMMatrix(computedStyle.transform);
      const currentX = Math.abs(matrix.m41);
      setPosicionScroll(currentX);
    }
  };

  // Navegación con arrastre - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!necesitaCarrusel) return;
    capturarPosicionActual();
    setArrastreInicio(e.touches[0].clientX);
    setPausaAutoScroll(true);
    setSeMovio(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!necesitaCarrusel) return;
    if (arrastreInicio === null || !trackRef.current) return;
    setSeMovio(true);
    const diff = arrastreInicio - e.touches[0].clientX;
    trackRef.current.style.transform = `translateX(${-posicionScroll - diff}px)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!necesitaCarrusel) return;
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
    if (!necesitaCarrusel) return;
    e.preventDefault();
    capturarPosicionActual();
    setArrastreInicio(e.clientX);
    setPausaAutoScroll(true);
    setSeMovio(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!necesitaCarrusel) return;
    if (arrastreInicio === null || !trackRef.current) return;
    const diff = Math.abs(arrastreInicio - e.clientX);
    if (diff > 5) {
      setSeMovio(true);
    }
    const desplazamiento = arrastreInicio - e.clientX;
    trackRef.current.style.transform = `translateX(${-posicionScroll - desplazamiento}px)`;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!necesitaCarrusel) return;
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
    if (!necesitaCarrusel) return;
    if (arrastreInicio !== null && trackRef.current) {
      trackRef.current.style.transform = `translateX(${-posicionScroll}px)`;
      setArrastreInicio(null);
      setSeMovio(false);
    }
  };

  const handleClick = (catalogo: CatalogoConItems) => {
    if (!seMovio) {
      setLocation(`/carta-digital/${catalogo.id}`);
    }
  };

  if (catalogosActivos.length === 0) {
    return null; // No mostrar la franja si no hay cartas digitales
  }

  // Multiplicar items para carrusel infinito
  const itemsParaMostrar = necesitaCarrusel 
    ? [...catalogosActivos, ...catalogosActivos, ...catalogosActivos, ...catalogosActivos]
    : catalogosActivos;

  const renderCatalogo = (catalogo: CatalogoConItems, idx: number) => {
    return (
      <div
        key={`${catalogo.id}-${idx}`}
        className="flex-shrink-0 cursor-pointer hover-elevate active-elevate-2 transition-all"
        style={{ 
          marginLeft: "12px", 
          marginRight: "12px",
          width: "100px"
        }}
        onClick={() => handleClick(catalogo)}
        data-testid={`carta-digital-${catalogo.id}-${idx}`}
      >
        <div className="flex flex-col items-center">
          {catalogo.logoUrl ? (
            <img
              src={catalogo.logoUrl}
              alt={catalogo.nombre}
              className="h-[70px] w-[70px] object-cover rounded-lg shadow-md border-2 border-white/50"
              style={{ minWidth: "70px" }}
            />
          ) : (
            <div className="h-[70px] w-[70px] rounded-lg shadow-md border-2 border-white/50 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
          )}
          <span className="mt-1 text-[10px] font-medium text-center line-clamp-2 max-w-[90px]" style={{ color: "#9b2d5a" }}>
            {catalogo.nombre}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="py-4" data-testid="seccion-cartas-digitales">
      <div className="container mx-auto px-4 mb-3">
        <h2 className="text-xl font-bold text-center" style={{ color: "#9b2d5a" }}>
          Cartas Digitales
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Explora los menús de negocios locales
        </p>
      </div>
      
      <div
        ref={contenedorRef}
        className="w-full overflow-hidden border-y border-pink-200/30"
        style={{ 
          height: "120px",
          backgroundColor: "rgb(252, 231, 243)" // pink-100
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        data-testid="carousel-cartas-digitales"
      >
        <div 
          className="h-full flex items-center justify-center"
          style={{ cursor: necesitaCarrusel ? (arrastreInicio !== null ? 'grabbing' : 'grab') : 'default' }}
        >
          <div 
            ref={trackRef}
            className={`flex items-center ${necesitaCarrusel && !pausaAutoScroll ? 'carrusel-track-animado' : ''}`}
            style={{
              transform: necesitaCarrusel && pausaAutoScroll ? `translateX(${-posicionScroll}px)` : undefined,
            }}
          >
            {itemsParaMostrar.map((catalogo, idx) => renderCatalogo(catalogo, idx))}
          </div>
        </div>
      </div>
    </section>
  );
}
