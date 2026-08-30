import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { aspiranteAuthService } from "../../../services/aspirante/aspiranteService";
import { CheckCircleIcon as StatusIcon } from "../../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
    </svg>
  );
}

function PagosIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
    </svg>
  );
}

function DocumentsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v6h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13h6M10 17h6" />
    </svg>
  );
}

function InterviewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CriteriosIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

// ── Navegación ────────────────────────────────────────────────────────────────

const NAV_ITEMS: AppNavItem[] = [
  { label: "Inicio",               to: "/aspirante/inicio",     Icon: HomeIcon },
  { label: "Estado del aspirante", to: "/aspirante/estado",     Icon: StatusIcon },
  { label: "Pagos",                to: "/aspirante/pagos",      Icon: PagosIcon },
  { label: "Documentos",           to: "/aspirante/documentos", Icon: DocumentsIcon },
  { label: "Entrevista",           to: "/aspirante/entrevista", Icon: InterviewIcon },
  { label: "Prueba",               to: "/aspirante/prueba",     Icon: TestIcon },
  { label: "Criterios",            to: "/aspirante/criterios",  Icon: CriteriosIcon },
];

const RUTAS_RESTRINGIDAS = new Set([
  "/aspirante/documentos",
  "/aspirante/entrevista",
  "/aspirante/prueba",
  "/aspirante/criterios",
]);

// ── Componente ────────────────────────────────────────────────────────────────

interface SidebarAspiranteProps {
  mobileOpen: boolean;
  onClose: () => void;
  soloInscrito: boolean | null;
  inscripcionCompletada?: boolean | null;
}

export default function SidebarAspirante({ mobileOpen, onClose, soloInscrito, inscripcionCompletada }: SidebarAspiranteProps) {
  const navigate = useNavigate();
  const session = aspiranteAuthService.getSession();

  const handleLogout = () => {
    aspiranteAuthService.logout();
    navigate("/aspirante/login");
  };

  const navItems: AppNavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    disabled:
      // disable restricted routes while loading (null) or when soloInscrito
      (soloInscrito !== false && RUTAS_RESTRINGIDAS.has(item.to ?? ""))
      // additionally, disable Pagos unless inscripción está completada
      || (item.to === "/aspirante/pagos" && inscripcionCompletada !== true),
  }));

  return (
    <AppSidebar
      title="Sistema de Posgrados"
      roleLabel="Aspirante"
      session={session}
      navItems={navItems}
      onLogout={handleLogout}
      mobileOpen={mobileOpen}
      onClose={onClose}
    />
  );
}
