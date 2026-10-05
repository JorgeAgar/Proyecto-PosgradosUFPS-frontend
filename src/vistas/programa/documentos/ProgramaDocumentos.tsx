import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useOutletContext } from 'react-router';
import programaDocsService, { type RequiredDoc } from '../../../services/programa/programaDocsService';
import type { ProgramaOutletContext } from '../../../layouts/ProgramaLayout';
import { SpinnerIcon } from "../../../assets/icons";
import { DialogoConfirmacion } from '../../../components/Dialogo';

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProgramaDocumentos() {
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();

  const [docsPrograma, setDocsPrograma] = useState<RequiredDoc[]>([]);
  const [docsConsejo, setDocsConsejo] = useState<RequiredDoc[]>([]);
  const [cargando, setCargando] = useState(true);

  // ── Estado modal crear/editar ─────────────────────────────────────────────
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cerrandoModal, setCerrandoModal] = useState(false);
  const [docEditando, setDocEditando] = useState<RequiredDoc | null>(null);
  const [borrador, setBorrador] = useState({ nombre: '', formato: null as string | null });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  // ── Estado modal confirmar eliminar ───────────────────────────────────────
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState(false);
  const [cerrandoConfirmarEliminar, setCerrandoConfirmarEliminar] = useState(false);
  const [docAEliminar, setDocAEliminar] = useState<RequiredDoc | null>(null);
  const [docEliminadoId, setDocEliminadoId] = useState<string | number | null>(null);

  const sessionProgramaId = useMemo(() => {
    const sessionRaw = localStorage.getItem('ufps_programa_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : {};
    return String(session.programaId ?? session.userId ?? 'me');
  }, []);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const cargarDocumentos = async () => {
    setCargando(true);
    try {
      const payload = await programaDocsService.fetchRequiredDocuments();
      setDocsPrograma(payload.documentosPrograma ?? []);
      setDocsConsejo(payload.documentosConsejo ?? []);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar los documentos. Intenta de nuevo.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDocumentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionProgramaId]);

  // ── Handlers modal crear/editar ───────────────────────────────────────────

  const abrirCrear = () => {
    setDocEditando(null);
    setBorrador({ nombre: '', formato: null });
    setArchivoSeleccionado(null);
    setMostrarModal(true);
  };

  const abrirEditar = (doc: RequiredDoc) => {
    setDocEditando(doc);
    setBorrador({ nombre: doc.nombre, formato: doc.formato ?? null });
    setArchivoSeleccionado(null);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setCerrandoModal(true);
    setTimeout(() => {
      setMostrarModal(false);
      setCerrandoModal(false);
      setDocEditando(null);
      setBorrador({ nombre: '', formato: null });
      setArchivoSeleccionado(null);
    }, 170);
  };

  const handleArchivoChange = (file: File | null) => {
    setArchivoSeleccionado(file);
    if (file) setBorrador(prev => ({ ...prev, formato: file.name }));
  };

  const handleGuardar = async () => {
    const nombre = borrador.nombre.trim();
    if (!nombre) {
      mostrarAlerta('El nombre del documento es obligatorio.', 'advertencia');
      return;
    }

    setGuardando(true);
    try {
      if (docEditando) {
        await programaDocsService.updateRequiredDocument(String(docEditando.id), { nombre }, archivoSeleccionado ?? null);
      } else {
        await programaDocsService.createRequiredDocument(nombre, archivoSeleccionado ?? null);
      }
      const refreshed = await programaDocsService.fetchRequiredDocuments();
      setDocsPrograma(refreshed.documentosPrograma ?? []);
      setDocsConsejo(refreshed.documentosConsejo ?? []);
      cerrarModal();
      mostrarConfirm(docEditando ? 'Documento actualizado con éxito.' : 'Documento creado con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo guardar el documento. Intenta de nuevo.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ── Handlers modal eliminar ───────────────────────────────────────────────

  const abrirConfirmarEliminar = (doc: RequiredDoc) => {
    setDocAEliminar(doc);
    setMostrarConfirmarEliminar(true);
  };

  const cerrarConfirmarEliminar = () => {
    setCerrandoConfirmarEliminar(true);
    setTimeout(() => {
      setMostrarConfirmarEliminar(false);
      setCerrandoConfirmarEliminar(false);
      setDocAEliminar(null);
    }, 170);
  };

  const handleEliminar = async () => {
    if (!docAEliminar) return;
    const doc = docAEliminar;
    cerrarConfirmarEliminar();
    setDocEliminadoId(doc.id);
    try {
      await programaDocsService.deleteRequiredDocument(String(doc.id));
      const refreshed = await programaDocsService.fetchRequiredDocuments();
      setDocsPrograma(refreshed.documentosPrograma ?? []);
      setDocsConsejo(refreshed.documentosConsejo ?? []);
      mostrarConfirm('Documento eliminado con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo eliminar el documento. Intenta de nuevo.', 'error');
    } finally {
      setDocEliminadoId(null);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Encabezado */}
      <div className="mb-6 animate-fade-in flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documentos Requeridos</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Gestiona los documentos que los aspirantes deben entregar al programa.
          </p>
        </div>
        {!cargando && (
          <button
            onClick={abrirCrear}
            disabled={docEliminadoId !== null}
            className="animate-fade-in flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium shrink-0 self-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Agregar documento
          </button>
        )}
      </div>

      {/* Estado de carga */}
      {cargando ? (
        <div className="flex items-center justify-center py-20 animate-fade-in">
          <div className="flex items-center gap-3 text-neutral-400 text-sm">
            <SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
            Cargando documentos...
          </div>
        </div>
      ) : (
      <div className="space-y-6">

        {/* ── Sección: Documentos del Programa ──────────────────────────────── */}
        <section className="animate-fade-in-up delay-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Documentos del Programa
            </h2>
            <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">
              {docsPrograma.length}
            </span>
          </div>

          {docsPrograma.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-neutral-400">No hay documentos del programa registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docsPrograma.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${150 + idx * 60}ms` }}
                >
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{doc.nombre}</p>
                      {doc.formato && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Formato: <span className="font-medium text-gray-600">{doc.formato}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      {doc.urlformato && (
                        <a
                          href={doc.urlformato}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                        >
                          Descargar
                        </a>
                      )}
                      <button
                        onClick={() => abrirEditar(doc)}
                        disabled={docEliminadoId !== null}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => abrirConfirmarEliminar(doc)}
                        disabled={docEliminadoId !== null}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {docEliminadoId === doc.id ? (
                          <SpinnerIcon className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <TrashIcon className="h-3.5 w-3.5" />
                        )}
                        {docEliminadoId === doc.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Sección: Documentos del Consejo ───────────────────────────────── */}
        <section className="animate-fade-in-up delay-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Documentos del Consejo
            </h2>
            <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">
              {docsConsejo.length}
            </span>
          </div>

          {docsConsejo.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-neutral-400">No hay documentos del consejo registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docsConsejo.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 animate-fade-in-up"
                  style={{ animationDelay: `${200 + idx * 60}ms` }}
                >
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{doc.nombre}</p>
                      {doc.formato && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Formato: <span className="font-medium text-gray-600">{doc.formato}</span>
                        </p>
                      )}
                    </div>

                    {doc.urlformato && (
                      <div className="flex shrink-0 items-center w-full sm:w-auto justify-end">
                        <a
                          href={doc.urlformato}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                        >
                          Descargar
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      )}

      {/* ── Modal: Crear / Editar documento ─────────────────────────────────── */}
      <DialogoConfirmacion
        abierto={mostrarModal}
        cerrando={cerrandoModal}
        tamano="lg"
        titulo={docEditando ? 'Editar documento' : 'Agregar documento'}
        onCancelar={cerrarModal}
        onConfirmar={handleGuardar}
        textoConfirmar={docEditando ? 'Guardar cambios' : 'Crear documento'}
        textoProcesando={docEditando ? 'Guardando...' : 'Creando...'}
        procesando={guardando}
      >
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Nombre del documento <span className="text-red-700">*</span>
            </label>
            <input
              type="text"
              value={borrador.nombre}
              onChange={e => setBorrador(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Hoja de vida, Acta de grado..."
              disabled={guardando}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Formato */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Formato (opcional)
            </label>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
              <input
                id="modal-file-upload"
                type="file"
                className="hidden"
                onChange={e => handleArchivoChange(e.target.files?.[0] ?? null)}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={guardando}
              />
              <label
                htmlFor="modal-file-upload"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 ${guardando ? 'pointer-events-none opacity-50' : ''}`}
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Seleccionar archivo
              </label>
              <span className="text-sm text-gray-500">
                {archivoSeleccionado
                  ? archivoSeleccionado.name
                  : borrador.formato
                    ? `Actual: ${borrador.formato}`
                    : 'Sin formato adjunto'}
              </span>
            </div>
            {archivoSeleccionado && (
              <p className="mt-1.5 text-xs text-green-700 flex items-center gap-1">
                Archivo listo para subir: <span className="font-medium">{archivoSeleccionado.name}</span>
              </p>
            )}
          </div>
        </div>
      </DialogoConfirmacion>

      {/* ── Modal: Confirmar eliminar ────────────────────────────────────────── */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarEliminar}
        cerrando={cerrandoConfirmarEliminar}
        titulo="Eliminar documento"
        onCancelar={cerrarConfirmarEliminar}
        onConfirmar={handleEliminar}
        textoConfirmar="Sí, eliminar"
      >
        <p className="text-sm text-gray-700">
          ¿Está seguro de eliminar el documento{' '}
          <span className="font-semibold">"{docAEliminar?.nombre}"</span>?
          Esta acción no se puede deshacer.
        </p>
      </DialogoConfirmacion>
    </div>
  );
}
