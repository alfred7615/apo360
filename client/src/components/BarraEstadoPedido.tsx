import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, Clock, ChefHat, Package, Truck, CheckCircle2, X, MapPin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Pedido {
  id: string;
  numeroPedido?: string;
  estado: string;
  tipoEntrega?: string;
  localComercialId?: string;
  nombreLocal?: string;
  createdAt: string;
}

const ESTADOS_CLIENTE = [
  { key: "pendiente", label: "RECIBIDO", icon: Clock },
  { key: "aceptado", label: "ACEPTADO", icon: Check },
  { key: "preparando", label: "PREPARANDO", icon: ChefHat },
  { key: "listo", label: "LISTO", icon: Package },
  { key: "en_camino", label: "EN CAMINO", icon: Truck },
  { key: "entregado", label: "ENTREGADO", icon: CheckCircle2 },
  { key: "confirmado", label: "COMPLETADO", icon: CheckCircle2 },
];

export default function BarraEstadoPedido() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAgradecimiento, setShowAgradecimiento] = useState(false);
  const [pedidoCompletado, setPedidoCompletado] = useState<Pedido | null>(null);

  // Obtener pedidos activos del usuario (no confirmados ni cancelados)
  const { data: pedidosActivos = [] } = useQuery<Pedido[]>({
    queryKey: ["/api/mis-pedidos/activos"],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refrescar cada 10 segundos
  });

  const pedidoActivo = pedidosActivos.length > 0 ? pedidosActivos[0] : null;

  // Mutación para confirmar recepción (cliente confirma que recibió el pedido)
  const confirmarRecepcionMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      return apiRequest("PATCH", `/api/mis-pedidos/${pedidoId}/confirmar`);
    },
    onSuccess: (_, pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mis-pedidos/activos"] });
      // Mostrar mensaje de agradecimiento
      setPedidoCompletado(pedidoActivo);
      setShowAgradecimiento(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar la recepción",
        variant: "destructive",
      });
    },
  });

  const handleConfirmarRecepcion = () => {
    if (pedidoActivo) {
      confirmarRecepcionMutation.mutate(pedidoActivo.id);
    }
  };

  const handleCerrarAgradecimiento = () => {
    setShowAgradecimiento(false);
    setPedidoCompletado(null);
  };

  // No mostrar si no hay pedido activo o no está autenticado
  if (!isAuthenticated || !pedidoActivo) {
    return null;
  }

  const estadoActual = pedidoActivo.estado || "pendiente";
  const indiceEstado = ESTADOS_CLIENTE.findIndex(e => e.key === estadoActual);
  // Asumimos delivery por defecto si no está especificado, o si es "recoger" o "local"
  const esParaRecoger = pedidoActivo.tipoEntrega === "recoger" || pedidoActivo.tipoEntrega === "local";

  // Determinar el texto del botón de acción para el cliente
  const getBotonAccion = () => {
    if (estadoActual === "entregado") {
      return {
        texto: "RECIBÍ CONFORME",
        accion: handleConfirmarRecepcion,
        habilitado: true,
      };
    }
    return null;
  };

  const botonAccion = getBotonAccion();

  // Determinar el mensaje de estado
  const getMensajeEstado = () => {
    switch (estadoActual) {
      case "pendiente":
        return "Esperando que el negocio acepte tu pedido...";
      case "aceptado":
        return "El negocio ha aceptado tu pedido";
      case "preparando":
        return "Tu pedido está siendo preparado";
      case "listo":
        return esParaRecoger 
          ? "¡Tu pedido está listo para recoger en el local!" 
          : "Tu pedido está listo, esperando al delivery";
      case "en_camino":
        return "El delivery está en camino con tu pedido";
      case "entregado":
        return "Tu pedido ha sido entregado. Confirma la recepción";
      case "confirmado":
        return "Pedido completado";
      default:
        return "";
    }
  };

  return (
    <>
      <div 
        className="w-full h-5 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between px-2 text-white text-[10px] font-medium shadow-sm sticky top-12 z-40"
        data-testid="barra-estado-pedido"
      >
        {/* Estados del pedido - visualización compacta */}
        <div className="flex items-center gap-1 flex-1">
          {ESTADOS_CLIENTE.map((estado, index) => {
            // Ocultar "en_camino" si es para recoger
            if (estado.key === "en_camino" && esParaRecoger) return null;
            
            const esActual = estado.key === estadoActual;
            const esCompletado = index < indiceEstado;
            const Icon = estado.icon;

            return (
              <div
                key={estado.key}
                className={`flex items-center gap-0.5 ${
                  esActual 
                    ? "text-white font-bold" 
                    : esCompletado 
                      ? "text-white/80" 
                      : "text-white/40"
                }`}
              >
                <Icon className={`h-3 w-3 ${esActual ? "animate-pulse" : ""}`} />
                <span className="hidden sm:inline">{estado.label}</span>
                {index < ESTADOS_CLIENTE.length - 1 && !esParaRecoger && (
                  <span className="mx-0.5 text-white/30">→</span>
                )}
                {index < ESTADOS_CLIENTE.length - 1 && esParaRecoger && estado.key !== "listo" && (
                  <span className="mx-0.5 text-white/30">→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mensaje de estado y botón de acción */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[9px] text-white/90">
            {getMensajeEstado()}
          </span>
          {botonAccion && (
            <Button
              size="sm"
              variant="secondary"
              className="h-4 px-2 text-[9px] font-bold bg-white text-purple-700 hover:bg-white/90"
              onClick={botonAccion.accion}
              disabled={!botonAccion.habilitado || confirmarRecepcionMutation.isPending}
              data-testid="button-confirmar-recepcion"
            >
              {botonAccion.texto}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de agradecimiento */}
      <Dialog open={showAgradecimiento} onOpenChange={setShowAgradecimiento}>
        <DialogContent className="sm:max-w-md text-center" data-testid="modal-agradecimiento">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <span className="text-xl">¡PEDIDO COMPLETADO!</span>
            </DialogTitle>
            <DialogDescription className="text-center text-base py-4">
              MUCHAS GRACIAS POR CONFIAR EN NUESTRO SERVICIO
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleCerrarAgradecimiento}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8"
              data-testid="button-aceptar-agradecimiento"
            >
              ACEPTAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente reutilizable para mostrar franja de estado en cada fila de pedido
interface FranjaEstadoPedidoProps {
  estado: string;
  tipoEntrega?: string;
  compact?: boolean;
}

// Función para normalizar los alias de estados a los estados base
function normalizarEstado(estado: string): string {
  const mapeoEstados: Record<string, string> = {
    // Estados base (se mantienen igual)
    "pendiente": "pendiente",
    "aceptado": "aceptado",
    "preparando": "preparando",
    "listo": "listo",
    "en_camino": "en_camino",
    "entregado": "entregado",
    "confirmado": "confirmado",
    // Alias de estados
    "en_preparacion": "preparando",
    "listo_para_envio": "listo",
    "recibido_conforme": "confirmado",
    "completado": "confirmado",
    "recibido": "pendiente",
    // Posibles variantes adicionales
    "aceptado_negocio": "aceptado",
    "aceptado_tienda": "aceptado",
    "en_camino_delivery": "en_camino",
    "entregado_cliente": "entregado",
    "confirmado_cliente": "confirmado",
    "cancelado": "pendiente", // Para cancelados, mostramos en pendiente (deshabilitado)
  };
  // Fallback: si no está en el mapeo, intentar detectar el estado base
  if (mapeoEstados[estado]) {
    return mapeoEstados[estado];
  }
  // Intentar detectar por contenido
  if (estado.includes("prepar")) return "preparando";
  if (estado.includes("acept")) return "aceptado";
  if (estado.includes("listo")) return "listo";
  if (estado.includes("camino")) return "en_camino";
  if (estado.includes("entreg")) return "entregado";
  if (estado.includes("confirm") || estado.includes("complet")) return "confirmado";
  // Por defecto, mostrar como pendiente
  return "pendiente";
}

export function FranjaEstadoPedido({ estado, tipoEntrega, compact = false }: FranjaEstadoPedidoProps) {
  const estadoNormalizado = normalizarEstado(estado || "pendiente");
  const indiceEstado = ESTADOS_CLIENTE.findIndex(e => e.key === estadoNormalizado);
  const esParaRecoger = tipoEntrega === "recoger" || tipoEntrega === "local";

  // Filtrar estados para omitir en_camino si es para recoger
  const estadosFiltrados = esParaRecoger 
    ? ESTADOS_CLIENTE.filter(e => e.key !== "en_camino")
    : ESTADOS_CLIENTE;

  return (
    <div 
      className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between text-white font-medium rounded-sm ${
        compact ? "h-4 px-1 text-[8px]" : "h-5 px-2 text-[9px]"
      }`}
      data-testid="franja-estado-pedido"
    >
      <div className="flex items-center gap-0.5 flex-1">
        {estadosFiltrados.map((estadoItem, index) => {
          const esActual = estadoItem.key === estadoNormalizado;
          const esCompletado = ESTADOS_CLIENTE.findIndex(e => e.key === estadoItem.key) < indiceEstado;
          const Icon = estadoItem.icon;

          return (
            <div
              key={estadoItem.key}
              className={`flex items-center gap-0.5 ${
                esActual 
                  ? "text-white font-bold" 
                  : esCompletado 
                    ? "text-white/80" 
                    : "text-white/40"
              }`}
            >
              <Icon className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} ${esActual ? "animate-pulse" : ""}`} />
              <span className={compact ? "hidden lg:inline" : "hidden sm:inline"}>{estadoItem.label}</span>
              {index < estadosFiltrados.length - 1 && (
                <span className="mx-0.5 text-white/30">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
