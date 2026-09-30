import { Outlet, Navigate } from "react-router";
import SuperadminSidebar from "../vistas/superadmin/components/Sidebar";
import ufpsLogo from "../assets/NEGROufps.png";
import { superadminAuthService } from "../services/superadmin/superadminService";
import PanelLayout, { useNotificaciones, type NotificacionesContext } from "./PanelLayout";

export type SuperadminOutletContext = NotificacionesContext;

export default function SuperadminLayout() {
  const { mostrarAlerta, mostrarConfirm, notificaciones } = useNotificaciones();

  const session = superadminAuthService.getSession();
  if (!session) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return (
    <PanelLayout
      notificaciones={notificaciones}
      sidebar={(props) => <SuperadminSidebar {...props} />}
      titulo="Administrativo"
      logo={ufpsLogo}
      tema="oscuro"
    >
      <Outlet context={{ mostrarAlerta, mostrarConfirm } satisfies SuperadminOutletContext} />
    </PanelLayout>
  );
}
