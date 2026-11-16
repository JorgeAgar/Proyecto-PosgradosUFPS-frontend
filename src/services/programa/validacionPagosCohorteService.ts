import { programaApiClient, getProgramaRealId } from './programaService';
import { obtenerPagosInscripcion } from './validacionPagosInscripcionService';
import { obtenerPagosMatricula } from './validacionPagosMatriculaService';

/** Resumen de cohorte tal como lo devuelve el backend (`CohorteResumenOutput`). */
interface CohorteResumenApi {
  id: number;
  nombre: string;
  activa: boolean;
  semestre: string;
  cupos: number;
  fechaLimitePago: string;
  fechaLimiteDocs: string;
  fechaLimiteInscripcion: string;
  totalInscritos?: number | null;
  totalPazysalvo?: number | null;
  totalValidados?: number | null;
  totalCalificados?: number | null;
  totalAdmitidos?: number | null;
}

export interface CohortePagos {
  id: number;
  nombre: string;
  activa: boolean;
  semestre: string;
  cupos: number;
  fechaLimitePago: string;
  fechaLimiteDocs: string;
  fechaLimiteInscripcion: string;
  totalInscritos: number;
  totalAdmitidos: number;
  /** Recibos del tipo de pago consultado que están en estado COMPLETADO. */
  totalPagados: number;
  /** Recibos del tipo de pago consultado que aún no están completados. */
  totalPorPagar: number;
}

type TipoPagoCohorte = 'inscripcion' | 'matricula';

const OBTENER_PAGOS: Record<TipoPagoCohorte, (idCohorte: number) => Promise<{ estado: string }[]>> = {
  inscripcion: obtenerPagosInscripcion,
  matricula: obtenerPagosMatricula,
};

const numero = (valor: number | null | undefined) => Number(valor ?? 0) || 0;

/**
 * Cohortes del programa con los conteos de pagos del tipo indicado.
 *
 * El resumen de cohortes del backend no incluye cuántos aspirantes tienen el
 * pago completado (legalizados, paz y salvo) ni cuántos están pendientes, así
 * que esos conteos se calculan a partir de los recibos de cada cohorte.
 */
export async function getCohortesPagos(tipo: TipoPagoCohorte): Promise<CohortePagos[]> {
  const idPrograma = await getProgramaRealId();
  const cohortes = await programaApiClient.fetch<CohorteResumenApi[]>(
    `/api/application/case/director-programa/programa/${idPrograma}/cohortes`
  );

  return Promise.all(
    (cohortes ?? []).map(async (c) => {
      const pagos = await OBTENER_PAGOS[tipo](c.id).catch(() => []);
      const totalPagados = (pagos ?? []).filter(
        (p) => p.estado?.trim().toUpperCase() === 'COMPLETADO'
      ).length;
      return {
        id: c.id,
        nombre: c.nombre,
        activa: c.activa,
        semestre: c.semestre,
        cupos: numero(c.cupos),
        fechaLimitePago: c.fechaLimitePago,
        fechaLimiteDocs: c.fechaLimiteDocs,
        fechaLimiteInscripcion: c.fechaLimiteInscripcion,
        totalInscritos: numero(c.totalInscritos),
        totalAdmitidos: numero(c.totalAdmitidos),
        totalPagados,
        totalPorPagar: (pagos ?? []).length - totalPagados,
      };
    })
  );
}
