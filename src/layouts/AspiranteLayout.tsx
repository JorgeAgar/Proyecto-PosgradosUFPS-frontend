import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router";
import SidebarAspirante from "../vistas/aspirante/components/Sidebar";
import ufpsLogo from "../assets/logoufps.png";
import PanelLayout from "./PanelLayout";
import { useNotificaciones, type NotificacionesContext } from "./useNotificaciones";
import { aspiranteAuthService } from "../services/aspirante/aspiranteService";
import { fetchEstadoProceso } from "../services/aspirante/aspiranteEstadoService";

export interface AspiranteOutletContext extends NotificacionesContext {
  soloInscrito: boolean | null;
  admitido: boolean | null;
}

/**
 * AspiranteLayout
 *
 * Layout global para el flujo del aspirante.
 * - Verifica que haya sesión activa de tipo "aspirante"; si no, redirige al login.
 * - Renderiza la Sidebar a la izquierda y el contenido a la derecha mediante <Outlet />.
 * - En móvil muestra un mini-header con el botón hamburguesa que NO se superpone a la sidebar.
 * - En escritorio la sidebar es fija a la izquierda, sin header adicional.
 */
export default function AspiranteLayout() {
  const { mostrarAlerta, mostrarConfirm, notificaciones } = useNotificaciones();
  const [soloInscrito, setSoloInscrito] = useState<boolean | null>(null);
  const [admitido, setAdmitido]         = useState<boolean | null>(null);
  const [inscripcionCompletada, setInscripcionCompletada] = useState<boolean | null>(null);

  useEffect(() => {
    fetchEstadoProceso()
      .then((pasos) => {
        const pagoCompletado = pasos.some(
          (p) => p.nombre.toLowerCase().includes("pago") && p.estado === "completado"
        );
        const resultadoCompletado = pasos.some(
          (p) => p.nombre.toLowerCase().includes("resultado") && p.estado === "completado"
        );
        const inscriCompletada = pasos.some(
          (p) => p.nombre.toLowerCase().includes("inscri") && p.estado === "completado"
        );
        const legalizacionEnProgreso = pasos.some(
          (p) => p.nombre.toLowerCase().includes("legaliz") && p.estado === "en-progreso"
        );
        setSoloInscrito(!pagoCompletado);
        setAdmitido(resultadoCompletado || legalizacionEnProgreso);
        setInscripcionCompletada(inscriCompletada);
      })
      .catch(() => {
        setSoloInscrito(false);
        setAdmitido(false);
        setInscripcionCompletada(false);
      });
  }, []);

  const session = aspiranteAuthService.getSession();
  if (!session) {
    return <Navigate to="/aspirante/login" replace />;
  }

  return (
    <PanelLayout
      notificaciones={notificaciones}
      sidebar={(props) => (
        <SidebarAspirante {...props} soloInscrito={soloInscrito} inscripcionCompletada={inscripcionCompletada} />
      )}
      titulo="Sistema de Posgrados"
      logo={ufpsLogo}
    >
      <Outlet context={{ mostrarAlerta, mostrarConfirm, soloInscrito, admitido } satisfies AspiranteOutletContext} />
    </PanelLayout>
  );
}
