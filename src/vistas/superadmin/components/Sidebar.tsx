import { NavLink, useNavigate } from "react-router";
import type { ComponentType } from "react";
import ufpsLogoBlanco from "../../../assets/BLANCOufps.png";
import { superadminAuthService } from "../../../services/superadmin/superadminService";
import { CalendarIcon, CouncilDocumentsIcon, HashtagIcon as CodesIcon, HomeIcon, LogoutIcon, SuperadminCohorteIcon, UsersIcon, ValuesIcon, XMarkIcon } from "../../../assets/icons";

// ── Íconos ───────────────────────────────────────────────────────────────────



// ── Tipos ────────────────────────────────────────────────────────────────────

interface SuperadminSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

// ── Datos de navegación ──────────────────────────────────────────────────────

const BASE = "/superadmin";

type NavItem = {
  label: string;
  to: string;
  Icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", to: `${BASE}/inicio`, Icon: HomeIcon },
  { label: "Usuarios", to: `${BASE}/usuarios`, Icon: UsersIcon },
  { label: "Programas", to: `${BASE}/programas`, Icon: SuperadminCohorteIcon },
  { label: "Semestres", to: `${BASE}/semestres`, Icon: CalendarIcon, iconClassName: "size-6" },
  { label: "Valores globales", to: `${BASE}/valores-globales`, Icon: ValuesIcon },
  { label: "Últimos códigos", to: `${BASE}/ultimos-codigos`, Icon: CodesIcon },
  { label: "Documentos consejo", to: `${BASE}/documentos-consejo`, Icon: CouncilDocumentsIcon },
];

const DELAYS = ["delay-75", "delay-100", "delay-150", "delay-200", "delay-300", "delay-500", "delay-600"];

// ── Componente principal ──────────────────────────────────────────────────────

export default function SuperadminSidebar({
  mobileOpen,
  onClose,
}: SuperadminSidebarProps) {
  const navigate = useNavigate();
  const session = superadminAuthService.getSession();

  const handleLogout = () => {
    superadminAuthService.logout();
    navigate("/superadmin/login");
  };

  const sidebarContent = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-slate-900 text-white">
        <img
          src={ufpsLogoBlanco}
          alt="UFPS"
          className="animate-fade-in h-9 w-auto shrink-0 drop-shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="animate-fade-in text-[11px] font-bold tracking-widest uppercase text-slate-300 leading-none">
            UFPS
          </p>
          <p className="animate-fade-in text-[13px] font-semibold leading-tight mt-0.5 truncate">
            Administrativo
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="ml-auto p-1 rounded hover:bg-white/20 transition-colors md:hidden"
        >
          <XMarkIcon className="h-5 w-5" strokeWidth="2" />
        </button>
      </div>

      {/* Sesión activa */}
      {session && (
        <div className="animate-fade-in px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
            Sesión activa
          </p>
          <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">
            {session.displayName ?? session.username}
          </p>
          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded px-2 py-0.5">
            Administrador
          </span>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, to, Icon, iconClassName }, idx) => (
          <div key={to} className={`animate-slide-left ${DELAYS[idx]}`}>
            <NavLink
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                ].join(" ")
              }
            >
              <Icon className={iconClassName} />
              <span className="truncate">{label}</span>
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="animate-fade-in delay-600 px-3 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <LogoutIcon />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: sidebar fija */}
      <div className="hidden md:flex md:shrink-0">
        <div className="w-64 flex flex-col h-screen sticky top-0">
          {sidebarContent}
        </div>
      </div>

      {/* Móvil: drawer overlay */}
      <div
        className={[
          "fixed inset-0 z-40 md:hidden",
          "transition-all duration-300 ease-in-out",
          mobileOpen ? "visible" : "invisible",
        ].join(" ")}
      >
        <div
          onClick={onClose}
          aria-hidden="true"
          className={[
            "absolute inset-0 bg-black/40 backdrop-blur-sm",
            "transition-opacity duration-300 ease-in-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          className={[
            "absolute left-0 top-0 h-full w-64 z-50 shadow-2xl",
            "transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
