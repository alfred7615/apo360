import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Image,
  Download,
  Eye,
  User,
  Phone,
  Mail,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";

interface DocumentoSoporte {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  urlArchivo: string;
  tamanio?: number;
  descripcion?: string;
  createdAt: string;
}

interface SolicitudChat {
  id: string;
  nombre: string;
  descripcion?: string;
  organizacionNombre: string;
  estadoAutorizacion: string;
  fechaSolicitud: string;
  fechaAutorizacion?: string;
  motivoRechazo?: string;
  creador?: {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  documentos: DocumentoSoporte[];
}

export function AdminSolicitudesCHAT() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tabActiva, setTabActiva] = useState("pendientes");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudChat | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [documentoVisualizando, setDocumentoVisualizando] = useState<DocumentoSoporte | null>(null);

  const { data: solicitudesPendientes = [], isLoading: cargandoPendientes } = useQuery<SolicitudChat[]>({
    queryKey: ["/api/admin/chat/solicitudes", "pendiente"],
    queryFn: async () => {
      const response = await fetch("/api/admin/chat/solicitudes?estado=pendiente");
      if (!response.ok) throw new Error("Error al cargar solicitudes");
      return response.json();
    },
  });

  const { data: todasSolicitudes = [], isLoading: cargandoTodas } = useQuery<SolicitudChat[]>({
    queryKey: ["/api/admin/chat/solicitudes", "todas"],
    queryFn: async () => {
      const response = await fetch("/api/admin/chat/solicitudes?estado=todas");
      if (!response.ok) throw new Error("Error al cargar solicitudes");
      return response.json();
    },
  });

  const aprobarMutation = useMutation({
    mutationFn: async (grupoId: string) => {
      const response = await apiRequest("POST", `/api/admin/chat/solicitudes/${grupoId}/aprobar`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud aprobada",
        description: "El grupo ha sido autorizado como organizacional",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/solicitudes"] });
      setMostrarDetalles(false);
      setSolicitudSeleccionada(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: async ({ grupoId, motivo }: { grupoId: string; motivo: string }) => {
      const response = await apiRequest("POST", `/api/admin/chat/solicitudes/${grupoId}/rechazar`, {
        motivoRechazo: motivo,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "El grupo no ha sido autorizado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/solicitudes"] });
      setMostrarRechazo(false);
      setMostrarDetalles(false);
      setSolicitudSeleccionada(null);
      setMotivoRechazo("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    },
  });

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearTamanio = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
      case 'aprobado':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Rechazado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const renderTarjetaSolicitud = (solicitud: SolicitudChat) => (
    <Card 
      key={solicitud.id} 
      className="cursor-pointer hover-elevate transition-all"
      onClick={() => {
        setSolicitudSeleccionada(solicitud);
        setMostrarDetalles(true);
      }}
      data-testid={`card-request-${solicitud.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-purple-500 shrink-0" />
              <h4 className="font-semibold truncate">{solicitud.organizacionNombre}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Grupo: {solicitud.nombre}</p>
            
            {solicitud.creador && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{solicitud.creador.nombre}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{formatearFecha(solicitud.fechaSolicitud)}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {getEstadoBadge(solicitud.estadoAutorizacion)}
            {solicitud.documentos.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {solicitud.documentos.length} docs
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSkeletons = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-purple-500" />
        <h2 className="text-xl font-bold">Solicitudes CHAT</h2>
      </div>

      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList>
          <TabsTrigger value="pendientes" className="gap-2" data-testid="tab-pending">
            <Clock className="h-4 w-4" />
            Pendientes
            {solicitudesPendientes.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {solicitudesPendientes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="todas" data-testid="tab-all">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-4">
          {cargandoPendientes ? (
            renderSkeletons()
          ) : solicitudesPendientes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p>No hay solicitudes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {solicitudesPendientes.map(renderTarjetaSolicitud)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas" className="mt-4">
          {cargandoTodas ? (
            renderSkeletons()
          ) : todasSolicitudes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay solicitudes registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todasSolicitudes.map(renderTarjetaSolicitud)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de detalles */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              Detalles de Solicitud
            </DialogTitle>
          </DialogHeader>

          {solicitudSeleccionada && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-lg">{solicitudSeleccionada.organizacionNombre}</h3>
                <p className="text-sm text-muted-foreground">Grupo: {solicitudSeleccionada.nombre}</p>
                {solicitudSeleccionada.descripcion && (
                  <p className="text-sm mt-2">{solicitudSeleccionada.descripcion}</p>
                )}
              </div>

              {solicitudSeleccionada.creador && (
                <div className="space-y-2">
                  <Label>Solicitante</Label>
                  <div className="bg-muted rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{solicitudSeleccionada.creador.nombre}</span>
                    </div>
                    {solicitudSeleccionada.creador.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{solicitudSeleccionada.creador.email}</span>
                      </div>
                    )}
                    {solicitudSeleccionada.creador.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{solicitudSeleccionada.creador.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Documentos de Respaldo ({solicitudSeleccionada.documentos.length})</Label>
                <ScrollArea className="h-40 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {solicitudSeleccionada.documentos.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Sin documentos adjuntos</p>
                    ) : (
                      solicitudSeleccionada.documentos.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-md"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {doc.tipoArchivo.startsWith('image/') ? (
                              <Image className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-orange-500" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.nombreArchivo}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatearTamanio(doc.tamanio)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDocumentoVisualizando(doc)}
                              data-testid={`button-view-doc-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = doc.urlArchivo;
                                a.download = doc.nombreArchivo;
                                a.click();
                              }}
                              data-testid={`button-download-doc-${doc.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                {getEstadoBadge(solicitudSeleccionada.estadoAutorizacion)}
              </div>

              {solicitudSeleccionada.motivoRechazo && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">Motivo de rechazo:</p>
                      <p className="text-sm text-red-600 dark:text-red-500">{solicitudSeleccionada.motivoRechazo}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {solicitudSeleccionada?.estadoAutorizacion === 'pendiente' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setMostrarRechazo(true)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  data-testid="button-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => solicitudSeleccionada && aprobarMutation.mutate(solicitudSeleccionada.id)}
                  disabled={aprobarMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-approve"
                >
                  {aprobarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprobar
                </Button>
              </>
            )}
            {solicitudSeleccionada?.estadoAutorizacion !== 'pendiente' && (
              <Button variant="outline" onClick={() => setMostrarDetalles(false)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de rechazo */}
      <Dialog open={mostrarRechazo} onOpenChange={setMostrarRechazo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rechazar Solicitud
            </DialogTitle>
            <DialogDescription>
              Por favor, proporciona un motivo para el rechazo de esta solicitud.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo del rechazo *</Label>
              <Textarea
                id="motivo"
                placeholder="Explica el motivo del rechazo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={4}
                data-testid="input-rejection-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMostrarRechazo(false);
              setMotivoRechazo("");
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (solicitudSeleccionada && motivoRechazo.trim()) {
                  rechazarMutation.mutate({
                    grupoId: solicitudSeleccionada.id,
                    motivo: motivoRechazo.trim()
                  });
                }
              }}
              disabled={!motivoRechazo.trim() || rechazarMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rechazarMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualización de documento */}
      <Dialog open={!!documentoVisualizando} onOpenChange={() => setDocumentoVisualizando(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{documentoVisualizando?.nombreArchivo}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {documentoVisualizando?.tipoArchivo.startsWith('image/') ? (
              <img 
                src={documentoVisualizando.urlArchivo} 
                alt={documentoVisualizando.nombreArchivo}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            ) : documentoVisualizando?.tipoArchivo === 'application/pdf' ? (
              <iframe 
                src={documentoVisualizando.urlArchivo}
                className="w-full h-[60vh] rounded-lg"
                title={documentoVisualizando.nombreArchivo}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Vista previa no disponible para este tipo de archivo</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (documentoVisualizando) {
                      const a = document.createElement('a');
                      a.href = documentoVisualizando.urlArchivo;
                      a.download = documentoVisualizando.nombreArchivo;
                      a.click();
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar archivo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
