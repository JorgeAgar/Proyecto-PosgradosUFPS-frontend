import { getCohortesPagos, type CohortePagos } from "../../../services/programa/validacionPagosCohorteService";
import SeleccionCohortes, { type MetricaCohorte, type ProgresoCohorte } from "../components/SeleccionCohortes";
import { TIPOS_PAGO, type TipoPago } from "./tipoPago";

const METRICAS: Record<TipoPago, (c: CohortePagos) => MetricaCohorte[]> = {
  inscripcion: (c) => [
    { etiqueta: "Por pagar", valor: c.totalConfirmados },
    { etiqueta: "Paz y salvo", valor: c.totalPazysalvo, oculta: c.totalPazysalvo === 0 },
  ],
  matricula: (c) => [
    { etiqueta: "Admitidos", valor: c.totalAdmitidos },
    { etiqueta: "Legalizados", valor: c.totalLegalizados },
  ],
};

const PROGRESO: Record<TipoPago, (c: CohortePagos) => ProgresoCohorte> = {
  inscripcion: (c) => ({
    titulo: "A paz y salvo / Total por pagar",
    etiqueta: "A paz y salvo",
    actual: c.totalPazysalvo,
    total: c.totalConfirmados + c.totalPazysalvo,
  }),
  matricula: (c) => ({
    titulo: "Legalizados / Total por legalizar",
    etiqueta: "Legalizados",
    actual: c.totalLegalizados,
    total: c.totalAdmitidos,
  }),
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
      progreso={PROGRESO[tipo]}
    />
  );
}
