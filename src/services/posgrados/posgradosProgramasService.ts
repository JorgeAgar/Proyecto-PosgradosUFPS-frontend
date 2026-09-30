import { posgradosApiClient } from './posgradosService';
import type { CohorteOutput, FacultadOutput, ProgramaOutput } from '../superadmin/superadminCohortesService';

export type { CohorteOutput, FacultadOutput, ProgramaOutput };

/**
 * Consultas de solo lectura del usuario de Posgrados. Usan los mismos endpoints
 * y tipos que el módulo superadmin, pero con la sesión de Posgrados.
 */
export const posgradosProgramasService = {
  listarFacultades: () =>
    posgradosApiClient.fetch<FacultadOutput[]>('/api/dev/endpoint/facultad/listall', { method: 'GET' }),

  listarProgramas: () =>
    posgradosApiClient.fetch<ProgramaOutput[]>('/api/dev/endpoint/programa/listall', { method: 'GET' }),

  listarCohortes: () =>
    posgradosApiClient.fetch<CohorteOutput[]>('/api/dev/endpoint/cohortes/listall', { method: 'GET' }),
};
