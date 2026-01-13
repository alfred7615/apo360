import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, Search, MoreVertical, Users, MessageCircle, Plus, ArrowLeft, WifiOff,
  Paperclip, Image, Mic, MapPin, Phone, Video, UserPlus, Mail, X, Check, 
  MessageSquare, Globe, ExternalLink, CheckCheck, Edit, Share2, Trash2, LogOut
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
  esPrioridad?: boolean;
  creadoPorRolChat?: boolean;
  creadorId?: string;
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
  estadoMensaje?: 'enviado' | 'entregado' | 'leido';
  entregadoEn?: string;
  leidoEn?: string;
  nombreRemitente?: string;
  fotoRemitente?: string;
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
  email?: string;
  telefono?: string;
  avatarUrl?: string;
  registradoEnApp?: boolean;
  contactoId?: string;
  fuente?: 'manual' | 'gmail';
  favorito?: boolean;
  bloqueado?: boolean;
}

interface ContactoGmail {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  avatarUrl?: string;
  registradoEnApp: boolean;
  contactoId?: string;
  googleContactId?: string;
}

interface GmailEstado {
  conectado: boolean;
  emailSincronizado?: string;
  ultimaSincronizacion?: string;
  totalContactos?: number;
}

interface GrupoSeleccionadoInfo {
  id: string;
  nombre: string;
  avatarUrl?: string;
  tipo: string;
  descripcion?: string;
}

export default function Chat() {
  const { user, isLoading: cargandoAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
  const [grupoInfo, setGrupoInfo] = useState<GrupoSeleccionadoInfo | null>(null);
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
  const [busquedaGmail, setBusquedaGmail] = useState("");
  const [busquedaAgregarContacto, setBusquedaAgregarContacto] = useState("");
  const [mostrarModalAgregarContacto, setMostrarModalAgregarContacto] = useState(false);
  const [mostrarModalEditarContacto, setMostrarModalEditarContacto] = useState(false);
  const [contactoEditar, setContactoEditar] = useState<Contacto | null>(null);
  const [mostrarEstadoMensaje, setMostrarEstadoMensaje] = useState<string | null>(null);
  const [sincronizandoGmail, setSincronizandoGmail] = useState(false);
  const [mostrarModalAgregarAGrupo, setMostrarModalAgregarAGrupo] = useState(false);
  const [contactoParaAgregarAGrupo, setContactoParaAgregarAGrupo] = useState<Contacto | ContactoGmail | null>(null);
  const [mostrarModalCrearGrupo, setMostrarModalCrearGrupo] = useState(false);
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState("");
  const [descripcionNuevoGrupo, setDescripcionNuevoGrupo] = useState("");
  const [grupoParaAccion, setGrupoParaAccion] = useState<string | null>(null);
  const [mostrarConfirmarSalir, setMostrarConfirmarSalir] = useState(false);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState(false);
  const [mostrarModalModificarGrupo, setMostrarModalModificarGrupo] = useState(false);
  const [nuevoTituloGrupo, setNuevoTituloGrupo] = useState("");
  const [nuevaDescripcionGrupo, setNuevaDescripcionGrupo] = useState("");
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (grupoSeleccionado && user) {
      fetch(`/api/chat/grupos/${grupoSeleccionado}/marcar-leidos`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.mensajesActualizados > 0) {
            queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos", grupoSeleccionado, "mensajes"] });
          }
          queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
        }
      }).catch(console.error);
    }
  }, [grupoSeleccionado, user]);

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

  // Contactos de chat del usuario
  const { data: contactosChat = [] } = useQuery<Contacto[]>({
    queryKey: ["/api/chat/contactos"],
    queryFn: async () => {
      const res = await fetch("/api/chat/contactos");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Estado de Gmail
  const { data: gmailEstado } = useQuery<GmailEstado>({
    queryKey: ["/api/chat/gmail/estado"],
    queryFn: async () => {
      const res = await fetch("/api/chat/gmail/estado");
      if (!res.ok) return { conectado: false };
      return res.json();
    },
    enabled: !!user,
  });

  // Contactos de Gmail sincronizados
  const { data: contactosGmail = [] } = useQuery<ContactoGmail[]>({
    queryKey: ["/api/chat/gmail/contactos"],
    queryFn: async () => {
      const res = await fetch("/api/chat/gmail/contactos");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && !!gmailEstado?.conectado,
  });

  // Buscar usuarios para agregar
  const { data: usuariosBusqueda = [] } = useQuery<any[]>({
    queryKey: ["/api/chat/buscar-usuarios", busquedaAgregarContacto],
    queryFn: async () => {
      if (busquedaAgregarContacto.length < 2) return [];
      const res = await fetch(`/api/chat/buscar-usuarios?q=${encodeURIComponent(busquedaAgregarContacto)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && busquedaAgregarContacto.length >= 2,
  });

  // Grupos donde el usuario es admin (para agregar contactos a grupos)
  const { data: gruposAdministrados = [] } = useQuery<GrupoChat[]>({
    queryKey: ["/api/chat/mis-grupos-admin"],
    queryFn: async () => {
      const res = await fetch("/api/chat/mis-grupos-admin");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && mostrarModalAgregarAGrupo,
  });

  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocket({
    grupoId: grupoSeleccionado || "",
    onMessage: (nuevoMensaje: any) => {
      console.log('Nuevo mensaje recibido por WebSocket:', nuevoMensaje);
      if (nuevoMensaje.type === 'new_message' && nuevoMensaje.mensaje) {
        const msg = nuevoMensaje.mensaje;
        queryClient.setQueryData(
          ["/api/chat/grupos", msg.grupoId, "mensajes"],
          (oldData: Mensaje[] | undefined) => {
            if (!oldData) return [msg];
            
            // Verificar si ya existe el mensaje real o temporal
            const existeReal = oldData.some((m) => m.id === msg.id);
            if (existeReal) return oldData;
            
            // Buscar y reemplazar mensaje temporal con el mismo contenido del mismo remitente
            const indiceTemp = oldData.findIndex((m) => 
              m.id.startsWith('temp-') && 
              m.contenido === msg.contenido && 
              m.remitenteId === msg.remitenteId
            );
            
            if (indiceTemp !== -1) {
              // Reemplazar mensaje temporal con el real
              const nuevoArray = [...oldData];
              nuevoArray[indiceTemp] = msg;
              return nuevoArray;
            }
            
            return [...oldData, msg];
          }
        );
        queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      } else if (nuevoMensaje.type === 'mensaje_estado') {
        const { mensajeId, estado, timestamp } = nuevoMensaje;
        queryClient.setQueryData(
          ["/api/chat/grupos", grupoSeleccionado, "mensajes"],
          (oldData: Mensaje[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((m) => {
              if (m.id === mensajeId) {
                return {
                  ...m,
                  estadoMensaje: estado,
                  ...(estado === 'entregado' && { entregadoEn: timestamp }),
                  ...(estado === 'leido' && { leidoEn: timestamp }),
                };
              }
              return m;
            });
          }
        );
      }
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
      return response.json();
    },
    onMutate: async (datos) => {
      await queryClient.cancelQueries({ queryKey: ["/api/chat/grupos", datos.grupoId, "mensajes"] });
      
      const previousMensajes = queryClient.getQueryData<Mensaje[]>(["/api/chat/grupos", datos.grupoId, "mensajes"]);
      
      const mensajeOptimista: Mensaje = {
        id: `temp-${Date.now()}`,
        grupoId: datos.grupoId,
        remitenteId: user?.id || '',
        contenido: datos.contenido,
        tipo: datos.tipo,
        archivoUrl: datos.archivoUrl,
        gpsLatitud: datos.gpsLatitud,
        gpsLongitud: datos.gpsLongitud,
        createdAt: new Date().toISOString(),
        estadoMensaje: 'enviado',
        nombreRemitente: user?.nombre || user?.alias || 'Yo',
      };
      
      queryClient.setQueryData<Mensaje[]>(
        ["/api/chat/grupos", datos.grupoId, "mensajes"],
        (old) => old ? [...old, mensajeOptimista] : [mensajeOptimista]
      );
      
      return { previousMensajes, grupoId: datos.grupoId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos", variables.grupoId, "mensajes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      setMensajeNuevo("");
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousMensajes) {
        queryClient.setQueryData(
          ["/api/chat/grupos", context.grupoId, "mensajes"],
          context.previousMensajes
        );
      }
      
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
      const nuevoGrupo: GrupoChat = {
        id: data.id,
        nombre: data.nombreMostrar || grupoInfo?.nombre || 'Conversación',
        tipo: 'privado',
        avatarUrl: data.avatarUrl || grupoInfo?.avatarUrl,
      };
      queryClient.setQueryData<GrupoChat[]>(["/api/chat/mis-grupos"], (old) => {
        if (!old) return [nuevoGrupo];
        const existe = old.some(g => g.id === data.id);
        if (existe) return old;
        return [nuevoGrupo, ...old];
      });
      
      // Invalidar cache de mensajes del grupo anterior si existe
      if (grupoSeleccionado && grupoSeleccionado !== data.id) {
        queryClient.removeQueries({ queryKey: ["/api/chat/grupos", grupoSeleccionado, "mensajes"] });
      }
      
      // Invalidar y forzar recarga de mensajes del nuevo grupo
      queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos", data.id, "mensajes"] });
      
      setGrupoSeleccionado(data.id);
      setGrupoInfo({
        id: data.id,
        nombre: data.nombreMostrar || grupoInfo?.nombre || 'Conversación',
        avatarUrl: data.avatarUrl || grupoInfo?.avatarUrl,
        tipo: 'privado',
      });
      setMostrarPanelInfo(false);
      toast({
        title: "Conversación abierta",
        description: `Ahora puedes chatear con ${data.nombreMostrar || 'este contacto'}`,
      });
    },
    onError: (error: Error) => {
      setGrupoInfo(null);
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir la conversación",
        variant: "destructive",
      });
    },
  });

  // Mutación para agregar contacto de chat
  const agregarContactoMutation = useMutation({
    mutationFn: async (datos: { contactoId?: string; nombre: string; email?: string; telefono?: string; avatarUrl?: string }) => {
      const response = await apiRequest("POST", "/api/chat/contactos", datos);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/contactos"] });
      setMostrarModalAgregarContacto(false);
      setBusquedaAgregarContacto("");
      toast({
        title: "Contacto agregado",
        description: "El contacto se agregó a tu lista correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el contacto",
        variant: "destructive",
      });
    },
  });

  // Mutación para editar contacto
  const editarContactoMutation = useMutation({
    mutationFn: async (datos: { id: string; nombre?: string; email?: string; telefono?: string; notas?: string; favorito?: boolean }) => {
      const { id, ...rest } = datos;
      const response = await apiRequest("PATCH", `/api/chat/contactos/${id}`, rest);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/contactos"] });
      setMostrarModalEditarContacto(false);
      setContactoEditar(null);
      toast({
        title: "Contacto actualizado",
        description: "Los datos del contacto se actualizaron correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el contacto",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar contacto
  const eliminarContactoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/chat/contactos/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/contactos"] });
      toast({
        title: "Contacto eliminado",
        description: "El contacto se eliminó de tu lista",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contacto",
        variant: "destructive",
      });
    },
  });

  // Mutación para agregar usuario a grupo
  const agregarUsuarioAGrupoMutation = useMutation({
    mutationFn: async (datos: { grupoId: string; usuarioId: string }) => {
      const response = await apiRequest("POST", `/api/chat/grupos/${datos.grupoId}/miembros`, { usuarioId: datos.usuarioId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      setMostrarModalAgregarAGrupo(false);
      setContactoParaAgregarAGrupo(null);
      toast({
        title: "Usuario agregado",
        description: "El usuario fue agregado al grupo correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el usuario al grupo",
        variant: "destructive",
      });
    },
  });

  // Mutación para crear grupo
  const crearGrupoMutation = useMutation({
    mutationFn: async (datos: { nombre: string; descripcion?: string; tipo?: string }) => {
      const response = await apiRequest("POST", "/api/chat/grupos", datos);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      setMostrarModalCrearGrupo(false);
      setNombreNuevoGrupo("");
      setDescripcionNuevoGrupo("");
      setGrupoSeleccionado(data.id);
      setGrupoInfo({
        id: data.id,
        nombre: data.nombre,
        tipo: data.tipo || 'grupo',
        descripcion: data.descripcion,
      });
      toast({
        title: "Grupo creado",
        description: "El grupo se creó correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el grupo",
        variant: "destructive",
      });
    },
  });

  // Mutación para salir del grupo
  const salirDelGrupoMutation = useMutation({
    mutationFn: async (grupoId: string) => {
      const response = await apiRequest("DELETE", `/api/chat/grupos/${grupoId}/miembros/${user?.id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos-admin"] });
      if (grupoSeleccionado === grupoParaAccion) {
        setGrupoSeleccionado(null);
        setGrupoInfo(null);
      }
      setGrupoParaAccion(null);
      setMostrarConfirmarSalir(false);
      toast({
        title: "Has salido del grupo",
        description: "Ya no recibirás mensajes de este grupo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo salir del grupo",
        variant: "destructive",
      });
    },
  });

  // Mutación para modificar título del grupo
  const modificarTituloGrupoMutation = useMutation({
    mutationFn: async (datos: { grupoId: string; nombre: string; descripcion?: string }) => {
      const response = await apiRequest("PATCH", `/api/chat/grupos/${datos.grupoId}`, { 
        nombre: datos.nombre,
        descripcion: datos.descripcion 
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      if (grupoInfo && grupoInfo.id === data.id) {
        setGrupoInfo({
          ...grupoInfo,
          nombre: data.nombre,
          descripcion: data.descripcion,
        });
      }
      setMostrarModalModificarGrupo(false);
      setNuevoTituloGrupo("");
      setNuevaDescripcionGrupo("");
      toast({
        title: "Grupo actualizado",
        description: "El nombre del grupo fue actualizado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo modificar el grupo",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar grupo
  const eliminarGrupoMutation = useMutation({
    mutationFn: async (grupoId: string) => {
      const response = await apiRequest("DELETE", `/api/chat/grupos/${grupoId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/mis-grupos-admin"] });
      if (grupoSeleccionado === grupoParaAccion) {
        setGrupoSeleccionado(null);
        setGrupoInfo(null);
      }
      setGrupoParaAccion(null);
      setMostrarConfirmarEliminar(false);
      toast({
        title: "Grupo eliminado",
        description: "El grupo fue eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el grupo",
        variant: "destructive",
      });
    },
  });

  // Mutación para sincronizar Gmail
  const sincronizarGmailMutation = useMutation({
    mutationFn: async () => {
      setSincronizandoGmail(true);
      const response = await apiRequest("POST", "/api/chat/gmail/sincronizar");
      return await response.json();
    },
    onSuccess: (data: any) => {
      setSincronizandoGmail(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/gmail/estado"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/gmail/contactos"] });
      toast({
        title: "Gmail sincronizado",
        description: `Se importaron ${data.totalImportados} contactos (${data.registradosEnApp} registrados en APO-360)`,
      });
    },
    onError: (error: Error) => {
      setSincronizandoGmail(false);
      toast({
        title: "Error",
        description: error.message || "No se pudo sincronizar Gmail",
        variant: "destructive",
      });
    },
  });

  // Mutación para desconectar Gmail
  const desconectarGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/chat/gmail/desconectar");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/gmail/estado"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/gmail/contactos"] });
      toast({
        title: "Gmail desconectado",
        description: "Se eliminaron los contactos importados de Gmail",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo desconectar Gmail",
        variant: "destructive",
      });
    },
  });

  // Función para conectar Gmail
  const conectarGmail = async () => {
    try {
      const res = await fetch('/api/chat/gmail/auth-url');
      if (!res.ok) throw new Error("Error al obtener URL de autorización");
      const data = await res.json();
      window.location.href = data.authUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la conexión con Gmail",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  const gruposFiltrados = grupos.filter((grupo) =>
    grupo.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const contactosChatFiltrados = contactosChat.filter((contacto) =>
    contacto.nombre.toLowerCase().includes(busquedaContactos.toLowerCase()) ||
    contacto.email?.toLowerCase().includes(busquedaContactos.toLowerCase()) ||
    contacto.telefono?.includes(busquedaContactos)
  );

  const contactosGmailFiltrados = contactosGmail.filter((contacto) =>
    contacto.nombre.toLowerCase().includes(busquedaGmail.toLowerCase()) ||
    contacto.email?.toLowerCase().includes(busquedaGmail.toLowerCase()) ||
    contacto.telefono?.includes(busquedaGmail)
  );

  const grupoFromList = grupos.find((g) => g.id === grupoSeleccionado);
  const grupoActual = grupoFromList || grupoInfo;

  const seleccionarGrupo = (grupo: GrupoChat) => {
    // Invalidar cache de mensajes del grupo anterior si es diferente
    if (grupoSeleccionado && grupoSeleccionado !== grupo.id) {
      queryClient.removeQueries({ queryKey: ["/api/chat/grupos", grupoSeleccionado, "mensajes"] });
    }
    
    // Forzar recarga de mensajes del nuevo grupo
    queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos", grupo.id, "mensajes"] });
    
    setGrupoSeleccionado(grupo.id);
    setGrupoInfo({
      id: grupo.id,
      nombre: grupo.nombre,
      avatarUrl: grupo.avatarUrl,
      tipo: grupo.tipo,
      descripcion: grupo.descripcion,
    });
    setMostrarPanelInfo(false);
  };

  const seleccionarContacto = (contacto: Contacto | ContactoGmail) => {
    // contactoId es el ID del usuario de APO-360 si está registrado
    const usuarioId = contacto.contactoId;
    if (!contacto.registradoEnApp || !usuarioId) return;
    
    setGrupoInfo({
      id: '',
      nombre: contacto.nombre,
      avatarUrl: contacto.avatarUrl,
      tipo: 'privado',
    });
    crearConversacionPrivadaMutation.mutate(usuarioId);
  };

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeNuevo.trim() || !grupoSeleccionado) return;

    const contenidoMensaje = mensajeNuevo.trim();
    
    if (isConnected && grupoSeleccionado) {
      // Crear mensaje optimista antes de enviar
      const mensajeOptimista: Mensaje = {
        id: `temp-ws-${Date.now()}`,
        grupoId: grupoSeleccionado,
        remitenteId: user?.id || '',
        contenido: contenidoMensaje,
        tipo: 'texto',
        createdAt: new Date().toISOString(),
        estadoMensaje: 'enviado',
        nombreRemitente: user?.nombre || user?.alias || 'Yo',
      };
      
      // Agregar mensaje optimista al cache
      queryClient.setQueryData<Mensaje[]>(
        ["/api/chat/grupos", grupoSeleccionado, "mensajes"],
        (old) => old ? [...old, mensajeOptimista] : [mensajeOptimista]
      );
      
      const success = sendWebSocketMessage(contenidoMensaje);
      if (success) {
        setMensajeNuevo("");
        return;
      }
    }

    enviarMensajeMutation.mutate({
      grupoId: grupoSeleccionado,
      contenido: contenidoMensaje,
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
        <Tabs defaultValue="grupos" className="flex-1 flex flex-col min-h-0">
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

          <TabsContent value="grupos" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-hidden">
            {/* Header con botón crear grupo */}
            <div className="px-4 pb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conversaciones</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-groups-menu">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMostrarModalCrearGrupo(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear grupo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ScrollArea className="flex-1 h-0">
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
                  <p className="text-sm mt-1">Crea un grupo para comenzar</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setMostrarModalCrearGrupo(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear grupo
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  {gruposFiltrados.map((grupo) => (
                    <div
                      key={grupo.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover-elevate ${
                        grupoSeleccionado === grupo.id ? 'bg-accent' : ''
                      }`}
                      data-testid={`conversation-${grupo.id}`}
                    >
                      <button
                        onClick={() => seleccionarGrupo(grupo)}
                        className="flex items-start gap-3 flex-1 min-w-0 text-left"
                        data-testid={`button-conversation-${grupo.id}`}
                      >
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={grupo.avatarUrl} alt={grupo.nombre} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                            {grupo.nombre.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {grupo.esPrioridad && (
                              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30 px-1">
                                ORG
                              </Badge>
                            )}
                            <p className="font-semibold text-sm truncate">{grupo.nombre}</p>
                            {grupo.ultimoMensaje && (
                              <span className="text-xs text-muted-foreground shrink-0 ml-auto">
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
                      
                      {/* Menú de 3 puntos del grupo */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" data-testid={`button-menu-group-${grupo.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => seleccionarGrupo(grupo)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Abrir chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setGrupoSeleccionado(grupo.id);
                            setGrupoInfo({
                              id: grupo.id,
                              nombre: grupo.nombre,
                              avatarUrl: grupo.avatarUrl,
                              tipo: grupo.tipo,
                              descripcion: grupo.descripcion,
                            });
                            setMostrarPanelInfo(true);
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            Ver miembros
                          </DropdownMenuItem>
                          {/* Solo mostrar opciones de admin si el usuario es creador/admin */}
                          {gruposAdministrados?.some((g: any) => g.id === grupo.id) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setGrupoParaAccion(grupo.id);
                                setNuevoTituloGrupo(grupo.nombre);
                                setNuevaDescripcionGrupo(grupo.descripcion || "");
                                setMostrarModalModificarGrupo(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modificar título
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const enlace = `${window.location.origin}/chat/grupo/${grupo.id}`;
                                navigator.clipboard.writeText(enlace);
                                toast({
                                  title: "Enlace copiado",
                                  description: "El enlace del grupo fue copiado al portapapeles",
                                });
                              }}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setGrupoParaAccion(grupo.id);
                                  setMostrarConfirmarEliminar(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar grupo
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setGrupoParaAccion(grupo.id);
                              setMostrarConfirmarSalir(true);
                            }}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Salir del grupo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Viñeta de Contactos - Lista de contactos agregados manualmente */}
          <TabsContent value="contactos" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-hidden">
            <div className="px-4 pb-2 shrink-0 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, celular o email..."
                  value={busquedaContactos}
                  onChange={(e) => setBusquedaContactos(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-contacts"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setMostrarModalAgregarContacto(true)}
                data-testid="button-add-contact"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </div>
            <ScrollArea className="flex-1 h-0">
              {contactosChatFiltrados.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay contactos agregados</p>
                  <p className="text-sm mt-1">Busca usuarios por nombre, celular o email</p>
                </div>
              ) : (
                <div className="px-2">
                  {contactosChatFiltrados.map((contacto) => (
                    <div
                      key={contacto.id}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all hover-elevate"
                      data-testid={`contact-${contacto.id}`}
                    >
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0"
                        onClick={() => {
                          if (contacto.contactoId && contacto.registradoEnApp) {
                            seleccionarContacto(contacto);
                          }
                        }}
                        disabled={!contacto.registradoEnApp}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={contacto.avatarUrl} alt={contacto.nombre} />
                          <AvatarFallback className="bg-muted">
                            {contacto.nombre.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{contacto.nombre}</p>
                            {contacto.favorito && (
                              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30 px-1">
                                ★
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {contacto.email || contacto.telefono || 'Sin datos'}
                          </p>
                        </div>

                        {contacto.registradoEnApp ? (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30 shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            En APO-360
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs shrink-0">
                            No registrado
                          </Badge>
                        )}
                      </button>

                      {/* Menú de 3 puntos */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-menu-contact-${contacto.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {contacto.registradoEnApp && contacto.contactoId && (
                            <DropdownMenuItem onClick={() => seleccionarContacto(contacto)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Iniciar chat
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setContactoEditar(contacto);
                            setMostrarModalEditarContacto(true);
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            Editar contacto
                          </DropdownMenuItem>
                          {contacto.registradoEnApp && contacto.contactoId && (
                            <DropdownMenuItem onClick={() => {
                              setContactoParaAgregarAGrupo(contacto);
                              setMostrarModalAgregarAGrupo(true);
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar a grupo
                            </DropdownMenuItem>
                          )}
                          {!contacto.registradoEnApp && (
                            <DropdownMenuItem onClick={() => {
                              setEmailInvitacion(contacto.email || '');
                              setTelefonoInvitacion(contacto.telefono || '');
                              setMostrarModalInvitar(true);
                            }}>
                              <Mail className="h-4 w-4 mr-2" />
                              Invitar a registrarse
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => eliminarContactoMutation.mutate(contacto.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Eliminar contacto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Viñeta de Gmail - Contactos sincronizados de Google */}
          <TabsContent value="gmail" className="flex-1 m-0 mt-2 data-[state=active]:flex data-[state=active]:flex-col min-h-0 overflow-hidden">
            {gmailEstado?.conectado ? (
              <>
                <div className="px-4 pb-2 shrink-0 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar contactos de Gmail..."
                      value={busquedaGmail}
                      onChange={(e) => setBusquedaGmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-gmail"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Conectado: {gmailEstado.emailSincronizado}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => sincronizarGmailMutation.mutate()}
                        disabled={sincronizandoGmail}
                        data-testid="button-sync-gmail"
                      >
                        {sincronizandoGmail ? 'Sincronizando...' : 'Sincronizar'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive"
                        onClick={() => desconectarGmailMutation.mutate()}
                        data-testid="button-disconnect-gmail"
                      >
                        Desconectar
                      </Button>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 h-0">
                  {contactosGmailFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay contactos de Gmail</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => sincronizarGmailMutation.mutate()}
                        disabled={sincronizandoGmail}
                      >
                        Sincronizar contactos
                      </Button>
                    </div>
                  ) : (
                    <div className="px-2">
                      {contactosGmailFiltrados.map((contacto) => (
                        <div
                          key={contacto.id}
                          className="flex items-center gap-3 p-3 rounded-lg transition-all hover-elevate"
                          data-testid={`gmail-contact-${contacto.id}`}
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={contacto.avatarUrl} alt={contacto.nombre} />
                            <AvatarFallback className="bg-muted">
                              {contacto.nombre.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium text-sm truncate">{contacto.nombre}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contacto.email || contacto.telefono || 'Sin datos'}
                            </p>
                          </div>

                          {contacto.registradoEnApp ? (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30 shrink-0">
                              <Check className="h-3 w-3 mr-1" />
                              En APO-360
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs shrink-0">
                              No registrado
                            </Badge>
                          )}

                          {/* Menú de 3 puntos para Gmail */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-menu-gmail-${contacto.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {contacto.registradoEnApp && contacto.contactoId && (
                                <DropdownMenuItem onClick={() => seleccionarContacto(contacto)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Iniciar chat
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                agregarContactoMutation.mutate({
                                  contactoId: contacto.contactoId,
                                  nombre: contacto.nombre,
                                  email: contacto.email,
                                  telefono: contacto.telefono,
                                  avatarUrl: contacto.avatarUrl,
                                });
                              }}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Agregar a Contactos
                              </DropdownMenuItem>
                              {contacto.registradoEnApp && contacto.contactoId && (
                                <DropdownMenuItem onClick={() => {
                                  setContactoParaAgregarAGrupo(contacto);
                                  setMostrarModalAgregarAGrupo(true);
                                }}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar a grupo
                                </DropdownMenuItem>
                              )}
                              {!contacto.registradoEnApp && (
                                <DropdownMenuItem onClick={() => {
                                  setEmailInvitacion(contacto.email || '');
                                  setTelefonoInvitacion(contacto.telefono || '');
                                  setMostrarModalInvitar(true);
                                }}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Invitar a registrarse
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <ScrollArea className="flex-1 h-0">
                <div className="p-8 text-center text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-2">Conecta tu cuenta de Gmail</p>
                  <p className="text-sm mb-4">
                    Importa tus contactos de Google. Los contactos registrados en APO-360 aparecerán primero.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mb-3"
                    onClick={conectarGmail}
                    data-testid="button-connect-gmail"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Conectar con Google
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Podrás invitar contactos por email o WhatsApp y agregarlos a tu lista
                  </p>
                </div>
              </ScrollArea>
            )}</TabsContent>
        </Tabs>
      </div>

      {/* Panel central - Conversación */}
      {(grupoSeleccionado || grupoInfo) && grupoActual ? (
        <div className={`flex flex-col flex-1 h-full min-h-0 overflow-hidden ${mostrarPanelInfo ? 'hidden lg:flex' : ''}`}>
          {/* Header del chat */}
          <div className="flex items-center gap-3 p-4 border-b bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                setGrupoSeleccionado(null);
                setGrupoInfo(null);
              }}
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
                  {grupoActual.tipo === 'privado' ? (
                    <>
                      Chat privado
                      {isConnected ? (
                        <span className="text-green-600 dark:text-green-400 ml-2">En línea</span>
                      ) : (
                        <span className="text-muted-foreground ml-2">Desconectado</span>
                      )}
                    </>
                  ) : (
                    <>
                      {miembrosGrupo.length} miembros
                      {isConnected ? (
                        <span className="text-green-600 dark:text-green-400 ml-2">En línea</span>
                      ) : (
                        <span className="text-muted-foreground ml-2">Desconectado</span>
                      )}
                    </>
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
          <div 
            ref={scrollContainerRef}
            className="flex-1 min-h-0 bg-muted/30 overflow-y-auto"
          >
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
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <span className="text-xs text-muted-foreground">
                                {new Date(mensaje.createdAt).toLocaleTimeString('es-PE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {esMio && (
                                <span className="flex items-center" data-testid={`message-status-${mensaje.id}`}>
                                  {mensaje.estadoMensaje === 'leido' || mensaje.leidoEn ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                                  ) : mensaje.estadoMensaje === 'entregado' || mensaje.entregadoEn ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={mensajesEndRef} />
                </div>
              )}
            </div>
          </div>

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

      {/* Modal para agregar contacto */}
      <Dialog open={mostrarModalAgregarContacto} onOpenChange={setMostrarModalAgregarContacto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Agregar Contacto
            </DialogTitle>
            <DialogDescription>
              Busca un usuario por nombre, celular o email para agregarlo a tus contactos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, celular o email..."
                value={busquedaAgregarContacto}
                onChange={(e) => setBusquedaAgregarContacto(e.target.value)}
                className="pl-10"
                data-testid="input-search-add-contact"
              />
            </div>

            <ScrollArea className="h-64">
              {usuariosBusqueda.length === 0 && busquedaAgregarContacto.length >= 2 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se encontraron usuarios</p>
                </div>
              ) : busquedaAgregarContacto.length < 2 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usuariosBusqueda.map((usuario: any) => (
                    <div
                      key={usuario.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover-elevate"
                      data-testid={`search-user-${usuario.id}`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={usuario.profileImageUrl} alt={`${usuario.firstName} ${usuario.lastName}`} />
                        <AvatarFallback className="bg-muted">
                          {(usuario.firstName || 'U').substring(0, 1)}
                          {(usuario.lastName || 'S').substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {usuario.firstName} {usuario.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {usuario.email || usuario.phone || 'Sin datos'}
                        </p>
                      </div>

                      <Button 
                        size="sm"
                        onClick={() => agregarContactoMutation.mutate({
                          contactoId: usuario.id,
                          nombre: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim(),
                          email: usuario.email,
                          telefono: usuario.phone,
                          avatarUrl: usuario.profileImageUrl,
                        })}
                        disabled={agregarContactoMutation.isPending}
                        data-testid={`button-add-user-${usuario.id}`}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMostrarModalAgregarContacto(false);
              setBusquedaAgregarContacto("");
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar contacto */}
      <Dialog open={mostrarModalEditarContacto} onOpenChange={setMostrarModalEditarContacto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Editar Contacto
            </DialogTitle>
            <DialogDescription>
              Actualiza la información del contacto
            </DialogDescription>
          </DialogHeader>

          {contactoEditar && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contactoEditar.avatarUrl} alt={contactoEditar.nombre} />
                  <AvatarFallback className="bg-muted">
                    {contactoEditar.nombre.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{contactoEditar.nombre}</p>
                  {contactoEditar.registradoEnApp && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      <Check className="h-3 w-3 mr-1" />
                      En APO-360
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={contactoEditar.nombre}
                  onChange={(e) => setContactoEditar({ ...contactoEditar, nombre: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={contactoEditar.email || ''}
                  onChange={(e) => setContactoEditar({ ...contactoEditar, email: e.target.value })}
                  data-testid="input-edit-email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  type="tel"
                  value={contactoEditar.telefono || ''}
                  onChange={(e) => setContactoEditar({ ...contactoEditar, telefono: e.target.value })}
                  data-testid="input-edit-phone"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="favorito"
                  checked={contactoEditar.favorito || false}
                  onChange={(e) => setContactoEditar({ ...contactoEditar, favorito: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                  data-testid="checkbox-favorite"
                />
                <label htmlFor="favorito" className="text-sm font-medium">
                  Marcar como favorito
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setMostrarModalEditarContacto(false);
              setContactoEditar(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (contactoEditar) {
                  editarContactoMutation.mutate({
                    id: contactoEditar.id,
                    nombre: contactoEditar.nombre,
                    email: contactoEditar.email,
                    telefono: contactoEditar.telefono,
                    favorito: contactoEditar.favorito,
                  });
                }
              }}
              disabled={editarContactoMutation.isPending}
              data-testid="button-save-contact"
            >
              {editarContactoMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar contacto a grupo */}
      <Dialog open={mostrarModalAgregarAGrupo} onOpenChange={setMostrarModalAgregarAGrupo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agregar a Grupo
            </DialogTitle>
            <DialogDescription>
              Selecciona un grupo donde agregar a {contactoParaAgregarAGrupo?.nombre}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-64">
            {gruposAdministrados.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No tienes grupos donde seas administrador</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setMostrarModalAgregarAGrupo(false);
                    setMostrarModalCrearGrupo(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear un grupo
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {gruposAdministrados.map((grupo) => (
                  <button
                    key={grupo.id}
                    className="flex items-center gap-3 p-3 rounded-lg w-full hover-elevate text-left"
                    onClick={() => {
                      if (contactoParaAgregarAGrupo?.contactoId) {
                        agregarUsuarioAGrupoMutation.mutate({
                          grupoId: grupo.id,
                          usuarioId: contactoParaAgregarAGrupo.contactoId,
                        });
                      }
                    }}
                    disabled={agregarUsuarioAGrupoMutation.isPending}
                    data-testid={`button-add-to-group-${grupo.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={grupo.avatarUrl} alt={grupo.nombre} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                        {grupo.nombre.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{grupo.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {grupo.tipo === 'privado' ? 'Chat privado' : `Grupo`}
                      </p>
                    </div>
                    {grupo.esPrioridad && (
                      <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                        Organización
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMostrarModalAgregarAGrupo(false);
              setContactoParaAgregarAGrupo(null);
            }}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear grupo */}
      <Dialog open={mostrarModalCrearGrupo} onOpenChange={setMostrarModalCrearGrupo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nuevo Grupo
            </DialogTitle>
            <DialogDescription>
              Crea un grupo para chatear con múltiples personas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del grupo *</label>
              <Input
                placeholder="Ej: Amigos, Trabajo, Familia..."
                value={nombreNuevoGrupo}
                onChange={(e) => setNombreNuevoGrupo(e.target.value)}
                data-testid="input-group-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <Input
                placeholder="Describe el propósito del grupo..."
                value={descripcionNuevoGrupo}
                onChange={(e) => setDescripcionNuevoGrupo(e.target.value)}
                data-testid="input-group-description"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setMostrarModalCrearGrupo(false);
              setNombreNuevoGrupo("");
              setDescripcionNuevoGrupo("");
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (nombreNuevoGrupo.trim()) {
                  crearGrupoMutation.mutate({
                    nombre: nombreNuevoGrupo.trim(),
                    descripcion: descripcionNuevoGrupo.trim() || undefined,
                    tipo: 'grupo',
                  });
                }
              }}
              disabled={!nombreNuevoGrupo.trim() || crearGrupoMutation.isPending}
              data-testid="button-create-group"
            >
              {crearGrupoMutation.isPending ? 'Creando...' : 'Crear grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para salir del grupo */}
      <Dialog open={mostrarConfirmarSalir} onOpenChange={setMostrarConfirmarSalir}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Salir del grupo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas salir de este grupo? Ya no recibirás mensajes nuevos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setMostrarConfirmarSalir(false);
              setGrupoParaAccion(null);
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (grupoParaAccion) {
                  salirDelGrupoMutation.mutate(grupoParaAccion);
                }
              }}
              disabled={salirDelGrupoMutation.isPending}
              data-testid="button-confirm-leave-group"
            >
              {salirDelGrupoMutation.isPending ? 'Saliendo...' : 'Sí, salir del grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar grupo */}
      <Dialog open={mostrarConfirmarEliminar} onOpenChange={setMostrarConfirmarEliminar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Eliminar grupo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer y se eliminarán todos los mensajes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setMostrarConfirmarEliminar(false);
              setGrupoParaAccion(null);
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (grupoParaAccion) {
                  eliminarGrupoMutation.mutate(grupoParaAccion);
                }
              }}
              disabled={eliminarGrupoMutation.isPending}
              data-testid="button-confirm-delete-group"
            >
              {eliminarGrupoMutation.isPending ? 'Eliminando...' : 'Sí, eliminar grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para modificar título del grupo */}
      <Dialog open={mostrarModalModificarGrupo} onOpenChange={setMostrarModalModificarGrupo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modificar grupo
            </DialogTitle>
            <DialogDescription>
              Actualiza el nombre y descripción del grupo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del grupo *</label>
              <Input
                placeholder="Nombre del grupo"
                value={nuevoTituloGrupo}
                onChange={(e) => setNuevoTituloGrupo(e.target.value)}
                data-testid="input-edit-group-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <Input
                placeholder="Descripción del grupo"
                value={nuevaDescripcionGrupo}
                onChange={(e) => setNuevaDescripcionGrupo(e.target.value)}
                data-testid="input-edit-group-description"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setMostrarModalModificarGrupo(false);
              setGrupoParaAccion(null);
              setNuevoTituloGrupo("");
              setNuevaDescripcionGrupo("");
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (grupoParaAccion && nuevoTituloGrupo.trim()) {
                  modificarTituloGrupoMutation.mutate({
                    grupoId: grupoParaAccion,
                    nombre: nuevoTituloGrupo.trim(),
                    descripcion: nuevaDescripcionGrupo.trim() || undefined,
                  });
                }
              }}
              disabled={!nuevoTituloGrupo.trim() || modificarTituloGrupoMutation.isPending}
              data-testid="button-save-group-changes"
            >
              {modificarTituloGrupoMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
