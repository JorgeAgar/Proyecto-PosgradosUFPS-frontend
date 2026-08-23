import { superadminApiClient, superadminAuthService } from './superadminService';

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
  numerodocumento?: number | string | null;
  idTipodocumento?: number | null;
  ubicacionvivienda?: UbicacionPersonaPayload | null;
  ubicacionnacimiento?: UbicacionPersonaPayload | null;
  ubicaciontrabajo?: UbicacionPersonaPayload | null;
  lugarexpedicion?: UbicacionPersonaPayload | null;
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
  idFacultad: unknown;
  idPrograma: number;
}

export interface PersonaCreadaOutput {
  id: number;
  [key: string]: unknown;
}

export interface UbicacionPersonaPayload {
  direccion: string | null;
  idMunicipio: number | null;
}

export interface PersonaCompletaPayload {
  id?: number;
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  numerodocumento?: number | string | null;
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
  idTipodocumento?: number | null;
  idDocumentopersona?: number | null;
  idUbicacionvivienda?: number | null;
  idUbicacionnacimiento?: number | null;
  idUbicaciontrabajo?: number | null;
  ubicacionvivienda?: UbicacionPersonaPayload | null;
  ubicacionnacimiento?: UbicacionPersonaPayload | null;
  ubicaciontrabajo?: UbicacionPersonaPayload | null;
  lugarexpedicion?: UbicacionPersonaPayload | null;
}

function nullableString(value: string | null | undefined) {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

function nullableNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildUbicacionPayload(value: UbicacionPersonaPayload | null | undefined): UbicacionPersonaPayload | null {
  const direccion = nullableString(value?.direccion);
  const idMunicipio = nullableNumber(value?.idMunicipio);

  if (!direccion && idMunicipio === null) return null;
  return { direccion, idMunicipio };
}

function buildPersonaPayload(data: PersonaCompletaPayload) {
  return {
    ...(data.id ? { id: data.id } : {}),
    nombres: data.nombres.trim(),
    apellidos: data.apellidos.trim(),
    correo: data.correo.trim(),
    fechanacimiento: nullableString(data.fechanacimiento),
    celular: data.celular.trim(),
    telefono: nullableString(data.telefono),
    idGenero: nullableNumber(data.idGenero),
    idEstadocivil: nullableNumber(data.idEstadocivil),
    idGrupoetnico: nullableNumber(data.idGrupoetnico),
    idPoblacionindigena: nullableNumber(data.idPoblacionindigena),
    idDiscapacidad: nullableNumber(data.idDiscapacidad),
    idCapacidadexepcional: nullableNumber(data.idCapacidadexepcional),
    promediopregrado: nullableNumber(data.promediopregrado),
    titulopregrado: nullableString(data.titulopregrado),
    titulosposgrados: nullableString(data.titulosposgrados),
    empresa: nullableString(data.empresa),
    experiencialaboral: nullableString(data.experiencialaboral),
    egresadoufps: typeof data.egresadoufps === 'boolean' ? data.egresadoufps : null,
    ubicacionvivienda: buildUbicacionPayload(data.ubicacionvivienda),
    ubicacionnacimiento: buildUbicacionPayload(data.ubicacionnacimiento),
    ubicaciontrabajo: buildUbicacionPayload(data.ubicaciontrabajo),
    numerodocumento: data.numerodocumento ?? '',
    idTipodocumento: nullableNumber(data.idTipodocumento),
    lugarexpedicion: buildUbicacionPayload(data.lugarexpedicion),
  };
}

function buildPersonaUpdatePayload(data: PersonaCompletaPayload & { id: number }) {
  return {
    id: data.id,
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
  idPrograma?: number;
  persona?: PersonaBasica & Record<string, unknown>;
  rol?: RolOutput;
  clave?: ClaveOutput;
  programa?: { id: number; nombre?: string; [key: string]: unknown };
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

  listarProgramasDirigibles: async (): Promise<ProgramaDirigibleOutput[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dev/endpoint/superadmin/cargos-director-programa/listall`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superadminAuthService.getAccessToken()}`,
      }
    });
    if(!response.ok) {
      throw new Error(`Error al obtener programas dirigibles: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  asignarProgramaDirector: async (_data: { idPersona: number; idCargo: number }): Promise<void> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dev/endpoint/superadmin/administrativo/crear-director`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superadminAuthService.getAccessToken()}`,
      },
      body: JSON.stringify({
        id_persona: _data.idPersona,
        id_cargo: _data.idCargo,
      }),
    });
    if(!response.ok) {
      throw new Error(`Error al asignar programa director: ${response.status} ${response.statusText}`);
    }
  },

  desasignarProgramaDirector: async (idPersona: number): Promise<void> => {
    const administrativos = await superadminApiClient.fetch<AdministrativoOutput[]>(`/api/dev/endpoint/administrativo/listall`, { method: 'GET' });
    const administrativo = administrativos.find((item) => (item.idPersona ?? item.id_persona) === idPersona);

    if (!administrativo) return;

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dev/endpoint/superadmin/administrativo/asignar-programa`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superadminAuthService.getAccessToken()}`,
      },
      body: JSON.stringify({
        id: administrativo.id,
        id_cargo: null,
      }),
    });
    if(!response.ok) {
      throw new Error(`Error al desasignar programa director: ${response.status} ${response.statusText}`);
    }
  },

  obtenerCargoDirectorActual: async (idPersona: number): Promise<number | ''> => {
    const administrativos = await superadminApiClient.fetch<AdministrativoOutput[]>(`/api/dev/endpoint/administrativo/listall`, { method: 'GET' });
    const administrativo = administrativos.find((item) => (item.idPersona ?? item.id_persona) === idPersona);

    return administrativo?.cargo?.id ?? '';
  },

  crearPersona: (data: PersonaCompletaPayload) =>
    superadminApiClient.fetch<PersonaCreadaOutput>(`/api/application/case/superadmin/persona/crear-completo`, {
      method: 'POST',
      body: JSON.stringify(buildPersonaPayload(data)),
    }),

  actualizarPersona: (data: PersonaCompletaPayload & { id: number }) =>
    superadminApiClient.fetch<PersonaCreadaOutput>(`/api/dev/endpoint/persona/update`, {
      method: 'PUT',
      body: JSON.stringify(buildPersonaUpdatePayload(data)),
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
