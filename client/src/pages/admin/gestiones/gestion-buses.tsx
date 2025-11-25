import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bus, Route, Clock, MapPin, Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionBusesScreen() {
  const [activeTab, setActiveTab] = useState("rutas");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6" data-testid="screen-gestion-buses">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Servicio de Buses</h2>
          <p className="text-muted-foreground">Administra rutas, horarios y boletos del servicio de buses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rutas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buses Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viajes Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Boletos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="rutas" data-testid="tab-rutas">
              <Route className="h-4 w-4 mr-2" />
              Rutas
            </TabsTrigger>
            <TabsTrigger value="horarios" data-testid="tab-horarios">
              <Clock className="h-4 w-4 mr-2" />
              Horarios
            </TabsTrigger>
            <TabsTrigger value="buses" data-testid="tab-buses">
              <Bus className="h-4 w-4 mr-2" />
              Buses
            </TabsTrigger>
          </TabsList>
          <Button data-testid="button-agregar">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "rutas" ? "Nueva Ruta" : activeTab === "horarios" ? "Nuevo Horario" : "Nuevo Bus"}
          </Button>
        </div>

        <TabsContent value="rutas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rutas de Buses</CardTitle>
              <CardDescription>Rutas configuradas para el servicio de transporte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay rutas configuradas. Agrega una nueva ruta para comenzar.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de Salida</CardTitle>
              <CardDescription>Horarios programados para cada ruta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay horarios configurados.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flota de Buses</CardTitle>
              <CardDescription>Buses registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay buses registrados.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
