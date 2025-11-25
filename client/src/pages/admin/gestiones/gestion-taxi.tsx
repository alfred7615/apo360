import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Users, MapPin, DollarSign, Search, Plus, Edit, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionTaxiScreen() {
  const [activeTab, setActiveTab] = useState("viajes");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: viajes = [], isLoading: loadingViajes } = useQuery({
    queryKey: ["/api/taxi/viajes"],
  });

  const { data: conductores = [], isLoading: loadingConductores } = useQuery({
    queryKey: ["/api/taxi/conductores"],
  });

  const getStatusBadge = (estado: string) => {
    const estados: Record<string, { label: string; color: string }> = {
      pendiente: { label: "Pendiente", color: "bg-yellow-500" },
      en_camino: { label: "En camino", color: "bg-blue-500" },
      en_viaje: { label: "En viaje", color: "bg-green-500" },
      completado: { label: "Completado", color: "bg-gray-500" },
      cancelado: { label: "Cancelado", color: "bg-red-500" },
    };
    return estados[estado] || { label: estado, color: "bg-gray-500" };
  };

  return (
    <div className="space-y-6" data-testid="screen-gestion-taxi">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Car className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Servicio de Taxi</h2>
          <p className="text-muted-foreground">Administra conductores, viajes y tarifas del servicio de taxi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conductores Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{(conductores as any[]).filter((c: any) => c.activo).length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viajes Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">S/ 0.00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="viajes" data-testid="tab-viajes">
              <Car className="h-4 w-4 mr-2" />
              Viajes
            </TabsTrigger>
            <TabsTrigger value="conductores" data-testid="tab-conductores">
              <Users className="h-4 w-4 mr-2" />
              Conductores
            </TabsTrigger>
            <TabsTrigger value="tarifas" data-testid="tab-tarifas">
              <DollarSign className="h-4 w-4 mr-2" />
              Tarifas
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-taxi"
              />
            </div>
          </div>
        </div>

        <TabsContent value="viajes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Viajes</CardTitle>
              <CardDescription>Viajes realizados en el servicio de taxi</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingViajes ? (
                <div className="text-center py-8 text-muted-foreground">Cargando viajes...</div>
              ) : (viajes as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay viajes registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {(viajes as any[]).map((viaje: any) => {
                    const status = getStatusBadge(viaje.estado);
                    return (
                      <div key={viaje.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-muted">
                            <Car className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">Viaje #{viaje.id.slice(0, 8)}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{viaje.origen} → {viaje.destino}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">S/ {viaje.precio || "0.00"}</span>
                          <Badge className={status.color}>{status.label}</Badge>
                          <Button size="icon" variant="ghost" data-testid={`button-ver-viaje-${viaje.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conductores" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conductores Registrados</CardTitle>
                <CardDescription>Lista de conductores del servicio de taxi</CardDescription>
              </div>
              <Button data-testid="button-nuevo-conductor">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Conductor
              </Button>
            </CardHeader>
            <CardContent>
              {loadingConductores ? (
                <div className="text-center py-8 text-muted-foreground">Cargando conductores...</div>
              ) : (conductores as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay conductores registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {(conductores as any[]).map((conductor: any) => (
                    <div key={conductor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{conductor.nombre}</p>
                          <p className="text-sm text-muted-foreground">{conductor.telefono}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conductor.activo ? (
                          <Badge className="bg-green-500">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                        <Button size="icon" variant="ghost" data-testid={`button-edit-conductor-${conductor.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarifas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Tarifas</CardTitle>
              <CardDescription>Precios y tarifas del servicio de taxi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Tarifa Base</p>
                    <p className="text-sm text-muted-foreground">Precio inicial por viaje</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">S/ 3.00</span>
                    <Button size="sm" variant="outline">Editar</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Tarifa por Km</p>
                    <p className="text-sm text-muted-foreground">Precio por kilómetro recorrido</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">S/ 1.50</span>
                    <Button size="sm" variant="outline">Editar</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Tarifa Nocturna</p>
                    <p className="text-sm text-muted-foreground">Recargo después de las 10 PM</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">+20%</span>
                    <Button size="sm" variant="outline">Editar</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
