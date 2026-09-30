import { useCallback, useState } from "react";
import Alerta, { type TipoAlerta } from "../components/Alerta";
import { MenuIcon } from "../assets/icons";

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

const TEMAS = {
  rojo:   { borde: "border-gray-100", hover: "hover:bg-gray-100 hover:text-red-700" },
  oscuro: { borde: "border-gray-200", hover: "hover:bg-slate-100 hover:text-slate-900" },
};

interface PanelLayoutProps {
  /** Nodo con las alertas devuelto por `useNotificaciones`. */
  notificaciones: React.ReactNode;
  /** Renderiza la barra lateral (fija en escritorio, cajón en móvil). */
  sidebar: (props: { mobileOpen: boolean; onClose: () => void }) => React.ReactNode;
  /** Texto del mini-encabezado móvil. */
  titulo: string;
  /** Logo opcional del mini-encabezado móvil. */
  logo?: string;
  tema?: keyof typeof TEMAS;
  /** Contenido principal, normalmente `<Outlet />`. */
  children: React.ReactNode;
}

/**
 * Esqueleto común de los paneles autenticados: sidebar a la izquierda, mini-encabezado
 * con botón hamburguesa solo en móvil y área de contenido desplazable.
 */
export default function PanelLayout({ notificaciones, sidebar, titulo, logo, tema = "rojo", children }: PanelLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = TEMAS[tema];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {notificaciones}

      {sidebar({ mobileOpen, onClose: () => setMobileOpen(false) })}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className={`md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm z-30 ${t.borde}`}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className={`p-2 rounded-lg text-gray-600 transition-colors ${t.hover}`}
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            {logo && <img src={logo} alt="UFPS" className="h-7 w-auto" />}
            <span className="text-sm font-bold text-gray-800">{titulo}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
