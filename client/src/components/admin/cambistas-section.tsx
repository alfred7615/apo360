import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw,
  UserPlus,
  UserMinus,
  Clock,
  MapPin,
  Phone
} from "lucide-react";
import type { Usuario, ConfiguracionMoneda, TasaCambioLocal } from "@shared/schema";

export function CambistasSection() {
  const { toast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [dialogoAgregarAbierto, setDialogoAgregarAbierto] = useState(false);

  const { data: cambistas, isLoading: cargandoCambistas, refetch: refetchCambistas } = useQuery<Usuario[]>({
    queryKey: ["/api/admin/cambistas"],
  });

  const { data: monedas } = useQuery<ConfiguracionMoneda[]>({
    queryKey: ["/api/monedas/configuracion"],
  });

  const { data: tasasLocales, refetch: refetchTasas } = useQuery<TasaCambioLocal[]>({
    queryKey: ["/api/monedas/tasas-locales"],
  });

  const { data: usuarios } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
    enabled: dialogoAgregarAbierto,
  });

  const asignarCambistaMutation = useMutation({
    mutationFn: async (usuarioId: string) => {
      await apiRequest("POST", `/api/admin/cambistas/${usuarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cambistas"] });
      setDialogoAgregarAbierto(false);
      toast({ title: "Cambista asignado", description: "Se ha asignado el rol de cambista al usuario" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo asignar el rol", variant: "destructive" });
    },
  });

  const removerCambistaMutation = useMutation({
    mutationFn: async (usuarioId: string) => {
      await apiRequest("DELETE", `/api/admin/cambistas/${usuarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cambistas"] });
      toast({ title: "Rol removido", description: "Se ha removido el rol de cambista" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo remover el rol", variant: "destructive" });
    },
  });

  const getNombreUsuario = (u: Usuario) => {
    if (u.firstName || u.lastName) {
      return [u.firstName, u.lastName].filter(Boolean).join(" ");
    }
    return "Usuario";
  };

  const cambistasFiltrados = cambistas?.filter((c) =>
    getNombreUsuario(c).toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const usuariosFiltrados = usuarios?.filter((u) =>
    u.rol !== "cambista" &&
    (getNombreUsuario(u).toLowerCase().includes(busquedaUsuarios.toLowerCase()) ||
     u.email?.toLowerCase().includes(busquedaUsuarios.toLowerCase()))
  );

  const getTasasPorCambista = (cambistaId: string) => {
    return tasasLocales?.filter((t) => t.cambistaId === cambistaId) || [];
  };

  const formatearFecha = (fecha: Date | string | null) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6" data-testid="section-cambistas">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Gestión de Cambistas
          </h2>
          <p className="text-muted-foreground">
            Administra los usuarios con rol de cambista y sus tasas de cambio
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { refetchCambistas(); refetchTasas(); }}
            data-testid="button-refrescar-cambistas"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={dialogoAgregarAbierto} onOpenChange={setDialogoAgregarAbierto}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-agregar-cambista">
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Cambista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar Cambista</DialogTitle>
                <DialogDescription>
                  Busca un usuario para asignarle el rol de cambista
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuario por nombre o email..."
                    value={busquedaUsuarios}
                    onChange={(e) => setBusquedaUsuarios(e.target.value)}
                    className="pl-10"
                    data-testid="input-buscar-usuarios"
                  />
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {usuariosFiltrados?.slice(0, 20).map((usuario) => (
                      <div
                        key={usuario.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                        data-testid={`item-usuario-${usuario.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {usuario.profileImageUrl ? (
                            <img
                              src={usuario.profileImageUrl}
                              alt={getNombreUsuario(usuario)}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{getNombreUsuario(usuario)}</p>
                            <p className="text-xs text-muted-foreground">{usuario.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => asignarCambistaMutation.mutate(usuario.id)}
                          disabled={asignarCambistaMutation.isPending}
                          data-testid={`button-asignar-${usuario.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {usuariosFiltrados?.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No se encontraron usuarios
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cambista..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
          data-testid="input-buscar-cambistas"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="col-span-full md:col-span-1" data-testid="card-resumen-cambistas">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold" data-testid="text-total-cambistas">
                  {cambistas?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Cambistas</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold" data-testid="text-total-tasas">
                  {tasasLocales?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Tasas Activas</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold" data-testid="text-total-monedas">
                  {monedas?.filter((m) => m.activo).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Monedas</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {tasasLocales?.filter((t) => t.activo).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Tasas Verificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {cargandoCambistas ? (
          <div className="col-span-full flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : cambistasFiltrados && cambistasFiltrados.length > 0 ? (
          cambistasFiltrados.map((cambista) => {
            const tasasCambista = getTasasPorCambista(cambista.id);
            return (
              <Card key={cambista.id} className="hover-elevate" data-testid={`card-cambista-${cambista.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {cambista.profileImageUrl ? (
                        <img
                          src={cambista.profileImageUrl}
                          alt={getNombreUsuario(cambista)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{getNombreUsuario(cambista)}</CardTitle>
                        <CardDescription className="text-xs">{cambista.email}</CardDescription>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Remover rol de cambista a este usuario?")) {
                          removerCambistaMutation.mutate(cambista.id);
                        }
                      }}
                      data-testid={`button-remover-${cambista.id}`}
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Actualizado: {formatearFecha(cambista.updatedAt)}</span>
                  </div>
                  
                  {cambista.telefono && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{cambista.telefono}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-xs font-medium mb-2">Tasas Registradas ({tasasCambista.length})</p>
                    {tasasCambista.length > 0 ? (
                      <div className="space-y-1">
                        {tasasCambista.slice(0, 3).map((tasa) => (
                          <div
                            key={tasa.id}
                            className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded"
                          >
                            <span className="font-medium">
                              {tasa.monedaOrigenCodigo} → {tasa.monedaDestinoCodigo}
                            </span>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-green-600">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                C: {parseFloat(tasa.tasaCompra).toFixed(4)}
                              </Badge>
                              <Badge variant="outline" className="text-red-600">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                V: {parseFloat(tasa.tasaVenta).toFixed(4)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {tasasCambista.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{tasasCambista.length - 3} más
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin tasas registradas</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay cambistas registrados</p>
            <p className="text-sm text-muted-foreground">
              Agrega usuarios con rol de cambista para que puedan actualizar tasas de cambio
            </p>
          </div>
        )}
      </div>

      <Card data-testid="card-monedas-config">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monedas Configuradas
          </CardTitle>
          <CardDescription>
            Monedas disponibles para el sistema de cambio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {monedas?.map((moneda) => (
              <div
                key={moneda.id}
                className="flex flex-col items-center p-4 border rounded-lg text-center"
                data-testid={`item-moneda-${moneda.codigo}`}
              >
                <span className="text-2xl mb-1">{moneda.banderaUrl || "💱"}</span>
                <p className="font-bold">{moneda.codigo}</p>
                <p className="text-xs text-muted-foreground">{moneda.nombreCorto}</p>
                <p className="text-xs mt-1">
                  Ref: {parseFloat(moneda.tasaPromedioInternet || "0").toFixed(4)}
                </p>
                <Badge variant={moneda.activo ? "default" : "secondary"} className="mt-2">
                  {moneda.activo ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
