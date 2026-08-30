import { NavLink, useNavigate } from "react-router";
import type { ComponentType } from "react";
import ufpsLogoBlanco from "../../../assets/BLANCOufps.png";
import { superadminAuthService } from "../../../services/superadmin/superadminService";
import { CalendarIcon, HomeIcon, LogoutIcon, UsersIcon, XMarkIcon } from "../../../assets/icons";

// ── Íconos ───────────────────────────────────────────────────────────────────

function CohorteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 shrink-0"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      />
    </svg>
  );
}

function valoresIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
      />
    </svg>
  );
}

function documentsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg>
  );
}

function codesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
</svg>
  );
}

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
  { label: "Programas", to: `${BASE}/programas`, Icon: CohorteIcon },
  { label: "Semestres", to: `${BASE}/semestres`, Icon: CalendarIcon, iconClassName: "size-6" },
  { label: "Valores globales", to: `${BASE}/valores-globales`, Icon: valoresIcon },
  { label: "Últimos códigos", to: `${BASE}/ultimos-codigos`, Icon: codesIcon },
  { label: "Documentos consejo", to: `${BASE}/documentos-consejo`, Icon: documentsIcon },
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
