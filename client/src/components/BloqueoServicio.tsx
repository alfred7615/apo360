import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, User, CheckCircle, XCircle, 
  ArrowRight, Lock
} from "lucide-react";

interface CampoRequerido {
  nombre: string;
  etiqueta: string;
  completado: boolean;
}

interface BloqueoServicioProps {
  titulo: string;
  descripcion: string;
  icono?: React.ReactNode;
  porcentaje: number;
  camposFaltantes: string[];
  requisitosTotales?: CampoRequerido[];
}

const etiquetasCampos: Record<string, string> = {
  nombre: "Nombre completo",
  telefono: "Teléfono",
  email: "Correo electrónico",
  alias: "Alias/Apodo",
  direccion: "Dirección",
  dni: "DNI",
  brevete: "Brevete de conducir",
  vehiculo: "Datos del vehículo",
  modoTaxi: "Modo conductor activado",
};

export default function BloqueoServicio({
  titulo,
  descripcion,
  icono,
  porcentaje,
  camposFaltantes,
  requisitosTotales,
}: BloqueoServicioProps) {
  const obtenerEtiqueta = (campo: string) => {
    return etiquetasCampos[campo] || campo;
  };

  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10" data-testid="bloqueo-servicio">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
            {icono || <Lock className="h-8 w-8 text-yellow-600" />}
          </div>
          
          <h3 className="text-lg font-bold mb-2" data-testid="bloqueo-titulo">{titulo}</h3>
          <p className="text-muted-foreground text-sm mb-4">{descripcion}</p>

          <div className="w-full max-w-xs mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progreso del perfil</span>
              <span className="font-medium">{porcentaje}%</span>
            </div>
            <Progress value={porcentaje} className="h-2" data-testid="progreso-perfil" />
          </div>

          {camposFaltantes.length > 0 && (
            <div className="w-full mb-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Requisitos faltantes:
              </p>
              <ul className="space-y-1 text-left">
                {camposFaltantes.map((campo) => (
                  <li 
                    key={campo} 
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    data-testid={`campo-faltante-${campo}`}
                  >
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    {obtenerEtiqueta(campo)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requisitosTotales && requisitosTotales.length > 0 && (
            <div className="w-full mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm font-medium mb-2">Todos los requisitos:</p>
              <ul className="space-y-1 text-left">
                {requisitosTotales.map((req) => (
                  <li 
                    key={req.nombre} 
                    className={`flex items-center gap-2 text-sm ${req.completado ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    {req.completado ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    )}
                    {req.etiqueta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href="/perfil">
            <Button className="gap-2" data-testid="button-completar-perfil">
              <User className="h-4 w-4" />
              Completar Perfil
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface VerificacionPerfilResponse {
  perfilBasico: {
    completo: boolean;
    porcentaje: number;
    camposFaltantes: string[];
  };
  chat: {
    habilitado: boolean;
    porcentaje: number;
    camposFaltantes: string[];
  };
  taxiPasajero: {
    habilitado: boolean;
    porcentaje: number;
    camposFaltantes: string[];
  };
  conductor: {
    habilitado: boolean;
    porcentaje: number;
    camposFaltantes: string[];
  };
  vendedor: {
    habilitado: boolean;
    porcentaje: number;
    camposFaltantes: string[];
  };
}

export function useVerificarPerfil() {
  const { data, isLoading, error } = useQuery<VerificacionPerfilResponse>({
    queryKey: ["/api/verificar-perfil"],
  });

  return {
    verificacion: data,
    isLoading,
    error,
    perfilBasicoCompleto: data?.perfilBasico?.completo ?? false,
    chatHabilitado: data?.chat?.habilitado ?? false,
    taxiPasajeroHabilitado: data?.taxiPasajero?.habilitado ?? false,
    conductorHabilitado: data?.conductor?.habilitado ?? false,
    vendedorHabilitado: data?.vendedor?.habilitado ?? false,
  };
}
