/*
  programaCriteriosService.ts
  Servicio de criterios de evaluación para la cohorte actual del programa.
  - Base URL: VITE_API_URL
  - Fallback mock en entorno de desarrollo
  - Contrato pensado para reemplazarse por backend real
*/

import { programaApiClient, getProgramaRealId } from './programaService';

export interface CohorteActualResumen {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface CriterioEvaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
}

export interface CriteriosCohorteActualResponse {
  cohorteActual: CohorteActualResumen;
  criterios: CriterioEvaluacion[];
}

export interface CriterioPayload {
  nombre: string;
  descripcion: string;
  peso: number;
}

// NOTE: Removed mock response for fetchCriteriosCohorteActual — backend should provide real data.

export async function fetchCriteriosPrograma(): Promise<CriterioEvaluacion[]> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/criterios`;
  return programaApiClient.fetch<CriterioEvaluacion[]>(path, { method: 'GET' });
}

export async function createCriterioPrograma(payload: CriterioPayload): Promise<CriterioEvaluacion> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/criterios`;
  return programaApiClient.fetch<CriterioEvaluacion>(path, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCriterioPrograma(criterioId: string, payload: CriterioPayload): Promise<CriterioEvaluacion> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/criterios/${criterioId}`;
  return programaApiClient.fetch<CriterioEvaluacion>(path, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteCriterioPrograma(criterioId: string): Promise<{ success: boolean }> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/criterios/${criterioId}`;
  await programaApiClient.fetch<void>(path, { method: 'DELETE' });
  return { success: true };
}

export async function updateCriterio(
  cohorteId: string,
  criterioId: string,
  payload: CriterioPayload,
): Promise<CriterioEvaluacion> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/cohorte/${cohorteId}/criterios/${criterioId}`;
  return programaApiClient.fetch<CriterioEvaluacion>(path, { method: 'PUT', body: JSON.stringify(payload) });
}

/*
  ============================================================================
  CONTRATO BACKEND REQUERIDO (JSON + ENDPOINTS)
  ============================================================================

  Headers comunes:
  - Authorization: Bearer <token>
  - Content-Type: application/json

  Error recomendado:
  {
    "success": false,
    "message": "Descripcion legible",
    "errorCode": "CRITERIOS_INVALID_TOTAL",
    "details": { "total": 95 }
  }

  1) GET /api/dev/endpoint/programa/:programaId/cohorte-actual/criterios
     200 OK:
     {
       "cohorteActual": {
         "id": "coh-actual-1",
         "nombre": "Cohorte-3 2025-1",
         "activa": true
       },
       "criterios": [
         {
           "id": "1",
           "nombre": "Promedio academico de pregrado",
           "descripcion": "Evaluacion del rendimiento academico durante la carrera de pregrado",
           "peso": 25
         }
       ]
     }

  2) POST /api/dev/endpoint/programa/:programaId/cohorte/:cohorteId/criterios
     Body:
     {
       "nombre": "Entrevista",
       "descripcion": "Desempenio del aspirante en entrevista",
       "peso": 10
     }
     201 Created:
     {
       "id": "7",
       "nombre": "Entrevista",
       "descripcion": "Desempenio del aspirante en entrevista",
       "peso": 10
     }

  3) PUT /api/dev/endpoint/programa/:programaId/cohorte/:cohorteId/criterios/:criterioId
     Body:
     {
       "nombre": "Entrevista",
       "descripcion": "Entrevista con comite curricular",
       "peso": 12
     }
     200 OK:
     {
       "id": "7",
       "nombre": "Entrevista",
       "descripcion": "Entrevista con comite curricular",
       "peso": 12
     }

  4) DELETE /api/application/case/director-programa/programa/:programaId/cohorte/:cohorteId/criterios/:criterioId
     200 OK:
     { "success": true }

  5) POST /api/dev/endpoint/programa/:programaId/cohorte/:cohorteId/criterios/save
     Body:
     {
       "criterios": [
         { "id": "1", "nombre": "...", "descripcion": "...", "peso": 25 }
       ]
     }
     200 OK:
     { "success": true }

  Regla de negocio obligatoria:
  - La suma total de pesos debe ser exactamente 100 al guardar.
  - Si no cumple, responder 409 o 422 con mensaje claro.
*/

export default {
  updateCriterio,
  fetchCriteriosPrograma,
  createCriterioPrograma,
  updateCriterioPrograma,
  deleteCriterioPrograma,
};
