import { programaApiClient, getProgramaRealId } from './programaService';

/** PagoreciboDirectorOutput; las URLs pueden faltar antes de generar/subir el archivo. */
export interface PagoReciboDirector {
  id: number;
  idPago: number;
  idAspirante: number;
  aspirante: string;
  fechavencimiento: string;
  urlrecibo: string | null;
  urlfactura: string | null;
  referenciapago: string;
  valorpago: number;
  idEstado: number;
  estado: string;
}

type PaginaPagos = { content: PagoReciboDirector[]; totalPages: number };
type RespuestaPagos = PagoReciboDirector[] | PaginaPagos;

/** El backend lista por programa; la cohorte se filtra con sus aspirantes publicados. */
export async function obtenerPagosPorCohorte(tipo: 'inscripcion' | 'matricula', idCohorte: number): Promise<PagoReciboDirector[]> {
  const idPrograma = await getProgramaRealId();
  const aspirantes = await programaApiClient.fetch<{ id: number }[]>(
    `/api/application/case/cohortes/${idCohorte}/aspirantes`,
  );
  const ids = new Set(aspirantes.map((aspirante) => aspirante.id));
  const pagos: PagoReciboDirector[] = [];
  let page = 0;
  let totalPages = 1;
  do {
    const response = await programaApiClient.fetch<RespuestaPagos>(
      `/api/application/case/director-programa/pagos/${tipo}?idPrograma=${idPrograma}&page=${page}&size=100`,
    );
    if (Array.isArray(response)) {
      pagos.push(...response);
      break;
    }
    if (!Array.isArray(response.content) || !Number.isInteger(response.totalPages)) {
      throw new Error('No se pudo interpretar el listado de pagos.');
    }
    pagos.push(...response.content);
    totalPages = response.totalPages;
    page++;
  } while (page < totalPages);
  return pagos.filter((pago) => ids.has(pago.idAspirante));
}
