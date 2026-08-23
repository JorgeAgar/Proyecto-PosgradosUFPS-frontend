import { superadminApiClient } from './superadminService';

export interface ValorGlobalOutput {
	id: number;
	clave: string;
	valor: string;
}

export interface ValorGlobalPayload {
	id?: number;
	clave: string;
	valor: string;
}

type ValorGlobalSlot = 'valor-inscripcion' | 'tamano-maximo-archivos' | 'salario-minimo';

const VALORES_GLOBALES_ORDEN: ValorGlobalSlot[] = [
	'valor-inscripcion',
	'tamano-maximo-archivos',
	'salario-minimo',
];

const VALORES_GLOBALES_CONFIG: Record<ValorGlobalSlot, { listar: string; crear: string; aliases: string[]; displayClave: string; valorSuffix: string }> = {
	'valor-inscripcion': {
		listar: '/api/dev/endpoint/superadmin/valoresglobales/valor-inscripcion/actual',
		crear: '/api/dev/endpoint/superadmin/valoresglobales/valor-inscripcion',
		aliases: ['valor-inscripcion', 'valor_inscripcion', 'valorinscripcion', 'inscripcion'],
		displayClave: 'VALOR_INSCRIPCION',
		valorSuffix: 'SMMLV',
	},
	'tamano-maximo-archivos': {
		listar: '/api/dev/endpoint/superadmin/valoresglobales/tamano-maximo-archivos/actual',
		crear: '/api/dev/endpoint/superadmin/valoresglobales/tamano-maximo-archivos',
		aliases: ['tamano-maximo-archivos', 'tamano_maximo_archivos', 'tamanomaximoarchivos', 'tamano maximo archivos'],
		displayClave: 'TAMANO_MAXIMO_ARCHIVOS',
		valorSuffix: 'MB',
	},
	'salario-minimo': {
		listar: '/api/dev/endpoint/superadmin/valoresglobales/salario-minimo/actual',
		crear: '/api/dev/endpoint/superadmin/valoresglobales/salario-minimo',
		aliases: ['salario-minimo', 'salario_minimo', 'salariominimo'],
		displayClave: 'SALARIO_MINIMO',
		valorSuffix: '',
	},
};

let valoresGlobalesCache: Partial<Record<ValorGlobalSlot, ValorGlobalOutput>> = {};
let valoresGlobalesLoaded = false;
let valoresGlobalesPromise: Promise<ValorGlobalOutput[]> | null = null;

function normalizeValorGlobal(raw: unknown, fallback?: Partial<ValorGlobalPayload> & { id?: number }): ValorGlobalOutput {
	const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const claveBruta = String(data.clave ?? fallback?.clave ?? '');
	const slot = resolverSlotDesdeClave(claveBruta) ?? resolverSlotDesdeClave(String(fallback?.clave ?? ''));
	const config = slot ? VALORES_GLOBALES_CONFIG[slot] : null;
	return {
		id: Number(data.id ?? fallback?.id ?? 0),
		clave: config?.displayClave ?? normalizarClaveVisible(claveBruta),
		valor: limpiarValorParaMostrar(String(data.valor ?? fallback?.valor ?? ''), slot),
	};
}

function normalizarClaveBackend(clave: string): string {
	return clave.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function normalizarClaveVisible(clave: string): string {
	return extraerBaseClaveBackend(clave);
}

function extraerBaseClaveBackend(clave: string): string {
	const normalized = normalizarClaveBackend(clave);
	const match = normalized.match(/^(.*)_\d{4}_\d+$/);
	return match ? match[1] : normalized;
}

function normalizarValorNumerico(valor: string): string {
	const trimmed = valor.trim().replace(',', '.');
	let resultado = '';
	let yaTienePuntoDecimal = false;

	for (const caracter of trimmed) {
		if (/\d/.test(caracter)) {
			resultado += caracter;
			continue;
		}

		if (caracter === '.' && !yaTienePuntoDecimal) {
			resultado += caracter;
			yaTienePuntoDecimal = true;
		}
	}

	return resultado;
}

function limpiarValorParaMostrar(valor: string, slot: ValorGlobalSlot | null): string {
	const trimmed = valor.trim();
	if (!trimmed) return '';

	const suffix = slot ? VALORES_GLOBALES_CONFIG[slot].valorSuffix : '';
	const withoutSuffix = suffix ? trimmed.replace(new RegExp(`\\s*${suffix}\\s*$`, 'i'), '') : trimmed;
	return normalizarValorNumerico(withoutSuffix);
}

function resolverSlotDesdeClave(clave: string): ValorGlobalSlot | null {
	const normalized = extraerBaseClaveBackend(clave);

	for (const slot of VALORES_GLOBALES_ORDEN) {
		const metadata = VALORES_GLOBALES_CONFIG[slot];
		if (metadata.aliases.some((alias) => extraerBaseClaveBackend(alias) === normalized)) {
			return slot;
		}
	}

	return null;
}

function resolverSlotDesdeId(id: number): ValorGlobalSlot | null {
	for (const slot of VALORES_GLOBALES_ORDEN) {
		if (valoresGlobalesCache[slot]?.id === id) {
			return slot;
		}
	}

	return null;
}

function getCachedValoresGlobales(): ValorGlobalOutput[] {
	return VALORES_GLOBALES_ORDEN
		.map((slot) => valoresGlobalesCache[slot])
		.filter((item): item is ValorGlobalOutput => Boolean(item));
}

function syncCache(next: Partial<Record<ValorGlobalSlot, ValorGlobalOutput>>): ValorGlobalOutput[] {
	valoresGlobalesCache = Object.fromEntries(
		VALORES_GLOBALES_ORDEN.map((slot) => [slot, next[slot]]),
	) as Partial<Record<ValorGlobalSlot, ValorGlobalOutput>>;

	valoresGlobalesLoaded = true;
	return getCachedValoresGlobales();
}

function upsertCache(slot: ValorGlobalSlot, item: ValorGlobalOutput): ValorGlobalOutput[] {
	valoresGlobalesCache = {
		...valoresGlobalesCache,
		[slot]: item,
	};

	valoresGlobalesLoaded = true;
	return getCachedValoresGlobales();
}

async function fetchValorGlobal(slot: ValorGlobalSlot): Promise<ValorGlobalOutput> {
	return normalizeValorGlobal(
		await superadminApiClient.fetch<unknown>(VALORES_GLOBALES_CONFIG[slot].listar, {
			method: 'GET',
		}),
		undefined,
	);
}

export const superadminGlobalesService = {
	async listar(forceRefresh = false): Promise<ValorGlobalOutput[]> {
		if (!forceRefresh && valoresGlobalesLoaded) {
			return getCachedValoresGlobales();
		}

		if (!valoresGlobalesPromise || forceRefresh) {
			valoresGlobalesPromise = Promise.all(
				VALORES_GLOBALES_ORDEN.map(async (slot) => ({
					slot,
					value: await fetchValorGlobal(slot),
				})),
			)
				.then((data) => syncCache(Object.fromEntries(data.map(({ slot, value }) => [slot, value])) as Partial<Record<ValorGlobalSlot, ValorGlobalOutput>>))
				.finally(() => {
					valoresGlobalesPromise = null;
				});
		}

		return valoresGlobalesPromise;
	},

	async actualizar(data: ValorGlobalPayload & { id: number }): Promise<ValorGlobalOutput> {
		const slot = resolverSlotDesdeId(data.id) ?? resolverSlotDesdeClave(data.clave);

		if (!slot) {
			throw new Error('No se pudo identificar la variable global a actualizar.');
		}

		const updated = normalizeValorGlobal(
			await superadminApiClient.fetch<unknown>(VALORES_GLOBALES_CONFIG[slot].crear, {
				method: 'POST',
				body: JSON.stringify({
					clave: VALORES_GLOBALES_CONFIG[slot].displayClave,
					valor: normalizarValorNumerico(data.valor),
				}),
			}),
			data,
		);

		upsertCache(slot, updated);
		return updated;
	},

	getCachedValoresGlobales(): ValorGlobalOutput[] {
		return getCachedValoresGlobales();
	},

	hasCachedValoresGlobales(): boolean {
		return valoresGlobalesLoaded;
	},
};
