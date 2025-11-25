import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wallet, CreditCard, TrendingUp, TrendingDown, Search, Plus, DollarSign, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionCarteraScreen() {
  const [activeTab, setActiveTab] = useState("saldos");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const filteredUsuarios = (usuarios as any[]).filter((u: any) => 
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="screen-gestion-cartera">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Cartera y Saldos</h2>
          <p className="text-muted-foreground">Administra saldos, comisiones y transacciones de usuarios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total en Carteras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">S/ 0.00</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">S/ 0.00</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Egresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">S/ 0.00</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comisión Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">0%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="saldos" data-testid="tab-saldos">
              <Wallet className="h-4 w-4 mr-2" />
              Saldos de Usuarios
            </TabsTrigger>
            <TabsTrigger value="transacciones" data-testid="tab-transacciones">
              <CreditCard className="h-4 w-4 mr-2" />
              Transacciones
            </TabsTrigger>
            <TabsTrigger value="comisiones" data-testid="tab-comisiones">
              <Percent className="h-4 w-4 mr-2" />
              Comisiones
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-cartera"
              />
            </div>
            <Button data-testid="button-nueva-transaccion">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </div>
        </div>

        <TabsContent value="saldos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saldos de Usuarios</CardTitle>
              <CardDescription>Balance actual de cada usuario en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando saldos...</div>
              ) : filteredUsuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay usuarios con saldo configurado.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsuarios.slice(0, 10).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.nombre || "Sin nombre"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">S/ {user.saldo || "0.00"}</p>
                          <p className="text-xs text-muted-foreground">Saldo disponible</p>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-ajustar-saldo-${user.id}`}>
                          Ajustar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacciones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
              <CardDescription>Movimientos de dinero en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay transacciones registradas.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comisiones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Comisiones</CardTitle>
              <CardDescription>Porcentajes de comisión por tipo de servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Comisión de Taxi</p>
                    <p className="text-sm text-muted-foreground">Porcentaje por cada viaje completado</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">15%</Badge>
                    <Button size="sm" variant="ghost">Editar</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Comisión de Delivery</p>
                    <p className="text-sm text-muted-foreground">Porcentaje por cada entrega completada</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">10%</Badge>
                    <Button size="sm" variant="ghost">Editar</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Descuento por Compartir en Redes</p>
                    <p className="text-sm text-muted-foreground">Descuento por promocionar en redes sociales</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">5%</Badge>
                    <Button size="sm" variant="ghost">Editar</Button>
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
