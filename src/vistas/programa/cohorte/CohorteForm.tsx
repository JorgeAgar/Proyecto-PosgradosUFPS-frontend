import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { createCohorte } from '../../../services/programa/programaCohorteService';
import { updateCohorte } from '../../../services/programa/programaCohorteDetalleService';
import programaDocsService from '../../../services/programa/programaDocsService';
import type { ProgramaOutletContext } from '../../../layouts/ProgramaLayout';
import { SpinnerIcon } from "../../../assets/icons";

type DocumentoRequerido = {
  idDocrequisito?: string | number;
  id?: string | number;
  nombre: string;
  obligatorio: boolean;
  origen?: 'consejo' | 'programa' | 'manual';
  seleccionado?: boolean;
  __localId?: string;
};

type InitialShape = {
  cohorteId?: string | number;
  nombre?: string;
  cupos?: number;
  fechaInicio?: string;
  fechaLimiteDocumentos?: string;
  fechaLimitePago?: string;
  documentos?: DocumentoRequerido[];
};

type FormState = {
  nombre: string;
  cupos: number | '';
  fechaInicio: string;
  fechaLimiteDocumentos: string;
  fechaLimitePago: string;
  documentos: DocumentoRequerido[];
};

function toDateInputValue(value?: string): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return value;
}

function genLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CohorteForm({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: InitialShape;
  onSaved?: () => void;
}) {
  const navigate = useNavigate();
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();

  const [form, setForm] = useState<FormState>(() => ({
    nombre: initial?.nombre ?? '',
    cupos: initial?.cupos ?? '',
    fechaInicio: toDateInputValue(initial?.fechaInicio),
    fechaLimiteDocumentos: toDateInputValue(initial?.fechaLimiteDocumentos),
    fechaLimitePago: toDateInputValue(initial?.fechaLimitePago),
    documentos: initial?.documentos?.length
      ? initial!.documentos!.map((d) => ({ ...(d as DocumentoRequerido), __localId: genLocalId() }))
      : [],
  }));
  const [loading, setLoading] = useState(false);

  const cohorteId = initial?.cohorteId;

  const [consejoDocs, setConsejoDocs] = useState<DocumentoRequerido[]>([]);
  const [programaDocs, setProgramaDocs] = useState<DocumentoRequerido[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  function validarCampos() {
    if (!form.nombre.trim()) return 'El campo "nombre" es obligatorio.';
    if (form.cupos === '' || form.cupos === null) return 'El campo "cupos" es obligatorio.';
    if (Number(form.cupos) < 0) return 'El campo "cupos" no puede ser negativo.';
    if (!form.fechaInicio) return 'Selecciona fecha de inicio.';
    if (!form.fechaLimiteDocumentos) return 'Selecciona fecha límite de documentos.';
    if (!form.fechaLimitePago) return 'Selecciona fecha límite de pago.';
    if (consejoDocs.length === 0) return 'No se pudieron cargar los documentos obligatorios del programa.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validarCampos();
    if (validation) {
      mostrarAlerta(validation, 'advertencia');
      return;
    }

    const documentosConsejo = consejoDocs.map((d) => ({
      idDocrequisito: d.id ?? d.idDocrequisito,
      nombre: d.nombre,
      ...(cohorteId ? { idCohorte: cohorteId } : {}),
    }));

    const documentosPrograma = programaDocs
      .filter((d) => d.seleccionado)
      .map((d) => ({
        idDocrequisito: d.id ?? d.idDocrequisito,
        nombre: d.nombre,
        ...(cohorteId ? { idCohorte: cohorteId } : {}),
      }));

    const payload = {
      nombre: form.nombre.trim(),
      cupos: Number(form.cupos),
      fechaInicio: form.fechaInicio,
      fechaLimiteDocumentos: form.fechaLimiteDocumentos,
      fechaLimitePago: form.fechaLimitePago,
      documentosConsejo,
      documentosPrograma,
    };

    setLoading(true);
    try {
      if (mode === 'create') {
        await createCohorte(payload);
        mostrarConfirm('Cohorte creada correctamente.');
      } else {
        if (!cohorteId) throw new Error('ID de cohorte no proporcionado para editar.');
        await updateCohorte(String(cohorteId), payload);
        mostrarConfirm('Cohorte actualizada correctamente.');
      }

      if (onSaved) onSaved();
      else navigate('/programa/cohortes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      mostrarAlerta(`${mode === 'create' ? 'Error al crear cohorte' : 'Error al actualizar cohorte'}: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  const toggleProgramaDoc = (docId: string | number) => {
    setProgramaDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, seleccionado: !d.seleccionado } : d)));
  };

  useEffect(() => {
    (async () => {
      setDocsLoading(true);
      try {
        const res = await programaDocsService.fetchRequiredDocuments();
        const consejos = (res.documentosConsejo ?? []).map((d) => ({
          id: d.id,
          nombre: d.nombre,
          obligatorio: true,
          origen: 'consejo' as const,
        }));
        const programas = (res.documentosPrograma ?? []).map((d) => ({
          id: d.id,
          nombre: d.nombre,
          obligatorio: false,
          origen: 'programa' as const,
          seleccionado: !!initial?.documentos?.some((idoc) => {
            const item = idoc as Record<string, unknown>;
            const idDoc = item.idDocrequisito ?? item.id;
            return String(idDoc) === String(d.id);
          }),
        }));
        setConsejoDocs(consejos);
        setProgramaDocs(programas);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : 'Error cargando documentos requeridos', 'error');
      } finally {
        setDocsLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.documentos]);

  const disabled = loading || docsLoading;

  return (
    <div className="p-6 bg-gray-100 min-h-full">
        <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{mode === 'create' ? 'Crear cohorte' : 'Editar cohorte'}</h2>
          <button type="button" onClick={() => navigate('/programa/inicio')} aria-label="Cerrar" className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 p-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre de la cohorte</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              disabled={disabled}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Cohorte-30 2026-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Cupos</label>
            <input
              type="number"
              min="0"
              value={form.cupos}
              onChange={(e) => setForm((f) => ({ ...f, cupos: e.target.value === '' ? '' : Number(e.target.value) }))}
              disabled={disabled}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-neutral-400">No se permiten cupos negativos.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
              disabled={disabled}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Fecha límite documentos</label>
            <input
              type="date"
              value={form.fechaLimiteDocumentos}
              onChange={(e) => setForm((f) => ({ ...f, fechaLimiteDocumentos: e.target.value }))}
              disabled={disabled}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Fecha límite pago</label>
            <input
              type="date"
              value={form.fechaLimitePago}
              onChange={(e) => setForm((f) => ({ ...f, fechaLimitePago: e.target.value }))}
              disabled={disabled}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-neutral-400 mb-2">Documentos obligatorios (Consejo)</label>
              <div className="mt-2 space-y-2">
                {docsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-400 p-3">
                    <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
                    Cargando documentos...
                  </div>
                ) : (
                  consejoDocs.map((d) => (
                    <div key={String(d.id)} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
                      <span className="text-sm font-medium text-gray-900 flex-1">{d.nombre}</span>
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">Obligatorio</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-semibold text-neutral-400 mb-2">Documentos del programa (seleccionables)</label>
              <div className="mt-2 space-y-2">
                {docsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-400 p-3">
                    <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
                    Cargando documentos...
                  </div>
                ) : (
                  programaDocs.map((d) => (
                    <label key={String(d.id)} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
                      <input type="checkbox" checked={!!d.seleccionado} onChange={() => toggleProgramaDoc(d.id!)} disabled={disabled} className="h-4 w-4" />
                      <span className="text-sm text-gray-900">{d.nombre}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/programa/inicio')}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-neutral-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />}
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear cohorte' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
