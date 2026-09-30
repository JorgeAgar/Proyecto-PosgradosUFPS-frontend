import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { ArrowLeftIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { createCohorte, fetchSemestresDisponibles, fetchModalidadesDisponibles, type NuevaCohortePayload, type SemestreItem, type ModalidadItem } from '../../../services/programa/programaCohorteService';
import { fetchCriteriosPrograma, type CriterioEvaluacion } from '../../../services/programa/programaCriteriosService';
import programaDocsService, { type RequiredDoc } from '../../../services/programa/programaDocsService';
import type { ProgramaOutletContext } from '../../../layouts/ProgramaLayout';
import { DatePicker } from '../../../components/DatePicker';
import { Select, type SelectOption } from '../../../components/Select';
import { SpinnerIcon } from "../../../assets/icons";
import { DialogoConfirmacion } from '../../../components/Dialogo';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const brandedError = error as Error & { body?: unknown; status?: number };
    const body = brandedError.body;
    const status = brandedError.status;
    if (body && typeof body === 'object') {
      const bodyRecord = body as Record<string, unknown>;
      if (status === 409) {
        if (typeof bodyRecord.message === 'string' && bodyRecord.message.trim()) return bodyRecord.message.trim();
        if (typeof bodyRecord.mensaje === 'string' && bodyRecord.mensaje.trim()) return bodyRecord.mensaje.trim();
        if (typeof bodyRecord.error === 'string' && bodyRecord.error.trim()) return bodyRecord.error.trim();
      }
      if (typeof bodyRecord.message === 'string' && bodyRecord.message.trim()) return bodyRecord.message.trim();
      if (typeof bodyRecord.mensaje === 'string' && bodyRecord.mensaje.trim()) return bodyRecord.mensaje.trim();
    }

    return error.message.trim() || 'No se pudo crear la cohorte.';
  }

  if (typeof error === 'string' && error.trim()) return error.trim();

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
    if (typeof record.mensaje === 'string' && record.mensaje.trim()) return record.mensaje.trim();
  }

  return 'No se pudo crear la cohorte.';
}

export default function CrearCohorte({ onSaved, onBack }: { onSaved?: () => void; onBack?: () => void | Promise<void> }) {
  const navigate = useNavigate();
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();

  const [consejoDocs, setConsejoDocs] = useState<RequiredDoc[]>([]);
  const [programaDocs, setProgramaDocs] = useState<RequiredDoc[]>([]);
  const [criteriosPrograma, setCriteriosPrograma] = useState<CriterioEvaluacion[]>([]);
  const [semestres, setSemestres] = useState<SemestreItem[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mostrarConfirmarCrear, setMostrarConfirmarCrear] = useState(false);
  const [cerrandoConfirmarCrear, setCerrandoConfirmarCrear] = useState(false);
  const [nombre, setNombre] = useState('');
  const [cuposStr, setCuposStr] = useState('');
  const [idSemestre, setIdSemestre] = useState<string>('');
  const [idModalidad, setIdModalidad] = useState<string>('');
  const [selectedProgramaDocIds, setSelectedProgramaDocIds] = useState<string[]>([]);
  const [selectedCriterios, setSelectedCriterios] = useState<Array<{ id?: string | number; nombre: string; peso: number | undefined }>>([]);
  // Nuevos campos de fechas
  const [fechaInicioDocumentacion, setFechaInicioDocumentacion] = useState('');
  const [fechaFinDocumentacion, setFechaFinDocumentacion] = useState('');
  const [fechaInicioInscripcion, setFechaInicioInscripcion] = useState('');
  const [fechaFinInscripcion, setFechaFinInscripcion] = useState('');
  const [fechaInicioPago, setFechaInicioPago] = useState('');
  const [fechaFinPago, setFechaFinPago] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setSelectedProgramaDocIds([]);
        setSelectedCriterios([]);
        setIdSemestre('');
        setIdModalidad('');
        const res = await programaDocsService.fetchRequiredDocuments();
        if (!mounted) return;
        setConsejoDocs(res.documentosConsejo ?? []);
        setProgramaDocs(res.documentosPrograma ?? []);
        try {
          const semestreList = await fetchSemestresDisponibles();
          if (!mounted) return;
          setSemestres(semestreList);
        } catch (err) {
          console.error('Error cargando semestres', err);
          if (mounted) mostrarAlerta(err instanceof Error ? err.message : 'No se pudieron cargar los semestres disponibles.', 'error');
        }
        try {
          const modalidadList = await fetchModalidadesDisponibles();
          if (!mounted) return;
          setModalidades(modalidadList);
        } catch (err) {
          console.error('Error cargando modalidades', err);
          if (mounted) mostrarAlerta(err instanceof Error ? err.message : 'No se pudieron cargar las modalidades disponibles.', 'error');
        }
        try {
          const cr = await fetchCriteriosPrograma();
          if (!mounted) return;
          setCriteriosPrograma(cr ?? []);
        } catch (err) {
          console.error('Error cargando criterios del programa', err);
          if (mounted) mostrarAlerta(err instanceof Error ? err.message : 'No se pudieron cargar los criterios del programa.', 'error');
        }
      } catch (err) {
        console.error('Error cargando documentos requeridos', err);
        if (mounted) mostrarAlerta(err instanceof Error ? err.message : 'No se pudieron cargar los documentos requeridos.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPeso = useMemo(() => selectedCriterios.reduce((sum, criterio) => sum + (Number(criterio.peso) || 0), 0), [selectedCriterios]);

  const disabled = loading || saving;

  const toggleProgramaDoc = (docId: string, checked: boolean) => {
    setSelectedProgramaDocIds((prev) => {
      if (checked) return prev.includes(docId) ? prev : [...prev, docId];
      return prev.filter((current) => current !== docId);
    });
  };

  const toggleCriterio = (criterio: CriterioEvaluacion, checked: boolean) => {
    const criterioId = String(criterio.id ?? criterio.nombre);
    setSelectedCriterios((prev) => {
      if (checked) {
        if (prev.some((current) => String(current.id ?? current.nombre) === criterioId)) return prev;
        return [...prev, { id: criterio.id, nombre: criterio.nombre, peso: criterio.peso ?? 0 }];
      }
      return prev.filter((current) => String(current.id ?? current.nombre) !== criterioId);
    });
  };

  const setPesoCriterio = (criterioId: string | number, peso: number | undefined) => {
    setSelectedCriterios((prev) => prev.map((criterio) => (String(criterio.id ?? criterio.nombre) === String(criterioId) ? { ...criterio, peso } : criterio)));
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/programa/cohortes');
  };

  const cerrarModalCrear = () => {
    setCerrandoConfirmarCrear(true);
    setTimeout(() => {
      setMostrarConfirmarCrear(false);
      setCerrandoConfirmarCrear(false);
    }, 170);
  };

  const handleSaveSolicitar = () => {
    if (!nombre.trim()) {
      mostrarAlerta('Ingresa el nombre de la cohorte.', 'advertencia');
      return;
    }
    if (idSemestre === '') {
      mostrarAlerta('Selecciona un semestre para la cohorte.', 'advertencia');
      return;
    }
    if (idModalidad === '') {
      mostrarAlerta('Selecciona una modalidad para la cohorte.', 'advertencia');
      return;
    }
    if (selectedCriterios.length === 0) {
      mostrarAlerta('Selecciona al menos un criterio para continuar.', 'advertencia');
      return;
    }
    if (selectedCriterios.some((c) => c.peso === undefined)) {
      mostrarAlerta('Todos los criterios seleccionados deben tener un puntaje asignado.', 'advertencia');
      return;
    }
    if (totalPeso !== 100) {
      mostrarAlerta('La suma de los puntos de criterios debe ser exactamente 100.', 'advertencia');
      return;
    }
    setMostrarConfirmarCrear(true);
  };

  const handleSaveAction = async () => {
    cerrarModalCrear();
    setSaving(true);
    try {
      const body: NuevaCohortePayload = {
        nombre: nombre.trim(),
        idSemestre,
        idModalidad,
        cupos: cuposStr === '' ? 0 : parseInt(cuposStr, 10),
        fechaInicioDocumentacion: fechaInicioDocumentacion || undefined,
        fechaFinDocumentacion: fechaFinDocumentacion || undefined,
        fechaInicioInscripcion: fechaInicioInscripcion || undefined,
        fechaFinInscripcion: fechaFinInscripcion || undefined,
        fechaInicioPago: fechaInicioPago || undefined,
        fechaFinPago: fechaFinPago || undefined,
        documentosConsejo: consejoDocs.map((doc) => ({ idDocrequisito: doc.id, nombre: doc.nombre })),
        documentosPrograma: programaDocs
          .filter((doc) => selectedProgramaDocIds.includes(String(doc.id)))
          .map((doc) => ({ idDocrequisito: doc.id, nombre: doc.nombre })),
        criteriosCohorte: selectedCriterios.map((criterio) => ({ idCriterio: criterio.id, pesoSnapshot: criterio.peso ?? 0, idCohorte: 0 })),
      };

      await createCohorte(body);
      mostrarConfirm('Cohorte creada correctamente.');
      if (onSaved) onSaved();
      else navigate('/programa/cohortes');
    } catch (err) {
      console.error(err);
      mostrarAlerta(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="">
        <button type="button" onClick={handleBack} className="flex items-center gap-2 text-red-700 hover:text-red-800 mb-6 transition-colors animate-fade-in">
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="font-medium">Volver a Cohortes</span>
        </button>

        <div className="flex items-center justify-between mb-6 animate-fade-in delay-75">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nueva cohorte</h1>
            <p className="text-sm text-neutral-500">Configura datos básicos, documentos y criterios antes de crearla.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 animate-fade-in-up delay-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la cohorte</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={disabled}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Cohorte-20 2026-1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cupos</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={cuposStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) setCuposStr(val);
                }}
                disabled={disabled}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <Select
              id="semestre"
              label="Semestre"
              value={idSemestre}
              onChange={setIdSemestre}
              options={semestres.map((s): SelectOption => ({ value: String(s.id), label: s.nombre }))}
              disabled={disabled}
            />

            <Select
              id="modalidad"
              label="Modalidad"
              value={idModalidad}
              onChange={setIdModalidad}
              options={modalidades.map((m): SelectOption => ({ value: String(m.id), label: m.nombre }))}
              disabled={disabled}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Fechas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">

              <div className="col-span-full">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Inscripción</p>
              </div>

              <DatePicker
                id="fechaInicioInscripcion"
                label="Fecha inicio de inscripción"
                value={fechaInicioInscripcion}
                onChange={setFechaInicioInscripcion}
              />

              <DatePicker
                id="fechaFinInscripcion"
                label="Fecha límite de inscripción"
                value={fechaFinInscripcion}
                onChange={setFechaFinInscripcion}
              />

              <div className="col-span-full mt-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Documentos</p>
              </div>

              <DatePicker
                id="fechaInicioDocumentacion"
                label="Fecha inicio de cargue de documentos"
                value={fechaInicioDocumentacion}
                onChange={setFechaInicioDocumentacion}
              />

              <DatePicker
                id="fechaFinDocumentacion"
                label="Fecha límite de cargue de documentos"
                value={fechaFinDocumentacion}
                onChange={setFechaFinDocumentacion}
              />

              <div className="col-span-full mt-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Pago</p>
              </div>

              <DatePicker
                id="fechaInicioPago"
                label="Fecha inicio de pago de inscripción"
                value={fechaInicioPago}
                onChange={setFechaInicioPago}
              />

              <DatePicker
                id="fechaFinPago"
                label="Fecha límite de pago de inscripción"
                value={fechaFinPago}
                onChange={setFechaFinPago}
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Documentos requeridos</h2>
            </div>

            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-neutral-50 p-4 flex items-center gap-3 text-sm text-neutral-500">
                <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" />
                Cargando documentos...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Documentos del Consejo</div>
                  <div className="space-y-2">
                    {consejoDocs.length > 0 ? (
                      consejoDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 border-l-4 border-l-red-200">
                          <DocumentTextIcon className="w-5 h-5 text-neutral-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{doc.nombre}</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">Obligatorio</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-neutral-500">No hay documentos del consejo disponibles.</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Documentos del Programa</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {programaDocs.length > 0 ? (
                      programaDocs.map((doc) => {
                        const checked = selectedProgramaDocIds.includes(String(doc.id));
                        return (
                          <label key={doc.id} className="flex items-center gap-3 rounded-lg border border-transparent p-3 bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 cursor-pointer border-l-4 border-l-gray-100">
                            <input type="checkbox" checked={checked} onChange={(e) => toggleProgramaDoc(String(doc.id), e.target.checked)} disabled={disabled} className="h-4 w-4" />
                            <DocumentTextIcon className="w-5 h-5 text-neutral-400" />
                            <span className="text-sm text-gray-900">{doc.nombre}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-sm text-neutral-500">No hay documentos del programa disponibles.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Criterios de evaluación</h2>
              <span className={`text-xs font-semibold rounded-lg px-2.5 py-1 border ${totalPeso === 100 || selectedCriterios.length === 0 ? 'text-neutral-600 bg-neutral-100 border-neutral-200' : 'text-red-700 bg-red-100 border-red-200'}`}>
                {selectedCriterios.length > 0 ? `${totalPeso} / 100` : 'Sin criterios seleccionados'}
              </span>
            </div>

            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-neutral-50 p-4 flex items-center gap-3 text-sm text-neutral-500">
                <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" />
                Cargando criterios...
              </div>
            ) : (
              <div className="space-y-2">
                {criteriosPrograma.length > 0 ? (
                  criteriosPrograma.map((criterio) => {
                    const criterioId = criterio.id ?? criterio.nombre;
                    const selected = selectedCriterios.some((current) => String(current.id ?? current.nombre) === String(criterioId));
                    const local = selectedCriterios.find((current) => String(current.id ?? current.nombre) === String(criterioId));
                    return (
                      <div
                        key={String(criterioId)}
                        className="flex flex-col gap-3 p-3 rounded-lg border border-transparent bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 border-l-4 border-l-indigo-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={selected} onChange={(e) => toggleCriterio(criterio, e.target.checked)} disabled={disabled} className="h-4 w-4" />
                            <SparklesIcon className="w-5 h-5 text-indigo-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{criterio.nombre}</div>
                              <div className="text-xs text-neutral-500">Peso sugerido: {criterio.peso ?? 0}</div>
                            </div>
                          </label>

                          {selected && (
                            <div className="w-28">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={local?.peso !== undefined ? local.peso : ''}
                                placeholder="-"
                                onChange={(e) => setPesoCriterio(criterioId, e.target.value === '' ? undefined : Number(e.target.value))}
                                disabled={disabled}
                                className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-neutral-500">No hay criterios definidos para este programa.</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={disabled}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveSolicitar}
              disabled={disabled || selectedCriterios.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              <span>{saving ? 'Creando...' : 'Crear cohorte'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <DialogoConfirmacion
      abierto={mostrarConfirmarCrear}
      cerrando={cerrandoConfirmarCrear}
      titulo="Confirmar creación"
      onCancelar={cerrarModalCrear}
      onConfirmar={handleSaveAction}
      textoConfirmar="Sí, crear cohorte"
      textoProcesando="Creando..."
      procesando={saving}
    >
      <p className="text-sm text-gray-700">¿Está seguro de crear la cohorte <strong>"{nombre}"</strong>?</p>
    </DialogoConfirmacion>
    </>
  );
}
