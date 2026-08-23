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
  fechaLimiteDocumentos: string; // formato DD/MM/YYYY para UI
  fechaLimitePago: string; // formato DD/MM/YYYY para UI
}

export interface ValidacionStats {
  totalInscritos: number;
  aspirantesValidados: number;
}

export interface CalificacionStats {
  totalValidados: number;
  aspirantesCalificados: number;
}

export interface ProgramaInicioData {
  cohorteActual: CohorteActual;
  validacion: ValidacionStats;
  calificacion: CalificacionStats;
}

export type ProgramaInicioItem = ProgramaInicioData;

// NOTE: Removed MOCK fallback data — service now delegates to backend and
// relies on `programaApiClient` (which adds auth headers and refresh logic).

function isProgramaInicioData(value: unknown): value is ProgramaInicioData {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return Boolean(item.cohorteActual && item.validacion && item.calificacion);
}

function normalizeProgramaInicioResponse(response: unknown): ProgramaInicioData[] {
  if (Array.isArray(response)) {
    return response.filter(isProgramaInicioData);
  }

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items.filter(isProgramaInicioData);
    if (Array.isArray(record.cohortes)) return record.cohortes.filter(isProgramaInicioData);
    if (isProgramaInicioData(response)) return [response];
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

export default {
  fetchProgramaInicioData,
};

/*
  Requisitos de backend para que esta vista funcione:

  1) GET /api/dev/endpoint/programa/:programaId/inicio
     Respuesta sugerida:
     {
       "cohorteActual": {
         "id": 3,
         "nombre": "Cohorte-3 2025-1",
         "activa": true,
         "fechaLimiteDocumentos": "2026-05-15",
         "fechaLimitePago": "2026-05-20"
       },
       "validacion": {
         "totalInscritos": 45,
         "aspirantesValidados": 6
       },
       "calificacion": {
         "totalValidados": 6,
         "aspirantesCalificados": 2
       }
     }

  Notas backend:
  - Idealmente devolver fechas ISO y en frontend formatearlas. En este mock se usa DD/MM/YYYY para simplicidad.
  - Validar autenticación por token y permisos de programa.
  - Recomendado incluir `programaId` derivado del token para evitar fuga entre programas.
  - Manejar errores con códigos claros: 401, 403, 404, 500.
*/
