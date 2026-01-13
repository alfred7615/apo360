import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Settings, 
  Users, 
  Check, 
  X, 
  Gift, 
  DollarSign,
  Clock,
  FileText,
  Building,
  Eye,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  Crown
} from "lucide-react";

interface SolicitudGrupoChat {
  id: string;
  solicitanteId: string;
  nombreOrganizacion: string;
  tipoOrganizacion: string;
  descripcion: string;
  documentosSoporte: { nombre: string; url: string; tipo: string }[] | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  motivoRechazo: string | null;
  revisadoPor: string | null;
  grupoCreado: string | null;
  createdAt: string;
  updatedAt: string;
  solicitante?: {
    id: string;
    nombre: string;
    email: string;
    profileImageUrl: string | null;
  };
}

interface MembresiaGrupoChat {
  id: string;
  usuarioId: string;
  grupoId: string;
  tipoMembresia: 'pago' | 'cortesia';
  mesesCortesia: number | null;
  fechaInicio: string;
  fechaFin: string;
  estado: 'activa' | 'expirada' | 'cancelada';
  createdAt: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
    profileImageUrl: string | null;
  };
  grupo?: {
    id: string;
    nombre: string;
  };
}

interface ConfiguracionCobros {
  id: string;
  claveCobro: string;
  montoMensual: number;
  descripcion: string;
  activo: boolean;
}

export default function GestionGruposChatScreen() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("solicitudes");
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudGrupoChat | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMembresiaModal, setShowMembresiaModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [nuevaMembresia, setNuevaMembresia] = useState({
    usuarioId: "",
    grupoId: "",
    meses: 1
  });
  const [nuevoMonto, setNuevoMonto] = useState("");

  const { data: solicitudesPendientes = [], isLoading: loadingSolicitudes, refetch: refetchSolicitudes } = useQuery<SolicitudGrupoChat[]>({
    queryKey: ["/api/admin/solicitudes-grupos-chat"],
  });

  const { data: membresias = [], isLoading: loadingMembresias, refetch: refetchMembresias } = useQuery<MembresiaGrupoChat[]>({
    queryKey: ["/api/admin/membresias-grupos-chat"],
  });

  const { data: configuracion, isLoading: loadingConfig, refetch: refetchConfig } = useQuery<ConfiguracionCobros>({
    queryKey: ["/api/admin/configuracion-cobros/cobro_mensual_grupos_chat"],
  });

  const { data: gruposAutorizados = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/grupos-autorizados"],
  });

  const { data: usuarios = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/usuarios-buscar"],
  });

  const aprobarSolicitudMutation = useMutation({
    mutationFn: (solicitudId: string) => 
      apiRequest("POST", `/api/admin/solicitudes-grupos-chat/${solicitudId}/aprobar`),
    onSuccess: () => {
      toast({ title: "Solicitud aprobada", description: "El grupo ha sido creado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/solicitudes-grupos-chat"] });
      setShowApproveModal(false);
      setSelectedSolicitud(null);
    },
    onError: (error: any) => {
      toast({ title: "Error al aprobar", description: error.message, variant: "destructive" });
    }
  });

  const rechazarSolicitudMutation = useMutation({
    mutationFn: ({ solicitudId, motivo }: { solicitudId: string; motivo: string }) =>
      apiRequest("POST", `/api/admin/solicitudes-grupos-chat/${solicitudId}/rechazar`, { motivoRechazo: motivo }),
    onSuccess: () => {
      toast({ title: "Solicitud rechazada", description: "Se ha notificado al solicitante" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/solicitudes-grupos-chat"] });
      setShowRejectModal(false);
      setSelectedSolicitud(null);
      setMotivoRechazo("");
    },
    onError: (error: any) => {
      toast({ title: "Error al rechazar", description: error.message, variant: "destructive" });
    }
  });

  const crearMembresiaMutation = useMutation({
    mutationFn: (data: { usuarioId: string; grupoId: string; meses: number }) =>
      apiRequest("POST", "/api/admin/membresias-grupos-chat", data),
    onSuccess: () => {
      toast({ title: "Membresía creada", description: "Membresía de cortesía asignada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/membresias-grupos-chat"] });
      setShowMembresiaModal(false);
      setNuevaMembresia({ usuarioId: "", grupoId: "", meses: 1 });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear membresía", description: error.message, variant: "destructive" });
    }
  });

  const cancelarMembresiaMutation = useMutation({
    mutationFn: (membresiaId: string) =>
      apiRequest("DELETE", `/api/admin/membresias-grupos-chat/${membresiaId}`),
    onSuccess: () => {
      toast({ title: "Membresía cancelada" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/membresias-grupos-chat"] });
    },
    onError: (error: any) => {
      toast({ title: "Error al cancelar", description: error.message, variant: "destructive" });
    }
  });

  const actualizarMontoMutation = useMutation({
    mutationFn: (monto: number) =>
      apiRequest("PUT", "/api/admin/configuracion-cobros/cobro_mensual_grupos_chat", { monto }),
    onSuccess: () => {
      toast({ title: "Monto actualizado", description: "El nuevo monto se aplicará a partir del próximo mes" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configuracion-cobros/cobro_mensual_grupos_chat"] });
      setNuevoMonto("");
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    }
  });

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      junta_vecinal: "Junta Vecinal",
      asociacion: "Asociación",
      institucion: "Institución",
      empresa: "Empresa",
      ong: "ONG",
      otro: "Otro"
    };
    return tipos[tipo] || tipo;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'aprobada':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><X className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4" data-testid="gestion-grupos-chat">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Gestión de Grupos Chat
          </h2>
          <p className="text-sm text-muted-foreground">
            Administra solicitudes de grupos, membresías de cortesía y configuración de cobros
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            refetchSolicitudes();
            refetchMembresias();
            refetchConfig();
          }}
          data-testid="btn-refrescar"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solicitudes" className="flex items-center gap-2" data-testid="tab-solicitudes">
            <FileText className="h-4 w-4" />
            Solicitudes
            {solicitudesPendientes.filter(s => s.estado === 'pendiente').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {solicitudesPendientes.filter(s => s.estado === 'pendiente').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="membresias" className="flex items-center gap-2" data-testid="tab-membresias">
            <Gift className="h-4 w-4" />
            Membresías Cortesía
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-2" data-testid="tab-configuracion">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Solicitudes de Grupos Organizacionales
              </CardTitle>
              <CardDescription>
                Revisa y procesa las solicitudes de grupos de chat de organizaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSolicitudes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : solicitudesPendientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Organización</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitudesPendientes.map((solicitud) => (
                        <TableRow key={solicitud.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={solicitud.solicitante?.profileImageUrl || undefined} />
                                <AvatarFallback>{solicitud.solicitante?.nombre?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{solicitud.solicitante?.nombre || "Usuario"}</p>
                                <p className="text-xs text-muted-foreground">{solicitud.solicitante?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{solicitud.nombreOrganizacion}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{solicitud.descripcion}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTipoLabel(solicitud.tipoOrganizacion)}</Badge>
                          </TableCell>
                          <TableCell>{getEstadoBadge(solicitud.estado)}</TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(solicitud.createdAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {solicitud.documentosSoporte && solicitud.documentosSoporte.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => window.open(solicitud.documentosSoporte![0].url, '_blank')}
                                  data-testid={`btn-ver-documento-${solicitud.id}`}
                                  title="Ver documento de soporte"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {solicitud.estado === 'pendiente' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-green-600 border-green-600/20 hover:bg-green-50"
                                    onClick={() => {
                                      setSelectedSolicitud(solicitud);
                                      setShowApproveModal(true);
                                    }}
                                    data-testid={`btn-aprobar-${solicitud.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-600 border-red-600/20 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedSolicitud(solicitud);
                                      setShowRejectModal(true);
                                    }}
                                    data-testid={`btn-rechazar-${solicitud.id}`}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Rechazar
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membresias" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Membresías de Cortesía
                </CardTitle>
                <CardDescription>
                  Asigna membresías gratuitas a usuarios específicos
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowMembresiaModal(true)}
                data-testid="btn-nueva-membresia"
              >
                <Gift className="h-4 w-4 mr-2" />
                Nueva Membresía
              </Button>
            </CardHeader>
            <CardContent>
              {loadingMembresias ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : membresias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay membresías de cortesía activas</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Meses</TableHead>
                        <TableHead>Vigencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membresias.map((membresia) => (
                        <TableRow key={membresia.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={membresia.usuario?.profileImageUrl || undefined} />
                                <AvatarFallback>{membresia.usuario?.nombre?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{membresia.usuario?.nombre || "Usuario"}</p>
                                <p className="text-xs text-muted-foreground">{membresia.usuario?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{membresia.grupo?.nombre || "Grupo"}</p>
                          </TableCell>
                          <TableCell>
                            {membresia.tipoMembresia === 'cortesia' ? (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                                <Gift className="h-3 w-3 mr-1" />Cortesía
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <DollarSign className="h-3 w-3 mr-1" />Pago
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{membresia.mesesCortesia || "-"}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(membresia.fechaInicio).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">al {new Date(membresia.fechaFin).toLocaleDateString()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {membresia.estado === 'activa' ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600">Activa</Badge>
                            ) : membresia.estado === 'expirada' ? (
                              <Badge variant="outline" className="bg-gray-500/10 text-gray-600">Expirada</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600">Cancelada</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {membresia.estado === 'activa' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600"
                                onClick={() => cancelarMembresiaMutation.mutate(membresia.id)}
                                disabled={cancelarMembresiaMutation.isPending}
                                data-testid={`btn-cancelar-membresia-${membresia.id}`}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monto de Cobro Mensual
                </CardTitle>
                <CardDescription>
                  Define el costo mensual para grupos de chat organizacionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingConfig ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Monto actual</p>
                        <p className="text-2xl font-bold text-primary">
                          S/ {configuracion?.montoMensual?.toFixed(2) || "5.00"}
                        </p>
                      </div>
                      <DollarSign className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="nuevoMonto">Nuevo Monto (Soles)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="nuevoMonto"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="5.00"
                          value={nuevoMonto}
                          onChange={(e) => setNuevoMonto(e.target.value)}
                          data-testid="input-nuevo-monto"
                        />
                        <Button 
                          onClick={() => {
                            const monto = parseFloat(nuevoMonto);
                            if (isNaN(monto) || monto < 0) {
                              toast({ title: "Monto inválido", variant: "destructive" });
                              return;
                            }
                            actualizarMontoMutation.mutate(monto);
                          }}
                          disabled={actualizarMontoMutation.isPending || !nuevoMonto}
                          data-testid="btn-actualizar-monto"
                        >
                          {actualizarMontoMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Actualizar"
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Información de Cobros
                </CardTitle>
                <CardDescription>
                  Detalles sobre el sistema de cobros automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">Cobro Automático</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Los cobros se realizan automáticamente el día 1 de cada mes a las 01:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Gift className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100">Membresías de Cortesía</p>
                      <p className="text-green-700 dark:text-green-300">
                        Los usuarios con membresía de cortesía activa no serán cobrados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-100">Saldo Insuficiente</p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Si el usuario no tiene saldo, el grupo quedará en estado suspendido
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Grupos Autorizados Activos
              </CardTitle>
              <CardDescription>
                Lista de grupos organizacionales aprobados y activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gruposAutorizados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay grupos autorizados activos</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Creador</TableHead>
                        <TableHead>Miembros</TableHead>
                        <TableHead>Creado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gruposAutorizados.map((grupo: any) => (
                        <TableRow key={grupo.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={grupo.imagenUrl} />
                                <AvatarFallback><MessageSquare className="h-4 w-4" /></AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{grupo.nombre}</p>
                                <p className="text-xs text-muted-foreground">{grupo.tipoOrganizacion}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{grupo.creador?.nombre || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{grupo.creador?.email}</p>
                          </TableCell>
                          <TableCell>{grupo.totalMiembrosActivos || 0}</TableCell>
                          <TableCell>{new Date(grupo.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Aprobar Solicitud
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de aprobar esta solicitud? Se creará automáticamente un grupo de chat para la organización.
            </DialogDescription>
          </DialogHeader>
          {selectedSolicitud && (
            <div className="space-y-3 py-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium">{selectedSolicitud.nombreOrganizacion}</p>
                <p className="text-sm text-muted-foreground">{selectedSolicitud.descripcion}</p>
                <Badge variant="outline">{getTipoLabel(selectedSolicitud.tipoOrganizacion)}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)} data-testid="btn-cancelar-aprobacion">
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedSolicitud && aprobarSolicitudMutation.mutate(selectedSolicitud.id)}
              disabled={aprobarSolicitudMutation.isPending}
              data-testid="btn-confirmar-aprobacion"
            >
              {aprobarSolicitudMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Aprobar y Crear Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              Rechazar Solicitud
            </DialogTitle>
            <DialogDescription>
              Proporciona un motivo para el rechazo. El solicitante será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSolicitud && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedSolicitud.nombreOrganizacion}</p>
              </div>
            )}
            <div>
              <Label htmlFor="motivoRechazo">Motivo del Rechazo *</Label>
              <Textarea
                id="motivoRechazo"
                placeholder="Explica por qué se rechaza esta solicitud..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={3}
                data-testid="input-motivo-rechazo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} data-testid="btn-cancelar-rechazo">
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedSolicitud && rechazarSolicitudMutation.mutate({
                solicitudId: selectedSolicitud.id,
                motivo: motivoRechazo
              })}
              disabled={rechazarSolicitudMutation.isPending || !motivoRechazo.trim()}
              data-testid="btn-confirmar-rechazo"
            >
              {rechazarSolicitudMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Rechazar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMembresiaModal} onOpenChange={setShowMembresiaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Nueva Membresía de Cortesía
            </DialogTitle>
            <DialogDescription>
              Asigna una membresía gratuita a un usuario para un grupo específico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="usuarioMembresia">Usuario *</Label>
              <Input
                id="usuarioMembresia"
                placeholder="ID del usuario"
                value={nuevaMembresia.usuarioId}
                onChange={(e) => setNuevaMembresia(prev => ({...prev, usuarioId: e.target.value}))}
                data-testid="input-usuario-membresia"
              />
            </div>
            <div>
              <Label htmlFor="grupoMembresia">Grupo *</Label>
              <Select
                value={nuevaMembresia.grupoId}
                onValueChange={(val) => setNuevaMembresia(prev => ({...prev, grupoId: val}))}
              >
                <SelectTrigger id="grupoMembresia" data-testid="select-grupo-membresia">
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {gruposAutorizados.map((grupo: any) => (
                    <SelectItem key={grupo.id} value={grupo.id}>{grupo.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mesesMembresia">Meses de Cortesía</Label>
              <Select
                value={nuevaMembresia.meses.toString()}
                onValueChange={(val) => setNuevaMembresia(prev => ({...prev, meses: parseInt(val)}))}
              >
                <SelectTrigger id="mesesMembresia" data-testid="select-meses-membresia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12].map((m) => (
                    <SelectItem key={m} value={m.toString()}>{m} mes{m > 1 ? 'es' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembresiaModal(false)} data-testid="btn-cancelar-membresia">
              Cancelar
            </Button>
            <Button 
              onClick={() => crearMembresiaMutation.mutate(nuevaMembresia)}
              disabled={crearMembresiaMutation.isPending || !nuevaMembresia.usuarioId || !nuevaMembresia.grupoId}
              data-testid="btn-crear-membresia"
            >
              {crearMembresiaMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Gift className="h-4 w-4 mr-2" />
              )}
              Crear Membresía
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
