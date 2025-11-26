import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, User, Music, LogOut, Bell, Shield, Radio, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useAudioController } from "@/contexts/AudioControllerContext";

export default function Encabezado() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [audioPopoverAbierto, setAudioPopoverAbierto] = useState(false);
  
  const audio = useAudioController();

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
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo y nombre */}
          <Link href="/" className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-2 py-1" data-testid="link-home">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2ZM12 11H19C18.86 15.1 16.31 18.7 12.5 20C12.34 20.05 12.17 20.05 12 20C11.83 20.05 11.66 20.05 11.5 20C7.69 18.7 5.14 15.1 5 11H12V4.19L18 7.41V11H12Z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white leading-tight" data-testid="text-app-name">SEG-APO</span>
              <span className="text-xs text-white/90 leading-tight hidden sm:block">Sistema de Seguridad</span>
            </div>
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
            {/* Selector de audio con Popover */}
            <Popover open={audioPopoverAbierto} onOpenChange={setAudioPopoverAbierto}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-white hover:bg-white/20 relative ${audio.reproduciendo ? 'animate-pulse' : ''}`}
                  data-testid="button-audio-selector"
                  title="Selector de audio"
                >
                  {audio.reproduciendo ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <Music className="h-5 w-5" />
                  )}
                  {audio.reproduciendo && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-purple-600"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid="text-audio-title">
                        {audio.tituloActual || "Sin selección"}
                      </p>
                      {audio.artistaActual && (
                        <p className="text-xs text-muted-foreground truncate">{audio.artistaActual}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {audio.tipoFuente === "radio" ? "Radio Online" : `Lista: ${audio.listaActual?.nombre || ""}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Controles de reproducción */}
                  <div className="flex items-center gap-2">
                    {audio.tipoFuente === "lista" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={audio.anteriorPista}
                        disabled={audio.archivosDeLista.length === 0}
                        data-testid="button-prev-track"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="default"
                      size="icon"
                      onClick={audio.alternarReproduccion}
                      disabled={!audio.urlActual}
                      data-testid="button-play-pause-header"
                    >
                      {audio.reproduciendo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    {audio.tipoFuente === "lista" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={audio.siguientePista}
                        disabled={audio.archivosDeLista.length === 0}
                        data-testid="button-next-track"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-1 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={audio.toggleSilencio}
                        data-testid="button-mute-header"
                      >
                        {audio.silenciado || audio.volumen === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Slider
                        value={[audio.volumen]}
                        onValueChange={(value) => audio.setVolumen(value[0])}
                        max={100}
                        step={1}
                        className="flex-1"
                        data-testid="slider-volume-header"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Tabs para seleccionar radio o lista */}
                <Tabs defaultValue="radios" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="radios" className="gap-1" data-testid="tab-radios">
                      <Radio className="h-4 w-4" />
                      Radios
                    </TabsTrigger>
                    <TabsTrigger value="listas" className="gap-1" data-testid="tab-listas">
                      <ListMusic className="h-4 w-4" />
                      Listas MP3
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="radios" className="m-0">
                    <ScrollArea className="h-48">
                      <div className="p-2 space-y-1">
                        {audio.radiosActivas.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No hay radios disponibles</p>
                        ) : (
                          audio.radiosActivas.map((radio) => (
                            <button
                              key={radio.id}
                              onClick={() => {
                                audio.seleccionarRadio(radio.id);
                              }}
                              className={`w-full flex items-center gap-2 p-2 rounded-md text-left hover-elevate ${
                                audio.radioSeleccionadaId === radio.id && audio.tipoFuente === "radio"
                                  ? "bg-primary/10 border border-primary/30"
                                  : ""
                              }`}
                              data-testid={`button-radio-${radio.id}`}
                            >
                              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                                <Radio className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{radio.nombre}</p>
                                {radio.esPredeterminada && (
                                  <span className="text-xs text-green-600">Predeterminada</span>
                                )}
                              </div>
                              {audio.radioSeleccionadaId === radio.id && audio.tipoFuente === "radio" && audio.reproduciendo && (
                                <span className="text-xs text-green-600 font-medium">En vivo</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="listas" className="m-0">
                    <ScrollArea className="h-48">
                      <div className="p-2 space-y-1">
                        {audio.listasActivas.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No hay listas disponibles</p>
                        ) : (
                          audio.listasActivas.map((lista) => (
                            <button
                              key={lista.id}
                              onClick={() => {
                                audio.seleccionarLista(lista.id);
                              }}
                              className={`w-full flex items-center gap-2 p-2 rounded-md text-left hover-elevate ${
                                audio.listaSeleccionadaId === lista.id && audio.tipoFuente === "lista"
                                  ? "bg-primary/10 border border-primary/30"
                                  : ""
                              }`}
                              data-testid={`button-lista-${lista.id}`}
                            >
                              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white shrink-0">
                                <ListMusic className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{lista.nombre}</p>
                                {lista.genero && (
                                  <span className="text-xs text-muted-foreground">{lista.genero}</span>
                                )}
                              </div>
                              {audio.listaSeleccionadaId === lista.id && audio.tipoFuente === "lista" && audio.reproduciendo && (
                                <span className="text-xs text-green-600 font-medium">Reproduciendo</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>

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
    </header>
  );
}
