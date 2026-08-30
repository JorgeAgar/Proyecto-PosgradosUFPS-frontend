import { useState, useCallback, useEffect } from "react";
import { Outlet, Navigate } from "react-router";
import SidebarAspirante from "../vistas/aspirante/components/Sidebar";
import Alerta, { type TipoAlerta } from "../components/Alerta";
import Confirm from "../components/Confirm";
import ufpsLogo from "../assets/logoufps.png";
import { MenuIcon } from "../assets/icons";
import { aspiranteAuthService } from "../services/aspirante/aspiranteService";
import { fetchEstadoProceso } from "../services/aspirante/aspiranteEstadoService";

export interface AspiranteOutletContext {
  mostrarAlerta: (mensaje: string, tipo?: TipoAlerta) => void;
  mostrarConfirm: (mensaje: string) => void;
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerta, setAlerta] = useState<{ mensaje: string; tipo: TipoAlerta } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [soloInscrito, setSoloInscrito] = useState<boolean | null>(null);
  const [admitido, setAdmitido]         = useState<boolean | null>(null);
  const [inscripcionCompletada, setInscripcionCompletada] = useState<boolean | null>(null);

  const mostrarAlerta = useCallback((mensaje: string, tipo: TipoAlerta = "error") => {
    setAlerta({ mensaje, tipo });
  }, []);

  const mostrarConfirm = useCallback((mensaje: string) => {
    setConfirm(mensaje);
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Alerta
        isOpen={alerta !== null}
        mensaje={alerta?.mensaje ?? ""}
        tipo={alerta?.tipo}
        onClose={() => setAlerta(null)}
      />
      <Confirm
        isOpen={confirm !== null}
        mensaje={confirm ?? ""}
        onClose={() => setConfirm(null)}
      />

      {/* Sidebar (fija en desktop, drawer en móvil) */}
      <SidebarAspirante mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} soloInscrito={soloInscrito} inscripcionCompletada={inscripcionCompletada} />

      {/* Columna derecha: mini-header móvil + área de contenido */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mini-header solo visible en móvil (no se superpone a la sidebar) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={ufpsLogo}
              alt="UFPS"
              className="h-7 w-auto"
            />
            <span className="text-sm font-bold text-gray-800">Sistema de Posgrados</span>
          </div>
        </header>

        {/* Área de contenido principal */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ mostrarAlerta, mostrarConfirm, soloInscrito, admitido } satisfies AspiranteOutletContext} />
        </main>
      </div>
    </div>
  );
}
