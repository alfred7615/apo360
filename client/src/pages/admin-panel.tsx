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
  Settings
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
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  { id: "gestion-publicidad" as AdminScreen, title: "Gestión de Publicidad", icon: Image },
  { id: "gestion-radio-mp3" as AdminScreen, title: "Radio Online y MP3", icon: Radio },
  { id: "gestion-usuarios" as AdminScreen, title: "Usuarios y Administradores", icon: Users },
  { id: "gestion-cartera" as AdminScreen, title: "Cartera y Saldos", icon: Wallet },
  { id: "gestion-encuestas" as AdminScreen, title: "Encuestas y Popups", icon: ClipboardList },
  { id: "gestion-servicios" as AdminScreen, title: "Servicios (Mudanzas, etc)", icon: Truck },
  { id: "gestion-eventos" as AdminScreen, title: "Eventos Calendarizado", icon: Calendar },
  { id: "gestion-taxi" as AdminScreen, title: "Servicio de Taxi", icon: Car },
  { id: "gestion-buses" as AdminScreen, title: "Servicio de Buses", icon: Bus },
  { id: "gestion-moneda" as AdminScreen, title: "Cambio de Moneda", icon: Coins },
  { id: "gestion-configuracion" as AdminScreen, title: "Configuración Sistema", icon: Settings },
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

function AdminSidebar({ activeScreen, setActiveScreen }: { activeScreen: AdminScreen; setActiveScreen: (screen: AdminScreen) => void }) {
  const [gestionesOpen, setGestionesOpen] = useState(true);
  const isGestionScreen = activeScreen.startsWith("gestion-");

  return (
    <Sidebar data-testid="sidebar-admin">
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

  if (!user || (user.rol !== "super_admin" && !user.rolesSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="admin-access-denied">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permiso para acceder al panel de administración.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  const ActiveComponent = screenComponents[activeScreen];

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-3 border-b bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-bold">Panel Super Administrador</h1>
                <p className="text-sm text-muted-foreground">Gestión centralizada de SEG-APO</p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground" data-testid="badge-role">Super Admin</Badge>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <ActiveComponent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
