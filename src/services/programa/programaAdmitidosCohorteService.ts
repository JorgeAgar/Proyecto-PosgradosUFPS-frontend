/*
  programaAdmitidosCohorteService.ts
  Servicio para la pantalla de admisión de aspirantes dentro de una cohorte.
  - Usa VITE_API_URL
  - Usa el backend real
*/

import { programaApiClient } from './programaService';
import type { FiltroAdmision, CohorteAdmitidosResumen, AspiranteRankingItem, AdmitidosRankingResponse } from './programaAdmitidosService';
import { normalizeRankingResponse } from './programaAdmitidosService';

export type { FiltroAdmision, CohorteAdmitidosResumen, AspiranteRankingItem, AdmitidosRankingResponse };


export async function fetchRankingAdmitidosByCohorte(cohorteId: string): Promise<AdmitidosRankingResponse> {
  const url = `/api/application/case/director-programa/cohorte/${cohorteId}/admitidos/ranking`;
  const data = await programaApiClient.fetch<unknown>(url, { method: 'GET' });
  return normalizeRankingResponse(data);
}

export async function admitirAspirante(cohorteId: string, aspiranteId: string): Promise<{ success: boolean; aspiranteId: string; admitido: boolean }> {
  const url = `/api/application/case/director-programa/cohorte/${cohorteId}/admitidos/${aspiranteId}`;
  return programaApiClient.fetch<{ success: boolean; aspiranteId: string; admitido: boolean }>(url, {
    method: 'POST',
    body: JSON.stringify({ admitido: true }),
  });
}

export async function revertirAdmision(cohorteId: string, aspiranteId: string): Promise<{ success: boolean; aspiranteId: string; admitido: boolean }> {
  const url = `/api/application/case/director-programa/cohorte/${cohorteId}/admitidos/${aspiranteId}`;
  return programaApiClient.fetch<{ success: boolean; aspiranteId: string; admitido: boolean }>(url, {
    method: 'POST',
    body: JSON.stringify({ admitido: false }),
  });
}

export async function finalizarProcesoAdmision(cohorteId: string): Promise<void> {
  const url = `/api/application/case/director-programa/cohorte/${cohorteId}/admitidos/finalize`;
  await programaApiClient.fetch<void>(url, {
    method: 'POST',
  });
}

export async function estaFinalizadoProcesoAdmision(cohorteId: string): Promise<boolean> {
  const url = `/api/application/case/director-programa/admitidos/exists/cohorte/${cohorteId}`;
  return programaApiClient.fetch<boolean>(url, {
    method: 'GET',
  });
}

export async function downloadAdmittedListPdf(cohorteId: string): Promise<Blob> {
  const token = localStorage.getItem("ufps_programa_access_token");
  const url = `${import.meta.env.VITE_API_URL}/api/application/case/director-programa/${cohorteId}/generateAdmittedList`;

  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Error al generar el PDF de admitidos (${res.status})`);
  }

  return res.blob();
}

export default {
  fetchRankingAdmitidosByCohorte,
  admitirAspirante,
  revertirAdmision,
  finalizarProcesoAdmision,
  estaFinalizadoProcesoAdmision,
  downloadAdmittedListPdf,
};
