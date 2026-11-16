/*
  programaInicioService.ts
  Servicio para el dashboard de inicio del módulo Programa.
  - Usa VITE_API_URL desde .env.
  - Endpoint real: GET /api/application/case/director-programa/programa/{programaId}/inicio
  - Devuelve una lista de cohortes activas/relacionadas al programa.
*/

import { programaApiClient, getProgramaRealId } from './programaService';

export interface CohorteActual {
  id: number;
  nombre: string;
  activa: boolean;
  fechaLimiteDocumentos: string;
  fechaLimitePago: string;
  // Plazos completos (inicio y fin) de documentación, inscripción y pago.
  fechaInicioDocumentacion?: string;
  fechaFinDocumentacion?: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  fechaInicioPago?: string;
  fechaFinPago?: string;
}

/**
 * Totales tal como los envía el backend. Salvo `totalInscritos` (total fijo),
 * cada total cuenta solo a los aspirantes que están actualmente en esa etapa.
 */
export interface ProgramaInicioData {
  cohorteActual: CohorteActual;
  totalInscritos: number;
  totalPazysalvo: number;
  totalValidados: number;
  totalCalificados: number;
  totalAdmitidos: number;
}

export type ProgramaInicioItem = ProgramaInicioData;

/**
 * Embudo acumulado: cada etapa incluye a los aspirantes que ya pasaron a
 * etapas posteriores (un admitido ya fue calificado, validado y está a paz y salvo).
 */
export interface EmbudoAspirantes {
  inscritos: number;
  pazYSalvo: number;
  validados: number;
  calificados: number;
  admitidos: number;
}

export function calcularEmbudo(item: ProgramaInicioData): EmbudoAspirantes {
  const admitidos = item.totalAdmitidos;
  const calificados = item.totalCalificados + admitidos;
  const validados = item.totalValidados + calificados;
  const pazYSalvo = item.totalPazysalvo + validados;
  return {
    inscritos: item.totalInscritos,
    pazYSalvo,
    validados,
    calificados,
    admitidos,
  };
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toProgramaInicioData(value: unknown): ProgramaInicioData | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (!item.cohorteActual || typeof item.cohorteActual !== 'object') return null;
  return {
    cohorteActual: item.cohorteActual as CohorteActual,
    totalInscritos: toNumber(item.totalInscritos),
    totalPazysalvo: toNumber(item.totalPazysalvo),
    totalValidados: toNumber(item.totalValidados),
    totalCalificados: toNumber(item.totalCalificados),
    totalAdmitidos: toNumber(item.totalAdmitidos),
  };
}

function normalizarLista(values: unknown[]): ProgramaInicioData[] {
  return values
    .map(toProgramaInicioData)
    .filter((item): item is ProgramaInicioData => item !== null);
}

function normalizeProgramaInicioResponse(response: unknown): ProgramaInicioData[] {
  if (Array.isArray(response)) return normalizarLista(response);

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.items)) return normalizarLista(record.items);
    if (Array.isArray(record.cohortes)) return normalizarLista(record.cohortes);
    const single = toProgramaInicioData(response);
    if (single) return [single];
  }

  return [];
}

/**
 * Obtiene la data del inicio de Programa.
 */
export async function fetchProgramaInicioData(): Promise<ProgramaInicioData[]> {
  const programaId = await getProgramaRealId();
  const inicioPath = `/api/application/case/director-programa/programa/${programaId}/inicio`;
  const response = await programaApiClient.fetch<unknown>(inicioPath, {
    method: 'GET',
  });
  return normalizeProgramaInicioResponse(response);
}

/*
  Contrato del backend:

  GET /api/application/case/director-programa/programa/{programaId}/inicio
  Respuesta (una entrada por cohorte):
  [
    {
      "cohorteActual": {
        "id": 8,
        "nombre": "Cohorte 2027-2",
        "activa": true,
        "fechaLimiteDocumentos": "2027-07-31",
        "fechaLimitePago": "2027-07-31",
        "fechaInicioDocumentacion": "2027-07-01",
        "fechaFinDocumentacion": "2027-07-31",
        "fechaInicioInscripcion": "2027-07-01",
        "fechaFinInscripcion": "2027-07-31",
        "fechaInicioPago": "2027-07-01",
        "fechaFinPago": "2027-07-31"
      },
      "totalInscritos": 3,
      "totalPazysalvo": 0,
      "totalValidados": 0,
      "totalCalificados": 0,
      "totalAdmitidos": 1
    }
  ]

  Etapas (en orden): paz y salvo (pagó inscripción) → validados (documentos
  aprobados) → calificados (notas en criterios) → admitidos. Cada total cuenta
  solo la etapa actual; el frontend acumula hacia atrás con `calcularEmbudo`.
*/
