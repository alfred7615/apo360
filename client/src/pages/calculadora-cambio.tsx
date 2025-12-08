import { useEffect } from "react";
import { CalculadoraCambio } from "@/components/CalculadoraCambio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Info } from "lucide-react";

export default function CalculadoraCambioPage() {
  useEffect(() => {
    document.title = "Calculadora de Cambio | APO-360";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20">
              <DollarSign className="h-7 w-7 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-100" data-testid="title-page">
              Cambio de Moneda
            </h1>
          </div>
          <p className="text-gray-400 max-w-lg mx-auto">
            Convierte entre las principales monedas de Sudamérica con tasas de referencia y tasas locales de cambistas verificados.
          </p>
        </div>

        <CalculadoraCambio />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Card className="bg-gray-800/40 border-gray-700/50 hover-elevate" data-testid="card-info-tasas">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-200">
                <div className="p-1.5 rounded-md bg-emerald-500/20">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                Tasas de Referencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400">
                Usamos tasas de referencia actualizadas que reflejan el promedio del mercado internacional.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/40 border-gray-700/50 hover-elevate" data-testid="card-info-cambistas">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-200">
                <div className="p-1.5 rounded-md bg-blue-500/20">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                Cambistas Locales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400">
                Los cambistas de la comunidad actualizan sus tasas para ofrecerte mejores opciones de cambio.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/40 border-gray-700/50 hover-elevate" data-testid="card-info-promedio">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-200">
                <div className="p-1.5 rounded-md bg-amber-500/20">
                  <Info className="h-4 w-4 text-amber-400" />
                </div>
                Promedio Local
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400">
                Calculamos el promedio de las tasas locales para darte la mejor referencia del mercado en tu zona.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
