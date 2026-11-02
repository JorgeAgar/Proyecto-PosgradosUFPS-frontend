import { programaApiClient } from './programaService';

export interface AspiranteValidacionApi {
  id: number;
  nombre: string;
  cedula: string;
  correo: string;
  documentosValidados: number;
  totalDocumentos: number;
  estadoGeneral: string;
}

/** Forma en que Spring serializa un Page<T>. */
export interface PaginaApi<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

/** `pagina` empieza en 1, como en `Paginacion`; el backend cuenta desde 0. */
export async function obtenerAspirantesPorCohorte(
  idCohorte: number,
  pagina: number,
  tamano: number,
): Promise<PaginaApi<AspiranteValidacionApi>> {
  return programaApiClient.fetch<PaginaApi<AspiranteValidacionApi>>(
    `/api/application/case/director-programa/cohorte/${idCohorte}/aspirantes-a-validar?page=${pagina - 1}&size=${tamano}`
  );
}
