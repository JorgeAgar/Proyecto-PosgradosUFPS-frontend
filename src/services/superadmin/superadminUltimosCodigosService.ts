import { superadminApiClient } from './superadminService';

export interface UltimoCodigoProgramaOutput {
	id: number;
	idPrograma: number;
	nombrePrograma: string;
	codigo: number;
}

export interface UltimoCodigoProgramaPayload {
	idPrograma: number;
	codigo: number;
}

let ultimosCodigosCache: UltimoCodigoProgramaOutput[] = [];
let ultimosCodigosLoaded = false;
let ultimosCodigosPromise: Promise<UltimoCodigoProgramaOutput[]> | null = null;

function normalizeUltimoCodigo(raw: unknown): UltimoCodigoProgramaOutput {
	const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

	return {
		id: Number(data.id ?? 0),
		idPrograma: Number(data.idPrograma ?? data.id_programa ?? 0),
		nombrePrograma: String(data.nombrePrograma ?? data.nombre_programa ?? ''),
		codigo: Number(data.codigo ?? 0),
	};
}

function sortUltimosCodigos(items: UltimoCodigoProgramaOutput[]) {
	return [...items].sort((a, b) => a.nombrePrograma.localeCompare(b.nombrePrograma, 'es', { sensitivity: 'base' }));
}

function syncCache(items: UltimoCodigoProgramaOutput[]) {
	ultimosCodigosCache = sortUltimosCodigos(items);
	ultimosCodigosLoaded = true;
	return ultimosCodigosCache;
}

function upsertCache(updated: UltimoCodigoProgramaOutput) {
	const next = ultimosCodigosCache.map((item) => (
		item.idPrograma === updated.idPrograma
			? { ...item, ...updated, nombrePrograma: updated.nombrePrograma || item.nombrePrograma }
			: item
	));

	ultimosCodigosCache = sortUltimosCodigos(next);
	ultimosCodigosLoaded = true;
	return ultimosCodigosCache;
}

export const superadminUltimosCodigosService = {
	async listar(forceRefresh = false): Promise<UltimoCodigoProgramaOutput[]> {
		if (!forceRefresh && ultimosCodigosLoaded) {
			return ultimosCodigosCache;
		}

		if (!ultimosCodigosPromise || forceRefresh) {
			ultimosCodigosPromise = superadminApiClient.fetch<unknown[]>('/api/dev/endpoint/ultimocodigoprograma/listall', {
				method: 'GET',
			})
				.then((data) => syncCache((Array.isArray(data) ? data : []).map(normalizeUltimoCodigo)))
				.finally(() => {
					ultimosCodigosPromise = null;
				});
		}

		return ultimosCodigosPromise;
	},

	async actualizar(data: UltimoCodigoProgramaPayload): Promise<UltimoCodigoProgramaOutput> {
		const updated = normalizeUltimoCodigo(
			await superadminApiClient.fetch<unknown>(`/api/application/case/director-programa/programa/${data.idPrograma}/ultimocodigo`, {
				method: 'PUT',
				body: JSON.stringify({ codigo: data.codigo }),
			}),
		);

		upsertCache(updated);
		return updated;
	},

	getCachedUltimosCodigos(): UltimoCodigoProgramaOutput[] {
		return ultimosCodigosCache;
	},

	hasCachedUltimosCodigos(): boolean {
		return ultimosCodigosLoaded;
	},
};
