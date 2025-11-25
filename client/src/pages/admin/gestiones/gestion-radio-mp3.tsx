import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Music, Plus, Play, Pause, Edit, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionRadioMp3Screen() {
  const [activeTab, setActiveTab] = useState("radios");

  const { data: radios = [], isLoading: loadingRadios } = useQuery({
    queryKey: ["/api/radios-online"],
  });

  const { data: mp3s = [], isLoading: loadingMp3s } = useQuery({
    queryKey: ["/api/archivos-mp3"],
  });

  return (
    <div className="space-y-6" data-testid="screen-gestion-radio-mp3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Radio className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Radio Online y Listas MP3</h2>
          <p className="text-muted-foreground">Configura radios en streaming y listas de reproducción MP3</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="radios" data-testid="tab-radios">
              <Radio className="h-4 w-4 mr-2" />
              Radios Online
            </TabsTrigger>
            <TabsTrigger value="mp3" data-testid="tab-mp3">
              <Music className="h-4 w-4 mr-2" />
              Listas MP3
            </TabsTrigger>
          </TabsList>
          <Button data-testid="button-agregar-audio">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "radios" ? "Nueva Radio" : "Nuevo MP3"}
          </Button>
        </div>

        <TabsContent value="radios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Radios Online Configuradas</CardTitle>
              <CardDescription>URLs de streaming de radio para reproducción en la app</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRadios ? (
                <div className="text-center py-8 text-muted-foreground">Cargando radios...</div>
              ) : (radios as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay radios configuradas. Agrega una nueva radio para comenzar.
                </div>
              ) : (
                <div className="space-y-3">
                  {(radios as any[]).map((radio: any) => (
                    <div key={radio.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Radio className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{radio.nombre}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">{radio.urlStream}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={radio.activo ? "default" : "secondary"}>
                          {radio.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        <Button size="icon" variant="ghost" data-testid={`button-play-radio-${radio.id}`}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-edit-radio-${radio.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-delete-radio-${radio.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mp3" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Archivos MP3</CardTitle>
              <CardDescription>Lista de reproducción de archivos de audio MP3</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMp3s ? (
                <div className="text-center py-8 text-muted-foreground">Cargando archivos MP3...</div>
              ) : (mp3s as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay archivos MP3. Sube un nuevo archivo para comenzar.
                </div>
              ) : (
                <div className="space-y-3">
                  {(mp3s as any[]).map((mp3: any) => (
                    <div key={mp3.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Music className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{mp3.titulo}</p>
                          <p className="text-sm text-muted-foreground">{mp3.artista || "Artista desconocido"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Orden: {mp3.orden}</Badge>
                        <Button size="icon" variant="ghost" data-testid={`button-play-mp3-${mp3.id}`}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-edit-mp3-${mp3.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-delete-mp3-${mp3.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
