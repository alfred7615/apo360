import { Button } from "@/components/ui/button";
import { Shield, MessageCircle, Car, ShoppingCart, Radio, AlertTriangle, Users, Store, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import CarruselPublicidad from "@/components/CarruselPublicidad";
import GaleriaServicios from "@/components/GaleriaServicios";
import ModuloAudio from "@/components/ModuloAudio";
import CartillasBeneficios from "@/components/CartillasBeneficios";
import FranjaEmergencia from "@/components/FranjaEmergencia";

export default function Landing() {
  const { data: estadisticas } = useQuery<{
    usuariosActivos: number;
    serviciosLocales: number;
    monitoreo24h: boolean;
    satisfaccion: number;
  }>({
    queryKey: ['/api/estadisticas/publicas'],
  });

  return (
    <div className="min-h-screen" data-testid="page-landing">
      {/* Franja de emergencia (si existe) */}
      <FranjaEmergencia />

      {/* Carrusel infinito de logos publicitarios */}
      <CarruselPublicidad tipo="carrusel_logos" />

      {/* Carrusel infinito principal de actividades */}
      <section className="py-4">
        <CarruselPublicidad tipo="carrusel_principal" />
      </section>

      {/* Logos de servicios destacados - Carrusel infinito */}
      <section className="py-4">
        <div className="container mx-auto px-4 mb-4">
          <h2 className="text-2xl font-bold text-center">Servicios Destacados</h2>
          <p className="text-muted-foreground text-center mt-2">Comercios y servicios locales de confianza</p>
        </div>
        <CarruselPublicidad tipo="logos_servicios" />
      </section>

      {/* Galería de servicios */}
      <GaleriaServicios />

      {/* Módulo de audio */}
      <section className="container mx-auto px-4 py-8">
        <ModuloAudio />
      </section>

      {/* Cartillas de beneficios */}
      <CartillasBeneficios />

      {/* Sección de Características Principales */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Servicios Integrados</h2>
            <p className="text-muted-foreground">Todo lo que necesitas en una sola plataforma</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Botón de Pánico</h3>
              <p className="text-sm text-muted-foreground">Alerta inmediata a autoridades y comunidad</p>
            </div>

            <div className="text-center group">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <MessageCircle className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Chat Comunitario</h3>
              <p className="text-sm text-muted-foreground">Comunicación en tiempo real con grupos</p>
            </div>

            <div className="text-center group">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Car className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Servicio de Taxi</h3>
              <p className="text-sm text-muted-foreground">Transporte seguro y confiable</p>
            </div>

            <div className="text-center group">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">Delivery Local</h3>
              <p className="text-sm text-muted-foreground">Pedidos de comercios cercanos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para una Comunidad Más Segura?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Únete a miles de vecinos que ya confían en SEG-APO para su seguridad y bienestar.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="bg-white text-purple-700 hover:bg-white/90 px-10 py-6 text-lg font-semibold shadow-2xl"
            data-testid="button-cta-register"
          >
            <a href="/iniciar-sesion">
              <Shield className="mr-2 h-5 w-5" />
              Registrarse Gratis
            </a>
          </Button>

          {/* Estadísticas dinámicas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-usuarios">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">{estadisticas?.usuariosActivos || 0}+</div>
              <div className="text-sm text-white/80">Usuarios Activos</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-servicios">
              <div className="flex items-center justify-center mb-2">
                <Store className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">{estadisticas?.serviciosLocales || 0}+</div>
              <div className="text-sm text-white/80">Servicios Locales</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-monitoreo">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">24/7</div>
              <div className="text-sm text-white/80">Monitoreo</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-satisfaccion">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">{estadisticas?.satisfaccion || 98}%</div>
              <div className="text-sm text-white/80">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
