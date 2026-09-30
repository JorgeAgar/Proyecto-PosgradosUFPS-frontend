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

function getNombre(value: unknown, claveNombre: string) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (isObject(value)) return String(value[claveNombre] ?? value.nombre ?? value.descripcion ?? '');
  return '';
}

function getIdAnidado(value: unknown): string | number | undefined {
  return isObject(value) && value.id !== undefined ? (value.id as string | number) : undefined;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function optionalNumber(value: unknown) {
  return value !== undefined ? Number(value) : undefined;
}

function optionalString(value: unknown) {
  return value !== undefined ? String(value) : undefined;
}

/**
 * Convierte una cohorte del backend al formato del frontend. El backend no es
 * uniforme (a veces envía el semestre/modalidad como objeto y otras solo el
 * nombre), así que se aceptan todas las variantes conocidas.
 */
export function normalizeCohorte(cohorte: Record<string, unknown>): CohorteItem {
  const nombreSemestre = String(cohorte.nombreSemestre ?? getNombre(cohorte.semestre, 'nombreSemestre'));
  const nombreModalidad = String(cohorte.nombreModalidad ?? getNombre(cohorte.modalidad, 'nombreModalidad'));
  return {
    id: String(cohorte.id ?? cohorte._id ?? cohorte.cohorteId ?? ''),
    nombre: String(cohorte.nombre ?? ''),
    activa: Boolean(cohorte.activa),
    idSemestre: (cohorte.idSemestre as string | number | undefined) ?? getIdAnidado(cohorte.semestre),
    nombreSemestre,
    semestre: nombreSemestre,
    idModalidad: (cohorte.idModalidad as string | number | undefined) ?? getIdAnidado(cohorte.modalidad),
    nombreModalidad,
    modalidad: nombreModalidad,
    cupos: Number(cohorte.cupos ?? 0),
    fechaLimiteDocs: String(cohorte.fechaLimiteDocs ?? cohorte.fechaLimiteDocumentos ?? ''),
    fechaLimiteInscripcion: String(cohorte.fechaLimiteInscripcion ?? cohorte.fechaLimitePago ?? ''),
    totalInscritos: Number(cohorte.totalInscritos ?? cohorte.inscritos ?? 0),
    totalValidados: Number(cohorte.totalValidados ?? 0),
    totalCalificados: Number(cohorte.totalCalificados ?? 0),
    totalAdmitidos: Number(cohorte.totalAdmitidos ?? cohorte.admitidos ?? 0),
    inscritos: optionalNumber(cohorte.inscritos),
    admitidos: optionalNumber(cohorte.admitidos),
    fechaInicioDocumentacion: optionalString(cohorte.fechaInicioDocumentacion),
    fechaFinDocumentacion: optionalString(cohorte.fechaFinDocumentacion),
    fechaInicioInscripcion: optionalString(cohorte.fechaInicioInscripcion),
    fechaFinInscripcion: optionalString(cohorte.fechaFinInscripcion),
    fechaInicioPago: optionalString(cohorte.fechaInicioPago),
    fechaFinPago: optionalString(cohorte.fechaFinPago),
    documentos: Array.isArray(cohorte.documentos)
      ? cohorte.documentos.map((doc) => {
          const documento = doc as Record<string, unknown>;
          return {
            nombre: String(documento.nombre ?? ''),
            obligatorio: Boolean(documento.obligatorio),
          };
        })
      : undefined,
  };
}

export async function fetchCohortes(): Promise<CohorteItem[]> {
  const programaId = await getProgramaRealId();
  const path = `/api/application/case/director-programa/programa/${programaId}/cohortes`;
  const data = await programaApiClient.fetch<unknown[]>(path, { method: 'GET' });
  const normalized = data.map((item) => normalizeCohorte(item as Record<string, unknown>));
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
