/*
  programaCohorteDetalleService.ts
  Servicio para el detalle y modificación de cohortes individuales del módulo Programa.
  - Usa VITE_API_URL del .env
  - Endpoints del backend real
*/

import { programaApiClient } from './programaService';
import { normalizeCohorte, type AspiranteItem, type CohorteItem, type CohorteDetalle, type NuevaCohortePayload, type EditarCohortePayload, type DocumentoCohorte, type DocumentAssignItem, type CriterioItem } from './programaCohorteService';

export type { CohorteItem, CohorteDetalle, NuevaCohortePayload, DocumentoCohorte, DocumentAssignItem, CriterioItem };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function mapAspirantes(value: unknown): AspiranteItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: String(item.id ?? ''),
      nombre: String(item.nombre ?? ''),
      cedula: String(item.cedula ?? ''),
      correo: String(item.correo ?? ''),
    };
  });
}

function mapDocumentosAsignados(value: unknown): DocumentAssignItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: Number(item.id ?? 0),
      idDocrequisito: Number(item.idDocrequisito ?? 0),
      idCohorte: Number(item.idCohorte ?? 0),
      nombre: typeof item.nombre === 'string' ? item.nombre : undefined,
    };
  });
}

export async function fetchCohorteDetalle(cohorteId: string): Promise<CohorteDetalle> {
  const path = `/api/application/case/director-programa/cohorte/${cohorteId}`;
  const cohorte = await programaApiClient.fetch<Record<string, unknown>>(path, { method: 'GET' });
  const base = normalizeCohorte(cohorte);
  return {
    ...base,
    id: base.id || cohorteId,
    // En el detalle, si el backend no envía calificados se usa el total de validados.
    totalCalificados: Number(cohorte.totalCalificados ?? cohorte.totalValidados ?? 0),
    documentos: base.documentos ?? [],
    criterios: Array.isArray(cohorte.criterios)
      ? cohorte.criterios.map((crit) => {
          const criterio = crit as Record<string, unknown>;
          return {
            id: criterio.id !== undefined ? criterio.id as string | number : undefined,
            idCriterioevaluacion: criterio.idCriterioevaluacion !== undefined ? criterio.idCriterioevaluacion as string | number : undefined,
            nombre: String(criterio.nombre ?? ''),
            peso: Number(criterio.peso ?? 0),
          };
        })
      : [],
    inscritosData: mapAspirantes(cohorte.inscritosData),
    admitidosData: mapAspirantes(cohorte.admitidosData),
    documentosAsignados: isObject(cohorte.documentosAsignados)
      ? {
          documentosConsejo: mapDocumentosAsignados(cohorte.documentosAsignados.documentosConsejo),
          documentosPrograma: mapDocumentosAsignados(cohorte.documentosAsignados.documentosPrograma),
        }
      : undefined,
  };
}

export async function updateCohorte(cohorteId: string, payload: EditarCohortePayload): Promise<CohorteItem> {
  // El PUT exige el id de cada asociación; el POST solo necesita idCriterio y peso.
  // Consultar las asociaciones existentes permite reintentar tras un fallo parcial.
  const base = `/api/application/case/director-programa/cohorte/${cohorteId}`;
  const asignados = await programaApiClient.fetch<{ id: number; idCriterio: number }[]>(`${base}/criteriocohorte`);
  const criteriosCohorte: { id: number; idCriterio: number; pesoSnapshot?: number }[] = [];
  for (const criterio of payload.criteriosCohorte) {
    let id = criterio.id ?? asignados.find((item) => item.idCriterio === criterio.idCriterio)?.id;
    if (id === undefined) {
      const creado = await programaApiClient.fetch<{ id: number }>(`${base}/criteriocohorte`, {
        method: 'POST',
        // La cohorte puede sumar ya 100: reservar la asociación con peso 0
        // y aplicar todos los pesos juntos en el PUT.
        body: JSON.stringify({ idCriterio: criterio.idCriterio, pesoSnapshot: 0 }),
      });
      id = creado.id;
    }
    criteriosCohorte.push({ ...criterio, id });
  }
  const data = await programaApiClient.fetch<Record<string, unknown>>(base, {
    method: 'PUT', body: JSON.stringify({ ...payload, id: Number(cohorteId), criteriosCohorte }),
  });
  return normalizeCohorte(data);
}

export async function abrirCohorte(cohorteId: string): Promise<CohorteItem> {
  const data = await programaApiClient.fetch<Record<string, unknown>>(
    `/api/application/case/director-programa/cohorte/${cohorteId}/abrir`, { method: 'POST' },
  );
  return normalizeCohorte(data);
}

export async function cerrarCohorte(cohorteId: string): Promise<CohorteItem> {
  const data = await programaApiClient.fetch<Record<string, unknown>>(
    `/api/application/case/director-programa/cohorte/${cohorteId}/cerrar`, { method: 'POST' },
  );
  return normalizeCohorte(data);
}
