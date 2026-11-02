import { superadminApiClient } from './superadminService';

export interface PersonaBasica {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  celular?: string;
  fechanacimiento?: string | null;
  telefono?: string | null;
  idGenero?: number | null;
  idEstadocivil?: number | null;
  idGrupoetnico?: number | null;
  idPoblacionindigena?: number | null;
  idDiscapacidad?: number | null;
  idCapacidadexepcional?: number | null;
  promediopregrado?: number | null;
  titulopregrado?: string | null;
  titulosposgrados?: string | null;
  empresa?: string | null;
  experiencialaboral?: string | null;
  egresadoufps?: boolean | null;
  idDocumentopersona?: number | null;
  idUbicacionvivienda?: number | null;
  idUbicacionnacimiento?: number | null;
  idUbicaciontrabajo?: number | null;
}

export interface RolOutput {
  id: number;
  nombre: string;
}

export interface ClaveOutput {
  id: number;
  valor: string;
}

export interface ProgramaDirigibleOutput {
  id: number;
  nombre: string;
  descripcion: string;
  idFacultad: number | null;
  idPrograma: number;
}

export interface PersonaCreadaOutput {
  id: number;
  [key: string]: unknown;
}

export interface PersonaCompletaPayload {
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  fechanacimiento?: string | null;
  telefono?: string | null;
  idGenero?: number | null;
  idEstadocivil?: number | null;
  idGrupoetnico?: number | null;
  idPoblacionindigena?: number | null;
  idDiscapacidad?: number | null;
  idCapacidadexepcional?: number | null;
  promediopregrado?: number | null;
  titulopregrado?: string | null;
  titulosposgrados?: string | null;
  empresa?: string | null;
  experiencialaboral?: string | null;
  egresadoufps?: boolean | null;
  idDocumentopersona?: number | null;
  idUbicacionvivienda?: number | null;
  idUbicacionnacimiento?: number | null;
  idUbicaciontrabajo?: number | null;
}

function nullableString(value: string | null | undefined) {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

function nullableNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildPersonaPayload(data: PersonaCompletaPayload) {
  return {
    nombres: data.nombres.trim(),
    apellidos: data.apellidos.trim(),
    correo: data.correo.trim(),
    fechanacimiento: nullableString(data.fechanacimiento),
    celular: data.celular.trim(),
    telefono: nullableString(data.telefono),
    idUbicacionvivienda: nullableNumber(data.idUbicacionvivienda),
    idUbicacionnacimiento: nullableNumber(data.idUbicacionnacimiento),
    idUbicaciontrabajo: nullableNumber(data.idUbicaciontrabajo),
    idGenero: nullableNumber(data.idGenero),
    idEstadocivil: nullableNumber(data.idEstadocivil),
    idGrupoetnico: nullableNumber(data.idGrupoetnico),
    idPoblacionindigena: nullableNumber(data.idPoblacionindigena),
    idDiscapacidad: nullableNumber(data.idDiscapacidad),
    idCapacidadexepcional: nullableNumber(data.idCapacidadexepcional),
    idDocumentopersona: nullableNumber(data.idDocumentopersona),
    promediopregrado: nullableNumber(data.promediopregrado),
    titulopregrado: nullableString(data.titulopregrado),
    titulosposgrados: nullableString(data.titulosposgrados),
    empresa: nullableString(data.empresa),
    experiencialaboral: nullableString(data.experiencialaboral),
    egresadoufps: typeof data.egresadoufps === 'boolean' ? data.egresadoufps : null,
  };
}

export interface UsuarioOutput {
  id: number;
  nombreusuario: string;
  idClave: number;
  idPersona: number;
  idRol: number;
  persona?: PersonaBasica & Record<string, unknown>;
  rol?: RolOutput;
  clave?: ClaveOutput;
}

interface AdministrativoOutput {
  id: number;
  idPersona: number;
  id_persona?: number;
  cargo?: { id: number; nombre?: string };
}

export const superadminUsuariosService = {
  listar: () =>
    superadminApiClient.fetch<UsuarioOutput[]>(`/api/dev/endpoint/usuario/listall`, { method: 'GET' }),

  listarRoles: () =>
    superadminApiClient.fetch<RolOutput[]>(`/api/dev/endpoint/rol/listall`, { method: 'GET' }),

  listarPersonas: () =>
    superadminApiClient.fetch<PersonaBasica[]>(`/api/dev/endpoint/persona/listall`, { method: 'GET' }),

  listarProgramasDirigibles: () =>
    superadminApiClient.fetch<ProgramaDirigibleOutput[]>(`/api/dev/endpoint/superadmin/cargos-director-programa/listall`, { method: 'GET' }),

  asignarProgramaDirector: async (data: { idPersona: number; idCargo: number }): Promise<void> => {
    await superadminApiClient.fetch<unknown>(`/api/dev/endpoint/superadmin/administrativo/crear-director`, {
      method: 'POST',
      body: JSON.stringify({
        id_persona: data.idPersona,
        id_cargo: data.idCargo,
      }),
    });
  },

  desasignarProgramaDirector: async (idPersona: number): Promise<void> => {
    const administrativos = await superadminApiClient.fetch<AdministrativoOutput[]>(`/api/dev/endpoint/administrativo/listall`, { method: 'GET' });
    const administrativo = administrativos.find((item) => (item.idPersona ?? item.id_persona) === idPersona);

    if (!administrativo) return;

    await superadminApiClient.fetch<unknown>(`/api/dev/endpoint/superadmin/administrativo/asignar-programa`, {
      method: 'PATCH',
      body: JSON.stringify({
        id: administrativo.id,
        id_cargo: null,
      }),
    });
  },

  obtenerCargoDirectorActual: async (idPersona: number): Promise<number | ''> => {
    const administrativos = await superadminApiClient.fetch<AdministrativoOutput[]>(`/api/dev/endpoint/administrativo/listall`, { method: 'GET' });
    const administrativo = administrativos.find((item) => (item.idPersona ?? item.id_persona) === idPersona);

    return administrativo?.cargo?.id ?? '';
  },

  crearPersona: (data: PersonaCompletaPayload) =>
    superadminApiClient.fetch<PersonaCreadaOutput>(`/api/dev/endpoint/persona/create`, {
      method: 'POST',
      body: JSON.stringify(buildPersonaPayload(data)),
    }),

  actualizarPersona: (data: PersonaCompletaPayload & { id: number }) =>
    superadminApiClient.fetch<PersonaCreadaOutput>(`/api/dev/endpoint/persona/update`, {
      method: 'PUT',
      body: JSON.stringify({ id: data.id, ...buildPersonaPayload(data) }),
    }),

  crearClave: (valor: string) =>
    superadminApiClient.fetch<ClaveOutput>(`/api/dev/endpoint/clave/create`, {
      method: 'POST',
      body: JSON.stringify({ valor }),
    }),

  crear: (data: { nombreusuario: string; idPersona: number; idRol: number; idClave: number }) =>
    superadminApiClient.fetch<unknown>(`/api/dev/endpoint/usuario/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (data: { id: number; nombreusuario: string; idPersona: number; idRol: number; idClave: number }) =>
    superadminApiClient.fetch<unknown>(`/api/dev/endpoint/usuario/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    superadminApiClient.fetch<unknown>(`/api/dev/endpoint/usuario/delete`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};
