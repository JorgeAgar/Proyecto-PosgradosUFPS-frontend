import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
	ExclamationTriangleIcon,
	HashtagIcon,
	PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/Modal';
import type { SuperadminOutletContext } from '../../layouts/SuperadminLayout';
import {
	superadminUltimosCodigosService,
	type UltimoCodigoProgramaOutput,
} from '../../services/superadmin/superadminUltimosCodigosService';
import { SpinnerIcon } from "../../assets/icons";
import { CampoBusqueda, CatalogoVacio, EncabezadoCatalogo } from '../../components/Catalogo';

type UltimoCodigoForm = {
	idPrograma: number;
	nombrePrograma: string;
	codigo: string;
};

const EMPTY_FORM: UltimoCodigoForm = {
	idPrograma: 0,
	nombrePrograma: '',
	codigo: '',
};

function sortUltimosCodigos(items: UltimoCodigoProgramaOutput[]) {
	return [...items].sort((a, b) => a.nombrePrograma.localeCompare(b.nombrePrograma, 'es', { sensitivity: 'base' }));
}

function sanitizeIntegerValue(value: string) {
	return value.replace(/\D/g, '');
}

export default function SuperadminUltimosCodigos() {
	const { mostrarAlerta, mostrarConfirm } = useOutletContext<SuperadminOutletContext>();

	const [codigos, setCodigos] = useState<UltimoCodigoProgramaOutput[]>(() => superadminUltimosCodigosService.getCachedUltimosCodigos());
	const [loading, setLoading] = useState(() => !superadminUltimosCodigosService.hasCachedUltimosCodigos());
	const [searchTerm, setSearchTerm] = useState('');

	const [showFormModal, setShowFormModal] = useState(false);
	const [editingCodigo, setEditingCodigo] = useState<UltimoCodigoProgramaOutput | null>(null);
	const [formData, setFormData] = useState<UltimoCodigoForm>(EMPTY_FORM);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const cargar = useCallback(async (forceRefresh = false) => {
		if (!forceRefresh && superadminUltimosCodigosService.hasCachedUltimosCodigos()) {
			setCodigos(sortUltimosCodigos(superadminUltimosCodigosService.getCachedUltimosCodigos()));
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const data = await superadminUltimosCodigosService.listar(forceRefresh);
			setCodigos(sortUltimosCodigos(data));
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar los últimos códigos.');
		} finally {
			setLoading(false);
		}
	}, [mostrarAlerta]);

	useEffect(() => {
		void cargar();
	}, [cargar]);

	const codigosFiltrados = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		const ordered = sortUltimosCodigos(codigos);
		if (!term) return ordered;

		return ordered.filter((item) => (
			item.nombrePrograma.toLowerCase().includes(term) ||
			String(item.codigo).includes(term) ||
			String(item.idPrograma).includes(term) ||
			String(item.id).includes(term)
		));
	}, [codigos, searchTerm]);

	const openEditModal = (codigo: UltimoCodigoProgramaOutput) => {
		setEditingCodigo(codigo);
		setFormData({
			idPrograma: codigo.idPrograma,
			nombrePrograma: codigo.nombrePrograma,
			codigo: String(codigo.codigo),
		});
		setFormError(null);
		setShowFormModal(true);
	};

	const closeFormModal = () => {
		if (submitting) return;
		setShowFormModal(false);
		setEditingCodigo(null);
		setFormError(null);
		setFormData(EMPTY_FORM);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormError(null);

		const codigo = Number(formData.codigo);
		if (!Number.isInteger(codigo) || codigo < 0) {
			setFormError('El código debe ser un número entero mayor o igual a cero.');
			return;
		}

		setSubmitting(true);
		try {
			await superadminUltimosCodigosService.actualizar({
				idPrograma: formData.idPrograma,
				codigo,
			});

			const data = await superadminUltimosCodigosService.listar(true);
			setCodigos(sortUltimosCodigos(data));
			setShowFormModal(false);
			setEditingCodigo(null);
			setFormData(EMPTY_FORM);
			mostrarConfirm('Último código actualizado con éxito.');
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al actualizar el último código.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="animate-fade-in-up max-w-2xl">
					<h1 className="text-xl font-bold text-gray-900">Últimos códigos</h1>
					<p className="text-sm text-gray-500">Ajusta el consecutivo usado para generar códigos por programa</p>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20 animate-fade-in">
					<div className="flex items-center gap-3 text-neutral-400 text-sm">
						<SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-slate-700" />
						Cargando últimos códigos...
					</div>
				</div>
			) : (
				<>
					<CampoBusqueda valor={searchTerm} onCambiar={setSearchTerm} placeholder="Buscar por programa, código o ID..." />

					<div className="animate-fade-in-up delay-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
						<EncabezadoCatalogo titulo="Consecutivos por programa" visibles={codigosFiltrados.length} />

						{codigosFiltrados.length === 0 ? (
							<CatalogoVacio Icono={HashtagIcon} titulo="No hay códigos que coincidan" descripcion="Prueba con otro programa, código o ID." />
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
									<thead className="bg-gray-50">
										<tr>
											<th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Programa</th>
											<th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID programa</th>
											<th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Último código</th>
											<th scope="col" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100 bg-white">
										{codigosFiltrados.map((item) => (
											<tr key={`${item.id}-${item.idPrograma}`} className="transition-colors hover:bg-gray-50">
												<td className="px-5 py-4">
													<p className="max-w-xl text-sm font-medium text-gray-900">{item.nombrePrograma || 'Programa sin nombre'}</p>
													<p className="mt-0.5 text-xs text-gray-400">Registro #{item.id}</p>
												</td>
												<td className="px-5 py-4 text-sm text-gray-600">{item.idPrograma}</td>
												<td className="px-5 py-4">
													<span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
														{item.codigo}
													</span>
												</td>
												<td className="px-5 py-4 text-right">
													<button
														type="button"
														onClick={() => openEditModal(item)}
														className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
													>
														<PencilSquareIcon className="h-4 w-4" />
														Editar
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</>
			)}

			<Modal
				isOpen={showFormModal}
				onClose={closeFormModal}
				title={editingCodigo ? 'Editar último código' : 'Último código'}
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
						<label className="mb-1 block text-sm font-medium text-gray-700">Programa</label>
						<input
							type="text"
							value={formData.nombrePrograma}
							readOnly
							className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-700 outline-none"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Último código</label>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={formData.codigo}
							onChange={(e) => setFormData((current) => ({ ...current, codigo: sanitizeIntegerValue(e.target.value) }))}
							disabled={submitting}
							className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Ej. 120"
						/>
						<p className="mt-1 text-xs text-gray-400">Solo se permiten números enteros.</p>
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
