export interface Publicidad {
  id: string;
  titulo: string | null;
  descripcion: string | null;
  tipo: string | null;
  imagenUrl: string | null;
  enlaceUrl: string | null;
  fechaInicio: Date | string | null;
  fechaFin: Date | string | null;
  fechaCaducidad: Date | string | null;
  estado: string | null;
  usuarioId: string | null;
  orden: number | null;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export function isPublicidadCaducada(publicidad: Publicidad): boolean {
  if (!publicidad.fechaCaducidad) {
    return false;
  }

  const ahora = new Date();
  const fechaCaducidad = typeof publicidad.fechaCaducidad === 'string' 
    ? new Date(publicidad.fechaCaducidad) 
    : publicidad.fechaCaducidad;
  
  return fechaCaducidad < ahora;
}

export function isPublicidadActiva(publicidad: Publicidad): boolean {
  // Si está caducada, no está activa para el portal principal
  if (isPublicidadCaducada(publicidad)) {
    return false;
  }

  if (publicidad.estado !== "activo") {
    return false;
  }

  const ahora = new Date();
  
  if (publicidad.fechaInicio) {
    const fechaInicio = typeof publicidad.fechaInicio === 'string' 
      ? new Date(publicidad.fechaInicio) 
      : publicidad.fechaInicio;
    if (fechaInicio > ahora) {
      return false;
    }
  }
  
  if (publicidad.fechaFin) {
    const fechaFin = typeof publicidad.fechaFin === 'string' 
      ? new Date(publicidad.fechaFin) 
      : publicidad.fechaFin;
    if (fechaFin < ahora) {
      return false;
    }
  }
  
  return true;
}

export function filtrarPublicidadesActivas(publicidades: Publicidad[]): Publicidad[] {
  return publicidades
    .filter(isPublicidadActiva)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

export function getGoogleMapsUrl(latitud: number, longitud: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;
}
