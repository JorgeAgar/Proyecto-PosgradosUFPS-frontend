import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
	ArrowPathIcon,
	CalendarDaysIcon,
	ExclamationTriangleIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/Modal';
import type { SuperadminOutletContext } from '../../layouts/SuperadminLayout';
import {
	superadminSemestresService,
	type EstadoOutput,
	type SemestreOutput,
} from '../../services/superadmin/superadminSemestresService';
import { SelectSA } from './components/SelectSA';
import { DatePickerSA } from './components/DatePickerSA';
import { SpinnerIcon } from "../../assets/icons";

type SemestreForm = {
	id?: number;
	nombre: string;
	fechaInicio: string;
	fechaFin: string;
	idEstado: number | '';
};

const EMPTY_FORM: SemestreForm = {
	nombre: '',
	fechaInicio: '',
	fechaFin: '',
	idEstado: '',
};

function formatDateLabel(value: string) {
	if (!value) return 'Sin fecha';
	const parsed = new Date(`${value}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return value;
	return new Intl.DateTimeFormat('es-CO', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(parsed);
}

function getEstadoLabel(estado: SemestreOutput['estado'], fallback?: EstadoOutput) {
	if (!estado) {
		return fallback ? `${fallback.tipo}${fallback.entidad ? ` · ${fallback.entidad}` : ''}` : 'Sin estado';
	}
	if (typeof estado === 'string') return estado;
	return estado.tipo || estado.entidad || 'Sin estado';
}

function getEstadoStyle(label: string) {
	const normalized = label.toLowerCase();
	if (normalized.includes('activo') || normalized.includes('vigente')) {
		return 'bg-green-100 text-green-700 border-green-200';
	}
	if (normalized.includes('pendiente') || normalized.includes('programad')) {
		return 'bg-amber-100 text-amber-700 border-amber-200';
	}
	if (normalized.includes('inactivo') || normalized.includes('cerrad') || normalized.includes('finaliz')) {
		return 'bg-red-100 text-red-700 border-red-200';
	}
	return 'bg-gray-100 text-gray-700 border-gray-200';
}

function sortSemestres(items: SemestreOutput[]) {
	return [...items].sort((a, b) => (b.fechainicio || '').localeCompare(a.fechainicio || '') || b.id - a.id);
}

export default function SuperadminSemestres() {
	const { mostrarAlerta, mostrarConfirm } = useOutletContext<SuperadminOutletContext>();

	const [semestres, setSemestres] = useState<SemestreOutput[]>([]);
	const [estados, setEstados] = useState<EstadoOutput[]>([]);
	const [loading, setLoading] = useState(true);

	const [showFormModal, setShowFormModal] = useState(false);
	const [editingSemestre, setEditingSemestre] = useState<SemestreOutput | null>(null);
	const [formData, setFormData] = useState<SemestreForm>(EMPTY_FORM);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [semestreToDelete, setSemestreToDelete] = useState<SemestreOutput | null>(null);
	const [deleting, setDeleting] = useState(false);

	const cargar = useCallback(async () => {
		setLoading(true);
		try {
			const [listaSemestres, listaEstados] = await Promise.all([
				superadminSemestresService.listar(),
				superadminSemestresService.listarEstados(),
			]);
			setSemestres(sortSemestres(listaSemestres));
			setEstados(listaEstados);
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar los semestres.');
		} finally {
			setLoading(false);
		}
	}, [mostrarAlerta]);

	useEffect(() => {
		void cargar();
	}, [cargar]);

	const estadoMap = useMemo(() => new Map(estados.map((estado) => [estado.id, estado])), [estados]);
	const semestresOrdenados = useMemo(() => sortSemestres(semestres), [semestres]);
	const semestreReciente = semestresOrdenados[0] ?? null;

	const totalSemestres = semestres.length;

	const openCreateModal = () => {
		setEditingSemestre(null);
		setFormData({ ...EMPTY_FORM, idEstado: estados[0]?.id ?? '' });
		setFormError(null);
		setShowFormModal(true);
	};

	const openEditModal = (semestre: SemestreOutput) => {
		setEditingSemestre(semestre);
		setFormData({
			id: semestre.id,
			nombre: semestre.nombre,
			fechaInicio: semestre.fechainicio,
			fechaFin: semestre.fechafin,
			idEstado: semestre.idEstado,
		});
		setFormError(null);
		setShowFormModal(true);
	};

	const closeFormModal = () => {
		if (submitting) return;
		setShowFormModal(false);
		setEditingSemestre(null);
		setFormError(null);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormError(null);

		if (!formData.nombre.trim()) {
			setFormError('El nombre del semestre es obligatorio.');
			return;
		}
		if (!formData.fechaInicio) {
			setFormError('La fecha de inicio es obligatoria.');
			return;
		}
		if (!formData.fechaFin) {
			setFormError('La fecha de fin es obligatoria.');
			return;
		}
		if (formData.idEstado === '') {
			setFormError('Selecciona un estado.');
			return;
		}
		if (formData.fechaFin < formData.fechaInicio) {
			setFormError('La fecha de fin no puede ser anterior a la fecha de inicio.');
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				nombre: formData.nombre.trim(),
				fechaInicio: formData.fechaInicio,
				fechaFin: formData.fechaFin,
				idEstado: formData.idEstado as number,
			};

			if (editingSemestre) {
				await superadminSemestresService.actualizar({ ...payload, id: editingSemestre.id });
			} else {
				await superadminSemestresService.crear(payload);
			}
			setShowFormModal(false);
			setEditingSemestre(null);
			await cargar();
			mostrarConfirm(editingSemestre ? 'Semestre actualizado con éxito.' : 'Semestre creado con éxito.');
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al guardar el semestre.');
		} finally {
			setSubmitting(false);
		}
	};

	const openDeleteModal = (semestre: SemestreOutput) => {
		setSemestreToDelete(semestre);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (!semestreToDelete) return;
		setDeleting(true);
		try {
			await superadminSemestresService.eliminar(semestreToDelete.id);
			setShowDeleteModal(false);
			setSemestreToDelete(null);
			await cargar();
			mostrarConfirm('Semestre eliminado con éxito.');
		} catch (err) {
			mostrarAlerta(err instanceof Error ? err.message : 'Error al eliminar el semestre.');
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="animate-fade-in-up max-w-2xl">
					<h1 className="text-xl font-bold text-gray-900">Gestión de Semestres</h1>
					<p className="text-sm text-gray-500">Crea, ajusta o elimina semestres</p>
				</div>

				{!loading && (
					<button
						type="button"
						onClick={openCreateModal}
						className="animate-fade-in inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
					>
						<PlusIcon className="h-4 w-4" />
						Nuevo semestre
					</button>
				)}
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20 animate-fade-in">
					<div className="flex items-center gap-3 text-neutral-400 text-sm">
						<SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-slate-700" />
						Cargando semestres...
					</div>
				</div>
			) : (
			<>

			<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="animate-fade-in-up delay-100 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-slate-50 p-2 text-slate-700">
							<CalendarDaysIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total semestres</p>
							<p className="text-2xl font-bold text-gray-900">{totalSemestres}</p>
						</div>
					</div>
				</div>

				<div className="animate-fade-in-up delay-200 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-amber-50 p-2 text-amber-700">
							<ArrowPathIcon className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Más reciente</p>
							<p className="truncate text-sm font-semibold text-gray-900">{semestreReciente?.nombre ?? 'Sin semestres'}</p>
							<p className="text-xs text-gray-500">{semestreReciente ? formatDateLabel(semestreReciente.fechainicio) : 'Se mostrará aquí al crear uno nuevo'}</p>
						</div>
					</div>
				</div>
			</div>

			<div className="animate-fade-in-up delay-300 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
					<div>
						<h2 className="text-base font-semibold text-gray-900">Listado de semestres</h2>
						<p className="text-sm text-gray-500">{totalSemestres} registro{totalSemestres === 1 ? '' : 's'} disponible{totalSemestres === 1 ? '' : 's'}</p>
					</div>
					<button
						type="button"
						onClick={cargar}
						disabled={loading}
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" /> : <ArrowPathIcon className="h-4 w-4" />}
						Recargar
					</button>
				</div>

				{semestresOrdenados.length === 0 ? (
					<div className="px-6 py-16 text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
							<CalendarDaysIcon className="h-7 w-7" />
						</div>
						<h3 className="text-lg font-semibold text-gray-900">Aún no hay semestres registrados</h3>
						<p className="mt-1 text-sm text-gray-500">Crea el primer semestre para empezar a organizar las cohortes.</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100">
						{semestresOrdenados.map((semestre) => {
							const estado = estadoMap.get(semestre.idEstado);
							const estadoLabel = getEstadoLabel(semestre.estado, estado);
							const estadoDescripcion = estado ? `${estado.tipo}${estado.entidad ? ` · ${estado.entidad}` : ''}` : estadoLabel;

							return (
								<div key={semestre.id} className="px-5 py-4 transition-colors hover:bg-gray-50">
									<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
										<div className="min-w-0 flex-1">
											<div className="mb-2 flex flex-wrap items-center gap-2">
												<h3 className="truncate text-base font-semibold text-gray-900">{semestre.nombre}</h3>
												<span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getEstadoStyle(estadoLabel)}`}>
													{estadoLabel}
												</span>
											</div>
											<div className="grid grid-cols-1 gap-2 text-sm text-gray-500 md:grid-cols-2">
												<div>
													<span className="font-medium text-gray-700">Inicio:</span> {formatDateLabel(semestre.fechainicio)}
												</div>
												<div>
													<span className="font-medium text-gray-700">Fin:</span> {formatDateLabel(semestre.fechafin)}
												</div>
												<div className="md:col-span-2">
													<span className="font-medium text-gray-700">Estado asociado:</span> {estadoDescripcion || 'Sin estado'}
												</div>
											</div>
										</div>

										<div className="flex shrink-0 items-center gap-2">
											<button
												type="button"
												onClick={() => openEditModal(semestre)}
												className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
											>
												<PencilIcon className="h-4 w-4" />
												Editar
											</button>
											<button
												type="button"
												onClick={() => openDeleteModal(semestre)}
												className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
											>
												<TrashIcon className="h-4 w-4" />
												Borrar
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			</> /* fin loading ? ... : <> */
			)}

			<Modal
				isOpen={showFormModal}
				onClose={closeFormModal}
				title={editingSemestre ? 'Editar semestre' : 'Nuevo semestre'}
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
							onChange={(event) => setFormData((current) => ({ ...current, nombre: event.target.value }))}
							disabled={submitting}
							className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Ej. 2026-1"
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<DatePickerSA
							id="fechaInicio"
							label="Fecha de inicio"
							value={formData.fechaInicio}
							onChange={(v) => setFormData((c) => ({ ...c, fechaInicio: v }))}
							disabled={submitting}
						/>
						<DatePickerSA
							id="fechaFin"
							label="Fecha de fin"
							value={formData.fechaFin}
							onChange={(v) => setFormData((c) => ({ ...c, fechaFin: v }))}
							disabled={submitting}
						/>
					</div>

					<SelectSA
						id="estadoSemestre"
						label="Estado"
						value={String(formData.idEstado)}
						onChange={(v) => setFormData((c) => ({ ...c, idEstado: v === '' ? '' : Number(v) }))}
						options={estados.map((e) => ({ value: String(e.id), label: e.tipo + (e.entidad ? ` · ${e.entidad}` : '') }))}
						disabled={submitting}
					/>

					<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={closeFormModal}
							disabled={submitting}
							className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{submitting ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />Guardando...</> : editingSemestre ? 'Actualizar semestre' : 'Crear semestre'}
						</button>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={showDeleteModal}
				onClose={() => {
					if (!deleting) {
						setShowDeleteModal(false);
						setSemestreToDelete(null);
					}
				}}
				title="Borrar semestre"
				size="sm"
			>
				<div className="space-y-4">
					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						<ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
						<div>
							<p className="font-medium">Esta acción eliminará el semestre seleccionado.</p>
							<p className="mt-1 text-amber-700">{semestreToDelete?.nombre}</p>
						</div>
					</div>

					<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={() => {
								if (!deleting) {
									setShowDeleteModal(false);
									setSemestreToDelete(null);
								}
							}}
							disabled={deleting}
							className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={confirmDelete}
							disabled={deleting}
							className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{deleting ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />Borrando...</> : 'Borrar semestre'}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
