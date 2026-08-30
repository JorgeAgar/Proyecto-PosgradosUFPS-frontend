import { useNavigate } from "react-router";
import AppSidebar, { type AppNavItem } from "../../../components/AppSidebar";
import { aspiranteAuthService } from "../../../services/aspirante/aspiranteService";
import { CheckCircleIcon as StatusIcon, DocumentsIcon, HomeIcon, PaymentCardIcon, StarIcon, TestIcon, UsersIcon as InterviewIcon } from "../../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── Navegación ────────────────────────────────────────────────────────────────

const NAV_ITEMS: AppNavItem[] = [
  { label: "Inicio",               to: "/aspirante/inicio",     Icon: HomeIcon },
  { label: "Estado del aspirante", to: "/aspirante/estado",     Icon: StatusIcon },
  { label: "Pagos",                to: "/aspirante/pagos",      Icon: PaymentCardIcon },
  { label: "Documentos",           to: "/aspirante/documentos", Icon: DocumentsIcon },
  { label: "Entrevista",           to: "/aspirante/entrevista", Icon: InterviewIcon },
  { label: "Prueba",               to: "/aspirante/prueba",     Icon: TestIcon },
  { label: "Criterios",            to: "/aspirante/criterios",  Icon: StarIcon },
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
