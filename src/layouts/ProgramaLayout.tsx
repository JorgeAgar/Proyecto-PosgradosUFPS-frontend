import { useState, useCallback } from "react";
import { Outlet, Navigate } from "react-router";
import SidebarDirectorPrograma from "../vistas/programa/components/Sidebar";
import { programaAuthService } from "../services/programa/programaService";
import Alerta, { type TipoAlerta } from "../components/Alerta";
import Confirm from "../components/Confirm";
import { MenuIcon } from "../assets/icons";

export interface ProgramaOutletContext {
  mostrarAlerta: (mensaje: string, tipo?: TipoAlerta) => void;
  mostrarConfirm: (mensaje: string) => void;
}

export default function ProgramaLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alerta, setAlerta] = useState<{ mensaje: string; tipo: TipoAlerta } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const mostrarAlerta = useCallback((mensaje: string, tipo: TipoAlerta = "error") => {
    setAlerta({ mensaje, tipo });
  }, []);

  const mostrarConfirm = useCallback((mensaje: string) => {
    setConfirm(mensaje);
  }, []);

  const session = programaAuthService.getSession();
  if (!session) {
    return <Navigate to="/programa/login" replace />;
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

      <SidebarDirectorPrograma mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-30">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">Sistema de Posgrados</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ mostrarAlerta, mostrarConfirm } satisfies ProgramaOutletContext} />
        </main>
      </div>
    </div>
  );
}
