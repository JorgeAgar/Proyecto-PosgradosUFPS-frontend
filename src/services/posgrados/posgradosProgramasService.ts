import { posgradosApiClient } from './posgradosService';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface EstadoOutput {
  id: number;
  entidad: string;
  tipo: string;
}

export interface SemestreOutput {
  id: number;
  nombre: string;
  fechainicio: string;
  fechafin: string;
  idEstado: number;
  estado: string;
  cohorteList: string[];
}

export interface ModalidadOutput {
  id: number;
  nombre: string;
}

export interface PlazoOutput {
  id: number;
  idTipoplazo: number;
  fechainicio: string;
  fechafin: string;
  tipoplazo?: { id: number; nombre: string; tipo: string };
}

export interface FacultadOutput {
  id: number;
  nombre: string;
  correo: string;
  cargoList?: string[];
  programaList?: ProgramaOutput[];
}

export interface ProgramaOutput {
  id: number;
  codigo: number;
  nombre: string;
  semestres: number;
  duracion?: number;
  correo: string;
  registrosnies: string;
  nivelformacion: string;
  titulo: string;
  rcmineducacion: string;
  creditos: number;
  periodicidad: string;
  valormatricula: number;
  idFacultad: number;
  idOtros: number;
  idSede: number;
  idTiporegistro?: number;
  sede?: { id: number; nombre: string };
  facultad?: string;
  administrativo?: string;
  cohorteList?: string[];
}

export interface CohorteOutput {
  id: number;
  nombre: string;
  cupos: number;
  requiereentrevista: boolean;
  requiereprueba: boolean;
  idEstado: number;
  idSemestre: number;
  idModalidad: number;
  idPlazodocumentacion: number;
  idPlazoinscripcion: number;
  idPlazopago: number;
  idPrograma: number;
  estado?: string | EstadoOutput;
  semestre?: { id: number; nombre: string; fechainicio: string; fechafin: string };
  modalidad?: { id: number; nombre: string };
}

// ── Semestres ─────────────────────────────────────────────────────────────────

export const superadminSemestresService = {
  listar: () =>
    posgradosApiClient.fetch<SemestreOutput[]>('/api/dev/endpoint/semestre/listall', { method: 'GET' }),

  listarEstados: () =>
    posgradosApiClient.fetch<EstadoOutput[]>('/api/dev/endpoint/estado/listall', { method: 'GET' }),

  crear: (data: { nombre: string; fechaInicio: string; fechaFin: string; idEstado: number }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/semestre/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: { id: number; nombre: string; fechaInicio: string; fechaFin: string; idEstado: number }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/semestre/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/semestre/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ── Facultades ────────────────────────────────────────────────────────────────

export const superadminFacultadesService = {
  listar: () =>
    posgradosApiClient.fetch<FacultadOutput[]>('/api/dev/endpoint/facultad/listall', { method: 'GET' }),

  crear: (data: { nombre: string; correo: string; idAdministrativo?: number }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/facultad/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: { id: number; nombre: string; correo: string; idAdministrativo?: number }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/facultad/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/facultad/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ── Programas ─────────────────────────────────────────────────────────────────

export const superadminProgramasService = {
  listar: () =>
    posgradosApiClient.fetch<ProgramaOutput[]>('/api/dev/endpoint/programa/listall', { method: 'GET' }),

  listarPorFacultad: (idFacultad: number) =>
    posgradosApiClient.fetch<ProgramaOutput[]>('/api/dev/endpoint/programa/listbyfacultad', {
      method: 'POST',
      body: JSON.stringify({ id: idFacultad }),
    }),

  listarFacultades: () =>
    posgradosApiClient.fetch<FacultadOutput[]>('/api/dev/endpoint/facultad/listall', { method: 'GET' }),

  crear: (data: {
    codigo: number; nombre: string; semestres: number; correo: string;
    registrosnies: string; nivelformacion: string; titulo: string;
    rcmineducacion: string; creditos: number; periodicidad: string;
    valormatricula: number; idSede: number; idAdministrativo: number;
    idFacultad: number; idOtros: number;
  }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/programa/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: {
    id: number; codigo: number; nombre: string; semestres: number; correo: string;
    registrosnies: string; nivelformacion: string; titulo: string;
    rcmineducacion: string; creditos: number; periodicidad: string;
    valormatricula: number; idSede: number; idAdministrativo: number;
    idFacultad: number; idOtros: number;
  }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/programa/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/programa/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ── Administrativos ───────────────────────────────────────────────────────────

export interface AdministrativoOutput {
  id: number;
  idPersona: number;
  persona?: { id: number; nombres: string; apellidos: string; correo: string };
  cargo?: { id: number; nombre: string };
}

export const superadminAdministrativosService = {
  listar: () =>
    posgradosApiClient.fetch<AdministrativoOutput[]>('/api/dev/endpoint/administrativo/listall', { method: 'GET' }),
};

// ── Cohortes ──────────────────────────────────────────────────────────────────

export const superadminCohortesService = {
  listar: () =>
    posgradosApiClient.fetch<CohorteOutput[]>('/api/dev/endpoint/cohortes/listall', { method: 'GET' }),

  crear: (data: {
    nombre: string; cupos: number; requiereentrevista: boolean; requiereprueba: boolean;
    idEstado: number; idSemestre: number; idModalidad: number;
    idPlazodocumentacion: number; idPlazoinscripcion: number; idPlazopago: number;
    idPrograma: number;
  }) =>
    posgradosApiClient.fetch<unknown>('/api/dev/endpoint/cohortes/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: {
    id: number; nombre: string; cupos: number; requiereentrevista: boolean; requiereprueba: boolean;
    idEstado: number; idSemestre: number; idModalidad: number;
    idPlazodocumentacion: number; idPlazoinscripcion: number; idPlazopago: number;
    idPrograma: number;
  }) =>
     posgradosApiClient.fetch<unknown>('/api/dev/endpoint/cohortes/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
     posgradosApiClient.fetch<unknown>('/api/dev/endpoint/cohortes/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ── Sedes ─────────────────────────────────────────────────────────────────────

export interface SedeOutput {
  id: number;
  nombre: string;
  ubicacion?: { id: number; direccion: string | null };
}

export const superadminSedesService = {
  listar: () =>
    posgradosApiClient.fetch<SedeOutput[]>('/api/dev/endpoint/sedes/listall', { method: 'GET' }),
};

// ── Otros valores ─────────────────────────────────────────────────────────────

export interface OtrosValoresOutput {
  id: number;
  carnet: boolean;
  estampilla: boolean;
  seguro: boolean;
}

export const superadminOtrosValoresService = {
  listar: () =>
    posgradosApiClient.fetch<OtrosValoresOutput[]>('/api/dev/endpoint/otrosvalores/listall', { method: 'GET' }),
};
