import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
	ExclamationTriangleIcon,
	MagnifyingGlassIcon,
	PencilSquareIcon,
	TagIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/Modal';
import type { SuperadminOutletContext } from '../../layouts/SuperadminLayout';
import {
	superadminGlobalesService,
	type ValorGlobalOutput,
} from '../../services/superadmin/superadminGlobalesService';
import { SpinnerIcon } from "../../assets/icons";

type ValorGlobalForm = {
	id: number;
	clave: string;
	valor: string;
};

const EMPTY_FORM: ValorGlobalForm = {
	id: 0,
	clave: '',
	valor: '',
};

function sortValoresGlobales(items: ValorGlobalOutput[]) {
	return [...items].sort((a, b) => a.clave.localeCompare(b.clave, 'es', { sensitivity: 'base' }));
}

function formatValuePreview(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return 'Sin valor';
	if (trimmed.length <= 160) return trimmed;
	return `${trimmed.slice(0, 157)}...`;
}

function sanitizeDecimalValue(value: string) {
	const trimmed = value.trim().replace(',', '.');
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

function getUnidadValorGlobal(clave: string) {
	const normalized = clave.trim().toUpperCase().replace(/[\s-]+/g, '_');

	if (normalized === 'VALOR_INSCRIPCION') return 'SMMLV';
	if (normalized === 'TAMANO_MAXIMO_ARCHIVOS') return 'MB';
	if (normalized === 'SALARIO_MINIMO') return 'COP';
	return '';
}

export default function SuperadminValoresGlobales() {
	const { mostrarAlerta, mostrarConfirm } = useOutletContext<SuperadminOutletContext>();

	const [valores, setValores] = useState<ValorGlobalOutput[]>(() => superadminGlobalesService.getCachedValoresGlobales());
	const [loading, setLoading] = useState(() => !superadminGlobalesService.hasCachedValoresGlobales());
	const [searchTerm, setSearchTerm] = useState('');

	const [showFormModal, setShowFormModal] = useState(false);
	const [editingValor, setEditingValor] = useState<ValorGlobalOutput | null>(null);
	const [formData, setFormData] = useState<ValorGlobalForm>(EMPTY_FORM);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const cargar = useCallback(async () => {
		if (superadminGlobalesService.hasCachedValoresGlobales()) {
			setValores(sortValoresGlobales(superadminGlobalesService.getCachedValoresGlobales()));
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const data = await superadminGlobalesService.listar();
			setValores(sortValoresGlobales(data));
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar los valores globales.');
		} finally {
			setLoading(false);
		}
	}, [mostrarAlerta]);

	useEffect(() => {
		void cargar();
	}, [cargar]);

	const valoresOrdenados = useMemo(() => sortValoresGlobales(valores), [valores]);
	const valoresFiltrados = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return valoresOrdenados;
		return valoresOrdenados.filter((item) => (
			item.clave.toLowerCase().includes(term) ||
			item.valor.toLowerCase().includes(term) ||
			String(item.id).includes(term)
		));
	}, [searchTerm, valoresOrdenados]);

	const openEditModal = (valor: ValorGlobalOutput) => {
		setEditingValor(valor);
		setFormData({
			id: valor.id,
			clave: valor.clave,
			valor: valor.valor,
		});
		setFormError(null);
		setShowFormModal(true);
	};

	const closeFormModal = () => {
		if (submitting) return;
		setShowFormModal(false);
		setEditingValor(null);
		setFormError(null);
		setFormData(EMPTY_FORM);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormError(null);

		if (!formData.clave.trim()) {
			setFormError('La clave es obligatoria.');
			return;
		}

		setSubmitting(true);
		try {
			const clave = formData.clave.trim();
			const valor = sanitizeDecimalValue(formData.valor);

			if (!valor) {
				setFormError('El valor debe contener solo números decimales.');
				return;
			}

			await superadminGlobalesService.actualizar({
				id: formData.id,
				clave,
				valor,
			});
			setShowFormModal(false);
			setEditingValor(null);
			setFormData(EMPTY_FORM);
			await cargar();
			mostrarConfirm('Valor global actualizado con éxito.');
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al actualizar el valor global.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="animate-fade-in-up max-w-2xl">
					<h1 className="text-xl font-bold text-gray-900">Valores globales</h1>
					<p className="text-sm text-gray-500">Ajusta la configuración clave-valor del sistema</p>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20 animate-fade-in">
					<div className="flex items-center gap-3 text-neutral-400 text-sm">
						<SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-slate-700" />
						Cargando valores globales...
					</div>
				</div>
			) : (
			<>

			<div className="animate-fade-in-up delay-100 mb-5">
				<div className="relative">
					<span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
						<MagnifyingGlassIcon className="h-5 w-5" />
					</span>
					<input
						type="text"
						placeholder="Buscar por clave, valor o ID..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
					/>
				</div>
			</div>

			<div className="animate-fade-in-up delay-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-base font-semibold text-gray-900">Catálogo de configuración</h2>
						<p className="text-sm text-gray-500">{valoresFiltrados.length} registro{valoresFiltrados.length === 1 ? '' : 's'} visible{valoresFiltrados.length === 1 ? '' : 's'}</p>
					</div>
				</div>

				{valoresFiltrados.length === 0 ? (
					<div className="px-6 py-16 text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
							<TagIcon className="h-7 w-7" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900">No hay valores que coincidan</h3>
						<p className="mt-1 text-sm text-gray-500">Prueba con otra clave, valor o ID.</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100">
						{valoresFiltrados.map((item) => (
							<div key={item.id} className="px-5 py-4 transition-colors hover:bg-gray-50">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="min-w-0 flex-1">
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
												{item.clave}
											</span>
										</div>
										<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
											<div className="mb-2 flex flex-wrap items-center gap-2">
												<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</p>
												{getUnidadValorGlobal(item.clave) && (
													<span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
														{getUnidadValorGlobal(item.clave)}
													</span>
												)}
											</div>
											<div className="flex flex-wrap items-baseline gap-2">
												<p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-700">
													{formatValuePreview(item.valor)}
												</p>
												{getUnidadValorGlobal(item.clave) && (
													<span className="text-sm font-medium text-gray-500">
														{getUnidadValorGlobal(item.clave)}
													</span>
												)}
											</div>
										</div>
									</div>

									<div className="flex shrink-0 items-center gap-2">
										<button
											type="button"
											onClick={() => openEditModal(item)}
											className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
										>
											<PencilSquareIcon className="h-4 w-4" />
											Editar
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			</> /* fin loading ? ... : <> */
			)}

			<Modal
				isOpen={showFormModal}
				onClose={closeFormModal}
				title={editingValor ? 'Editar valor global' : 'Valor global'}
				size="lg"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					{formError && (
						<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							<ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
							<span>{formError}</span>
						</div>
					)}

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Clave</label>
						<input
							type="text"
							value={formData.clave}
							readOnly
							className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400"
							placeholder="La clave se define por el sistema"
						/>
						<p className="mt-1 text-xs text-gray-400">La clave se define por el sistema y no se puede cambiar.</p>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Valor</label>
						<div className="mt-1 flex overflow-hidden rounded-lg border border-gray-300 bg-white transition hover:border-gray-400 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
							<input
								type="text"
								inputMode="decimal"
								pattern="[0-9]*[.,]?[0-9]*"
								value={formData.valor}
								onChange={(e) => setFormData((current) => ({ ...current, valor: sanitizeDecimalValue(e.target.value) }))}
								disabled={submitting}
								className="block min-w-0 flex-1 border-0 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
								placeholder="Ej. 2000.50"
							/>
							{getUnidadValorGlobal(formData.clave) && (
								<span className="flex shrink-0 items-center border-l border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-500">
									{getUnidadValorGlobal(formData.clave)}
								</span>
							)}
						</div>
						<p className="mt-1 text-xs text-gray-400">Solo se permiten números decimales, sin unidades ni sufijos.</p>
					</div>

					<div className="flex items-center justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={closeFormModal}
							disabled={submitting}
							className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{submitting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
							Guardar cambios
						</button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
