import { Outlet, Navigate } from "react-router";
import SidebarDirectorPrograma from "../vistas/programa/components/Sidebar";
import { programaAuthService } from "../services/programa/programaService";
import PanelLayout, { useNotificaciones, type NotificacionesContext } from "./PanelLayout";

export type ProgramaOutletContext = NotificacionesContext;

export default function ProgramaLayout() {
  const { mostrarAlerta, mostrarConfirm, notificaciones } = useNotificaciones();

  const session = programaAuthService.getSession();
  if (!session) {
    return <Navigate to="/programa/login" replace />;
  }

  return (
    <PanelLayout
      notificaciones={notificaciones}
      sidebar={(props) => <SidebarDirectorPrograma {...props} />}
      titulo="Sistema de Posgrados"
    >
      <Outlet context={{ mostrarAlerta, mostrarConfirm } satisfies ProgramaOutletContext} />
    </PanelLayout>
  );
}
