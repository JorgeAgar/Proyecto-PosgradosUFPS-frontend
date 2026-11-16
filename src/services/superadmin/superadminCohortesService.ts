import { superadminApiClient } from './superadminService';
import type { EstadoOutput } from './superadminSemestresService';
export { superadminSemestresService } from './superadminSemestresService';
export type { EstadoOutput, SemestreOutput } from './superadminSemestresService';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ModalidadOutput {
  id: number;
  nombre: string;
}

export interface PlazoOutput {
  id: number;
  idTipoplazo: number;
  fechainicio: string;
  fechafin: string;
  tipoplazo?: { id: number; tipo: string; descripcion?: string | null };
}

export interface FacultadOutput {
  id: number;
  nombre: string;
  correo: string;
}

export interface ProgramaOutput {
  id: number;
  codigo: string;
  nombre: string;
  duracion: number;
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
  idModalidad?: number;
  sede?: { id: number; nombre: string };
  facultad?: FacultadOutput;
  tiporegistro?: { id: number; tipo: string };
  cohorteList?: string[];
}

export interface CohorteOutput {
  id: number;
  nombre: string;
  cupos: number;
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

export interface DocumentoCohortePayload {
  id: number;
  idDocrequisito: number;
  idCohorte: number;
  nombre: string;
}

export interface CriterioCohortePayload {
  idCohorte: number;
  idCriterio: number;
  pesoSnapshot: number;
}

export type CrearCohorteProgramaPayload = import('../programa/programaCohorteService').NuevaCohortePayload;

// ── Facultades ────────────────────────────────────────────────────────────────

export const superadminFacultadesService = {
  listar: () =>
    superadminApiClient.fetch<FacultadOutput[]>('/api/dev/endpoint/facultad/listall', { method: 'GET' }),

  crear: (data: { nombre: string; correo: string; idAdministrativo: number }) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/facultad/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: { id: number; nombre: string; correo: string; idAdministrativo: number }) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/facultad/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/facultad/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ── Programas ─────────────────────────────────────────────────────────────────

export const superadminProgramasService = {
  listar: () =>
    superadminApiClient.fetch<ProgramaOutput[]>('/api/dev/endpoint/programa/listall', { method: 'GET' }),

  listarPorFacultad: (idFacultad: number) =>
    superadminApiClient.fetch<ProgramaOutput[]>('/api/dev/endpoint/programa/listbyfacultad', { method: 'POST', body: JSON.stringify({ id: idFacultad }) }),

  listarFacultades: () =>
    superadminApiClient.fetch<FacultadOutput[]>('/api/dev/endpoint/facultad/listall', { method: 'GET' }),

  crear: async (data: {
    codigo: string; nombre: string; duracion: number; correo: string;
    registrosnies: string; nivelformacion: string; titulo: string;
    rcmineducacion: string; creditos: number; periodicidad: string;
    valormatricula: number; idSede: number; idTiporegistro: number; idModalidad: number;
    idFacultad: number; idOtros: number;
  }): Promise<{ advertencia?: string }> => {
    const programa = await superadminApiClient.fetch<{ id?: number } | undefined>('/api/dev/endpoint/programa/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // El programa ya existe en este punto: los fallos del cargo se informan como advertencia
    // (no como error) para no inducir a crear el programa de nuevo.
    if (typeof programa?.id !== 'number') {
      return { advertencia: 'El programa se creó, pero el servidor no devolvió su id, así que no se pudo crear su cargo de director.' };
    }

    try {
      await superadminApiClient.fetch<unknown>('/api/dev/endpoint/cargo/create', {
        method: 'POST',
        body: JSON.stringify({
          nombre: `Director ${data.nombre}`,
          descripcion: `Cargo de director para el programa ${data.nombre}`,
          idPrograma: programa.id,
        }),
      });
    } catch (err) {
      const detalle = err instanceof Error ? err.message : String(err);
      return { advertencia: `El programa se creó, pero no se pudo crear su cargo de director: ${detalle}` };
    }
    return {};
  },

  actualizar: (data: {
    id: number; codigo: string; nombre: string; duracion: number; correo: string;
    registrosnies: string; nivelformacion: string; titulo: string;
    rcmineducacion: string; creditos: number; periodicidad: string;
    valormatricula: number; idSede: number; idTiporegistro: number; idModalidad: number;
    idFacultad: number; idOtros: number;
  }) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/programa/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/programa/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// ── Cohortes ──────────────────────────────────────────────────────────────────

export const superadminCohortesService = {
  listar: () =>
    superadminApiClient.fetch<CohorteOutput[]>('/api/dev/endpoint/cohortes/listall', { method: 'GET' }),

  crear: (data: {
    nombre: string; cupos: number;
    idEstado: number; idSemestre: number; idModalidad: number;
    idPlazodocumentacion: number; idPlazoinscripcion: number; idPlazopago: number;
    idPrograma: number;
  }) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/cohortes/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  crearPorPrograma: (programaId: number, data: CrearCohorteProgramaPayload) =>
    superadminApiClient.fetch<unknown>(`/api/application/case/director-programa/programa/${programaId}/cohortes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: {
    id: number; nombre: string; cupos: number;
    idEstado: number; idSemestre: number; idModalidad: number;
    idPlazodocumentacion: number; idPlazoinscripcion: number; idPlazopago: number;
    idPrograma: number;
  }) =>
    superadminApiClient.fetch<unknown>('/api/dev/endpoint/cohortes/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: async (id: number): Promise<void> => {
    const [detalle, aspirantes] = await Promise.all([
      superadminApiClient.fetch<{
        criterios: { id: number }[];
        documentosAsignados: { documentosConsejo: { id: number }[]; documentosPrograma: { id: number }[] };
      }>(`/api/application/case/director-programa/cohorte/${id}`),
      superadminApiClient.fetch<{ id: number }[]>(`/api/application/case/cohortes/${id}/aspirantes`),
    ]);
    if (aspirantes.length > 0) throw new Error('No se puede eliminar una cohorte con aspirantes inscritos.');

    // Las asociaciones tienen su propio DELETE y deben retirarse antes de la cohorte.
    for (const doc of detalle.documentosAsignados.documentosConsejo) {
      await superadminApiClient.fetch<void>('/api/dev/endpoint/documentosrequisitoconsejocohorte/delete', {
        method: 'DELETE', body: JSON.stringify({ id: doc.id }),
      });
    }
    for (const doc of detalle.documentosAsignados.documentosPrograma) {
      await superadminApiClient.fetch<void>('/api/dev/endpoint/documentosrequisitoprogramacohorte/delete', {
        method: 'DELETE', body: JSON.stringify({ id: doc.id }),
      });
    }
    for (const criterio of detalle.criterios) {
      await superadminApiClient.fetch<void>(`/api/dev/endpoint/api/v1/criteriocohorte/${criterio.id}`, { method: 'DELETE' });
    }
    await superadminApiClient.fetch<void>('/api/dev/endpoint/cohortes/delete', {
      method: 'DELETE', body: JSON.stringify({ id }),
    });
  },

  listarEstados: async () => {
    const estados = await superadminApiClient.fetch<EstadoOutput[]>('/api/dev/endpoint/estado/listall', { method: 'GET' });
    return estados.filter((e) => e.entidad === 'cohorte');
  }
};

// ── Modalidades ───────────────────────────────────────────────────────────────

export const superadminModalidadesService = {
  listar: () =>
    superadminApiClient.fetch<ModalidadOutput[]>('/api/dev/endpoint/modalidad/listall', { method: 'GET' }),
};

// ── Plazos ────────────────────────────────────────────────────────────────────

export const superadminPlazosService = {
  listar: () =>
    superadminApiClient.fetch<PlazoOutput[]>('/api/dev/endpoint/plazo/listall', { method: 'GET' }),

  crear: (data: { fechainicio: string; fechafin: string; idTipoplazo: number }) =>
    superadminApiClient.fetch<PlazoOutput>('/api/dev/endpoint/plazo/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: { id: number; fechainicio: string; fechafin: string; idTipoplazo: number }) =>
    superadminApiClient.fetch<PlazoOutput>('/api/dev/endpoint/plazo/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Administrativos ───────────────────────────────────────────────────────────

export interface AdministrativoOutput {
  id: number;
  idPersona: number;
  persona?: { id: number; nombres: string; apellidos: string; correo: string };
  cargo?: { id: number; nombre: string; facultad?: FacultadOutput | null };
}

export const superadminAdministrativosService = {
  listar: () =>
    superadminApiClient.fetch<AdministrativoOutput[]>('/api/dev/endpoint/administrativo/listall', { method: 'GET' }),
};

// ── Sedes ─────────────────────────────────────────────────────────────────────

export interface SedeOutput {
  id: number;
  nombre: string;
  ubicacion?: { id: number; direccion: string | null };
}

export const superadminSedesService = {
  listar: () =>
    superadminApiClient.fetch<SedeOutput[]>('/api/dev/endpoint/sedes/listall', { method: 'GET' }),
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
    superadminApiClient.fetch<OtrosValoresOutput[]>('/api/dev/endpoint/otrosvalores/listall', { method: 'GET' }),
};
