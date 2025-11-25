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
  Menu,
  Monitor,
  Tablet,
  Smartphone,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
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

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function ViewModeSelector({ viewMode, setViewMode }: ViewModeSelectorProps) {
  const modes: { mode: ViewMode; icon: typeof Monitor; label: string }[] = [
    { mode: "desktop", icon: Monitor, label: "Escritorio" },
    { mode: "tablet", icon: Tablet, label: "Tablet" },
    { mode: "mobile", icon: Smartphone, label: "Celular" },
  ];

  return (
    <div className="p-3 border-b">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Modo de Visualización</p>
      <div className="grid grid-cols-3 gap-1">
        {modes.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="flex flex-col h-auto py-2 px-1 gap-1"
            data-testid={`button-view-${mode}`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px]">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

interface MenuContentProps {
  activeScreen: AdminScreen;
  setActiveScreen: (screen: AdminScreen) => void;
  onItemClick?: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

function MenuContent({ 
  activeScreen, 
  setActiveScreen,
  onItemClick,
  viewMode,
  setViewMode
}: MenuContentProps) {
  const [gestionesOpen, setGestionesOpen] = useState(true);

  const handleItemClick = (id: AdminScreen) => {
    setActiveScreen(id);
    onItemClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
      
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
        <div className="px-3 mb-4">
          <h2 className="text-base font-bold text-primary mb-3">SEG-APO Admin</h2>
          <nav className="space-y-1">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeScreen === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </nav>
        </div>

        <Separator className="mx-3" />

        <div className="pt-3">
          <Collapsible open={gestionesOpen} onOpenChange={setGestionesOpen}>
            <CollapsibleTrigger className="w-full px-3">
              <div className="flex items-center justify-between py-2 text-sm font-semibold text-primary">
                <span>GESTIONES</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${gestionesOpen ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <nav className="px-3 space-y-1 mt-1">
                {gestionesMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeScreen === item.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                    data-testid={`nav-${item.id}`}
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
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const [activeScreen, setActiveScreen] = useState<AdminScreen>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="flex flex-col h-screen w-full overflow-hidden" data-testid="admin-panel">
      <header className="flex items-center justify-between gap-2 p-2 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
                data-testid="button-menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 overflow-hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Menú de navegación</SheetTitle>
              </SheetHeader>
              <MenuContent 
                activeScreen={activeScreen} 
                setActiveScreen={setActiveScreen}
                onItemClick={() => setMenuOpen(false)}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </SheetContent>
          </Sheet>
          
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
  );
}
