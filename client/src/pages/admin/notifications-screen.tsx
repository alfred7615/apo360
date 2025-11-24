import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notificaciones</h2>
        <p className="text-muted-foreground">
          Gestión de notificaciones push y alertas del sistema
        </p>
      </div>

      <Card data-testid="card-notifications">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <CardTitle>Sistema de Notificaciones</CardTitle>
              <CardDescription>Envía y gestiona notificaciones a usuarios</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Pantalla en desarrollo - Notificaciones
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
