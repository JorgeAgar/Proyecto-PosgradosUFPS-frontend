import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { fetchCohortes } from '../../../services/programa/programaCohorteService';
import { AdmissionIcon, CriteriaListIcon, DocumentsIcon, HomeIcon as InicioIcon, ProgramCohorteIcon } from "../../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

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
  { label: "Criterios", to: "/programa/criterios", Icon: CriteriaListIcon },
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
    Icon: AdmissionIcon,
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
