import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Upload, 
  FileText, 
  Image, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface DocumentoAdjunto {
  nombreArchivo: string;
  tipoArchivo: string;
  urlArchivo: string;
  tamanio?: number;
  descripcion?: string;
}

interface SolicitudGrupoChatFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoId: string;
  grupoNombre: string;
}

export function SolicitudGrupoChatForm({
  open,
  onOpenChange,
  grupoId,
  grupoNombre
}: SolicitudGrupoChatFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [organizacionNombre, setOrganizacionNombre] = useState("");
  const [datosContacto, setDatosContacto] = useState("");
  const [documentos, setDocumentos] = useState<DocumentoAdjunto[]>([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  const enviarSolicitudMutation = useMutation({
    mutationFn: async (data: {
      grupoId: string;
      organizacionNombre: string;
      datosContacto?: string;
      documentos: DocumentoAdjunto[];
    }) => {
      const response = await apiRequest("POST", "/api/chat/solicitudes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de autorización ha sido enviada. Un administrador la revisará pronto.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/grupos"] });
      onOpenChange(false);
      limpiarFormulario();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    },
  });

  const limpiarFormulario = () => {
    setOrganizacionNombre("");
    setDatosContacto("");
    setDocumentos([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSubiendoArchivo(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const tiposPermitidos = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!tiposPermitidos.includes(file.type)) {
        toast({
          title: "Tipo de archivo no permitido",
          description: `El archivo "${file.name}" no es un tipo permitido (imágenes, PDF, Word)`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `El archivo "${file.name}" excede el límite de 10MB`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const base64 = await convertirABase64(file);
        
        setDocumentos(prev => [...prev, {
          nombreArchivo: file.name,
          tipoArchivo: file.type,
          urlArchivo: base64,
          tamanio: file.size,
        }]);
      } catch (error) {
        console.error("Error al procesar archivo:", error);
        toast({
          title: "Error",
          description: `No se pudo procesar el archivo "${file.name}"`,
          variant: "destructive",
        });
      }
    }

    setSubiendoArchivo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertirABase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const eliminarDocumento = (index: number) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index));
  };

  const formatearTamanio = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const obtenerIconoArchivo = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleSubmit = () => {
    if (!organizacionNombre.trim()) {
      toast({
        title: "Campo requerido",
        description: "Debes ingresar el nombre de la organización",
        variant: "destructive",
      });
      return;
    }

    if (documentos.length === 0) {
      toast({
        title: "Documentos requeridos",
        description: "Debes adjuntar al menos un documento de respaldo",
        variant: "destructive",
      });
      return;
    }

    enviarSolicitudMutation.mutate({
      grupoId,
      organizacionNombre: organizacionNombre.trim(),
      datosContacto: datosContacto.trim() || undefined,
      documentos,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            Solicitar Autorización CHAT
          </DialogTitle>
          <DialogDescription>
            Completa el formulario para convertir "{grupoNombre}" en un grupo organizacional autorizado.
            Los grupos autorizados aparecen primero en la lista y tienen acceso prioritario a alertas de emergencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="organizacion">Nombre de la Organización *</Label>
            <Input
              id="organizacion"
              placeholder="Ej: Junta Vecinal Los Pinos, Serenazgo Tacna..."
              value={organizacionNombre}
              onChange={(e) => setOrganizacionNombre(e.target.value)}
              data-testid="input-organization-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contacto">Datos de Contacto (opcional)</Label>
            <Textarea
              id="contacto"
              placeholder="Teléfono, dirección, horario de atención..."
              value={datosContacto}
              onChange={(e) => setDatosContacto(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="input-contact-details"
            />
          </div>

          <div className="space-y-2">
            <Label>Documentos de Respaldo *</Label>
            <p className="text-xs text-muted-foreground">
              Adjunta documentos que acrediten la existencia de la organización 
              (actas, resoluciones, credenciales, etc.)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file-upload"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoArchivo}
              className="w-full"
              data-testid="button-upload-documents"
            >
              {subiendoArchivo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivos
                </>
              )}
            </Button>

            {documentos.length > 0 && (
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {documentos.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {obtenerIconoArchivo(doc.tipoArchivo)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.nombreArchivo}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatearTamanio(doc.tamanio)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarDocumento(index)}
                        className="h-8 w-8 shrink-0"
                        data-testid={`button-remove-doc-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Información importante
                </p>
                <ul className="mt-1 text-amber-600 dark:text-amber-500 space-y-1">
                  <li>• La solicitud será revisada por un administrador</li>
                  <li>• Los grupos organizacionales tienen una tarifa mensual de S/5.00</li>
                  <li>• Al ser aprobado, recibirás acceso a alertas de emergencia prioritarias</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              limpiarFormulario();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={enviarSolicitudMutation.isPending || !organizacionNombre.trim() || documentos.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-submit-request"
          >
            {enviarSolicitudMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enviar Solicitud
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
