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

export async function obtenerAspirantesPorCohorte(idCohorte: number): Promise<AspiranteValidacionApi[]> {
  return programaApiClient.fetch<AspiranteValidacionApi[]>(
    `/api/application/case/director-programa/cohorte/${idCohorte}/aspirantes-a-validar`
  );
}
