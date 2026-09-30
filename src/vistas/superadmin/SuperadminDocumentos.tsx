import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
	DocumentTextIcon,
	ExclamationTriangleIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/Modal';
import type { SuperadminOutletContext } from '../../layouts/SuperadminLayout';
import {
	superadminDocumentosService,
	type DocumentoConsejoOutput,
} from '../../services/superadmin/superadminDocumentosService';
import { SpinnerIcon } from "../../assets/icons";
import { CampoBusqueda, CatalogoVacio, EncabezadoCatalogo } from '../../components/Catalogo';

type DocumentoForm = {
	id: number;
	nombre: string;
	tamanomaximo: string;
	formato: File | null;
	formatoActualUrl: string | null;
	formatoEliminado: boolean;
};

const EMPTY_FORM: DocumentoForm = {
	id: 0,
	nombre: '',
	tamanomaximo: '',
	formato: null,
	formatoActualUrl: null,
	formatoEliminado: false,
};

function sortDocumentos(items: DocumentoConsejoOutput[]) {
	return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }) || a.id - b.id);
}

function formatSizeLabel(value: number) {
	return `${new Intl.NumberFormat('es-CO').format(value)} MB`;
}

function sanitizeIntegerValue(value: string) {
	return value.replace(/\D+/g, '');
}

function abrirFormato(url: string) {
	window.open(url, '_blank', 'noopener,noreferrer');
}

export default function SuperadminDocumentos() {
	const { mostrarAlerta, mostrarConfirm } = useOutletContext<SuperadminOutletContext>();

	const [documentos, setDocumentos] = useState<DocumentoConsejoOutput[]>(() => superadminDocumentosService.getCachedDocumentos());
	const [loading, setLoading] = useState(() => !superadminDocumentosService.hasCachedDocumentos());
	const [searchTerm, setSearchTerm] = useState('');

	const [showFormModal, setShowFormModal] = useState(false);
	const [editingDocumento, setEditingDocumento] = useState<DocumentoConsejoOutput | null>(null);
	const [formData, setFormData] = useState<DocumentoForm>(EMPTY_FORM);
	const formatoInputRef = useRef<HTMLInputElement | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [documentoToDelete, setDocumentoToDelete] = useState<DocumentoConsejoOutput | null>(null);
	const [deleting, setDeleting] = useState(false);

	const cargar = useCallback(async (forceRefresh = false) => {
		if (superadminDocumentosService.hasCachedDocumentos()) {
			if (!forceRefresh) {
				setDocumentos(sortDocumentos(superadminDocumentosService.getCachedDocumentos()));
				setLoading(false);
				return;
			}
		}

		setLoading(true);
		try {
			const data = await superadminDocumentosService.listar(forceRefresh);
			setDocumentos(sortDocumentos(data));
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar los documentos.');
		} finally {
			setLoading(false);
		}
	}, [mostrarAlerta]);

	useEffect(() => {
		void cargar();
	}, [cargar]);

	const documentosOrdenados = useMemo(() => sortDocumentos(documentos), [documentos]);
	const documentosFiltrados = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return documentosOrdenados;
		return documentosOrdenados.filter((item) => (
			item.nombre.toLowerCase().includes(term) ||
			String(item.tamanomaximo).includes(term) ||
			String(item.id).includes(term)
		));
	}, [searchTerm, documentosOrdenados]);

	const openCreateModal = () => {
		setEditingDocumento(null);
		setFormData(EMPTY_FORM);
		setFormError(null);
		if (formatoInputRef.current) {
			formatoInputRef.current.value = '';
		}
		setShowFormModal(true);
	};

	const openEditModal = (documento: DocumentoConsejoOutput) => {
		setEditingDocumento(documento);
		setFormData({
			id: documento.id,
			nombre: documento.nombre,
			tamanomaximo: String(documento.tamanomaximo),
			formato: null,
			formatoActualUrl: documento.urlformato ?? null,
			formatoEliminado: false,
		});
		setFormError(null);
		if (formatoInputRef.current) {
			formatoInputRef.current.value = '';
		}
		setShowFormModal(true);
	};

	const closeFormModal = () => {
		if (submitting) return;
		setShowFormModal(false);
		setEditingDocumento(null);
		setFormError(null);
		setFormData(EMPTY_FORM);
		if (formatoInputRef.current) {
			formatoInputRef.current.value = '';
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormError(null);
		const selectedFormat = formatoInputRef.current?.files?.[0] ?? formData.formato;

		if (!formData.nombre.trim()) {
			setFormError('El nombre del documento es obligatorio.');
			return;
		}

		const tamanomaximo = Number(sanitizeIntegerValue(formData.tamanomaximo));
		if (!Number.isFinite(tamanomaximo) || tamanomaximo < 0) {
			setFormError('El tamaño máximo debe ser un número válido.');
			return;
		}

		if (selectedFormat && selectedFormat.type !== 'application/pdf' && !selectedFormat.name.toLowerCase().endsWith('.pdf')) {
			setFormError('El formato debe ser un archivo PDF.');
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				nombre: formData.nombre.trim(),
				tamanomaximo,
			};

			if (editingDocumento) {
				await superadminDocumentosService.actualizar(
					{
						...payload,
						id: editingDocumento.id,
						...(selectedFormat ? {} : { urlformato: formData.formatoEliminado ? null : formData.formatoActualUrl ?? undefined }),
					},
					selectedFormat,
				);
			} else {
				await superadminDocumentosService.crear(payload, selectedFormat);
			}
			setShowFormModal(false);
			setEditingDocumento(null);
			setFormData(EMPTY_FORM);
			await cargar(true);
			mostrarConfirm(editingDocumento ? 'Documento actualizado con éxito.' : 'Documento creado con éxito.');
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al guardar el documento.');
		} finally {
			setSubmitting(false);
		}
	};

	const openDeleteModal = (documento: DocumentoConsejoOutput) => {
		setDocumentoToDelete(documento);
		setShowDeleteModal(true);
	};

	const closeDeleteModal = () => {
		if (deleting) return;
		setShowDeleteModal(false);
		setDocumentoToDelete(null);
	};

	const confirmDelete = async () => {
		if (!documentoToDelete) return;
		setDeleting(true);
		try {
			await superadminDocumentosService.eliminar(documentoToDelete.id);
			setShowDeleteModal(false);
			setDocumentoToDelete(null);
			await cargar();
			mostrarConfirm('Documento eliminado con éxito.');
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al eliminar el documento.');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="animate-fade-in-up max-w-2xl">
					<h1 className="text-xl font-bold text-gray-900">Documentos del consejo</h1>
					<p className="text-sm text-gray-500">Crea, modifica o elimina los documentos requeridos del sistema</p>
				</div>

				{!loading && (
					<button
						type="button"
						onClick={openCreateModal}
						className="animate-fade-in inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
					>
						<PlusIcon className="h-4 w-4" />
						Nuevo documento
					</button>
				)}
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20 animate-fade-in">
					<div className="flex items-center gap-3 text-neutral-400 text-sm">
						<SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-slate-700" />
						Cargando documentos...
					</div>
				</div>
			) : (
				<>
					<CampoBusqueda valor={searchTerm} onCambiar={setSearchTerm} placeholder="Buscar por nombre, tamaño o ID..." />

					<div className="animate-fade-in-up delay-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
						<EncabezadoCatalogo titulo="Catálogo de documentos" visibles={documentosFiltrados.length} />

						{documentosFiltrados.length === 0 ? (
							<CatalogoVacio Icono={DocumentTextIcon} titulo="No hay documentos que coincidan" descripcion="Prueba con otro nombre, tamaño o ID." />
						) : (
							<div className="divide-y divide-gray-100">
								{documentosFiltrados.map((documento, idx) => (
									<div key={documento.id} className={`animate-fade-in-up delay-${Math.min((idx + 3) * 100, 800)} px-5 py-4 transition-colors hover:bg-gray-50`}>
										<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
											<div className="min-w-0 flex-1">
												<div className="mb-2 flex flex-wrap items-center gap-2">
													<span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
														{documento.nombre}
													</span>
													<span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-500">
														ID {documento.id}
													</span>
												</div>
												<div className="grid gap-4 md:grid-cols-2">
													<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
														<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Nombre</p>
														<p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-gray-700">{documento.nombre}</p>
													</div>
													<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
														<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Tamaño máximo</p>
														<p className="text-sm font-medium leading-6 text-gray-700">{formatSizeLabel(documento.tamanomaximo)}</p>
													</div>
												</div>
											</div>

											<div className="flex shrink-0 flex-wrap items-center gap-2">
												{documento.urlformato && (
													<button
														type="button"
														onClick={() => abrirFormato(documento.urlformato ?? '')}
														className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
													>
														<DocumentTextIcon className="h-4 w-4" />
														Ver formato
													</button>
												)}
												<button
													type="button"
													onClick={() => openEditModal(documento)}
													className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
												>
													<PencilSquareIcon className="h-4 w-4" />
													Editar
												</button>
												<button
													type="button"
													onClick={() => openDeleteModal(documento)}
													className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
												>
													<TrashIcon className="h-4 w-4" />
													Eliminar
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</>
			)}

			<Modal
				isOpen={showFormModal}
				onClose={closeFormModal}
				title={editingDocumento ? 'Editar documento' : 'Nuevo documento'}
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
						<label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
						<input
							type="text"
							value={formData.nombre}
							onChange={(e) => setFormData((current) => ({ ...current, nombre: e.target.value }))}
							disabled={submitting}
							className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Ej. Certificado médico"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Tamaño máximo (MB)</label>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={formData.tamanomaximo}
							onChange={(e) => setFormData((current) => ({ ...current, tamanomaximo: sanitizeIntegerValue(e.target.value) }))}
							disabled={submitting}
							className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Ej. 5"
						/>
						<p className="mt-1 text-xs text-gray-400">Solo se permiten números enteros en megabytes.</p>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Formato PDF</label>
						<input
							type="file"
							accept="application/pdf,.pdf"
								ref={formatoInputRef}
								onChange={(e) => setFormData((current) => ({ ...current, formato: e.target.files?.[0] ?? null, formatoEliminado: false }))}
							disabled={submitting}
							className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:border-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<p className="mt-1 text-xs text-gray-400">Opcional. Este archivo se envía aparte del tamaño máximo.</p>
							{editingDocumento && formData.formatoActualUrl && !formData.formato && !formData.formatoEliminado && (
							<div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
								<div>
									<p className="font-medium">Este documento ya tiene un formato cargado.</p>
									<p className="text-emerald-700/80">Si no seleccionas otro archivo, se conservará el formato actual.</p>
								</div>
									<div className="flex shrink-0 items-center gap-2">
										<button
											type="button"
											onClick={() => abrirFormato(formData.formatoActualUrl ?? '')}
											className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
										>
											Ver formato
										</button>
										<button
											type="button"
											onClick={() => {
												setFormData((current) => ({ ...current, formato: null, formatoEliminado: true }));
												if (formatoInputRef.current) {
													formatoInputRef.current.value = '';
												}
											}}
											className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 transition-colors hover:bg-red-50"
										>
											Eliminar formato
										</button>
									</div>
							</div>
						)}
							{editingDocumento && formData.formatoEliminado && !formData.formato && (
								<div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
									<p className="font-medium">El formato se eliminará al guardar.</p>
									<p className="text-red-700/80">Si no seleccionas un archivo nuevo, el documento quedará sin formato.</p>
								</div>
							)}
						{formData.formato && (
							<p className="mt-1 text-xs font-medium text-slate-600">Archivo seleccionado: {formData.formato.name}</p>
						)}
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

			<Modal
				isOpen={showDeleteModal}
				onClose={closeDeleteModal}
				title="Eliminar documento"
				size="md"
			>
				<div className="space-y-4">
					<p className="text-sm text-gray-600">
						{documentoToDelete
							? `¿Seguro que deseas eliminar el documento "${documentoToDelete.nombre}"? Esta acción no se puede deshacer.`
							: '¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer.'}
					</p>

					<div className="flex items-center justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={closeDeleteModal}
							disabled={deleting}
							className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={confirmDelete}
							disabled={deleting}
							className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{deleting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
							Eliminar
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
