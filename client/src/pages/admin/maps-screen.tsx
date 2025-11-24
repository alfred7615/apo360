import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function MapsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Google Maps</h2>
        <p className="text-muted-foreground">
          Mapa ampliado con visualización completa
        </p>
      </div>

      <Card data-testid="card-maps">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Map className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <CardTitle>Google Maps Ampliado</CardTitle>
              <CardDescription>Vista de mapa a pantalla completa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Pantalla en desarrollo - Google Maps
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
