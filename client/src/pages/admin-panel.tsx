import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  Menu
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
  "gestion-eventos": GestionEventosScreen,
  "gestion-taxi": GestionTaxiScreen,
  "gestion-buses": GestionBusesScreen,
  "gestion-moneda": GestionMonedaScreen,
  "gestion-configuracion": GestionConfiguracionScreen,
};

function MobileMenuContent({ 
  activeScreen, 
  setActiveScreen,
  onItemClick 
}: { 
  activeScreen: AdminScreen; 
  setActiveScreen: (screen: AdminScreen) => void;
  onItemClick?: () => void;
}) {
  const [gestionesOpen, setGestionesOpen] = useState(true);

  const handleItemClick = (id: AdminScreen) => {
    setActiveScreen(id);
    onItemClick?.();
  };

  return (
    <div className="py-4 space-y-4">
      <div className="px-3">
        <h2 className="text-lg font-bold text-primary mb-4">SEG-APO Admin</h2>
        <nav className="space-y-1">
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeScreen === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              }`}
              data-testid={`mobile-nav-${item.id}`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t pt-4">
        <Collapsible open={gestionesOpen} onOpenChange={setGestionesOpen}>
          <CollapsibleTrigger className="w-full px-3">
            <div className="flex items-center justify-between py-2 text-sm font-semibold text-primary">
              <span>GESTIONES</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${gestionesOpen ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <nav className="px-3 space-y-1 mt-2">
              {gestionesMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeScreen === item.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                  data-testid={`mobile-nav-${item.id}`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function AdminSidebar({ activeScreen, setActiveScreen }: { activeScreen: AdminScreen; setActiveScreen: (screen: AdminScreen) => void }) {
  const [gestionesOpen, setGestionesOpen] = useState(true);

  return (
    <Sidebar data-testid="sidebar-admin" className="hidden md:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary">SEG-APO Admin</SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveScreen(item.id)}
                    className={activeScreen === item.id ? "bg-sidebar-accent" : ""}
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

        <SidebarGroup>
          <Collapsible open={gestionesOpen} onOpenChange={setGestionesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel 
                className="text-base font-semibold text-primary cursor-pointer flex items-center justify-between hover:bg-sidebar-accent rounded-md px-2 py-1.5"
                data-testid="nav-gestiones-trigger"
              >
                <span>GESTIONES</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${gestionesOpen ? "rotate-180" : ""}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-2">
                <SidebarMenu>
                  {gestionesMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveScreen(item.id)}
                        className={activeScreen === item.id ? "bg-sidebar-accent" : ""}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState<AdminScreen>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const ActiveComponent = screenComponents[activeScreen];
  const currentScreenTitle = [...mainMenuItems, ...gestionesMenuItems].find(item => item.id === activeScreen)?.title || "Dashboard";

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AdminSidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-2 sm:p-3 border-b bg-card flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden flex-shrink-0"
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 overflow-y-auto">
                  <VisuallyHidden>
                    <SheetTitle>Menú de navegación</SheetTitle>
                  </VisuallyHidden>
                  <MobileMenuContent 
                    activeScreen={activeScreen} 
                    setActiveScreen={setActiveScreen}
                    onItemClick={() => setMobileMenuOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              
              <div className="hidden md:block">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">
                  <span className="hidden sm:inline">Panel Super Administrador</span>
                  <span className="sm:hidden">{currentScreenTitle}</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gestión centralizada de SEG-APO
                </p>
              </div>
            </div>
            <Badge 
              className="bg-primary text-primary-foreground flex-shrink-0 text-xs sm:text-sm" 
              data-testid="badge-role"
            >
              <span className="hidden sm:inline">Super Admin</span>
              <span className="sm:hidden">Admin</span>
            </Badge>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 bg-background">
            <div className="w-full max-w-full">
              <ActiveComponent />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
