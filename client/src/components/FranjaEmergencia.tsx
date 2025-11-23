import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function FranjaEmergencia() {
  const [cerrado, setCerrado] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["/api/configuracion/franja_emergencia"],
  });

  const mensajeEmergencia = config?.valor;

  if (!mensajeEmergencia || cerrado) {
    return null;
  }

  return (
    <div className="bg-destructive text-destructive-foreground" data-testid="banner-emergency">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
            <p className="font-semibold text-sm md:text-base" data-testid="text-emergency-message">
              {mensajeEmergencia}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-destructive-foreground hover:bg-destructive-foreground/20"
            onClick={() => setCerrado(true)}
            data-testid="button-close-emergency-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
