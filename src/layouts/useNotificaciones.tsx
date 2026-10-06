import { useCallback, useState } from "react";
import Alerta, { type TipoAlerta } from "../components/Alerta";

/** Funciones de notificación que los layouts exponen a sus vistas vía `<Outlet context>`. */
export interface NotificacionesContext {
  mostrarAlerta: (mensaje: string, tipo?: TipoAlerta) => void;
  mostrarConfirm: (mensaje: string) => void;
}

/** Estado de las alertas flotantes (error/advertencia y confirmación de éxito). */
export function useNotificaciones() {
  const [alerta, setAlerta] = useState<{ mensaje: string; tipo: TipoAlerta } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const mostrarAlerta = useCallback((mensaje: string, tipo: TipoAlerta = "error") => {
    setAlerta({ mensaje, tipo });
  }, []);

  const mostrarConfirm = useCallback((mensaje: string) => {
    setConfirm(mensaje);
  }, []);

  const notificaciones = (
    <>
      <Alerta
        isOpen={alerta !== null}
        mensaje={alerta?.mensaje ?? ""}
        tipo={alerta?.tipo}
        onClose={() => setAlerta(null)}
      />
      <Alerta
        isOpen={confirm !== null}
        mensaje={confirm ?? ""}
        tipo="exito"
        duracion={4000}
        onClose={() => setConfirm(null)}
      />
    </>
  );

  return { mostrarAlerta, mostrarConfirm, notificaciones };
}
