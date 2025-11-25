import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useViewMode, ViewMode } from "@/contexts/ViewModeContext";
import { 
  AlertCircle, 
  LayoutDashboard, 
  MessageSquare, 
  MapPin, 
  Map, 
  ChevronDown,
  Image,
  Radio,
  Users,
  Wallet,
  ClipboardList,
  Truck,
  Calendar,
  Car,
  Bus,
  Coins,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  PanelLeft,
  Star,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import DashboardScreen from "@/pages/admin/dashboard-screen";
import ChatMonitorScreen from "@/pages/admin/chat-monitor-screen";
import NotificationsScreen from "@/pages/admin/notifications-screen";
import GeolocationScreen from "@/pages/admin/geolocation-screen";
import MapsScreen from "@/pages/admin/maps-screen";
import GestionPublicidadScreen from "@/pages/admin/gestiones/gestion-publicidad";
import GestionRadioMp3Screen from "@/pages/admin/gestiones/gestion-radio-mp3";
import GestionUsuariosScreen from "@/pages/admin/gestiones/gestion-usuarios";
import GestionCarteraScreen from "@/pages/admin/gestiones/gestion-cartera";
import GestionEncuestasScreen from "@/pages/admin/gestiones/gestion-encuestas";
import GestionServiciosScreen from "@/pages/admin/gestiones/gestion-servicios";
import GestionServiciosLocalesScreen from "@/pages/admin/gestiones/gestion-servicios-locales";
import GestionEventosScreen from "@/pages/admin/gestiones/gestion-eventos";
import GestionTaxiScreen from "@/pages/admin/gestiones/gestion-taxi";
import GestionBusesScreen from "@/pages/admin/gestiones/gestion-buses";
import GestionMonedaScreen from "@/pages/admin/gestiones/gestion-moneda";
import GestionConfiguracionScreen from "@/pages/admin/gestiones/gestion-configuracion";

type AdminScreen = 
  | "dashboard" 
  | "chat" 
  | "notifications" 
  | "geolocation" 
  | "maps"
  | "gestion-publicidad"
  | "gestion-radio-mp3"
  | "gestion-usuarios"
  | "gestion-cartera"
  | "gestion-encuestas"
  | "gestion-servicios"
  | "gestion-servicios-locales"
  | "gestion-eventos"
  | "gestion-taxi"
  | "gestion-buses"
  | "gestion-moneda"
  | "gestion-configuracion";

const mainMenuItems = [
  { id: "dashboard" as AdminScreen, title: "Dashboard", icon: LayoutDashboard },
  { id: "chat" as AdminScreen, title: "Chat Monitor", icon: MessageSquare },
  { id: "notifications" as AdminScreen, title: "Notificaciones", icon: AlertCircle },
  { id: "geolocation" as AdminScreen, title: "Geolocalización", icon: MapPin },
  { id: "maps" as AdminScreen, title: "Google Maps", icon: Map },
];

const gestionesMenuItems = [
  { id: "gestion-publicidad" as AdminScreen, title: "Publicidad", icon: Image },
  { id: "gestion-radio-mp3" as AdminScreen, title: "Radio/MP3", icon: Radio },
  { id: "gestion-usuarios" as AdminScreen, title: "Usuarios", icon: Users },
  { id: "gestion-cartera" as AdminScreen, title: "Cartera", icon: Wallet },
  { id: "gestion-encuestas" as AdminScreen, title: "Encuestas/Popups", icon: ClipboardList },
  { id: "gestion-servicios" as AdminScreen, title: "Servicios", icon: Truck },
  { id: "gestion-servicios-locales" as AdminScreen, title: "Servicios Locales", icon: Star },
  { id: "gestion-eventos" as AdminScreen, title: "Eventos", icon: Calendar },
  { id: "gestion-taxi" as AdminScreen, title: "Taxi", icon: Car },
  { id: "gestion-buses" as AdminScreen, title: "Buses", icon: Bus },
  { id: "gestion-moneda" as AdminScreen, title: "Moneda", icon: Coins },
  { id: "gestion-configuracion" as AdminScreen, title: "Configuración", icon: Settings },
];

const screenComponents: Record<AdminScreen, React.ComponentType> = {
  "dashboard": DashboardScreen,
  "chat": ChatMonitorScreen,
  "notifications": NotificationsScreen,
  "geolocation": GeolocationScreen,
  "maps": MapsScreen,
  "gestion-publicidad": GestionPublicidadScreen,
  "gestion-radio-mp3": GestionRadioMp3Screen,
  "gestion-usuarios": GestionUsuariosScreen,
  "gestion-cartera": GestionCarteraScreen,
  "gestion-encuestas": GestionEncuestasScreen,
  "gestion-servicios": GestionServiciosScreen,
  "gestion-servicios-locales": GestionServiciosLocalesScreen,
  "gestion-eventos": GestionEventosScreen,
  "gestion-taxi": GestionTaxiScreen,
  "gestion-buses": GestionBusesScreen,
  "gestion-moneda": GestionMonedaScreen,
  "gestion-configuracion": GestionConfiguracionScreen,
};

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function ViewModeSelector({ viewMode, setViewMode }: ViewModeSelectorProps) {
  const modes: { mode: ViewMode; icon: typeof Monitor; label: string }[] = [
    { mode: "desktop", icon: Monitor, label: "PC" },
    { mode: "tablet", icon: Tablet, label: "Tab" },
    { mode: "mobile", icon: Smartphone, label: "Cel" },
  ];

  return (
    <div className="p-2 border-b">
      <p className="text-xs text-muted-foreground mb-1 font-medium">Vista</p>
      <div className="grid grid-cols-3 gap-1">
        {modes.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="flex flex-col h-auto py-1 px-1 gap-0"
            data-testid={`button-view-${mode}`}
          >
            <Icon className="h-3 w-3" />
            <span className="text-[9px]">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  activeScreen: AdminScreen;
  setActiveScreen: (screen: AdminScreen) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  user: any;
}

const calcularNivelUsuario = (usuario: any): number => {
  if (!usuario) return 1;
  let nivel = 1;
  if (usuario.firstName && usuario.lastName && usuario.telefono && usuario.dni) nivel = 2;
  if (nivel >= 2 && usuario.pais && usuario.departamento && usuario.distrito) nivel = 3;
  if (nivel >= 3 && usuario.direccion && usuario.gpsLatitud && usuario.gpsLongitud) nivel = 4;
  if (nivel >= 4 && usuario.nombreLocal && usuario.ruc) nivel = 5;
  return nivel;
};

const renderEstrellasMini = (nivel: number) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-2.5 w-2.5 ${n <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

const getRolLabel = (rol: string) => {
  const roles: Record<string, string> = {
    super_admin: "Super Admin",
    admin_cartera: "Admin Cartera",
    admin_operaciones: "Admin Operaciones",
    admin_publicidad: "Admin Publicidad",
    admin_radio: "Admin Radio",
    supervisor: "Supervisor",
    usuario: "Usuario",
    conductor: "Conductor",
    local: "Local",
    serenazgo: "Serenazgo",
    policia: "Policía",
    bombero: "Bombero",
    samu: "SAMU",
  };
  return roles[rol] || rol;
};

function AdminSidebar({ 
  activeScreen, 
  setActiveScreen,
  viewMode,
  setViewMode,
  user
}: AdminSidebarProps) {
  const [gestionesOpen, setGestionesOpen] = useState(true);
  const { setOpenMobile } = useSidebar();

  const handleItemClick = (id: AdminScreen) => {
    setActiveScreen(id);
    setOpenMobile(false);
  };

  const nombreCompleto = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.nombre || "Usuario";
  const iniciales = nombreCompleto.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const nivelUsuario = calcularNivelUsuario(user);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-0">
        <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
        <div className="px-3 py-2">
          <h2 className="text-sm font-bold text-primary group-data-[collapsible=icon]:hidden">SEG-APO Admin</h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => handleItemClick(item.id)}
                    isActive={activeScreen === item.id}
                    tooltip={item.title}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <Collapsible open={gestionesOpen} onOpenChange={setGestionesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-xs group-data-[collapsible=icon]:justify-center">
                <span className="group-data-[collapsible=icon]:hidden">GESTIONES</span>
                <ChevronDown className={`h-3 w-3 transition-transform group-data-[collapsible=icon]:hidden ${gestionesOpen ? "rotate-180" : ""}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {gestionesMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => handleItemClick(item.id)}
                        isActive={activeScreen === item.id}
                        tooltip={item.title}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <div className="mt-auto" />
        
        <SidebarGroup className="mt-auto border-t pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div 
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                data-testid="menu-perfil-usuario"
              >
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarImage src={user?.profileImageUrl} alt={nombreCompleto} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {iniciales || <UserIcon className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-xs font-medium truncate">{nombreCompleto}</p>
                  <div className="flex items-center gap-1">
                    <Badge className="h-4 px-1 text-[9px] bg-primary/10 text-primary border-0">
                      {getRolLabel(user?.rol || "usuario")}
                    </Badge>
                    {renderEstrellasMini(nivelUsuario)}
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageUrl} alt={nombreCompleto} />
                    <AvatarFallback className="bg-primary/10 text-primary">{iniciales}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{nombreCompleto}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge className="text-[10px]">{getRolLabel(user?.rol || "usuario")}</Badge>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3 w-3 ${n <= nivelUsuario ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/perfil" className="cursor-pointer" data-testid="link-mi-perfil">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Mi Perfil
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/" className="cursor-pointer" data-testid="link-inicio">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Ir al Inicio
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/api/logout" className="cursor-pointer text-red-600" data-testid="link-cerrar-sesion">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AdminPanelContent() {
  const { user } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const [activeScreen, setActiveScreen] = useState<AdminScreen>("dashboard");

  if (!user || (user.rol !== "super_admin" && !user.rolesSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" data-testid="admin-access-denied">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permiso para acceder al panel de administración.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const ActiveComponent = screenComponents[activeScreen];
  const currentScreenTitle = [...mainMenuItems, ...gestionesMenuItems].find(item => item.id === activeScreen)?.title || "Dashboard";

  const ViewModeIcon = viewMode === "desktop" ? Monitor : viewMode === "tablet" ? Tablet : Smartphone;

  return (
    <div className="flex h-screen w-full" data-testid="admin-panel">
      <AdminSidebar 
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        user={user}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between gap-2 p-2 border-b bg-card flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger data-testid="button-menu">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Menú</span>
            </SidebarTrigger>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold truncate flex items-center gap-2">
                <ViewModeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{currentScreenTitle}</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Panel Super Administrador
              </p>
            </div>
          </div>
          <Badge 
            className="bg-primary text-primary-foreground flex-shrink-0 text-xs" 
            data-testid="badge-role"
          >
            Admin
          </Badge>
        </header>

        <main 
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 bg-background scrollbar-hide"
          data-scroll-hide="true"
        >
          <div className="w-full max-w-full">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const sidebarStyle = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties} defaultOpen={true}>
      <AdminPanelContent />
    </SidebarProvider>
  );
}
