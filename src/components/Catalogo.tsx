import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/** Piezas de las vistas de catálogo del superadmin (buscador, cabecera y estado vacío). */

export function CampoBusqueda({ valor, onCambiar, placeholder }: { valor: string; onCambiar: (valor: string) => void; placeholder: string }) {
	return (
		<div className="animate-fade-in-up delay-100 mb-5">
			<div className="relative">
				<span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
					<MagnifyingGlassIcon className="h-5 w-5" />
				</span>
				<input
					type="text"
					placeholder={placeholder}
					value={valor}
					onChange={(e) => onCambiar(e.target.value)}
					className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
				/>
			</div>
		</div>
	);
}

/** Cabecera de la tabla: título y número de registros visibles tras filtrar. */
export function EncabezadoCatalogo({ titulo, visibles }: { titulo: string; visibles: number }) {
	const plural = visibles === 1 ? '' : 's';
	return (
		<div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
				<p className="text-sm text-gray-500">{visibles} registro{plural} visible{plural}</p>
			</div>
		</div>
	);
}

/** Mensaje cuando la búsqueda no devuelve resultados. */
export function CatalogoVacio({ Icono, titulo, descripcion }: { Icono: React.ComponentType<{ className?: string }>; titulo: string; descripcion: string }) {
	return (
		<div className="px-6 py-16 text-center">
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
				<Icono className="h-7 w-7" />
			</div>
			<h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
			<p className="mt-1 text-sm text-gray-500">{descripcion}</p>
		</div>
	);
}
