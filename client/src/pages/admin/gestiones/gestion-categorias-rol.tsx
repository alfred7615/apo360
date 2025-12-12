import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  X,
  Clock,
  User,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CategoriasRolSection from "@/components/admin/categorias-rol-section";

interface SolicitudRol {
  id: string;
  usuarioId: string;
  rol: string;
  categoriaRolId?: string;
  subcategoriaRolId?: string;
  comentarios?: string;
  estado: string;
  procesadoPor?: string;
  motivoRechazo?: string;
  createdAt: string;
  procesadoAt?: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
    profileImageUrl?: string;
  };
  categoria?: any;
  subcategoria?: any;
}

function SolicitudesRolesSection() {
  const { toast } = useToast();
  const [filtroEstado, setFiltroEstado] = useState<string>("pendiente");
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudRol | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const { data: solicitudes = [], isLoading } = useQuery<SolicitudRol[]>({
    queryKey: ["/api/solicitudes-roles", { estado: filtroEstado }],
    queryFn: () => fetch(`/api/solicitudes-roles?estado=${filtroEstado}`).then(res => res.json()),
  });

  const aprobarMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/solicitudes-roles/${id}/aprobar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes-roles"] });
      toast({ title: "Solicitud aprobada", description: "El rol ha sido asignado al usuario." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: (data: { id: string; motivoRechazo: string }) => 
      apiRequest("POST", `/api/solicitudes-roles/${data.id}/rechazar`, { motivoRechazo: data.motivoRechazo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/solicitudes-roles"] });
      setShowRechazarModal(false);
      setSolicitudSeleccionada(null);
      setMotivoRechazo("");
      toast({ title: "Solicitud rechazada" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleRechazar = (solicitud: SolicitudRol) => {
    setSolicitudSeleccionada(solicitud);
    setShowRechazarModal(true);
  };

  const confirmarRechazo = () => {
    if (solicitudSeleccionada) {
      rechazarMutation.mutate({
        id: solicitudSeleccionada.id,
        motivoRechazo: motivoRechazo || "Sin motivo especificado",
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "aprobada":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case "rechazada":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filtroEstado === "pendiente" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltroEstado("pendiente")}
        >
          <Clock className="h-4 w-4 mr-1" />
          Pendientes
        </Button>
        <Button
          variant={filtroEstado === "aprobada" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltroEstado("aprobada")}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Aprobadas
        </Button>
        <Button
          variant={filtroEstado === "rechazada" ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltroEstado("rechazada")}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rechazadas
        </Button>
      </div>

      {/* Lista de solicitudes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : solicitudes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay solicitudes {filtroEstado === "pendiente" ? "pendientes" : filtroEstado === "aprobada" ? "aprobadas" : "rechazadas"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((solicitud) => (
            <Card key={solicitud.id} data-testid={`card-solicitud-${solicitud.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={solicitud.usuario?.profileImageUrl} />
                    <AvatarFallback>
                      {solicitud.usuario?.nombre?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{solicitud.usuario?.nombre || 'Usuario'}</h4>
                      {getEstadoBadge(solicitud.estado)}
                    </div>
                    <p className="text-sm text-muted-foreground">{solicitud.usuario?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        <Shield className="h-3 w-3 mr-1" />
                        {solicitud.rol.replace(/_/g, ' ')}
                      </Badge>
                      {solicitud.categoria && (
                        <Badge variant="outline">{solicitud.categoria.nombre}</Badge>
                      )}
                    </div>
                    {solicitud.comentarios && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded-md">{solicitud.comentarios}</p>
                    )}
                    {solicitud.motivoRechazo && (
                      <p className="text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                        <strong>Motivo de rechazo:</strong> {solicitud.motivoRechazo}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Solicitado: {format(new Date(solicitud.createdAt), "PPp", { locale: es })}
                    </p>
                  </div>

                  {solicitud.estado === "pendiente" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => aprobarMutation.mutate(solicitud.id)}
                        disabled={aprobarMutation.isPending}
                        data-testid={`button-aprobar-${solicitud.id}`}
                      >
                        {aprobarMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRechazar(solicitud)}
                        disabled={rechazarMutation.isPending}
                        data-testid={`button-rechazar-${solicitud.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de rechazo */}
      <Dialog open={showRechazarModal} onOpenChange={setShowRechazarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo por el cual rechazas esta solicitud de rol.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Solicitante</Label>
              <p className="text-sm font-medium">{solicitudSeleccionada?.usuario?.nombre}</p>
            </div>
            <div>
              <Label>Rol solicitado</Label>
              <Badge variant="secondary" className="capitalize mt-1">
                {solicitudSeleccionada?.rol?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <Label htmlFor="motivo">Motivo del rechazo</Label>
              <Textarea
                id="motivo"
                placeholder="Explica el motivo del rechazo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                data-testid="input-motivo-rechazo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRechazarModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmarRechazo}
              disabled={rechazarMutation.isPending}
              data-testid="button-confirmar-rechazo"
            >
              {rechazarMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GestionCategoriasRolScreen() {
  const [activeTab, setActiveTab] = useState("solicitudes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Roles</h1>
        <p className="text-muted-foreground">
          Administra las solicitudes de roles y las categorías para cada tipo de rol
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="solicitudes" data-testid="tab-solicitudes-roles">
            <User className="h-4 w-4 mr-2" />
            Solicitudes
          </TabsTrigger>
          <TabsTrigger value="categorias" data-testid="tab-categorias-roles">
            <Shield className="h-4 w-4 mr-2" />
            Categorías
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="solicitudes" className="mt-4">
          <SolicitudesRolesSection />
        </TabsContent>
        
        <TabsContent value="categorias" className="mt-4">
          <CategoriasRolSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
