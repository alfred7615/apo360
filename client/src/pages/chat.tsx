import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Send, Search, MoreVertical, Users, MessageCircle, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface GrupoChat {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  avatarUrl?: string;
  ultimoMensaje?: {
    contenido: string;
    createdAt: string;
  };
  mensajesNoLeidos?: number;
}

interface Mensaje {
  id: string;
  grupoId?: string;
  remitenteId: string;
  contenido: string;
  tipo: string;
  leido: boolean;
  createdAt: string;
  remitente?: {
    primerNombre?: string;
    apellido?: string;
    imagenPerfil?: string;
  };
}

export default function Chat() {
  const { user, isLoading: cargandoAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
  const [mensajeNuevo, setMensajeNuevo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cargandoAuth && !user) {
      toast({
        title: "No autenticado",
        description: "Redirigiendo al inicio de sesión...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, cargandoAuth, toast]);

  const { data: grupos = [], isLoading: cargandoGrupos } = useQuery<GrupoChat[]>({
    queryKey: ["/api/chat/grupos"],
    enabled: !!user,
  });

  const { data: mensajes = [], isLoading: cargandoMensajes } = useQuery<Mensaje[]>({
    queryKey: ["/api/chat/mensajes", grupoSeleccionado],
    enabled: !!grupoSeleccionado && !!user,
  });

  const enviarMensajeMutation = useMutation({
    mutationFn: async (datos: any) => {
      return await apiRequest("POST", "/api/chat/mensajes", datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mensajes", grupoSeleccionado] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos"] });
      setMensajeNuevo("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autenticado",
          description: "Redirigiendo al inicio de sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const gruposFiltrados = grupos.filter((grupo) =>
    grupo.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const grupoActual = grupos.find((g) => g.id === grupoSeleccionado);

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeNuevo.trim() || !grupoSeleccionado) return;

    enviarMensajeMutation.mutate({
      grupoId: grupoSeleccionado,
      contenido: mensajeNuevo.trim(),
      tipo: "texto",
    });
  };

  if (cargandoAuth || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background" data-testid="page-chat">
      {/* Lista de conversaciones */}
      <div className={`${grupoSeleccionado ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r bg-card`}>
        {/* Header de conversaciones */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chats
            </h2>
            <Button size="icon" variant="ghost" data-testid="button-new-group">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        {/* Lista de grupos */}
        <ScrollArea className="flex-1">
          {cargandoGrupos ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : gruposFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay conversaciones</p>
            </div>
          ) : (
            <div className="p-2">
              {gruposFiltrados.map((grupo) => (
                <button
                  key={grupo.id}
                  onClick={() => setGrupoSeleccionado(grupo.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all hover-elevate active-elevate-2 ${
                    grupoSeleccionado === grupo.id ? 'bg-accent' : ''
                  }`}
                  data-testid={`button-conversation-${grupo.id}`}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={grupo.avatarUrl} alt={grupo.nombre} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                      {grupo.nombre.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{grupo.nombre}</p>
                      {grupo.ultimoMensaje && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(grupo.ultimoMensaje.createdAt).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {grupo.ultimoMensaje?.contenido || 'Sin mensajes'}
                      </p>
                      {grupo.mensajesNoLeidos && grupo.mensajesNoLeidos > 0 && (
                        <Badge variant="default" className="shrink-0 h-5 min-w-5 px-1.5 text-xs">
                          {grupo.mensajesNoLeidos}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Ventana de chat */}
      {grupoSeleccionado && grupoActual ? (
        <div className="flex flex-col flex-1">
          {/* Header del chat */}
          <div className="flex items-center gap-3 p-4 border-b bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setGrupoSeleccionado(null)}
              data-testid="button-back-to-conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={grupoActual.avatarUrl} alt={grupoActual.nombre} />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                {grupoActual.nombre.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <p className="font-semibold" data-testid="text-chat-name">{grupoActual.nombre}</p>
              <p className="text-xs text-muted-foreground capitalize">{grupoActual.tipo}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-chat-options">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Ver información</DropdownMenuItem>
                <DropdownMenuItem>Silenciar notificaciones</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Salir del grupo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mensajes */}
          <ScrollArea className="flex-1 p-4 bg-muted/30">
            {cargandoMensajes ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
                </div>
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p>No hay mensajes aún</p>
                  <p className="text-sm mt-1">Sé el primero en enviar un mensaje</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {mensajes.map((mensaje) => {
                  const esMio = mensaje.remitenteId === user.id;
                  const nombreRemitente = mensaje.remitente
                    ? `${mensaje.remitente.primerNombre || ''} ${mensaje.remitente.apellido || ''}`.trim()
                    : 'Usuario';

                  return (
                    <div
                      key={mensaje.id}
                      className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${mensaje.id}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!esMio && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={mensaje.remitente?.imagenPerfil} alt={nombreRemitente} />
                            <AvatarFallback className="bg-muted text-xs">
                              {nombreRemitente.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                          {!esMio && (
                            <p className="text-xs font-medium text-muted-foreground mb-1 px-3">
                              {nombreRemitente}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              esMio
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                                : 'bg-card border'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 px-1">
                            {new Date(mensaje.createdAt).toLocaleTimeString('es-PE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={mensajesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input de mensaje */}
          <form onSubmit={enviarMensaje} className="p-4 border-t bg-card">
            <div className="flex gap-2">
              <Input
                value={mensajeNuevo}
                onChange={(e) => setMensajeNuevo(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1"
                disabled={enviarMensajeMutation.isPending}
                data-testid="input-message"
              />
              <Button
                type="submit"
                disabled={!mensajeNuevo.trim() || enviarMensajeMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-24 w-24 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">Selecciona una conversación</p>
            <p className="text-sm">Elige un grupo para comenzar a chatear</p>
          </div>
        </div>
      )}
    </div>
  );
}
