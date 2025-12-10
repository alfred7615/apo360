import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, User, Music, LogOut, Bell, Shield, Volume2, Star, Wallet, Plus, ArrowRight, X, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAudioController } from "@/contexts/AudioControllerContext";
import { useQuery } from "@tanstack/react-query";
import SelectorAudio from "./SelectorAudio";
import ReproductorMini from "./ReproductorMini";

export default function Encabezado() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [selectorAudioAbierto, setSelectorAudioAbierto] = useState(false);
  const [billeteraAbierta, setBilleteraAbierta] = useState(false);
  
  const audio = useAudioController();

  // Query para obtener el saldo del usuario
  const { data: saldoData } = useQuery({
    queryKey: ["/api/saldos/mi-saldo"],
    enabled: isAuthenticated,
  });

  // Query para obtener las últimas recargas
  const { data: recargasData } = useQuery({
    queryKey: ["/api/solicitudes-saldo/mis-solicitudes"],
    enabled: isAuthenticated,
  });

  const saldo = (saldoData as any)?.saldo || "0.00";
  const ultimasRecargas = Array.isArray(recargasData) 
    ? recargasData.slice(0, 3) 
    : [];

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return <Badge className="bg-green-500 text-white text-xs">Aprobada</Badge>;
      case "pendiente":
        return <Badge className="bg-yellow-500 text-white text-xs">Pendiente</Badge>;
      case "rechazada":
        return <Badge variant="destructive" className="text-xs">Rechazada</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{estado}</Badge>;
    }
  };

  const enlacesMenu = [
    { titulo: "Inicio", ruta: "/" },
    { titulo: "Servicios", ruta: "/servicios" },
    { titulo: "Taxi", ruta: "/taxi" },
    { titulo: "Chat", ruta: "/chat" },
  ];

  if (user?.rol?.includes('admin')) {
    enlacesMenu.push({ titulo: "Administración", ruta: "/admin" });
  }

  const obtenerIniciales = (nombre?: string, apellido?: string) => {
    const inicial1 = nombre?.charAt(0) || '';
    const inicial2 = apellido?.charAt(0) || '';
    return (inicial1 + inicial2).toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg" data-testid="header-main">
      <div className="container mx-auto px-4">
        <div className="flex h-[40px] items-center justify-between gap-2">
          {/* Logo y nombre */}
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-1" data-testid="link-home">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2ZM12 11H19C18.86 15.1 16.31 18.7 12.5 20C12.34 20.05 12.17 20.05 12 20C11.83 20.05 11.66 20.05 11.5 20C7.69 18.7 5.14 15.1 5 11H12V4.19L18 7.41V11H12Z"/>
              </svg>
            </div>
            <span className="text-base font-bold text-white leading-tight" data-testid="text-app-name">APO-360</span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {enlacesMenu.map((enlace) => (
              <Link key={enlace.ruta} href={enlace.ruta}>
                <Button
                  variant={location === enlace.ruta ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-white ${location === enlace.ruta ? 'bg-white/30' : 'hover:bg-white/20'}`}
                  data-testid={`link-${enlace.titulo.toLowerCase()}`}
                >
                  {enlace.titulo}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2">
            {/* Selector de audio moderno */}
            <Button
              variant="ghost"
              size="icon"
              className={`text-white hover:bg-white/20 relative touch-manipulation ${audio.reproduciendo ? '' : ''}`}
              onClick={() => setSelectorAudioAbierto(true)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setSelectorAudioAbierto(true);
              }}
              data-testid="button-audio-selector"
              title="Selector de audio"
            >
              {audio.reproduciendo ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <Music className="h-5 w-5" />
              )}
              {audio.reproduciendo && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-purple-600 animate-pulse"></span>
              )}
            </Button>
            
            <SelectorAudio 
              abierto={selectorAudioAbierto} 
              onClose={() => setSelectorAudioAbierto(false)} 
            />

            {/* Botón de Billetera - solo si está autenticado */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 relative touch-manipulation"
                onClick={() => setBilleteraAbierta(true)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setBilleteraAbierta(true);
                }}
                data-testid="button-billetera"
                title="Mi Billetera"
              >
                <Wallet className="h-5 w-5" />
                {parseFloat(saldo) > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-purple-600"></span>
                )}
              </Button>
            )}

            {/* Notificaciones (solo si está autenticado) */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20"
                data-testid="button-notifications"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
              </Button>
            )}

            {/* Menú de usuario */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imagenPerfil} alt={user?.primerNombre || user?.nombre} />
                      <AvatarFallback className="bg-white/30 text-white text-sm">
                        {obtenerIniciales(user?.primerNombre, user?.apellido)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col gap-1 px-2 py-1.5">
                    <p className="text-sm font-medium" data-testid="text-user-name">
                      {user?.primerNombre || user?.nombre} {user?.apellido || ''}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer" data-testid="link-profile">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mi-panel" className="cursor-pointer" data-testid="link-mi-panel">
                      <Star className="mr-2 h-4 w-4" />
                      Mi Panel
                    </Link>
                  </DropdownMenuItem>
                  {user?.rol?.includes('admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer" data-testid="link-admin-panel">
                        <Shield className="mr-2 h-4 w-4" />
                        Panel de Administración
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer" data-testid="link-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 text-white hover:bg-white/30"
                data-testid="button-login"
              >
                <Link href="/iniciar-sesion">Iniciar Sesión</Link>
              </Button>
            )}

            {/* Menú móvil */}
            <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-2 mt-6">
                  {enlacesMenu.map((enlace) => (
                    <Link key={enlace.ruta} href={enlace.ruta}>
                      <Button
                        variant={location === enlace.ruta ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setMenuAbierto(false)}
                        data-testid={`link-mobile-${enlace.titulo.toLowerCase()}`}
                      >
                        {enlace.titulo}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <ReproductorMini onAbrirSelector={() => setSelectorAudioAbierto(true)} />

      {/* Dialog de Billetera */}
      <Dialog open={billeteraAbierta} onOpenChange={setBilleteraAbierta}>
        <DialogContent className="sm:max-w-[380px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              Mi Billetera
            </DialogTitle>
            <DialogDescription>
              Estado de cuenta y recargas recientes
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Saldo actual */}
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
              <p className="text-sm opacity-90">Saldo Disponible</p>
              <p className="text-3xl font-bold" data-testid="text-saldo-billetera">
                S/ {parseFloat(saldo).toFixed(2)}
              </p>
            </div>

            {/* Últimas 3 recargas */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Últimas Recargas
              </p>
              {ultimasRecargas.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
                  No tienes recargas recientes
                </div>
              ) : (
                <div className="space-y-2">
                  {ultimasRecargas.map((recarga: any) => (
                    <div 
                      key={recarga.id} 
                      className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                      data-testid={`recarga-item-${recarga.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">S/ {parseFloat(recarga.monto || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {recarga.createdAt ? formatearFecha(recarga.createdAt) : 'Sin fecha'}
                          </p>
                        </div>
                      </div>
                      {getEstadoBadge(recarga.estado)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex-shrink-0 pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  setBilleteraAbierta(false);
                  setLocation("/mi-panel");
                }}
                data-testid="button-billetera-entrar"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Entrar
              </Button>
              <Button
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setBilleteraAbierta(false);
                  setLocation("/mi-panel?tab=membresia&recarga=true");
                }}
                data-testid="button-billetera-recarga"
              >
                <Plus className="h-4 w-4 mr-2" />
                Recarga
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setBilleteraAbierta(false)}
              data-testid="button-billetera-salir"
            >
              <X className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
