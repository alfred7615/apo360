import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  GripVertical, 
  Music,
  Loader2,
  Volume2,
  FolderOpen,
  FileAudio,
  Save,
  X
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ListaMp3, ArchivoMp3 } from "@shared/schema";

interface GestorArchivosMp3Props {
  lista: ListaMp3;
  onBack: () => void;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function GestorArchivosMp3({ lista, onBack }: GestorArchivosMp3Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [subiendo, setSubiendo] = useState(false);
  const [reproduciendo, setReproduciendo] = useState<string | null>(null);
  const [editandoArchivo, setEditandoArchivo] = useState<ArchivoMp3 | null>(null);
  const [eliminarArchivo, setEliminarArchivo] = useState<ArchivoMp3 | null>(null);
  const [tituloEditado, setTituloEditado] = useState("");
  const [artistaEditado, setArtistaEditado] = useState("");
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [ordenTemporal, setOrdenTemporal] = useState<ArchivoMp3[]>([]);

  const { data: archivos = [], isLoading, refetch } = useQuery<ArchivoMp3[]>({
    queryKey: ["/api/archivos-mp3", { listaId: lista.id }],
    queryFn: async () => {
      const response = await fetch(`/api/archivos-mp3?listaId=${lista.id}`);
      if (!response.ok) throw new Error("Error al cargar archivos");
      return response.json();
    },
  });

  const archivosOrdenados = ordenTemporal.length > 0 ? ordenTemporal : archivos.sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const updateArchivoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/archivos-mp3/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3", { listaId: lista.id }] });
      setEditandoArchivo(null);
      toast({ title: "Actualizado", description: "Archivo actualizado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al actualizar", variant: "destructive" });
    },
  });

  const deleteArchivoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/archivos-mp3/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3", { listaId: lista.id }] });
      setEliminarArchivo(null);
      toast({ title: "Eliminado", description: "Archivo eliminado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al eliminar", variant: "destructive" });
    },
  });

  const reordenarMutation = useMutation({
    mutationFn: (orden: { id: string; orden: number }[]) => 
      apiRequest("POST", "/api/archivos-mp3/reordenar", { listaId: lista.id, orden }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3", { listaId: lista.id }] });
      setOrdenTemporal([]);
      toast({ title: "Reordenado", description: "Orden actualizado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Error al reordenar", variant: "destructive" });
    },
  });

  const handleSubirArchivos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("archivos", files[i]);
    }

    setSubiendo(true);
    try {
      const response = await fetch(`/api/listas-mp3/${lista.id}/subir`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al subir archivos");
      }

      const resultado = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/archivos-mp3", { listaId: lista.id }] });
      toast({ 
        title: "Archivos subidos", 
        description: `Se subieron ${resultado.length} archivo(s) correctamente` 
      });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Error al subir archivos", 
        variant: "destructive" 
      });
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReproducir = (archivo: ArchivoMp3) => {
    if (reproduciendo === archivo.id) {
      audioRef.current?.pause();
      setReproduciendo(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = archivo.archivoUrl;
        audioRef.current.play().catch(console.error);
        setReproduciendo(archivo.id);
      }
    }
  };

  const handleAudioEnded = () => {
    setReproduciendo(null);
  };

  const handleEditarArchivo = (archivo: ArchivoMp3) => {
    setEditandoArchivo(archivo);
    setTituloEditado(archivo.titulo);
    setArtistaEditado(archivo.artista || "");
  };

  const handleGuardarEdicion = () => {
    if (!editandoArchivo || !tituloEditado.trim()) return;
    updateArchivoMutation.mutate({
      id: editandoArchivo.id,
      data: { 
        titulo: tituloEditado.trim(),
        artista: artistaEditado.trim() || null,
      },
    });
  };

  const handleDragStart = (e: React.DragEvent, archivo: ArchivoMp3) => {
    setArrastrando(archivo.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", archivo.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, archivoDestino: ArchivoMp3) => {
    e.preventDefault();
    const archivoOrigenId = e.dataTransfer.getData("text/plain");
    
    if (archivoOrigenId === archivoDestino.id) {
      setArrastrando(null);
      return;
    }

    const archivosActuales = ordenTemporal.length > 0 ? [...ordenTemporal] : [...archivosOrdenados];
    const indiceOrigen = archivosActuales.findIndex(a => a.id === archivoOrigenId);
    const indiceDestino = archivosActuales.findIndex(a => a.id === archivoDestino.id);

    if (indiceOrigen !== -1 && indiceDestino !== -1) {
      const [archivoMovido] = archivosActuales.splice(indiceOrigen, 1);
      archivosActuales.splice(indiceDestino, 0, archivoMovido);
      
      const nuevosArchivos = archivosActuales.map((a, idx) => ({ ...a, orden: idx }));
      setOrdenTemporal(nuevosArchivos);
    }

    setArrastrando(null);
  };

  const handleDragEnd = () => {
    setArrastrando(null);
  };

  const handleGuardarOrden = () => {
    if (ordenTemporal.length === 0) return;
    const orden = ordenTemporal.map((a, idx) => ({ id: a.id, orden: idx }));
    reordenarMutation.mutate(orden);
  };

  const handleCancelarOrden = () => {
    setOrdenTemporal([]);
  };

  return (
    <div className="space-y-4">
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="touch-manipulation"
            data-testid="button-volver-listas"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-500/10">
              <Music className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">{lista.nombre}</h3>
              {lista.rutaCarpeta && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FolderOpen className="h-3 w-3" />
                  <span>/assets/mp3/{lista.rutaCarpeta}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ordenTemporal.length > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancelarOrden}
                className="touch-manipulation"
                data-testid="button-cancelar-orden"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardarOrden}
                disabled={reordenarMutation.isPending}
                className="touch-manipulation"
                data-testid="button-guardar-orden"
              >
                {reordenarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Orden
              </Button>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => handleSubirArchivos(e.target.files)}
            className="hidden"
            data-testid="input-subir-archivos"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
            className="touch-manipulation"
            data-testid="button-subir-archivos"
          >
            {subiendo ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {subiendo ? "Subiendo..." : "Subir MP3"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg">Archivos MP3</CardTitle>
              <CardDescription>
                {archivos.length} archivo(s) en esta lista
                {ordenTemporal.length > 0 && (
                  <Badge variant="secondary" className="ml-2">Orden modificado</Badge>
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Arrastra para reordenar
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : archivos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileAudio className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay archivos MP3 en esta lista.</p>
              <p className="text-sm mt-1">Haz clic en "Subir MP3" para agregar canciones.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {archivosOrdenados.map((archivo, index) => (
                <div
                  key={archivo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, archivo)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, archivo)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-3 p-3 border rounded-lg transition-all
                    ${arrastrando === archivo.id ? "opacity-50 border-primary" : "hover:bg-muted/50"}
                    ${reproduciendo === archivo.id ? "border-green-500 bg-green-500/5" : ""}
                    cursor-grab active:cursor-grabbing touch-manipulation
                  `}
                  data-testid={`archivo-item-${archivo.id}`}
                >
                  <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs w-6 text-center">{index + 1}</span>
                  </div>
                  
                  <Button
                    size="icon"
                    variant={reproduciendo === archivo.id ? "default" : "outline"}
                    onClick={() => handleReproducir(archivo)}
                    className="flex-shrink-0 touch-manipulation"
                    data-testid={`button-play-${archivo.id}`}
                  >
                    {reproduciendo === archivo.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{archivo.titulo}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {archivo.artista && <span>{archivo.artista}</span>}
                      {archivo.tamano && (
                        <Badge variant="secondary" className="text-[10px]">
                          {formatBytes(archivo.tamano)}
                        </Badge>
                      )}
                      {reproduciendo === archivo.id && (
                        <Badge variant="default" className="text-[10px] bg-green-500">
                          <Volume2 className="h-3 w-3 mr-1" />
                          Reproduciendo
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditarArchivo(archivo)}
                      className="touch-manipulation"
                      data-testid={`button-edit-${archivo.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEliminarArchivo(archivo)}
                      className="touch-manipulation"
                      data-testid={`button-delete-${archivo.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editandoArchivo} onOpenChange={() => setEditandoArchivo(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Archivo</DialogTitle>
            <DialogDescription>Modifica el titulo y artista del archivo MP3</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Titulo *</Label>
              <Input
                id="titulo"
                value={tituloEditado}
                onChange={(e) => setTituloEditado(e.target.value)}
                placeholder="Titulo de la cancion"
                className="touch-manipulation"
                data-testid="input-editar-titulo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="artista">Artista</Label>
              <Input
                id="artista"
                value={artistaEditado}
                onChange={(e) => setArtistaEditado(e.target.value)}
                placeholder="Nombre del artista"
                className="touch-manipulation"
                data-testid="input-editar-artista"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditandoArchivo(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarEdicion}
              disabled={!tituloEditado.trim() || updateArchivoMutation.isPending}
              data-testid="button-guardar-edicion"
            >
              {updateArchivoMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!eliminarArchivo} onOpenChange={() => setEliminarArchivo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Archivo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar "{eliminarArchivo?.titulo}"? 
              Esta accion eliminara el archivo del servidor y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eliminarArchivo && deleteArchivoMutation.mutate(eliminarArchivo.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-eliminar"
            >
              {deleteArchivoMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
