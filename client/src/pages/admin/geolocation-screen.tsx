import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function GeolocationScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Geolocalización</h2>
        <p className="text-muted-foreground">
          Monitoreo de ubicaciones en tiempo real
        </p>
      </div>

      <Card data-testid="card-geolocation">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <CardTitle>Geolocalización</CardTitle>
              <CardDescription>Visualiza ubicaciones de usuarios y servicios</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Pantalla en desarrollo - Geolocalización
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
