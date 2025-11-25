import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Coins, TrendingUp, TrendingDown, DollarSign, Plus, Edit, RefreshCw, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionMonedaScreen() {
  const [activeTab, setActiveTab] = useState("tasas");

  const monedas = [
    { codigo: "USD", nombre: "Dólar Americano", simbolo: "$", compra: 3.72, venta: 3.78 },
    { codigo: "EUR", nombre: "Euro", simbolo: "€", compra: 4.05, venta: 4.12 },
    { codigo: "PEN", nombre: "Sol Peruano", simbolo: "S/", compra: 1.00, venta: 1.00 },
    { codigo: "BOB", nombre: "Boliviano", simbolo: "Bs", compra: 0.54, venta: 0.56 },
    { codigo: "CLP", nombre: "Peso Chileno", simbolo: "$", compra: 0.0041, venta: 0.0043 },
  ];

  return (
    <div className="space-y-6" data-testid="screen-gestion-moneda">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Cambio de Moneda</h2>
          <p className="text-muted-foreground">Configura tipos de cambio y operaciones de divisas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">USD / PEN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">3.75</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EUR / PEN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">4.08</span>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operaciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volumen Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">S/ 0.00</span>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tasas" data-testid="tab-tasas">
              <Coins className="h-4 w-4 mr-2" />
              Tasas de Cambio
            </TabsTrigger>
            <TabsTrigger value="historial" data-testid="tab-historial">
              <History className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" data-testid="button-actualizar-tasas">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Tasas
            </Button>
            <Button data-testid="button-nueva-moneda">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Moneda
            </Button>
          </div>
        </div>

        <TabsContent value="tasas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasas de Cambio Actuales</CardTitle>
              <CardDescription>Configuración de compra y venta de divisas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monedas.map((moneda) => (
                  <div key={moneda.codigo} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                        {moneda.simbolo}
                      </div>
                      <div>
                        <p className="font-medium">{moneda.nombre}</p>
                        <p className="text-sm text-muted-foreground">{moneda.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Compra</p>
                        <p className="font-semibold text-green-600">S/ {moneda.compra.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Venta</p>
                        <p className="font-semibold text-red-600">S/ {moneda.venta.toFixed(2)}</p>
                      </div>
                      <Button size="icon" variant="ghost" data-testid={`button-edit-moneda-${moneda.codigo}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Operaciones</CardTitle>
              <CardDescription>Cambios de moneda realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay operaciones de cambio registradas.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
