import { useEffect } from "react";
import { CalculadoraCambio } from "@/components/CalculadoraCambio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Info } from "lucide-react";

export default function CalculadoraCambioPage() {
  useEffect(() => {
    document.title = "Calculadora de Cambio | APO-360";
  }, []);

  return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2" data-testid="title-page">
              <DollarSign className="h-8 w-8 text-primary" />
              Cambio de Moneda
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Convierte entre las principales monedas de Sudamérica con tasas de referencia y tasas locales de cambistas verificados.
            </p>
          </div>

          <CalculadoraCambio />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="hover-elevate" data-testid="card-info-tasas">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Tasas de Referencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Usamos tasas de referencia actualizadas que reflejan el promedio del mercado internacional.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-info-cambistas">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Cambistas Locales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Los cambistas de la comunidad actualizan sus tasas para ofrecerte mejores opciones de cambio.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-info-promedio">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-500" />
                  Promedio Local
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Calculamos el promedio de las tasas locales para darte la mejor referencia del mercado en tu zona.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
