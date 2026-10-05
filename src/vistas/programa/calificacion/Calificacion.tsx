import { getCohortesByPrograma } from "../../../services/programa/programaCalificacionService";
import SeleccionCohortes from "../components/SeleccionCohortes";

export default function Calificacion() {
  return (
    <SeleccionCohortes
      titulo="Calificación"
      descripcion="Selecciona una cohorte para gestionar la calificación de sus aspirantes validados."
      cargar={getCohortesByPrograma}
      rutaDetalle={(c) => `/programa/admision/calificacion/cohorte/${c.id}`}
      metricas={(c) => [
        { etiqueta: "Por calificar", valor: c.totalValidados },
        { etiqueta: "Calificados", valor: c.totalCalificados, oculta: c.totalCalificados === 0 },
      ]}
      progreso={(c) => ({
        titulo: "Calificados / Total en calificación",
        etiqueta: "Calificados",
        actual: c.totalCalificados,
        total: c.totalCalificados + c.totalValidados,
      })}
    />
  );
}
