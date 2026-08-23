/*
  programaCohorteService.ts
  Servicio para el listado y creación de cohortes del módulo Programa.
  - Usa VITE_API_URL del .env
  - Endpoints del backend real
*/

import { programaApiClient, getProgramaRealId } from './programaService';

export interface CohorteItem {
  id: string;
  nombre: string;
  activa: boolean;
  idSemestre?: string | number;
  nombreSemestre?: string;
  semestre: string;
  idModalidad?: string | number;
  nombreModalidad?: string;
  modalidad?: string;
  cupos: number;
  fechaLimiteDocs: string;
  fechaLimiteInscripcion: string;
  totalInscritos: number;
  totalValidados: number;
  totalCalificados?: number;
  totalAdmitidos: number;
  inscritos?: number;
  admitidos?: number;
  fechaInicioDocumentacion?: string;
  fechaFinDocumentacion?: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  fechaInicioPago?: string;
  fechaFinPago?: string;
  documentos?: DocumentoCohorte[];
}

export interface DocumentoCohorte {
  nombre: string;
  obligatorio: boolean;
}

export interface DocumentAssignItem {
  id: number;
  idDocrequisito: number;
  idCohorte: number;
  nombre?: string;
}

export interface AspiranteItem {
  id: string;
  nombre: string;
  cedula: string;
  correo: string;
}

export interface CriterioItem {
  id?: string | number;
  idCriterioevaluacion?: string | number;
  nombre: string;
  peso: number | undefined;
}

export interface CohorteDetalle extends CohorteItem {
  criterios: CriterioItem[];
  inscritosData: AspiranteItem[];
  admitidosData: AspiranteItem[];
  documentosAsignados?: {
    documentosConsejo?: DocumentAssignItem[];
    documentosPrograma?: DocumentAssignItem[];
  };
}

export interface NuevaCohortePayload {
  nombre: string;
  idSemestre?: number | string;
  idModalidad?: number | string;
  cupos: number;
  fechaInicioDocumentacion?: string;
  fechaFinDocumentacion?: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  fechaInicioPago?: string;
  fechaFinPago?: string;
  documentos?: DocumentoCohorte[];
  documentosConsejo?: { idDocrequisito?: number | string; idCohorte?: number | string; nombre?: string }[];
  documentosPrograma?: { idDocrequisito?: number | string; idCohorte?: number | string; nombre?: string }[];
  criteriosCohorte?: { idCriterio?: number | string; idCohorte?: number | string; pesoSnapshot?: number }[];
}

export interface SemestreItem {
  id: number | string;
  nombre: string;
  fechainicio: string;
  fechafin: string;
  idEstado: number;
  estado?: string | { tipo?: string; nombre?: string } | null;
}

export interface ModalidadItem {
  id: number | string;
  nombre: string;
}

function normalizeSemestreEstado(value: unknown) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '');
  return raw;
}

function getSemestreNombre(value: unknown) {
  if (typeof value === 'string') return value;
  if (isObject(value)) {
    const semestre = value as Record<string, unknown>;
    return String(semestre.nombreSemestre ?? semestre.nombre ?? semestre.descripcion ?? '');
  }
  return '';
}

function getModalidadNombre(value: unknown) {
  if (typeof value === 'string') return value;
  if (isObject(value)) {
    const modalidad = value as Record<string, unknown>;
    return String(modalidad.nombreModalidad ?? modalidad.nombre ?? modalidad.descripcion ?? '');
  }
  return '';
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export async function fetchCohortes(): Promise<CohorteItem[]> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/cohortes`;
  const data = await programaApiClient.fetch<unknown[]>(path, { method: 'GET' });
  const normalized = data.map((item) => {
    const cohorte = item as Record<string, unknown>;
    return {
      id: String(cohorte.id ?? ''),
      nombre: String(cohorte.nombre ?? ''),
      activa: Boolean(cohorte.activa),
      idSemestre: cohorte.idSemestre !== undefined ? (cohorte.idSemestre as string | number) : undefined,
      nombreSemestre: String(cohorte.nombreSemestre ?? getSemestreNombre(cohorte.semestre) ?? ''),
      semestre: String(cohorte.nombreSemestre ?? getSemestreNombre(cohorte.semestre) ?? cohorte.semestre ?? ''),
      idModalidad: cohorte.idModalidad !== undefined ? (cohorte.idModalidad as string | number) : undefined,
      nombreModalidad: String(cohorte.nombreModalidad ?? getModalidadNombre(cohorte.modalidad) ?? ''),
      modalidad: String(cohorte.nombreModalidad ?? getModalidadNombre(cohorte.modalidad) ?? cohorte.modalidad ?? ''),
      cupos: Number(cohorte.cupos ?? 0),
      fechaLimiteDocs: String(cohorte.fechaLimiteDocs ?? cohorte.fechaLimiteDocumentos ?? ''),
      fechaLimiteInscripcion: String(cohorte.fechaLimiteInscripcion ?? cohorte.fechaLimitePago ?? ''),
      totalInscritos: Number(cohorte.totalInscritos ?? cohorte.inscritos ?? 0),
      totalValidados: Number(cohorte.totalValidados ?? 0),
      totalCalificados: Number(cohorte.totalCalificados ?? 0),
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
        : undefined,
    } as CohorteItem;
  });
  normalized.sort((a, b) => {
    if (a.activa !== b.activa) return a.activa ? -1 : 1;
    const aDate = a.fechaInicioDocumentacion ? new Date(a.fechaInicioDocumentacion).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.fechaInicioDocumentacion ? new Date(b.fechaInicioDocumentacion).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
  return normalized;
}

export async function createCohorte(payload: NuevaCohortePayload): Promise<CohorteItem> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/cohortes`;
  return programaApiClient.fetch<CohorteItem>(path, { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchSemestresDisponibles(): Promise<SemestreItem[]> {
  const path = '/api/dev/endpoint/semestre/listall';
  const data = await programaApiClient.fetch<unknown[]>(path, { method: 'GET' });
  const semestres = (data ?? []).map((item) => {
    const semestre = item as Record<string, unknown>;
    return {
      id: semestre.id !== undefined ? (semestre.id as string | number) : '',
      nombre: String(semestre.nombre ?? ''),
      fechainicio: String(semestre.fechainicio ?? ''),
      fechafin: String(semestre.fechafin ?? ''),
      idEstado: Number(semestre.idEstado ?? 0),
      estado: typeof semestre.estado === 'string' || semestre.estado === null || semestre.estado === undefined
        ? (semestre.estado as string | null | undefined)
        : { tipo: String((semestre.estado as Record<string, unknown>).tipo ?? ''), nombre: String((semestre.estado as Record<string, unknown>).nombre ?? '') },
    } as SemestreItem;
  });

  return semestres.filter((semestre) => {
    const estadoTexto = typeof semestre.estado === 'string'
      ? semestre.estado
      : (semestre.estado?.tipo ?? semestre.estado?.nombre ?? '');
    const normalized = normalizeSemestreEstado(estadoTexto);
    return normalized === 'programado' || normalized === 'encurso';
  });
}

export async function fetchModalidadesDisponibles(): Promise<ModalidadItem[]> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/modalidades`;
  const data = await programaApiClient.fetch<unknown[]>(path, { method: 'GET' });
  return (data ?? []).map((item) => {
    const modalidad = item as Record<string, unknown>;
    return {
      id: modalidad.id !== undefined ? (modalidad.id as string | number) : '',
      nombre: String(modalidad.nombre ?? ''),
    } as ModalidadItem;
  });
}

export default {
  fetchCohortes,
  createCohorte,
  fetchSemestresDisponibles,
  fetchModalidadesDisponibles,
};
