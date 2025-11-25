import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Image, Plus, Edit, Trash2, Eye, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionEncuestasScreen() {
  const [activeTab, setActiveTab] = useState("encuestas");

  return (
    <div className="space-y-6" data-testid="screen-gestion-encuestas">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Encuestas e Imágenes Popup</h2>
          <p className="text-muted-foreground">Crea encuestas y configura popups informativos para usuarios</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="encuestas" data-testid="tab-encuestas">
              <ClipboardList className="h-4 w-4 mr-2" />
              Encuestas
            </TabsTrigger>
            <TabsTrigger value="popups" data-testid="tab-popups">
              <Image className="h-4 w-4 mr-2" />
              Imágenes Popup
            </TabsTrigger>
          </TabsList>
          <Button data-testid="button-agregar">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "encuestas" ? "Nueva Encuesta" : "Nuevo Popup"}
          </Button>
        </div>

        <TabsContent value="encuestas" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Encuestas Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">0</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Respuestas</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">0</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Participación</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">0%</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Encuestas</CardTitle>
              <CardDescription>Encuestas creadas para recopilar feedback de usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay encuestas configuradas. Crea una nueva encuesta para comenzar.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popups" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes Popup</CardTitle>
              <CardDescription>Popups informativos que se muestran a los usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No hay popups configurados. Agrega un nuevo popup para comenzar.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
