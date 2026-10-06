import { fetchCohortes } from "../../../services/programa/programaCohorteService";
import SeleccionCohortes from "../components/SeleccionCohortes";

export default function Admitidos() {
  return (
    <SeleccionCohortes
      titulo="Admitidos"
      descripcion="Selecciona una cohorte para gestionar la admisión de sus aspirantes calificados."
      cargar={fetchCohortes}
      rutaDetalle={(c) => `/programa/admision/admitidos/cohorte/${c.id}`}
      metricas={(c) => [
        { etiqueta: "Por admitir", valor: c.totalCalificados ?? 0 },
        { etiqueta: "Admitidos", valor: c.totalAdmitidos ?? 0 },
      ]}
      progreso={(c) => ({
        titulo: "Admitidos / Total en admisión",
        etiqueta: "Admitidos",
        actual: c.totalAdmitidos ?? 0,
        total: (c.totalAdmitidos ?? 0) + (c.totalCalificados ?? 0),
      })}
    />
  );
}
