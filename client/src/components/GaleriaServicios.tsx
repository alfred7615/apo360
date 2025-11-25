import { useState } from "react";
import { Store, X, Phone, MapPin, Clock, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Servicio {
  id: string;
  categoria: string;
  nombreServicio: string;
  descripcion?: string;
  logoUrl?: string;
  direccion?: string;
  telefono?: string;
  horario?: string;
  estado: string;
}

interface ProductoDelivery {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  disponible: boolean;
}

const CATEGORIAS_ICONOS: Record<string, string> = {
  restaurante: "🍽️",
  farmacia: "💊",
  taller: "🔧",
  libreria: "📚",
  panaderia: "🍞",
  ferreteria: "🛠️",
  veterinaria: "🐾",
  lavanderia: "👔",
};

export default function GaleriaServicios() {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);

  const { data: servicios = [], isLoading } = useQuery<Servicio[]>({
    queryKey: ["/api/servicios"],
  });

  const { data: productos = [] } = useQuery<ProductoDelivery[]>({
    queryKey: ["/api/servicios", servicioSeleccionado?.id, "productos"],
    enabled: !!servicioSeleccionado,
  });

  const serviciosActivos = servicios.filter((s) => s.estado === "activo");

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 bg-gradient-to-b from-background to-muted/30" data-testid="section-services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Servicios Locales</h2>
            <p className="text-muted-foreground">
              Encuentra comercios y servicios cerca de ti
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
            {serviciosActivos.map((servicio) => {
              const icono = CATEGORIAS_ICONOS[servicio.categoria.toLowerCase()] || "🏪";

              return (
                <button
                  key={servicio.id}
                  onClick={() => setServicioSeleccionado(servicio)}
                  className="flex flex-col items-center gap-2 group"
                  data-testid={`button-service-${servicio.id}`}
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 overflow-hidden">
                      {servicio.logoUrl ? (
                        <img
                          src={servicio.logoUrl}
                          alt={servicio.nombreServicio}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-3xl">{icono}</span>
                      )}
                    </div>
                    {servicio.estado === "activo" && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-background" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-center line-clamp-2 max-w-[80px]">
                    {servicio.nombreServicio}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de información del servicio */}
      <Dialog open={!!servicioSeleccionado} onOpenChange={() => setServicioSeleccionado(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-service-info">
          {servicioSeleccionado && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {servicioSeleccionado.logoUrl ? (
                      <img
                        src={servicioSeleccionado.logoUrl}
                        alt={servicioSeleccionado.nombreServicio}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-3xl">
                        {CATEGORIAS_ICONOS[servicioSeleccionado.categoria.toLowerCase()] || "🏪"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl" data-testid="text-service-name">
                      {servicioSeleccionado.nombreServicio}
                    </DialogTitle>
                    <Badge variant="secondary" className="mt-1">
                      {servicioSeleccionado.categoria}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Descripción */}
                {servicioSeleccionado.descripcion && (
                  <p className="text-sm text-muted-foreground" data-testid="text-service-description">
                    {servicioSeleccionado.descripcion}
                  </p>
                )}

                {/* Información de contacto */}
                <div className="space-y-3 pt-4 border-t">
                  {servicioSeleccionado.direccion && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Dirección</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-service-address">
                          {servicioSeleccionado.direccion}
                        </p>
                      </div>
                    </div>
                  )}

                  {servicioSeleccionado.telefono && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <a
                          href={`tel:${servicioSeleccionado.telefono}`}
                          className="text-sm text-primary hover:underline"
                          data-testid="link-service-phone"
                        >
                          {servicioSeleccionado.telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {servicioSeleccionado.horario && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Horario</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-service-hours">
                          {servicioSeleccionado.horario}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de productos para delivery */}
                {productos.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Menú Delivery</h3>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {productos.map((producto) => (
                        <Card
                          key={producto.id}
                          className={`p-3 ${!producto.disponible && "opacity-50"}`}
                          data-testid={`card-product-${producto.id}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{producto.nombre}</p>
                              {producto.descripcion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {producto.descripcion}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-primary">S/ {Number(producto.precio).toFixed(2)}</p>
                              {!producto.disponible && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Agotado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="default"
                    className="flex-1"
                    data-testid="button-order-delivery"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Hacer Pedido
                  </Button>
                  {servicioSeleccionado.telefono && (
                    <Button
                      variant="outline"
                      asChild
                      data-testid="button-call-service"
                    >
                      <a href={`tel:${servicioSeleccionado.telefono}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Llamar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
