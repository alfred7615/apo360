import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import type { Mensaje, Usuario } from '@shared/schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatWindowProps {
  grupoId: string;
  currentUser: Usuario;
}

export function ChatWindow({ grupoId, currentUser }: ChatWindowProps) {
  const [mensaje, setMensaje] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Obtener mensajes del grupo
  const { data: mensajes, isLoading } = useQuery<Mensaje[]>({
    queryKey: ['/api/chat/mensajes', grupoId],
  });

  // WebSocket connection (autenticado con sesión)
  const { isConnected, sendMessage, sendTyping } = useWebSocket({
    grupoId,
    onMessage: (nuevoMensaje) => {
      console.log('💬 Nuevo mensaje recibido:', nuevoMensaje);
      // React Query ya invalidará el cache automáticamente
    },
    onUserTyping: (usuarioId) => {
      setTypingUsers(prev => new Set(prev).add(usuarioId));
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(usuarioId);
          return next;
        });
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: 'Error en el chat',
        description: error,
        variant: 'destructive',
      });
    },
  });

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mensaje.trim() || !isConnected) return;

    const success = sendMessage(mensaje.trim());
    
    if (success) {
      setMensaje('');
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje. Reconectando...',
        variant: 'destructive',
      });
    }
  };

  const handleTyping = () => {
    if (!isConnected) return;

    // Enviar indicador de typing
    sendTyping();

    // Throttle: solo enviar cada 2 segundos
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // No hacer nada, solo para throttle
    }, 2000);
  };

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header del chat */}
      <div className="flex items-center gap-2 p-4 border-b bg-card">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(currentUser.firstName || 'U')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground" data-testid="text-chat-title">
            Chat del Grupo
          </h2>
          <p className="text-sm text-muted-foreground">
            {isConnected ? (
              <span className="text-green-600 dark:text-green-400">● En línea</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Desconectado
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Lista de mensajes */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {mensajes?.map((msg) => {
            const isOwn = msg.usuarioId === currentUser.id;
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                data-testid={`message-${msg.id}`}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials('Usuario')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm break-words" data-testid="text-message-content">
                      {msg.contenido}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground px-2">
                    {format(new Date(msg.createdAt), 'HH:mm', { locale: es })}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Indicador de "escribiendo..." */}
          {typingUsers.size > 0 && (
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Alguien está escribiendo...</span>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input para escribir mensaje */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={mensaje}
            onChange={(e) => {
              setMensaje(e.target.value);
              handleTyping();
            }}
            placeholder="Escribe un mensaje..."
            disabled={!isConnected}
            className="flex-1"
            data-testid="input-message"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!mensaje.trim() || !isConnected}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
