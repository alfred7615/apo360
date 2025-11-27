import { Construction, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Billetera() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-testid="page-billetera">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white mx-auto mb-6">
            <Construction className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-emerald-600">
            GESTIÓN DE MONEDA
          </h1>
          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
              EN CONSTRUCCIÓN
            </p>
            <p className="text-muted-foreground">
              Pronto a su servicio
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
            <Coins className="h-5 w-5" />
            <span className="text-sm">Billetera Multi-Moneda</span>
          </div>
          <Button 
            onClick={() => setLocation("/")}
            className="w-full"
            data-testid="button-volver-inicio"
          >
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
