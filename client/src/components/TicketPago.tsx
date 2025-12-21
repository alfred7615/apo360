import { forwardRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ItemTicket {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface TicketPagoProps {
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

const TicketPago = forwardRef<HTMLDivElement, TicketPagoProps>(
  ({ 
    numeroTicket, 
    fechaHora, 
    negocio, 
    items, 
    subtotal, 
    descuento = 0, 
    total, 
    moneda,
    metodoPago,
    cliente,
    notas
  }, ref) => {
    
    const simboloMoneda = {
      PEN: "S/",
      USD: "$",
      CLP: "CLP$",
      ARS: "AR$",
      BOB: "Bs",
    }[moneda] || moneda;

    const formatearPrecio = (precio: number) => {
      return precio.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-black font-mono text-[10px] leading-tight"
        style={{
          width: "6cm",
          minHeight: "13cm",
          padding: "4mm",
          boxSizing: "border-box",
        }}
        data-testid="ticket-pago"
      >
        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="text-[14px] font-bold uppercase tracking-wide">
            {negocio.nombre}
          </div>
          {negocio.direccion && (
            <div className="text-[8px] mt-1">{negocio.direccion}</div>
          )}
          {negocio.telefono && (
            <div className="text-[8px]">Tel: {negocio.telefono}</div>
          )}
          {negocio.ruc && (
            <div className="text-[8px]">RUC: {negocio.ruc}</div>
          )}
        </div>

        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="text-[12px] font-bold">TICKET DE VENTA</div>
          <div className="text-[9px] mt-1">N° {numeroTicket}</div>
          <div className="text-[8px] mt-1">
            {format(fechaHora, "dd/MM/yyyy HH:mm:ss", { locale: es })}
          </div>
        </div>

        {cliente?.nombre && (
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
            <div className="text-[9px]">
              <span className="font-bold">Cliente:</span> {cliente.nombre}
            </div>
            {cliente.telefono && (
              <div className="text-[9px]">
                <span className="font-bold">Tel:</span> {cliente.telefono}
              </div>
            )}
          </div>
        )}

        <div className="mb-2">
          <div className="flex justify-between text-[8px] font-bold border-b border-gray-300 pb-1 mb-1">
            <span className="flex-1">PRODUCTO</span>
            <span className="w-8 text-center">CANT</span>
            <span className="w-14 text-right">P.UNIT</span>
            <span className="w-14 text-right">TOTAL</span>
          </div>
          
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[9px] py-0.5">
              <span className="flex-1 truncate pr-1" title={item.nombre}>
                {item.nombre.length > 18 ? item.nombre.substring(0, 18) + "..." : item.nombre}
              </span>
              <span className="w-8 text-center">{item.cantidad}</span>
              <span className="w-14 text-right">{formatearPrecio(item.precioUnitario)}</span>
              <span className="w-14 text-right">{formatearPrecio(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
          <div className="flex justify-between text-[9px]">
            <span>Subtotal:</span>
            <span>{simboloMoneda} {formatearPrecio(subtotal)}</span>
          </div>
          
          {descuento > 0 && (
            <div className="flex justify-between text-[9px] text-green-700">
              <span>Descuento:</span>
              <span>-{simboloMoneda} {formatearPrecio(descuento)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-[12px] font-bold mt-1 pt-1 border-t border-gray-300">
            <span>TOTAL:</span>
            <span>{simboloMoneda} {formatearPrecio(total)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
          <div className="flex justify-between text-[9px]">
            <span className="font-bold">Método de pago:</span>
            <span className="capitalize">{metodoPago}</span>
          </div>
        </div>

        {notas && (
          <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
            <div className="text-[8px]">
              <span className="font-bold">Notas:</span> {notas}
            </div>
          </div>
        )}

        <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-400">
          <div className="text-[9px] font-bold">*** GRACIAS POR SU COMPRA ***</div>
          <div className="text-[8px] mt-1 text-gray-600">
            Conserve este ticket como comprobante
          </div>
          <div className="text-[8px] mt-2 text-gray-500">
            Generado por APO-360
          </div>
        </div>

        <div className="text-center mt-3">
          <div 
            className="inline-block bg-gray-100 px-2 py-1 rounded text-[7px] font-mono"
            style={{ letterSpacing: "1px" }}
          >
            {numeroTicket}
          </div>
        </div>
      </div>
    );
  }
);

TicketPago.displayName = "TicketPago";

export default TicketPago;
