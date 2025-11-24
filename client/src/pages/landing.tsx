import { Button } from "@/components/ui/button";
import { Shield, MessageCircle, Car, ShoppingCart, Radio, AlertTriangle } from "lucide-react";
import CarruselPublicidad from "@/components/CarruselPublicidad";
import GaleriaServicios from "@/components/GaleriaServicios";
import ModuloAudio from "@/components/ModuloAudio";
import CartillasBeneficios from "@/components/CartillasBeneficios";
import FranjaEmergencia from "@/components/FranjaEmergencia";

export default function Landing() {
  return (
    <div className="min-h-screen" data-testid="page-landing">
      {/* Franja de emergencia (si existe) */}
      <FranjaEmergencia />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-2xl">
                <svg className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2ZM12 11H19C18.86 15.1 16.31 18.7 12.5 20C12.34 20.05 12.17 20.05 12 20C11.83 20.05 11.66 20.05 11.5 20C7.69 18.7 5.14 15.1 5 11H12V4.19L18 7.41V11H12Z"/>
                </svg>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
              Seguridad y Apoyo para<br />Tu Comunidad
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed" data-testid="text-hero-subtitle">
              Conecta con vecinos, servicios de emergencia y comercios locales.<br />
              Una plataforma integral que cuida de ti las 24 horas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="bg-white text-purple-700 hover:bg-white/90 px-8 py-6 text-lg font-semibold shadow-xl"
                data-testid="button-get-started"
              >
                <a href="/api/login">
                  <Shield className="mr-2 h-5 w-5" />
                  Comenzar Ahora
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg font-semibold"
                data-testid="button-learn-more"
              >
                Conocer Más
              </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">1200+</div>
                <div className="text-sm text-white/80">Usuarios Activos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">50+</div>
                <div className="text-sm text-white/80">Servicios Locales</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">24/7</div>
                <div className="text-sm text-white/80">Monitoreo</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">98%</div>
                <div className="text-sm text-white/80">Satisfacción</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-background"/>
          </svg>
        </div>
      </section>

      {/* Carrusel de logos publicitarios */}
      <CarruselPublicidad tipo="carrusel_logos" altura="120px" />

      {/* Carrusel principal de actividades */}
      <section className="container mx-auto px-4 py-12">
        <CarruselPublicidad tipo="carrusel_principal" altura="500px" />
      </section>

      {/* Logos de servicios destacados */}
      <section className="py-8">
        <div className="container mx-auto px-4 mb-6">
          <h2 className="text-2xl font-bold text-center">Servicios Destacados</h2>
          <p className="text-muted-foreground text-center mt-2">Comercios y servicios locales de confianza</p>
        </div>
        <CarruselPublicidad tipo="logos_servicios" altura="160px" />
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
            <a href="/api/login">
              <Shield className="mr-2 h-5 w-5" />
              Registrarse Gratis
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
