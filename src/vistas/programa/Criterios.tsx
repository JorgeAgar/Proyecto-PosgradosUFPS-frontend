import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  createCriterioPrograma,
  deleteCriterioPrograma,
  fetchCriteriosPrograma,
  updateCriterioPrograma,
  type CriterioEvaluacion,
  type CriterioPayload,
} from '../../services/programa/programaCriteriosService';
import type { ProgramaOutletContext } from '../../layouts/ProgramaLayout';
import { SpinnerIcon } from "../../assets/icons";

type ModalMode = 'create' | 'edit';

type DeleteConfirmState = {
  criterioId: string;
  criterioNombre: string;
} | null;

const EMPTY_FORM: CriterioPayload = {
  nombre: '',
  descripcion: '',
  peso: 0,
};

const POR_PAGINA = 10;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export default function Criterios() {
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();

  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [deleteConfirmClosing, setDeleteConfirmClosing] = useState(false);
  const [warningModal, setWarningModal] = useState<{ title: string; message: string } | null>(null);
  const [warningModalClosing, setWarningModalClosing] = useState(false);

  const [criterios, setCriterios] = useState<CriterioEvaluacion[]>([]);
  const [pagina, setPagina] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CriterioPayload>(EMPTY_FORM);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCriteriosPrograma();
        setCriterios(data && Array.isArray(data) && data.length > 0 ? data : []);
      } catch (err) {
        console.error(err);
        mostrarAlerta(err instanceof Error ? err.message : 'No se pudieron cargar los criterios del programa.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (criterio: CriterioEvaluacion) => {
    setModalMode('edit');
    setEditingId(criterio.id);
    setForm({ nombre: criterio.nombre, descripcion: criterio.descripcion, peso: criterio.peso });
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setModalClosing(false);
      setModalError(null);
      setForm(EMPTY_FORM);
      setEditingId(null);
    }, 170);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmClosing(true);
    setTimeout(() => {
      setDeleteConfirm(null);
      setDeleteConfirmClosing(false);
    }, 170);
  };

  const closeWarningModal = () => {
    setWarningModalClosing(true);
    setTimeout(() => {
      setWarningModal(null);
      setWarningModalClosing(false);
    }, 170);
  };

  const handleDelete = async (criterioId: string) => {
    const target = criterios.find((c) => c.id === criterioId);
    if (!target) return;
    setDeleteConfirm({ criterioId, criterioNombre: target.nombre });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);

    try {
      await deleteCriterioPrograma(deleteConfirm.criterioId);
      setCriterios((prev) => prev.filter((c) => c.id !== deleteConfirm.criterioId));
      const nombre = deleteConfirm.criterioNombre;
      closeDeleteConfirm();
      mostrarConfirm(`El criterio "${nombre}" fue eliminado correctamente.`);
    } catch (err) {
      console.error(err);
      let code: string | undefined;
      let backendMessage: string | undefined;
      if (isObject(err)) {
        const maybeBody = (err as { body?: unknown }).body;
        if (isObject(maybeBody)) {
          if (typeof maybeBody.code === 'string') code = maybeBody.code;
          if (typeof maybeBody.message === 'string') backendMessage = maybeBody.message;
        }
      }
      const errMessage = err instanceof Error ? err.message : undefined;
      closeDeleteConfirm();
      if (code === 'CRITERIO_CON_ASPIRANTES_CALIFICADOS' || (typeof errMessage === 'string' && errMessage.toLowerCase().includes('aspirantes calificados'))) {
        setWarningModal({ title: 'No se puede eliminar', message: backendMessage || errMessage || 'El criterio no se puede eliminar porque hay aspirantes calificados.' });
      } else {
        mostrarAlerta(err instanceof Error ? err.message : 'No se pudo eliminar el criterio. Intenta nuevamente.', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitModal = async () => {
    setModalError(null);

    if (!form.nombre.trim() || !form.descripcion.trim() || form.peso <= 0) {
      setModalError('Completa todos los campos y usa un peso mayor a 0.');
      return;
    }

    try {
      setModalSubmitting(true);
      if (modalMode === 'create') {
        const created = await createCriterioPrograma(form);
        setCriterios((prev) => [...prev, created]);
        closeModal();
        mostrarConfirm(`Se agregó "${created.nombre}" correctamente.`);
      } else if (editingId) {
        const updated = await updateCriterioPrograma(editingId, form);
        setCriterios((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        closeModal();
        mostrarConfirm(`Se guardaron los cambios de "${updated.nombre}".`);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : undefined;
      setModalError(errMsg || 'No se pudo guardar el criterio. Intenta nuevamente.');
      mostrarAlerta(errMsg || 'No se pudo guardar el criterio. Revisa los datos e intenta nuevamente.', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const totalPaginas = Math.ceil(criterios.length / POR_PAGINA);
  const criteriosPagina = criterios.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Criterios de evaluación</h1>
            <p className="text-sm text-neutral-400 mt-1">Criterios del programa</p>
          </div>
          {!loading && (
            <button
              onClick={openCreateModal}
              className="animate-fade-in flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Nuevo criterio
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-red-700" />
              Cargando criterios...
            </div>
          </div>
        ) : (

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in-up delay-200">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-neutral-200 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-400">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-400">Descripción</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-400">Puntaje máximo</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {criterios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-neutral-400">No hay criterios definidos para este programa.</td>
                </tr>
              ) : (
                criteriosPagina.map((criterio) => (
                  <tr key={criterio.id} className="hover:bg-neutral-200 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{criterio.nombre}</td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{criterio.descripcion}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-red-700">{criterio.peso}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(criterio)}
                          className="p-2 text-neutral-400 hover:text-red-700 hover:bg-neutral-200 rounded-lg transition-colors"
                          title="Editar criterio"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(criterio.id)}
                          className="p-2 text-neutral-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar criterio"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, criterios.length)} de {criterios.length} criterios
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina((p) => p - 1)}
                  disabled={pagina === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-sm font-medium text-gray-600 px-1">{pagina} / {totalPaginas}</span>
                <button
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina === totalPaginas}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                >
                  Siguiente
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {deleteConfirm && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${deleteConfirmClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${deleteConfirmClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            <div className="p-6 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-700">
                <TrashIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Confirmar eliminación</div>
                <div className="mt-1 text-sm text-gray-600">¿Estás seguro de eliminar el criterio <span className="font-semibold text-gray-900">"{deleteConfirm?.criterioNombre}"</span>?</div>
              </div>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="rounded-full p-1 transition hover:bg-black/5 text-gray-500 disabled:opacity-60"
                aria-label="Cerrar confirmación"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pb-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-neutral-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {warningModal && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${warningModalClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
          <div className={`bg-white rounded-lg border border-sky-200 shadow-xl max-w-md w-full mx-4 ${warningModalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            <div className="p-6 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-sky-100 p-2 text-sky-700">
                <InformationCircleIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{warningModal.title}</div>
                <div className="mt-1 text-sm text-gray-600">{warningModal.message}</div>
              </div>
              <button
                type="button"
                onClick={closeWarningModal}
                className="rounded-full p-1 transition hover:bg-black/5 text-gray-500"
                aria-label="Cerrar advertencia"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={closeWarningModal}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 text-sm font-medium hover:bg-neutral-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${modalClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full mx-4 ${modalClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{modalMode === 'create' ? 'Nuevo criterio' : 'Editar criterio'}</h3>
              <button onClick={closeModal} disabled={modalSubmitting} className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-400 disabled:opacity-60">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {modalError && <div className="mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">{modalError}</div>}

              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre del criterio</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  disabled={modalSubmitting}
                  placeholder="Ej: Experiencia profesional"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  disabled={modalSubmitting}
                  placeholder="Describe qué se evalúa en este criterio..."
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="mb-1">
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Puntaje máximo</label>
                <input
                  type="number"
                  min="0"
                  value={form.peso || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, peso: Number(e.target.value) || 0 }))}
                  disabled={modalSubmitting}
                  placeholder="0"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={modalSubmitting}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitModal}
                disabled={modalSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {modalSubmitting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
                {modalMode === 'create' ? (modalSubmitting ? 'Agregando...' : 'Agregar criterio') : (modalSubmitting ? 'Guardando...' : 'Guardar cambios')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
