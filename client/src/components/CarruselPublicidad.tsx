import { useQuery } from "@tanstack/react-query";
import { filtrarPublicidadesActivas, type Publicidad } from "@/lib/publicidadUtils";
import "@/styles/carrusel-infinito.css";

interface CarruselPublicidadProps {
  tipo: "carrusel_logos" | "carrusel_principal" | "logos_servicios";
  altura?: string;
}

export default function CarruselPublicidad({ tipo }: CarruselPublicidadProps) {
  const { data: publicidades = [] } = useQuery<Publicidad[]>({
    queryKey: ["/api/publicidad"],
  });

  const publicidadesActivas = filtrarPublicidadesActivas(
    publicidades.filter(p => p.tipo === tipo)
  );

  if (publicidadesActivas.length === 0) {
    return (
      <div
        className="w-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center"
        style={{ height: "140px" }}
        data-testid={`carousel-${tipo}-empty`}
      >
        <p className="text-muted-foreground text-sm">No hay publicidad disponible</p>
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

  return (
    <div
      className="w-full overflow-hidden bg-white dark:bg-gray-900 border-y border-border/30"
      style={{ height: "140px" }}
      data-testid={`carousel-${tipo}`}
    >
      <div className="carrusel-infinito h-full flex items-center">
        <div className="carrusel-track">
          {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx))}
          {itemsMultiplicados.map((pub, idx) => renderImagen(pub, idx + itemsMultiplicados.length))}
        </div>
      </div>
    </div>
  );
}
