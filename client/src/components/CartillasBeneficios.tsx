import { Shield, MessageCircle, Smartphone, MapPin, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const CARTILLAS_DEFAULT = [
  {
    icono: Shield,
    titulo: "Seguridad 24/7",
    descripcion: "Protección constante con botón de pánico y respuesta inmediata de autoridades.",
  },
  {
    icono: MessageCircle,
    titulo: "Chat de Apoyo",
    descripcion: "Comunícate en tiempo real con tu comunidad y grupos de seguridad.",
  },
  {
    icono: Smartphone,
    titulo: "App Móvil",
    descripcion: "Accede desde cualquier lugar, en cualquier momento desde tu celular.",
  },
  {
    icono: MapPin,
    titulo: "Seguimiento GPS",
    descripcion: "Geolocalización precisa para emergencias y servicios de taxi.",
  },
  {
    icono: Users,
    titulo: "Red Comunitaria",
    descripcion: "Conéctate con vecinos y fortalece lazos de seguridad en tu zona.",
  },
  {
    icono: Zap,
    titulo: "Alertas Inmediatas",
    descripcion: "Notificaciones instantáneas ante emergencias en tu comunidad.",
  },
];

export default function CartillasBeneficios() {
  return (
    <div className="py-16 bg-gradient-to-b from-muted/30 to-background" data-testid="section-benefits">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">¿Por Qué Elegir SEG-APO?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una plataforma integral que integra seguridad, comunicación y servicios para tu comunidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARTILLAS_DEFAULT.map((cartilla, index) => {
            const Icono = cartilla.icono;
            return (
              <Card key={index} className="hover-elevate active-elevate-2 transition-all duration-300" data-testid={`card-benefit-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                      <Icono className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{cartilla.titulo}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cartilla.descripcion}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
