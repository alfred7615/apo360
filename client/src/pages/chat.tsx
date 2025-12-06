import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, Search, MoreVertical, Users, MessageCircle, Plus, ArrowLeft, WifiOff,
  Paperclip, Image, Mic, MapPin, Phone, Video, UserPlus, Mail, X, Check, 
  MessageSquare, Globe, ExternalLink
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useWebSocket } from "@/hooks/useWebSocket";

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
  tipo?: string;
  archivoUrl?: string;
  gpsLatitud?: number;
  gpsLongitud?: number;
  metadataFoto?: {
    nombreUsuario?: string;
    fechaHora?: string;
    logoUrl?: string;
  };
  eliminado?: boolean;
  createdAt: string;
}

interface MiembroGrupo {
  id: string;
  usuarioId: string;
  grupoId: string;
  rol: string;
  usuario?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
}

interface Contacto {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  avatarUrl?: string;
  registrado: boolean;
}

export default function Chat() {
  const { user, isLoading: cargandoAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
  const [mensajeNuevo, setMensajeNuevo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaContactos, setBusquedaContactos] = useState("");
  const [mostrarPanelInfo, setMostrarPanelInfo] = useState(false);
  const [mostrarModalInvitar, setMostrarModalInvitar] = useState(false);
  const [emailInvitacion, setEmailInvitacion] = useState("");
  const [telefonoInvitacion, setTelefonoInvitacion] = useState("");
  const [metodoInvitacion, setMetodoInvitacion] = useState<'email' | 'whatsapp'>('email');
  const [tabBusqueda, setTabBusqueda] = useState<'grupos' | 'contactos' | 'gmail'>('grupos');
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [enviandoUbicacion, setEnviandoUbicacion] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const inputImagenRef = useRef<HTMLInputElement>(null);

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
    queryKey: ["/api/chat/mis-grupos"],
    enabled: !!user,
  });

  const { data: mensajes = [], isLoading: cargandoMensajes } = useQuery<Mensaje[]>({
    queryKey: ["/api/chat/grupos", grupoSeleccionado, "mensajes"],
    queryFn: async () => {
      if (!grupoSeleccionado) return [];
      const res = await fetch(`/api/chat/grupos/${grupoSeleccionado}/mensajes`);
      if (!res.ok) throw new Error("Error al cargar mensajes");
      return res.json();
    },
    enabled: !!grupoSeleccionado && !!user,
  });

  const { data: miembrosGrupo = [] } = useQuery<MiembroGrupo[]>({
    queryKey: ["/api/chat/grupos", grupoSeleccionado, "miembros"],
    queryFn: async () => {
      if (!grupoSeleccionado) return [];
      const res = await fetch(`/api/chat/grupos/${grupoSeleccionado}/miembros`);
      if (!res.ok) throw new Error("Error al cargar miembros");
      return res.json();
    },
    enabled: !!grupoSeleccionado && !!user,
  });

  const { data: contactos = [] } = useQuery<Contacto[]>({
    queryKey: ["/api/contactos"],
    queryFn: async () => {
      const res = await fetch("/api/contactos");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocket({
    grupoId: grupoSeleccionado || "",
    onMessage: (nuevoMensaje: any) => {
      console.log('Nuevo mensaje recibido por WebSocket');
    },
    onError: (error) => {
      console.error('Error WebSocket:', error);
    },
  });

  const enviarMensajeMutation = useMutation({
    mutationFn: async (datos: { grupoId: string; contenido: string; tipo: string; archivoUrl?: string; gpsLatitud?: number; gpsLongitud?: number }) => {
      const response = await apiRequest("POST", `/api/chat/grupos/${datos.grupoId}/mensajes`, {
        contenido: datos.contenido,
        tipoContenido: datos.tipo,
        archivoUrl: datos.archivoUrl,
        gpsLatitud: datos.gpsLatitud,
        gpsLongitud: datos.gpsLongitud,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Error al enviar mensaje");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos", grupoSeleccionado, "mensajes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
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
      
      const mensaje = error.message || "No se pudo enviar el mensaje";
      
      if (mensaje.includes("perfil") || mensaje.includes("completar") || mensaje.includes("estrellas")) {
        toast({
          title: "Perfil incompleto",
          description: `${mensaje}. Ve a tu perfil para completar los datos requeridos.`,
          variant: "destructive",
        });
      } else if (mensaje.includes("miembro") || mensaje.includes("grupo")) {
        toast({
          title: "Sin acceso al grupo",
          description: mensaje,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al enviar mensaje",
          description: mensaje,
          variant: "destructive",
        });
      }
    },
  });

  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const invitarContactoMutation = useMutation({
    mutationFn: async (datos: { email?: string; telefono?: string; metodo: 'email' | 'whatsapp' }) => {
      const response = await apiRequest("POST", "/api/invitaciones", datos);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
        toast({
          title: "Enlace de WhatsApp listo",
          description: `Número formateado: ${data.numeroFormateado || 'N/A'}. Haz clic en el botón verde para abrir WhatsApp.`,
        });
      } else {
        toast({
          title: "Invitación enviada",
          description: "Se ha enviado un correo con el enlace de registro",
        });
        setMostrarModalInvitar(false);
        setEmailInvitacion("");
        setTelefonoInvitacion("");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la invitación",
        variant: "destructive",
      });
    },
  });

  const crearConversacionPrivadaMutation = useMutation({
    mutationFn: async (contactoId: string) => {
      const response = await apiRequest("POST", "/api/chat/conversaciones-privadas", { contactoId });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      setGrupoSeleccionado(data.id);
      setMostrarPanelInfo(false);
      toast({
        title: "Conversación abierta",
        description: `Ahora puedes chatear con ${data.nombreMostrar || 'este contacto'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir la conversación",
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

  const contactosFiltrados = contactos.filter((contacto) =>
    contacto.nombre.toLowerCase().includes(busquedaContactos.toLowerCase()) ||
    contacto.email.toLowerCase().includes(busquedaContactos.toLowerCase())
  );

  const grupoActual = grupos.find((g) => g.id === grupoSeleccionado);

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeNuevo.trim() || !grupoSeleccionado) return;

    if (isConnected && grupoSeleccionado) {
      const success = sendWebSocketMessage(mensajeNuevo.trim());
      if (success) {
        setMensajeNuevo("");
        return;
      }
    }

    enviarMensajeMutation.mutate({
      grupoId: grupoSeleccionado,
      contenido: mensajeNuevo.trim(),
      tipo: "texto",
    });
  };

  const compartirUbicacion = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
      return;
    }

    setEnviandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (grupoSeleccionado) {
          enviarMensajeMutation.mutate({
            grupoId: grupoSeleccionado,
            contenido: "Ubicación compartida",
            tipo: "ubicacion",
            gpsLatitud: position.coords.latitude,
            gpsLongitud: position.coords.longitude,
          });
        }
        setEnviandoUbicacion(false);
        toast({
          title: "Ubicación compartida",
          description: "Tu ubicación ha sido enviada al grupo",
        });
      },
      (error) => {
        setEnviandoUbicacion(false);
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const manejarSeleccionArchivo = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'archivo' | 'imagen') => {
    const archivo = e.target.files?.[0];
    if (!archivo || !grupoSeleccionado) return;

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error al subir archivo');

      const { url } = await res.json();
      
      enviarMensajeMutation.mutate({
        grupoId: grupoSeleccionado,
        contenido: archivo.name,
        tipo: tipo === 'imagen' ? 'imagen' : 'archivo',
        archivoUrl: url,
      });

      toast({
        title: tipo === 'imagen' ? "Imagen enviada" : "Archivo enviado",
        description: `${archivo.name} ha sido enviado`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    }

    e.target.value = '';
  };

  const iniciarGrabacionAudio = () => {
    setGrabandoAudio(true);
    toast({
      title: "Grabando audio",
      description: "Mantén presionado para grabar...",
    });
  };

  const detenerGrabacionAudio = () => {
    setGrabandoAudio(false);
    toast({
      title: "Audio enviado",
      description: "Tu mensaje de voz ha sido enviado",
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-background" data-testid="page-chat">
      {/* Panel izquierdo - Lista de conversaciones y contactos */}
      <div className={`${grupoSeleccionado && !mostrarPanelInfo ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r bg-card h-full overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chats
            </h2>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={() => setMostrarModalInvitar(true)} data-testid="button-invite-contact">
                    <UserPlus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Invitar contacto</TooltipContent>
              </Tooltip>
              <Button size="icon" variant="ghost" data-testid="button-new-group">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
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

        {/* Tabs: Grupos, Contactos y Gmail */}
        <Tabs defaultValue="grupos" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="mx-4 mt-2 grid w-[calc(100%-2rem)] grid-cols-3 shrink-0">
            <TabsTrigger value="grupos" data-testid="tab-grupos">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Grupos</span>
            </TabsTrigger>
            <TabsTrigger value="contactos" data-testid="tab-contactos">
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Contactos</span>
            </TabsTrigger>
            <TabsTrigger value="gmail" data-testid="tab-gmail">
              <Globe className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Gmail</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grupos" className="flex-1 m-0 min-h-0 overflow-hidden">
            <ScrollArea className="h-full max-h-full">
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
                  <p className="text-sm mt-1">Únete a un grupo para comenzar</p>
                </div>
              ) : (
                <div className="p-2">
                  {gruposFiltrados.map((grupo) => (
                    <button
                      key={grupo.id}
                      onClick={() => {
                        setGrupoSeleccionado(grupo.id);
                        setMostrarPanelInfo(false);
                      }}
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
          </TabsContent>

          <TabsContent value="contactos" className="flex-1 m-0 min-h-0 overflow-hidden flex flex-col">
            <div className="p-4 pt-2 shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contactos registrados..."
                  value={busquedaContactos}
                  onChange={(e) => setBusquedaContactos(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-contacts"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              {contactosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay contactos registrados</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setMostrarModalInvitar(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invitar contacto
                  </Button>
                </div>
              ) : (
                <div className="px-2">
                  {contactosFiltrados.map((contacto) => (
                    <button
                      key={contacto.id}
                      onClick={() => {
                        if (contacto.registrado) {
                          crearConversacionPrivadaMutation.mutate(contacto.id);
                        }
                      }}
                      disabled={!contacto.registrado || crearConversacionPrivadaMutation.isPending}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        contacto.registrado 
                          ? 'hover-elevate active-elevate-2 cursor-pointer' 
                          : 'opacity-70 cursor-default'
                      }`}
                      data-testid={`contact-${contacto.id}`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={contacto.avatarUrl} alt={contacto.nombre} />
                        <AvatarFallback className="bg-muted">
                          {contacto.nombre.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">{contacto.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{contacto.email}</p>
                      </div>

                      {contacto.registrado ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            <Check className="h-3 w-3 mr-1" />
                            Registrado
                          </Badge>
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailInvitacion(contacto.email);
                            setMostrarModalInvitar(true);
                          }}
                          data-testid={`button-invite-${contacto.id}`}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Invitar
                        </Button>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Pestaña de Gmail/Google Contacts */}
          <TabsContent value="gmail" className="flex-1 m-0 min-h-0 overflow-hidden flex flex-col">
            <div className="p-4 pt-2 shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contactos de Gmail..."
                  className="pl-10"
                  data-testid="input-search-gmail"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-8 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-2">Conecta tu cuenta de Gmail</p>
                <p className="text-sm mb-4">Importa tus contactos de Google para invitarlos a APO-360</p>
                <Button 
                  variant="outline" 
                  className="mb-3"
                  onClick={() => {
                    toast({
                      title: "Próximamente",
                      description: "La integración con Google Contacts estará disponible pronto",
                    });
                  }}
                  data-testid="button-connect-gmail"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Conectar con Google
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Podrás seleccionar múltiples contactos e invitarlos por email o WhatsApp
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Panel central - Conversación */}
      {grupoSeleccionado && grupoActual ? (
        <div className={`flex flex-col flex-1 h-full min-h-0 overflow-hidden ${mostrarPanelInfo ? 'hidden lg:flex' : ''}`}>
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
            
            <button 
              className="flex items-center gap-3 flex-1"
              onClick={() => setMostrarPanelInfo(!mostrarPanelInfo)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={grupoActual.avatarUrl} alt={grupoActual.nombre} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                  {grupoActual.nombre.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-left">
                <p className="font-semibold" data-testid="text-chat-name">{grupoActual.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {miembrosGrupo.length} miembros
                  {isConnected ? (
                    <span className="text-green-600 dark:text-green-400 ml-2">En línea</span>
                  ) : (
                    <span className="text-muted-foreground ml-2">Desconectado</span>
                  )}
                </p>
              </div>
            </button>
            
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-call">
                    <Phone className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Llamar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-video-call">
                    <Video className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Videollamada</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-chat-options">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMostrarPanelInfo(true)}>
                    Ver información
                  </DropdownMenuItem>
                  <DropdownMenuItem>Silenciar notificaciones</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Salir del grupo</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mensajes */}
          <ScrollArea className="flex-1 min-h-0 bg-muted/30">
            <div className="p-4">
              {cargandoMensajes ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
                  </div>
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-50" />
                    <p>No hay mensajes aún</p>
                    <p className="text-sm mt-1">Sé el primero en enviar un mensaje</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {mensajes.filter(m => !m.eliminado).map((mensaje) => {
                    const esMio = mensaje.remitenteId === user.id;
                    const nombreRemitente = mensaje.metadataFoto?.nombreUsuario || 'Usuario';

                    return (
                      <div
                        key={mensaje.id}
                        className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${mensaje.id}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!esMio && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={mensaje.metadataFoto?.logoUrl} alt={nombreRemitente} />
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
                              {mensaje.tipo === 'imagen' && mensaje.archivoUrl ? (
                                <img 
                                  src={mensaje.archivoUrl} 
                                  alt="Imagen" 
                                  className="max-w-full rounded-lg max-h-64 object-cover"
                                />
                              ) : mensaje.tipo === 'ubicacion' && mensaje.gpsLatitud && mensaje.gpsLongitud ? (
                                <a 
                                  href={`https://www.google.com/maps?q=${mensaje.gpsLatitud},${mensaje.gpsLongitud}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 hover:underline"
                                >
                                  <MapPin className="h-5 w-5" />
                                  <span className="text-sm">Ver ubicación en mapa</span>
                                </a>
                              ) : mensaje.tipo === 'audio' && mensaje.archivoUrl ? (
                                <audio controls className="max-w-full">
                                  <source src={mensaje.archivoUrl} type="audio/mpeg" />
                                </audio>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                              )}
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
            </div>
          </ScrollArea>

          {/* Input de mensaje con botones de adjuntar - Fijo en la parte inferior */}
          <div className="p-4 border-t bg-card shrink-0">
            <div className="flex items-center gap-2">
              {/* Botones de adjuntar */}
              <div className="flex gap-1">
                <input
                  ref={inputArchivoRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => manejarSeleccionArchivo(e, 'archivo')}
                  data-testid="input-file-upload"
                />
                <input
                  ref={inputImagenRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => manejarSeleccionArchivo(e, 'imagen')}
                  data-testid="input-image-upload"
                />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => inputArchivoRef.current?.click()}
                      data-testid="button-attach-file"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Adjuntar archivo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => inputImagenRef.current?.click()}
                      data-testid="button-attach-image"
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar imagen</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onMouseDown={iniciarGrabacionAudio}
                      onMouseUp={detenerGrabacionAudio}
                      onMouseLeave={grabandoAudio ? detenerGrabacionAudio : undefined}
                      className={grabandoAudio ? 'bg-red-500 text-white' : ''}
                      data-testid="button-record-audio"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grabar audio</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={compartirUbicacion}
                      disabled={enviandoUbicacion}
                      data-testid="button-share-location"
                    >
                      <MapPin className={`h-5 w-5 ${enviandoUbicacion ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartir ubicación</TooltipContent>
                </Tooltip>
              </div>

              <form onSubmit={enviarMensaje} className="flex-1 flex gap-2">
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
              </form>
            </div>
          </div>
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

      {/* Panel derecho - Información del grupo */}
      {mostrarPanelInfo && grupoActual && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Información del grupo</h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMostrarPanelInfo(false)}
              data-testid="button-close-info"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Avatar y nombre */}
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-3">
                  <AvatarImage src={grupoActual.avatarUrl} alt={grupoActual.nombre} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                    {grupoActual.nombre.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-bold text-lg">{grupoActual.nombre}</h4>
                <p className="text-sm text-muted-foreground capitalize">Grupo {grupoActual.tipo}</p>
              </div>

              {grupoActual.descripcion && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Descripción</h5>
                  <p className="text-sm">{grupoActual.descripcion}</p>
                </div>
              )}

              {/* Miembros */}
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                  {miembrosGrupo.length} miembros
                </h5>
                <div className="space-y-2">
                  {miembrosGrupo.map((miembro) => (
                    <div 
                      key={miembro.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                      data-testid={`member-${miembro.id}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={miembro.usuario?.profileImageUrl} />
                        <AvatarFallback className="bg-muted">
                          {(miembro.usuario?.firstName || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {miembro.usuario?.firstName} {miembro.usuario?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {miembro.usuario?.email}
                        </p>
                      </div>
                      {miembro.rol === 'admin' && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Modal de invitación con Email o WhatsApp */}
      <Dialog open={mostrarModalInvitar} onOpenChange={setMostrarModalInvitar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invitar contacto
            </DialogTitle>
            <DialogDescription>
              Envía una invitación por correo electrónico o WhatsApp para que tu contacto se una a APO-360
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selector de método */}
            <div className="flex rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setMetodoInvitacion('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  metodoInvitacion === 'email'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover-elevate'
                }`}
                data-testid="button-method-email"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setMetodoInvitacion('whatsapp')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  metodoInvitacion === 'whatsapp'
                    ? 'bg-green-600 text-white'
                    : 'hover-elevate'
                }`}
                data-testid="button-method-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4" />
                WhatsApp
              </button>
            </div>

            {metodoInvitacion === 'email' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Correo electrónico</label>
                <Input
                  type="email"
                  placeholder="contacto@gmail.com"
                  value={emailInvitacion}
                  onChange={(e) => setEmailInvitacion(e.target.value)}
                  data-testid="input-invitation-email"
                />
                <p className="text-xs text-muted-foreground">
                  Se enviará un correo con el enlace de registro
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de WhatsApp</label>
                <Input
                  type="tel"
                  placeholder="999 888 777"
                  value={telefonoInvitacion}
                  onChange={(e) => setTelefonoInvitacion(e.target.value)}
                  data-testid="input-invitation-phone"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el número sin prefijo (se agregará +51 automáticamente para Perú)
                </p>
                
                {whatsappUrl && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Enlace listo. Haz clic para abrir WhatsApp:
                    </p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                      onClick={() => {
                        setMostrarModalInvitar(false);
                        setTelefonoInvitacion("");
                        setWhatsappUrl(null);
                      }}
                      data-testid="link-open-whatsapp"
                    >
                      <SiWhatsapp className="h-5 w-5" />
                      Abrir WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setMostrarModalInvitar(false);
              setEmailInvitacion("");
              setTelefonoInvitacion("");
              setWhatsappUrl(null);
            }}>
              Cancelar
            </Button>
            {metodoInvitacion === 'email' ? (
              <Button 
                onClick={() => invitarContactoMutation.mutate({ email: emailInvitacion, metodo: 'email' })}
                disabled={!emailInvitacion.includes('@') || invitarContactoMutation.isPending}
                data-testid="button-send-email-invitation"
              >
                <Mail className="h-4 w-4 mr-2" />
                {invitarContactoMutation.isPending ? 'Enviando...' : 'Enviar por Email'}
              </Button>
            ) : (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => invitarContactoMutation.mutate({ telefono: telefonoInvitacion, metodo: 'whatsapp' })}
                disabled={!telefonoInvitacion || telefonoInvitacion.length < 8 || invitarContactoMutation.isPending}
                data-testid="button-send-whatsapp-invitation"
              >
                <SiWhatsapp className="h-4 w-4 mr-2" />
                {invitarContactoMutation.isPending ? 'Abriendo...' : 'Abrir WhatsApp'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
