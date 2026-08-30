import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { fetchCohortes } from '../../../services/programa/programaCohorteService';
import { AdmissionIcon, CriteriaListIcon, DocumentsIcon, HomeIcon as InicioIcon, PaymentCardDetailsIcon, ProgramCohorteIcon, ValidationDocumentIcon } from "../../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── Navegación ────────────────────────────────────────────────────────────────

const NAV_ITEMS: AppNavItem[] = [
  { label: "Inicio", to: "/programa/inicio", Icon: InicioIcon },
  { label: "Cohortes", to: "/programa/cohortes", Icon: ProgramCohorteIcon },
  { label: "Documentos requeridos", to: "/programa/documentos", Icon: DocumentsIcon },
  { label: "Criterios", to: "/programa/criterios", Icon: CriteriaListIcon },
  {
    label: "Validación de pagos",
    Icon: PaymentCardDetailsIcon,
    base: "/programa/pagos",
    subItems: [
      { label: "Inscripción", to: "/programa/pagos/inscripcion" },
      { label: "Matrícula",   to: "/programa/pagos/matricula"   },
    ],
  },
  {
    label: "Validación de documentos",
    to: "/programa/validacion",
    Icon: ValidationDocumentIcon,
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
