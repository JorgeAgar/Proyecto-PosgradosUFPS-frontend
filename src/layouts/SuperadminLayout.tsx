import { useState, useCallback } from "react";
import { Outlet, Navigate } from "react-router";
import SuperadminSidebar from "../vistas/superadmin/components/Sidebar";
import Alerta, { type TipoAlerta } from "../components/Alerta";
import Confirm from "../components/Confirm";
import ufpsLogo from "../assets/NEGROufps.png";
import { MenuIcon } from "../assets/icons";
import { superadminAuthService } from "../services/superadmin/superadminService";

export interface SuperadminOutletContext {
  mostrarAlerta: (mensaje: string, tipo?: TipoAlerta) => void;
  mostrarConfirm: (mensaje: string) => void;
}

export default function SuperadminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerta, setAlerta] = useState<{ mensaje: string; tipo: TipoAlerta } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const session = superadminAuthService.getSession();

  const mostrarAlerta = useCallback((mensaje: string, tipo: TipoAlerta = "error") => {
    setAlerta({ mensaje, tipo });
  }, []);

  const mostrarConfirm = useCallback((mensaje: string) => {
    setConfirm(mensaje);
  }, []);

  if (!session) {
    return <Navigate to="/superadmin/login" replace />;
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
      <SuperadminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mini-header solo en móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="p-2 rounded-lg text-gray-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <img src={ufpsLogo} alt="UFPS" className="h-7 w-auto" />
            <span className="text-sm font-bold text-gray-800">Administrativo</span>
          </div>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ mostrarAlerta, mostrarConfirm } satisfies SuperadminOutletContext} />
        </main>
      </div>
    </div>
  );
}
