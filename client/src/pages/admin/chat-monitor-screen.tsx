import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Users, 
  AlertTriangle, 
  Phone, 
  Send, 
  Shield, 
  Flame, 
  Radio, 
  Ambulance, 
  Truck,
  RefreshCw,
  MoreVertical,
  Clock,
  ChevronDown,
  Maximize2,
  Minimize2,
  Bell
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface GrupoChatMonitor {
  id: string;
  nombre: string;
  descripcion?: string;
  avatarUrl?: string;
  organizacionNombre?: string;
  ciudadId?: string;
  totalMiembros: number;
  totalMensajes: number;
  ultimoMensajeAt?: string;
  ultimoPanicoAt?: string;
  prioridadMonitor?: number;
  creador?: {
    id: string;
    nombre: string;
    email?: string;
  };
  totalMiembrosActivos: number;
}

interface MensajeMonitor {
  id: string;
  contenido: string;
  tipo: string;
  remitenteId: string;
  createdAt: string;
  remitente?: {
    id: string;
    nombre: string;
    avatar?: string;
  };
}

interface ServicioEmergencia {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  icono?: string;
  colorIcono?: string;
}

function ChatMonitorTile({ grupo, onExpand, isExpanded }: { 
  grupo: GrupoChatMonitor; 
  onExpand: () => void;
  isExpanded: boolean;
}) {
  const [mensajeInput, setMensajeInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mensajes = [], isLoading: loadingMensajes } = useQuery<MensajeMonitor[]>({
    queryKey: ['/api/admin/chat-monitor', grupo.id, 'historial'],
    refetchInterval: 5000,
  });

  const { data: servicios = [] } = useQuery<ServicioEmergencia[]>({
    queryKey: ['/api/admin/servicios-emergencia'],
  });

  const enviarMensajeMutation = useMutation({
    mutationFn: async (contenido: string) => {
      return apiRequest('POST', `/api/admin/chat-monitor/${grupo.id}/mensaje`, { contenido });
    },
    onSuccess: () => {
      setMensajeInput("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-monitor', grupo.id, 'historial'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  const registrarAccionMutation = useMutation({
    mutationFn: async (data: { servicioId?: string; tipoAccion: string; destinatario: string; telefono?: string }) => {
      return apiRequest('POST', `/api/admin/chat-monitor/${grupo.id}/accion-emergencia`, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Acción registrada",
        description: `Se registró llamada/mensaje a ${variables.destinatario}`,
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleEnviarMensaje = () => {
    if (mensajeInput.trim()) {
      enviarMensajeMutation.mutate(mensajeInput.trim());
    }
  };

  const handleAccionEmergencia = (servicio: ServicioEmergencia) => {
    registrarAccionMutation.mutate({
      servicioId: servicio.id,
      tipoAccion: 'llamada',
      destinatario: servicio.nombre,
      telefono: servicio.telefono,
    });
    if (servicio.telefono) {
      window.open(`tel:${servicio.telefono}`, '_blank');
    }
  };

  const getIconoServicio = (tipo: string) => {
    switch (tipo) {
      case 'policia': return <Shield className="h-4 w-4" />;
      case 'bomberos': return <Flame className="h-4 w-4" />;
      case 'serenazgo': return <Radio className="h-4 w-4" />;
      case 'ambulancia': return <Ambulance className="h-4 w-4" />;
      case 'grua': return <Truck className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const tienePanicoReciente = grupo.ultimoPanicoAt && 
    new Date(grupo.ultimoPanicoAt).getTime() > Date.now() - 3600000;

  return (
    <Card 
      className={`flex flex-col h-full ${tienePanicoReciente ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
      data-testid={`tile-chat-${grupo.id}`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={grupo.avatarUrl} />
              <AvatarFallback className="text-xs">
                {grupo.nombre.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">
                {grupo.organizacionNombre || grupo.nombre}
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{grupo.totalMiembrosActivos}</span>
                {tienePanicoReciente && (
                  <Badge variant="destructive" className="ml-1 text-xs py-0 px-1">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    PÁNICO
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`btn-emergency-${grupo.id}`}>
                  <Phone className="h-4 w-4 text-red-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {servicios.map((servicio) => (
                  <DropdownMenuItem 
                    key={servicio.id}
                    onClick={() => handleAccionEmergencia(servicio)}
                    className="cursor-pointer"
                    data-testid={`btn-servicio-${servicio.tipo}`}
                  >
                    {getIconoServicio(servicio.tipo)}
                    <span className="ml-2">{servicio.nombre}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{servicio.telefono}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={onExpand}
              data-testid={`btn-expand-${grupo.id}`}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 p-2 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
          <div className="space-y-2">
            {loadingMensajes ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                Cargando mensajes...
              </div>
            ) : mensajes.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                Sin mensajes recientes
              </div>
            ) : (
              mensajes.slice(-10).map((msg) => (
                <div key={msg.id} className="flex gap-2 text-xs">
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={msg.remitente?.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {msg.remitente?.nombre?.substring(0, 1) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">
                        {msg.remitente?.nombre || 'Usuario'}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-muted-foreground break-words">{msg.contenido}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-1 mt-2 pt-2 border-t">
          <Input
            placeholder="Mensaje..."
            value={mensajeInput}
            onChange={(e) => setMensajeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnviarMensaje()}
            className="h-8 text-xs"
            data-testid={`input-mensaje-${grupo.id}`}
          />
          <Button 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={handleEnviarMensaje}
            disabled={enviarMensajeMutation.isPending || !mensajeInput.trim()}
            data-testid={`btn-enviar-${grupo.id}`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChatMonitorScreen() {
  const [expandedGrupoId, setExpandedGrupoId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: grupos = [], isLoading, refetch } = useQuery<GrupoChatMonitor[]>({
    queryKey: ['/api/admin/chat-monitor'],
    refetchInterval: 10000,
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-monitor'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando Chat Monitor...</p>
        </div>
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Chat Monitor</h2>
            <p className="text-muted-foreground">
              Monitoreo y gestión de conversaciones en tiempo real
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" data-testid="btn-refresh-monitor">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay grupos CHAT activos</p>
              <p className="text-sm mt-2">
                Los grupos con rol CHAT aprobados aparecerán aquí automáticamente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gruposPriorizados = [...grupos].sort((a, b) => {
    if (a.ultimoPanicoAt && !b.ultimoPanicoAt) return -1;
    if (!a.ultimoPanicoAt && b.ultimoPanicoAt) return 1;
    if (a.ultimoPanicoAt && b.ultimoPanicoAt) {
      return new Date(b.ultimoPanicoAt).getTime() - new Date(a.ultimoPanicoAt).getTime();
    }
    return (b.prioridadMonitor || 0) - (a.prioridadMonitor || 0);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chat Monitor</h2>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de {grupos.length} grupos CHAT activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Bell className="h-3 w-3" />
            {gruposPriorizados.filter(g => g.ultimoPanicoAt && 
              new Date(g.ultimoPanicoAt).getTime() > Date.now() - 3600000).length} alertas
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm" data-testid="btn-refresh-monitor">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
          gridAutoRows: 'minmax(320px, auto)',
        }}
        data-testid="grid-chat-monitor"
      >
        {gruposPriorizados.slice(0, 24).map((grupo) => (
          <ChatMonitorTile
            key={grupo.id}
            grupo={grupo}
            onExpand={() => setExpandedGrupoId(expandedGrupoId === grupo.id ? null : grupo.id)}
            isExpanded={expandedGrupoId === grupo.id}
          />
        ))}
      </div>

      {grupos.length > 24 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando 24 de {grupos.length} grupos. Los más recientes con alertas de pánico aparecen primero.
        </div>
      )}
    </div>
  );
}
