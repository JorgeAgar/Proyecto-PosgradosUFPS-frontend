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
interface PaginaApi<T> {
  content: T[];
  totalElements: number;
}

/** Tamaño de página alto para traer toda la cohorte; la vista pagina y calcula estadísticas en el cliente. */
const TAMANO_MAXIMO = 1000;

export async function obtenerAspirantesPorCohorte(idCohorte: number): Promise<AspiranteValidacionApi[]> {
  const respuesta = await programaApiClient.fetch<PaginaApi<AspiranteValidacionApi> | AspiranteValidacionApi[]>(
    `/api/application/case/director-programa/cohorte/${idCohorte}/aspirantes-a-validar?page=0&size=${TAMANO_MAXIMO}`
  );

  if (Array.isArray(respuesta)) return respuesta;
  return Array.isArray(respuesta?.content) ? respuesta.content : [];
}
