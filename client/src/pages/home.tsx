import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MessageCircle, Car, ShoppingCart, Users, MapPin, Bell, Calendar, Heart, AlertTriangle, X, Megaphone, UsersRound, Bus, Coins, Construction, Share2, Shield, Radio, Accessibility, CircleDot, Store, Clock, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FranjaEmergencia from "@/components/FranjaEmergencia";
import CarruselPublicidad from "@/components/CarruselPublicidad";
import GaleriaServiciosLocales from "@/components/GaleriaServiciosLocales";
import ModuloAudio from "@/components/ModuloAudio";
import CartillasBeneficios from "@/components/CartillasBeneficios";
import BannerActivarAudio from "@/components/BannerActivarAudio";
import { CalculadoraCambio } from "@/components/CalculadoraCambio";
import { useQuery } from "@tanstack/react-query";
import type { Emergencia, ContactoFamiliar } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [modalAgenda, setModalAgenda] = useState(false);
  const [modalFamilia, setModalFamilia] = useState(false);
  const [modalAlertas, setModalAlertas] = useState(false);
  const [modalTaxi, setModalTaxi] = useState(false);
  const [modalBuses, setModalBuses] = useState(false);
  const [modalDelivery, setModalDelivery] = useState(false);
  const [modalAvisos, setModalAvisos] = useState(false);
  const [modalMoneda, setModalMoneda] = useState(false);

  const { data: emergenciasRecientes = [] } = useQuery<Emergencia[]>({
    queryKey: ["/api/emergencias/recientes"],
  });

  const { data: contactosFamiliares = [] } = useQuery<ContactoFamiliar[]>({
    queryKey: ["/api/contactos-familiares"],
    enabled: !!user,
  });

  const { data: alertasFamilia = [] } = useQuery<Emergencia[]>({
    queryKey: ["/api/emergencias/familia"],
    enabled: !!user,
  });

  const { data: alertasComunidad = [] } = useQuery<Emergencia[]>({
    queryKey: ["/api/emergencias/comunidad"],
    enabled: !!user,
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

  // Prioridad: ALIAS → NOMBRE (solo primer nombre, sin apellidos) → EMAIL
  const nombreMostrar = user.alias || user.nombre || user.email || 'Usuario';
  
  const contadorAgenda = 2;
  const contadorFamilia = alertasFamilia.length;
  const contadorAlertas = alertasComunidad.length || emergenciasRecientes.length;

  return (
    <div className="min-h-screen pb-20" data-testid="page-home">
      <FranjaEmergencia />

      {/* Carrusel de logos publicitarios - Arriba del saludo */}
      <CarruselPublicidad tipo="carrusel_logos" />

      {/* Bienvenida - Altura fija 170px con botones de alerta */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white relative" style={{ height: '170px', paddingBottom: '70px' }}>
        {/* Botones de Alertas - Escritorio: horizontal superior derecha */}
        <div className="hidden lg:flex absolute top-4 right-4 gap-2">
          <div className="relative">
            <Button
              onClick={() => setModalAgenda(true)}
              size="icon"
              variant="outline"
              className={`h-12 w-12 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 ${
                contadorAgenda > 0 
                  ? 'bg-white dark:bg-card border-blue-300' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              data-testid="button-agenda"
            >
              <Calendar className={`h-7 w-7 ${contadorAgenda > 0 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
            {contadorAgenda > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {contadorAgenda}
              </span>
            )}
          </div>

          <div className="relative">
            <Button
              onClick={() => setModalFamilia(true)}
              size="icon"
              variant="outline"
              className={`h-12 w-12 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 ${
                contadorFamilia > 0 
                  ? 'bg-white dark:bg-card border-pink-300' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              data-testid="button-familia"
            >
              <UsersRound className={`h-7 w-7 ${contadorFamilia > 0 ? 'text-pink-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
            {contadorFamilia > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {contadorFamilia}
              </span>
            )}
          </div>

          <div className="relative">
            <Button
              onClick={() => setModalAlertas(true)}
              size="icon"
              variant="outline"
              className={`h-12 w-12 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 ${
                contadorAlertas > 0 
                  ? 'bg-white dark:bg-card border-red-300' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              data-testid="button-alertas"
            >
              <Megaphone className={`h-7 w-7 ${contadorAlertas > 0 ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
            {contadorAlertas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {contadorAlertas}
              </span>
            )}
          </div>
        </div>

        {/* Botones de Alertas - Tablet/Móvil: solo mostrar si contador > 0 */}
        <div className="lg:hidden absolute top-4 right-4 flex gap-2">
          {contadorAgenda > 0 && (
            <div className="relative">
              <Button
                onClick={() => setModalAgenda(true)}
                size="icon"
                variant="outline"
                className="h-12 w-12 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 bg-white dark:bg-card border-blue-300"
                data-testid="button-agenda-mobile"
              >
                <Calendar className="h-7 w-7 text-blue-600" />
              </Button>
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {contadorAgenda}
              </span>
            </div>
          )}

          {contadorFamilia > 0 && (
            <div className="relative">
              <Button
                onClick={() => setModalFamilia(true)}
                size="icon"
                variant="outline"
                className="h-12 w-12 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 bg-white dark:bg-card border-pink-300"
                data-testid="button-familia-mobile"
              >
                <UsersRound className="h-7 w-7 text-pink-600" />
              </Button>
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {contadorFamilia}
              </span>
            </div>
          )}

          {contadorAlertas > 0 && (
            <div className="relative">
              <Button
                onClick={() => setModalAlertas(true)}
                size="icon"
                variant="outline"
                className="h-12 w-12 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 bg-white dark:bg-card border-red-300"
                data-testid="button-alertas-mobile"
              >
                <Megaphone className="h-7 w-7 text-red-600" />
              </Button>
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {contadorAlertas}
              </span>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 h-full flex items-center justify-start pt-4">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-1" data-testid="text-welcome">
              ¡Hola, {nombreMostrar}!
            </h1>
            <p className="text-white/95 text-xl font-medium">
              Tu comunidad está segura
            </p>
            <p className="text-white/80 text-lg">
              Juntos somos invencibles
            </p>
          </div>
        </div>
      </section>

      {/* Accesos rápidos - 6 escritorio, 4 tablet, 3 celular - Altura 100px, 20px encima del saludo */}
      <section className="container mx-auto px-4" style={{ marginTop: '-20px' }}>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Chat */}
          <div 
            onClick={() => setLocation("/chat")}
            className="hover-elevate active-elevate-2 transition-all cursor-pointer rounded-lg text-center flex flex-col items-center justify-center border-2 border-blue-500"
            style={{ backgroundColor: "rgb(219, 234, 254)", boxShadow: "0 6px 20px rgba(30, 64, 175, 0.5)", height: "100px" }}
            data-testid="card-quick-chat"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white mb-1">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-sm">Chat</h3>
          </div>

          {/* Taxi */}
          <div 
            onClick={() => setModalTaxi(true)}
            className="hover-elevate active-elevate-2 transition-all cursor-pointer rounded-lg text-center flex flex-col items-center justify-center border-2 border-blue-500"
            style={{ backgroundColor: "rgb(219, 234, 254)", boxShadow: "0 6px 20px rgba(30, 64, 175, 0.5)", height: "100px" }}
            data-testid="card-quick-taxi"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white mb-1">
              <Car className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-sm">Taxi</h3>
          </div>

          {/* Delivery */}
          <div 
            onClick={() => setModalDelivery(true)}
            className="hover-elevate active-elevate-2 transition-all cursor-pointer rounded-lg text-center flex flex-col items-center justify-center border-2 border-blue-500"
            style={{ backgroundColor: "rgb(219, 234, 254)", boxShadow: "0 6px 20px rgba(30, 64, 175, 0.5)", height: "100px" }}
            data-testid="card-quick-delivery"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-1">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-sm">Delivery</h3>
          </div>

          {/* Buses */}
          <div 
            onClick={() => setModalBuses(true)}
            className="hover-elevate active-elevate-2 transition-all cursor-pointer rounded-lg text-center flex flex-col items-center justify-center border-2 border-blue-500"
            style={{ backgroundColor: "rgb(219, 234, 254)", boxShadow: "0 6px 20px rgba(30, 64, 175, 0.5)", height: "100px" }}
            data-testid="card-quick-buses"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-1">
              <Bus className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-sm">Buses</h3>
          </div>

          {/* Moneda */}
          <div 
            onClick={() => setModalMoneda(true)}
            className="hover-elevate active-elevate-2 transition-all cursor-pointer rounded-lg text-center flex flex-col items-center justify-center border-2 border-blue-500"
            style={{ backgroundColor: "rgb(219, 234, 254)", boxShadow: "0 6px 20px rgba(30, 64, 175, 0.5)", height: "100px" }}
            data-testid="card-quick-moneda"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white mb-1">
              <Coins className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-sm">Moneda</h3>
          </div>

          {/* Avisos */}
          <div 
            onClick={() => setModalAvisos(true)}
            className="hover-elevate active-elevate-2 transition-all cursor-pointer rounded-lg text-center flex flex-col items-center justify-center border-2 border-blue-500"
            style={{ backgroundColor: "rgb(219, 234, 254)", boxShadow: "0 6px 20px rgba(30, 64, 175, 0.5)", height: "100px" }}
            data-testid="card-quick-avisos"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white mb-1">
              <Megaphone className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-sm">Avisos</h3>
          </div>
        </div>
      </section>

      {/* Carrusel principal */}
      <section className="container mx-auto px-4 py-8">
        <CarruselPublicidad tipo="carrusel_principal" />
      </section>

      {/* Logos de servicios destacados */}
      <section className="py-6">
        <div className="container mx-auto px-4 mb-4">
          <h2 className="text-xl font-bold text-center">Servicios Recomendados</h2>
        </div>
        <CarruselPublicidad tipo="logos_servicios" />
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

      {/* Galería de servicios locales - Categorías, Subcategorías y Logos */}
      <GaleriaServiciosLocales />

      {/* Módulo de audio */}
      <section className="container mx-auto px-4 py-8">
        <ModuloAudio />
      </section>

      {/* Cartillas de beneficios - Por Qué Elegir APO-360 */}
      <CartillasBeneficios />

      {/* Sección de Servicios Integrados */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Servicios Integrados</h2>
            <p className="text-muted-foreground">Todo lo que necesitas en una sola plataforma</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Botón de Pánico */}
            <div 
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              onClick={() => toast({ title: "Botón de Pánico", description: "Usa el botón flotante rojo en pantalla para emergencias" })}
              data-testid="servicio-panico-home"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Botón de Pánico</h3>
              <p className="text-xs text-muted-foreground">Alerta inmediata</p>
            </div>

            {/* Chat Comunitario */}
            <div 
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              onClick={() => setLocation("/chat")}
              data-testid="servicio-chat-home"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Chat Comunitario</h3>
              <p className="text-xs text-muted-foreground">Tiempo real</p>
            </div>

            {/* Servicio de Taxi */}
            <div 
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              onClick={() => setModalTaxi(true)}
              data-testid="servicio-taxi-home"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Car className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Servicio de Taxi</h3>
              <p className="text-xs text-muted-foreground">Transporte seguro</p>
            </div>

            {/* Delivery Local */}
            <div 
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              onClick={() => setModalDelivery(true)}
              data-testid="servicio-delivery-home"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Delivery Local</h3>
              <p className="text-xs text-muted-foreground">Pedidos cercanos</p>
            </div>

            {/* Radio Online */}
            <div 
              className="text-center group cursor-pointer hover-elevate active-elevate-2 p-4 rounded-xl transition-all"
              onClick={() => toast({ title: "Radio Online", description: "Usa el módulo de audio en la parte superior" })}
              data-testid="servicio-radio-home"
            >
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <Radio className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="font-semibold mb-1 text-sm sm:text-base">Radio Online</h3>
              <p className="text-xs text-muted-foreground">Música 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final - Compartir Sitio */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">¿Listo para una Comunidad Más Segura?</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Comparte APO-360 con tus amigos y familiares para fortalecer la seguridad de toda la comunidad.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-purple-700 hover:bg-white/90 px-10 py-6 text-lg font-semibold shadow-2xl"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "APO-360 - Seguridad Comunitaria",
                  text: "Únete a la comunidad más segura de Tacna. ¡Regístrate gratis!",
                  url: window.location.origin,
                });
              } else {
                navigator.clipboard.writeText(window.location.origin);
                toast({
                  title: "¡Enlace copiado!",
                  description: "Comparte este enlace con tus amigos y familiares",
                });
              }
            }}
            data-testid="button-compartir-sitio"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Compartir Sitio con Amigos
          </Button>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-usuarios-home">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">500+</div>
              <div className="text-sm text-white/80">Usuarios Activos</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-servicios-home">
              <div className="flex items-center justify-center mb-2">
                <Store className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">50+</div>
              <div className="text-sm text-white/80">Servicios Locales</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-monitoreo-home">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">24/7</div>
              <div className="text-sm text-white/80">Monitoreo</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4" data-testid="stat-satisfaccion-home">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 mr-2" />
              </div>
              <div className="text-4xl font-bold mb-1">98%</div>
              <div className="text-sm text-white/80">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Agenda */}
      <Dialog open={modalAgenda} onOpenChange={setModalAgenda}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Mi Agenda
            </DialogTitle>
            <DialogDescription>
              Próximos eventos y actividades
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="font-medium text-sm">Reunión de Vecinos</p>
              <p className="text-xs text-muted-foreground">Hoy, 18:00 - Plaza Central</p>
            </div>
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="font-medium text-sm">Junta de Seguridad</p>
              <p className="text-xs text-muted-foreground">Mañana, 10:00 - Municipalidad</p>
            </div>
            <p className="text-xs text-center text-muted-foreground pt-4">
              Próximamente: Sincronización con Google Calendar
            </p>
          </div>
          <div className="pt-2 border-t">
            <Button onClick={() => setModalAgenda(false)} className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Familia */}
      <Dialog open={modalFamilia} onOpenChange={setModalFamilia}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Mi Familia
            </DialogTitle>
            <DialogDescription>
              Chat privado con tus contactos familiares
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {contactosFamiliares.length > 0 ? (
              contactosFamiliares.map((contacto: any) => (
                <div
                  key={contacto.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setModalFamilia(false);
                    toast({
                      title: "Chat privado",
                      description: `Abriendo chat con ${contacto.nombre}...`,
                    });
                  }}
                >
                  <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{contacto.nombre}</p>
                    <p className="text-xs text-muted-foreground">{contacto.relacion || 'Familiar'}</p>
                  </div>
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tienes contactos familiares</p>
                <Button
                  variant="ghost"
                  className="mt-2 text-primary"
                  onClick={() => {
                    setModalFamilia(false);
                    setLocation("/perfil");
                  }}
                >
                  Agregar contactos
                </Button>
              </div>
            )}
          </div>
          <div className="pt-2 border-t">
            <Button onClick={() => setModalFamilia(false)} variant="outline" className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Alertas Comunidad */}
      <Dialog open={modalAlertas} onOpenChange={setModalAlertas}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertas de la Comunidad
            </DialogTitle>
            <DialogDescription>
              Emergencias activas en tu zona y grupos
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {(alertasComunidad.length > 0 || emergenciasRecientes.length > 0) ? (
              [...alertasComunidad, ...emergenciasRecientes.filter(e => 
                !alertasComunidad.some(a => a.id === e.id)
              )].map((emergencia: Emergencia & { grupoId?: string; grupoNombre?: string }) => (
                <div
                  key={emergencia.id}
                  data-testid={`row-alerta-${emergencia.id}`}
                  className="p-3 rounded-lg border bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">{emergencia.tipo}</p>
                      <p className="text-xs text-muted-foreground">{emergencia.direccion || 'Ubicación aproximada'}</p>
                      {emergencia.descripcion && (
                        <p className="text-xs mt-1">{emergencia.descripcion}</p>
                      )}
                      {emergencia.grupoNombre && (
                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {emergencia.grupoNombre}
                        </p>
                      )}
                    </div>
                    <Badge variant={emergencia.estado === 'pendiente' ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                      {emergencia.estado}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      data-testid={`button-alerta-ir-chat-${emergencia.id}`}
                      onClick={() => {
                        setModalAlertas(false);
                        if (emergencia.grupoId) {
                          setLocation(`/chat?grupo=${emergencia.grupoId}`);
                        } else {
                          setLocation("/chat");
                        }
                      }}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Ir al Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      data-testid={`button-alerta-ver-${emergencia.id}`}
                      onClick={() => {
                        toast({
                          title: "Ubicación",
                          description: emergencia.direccion || "Ver en el mapa",
                        });
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No hay alertas activas</p>
                <p className="text-xs text-muted-foreground mt-1">Tu comunidad está tranquila</p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t flex gap-2">
            <Button 
              onClick={() => {
                setModalAlertas(false);
                setLocation("/chat");
              }} 
              variant="default" 
              className="flex-1"
              data-testid="button-ver-todos-grupos"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ver todos los grupos
            </Button>
            <Button 
              onClick={() => setModalAlertas(false)} 
              variant="outline"
              data-testid="button-cerrar-alertas"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Taxi - Selección de Rol */}
      <Dialog open={modalTaxi} onOpenChange={setModalTaxi}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Car className="h-6 w-6 text-yellow-600" />
              Taxi
            </DialogTitle>
            <DialogDescription className="text-center">
              Selecciona tu rol
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => {
                setModalTaxi(false);
                setLocation("/taxi-conductor");
              }}
              variant="outline"
              className="h-24 flex-col gap-2"
              data-testid="button-taxi-conductor"
            >
              <Car className="h-8 w-8 text-yellow-600" />
              <span>Conductor</span>
            </Button>
            <Button
              onClick={() => {
                setModalTaxi(false);
                setLocation("/taxi-pasajero");
              }}
              variant="outline"
              className="h-24 flex-col gap-2"
              data-testid="button-taxi-pasajero"
            >
              <Users className="h-8 w-8 text-yellow-600" />
              <span>Pasajero</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Buses - Selección de Rol */}
      <Dialog open={modalBuses} onOpenChange={setModalBuses}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Bus className="h-6 w-6 text-orange-600" />
              Buses
            </DialogTitle>
            <DialogDescription className="text-center">
              Selecciona tu rol
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => {
                setModalBuses(false);
                setLocation("/buses-conductor");
              }}
              variant="outline"
              className="h-24 flex-col gap-2"
              data-testid="button-buses-conductor"
            >
              <Bus className="h-8 w-8 text-orange-600" />
              <span>Conductor</span>
            </Button>
            <Button
              onClick={() => {
                setModalBuses(false);
                setLocation("/buses-pasajero");
              }}
              variant="outline"
              className="h-24 flex-col gap-2"
              data-testid="button-buses-pasajero"
            >
              <Users className="h-8 w-8 text-orange-600" />
              <span>Pasajero</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Delivery - En Construcción */}
      <Dialog open={modalDelivery} onOpenChange={setModalDelivery}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              Delivery
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto mb-4">
              <Construction className="h-10 w-10" />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-1">
                EN CONSTRUCCIÓN
              </p>
              <p className="text-sm text-muted-foreground">
                Pronto a su servicio
              </p>
            </div>
          </div>
          <Button onClick={() => setModalDelivery(false)} className="w-full" data-testid="button-cerrar-delivery">
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal Avisos - En Construcción */}
      <Dialog open={modalAvisos} onOpenChange={setModalAvisos}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <Megaphone className="h-6 w-6 text-purple-600" />
              Avisos
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white mx-auto mb-4">
              <Construction className="h-10 w-10" />
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-1">
                EN CONSTRUCCIÓN
              </p>
              <p className="text-sm text-muted-foreground">
                GRACIAS, pronto a su servicio
              </p>
            </div>
          </div>
          <Button onClick={() => setModalAvisos(false)} className="w-full" data-testid="button-cerrar-avisos">
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Modal Calculadora de Cambio */}
      <Dialog open={modalMoneda} onOpenChange={setModalMoneda}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border-gray-700/50">
          <DialogHeader className="p-5 pb-0 border-b border-gray-700/50">
            <DialogTitle className="flex items-center gap-3 justify-center text-gray-100">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20">
                <Coins className="h-5 w-5 text-rose-400" />
              </div>
              Cambio de Moneda
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Calcula el tipo de cambio entre monedas
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            <CalculadoraCambio sinCard />
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner para activar audio - disponible para todos */}
      <BannerActivarAudio />
    </div>
  );
}
