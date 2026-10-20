/*
  programaCriteriosService.ts
  Servicio de criterios de evaluación para la cohorte actual del programa.
  - Base URL: VITE_API_URL
*/

import { programaApiClient, getProgramaRealId } from './programaService';

export interface CohorteActualResumen {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface CriterioEvaluacion {
  id: number;
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

export async function updateCriterioPrograma(criterioId: number, payload: CriterioPayload): Promise<CriterioEvaluacion> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/criterios/${criterioId}`;
  return programaApiClient.fetch<CriterioEvaluacion>(path, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteCriterioPrograma(criterioId: number): Promise<{ success: boolean }> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/criterios/${criterioId}`;
  await programaApiClient.fetch<void>(path, { method: 'DELETE' });
  return { success: true };
}

export async function updateCriterio(
  cohorteId: string,
  criterioId: number,
  payload: CriterioPayload,
): Promise<CriterioEvaluacion> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/cohorte/${cohorteId}/criterios/${criterioId}`;
  return programaApiClient.fetch<CriterioEvaluacion>(path, { method: 'PUT', body: JSON.stringify(payload) });
}
