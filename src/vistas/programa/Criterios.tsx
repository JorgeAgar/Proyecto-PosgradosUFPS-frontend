import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  InformationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
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
import { BOTON_SECUNDARIO, Dialogo, DialogoConfirmacion } from '../../components/Dialogo';
import Paginacion from '../../components/Paginacion';

const CAMPO = 'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed';

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
          <Paginacion pagina={pagina} porPagina={POR_PAGINA} totalElementos={criterios.length} onCambiar={setPagina} etiqueta="criterios" />
        </div>
        )}
      </div>

      <DialogoConfirmacion
        abierto={deleteConfirm !== null}
        cerrando={deleteConfirmClosing}
        titulo="Confirmar eliminación"
        onCerrar={closeDeleteConfirm}
        cerrarDeshabilitado={deleting}
        onCancelar={closeDeleteConfirm}
        onConfirmar={confirmDelete}
        textoConfirmar="Eliminar"
        textoProcesando="Eliminando..."
        procesando={deleting}
      >
        <p className="text-sm text-gray-700">
          ¿Estás seguro de eliminar el criterio <span className="font-semibold text-gray-900">"{deleteConfirm?.criterioNombre}"</span>?
        </p>
      </DialogoConfirmacion>

      <Dialogo
        abierto={warningModal !== null}
        cerrando={warningModalClosing}
        titulo={warningModal?.title}
        onCerrar={closeWarningModal}
        pie={
          <button type="button" onClick={closeWarningModal} className={BOTON_SECUNDARIO}>
            Cerrar
          </button>
        }
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-sky-100 p-2 text-sky-700 shrink-0">
            <InformationCircleIcon className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-700">{warningModal?.message}</p>
        </div>
      </Dialogo>

      <DialogoConfirmacion
        abierto={modalOpen}
        cerrando={modalClosing}
        tamano="lg"
        titulo={modalMode === 'create' ? 'Nuevo criterio' : 'Editar criterio'}
        onCerrar={closeModal}
        cerrarDeshabilitado={modalSubmitting}
        onCancelar={closeModal}
        onConfirmar={handleSubmitModal}
        textoConfirmar={modalMode === 'create' ? 'Agregar criterio' : 'Guardar cambios'}
        textoProcesando={modalMode === 'create' ? 'Agregando...' : 'Guardando...'}
        procesando={modalSubmitting}
      >
        {modalError && <div className="mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">{modalError}</div>}

        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre del criterio</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            disabled={modalSubmitting}
            placeholder="Ej: Experiencia profesional"
            className={CAMPO}
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
            className={`${CAMPO} resize-none`}
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
            className={CAMPO}
          />
        </div>
      </DialogoConfirmacion>
    </div>
  );
}
