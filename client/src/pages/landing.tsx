import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, MessageCircle, Car, ShoppingCart, Radio, AlertTriangle, Users, Store, Clock, Star, Bus, Coins, Megaphone, UserPlus, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CarruselPublicidad from "@/components/CarruselPublicidad";
import GaleriaServicios from "@/components/GaleriaServicios";
import ModuloAudio from "@/components/ModuloAudio";
import CartillasBeneficios from "@/components/CartillasBeneficios";
import FranjaEmergencia from "@/components/FranjaEmergencia";

export default function Landing() {
  const [modalRegistro, setModalRegistro] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState("");

  const abrirModalRegistro = (servicio: string) => {
    setServicioSeleccionado(servicio);
    setModalRegistro(true);
  };

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

      {/* Logos de servicios - Carrusel infinito */}
      <section className="py-4 bg-gray-100 dark:bg-gray-800/50">
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

      {/* Sección de Servicios Integrados */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Servicios Integrados</h2>
            <p className="text-muted-foreground">Todo lo que necesitas en una sola plataforma</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Botón de Pánico */}
            <div 
              onClick={() => abrirModalRegistro("Botón de Pánico")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-panico"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Botón de Pánico</h3>
              <p className="text-xs text-muted-foreground">Alerta inmediata a autoridades</p>
            </div>

            {/* Chat Comunitario */}
            <div 
              onClick={() => abrirModalRegistro("Chat Comunitario")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-chat"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Chat Comunitario</h3>
              <p className="text-xs text-muted-foreground">Comunicación en tiempo real</p>
            </div>

            {/* Servicio de Taxi */}
            <div 
              onClick={() => abrirModalRegistro("Servicio de Taxi")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-taxi"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Car className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Servicio de Taxi</h3>
              <p className="text-xs text-muted-foreground">Transporte seguro y confiable</p>
            </div>

            {/* Delivery Local */}
            <div 
              onClick={() => abrirModalRegistro("Delivery Local")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-delivery"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Delivery Local</h3>
              <p className="text-xs text-muted-foreground">Pedidos de comercios cercanos</p>
            </div>

            {/* Buses */}
            <div 
              onClick={() => abrirModalRegistro("Servicio de Buses")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-buses"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Bus className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Buses</h3>
              <p className="text-xs text-muted-foreground">Rutas y horarios en tiempo real</p>
            </div>

            {/* Moneda / Billetera */}
            <div 
              onClick={() => abrirModalRegistro("Billetera Digital")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-moneda"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Coins className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Moneda</h3>
              <p className="text-xs text-muted-foreground">Billetera digital y recargas</p>
            </div>

            {/* Avisos */}
            <div 
              onClick={() => abrirModalRegistro("Avisos Comunitarios")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-avisos"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Megaphone className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Avisos</h3>
              <p className="text-xs text-muted-foreground">Publicaciones y anuncios locales</p>
            </div>

            {/* Radio Online */}
            <div 
              onClick={() => abrirModalRegistro("Radio Online")}
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              data-testid="servicio-radio"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Radio className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Radio Online</h3>
              <p className="text-xs text-muted-foreground">Música y noticias locales 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Registro */}
      <Dialog open={modalRegistro} onOpenChange={setModalRegistro}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                <UserPlus className="h-10 w-10" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              ¡Únete a Nuestra Comunidad!
            </DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Para acceder a <span className="font-semibold text-purple-600 dark:text-purple-400">{servicioSeleccionado}</span> y todos nuestros servicios, regístrate gratis y forma parte de la comunidad más segura de Tacna.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <Heart className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm">Acceso a todos los servicios de la plataforma</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <Shield className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-sm">Protección y seguridad comunitaria 24/7</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
              <Users className="h-5 w-5 text-purple-600 shrink-0" />
              <p className="text-sm">Conecta con miles de vecinos de tu zona</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              asChild
              data-testid="button-modal-registrar"
            >
              <a href="/iniciar-sesion">
                <UserPlus className="mr-2 h-5 w-5" />
                Registrarse Gratis
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => setModalRegistro(false)}
              data-testid="button-modal-cerrar"
            >
              Quizás más tarde
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
