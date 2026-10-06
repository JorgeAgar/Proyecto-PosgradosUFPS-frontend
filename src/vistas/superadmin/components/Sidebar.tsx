import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { superadminAuthService } from "../../../services/superadmin/superadminService";
import { CalendarIcon, CouncilDocumentsIcon, HashtagIcon as CodesIcon, HomeIcon, SuperadminCohorteIcon, UsersIcon, ValuesIcon } from "../../../assets/icons";

// ── Navegación ────────────────────────────────────────────────────────────────

const BASE = "/superadmin";

const NAV_ITEMS: AppNavItem[] = [
  { label: "Inicio", to: `${BASE}/inicio`, Icon: HomeIcon },
  { label: "Usuarios", to: `${BASE}/usuarios`, Icon: UsersIcon },
  { label: "Programas", to: `${BASE}/programas`, Icon: SuperadminCohorteIcon },
  { label: "Semestres", to: `${BASE}/semestres`, Icon: CalendarIcon, iconClassName: "size-6" },
  { label: "Valores globales", to: `${BASE}/valores-globales`, Icon: ValuesIcon },
  { label: "Últimos códigos", to: `${BASE}/ultimos-codigos`, Icon: CodesIcon },
  { label: "Documentos consejo", to: `${BASE}/documentos-consejo`, Icon: CouncilDocumentsIcon },
];

// ── Componente ────────────────────────────────────────────────────────────────

interface SuperadminSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function SuperadminSidebar({ mobileOpen, onClose }: SuperadminSidebarProps) {
  const navigate = useNavigate();
  const session = superadminAuthService.getSession();

  const handleLogout = () => {
    superadminAuthService.logout();
    navigate("/superadmin/login");
  };

  return (
    <AppSidebar
      tema="oscuro"
      title="Administrativo"
      roleLabel="Administrador"
      session={session}
      navItems={NAV_ITEMS}
      onLogout={handleLogout}
      mobileOpen={mobileOpen}
      onClose={onClose}
    />
  );
}
