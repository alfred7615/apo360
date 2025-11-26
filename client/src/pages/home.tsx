import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MessageCircle, Car, ShoppingCart, Users, MapPin, Bell, Calendar, Heart, AlertTriangle, X, Megaphone, UsersRound } from "lucide-react";
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
import GaleriaServicios from "@/components/GaleriaServicios";
import ModuloAudio from "@/components/ModuloAudio";
import { useQuery } from "@tanstack/react-query";
import type { Emergencia, ContactoFamiliar } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [modalAgenda, setModalAgenda] = useState(false);
  const [modalFamilia, setModalFamilia] = useState(false);
  const [modalAlertas, setModalAlertas] = useState(false);

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

  // Prioridad: ALIAS → NOMBRE (sin apellidos) → EMAIL
  const nombreMostrar = user.alias || user.nombre || user.email || 'Usuario';
  
  const contadorAgenda = 2;
  const contadorFamilia = alertasFamilia.length;
  const contadorAlertas = alertasComunidad.length || emergenciasRecientes.length;

  return (
    <div className="min-h-screen pb-20" data-testid="page-home">
      <FranjaEmergencia />

      {/* Bienvenida */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-welcome">
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

      {/* Botones de Alertas Pendientes - Solo iconos alineados a la izquierda */}
      <section className="container mx-auto px-4 -mt-10">
        <div className="flex justify-start gap-4">
          <div className="relative pb-4">
            <Button
              onClick={() => setModalAgenda(true)}
              size="icon"
              variant="outline"
              className={`h-14 w-14 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 ${
                contadorAgenda > 0 
                  ? 'bg-white dark:bg-card border-blue-300' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              data-testid="button-agenda"
            >
              <Calendar className={`h-9 w-9 ${contadorAgenda > 0 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
            {contadorAgenda > 0 && (
              <span className="absolute bottom-0 right-0 text-blue-600 font-bold text-sm">
                {contadorAgenda}
              </span>
            )}
          </div>

          <div className="relative pb-4">
            <Button
              onClick={() => setModalFamilia(true)}
              size="icon"
              variant="outline"
              className={`h-14 w-14 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 ${
                contadorFamilia > 0 
                  ? 'bg-white dark:bg-card border-pink-300' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              data-testid="button-familia"
            >
              <UsersRound className={`h-9 w-9 ${contadorFamilia > 0 ? 'text-pink-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
            {contadorFamilia > 0 && (
              <span className="absolute bottom-0 right-0 text-pink-600 font-bold text-sm">
                {contadorFamilia}
              </span>
            )}
          </div>

          <div className="relative pb-4">
            <Button
              onClick={() => setModalAlertas(true)}
              size="icon"
              variant="outline"
              className={`h-14 w-14 shadow-lg hover:shadow-xl transition-all rounded-full border-2 flex items-center justify-center p-0 ${
                contadorAlertas > 0 
                  ? 'bg-white dark:bg-card border-red-300' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-400'
              }`}
              data-testid="button-alertas"
            >
              <Megaphone className={`h-9 w-9 ${contadorAlertas > 0 ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
            {contadorAlertas > 0 && (
              <span className="absolute bottom-0 right-0 text-red-600 font-bold text-sm">
                {contadorAlertas}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="container mx-auto px-4 mt-6">
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

      {/* Carrusel de logos publicitarios */}
      <CarruselPublicidad tipo="carrusel_logos" altura="120px" />

      {/* Carrusel principal */}
      <section className="container mx-auto px-4 py-8">
        <CarruselPublicidad tipo="carrusel_principal" altura="400px" />
      </section>

      {/* Logos de servicios destacados */}
      <section className="py-6">
        <div className="container mx-auto px-4 mb-4">
          <h2 className="text-xl font-bold text-center">Servicios Recomendados</h2>
        </div>
        <CarruselPublicidad tipo="logos_servicios" altura="140px" />
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
    </div>
  );
}
