import { getCohortesPagos, type CohortePagos } from "../../../services/programa/validacionPagosCohorteService";
import SeleccionCohortes, { type MetricaCohorte } from "../components/SeleccionCohortes";
import { TIPOS_PAGO, type TipoPago } from "./tipoPago";

const METRICAS: Record<TipoPago, (c: CohortePagos) => MetricaCohorte[]> = {
  inscripcion: (c) => [
    { etiqueta: "Paz y salvo", valor: c.totalPazysalvo, oculta: c.totalPazysalvo === 0 },
  ],
  matricula: (c) => [
    { etiqueta: "Admitidos", valor: c.totalAdmitidos },
  ],
};

export default function ValidacionCohortesPagos({ tipo }: { tipo: TipoPago }) {
  const { nombre, ruta } = TIPOS_PAGO[tipo];
  return (
    <SeleccionCohortes
      titulo="Validación de Pagos"
      subtitulo={`${nombre} — Cohortes`}
      descripcion={`Selecciona una cohorte para gestionar la validación de pagos de ${nombre.toLowerCase()}.`}
      cargar={getCohortesPagos}
      rutaDetalle={(c) => `${ruta}/cohorte/${c.id}`}
      metricas={METRICAS[tipo]}
    />
  );
}
