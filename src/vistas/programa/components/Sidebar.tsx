import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { programaAuthService } from "../../../services/programa/programaService";
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
  const session = programaAuthService.getSession();

  const handleLogout = () => {
    programaAuthService.logout();
    navigate("/programa/login");
  };

  return (
    <AppSidebar
      title="Sistema de Posgrados"
      roleLabel="Director"
      session={session}
      navItems={NAV_ITEMS}
      onLogout={handleLogout}
      mobileOpen={mobileOpen}
      onClose={onClose}
    />
  );
}
