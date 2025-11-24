import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, 
  Radio, 
  Music, 
  Users, 
  UserCog, 
  Wallet, 
  CreditCard, 
  BarChart3, 
  Smartphone,
  Calendar,
  AlertTriangle,
  DollarSign,
  Truck,
  Bus
} from "lucide-react";

const dashboardSections = [
  {
    id: "publicidad",
    title: "1.1 Publicidad",
    description: "Gestión de logos, carruseles y popups publicitarios",
    icon: ImageIcon,
    actions: ["Crear", "Editar", "Eliminar", "Pausar/Reanudar"],
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "radio-online",
    title: "1.2a Radio Online",
    description: "Gestión de URLs de radios en vivo",
    icon: Radio,
    actions: ["Agregar", "Modificar", "Eliminar", "Pausar/Reanudar"],
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "listas-mp3",
    title: "1.2b Listas MP3",
    description: "Gestión de playlists por categoría",
    icon: Music,
    actions: ["Crear listas", "Agregar MP3", "Reordenar", "Pausar/Reanudar"],
    color: "text-green-600 dark:text-green-400",
  },
  {
    id: "usuarios-admin",
    title: "1.3 Usuarios y Administradores",
    description: "Gestión de usuarios y administradores de segundo nivel",
    icon: Users,
    actions: ["Ver usuarios", "Crear admin nivel 2", "Asignar roles"],
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "cartera-saldos",
    title: "1.4 Cartera y Saldos",
    description: "Configuración de costos y consulta de saldos",
    icon: Wallet,
    actions: ["Configurar porcentajes", "Ver reportes", "Métodos de pago"],
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "encuestas",
    title: "1.5a Encuestas",
    description: "Crear encuestas con preguntas e imágenes",
    icon: BarChart3,
    actions: ["Crear encuesta", "Subir imágenes", "Ver resultados en tiempo real"],
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "popups",
    title: "1.5b Popups Publicitarios",
    description: "Gestión de publicidad emergente tipo YouTube",
    icon: Smartphone,
    actions: ["Crear popup", "Configurar duración", "Opción omitir"],
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    id: "eventos",
    title: "1.6 Eventos Calendarizados",
    description: "Gestión de eventos con fechas y horarios",
    icon: Calendar,
    actions: ["Crear evento", "Editar", "Eliminar", "Ver calendario"],
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "avisos-emergencia",
    title: "1.7 Avisos de Emergencia",
    description: "Publicación de alertas y avisos urgentes",
    icon: AlertTriangle,
    actions: ["Crear aviso", "Configurar prioridad", "Programar"],
    color: "text-red-600 dark:text-red-400",
  },
  {
    id: "tipos-moneda",
    title: "1.8 Tipos de Moneda",
    description: "Gestión de monedas y tasas de cambio",
    icon: DollarSign,
    actions: ["Agregar moneda", "Actualizar tasas", "Configurar comisiones"],
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "servicios-taxi",
    title: "1.9 Servicios Taxi",
    description: "Configuración de servicio taxi estilo InDriver",
    icon: Truck,
    actions: ["Configurar tarifas", "Ver viajes", "Gestionar conductores"],
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "servicios-buses",
    title: "1.10 Servicios Buses",
    description: "Gestión de rutas y horarios de buses",
    icon: Bus,
    actions: ["Crear rutas", "Gestionar horarios", "Ver reservas"],
    color: "text-teal-600 dark:text-teal-400",
  },
];

export default function DashboardScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Panel de control con 12 secciones administrativas de SEG-APO
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardSections.map((section) => (
          <Card key={section.id} className="hover-elevate" data-testid={`card-${section.id}`}>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <section.icon className={`h-8 w-8 ${section.color}`} />
                <Button size="sm" variant="ghost" data-testid={`button-manage-${section.id}`}>
                  Gestionar
                </Button>
              </div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription className="text-sm">{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {section.actions.map((action, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs bg-muted px-2 py-1 rounded-md"
                    data-testid={`action-${section.id}-${idx}`}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
