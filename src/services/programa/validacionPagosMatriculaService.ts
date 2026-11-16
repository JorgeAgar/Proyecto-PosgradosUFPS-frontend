import { programaApiClient } from './programaService';
import { obtenerPagosPorCohorte, type PagoReciboDirector } from './validacionPagosService';

export type PagoMatriculaApi = PagoReciboDirector;

export interface AccionPagoMatriculaAprobarResponse {
  id: number;
  idAspirante: number;
  idEstado: number;
  idPagoconcepto: number;
  valorPagoPesos: number;
  aspirante: unknown;
  estado: unknown;
  pagoconcepto: {
    id: number;
    tipo: string;
  };
}

export async function obtenerPagosMatricula(idCohorte: number): Promise<PagoMatriculaApi[]> {
  return obtenerPagosPorCohorte('matricula', idCohorte);
}

export async function aprobarPagoMatricula(idRecibo: number): Promise<AccionPagoMatriculaAprobarResponse> {
  return programaApiClient.fetch<AccionPagoMatriculaAprobarResponse>(
    `/api/application/case/director-programa/pagos/matricula/${idRecibo}/aprobar`,
    { method: 'PATCH' },
  );
}

export async function rechazarPagoMatricula(idRecibo: number): Promise<PagoMatriculaApi> {
  return programaApiClient.fetch<PagoMatriculaApi>(
    `/api/application/case/director-programa/pagos/matricula/${idRecibo}/estado`,
    { method: 'PATCH' },
  );
}
