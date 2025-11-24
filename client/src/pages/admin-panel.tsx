import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, LayoutDashboard, MessageSquare, MapPin, Users as UsersIcon, Map } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import DashboardScreen from "./admin/dashboard-screen";
import ChatMonitorScreen from "./admin/chat-monitor-screen";
import NotificationsScreen from "./admin/notifications-screen";
import GeolocationScreen from "./admin/geolocation-screen";
import MapsScreen from "./admin/maps-screen";

type AdminScreen = "dashboard" | "chat" | "notifications" | "geolocation" | "maps";

const menuItems = [
  {
    id: "dashboard" as AdminScreen,
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "chat" as AdminScreen,
    title: "Chat Monitor",
    icon: MessageSquare,
  },
  {
    id: "notifications" as AdminScreen,
    title: "Notificaciones",
    icon: AlertCircle,
  },
  {
    id: "geolocation" as AdminScreen,
    title: "Geolocalización",
    icon: MapPin,
  },
  {
    id: "maps" as AdminScreen,
    title: "Google Maps",
    icon: Map,
  },
];

function AdminSidebar({ activeScreen, setActiveScreen }: { activeScreen: AdminScreen; setActiveScreen: (screen: AdminScreen) => void }) {
  return (
    <Sidebar data-testid="sidebar-admin">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary">SEG-APO Admin</SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {menuItems.map((item) => (
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
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

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
            {activeScreen === "dashboard" && <DashboardScreen />}
            {activeScreen === "chat" && <ChatMonitorScreen />}
            {activeScreen === "notifications" && <NotificationsScreen />}
            {activeScreen === "geolocation" && <GeolocationScreen />}
            {activeScreen === "maps" && <MapsScreen />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
