import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Edit, Trash2, Eye, MapPin, Clock, Users, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionEventosScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["/api/eventos"],
  });

  const filteredEventos = (eventos as any[]).filter((e: any) =>
    e.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventStatus = (fechaInicio: string, fechaFin: string) => {
    const now = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (now < inicio) return { label: "Próximo", color: "bg-blue-500" };
    if (now >= inicio && now <= fin) return { label: "En curso", color: "bg-green-500" };
    return { label: "Finalizado", color: "bg-gray-500" };
  };

  return (
    <div className="space-y-6" data-testid="screen-gestion-eventos">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Eventos Calendarizado</h2>
          <p className="text-muted-foreground">Programa y administra eventos de la comunidad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{(eventos as any[]).length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-blue-500">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-500">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-gray-500">0</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
            data-testid="input-search-eventos"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            Lista
          </Button>
          <Button 
            variant={viewMode === "calendar" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("calendar")}
            data-testid="button-view-calendar"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Calendario
          </Button>
          <Button data-testid="button-nuevo-evento">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Eventos</CardTitle>
            <CardDescription>Eventos programados en la comunidad</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando eventos...</div>
            ) : filteredEventos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay eventos programados. Crea un nuevo evento para comenzar.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEventos.map((evento: any) => {
                  const status = getEventStatus(evento.fechaInicio, evento.fechaFin);
                  return (
                    <div key={evento.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      {evento.imagenUrl && (
                        <img 
                          src={evento.imagenUrl} 
                          alt={evento.titulo}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{evento.titulo}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {evento.descripcion || "Sin descripción"}
                            </p>
                          </div>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(evento.fechaInicio).toLocaleDateString()}
                          </span>
                          {evento.ubicacion && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {evento.ubicacion}
                            </span>
                          )}
                          {evento.capacidad && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {evento.capacidad} personas
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button size="sm" variant="outline" data-testid={`button-ver-evento-${evento.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-edit-evento-${evento.id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-delete-evento-${evento.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Vista de Calendario</CardTitle>
            <CardDescription>Visualiza eventos en formato calendario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16 text-muted-foreground">
              Vista de calendario próximamente disponible.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
