import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { fetchCohortes } from '../../../services/programa/programaCohorteService';
import { DocumentsIcon, HomeIcon as InicioIcon, ProgramCohorteIcon } from "../../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

function CriteriosIcon() {
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
        d="M8.5 6h11M8.5 12h11M8.5 18h11"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"
      />
    </svg>
  );
}

function AdmisionIcon() {
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
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function ValidacionIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      className="h-5 w-5 shrink-0"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12"
      />
    </svg>
  );
}

function PagoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 shrink-0"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 15h2M10 15h4" />
    </svg>
  );
}

// ── Navegación ────────────────────────────────────────────────────────────────

const NAV_ITEMS: AppNavItem[] = [
  { label: "Inicio", to: "/programa/inicio", Icon: InicioIcon },
  { label: "Cohortes", to: "/programa/cohortes", Icon: ProgramCohorteIcon },
  { label: "Documentos requeridos", to: "/programa/documentos", Icon: DocumentsIcon },
  { label: "Criterios", to: "/programa/criterios", Icon: CriteriosIcon },
  {
    label: "Validación de pagos",
    Icon: PagoIcon,
    base: "/programa/pagos",
    subItems: [
      { label: "Inscripción", to: "/programa/pagos/inscripcion" },
      { label: "Matrícula",   to: "/programa/pagos/matricula"   },
    ],
  },
  {
    label: "Validación de documentos",
    to: "/programa/validacion",
    Icon: ValidacionIcon,
  },
  {
    label: "Admisión",
    Icon: AdmisionIcon,
    base: "/programa/admision",
    subItems: [
      { label: "Calificación", to: "/programa/admision/calificacion" },
      { label: "Admitidos", to: "/programa/admision/admitidos" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SidebarDirectorProgramaProps {
  mobileOpen: boolean;
  onClose: () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function SidebarDirectorPrograma({
  mobileOpen,
  onClose,
}: SidebarDirectorProgramaProps) {
  const navigate = useNavigate();
  const sessionRaw = localStorage.getItem("ufps_programa_session");
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem("ufps_programa_session");
    localStorage.removeItem("ufps_programa_access_token");
    localStorage.removeItem("ufps_programa_refresh_token");
    localStorage.removeItem("ufps_programa_id");
    navigate("/");
  };

  const handleNavItemClick = (item: AppNavItem) => {
    if (item.to === '/programa/cohortes') {
      try {
        fetchCohortes().catch((err) => console.error('Error cargando cohortes desde sidebar:', err));
      } catch (err) {
        console.error('Error preparando fetchCohortes desde sidebar:', err);
      }
    }
  };

  return (
    <AppSidebar
      title="Sistema de Posgrados"
      roleLabel="Director"
      session={session}
      navItems={NAV_ITEMS}
      onNavItemClick={handleNavItemClick}
      onLogout={handleLogout}
      mobileOpen={mobileOpen}
      onClose={onClose}
    />
  );
}
