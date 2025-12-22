import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface CartContextType {
  carritoAbierto: boolean;
  pasoInicial: "carrito" | "pago" | "confirmacion";
  abrirCarrito: (paso?: "carrito" | "pago" | "confirmacion") => void;
  cerrarCarrito: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [pasoInicial, setPasoInicial] = useState<"carrito" | "pago" | "confirmacion">("carrito");

  const abrirCarrito = useCallback((paso: "carrito" | "pago" | "confirmacion" = "carrito") => {
    setPasoInicial(paso);
    setCarritoAbierto(true);
  }, []);

  const cerrarCarrito = useCallback(() => {
    setCarritoAbierto(false);
    setPasoInicial("carrito");
  }, []);

  return (
    <CartContext.Provider value={{ carritoAbierto, pasoInicial, abrirCarrito, cerrarCarrito }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
