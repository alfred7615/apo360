import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { AudioControllerProvider } from "@/contexts/AudioControllerContext";
import Encabezado from "@/components/Encabezado";
import BotonPanico from "@/components/BotonPanico";
import PiePagina from "@/components/PiePagina";
import SolicitudPermisos from "@/components/SolicitudPermisos";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Perfil from "@/pages/perfil";
import Registro from "@/pages/registro";
import IniciarSesion from "@/pages/iniciar-sesion";
import AdminPanel from "@/pages/admin-panel";
import Favoritos from "@/pages/favoritos";
import PanelUsuario from "@/pages/panel-usuario";
import TaxiConductor from "@/pages/taxi-conductor";
import TaxiPasajero from "@/pages/taxi-pasajero";
import BusesConductor from "@/pages/buses-conductor";
import BusesPasajero from "@/pages/buses-pasajero";
import Billetera from "@/pages/billetera";
import CalculadoraCambio from "@/pages/calculadora-cambio";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/home" component={Home} />
      <Route path="/iniciar-sesion" component={IniciarSesion} />
      <Route path="/login" component={IniciarSesion} />
      <Route path="/registro" component={Registro} />
      <Route path="/chat" component={Chat} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/favoritos" component={Favoritos} />
      <Route path="/mi-panel" component={PanelUsuario} />
      <Route path="/panel-usuario" component={PanelUsuario} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/taxi-conductor" component={TaxiConductor} />
      <Route path="/taxi-pasajero" component={TaxiPasajero} />
      <Route path="/buses-conductor" component={BusesConductor} />
      <Route path="/buses-pasajero" component={BusesPasajero} />
      <Route path="/billetera" component={Billetera} />
      <Route path="/calculadora-cambio" component={CalculadoraCambio} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  const esRutaAdmin = location.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      <Encabezado />
      <main className="flex-1">
        <Router />
      </main>
      {!esRutaAdmin && <PiePagina />}
      {isAuthenticated && !esRutaAdmin && <BotonPanico />}
      {isAuthenticated && !esRutaAdmin && <SolicitudPermisos />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ViewModeProvider>
          <AudioControllerProvider>
            <AppContent />
            <Toaster />
          </AudioControllerProvider>
        </ViewModeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
