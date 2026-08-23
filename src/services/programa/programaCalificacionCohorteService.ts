import { programaApiClient } from "./programaService";

export interface AspiranteCalificacion {
  id: number;
  nombreCompleto: string;
  idEstado: number;
  estado: string;
  correo: string;
  puntajeTotal: number;
  numerodocumento: number;
}

export async function getAspirantes(idCohorte: number): Promise<AspiranteCalificacion[]> {
  return programaApiClient.fetch<AspiranteCalificacion[]>(
    `/api/application/case/director-programa/calificacion/programa/cohorte/${idCohorte}/aspirante-validados`
  );
}

export async function getCountPorCalificar(idCohorte: number): Promise<number> {
  return programaApiClient.fetch<number>(
    `/api/application/case/director-programa/calificacion/programa/cohorte/${idCohorte}/aspirante-validados/count/por-calificar`
  );
}

export async function getCountCalificados(idCohorte: number): Promise<number> {
  return programaApiClient.fetch<number>(
    `/api/application/case/director-programa/calificacion/programa/cohorte/${idCohorte}/aspirante-validados/count/calificados`
  );
}
