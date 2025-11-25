import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PublicidadSection from "@/components/admin/publicidad-section";
import { Image } from "lucide-react";

export default function GestionPublicidadScreen() {
  return (
    <div className="space-y-6" data-testid="screen-gestion-publicidad">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Image className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Publicidad</h2>
          <p className="text-muted-foreground">Administra logos, carruseles y popups con información de redes sociales</p>
        </div>
      </div>
      
      <PublicidadSection />
    </div>
  );
}
