import { useState } from "react";
import { AlertTriangle, Shield, Phone, Truck, Ambulance, Flame, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const TIPOS_EMERGENCIA = [
  { tipo: "policia", icono: Shield, label: "Policía", color: "bg-blue-600" },
  { tipo: "105", icono: Phone, label: "105", color: "bg-green-600" },
  { tipo: "serenazgo", icono: Shield, label: "Serenazgo", color: "bg-indigo-600" },
  { tipo: "samu", icono: Ambulance, label: "SAMU", color: "bg-red-600" },
  { tipo: "bombero", icono: Flame, label: "Bomberos", color: "bg-orange-600" },
  { tipo: "grua", icono: Truck, label: "Grúa", color: "bg-yellow-600" },
];

export default function BotonPanico() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const { toast } = useToast();

  const emergenciaMutation = useMutation({
    mutationFn: async (datos: any) => {
      return await apiRequest("POST", "/api/emergencias", datos);
    },
    onSuccess: () => {
      toast({
        title: "✓ Alerta Enviada",
        description: "Tu solicitud de auxilio ha sido enviada a las autoridades y grupos comunitarios.",
        className: "bg-success text-success-foreground",
      });
      setModalAbierto(false);
      setTipoSeleccionado("");
      setDescripcion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar alerta",
        description: error.message || "No se pudo enviar la alerta de emergencia. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const manejarClickBotonPanico = () => {
    setModalAbierto(true);
  };

  const confirmarEmergencia = () => {
    if (!tipoSeleccionado) {
      toast({
        title: "Selecciona tipo de emergencia",
        description: "Por favor selecciona el tipo de auxilio que necesitas.",
        variant: "destructive",
      });
      return;
    }

    // Obtener ubicación actual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          emergenciaMutation.mutate({
            tipo: tipoSeleccionado,
            descripcion: descripcion || "Solicitud de emergencia",
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            prioridad: "urgente",
          });
        },
        () => {
          // Si no se puede obtener ubicación, enviar sin coordenadas
          emergenciaMutation.mutate({
            tipo: tipoSeleccionado,
            descripcion: descripcion || "Solicitud de emergencia",
            latitud: 0,
            longitud: 0,
            prioridad: "urgente",
          });
        }
      );
    } else {
      // Navegador no soporta geolocalización
      emergenciaMutation.mutate({
        tipo: tipoSeleccionado,
        descripcion: descripcion || "Solicitud de emergencia",
        latitud: 0,
        longitud: 0,
        prioridad: "urgente",
      });
    }
  };

  return (
    <>
      {/* Botón de pánico flotante */}
      <button
        onClick={manejarClickBotonPanico}
        className="fixed bottom-6 right-6 z-50 flex h-20 w-20 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-2xl animate-panic-pulse hover:scale-110 active:scale-95 transition-transform"
        data-testid="button-panic"
        aria-label="Botón de pánico - Solicitar ayuda de emergencia"
      >
        <AlertTriangle className="h-10 w-10" />
      </button>

      {/* Modal de confirmación */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-panic-confirmation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <span data-testid="text-panic-title">Solicitar Auxilio</span>
            </DialogTitle>
            <DialogDescription data-testid="text-panic-description">
              Selecciona el tipo de emergencia que necesitas. Tu ubicación y alerta serán enviadas inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Advertencia */}
            <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/30">
              <p className="text-sm text-destructive font-medium">
                ⚠️ ADVERTENCIA: Usar el botón de pánico sin una emergencia real está penalizado.
              </p>
            </div>

            {/* Tipos de emergencia */}
            <div className="grid grid-cols-2 gap-3">
              {TIPOS_EMERGENCIA.map((emergencia) => {
                const Icono = emergencia.icono;
                const estaSeleccionado = tipoSeleccionado === emergencia.tipo;
                
                return (
                  <button
                    key={emergencia.tipo}
                    onClick={() => setTipoSeleccionado(emergencia.tipo)}
                    className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-all border-2 ${
                      estaSeleccionado
                        ? `${emergencia.color} text-white border-transparent shadow-lg scale-105`
                        : 'bg-card border-border hover-elevate active-elevate-2'
                    }`}
                    data-testid={`button-emergency-${emergencia.tipo}`}
                  >
                    <Icono className="h-8 w-8" />
                    <span className="text-sm font-semibold">{emergencia.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Descripción opcional */}
            <div className="space-y-2">
              <label htmlFor="descripcion-emergencia" className="text-sm font-medium">
                Descripción adicional (opcional):
              </label>
              <Textarea
                id="descripcion-emergencia"
                placeholder="Ej: Accidente de tránsito en la Av. Cultura cerca al parque central"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                data-testid="input-emergency-description"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setModalAbierto(false);
                  setTipoSeleccionado("");
                  setDescripcion("");
                }}
                className="flex-1"
                data-testid="button-cancel-emergency"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmarEmergencia}
                disabled={!tipoSeleccionado || emergenciaMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-emergency"
              >
                {emergenciaMutation.isPending ? "Enviando..." : "ACEPTAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
