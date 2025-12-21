import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Printer, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import html2canvas from "html2canvas";
import TicketPago from "./TicketPago";
import { useToast } from "@/hooks/use-toast";

interface ItemTicket {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface DatosTicket {
  numeroTicket: string;
  fechaHora: Date;
  negocio: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    ruc?: string;
  };
  items: ItemTicket[];
  subtotal: number;
  descuento?: number;
  total: number;
  moneda: string;
  metodoPago: string;
  cliente?: {
    nombre?: string;
    telefono?: string;
  };
  notas?: string;
}

interface TicketModalProps {
  abierto: boolean;
  onClose: () => void;
  datos: DatosTicket | null;
}

export default function TicketModal({ abierto, onClose, datos }: TicketModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDescargar = async () => {
    if (!ticketRef.current) return;
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      
      const link = document.createElement("a");
      link.download = `ticket-${datos?.numeroTicket || "compra"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: "Ticket descargado",
        description: "El ticket se ha guardado como imagen",
      });
    } catch (error) {
      console.error("Error al descargar ticket:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar el ticket",
      });
    }
  };

  const handleCompartirWhatsApp = async () => {
    if (!ticketRef.current || !datos) return;
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `ticket-${datos.numeroTicket}.png`, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Ticket de compra - ${datos.negocio.nombre}`,
              text: `Ticket N° ${datos.numeroTicket}`,
            });
          } catch (err) {
            const url = URL.createObjectURL(blob);
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
              `Ticket de compra N° ${datos.numeroTicket}\nNegocio: ${datos.negocio.nombre}\nTotal: ${datos.moneda === "PEN" ? "S/" : datos.moneda} ${datos.total.toFixed(2)}`
            )}`;
            window.open(whatsappUrl, "_blank");
          }
        } else {
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
            `Ticket de compra N° ${datos.numeroTicket}\nNegocio: ${datos.negocio.nombre}\nTotal: ${datos.moneda === "PEN" ? "S/" : datos.moneda} ${datos.total.toFixed(2)}`
          )}`;
          window.open(whatsappUrl, "_blank");
        }
      });
    } catch (error) {
      console.error("Error al compartir:", error);
    }
  };

  const handleImprimir = () => {
    if (!ticketRef.current) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo abrir la ventana de impresión",
      });
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket ${datos?.numeroTicket}</title>
          <style>
            @page {
              size: 6cm 13cm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', monospace;
            }
            .ticket {
              width: 6cm;
              min-height: 13cm;
              padding: 4mm;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${ticketRef.current.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!datos) return null;

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Tu Ticket de Compra</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-cerrar-ticket"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4 bg-gray-100 rounded-lg overflow-auto">
          <TicketPago ref={ticketRef} {...datos} />
        </div>

        <div className="flex flex-wrap gap-2 justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleDescargar}
            data-testid="button-descargar-ticket"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          
          <Button
            variant="outline"
            className="bg-green-500 hover:bg-green-600 text-white border-green-500"
            onClick={handleCompartirWhatsApp}
            data-testid="button-compartir-whatsapp"
          >
            <SiWhatsapp className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          
          <Button
            variant="outline"
            onClick={handleImprimir}
            data-testid="button-imprimir-ticket"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
