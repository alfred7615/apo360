import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Truck, Home, Package, Wrench, Search, Plus, Edit, Trash2, Eye, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionServiciosScreen() {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ["/api/servicios"],
  });

  const categorias = [
    { id: "todos", title: "Todos", icon: Package },
    { id: "mudanzas", title: "Mudanzas", icon: Truck },
    { id: "alquileres", title: "Alquileres", icon: Home },
    { id: "reparaciones", title: "Reparaciones", icon: Wrench },
  ];

  const filteredServicios = (servicios as any[]).filter((s: any) => {
    const matchesSearch = s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === "todos" || s.categoria === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" data-testid="screen-gestion-servicios">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Truck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
          <p className="text-muted-foreground">Administra mudanzas, alquileres, reparaciones y otros servicios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{(servicios as any[]).length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mudanzas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {(servicios as any[]).filter((s: any) => s.categoria === "mudanzas").length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alquileres</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {(servicios as any[]).filter((s: any) => s.categoria === "alquileres").length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reparaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {(servicios as any[]).filter((s: any) => s.categoria === "reparaciones").length}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-servicios"
          />
        </div>
        <Button data-testid="button-nuevo-servicio">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          {categorias.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} data-testid={`tab-${cat.id}`}>
              <cat.icon className="h-4 w-4 mr-2" />
              {cat.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Servicios {activeTab !== "todos" ? `- ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` : ""}</CardTitle>
              <CardDescription>Lista de servicios disponibles en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando servicios...</div>
              ) : filteredServicios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay servicios en esta categoría. Agrega un nuevo servicio para comenzar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServicios.map((servicio: any) => (
                    <Card key={servicio.id} className="overflow-hidden">
                      {servicio.imagenUrl && (
                        <div className="aspect-video bg-muted">
                          <img 
                            src={servicio.imagenUrl} 
                            alt={servicio.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{servicio.nombre}</h3>
                          <Badge variant="outline">{servicio.categoria}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {servicio.descripcion || "Sin descripción"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          {servicio.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {servicio.telefono}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-ver-${servicio.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-edit-${servicio.id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-delete-${servicio.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
