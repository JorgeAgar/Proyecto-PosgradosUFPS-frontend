import { aspiranteApiClient, aspiranteApiUploadFile } from './aspiranteService';
import type { ResumenPagoResponse, WompiCheckoutResponse } from './aspirantePagosService';

export interface MatriculaReciboResponse {
  paymentId: number;
  aspiranteId: number;
  personaId: number;
  cohorteId: number;
  pagoconceptoId: number;
  concepto: string;
  reference: string;
  amount: number;
  amountInCents: number;
  currency: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  legalId: string;
  legalIdType: string;
}

export async function fetchMatriculaResumen(aspiranteId: string): Promise<ResumenPagoResponse> {
  return aspiranteApiClient.fetch<ResumenPagoResponse>(
    `/api/application/case/aspirantes/${aspiranteId}/pagos/matricula/resumen`
  );
}

export async function fetchMatriculaCheckout(aspiranteId: string, montoElegido: number): Promise<WompiCheckoutResponse> {
  return aspiranteApiClient.fetch<WompiCheckoutResponse>(
    `/api/application/case/aspirantes/${aspiranteId}/pagos/matricula/checkout?montoelegido=${montoElegido}`,
    { method: 'POST' }
  );
}

export async function uploadMatriculaFactura(aspiranteId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  return aspiranteApiUploadFile<void>(
    `/api/application/case/aspirantes/${aspiranteId}/pagos/matricula/factura`,
    formData
  );
}

export async function patchMatriculaFactura(aspiranteId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  return aspiranteApiUploadFile<void>(
    `/api/application/case/aspirantes/${aspiranteId}/pagos/matricula/factura`,
    formData,
    false,
    'PATCH'
  );
}
