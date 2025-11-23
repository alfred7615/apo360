import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Car, ShoppingCart, Users, MapPin, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FranjaEmergencia from "@/components/FranjaEmergencia";
import CarruselPublicidad from "@/components/CarruselPublicidad";
import GaleriaServicios from "@/components/GaleriaServicios";
import ModuloAudio from "@/components/ModuloAudio";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "No autenticado",
        description: "Redirigiendo al inicio de sesión...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const { data: emergenciasRecientes = [] } = useQuery({
    queryKey: ["/api/emergencias/recientes"],
  });

  const { data: estadisticas } = useQuery({
    queryKey: ["/api/estadisticas/usuario"],
  });

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const nombreCompleto = `${user.primerNombre || user.firstName || ''} ${user.apellido || user.lastName || ''}`.trim() || 'Usuario';

  return (
    <div className="min-h-screen pb-20" data-testid="page-home">
      <FranjaEmergencia />

      {/* Bienvenida */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-welcome">
                ¡Hola, {nombreCompleto}!
              </h1>
              <p className="text-white/90 text-lg">
                Tu comunidad está segura. {emergenciasRecientes.length > 0 && `${emergenciasRecientes.length} alertas activas en tu zona.`}
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                {user.rol || 'Usuario'}
              </Badge>
              {user.enLinea && (
                <Badge variant="secondary" className="bg-success/20 text-white border-success/30 text-sm px-3 py-1">
                  ● En Línea
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer shadow-lg" data-testid="card-quick-chat">
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto mb-3">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h3 className="font-semibold mb-1">Chat</h3>
              <p className="text-xs text-muted-foreground">Mensajes</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer shadow-lg" data-testid="card-quick-taxi">
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white mx-auto mb-3">
                <Car className="h-7 w-7" />
              </div>
              <h3 className="font-semibold mb-1">Taxi</h3>
              <p className="text-xs text-muted-foreground">Solicitar</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer shadow-lg" data-testid="card-quick-delivery">
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-3">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <h3 className="font-semibold mb-1">Delivery</h3>
              <p className="text-xs text-muted-foreground">Pedir</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer shadow-lg" data-testid="card-quick-groups">
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white mx-auto mb-3">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="font-semibold mb-1">Grupos</h3>
              <p className="text-xs text-muted-foreground">Comunidad</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Carrusel principal */}
      <section className="container mx-auto px-4 py-8">
        <CarruselPublicidad tipo="carrusel_principal" altura="400px" />
      </section>

      {/* Alertas recientes */}
      {emergenciasRecientes.length > 0 && (
        <section className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-destructive" />
                Alertas Recientes en Tu Zona
              </CardTitle>
              <CardDescription>
                Emergencias activas cerca de tu ubicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emergenciasRecientes.slice(0, 3).map((emergencia: any) => (
                  <div
                    key={emergencia.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    data-testid={`alert-${emergencia.id}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <MapPin className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm capitalize">{emergencia.tipo}</p>
                          <p className="text-xs text-muted-foreground">{emergencia.direccion || 'Ubicación aproximada'}</p>
                        </div>
                        <Badge variant={emergencia.estado === 'pendiente' ? 'destructive' : 'secondary'} className="text-xs">
                          {emergencia.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Galería de servicios */}
      <GaleriaServicios />

      {/* Módulo de audio */}
      <section className="container mx-auto px-4 py-8">
        <ModuloAudio />
      </section>
    </div>
  );
}
