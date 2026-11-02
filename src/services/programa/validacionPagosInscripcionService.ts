import { programaApiClient } from './programaService';
import { obtenerPagosPorCohorte, type PagoReciboDirector } from './validacionPagosService';

export type PagoInscripcionApi = PagoReciboDirector;

export interface AccionPagoInscripcionResponse {
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

export async function obtenerPagosInscripcion(idCohorte: number): Promise<PagoInscripcionApi[]> {
  return obtenerPagosPorCohorte('inscripcion', idCohorte);
}

export async function aprobarPagoInscripcion(idRecibo: number): Promise<AccionPagoInscripcionResponse> {
  return programaApiClient.fetch<AccionPagoInscripcionResponse>(
    `/api/application/case/director-programa/pagos/inscripcion/${idRecibo}/aprobar`,
    { method: 'PATCH' },
  );
}

export async function rechazarPagoInscripcion(idRecibo: number): Promise<PagoReciboDirector> {
  return programaApiClient.fetch<PagoReciboDirector>(
    `/api/application/case/director-programa/pagos/inscripcion/${idRecibo}/estado`,
    { method: 'PATCH' },
  );
}
