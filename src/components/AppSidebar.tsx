import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import ufpsLogo from "../assets/logoufps.png";
import { LockIcon, LogoutIcon, XMarkIcon as CloseIcon } from "../assets/icons";

// ── Íconos internos ───────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Tipos exportados ──────────────────────────────────────────────────────────

export type SubNavItem = {
  label: string;
  to: string;
};

export type AppNavItem = {
  label: string;
  Icon: React.ComponentType;
  /** Ruta destino para ítems simples */
  to?: string;
  /** Sub-ítems para grupo colapsable */
  subItems?: SubNavItem[];
  /** Ruta base para detectar si el grupo está activo */
  base?: string;
  /** Ítem bloqueado: se muestra en gris sin permitir navegación */
  disabled?: boolean;
};

export type AppSidebarSession = {
  displayName?: string;
  username?: string;
};

// ── Grupo colapsable ──────────────────────────────────────────────────────────

function CollapsibleGroup({
  item,
  delay,
  onClose,
}: {
  item: AppNavItem;
  delay: string;
  onClose: () => void;
}) {
  const { pathname } = useLocation();
  const { Icon, label, subItems = [], base = "" } = item;
  const isGroupActive = base ? pathname.startsWith(base) : false;
  const [userOpen, setUserOpen] = useState(false);
  const open = isGroupActive || userOpen;

  return (
    <div className={`animate-slide-left ${delay}`}>
      <button
        type="button"
        onClick={() => setUserOpen(o => !o)}
        className={[
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isGroupActive || open
            ? "bg-red-50 text-red-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        ].join(" ")}
      >
        <Icon />
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      <div
        className={[
          "ml-4 pl-3 border-l-2 border-red-100 mt-0.5 mb-0.5 space-y-0.5 overflow-hidden",
          "transition-all duration-300 ease-in-out",
          open
            ? "max-h-64 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-1 pointer-events-none",
        ].join(" ")}
      >
        {subItems.map(sub => (
          <NavLink
            key={sub.to}
            to={sub.to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              [
                "grid w-full grid-cols-[0.9rem_minmax(0,1fr)] items-center gap-x-2 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-red-700 text-white shadow-sm"
                  : "text-gray-500 hover:bg-red-50 hover:text-red-700",
              ].join(" ")
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 justify-self-center" />
            <span className="min-w-0 whitespace-normal leading-tight">{sub.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface AppSidebarProps {
  /** Texto del encabezado bajo "UFPS" */
  title: string;
  /** Etiqueta del badge de rol */
  roleLabel: string;
  session: AppSidebarSession | null;
  navItems: AppNavItem[];
  onLogout: () => void;
  mobileOpen: boolean;
  onClose: () => void;
  onNavItemClick?: (item: AppNavItem) => void;
}

const DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500", "delay-600"];

export default function AppSidebar({
  title,
  roleLabel,
  session,
  navItems,
  onLogout,
  mobileOpen,
  onClose,
  onNavItemClick,
}: AppSidebarProps) {
  const sidebarContent = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-gray-200 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center gap-3 px-5 py-5 bg-red-700 text-white">
        <img
          src={ufpsLogo}
          alt="UFPS"
          className="animate-fade-in h-9 w-auto shrink-0 drop-shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="animate-fade-in text-[11px] font-bold tracking-widest uppercase text-red-200 leading-none">
            UFPS
          </p>
          <p className="animate-fade-in text-[13px] font-semibold leading-tight mt-0.5 truncate">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="ml-auto p-1 rounded hover:bg-white/20 transition-colors md:hidden"
        >
          <CloseIcon className="h-5 w-5" strokeWidth="2" />
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
          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-red-700 text-white rounded px-2 py-0.5">
            {roleLabel}
          </span>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item, idx) => {
          const delay = DELAYS[Math.min(idx, DELAYS.length - 1)];
          if (item.subItems) {
            return (
              <CollapsibleGroup
                key={item.label}
                item={item}
                delay={delay}
                onClose={onClose}
              />
            );
          }
          return (
            <div key={item.to ?? item.label} className={`animate-slide-left ${delay}`}>
              {item.disabled ? (
                <div
                  title="Disponible a partir del estado Paz y salvo"
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 cursor-not-allowed select-none"
                >
                  <item.Icon />
                  <span className="truncate flex-1">{item.label}</span>
                  <LockIcon className="h-3.5 w-3.5 shrink-0 ml-auto opacity-60" />
                </div>
              ) : (
                <NavLink
                  to={item.to!}
                  onClick={() => {
                    onNavItemClick?.(item);
                    onClose();
                  }}
                  className={({ isActive }) =>
                    [
                      "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-red-700 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    ].join(" ")
                  }
                >
                  <item.Icon />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="animate-fade-in delay-600 px-3 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-700 transition-colors"
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
        <div className="w-64 flex flex-col h-screen sticky top-0">{sidebarContent}</div>
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
