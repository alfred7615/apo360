import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, Clock, ChefHat, Package, Truck, CheckCircle2, X, MapPin, CreditCard, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Pedido {
  id: string;
  numeroPedido?: string;
  estado: string;
  tipoEntrega?: string;
  localComercialId?: string;
  nombreLocal?: string;
  nombreSolicitante?: string;
  total?: string;
  pagoDelegado?: boolean;
  usuarioPagadorId?: string;
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
  const [showDetallesDelegado, setShowDetallesDelegado] = useState(false);

  // Obtener pedidos activos del usuario (no confirmados ni cancelados)
  const { data: pedidosActivos = [] } = useQuery<Pedido[]>({
    queryKey: ["/api/mis-pedidos/activos"],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refrescar cada 10 segundos
  });

  // Obtener pedidos delegados al usuario (donde él debe pagar)
  const { data: pedidosDelegados = [] } = useQuery<Pedido[]>({
    queryKey: ["/api/mis-pedidos/delegados"],
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const pedidoActivo = pedidosActivos.length > 0 ? pedidosActivos[0] : null;
  const pedidoDelegadoPendiente = pedidosDelegados.length > 0 ? pedidosDelegados[0] : null;

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

  // No mostrar si no hay pedido activo ni pedidos delegados
  if (!isAuthenticated || (!pedidoActivo && !pedidoDelegadoPendiente)) {
    return null;
  }

  const estadoActual = pedidoActivo?.estado || "pendiente";
  const indiceEstado = ESTADOS_CLIENTE.findIndex(e => e.key === estadoActual);
  // Asumimos delivery por defecto si no está especificado, o si es "recoger" o "local"
  const esParaRecoger = pedidoActivo?.tipoEntrega === "recoger" || pedidoActivo?.tipoEntrega === "local";

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
      {/* Barra de pago delegado pendiente */}
      {pedidoDelegadoPendiente && (
        <div 
          className="w-full h-6 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between px-3 text-white text-[10px] font-medium shadow-sm sticky top-12 z-40"
          data-testid="barra-pago-delegado"
        >
          <div className="flex items-center gap-2 flex-1">
            <CreditCard className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-semibold">SOLICITUD DE PAGO</span>
            <span className="hidden sm:inline text-white/90">
              • {pedidoDelegadoPendiente.nombreSolicitante || "Un usuario"} te pide pagar S/ {pedidoDelegadoPendiente.total || "0.00"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-4 px-2 text-[9px] font-bold bg-white text-orange-600 hover:bg-white/90"
              onClick={() => setShowDetallesDelegado(true)}
              data-testid="button-ver-pago-delegado"
            >
              VER DETALLES
            </Button>
          </div>
        </div>
      )}

      {/* Barra de estado del pedido propio */}
      {pedidoActivo && (
      <div 
        className={`w-full h-5 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between px-2 text-white text-[10px] font-medium shadow-sm sticky ${pedidoDelegadoPendiente ? 'top-[60px]' : 'top-12'} z-40`}
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
      )}

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

      {/* Modal de detalles de pago delegado */}
      <Dialog open={showDetallesDelegado} onOpenChange={setShowDetallesDelegado}>
        <DialogContent className="sm:max-w-md" data-testid="modal-detalles-delegado">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Solicitud de Pago
            </DialogTitle>
            <DialogDescription>
              {pedidoDelegadoPendiente?.nombreSolicitante || "Un usuario"} te ha delegado el pago de este pedido
            </DialogDescription>
          </DialogHeader>
          
          {pedidoDelegadoPendiente && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Solicitante:</span>
                  <span className="font-medium">{pedidoDelegadoPendiente.nombreSolicitante}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Negocio:</span>
                  <span className="font-medium">{pedidoDelegadoPendiente.nombreLocal || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo de entrega:</span>
                  <span className="font-medium capitalize">{pedidoDelegadoPendiente.tipoEntrega || "delivery"}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                  <span>Total a pagar:</span>
                  <span className="text-orange-600">S/ {pedidoDelegadoPendiente.total || "0.00"}</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Al aceptar, el pago será procesado desde tu billetera o método de pago configurado
              </p>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowDetallesDelegado(false)}
              data-testid="button-cerrar-delegado"
            >
              Cerrar
            </Button>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
              onClick={() => {
                toast({
                  title: "Próximamente",
                  description: "La funcionalidad de pagar pedidos delegados estará disponible pronto",
                });
                setShowDetallesDelegado(false);
              }}
              data-testid="button-pagar-delegado"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar Ahora
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
