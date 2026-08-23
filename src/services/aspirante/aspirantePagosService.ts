import { aspiranteApiClient } from './aspiranteService';

export type PagoEstado = 'pendiente' | 'pagado';

export interface BackendPagoConcepto {
  id: number;
  tipo: string;
}

export interface BackendPagoItem {
  id: number;
  idAspirante: number;
  idEstado: number;
  idPagoconcepto: number;
  aspirante: string;
  estado: string;
  valorPagoPesos?: number | null;
  pagoconcepto: BackendPagoConcepto;
}

export interface PaymentSummary {
  id: string;
  title: string;
  description: string;
  valor: number;
  estado: PagoEstado;
  enabled: boolean;
  icon?: 'document' | 'lock';
}

export interface PaymentReceipt {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  amount: number;
  currency: string;
  pdfUrl?: string;
}

export interface WompiCheckoutResponse {
  paymentId: number;
  aspiranteId: number;
  pagoconceptoId: number;
  concepto: string;
  reference: string;
  amount: number;
  amountInCents: number;
  currency: string;
  publicKey: string;
  signatureIntegrity: string;
  redirectUrl: string | null;
  widgetScriptUrl: string;
  checkoutUrl: string;
  simulated: boolean;
  message: string;
  transactionId: string;
  customerEmail: string | null;
  creationDate?: string;
  pagoreciboinscripcion?: {
    id?: number;
    fechavencimiento?: string;
    urlrecibo?: string;
    urlfactura?: string | null;
    referenciapago?: string;
    valorpago?: number;
    idEstado?: number;
    idPago?: number;
  };
}

export interface ResumenPagoResponse {
  programa: string;
  periodo: string;
  aspirante: string;
  documento: string;
  facultad: string;
  tipo: string;
  valor: number;
  valormatricula?: number;
  valorminimo?: number;
  urlrecibo: string | null;
  urlfactura: string | null;
  estado: string;
}

function normalizePagoEstado(estado: string): PagoEstado {
  const norm = (estado ?? '').trim().toUpperCase();
  return norm === 'REALIZADO' ? 'pagado' : 'pendiente';
}

function formatPagoConcepto(tipo: string | undefined): string {
  if (!tipo) return 'Pago';
  const normalized = tipo.trim().toUpperCase();
  if (normalized === 'INSCRIPCION') return 'Inscripción';
  if (normalized === 'MATRICULA') return 'Matrícula';
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export async function fetchPayments(aspiranteId: string): Promise<PaymentSummary[]> {
  const pagos = await aspiranteApiClient.fetch<BackendPagoItem[]>(
    `/api/application/case/aspirantes/${aspiranteId}/pagos`
  );
  return pagos.map((pago) => ({
    id: String(pago.id),
    title: formatPagoConcepto(pago.pagoconcepto?.tipo),
    description: '',
    valor: Number(pago.valorPagoPesos ?? 0) || 0,
    estado: normalizePagoEstado(pago.estado),
    enabled: true,
    icon: 'document',
  }));
}
