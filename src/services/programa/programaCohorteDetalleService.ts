/*
  programaCohorteDetalleService.ts
  Servicio para el detalle y modificación de cohortes individuales del módulo Programa.
  - Usa VITE_API_URL del .env
  - Endpoints del backend real
*/

import { programaApiClient } from './programaService';
import type { CohorteItem, CohorteDetalle, NuevaCohortePayload, DocumentoCohorte, DocumentAssignItem, CriterioItem } from './programaCohorteService';

export type { CohorteItem, CohorteDetalle, NuevaCohortePayload, DocumentoCohorte, DocumentAssignItem, CriterioItem };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export async function fetchCohorteDetalle(cohorteId: string): Promise<CohorteDetalle> {
  const path = `/api/application/case/director-programa/cohorte/${cohorteId}`;
  const data = await programaApiClient.fetch<unknown>(path, { method: 'GET' });
  const cohorte = data as Record<string, unknown>;
  const nombreSemestre = String(
    cohorte.nombreSemestre ??
      (isObject(cohorte.semestre)
        ? (cohorte.semestre as Record<string, unknown>).nombreSemestre ??
          (cohorte.semestre as Record<string, unknown>).nombre ??
          ''
        : cohorte.semestre ?? '')
  );
  const nombreModalidad = String(
    cohorte.nombreModalidad ??
      (isObject(cohorte.modalidad)
        ? (cohorte.modalidad as Record<string, unknown>).nombreModalidad ??
          (cohorte.modalidad as Record<string, unknown>).nombre ??
          ''
        : cohorte.modalidad ?? '')
  );
  return {
    id: String(cohorte.id ?? cohorte._id ?? cohorte.cohorteId ?? cohorteId),
    nombre: String(cohorte.nombre ?? ''),
    activa: Boolean(cohorte.activa),
    idSemestre: cohorte.idSemestre !== undefined
      ? (cohorte.idSemestre as string | number)
      : (isObject(cohorte.semestre) && (cohorte.semestre as Record<string, unknown>).id !== undefined
        ? ((cohorte.semestre as Record<string, unknown>).id as string | number)
        : undefined),
    nombreSemestre,
    semestre: nombreSemestre,
    idModalidad: cohorte.idModalidad !== undefined
      ? (cohorte.idModalidad as string | number)
      : (isObject(cohorte.modalidad) && (cohorte.modalidad as Record<string, unknown>).id !== undefined
        ? ((cohorte.modalidad as Record<string, unknown>).id as string | number)
        : undefined),
    nombreModalidad,
    modalidad: nombreModalidad,
    cupos: Number(cohorte.cupos ?? 0),
    fechaLimiteDocs: String(cohorte.fechaLimiteDocs ?? cohorte.fechaLimiteDocumentos ?? ''),
    fechaLimiteInscripcion: String(cohorte.fechaLimiteInscripcion ?? cohorte.fechaLimitePago ?? ''),
    totalInscritos: Number(cohorte.totalInscritos ?? cohorte.inscritos ?? 0),
    totalValidados: Number(cohorte.totalValidados ?? 0),
    totalCalificados: cohorte.totalCalificados !== undefined ? Number(cohorte.totalCalificados) : Number(cohorte.totalValidados ?? 0),
    totalAdmitidos: Number(cohorte.totalAdmitidos ?? cohorte.admitidos ?? 0),
    inscritos: cohorte.inscritos !== undefined ? Number(cohorte.inscritos) : undefined,
    admitidos: cohorte.admitidos !== undefined ? Number(cohorte.admitidos) : undefined,
    fechaInicioDocumentacion: cohorte.fechaInicioDocumentacion !== undefined ? String(cohorte.fechaInicioDocumentacion) : undefined,
    fechaFinDocumentacion: cohorte.fechaFinDocumentacion !== undefined ? String(cohorte.fechaFinDocumentacion) : undefined,
    fechaInicioInscripcion: cohorte.fechaInicioInscripcion !== undefined ? String(cohorte.fechaInicioInscripcion) : undefined,
    fechaFinInscripcion: cohorte.fechaFinInscripcion !== undefined ? String(cohorte.fechaFinInscripcion) : undefined,
    fechaInicioPago: cohorte.fechaInicioPago !== undefined ? String(cohorte.fechaInicioPago) : undefined,
    fechaFinPago: cohorte.fechaFinPago !== undefined ? String(cohorte.fechaFinPago) : undefined,
    documentos: Array.isArray(cohorte.documentos)
      ? cohorte.documentos.map((doc) => {
          const documento = doc as Record<string, unknown>;
          return {
            nombre: String(documento.nombre ?? ''),
            obligatorio: Boolean(documento.obligatorio),
          };
        })
      : [],
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
    inscritosData: Array.isArray(cohorte.inscritosData)
      ? cohorte.inscritosData.map((inscrito) => {
          const item = inscrito as Record<string, unknown>;
          return {
            id: String(item.id ?? ''),
            nombre: String(item.nombre ?? ''),
            cedula: String(item.cedula ?? ''),
            correo: String(item.correo ?? ''),
          };
        })
      : [],
    admitidosData: Array.isArray(cohorte.admitidosData)
      ? cohorte.admitidosData.map((admitido) => {
          const item = admitido as Record<string, unknown>;
          return {
            id: String(item.id ?? ''),
            nombre: String(item.nombre ?? ''),
            cedula: String(item.cedula ?? ''),
            correo: String(item.correo ?? ''),
          };
        })
      : [],
    documentosAsignados: (() => {
      const da = cohorte.documentosAsignados;
      if (!isObject(da)) return undefined;
      const ra = da as Record<string, unknown>;
      const documentosConsejo: DocumentAssignItem[] = Array.isArray(ra.documentosConsejo)
        ? (ra.documentosConsejo as unknown[]).map((d) => {
            const item = d as Record<string, unknown>;
            return {
              id: Number(item.id ?? 0),
              idDocrequisito: Number(item.idDocrequisito ?? 0),
              idCohorte: Number(item.idCohorte ?? 0),
              nombre: typeof item.nombre === 'string' ? String(item.nombre) : undefined,
            } as DocumentAssignItem;
          })
        : [];
      const documentosPrograma: DocumentAssignItem[] = Array.isArray(ra.documentosPrograma)
        ? (ra.documentosPrograma as unknown[]).map((d) => {
            const item = d as Record<string, unknown>;
            return {
              id: Number(item.id ?? 0),
              idDocrequisito: Number(item.idDocrequisito ?? 0),
              idCohorte: Number(item.idCohorte ?? 0),
              nombre: typeof item.nombre === 'string' ? String(item.nombre) : undefined,
            } as DocumentAssignItem;
          })
        : [];
      return { documentosConsejo, documentosPrograma };
    })(),
  };
}

export async function updateCohorte(cohorteId: string, payload: Partial<NuevaCohortePayload & { cupos: number; activa: boolean }>): Promise<CohorteItem> {
  const path = `/api/application/case/director-programa/cohorte/${cohorteId}`;
  return programaApiClient.fetch<CohorteItem>(path, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function abrirCohorte(cohorteId: string): Promise<CohorteItem> {
  const path = `/api/application/case/director-programa/cohorte/${cohorteId}/abrir`;
  return programaApiClient.fetch<CohorteItem>(path, { method: 'POST' });
}

export async function cerrarCohorte(cohorteId: string): Promise<CohorteItem> {
  const path = `/api/application/case/director-programa/cohorte/${cohorteId}/cerrar`;
  return programaApiClient.fetch<CohorteItem>(path, { method: 'POST' });
}

export default {
  fetchCohorteDetalle,
  updateCohorte,
  abrirCohorte,
  cerrarCohorte,
};
