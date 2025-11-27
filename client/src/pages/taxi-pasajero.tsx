import { Construction, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TaxiPasajero() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-testid="page-taxi-pasajero">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white mx-auto mb-6">
            <Construction className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-yellow-600">
            TAXI - PASAJERO
          </h1>
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
              EN CONSTRUCCIÓN
            </p>
            <p className="text-muted-foreground">
              Pronto a su servicio
            </p>
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
