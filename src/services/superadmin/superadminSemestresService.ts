import { superadminApiClient } from './superadminService';

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
	estado?: string | EstadoOutput | null;
}

export interface SemestreFormPayload {
	id?: number;
	nombre: string;
	fechaInicio: string;
	fechaFin: string;
	idEstado: number;
}

let semestresCache: SemestreOutput[] | null = null;
let semestresPromise: Promise<SemestreOutput[]> | null = null;
let estadosCache: EstadoOutput[] | null = null;
let estadosPromise: Promise<EstadoOutput[]> | null = null;

function normalizeEstado(estado: unknown): EstadoOutput | string | null | undefined {
	if (!estado || typeof estado !== 'object') return estado as string | null | undefined;
	const raw = estado as Partial<EstadoOutput> & Record<string, unknown>;
	return {
		id: Number(raw.id ?? 0),
		entidad: String(raw.entidad ?? ''),
		tipo: String(raw.tipo ?? ''),
	};
}

function normalizeSemestre(raw: unknown, fallback?: Partial<SemestreFormPayload> & { id?: number }): SemestreOutput {
	const data = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
	return {
		id: Number(data.id ?? fallback?.id ?? 0),
		nombre: String(data.nombre ?? fallback?.nombre ?? ''),
		fechainicio: String(data.fechainicio ?? data.fechaInicio ?? fallback?.fechaInicio ?? ''),
		fechafin: String(data.fechafin ?? data.fechaFin ?? fallback?.fechaFin ?? ''),
		idEstado: Number(data.idEstado ?? fallback?.idEstado ?? 0),
		estado: normalizeEstado(data.estado),
	};
}

function normalizeSemestres(raw: unknown): SemestreOutput[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((item) => normalizeSemestre(item));
}

function normalizeEstados(raw: unknown): EstadoOutput[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((item) => {
		const data = (item && typeof item === 'object') ? item as Record<string, unknown> : {};
		return {
			id: Number(data.id ?? 0),
			entidad: String(data.entidad ?? ''),
			tipo: String(data.tipo ?? ''),
		};
	}).filter((estado) => estado.entidad.toLowerCase() === 'semestre');
}

function findEstadoById(idEstado: number): EstadoOutput | undefined {
	return estadosCache?.find((estado) => estado.id === idEstado);
}

function enrichSemestre(semestre: SemestreOutput): SemestreOutput {
	const estado = typeof semestre.estado === 'object' && semestre.estado !== null
		? semestre.estado
		: findEstadoById(semestre.idEstado);
	return estado ? { ...semestre, estado } : semestre;
}

function reconcileSemestresEstados(next: SemestreOutput[]): SemestreOutput[] {
	return next.map((semestre) => enrichSemestre(semestre));
}

function syncSemestreCache(next: SemestreOutput[]): SemestreOutput[] {
	const normalized = reconcileSemestresEstados(next);
	semestresCache = normalized;
	return [...normalized];
}

function syncEstadoCache(next: EstadoOutput[]): EstadoOutput[] {
	estadosCache = next;
	return [...next];
}

export const superadminSemestresService = {
	async listar(forceRefresh = false): Promise<SemestreOutput[]> {
		if (!forceRefresh && semestresCache) {
			return [...semestresCache];
		}
		if (!semestresPromise || forceRefresh) {
			semestresPromise = superadminApiClient.fetch<SemestreOutput[]>('/api/dev/endpoint/semestre/listall', { method: 'GET' })
				.then((data) => syncSemestreCache(normalizeSemestres(data)))
				.finally(() => {
					semestresPromise = null;
				});
		}
		return semestresPromise;
	},

	async listarEstados(forceRefresh = false): Promise<EstadoOutput[]> {
		if (!forceRefresh && estadosCache) {
			return [...estadosCache];
		}
		if (!estadosPromise || forceRefresh) {
			estadosPromise = superadminApiClient.fetch<EstadoOutput[]>('/api/dev/endpoint/estado/listall', { method: 'GET' })
				.then((data) => {
					const nextEstados = syncEstadoCache(normalizeEstados(data));
					if (semestresCache) {
						semestresCache = reconcileSemestresEstados(semestresCache);
					}
					return nextEstados;
				})
				.finally(() => {
					estadosPromise = null;
				});
		}
		return estadosPromise;
	},

	async crear(data: SemestreFormPayload): Promise<SemestreOutput[]> {
		const created = normalizeSemestre(await superadminApiClient.fetch<unknown>('/api/dev/endpoint/semestre/create', {
			method: 'POST',
			body: JSON.stringify(data),
		}), data);

		const next = [...(semestresCache ?? []), created];
		return syncSemestreCache(next);
	},

	async actualizar(data: SemestreFormPayload & { id: number }): Promise<SemestreOutput[]> {
		const updated = normalizeSemestre(await superadminApiClient.fetch<unknown>('/api/dev/endpoint/semestre/update', {
			method: 'PUT',
			body: JSON.stringify(data),
		}), data);

		const current = semestresCache ?? [];
		const next = current.some((item) => item.id === updated.id)
			? current.map((item) => (item.id === updated.id ? updated : item))
			: [...current, updated];
		return syncSemestreCache(next);
	},

	async eliminar(id: number): Promise<SemestreOutput[]> {
		await superadminApiClient.fetch<unknown>('/api/dev/endpoint/semestre/delete', {
			method: 'DELETE',
			body: JSON.stringify({ id }),
		});

		const next = (semestresCache ?? []).filter((item) => item.id !== id);
		return syncSemestreCache(next);
	},

	getCachedSemestres(): SemestreOutput[] {
		return [...(semestresCache ?? [])];
	},

	getCachedEstados(): EstadoOutput[] {
		return [...(estadosCache ?? [])];
	},
};
