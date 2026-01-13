import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlertasEmergencia } from "@/hooks/useAlertasEmergencia";
import { AlertaEmergenciaModal, AlertaEmergenciaDetalles } from "./AlertaEmergenciaModal";

interface AlertaEmergencia {
  id: string;
  tipo: 'panico' | 'emergencia';
  emisor: {
    id: string;
    nombre: string;
    telefono?: string;
    foto?: string;
  };
  grupo: {
    id: string;
    nombre: string;
    esOrganizacional: boolean;
  };
  ubicacion?: {
    lat: number;
    lng: number;
  };
  opciones: {
    alertarPolicia: boolean;
    solicitarGrua: boolean;
    tieneImagen: boolean;
  };
  mensaje?: string;
  imagenUrl?: string;
  fechaCreacion: string;
}

export default function AlertasEmergenciaGlobal() {
  const { user } = useAuth();
  const [alertaActual, setAlertaActual] = useState<AlertaEmergencia | null>(null);
  const [alertaDetalles, setAlertaDetalles] = useState<AlertaEmergencia | null>(null);

  const handleNuevaAlerta = useCallback((alerta: AlertaEmergencia) => {
    setAlertaActual(alerta);
  }, []);

  const { alertasActivas, descartarAlerta, confirmarVista } = useAlertasEmergencia({
    usuarioId: user?.id,
    onAlerta: handleNuevaAlerta,
  });

  const handleVerDetalles = (alerta: AlertaEmergencia) => {
    confirmarVista(alerta.id);
    setAlertaDetalles(alerta);
    setAlertaActual(null);
  };

  const handleDescartar = (alertaId: string) => {
    descartarAlerta(alertaId);
    setAlertaActual(null);
  };

  const handleCerrarDetalles = () => {
    setAlertaDetalles(null);
    if (alertasActivas.length > 0 && alertasActivas[0].id !== alertaDetalles?.id) {
      setAlertaActual(alertasActivas[0]);
    }
  };

  if (!user) return null;

  return (
    <>
      <AlertaEmergenciaModal
        alerta={alertaActual}
        onVerDetalles={handleVerDetalles}
        onDescartar={handleDescartar}
      />
      {alertaDetalles && (
        <AlertaEmergenciaDetalles
          alerta={alertaDetalles}
          onCerrar={handleCerrarDetalles}
        />
      )}
    </>
  );
}
