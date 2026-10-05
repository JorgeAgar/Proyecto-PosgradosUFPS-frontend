import { obtenerCohortesPorPrograma } from "../../../services/programa/validacionService";
import SeleccionCohortes from "../components/SeleccionCohortes";

export default function ValidacionDocumentos() {
	return (
		<SeleccionCohortes
			titulo="Validación de documentos"
			descripcion="Selecciona una cohorte para validar los documentos de sus aspirantes."
			cargar={obtenerCohortesPorPrograma}
			mensajeError="No se pudieron cargar las cohortes para validación."
			rutaDetalle={(c) => `/programa/validacion/cohorte/${c.id}`}
			metricas={(c) => [
				{ etiqueta: "Por validar", valor: c.totalPazysalvo },
				{ etiqueta: "Validados", valor: c.totalValidados, oculta: c.totalValidados === 0 },
			]}
			extra={(c) => (
				<div className="text-sm mb-3">
					<span className="text-neutral-400">Fecha límite: </span>
					<span className="font-semibold text-gray-800">{c.fechaLimiteDocs}</span>
				</div>
			)}
			progreso={(c) => ({
				titulo: "Validados / Total en validación",
				etiqueta: "Validados",
				actual: c.totalValidados,
				total: c.totalPazysalvo + c.totalValidados,
			})}
		/>
	);
}
