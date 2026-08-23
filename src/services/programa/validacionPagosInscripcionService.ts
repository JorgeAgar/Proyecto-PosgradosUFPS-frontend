import { programaApiClient } from './programaService';

export interface PagoInscripcionApi {
  id: number;
  idPago: number;
  idAspirante: number;
  aspirante: string;
  fechavencimiento: string;
  urlrecibo: string;
  urlfactura: string;
  referenciapago: string;
  valorpago: number;
  idEstado: number;
  estado: string;
}

export interface AccionPagoInscripcionResponse {
  id: number;
  idAspirante: number;
  idEstado: number;
  idPagoconcepto: number;
  valorPagoPesos: number;
  aspirante: string;
  estado: string;
  pagoconcepto: {
    id: number;
    tipo: string;
  };
}

export async function obtenerPagosInscripcion(idCohorte: number): Promise<PagoInscripcionApi[]> {
  return programaApiClient.fetch<PagoInscripcionApi[]>(
    `/api/application/case/director-programa/pagos/${idCohorte}/inscripcion`,
    { method: 'GET' },
  );
}

export async function aprobarPagoInscripcion(idRecibo: number): Promise<AccionPagoInscripcionResponse> {
  return programaApiClient.fetch<AccionPagoInscripcionResponse>(
    `/api/application/case/director-programa/pagos/inscripcion/${idRecibo}/aprobar`,
    { method: 'PATCH' },
  );
}

export async function rechazarPagoInscripcion(idRecibo: number): Promise<AccionPagoInscripcionResponse> {
  return programaApiClient.fetch<AccionPagoInscripcionResponse>(
    `/api/application/case/director-programa/pagos/inscripcion/${idRecibo}/estado`,
    { method: 'PATCH' },
  );
}
