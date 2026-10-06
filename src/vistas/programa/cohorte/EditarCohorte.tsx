import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router';
import { DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { CohorteDetalle, DocumentoCohorte, CriterioItem } from '../../../services/programa/programaCohorteDetalleService';
import { fetchSemestresDisponibles, fetchModalidadesDisponibles, type SemestreItem, type ModalidadItem } from '../../../services/programa/programaCohorteService';
import type { CriterioEvaluacion } from '../../../services/programa/programaCriteriosService';
import { fetchCriteriosPrograma } from '../../../services/programa/programaCriteriosService';
import programaDocsService, { type RequiredDoc } from '../../../services/programa/programaDocsService';
import type { ProgramaOutletContext } from '../../../layouts/ProgramaLayout';
import { DatePicker } from '../../../components/DatePicker';
import { Select, type SelectOption } from '../../../components/Select';
import { SpinnerIcon } from "../../../assets/icons";
import { DialogoConfirmacion } from '../../../components/Dialogo';
import { mensajeErrorCohorte } from './mensajeErrorCohorte';

function genLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeDocName(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

function normalizeCriterionKey(value: string | number | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function criterionMatchesProgramId(
  criterion: { id?: string | number; idCriterioevaluacion?: string | number; nombre: string },
  programCriterionId: string | number
) {
  return normalizeCriterionKey(criterion.idCriterioevaluacion ?? criterion.id) === normalizeCriterionKey(programCriterionId);
}

type LocalDocumento = DocumentoCohorte & { __localId?: string };

/** Cambios de una cohorte que se envían al guardar. */
export type SavePayload = Partial<{
  cupos: number;
  idSemestre: number | string;
  idModalidad: number | string;
  nombre: string;
  activa: boolean;
  fechaInicioDocumentacion?: string;
  fechaFinDocumentacion?: string;
  fechaInicioInscripcion?: string;
  fechaFinInscripcion?: string;
  fechaInicioPago?: string;
  fechaFinPago?: string;
  documentosConsejo: { idDocrequisito?: string | number; idCohorte?: string | number; nombre?: string }[];
  documentosPrograma: { idDocrequisito?: string | number; idCohorte?: string | number; nombre?: string }[];
  criteriosCohorte: { id?: string | number; idCriterio?: string | number; pesoSnapshot?: number }[];
}>;

export default function EditarCohorte({
  cohorte,
  onCancel,
  onSaved,
  onSavedConfirmed,
  availableCriterios: parentCriterios,
}: {
  cohorte: CohorteDetalle;
  onCancel: () => void;
  onSaved: (payload: SavePayload) => Promise<void> | void;
  onSavedConfirmed?: () => Promise<void> | void;
  availableCriterios?: CriterioEvaluacion[];
}) {
  const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

  const [isSaving, setIsSaving] = useState(false);
  const [editClosing, setEditClosing] = useState(false);
  const [mostrarConfirmarGuardar, setMostrarConfirmarGuardar] = useState(false);
  const [cerrandoConfirmarGuardar, setCerrandoConfirmarGuardar] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [availableCriteriosState, setAvailableCriteriosState] = useState<CriterioEvaluacion[] | undefined>(
    parentCriterios && parentCriterios.length > 0 ? parentCriterios : undefined
  );
  const [availableConsejoDocs, setAvailableConsejoDocs] = useState<RequiredDoc[]>([]);
  const [availableProgramaDocs, setAvailableProgramaDocs] = useState<RequiredDoc[]>([]);
  const [availableSemestres, setAvailableSemestres] = useState<SemestreItem[]>([]);
  const [availableModalidades, setAvailableModalidades] = useState<ModalidadItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingCriterios, setIsLoadingCriterios] = useState(false);
  const [isLoadingSemestres, setIsLoadingSemestres] = useState(false);
  const [isLoadingModalidades, setIsLoadingModalidades] = useState(false);
  const [criterioError, setCriterioError] = useState<string | null>(null);
  const criterioIdMapRef = useRef<Record<string, string | number>>({});
  const onSavedConfirmedRef = useRef(onSavedConfirmed);
  onSavedConfirmedRef.current = onSavedConfirmed;
  const [editedData, setEditedData] = useState<CohorteDetalle>(() => ({
    ...cohorte,
    documentos: (cohorte.documentos ?? []).map((d: DocumentoCohorte & Partial<{ __localId: string }>) => ({
      ...(d as LocalDocumento),
      __localId: (d as LocalDocumento).__localId ?? genLocalId(),
    })),
  } as CohorteDetalle));
  const [cuposStr, setCuposStr] = useState(() =>
    cohorte.cupos !== undefined ? String(cohorte.cupos) : ''
  );

  useEffect(() => {
    setEditClosing(false);
    setIsLoadingInitialData(true);
    setIsLoadingDocs(true);
    setIsLoadingCriterios(true);
    setIsLoadingSemestres(true);
    setIsLoadingModalidades(true);
    setCriterioError(null);
    setAvailableCriteriosState(parentCriterios && parentCriterios.length > 0 ? parentCriterios : undefined);
    setAvailableConsejoDocs([]);
    setAvailableProgramaDocs([]);
    setAvailableSemestres([]);
    setAvailableModalidades([]);
    criterioIdMapRef.current = {};
    setCuposStr(cohorte.cupos !== undefined ? String(cohorte.cupos) : '');
    setEditedData({
      ...cohorte,
      documentos: (cohorte.documentos ?? []).map((d: DocumentoCohorte & Partial<{ __localId: string }>) => ({
        ...(d as LocalDocumento),
        __localId: (d as LocalDocumento).__localId ?? genLocalId(),
      })),
    } as CohorteDetalle);
  }, [cohorte, parentCriterios]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const semestreList = await fetchSemestresDisponibles();
        if (!mounted) return;
        setAvailableSemestres(semestreList);

        const modalidadList = await fetchModalidadesDisponibles();
        if (!mounted) return;
        setAvailableModalidades(modalidadList);

        const cr = await fetchCriteriosPrograma();
        if (!mounted) return;

        const resolved = cr ?? [];

        criterioIdMapRef.current = (cohorte.criterios ?? []).reduce<Record<string, string | number>>((acc, crit) => {
          const programKey = normalizeCriterionKey(crit.idCriterioevaluacion ?? crit.id);
          if (programKey) acc[programKey] = crit.id ?? crit.idCriterioevaluacion ?? programKey;
          return acc;
        }, {});

        setAvailableCriteriosState(resolved);

        setEditedData((prev) => {
          const selected = (cohorte.criterios ?? []).map((crit) => {
            const match = resolved.find((r) => criterionMatchesProgramId(crit, r.id));
            return match
              ? {
                  id: crit.id ?? criterioIdMapRef.current[normalizeCriterionKey(match.id)] ?? criterioIdMapRef.current[normalizeCriterionKey(crit.idCriterioevaluacion ?? crit.id)],
                  idCriterioevaluacion: match.id,
                  nombre: match.nombre,
                  peso: crit.peso ?? match.peso,
                }
              : { ...crit };
          });

          return { ...prev, criterios: selected } as CohorteDetalle;
        });

        setIsLoadingDocs(true);
        const res = await programaDocsService.fetchRequiredDocuments();
        if (!mounted) return;

        const consejo = (res.documentosConsejo ?? [])
          .map((d) => ({ id: d.id, nombre: (d.nombre ?? '').toString() }))
          .filter((doc) => doc.nombre.trim().length > 0);
        const programa = (res.documentosPrograma ?? [])
          .map((d) => ({ id: d.id, nombre: (d.nombre ?? '').toString() }))
          .filter((doc) => doc.nombre.trim().length > 0);

        setAvailableConsejoDocs(consejo);
        setAvailableProgramaDocs(programa);

        setEditedData((prev) => {
          const byName = new Map<string, DocumentoCohorte & { __localId?: string }>();

          (prev.documentos ?? []).forEach((doc) => {
            const nombre = (doc.nombre ?? '').toString().trim();
            if (nombre) {
              byName.set(normalizeDocName(nombre), {
                nombre,
                obligatorio: Boolean(doc.obligatorio),
                __localId: (doc as LocalDocumento).__localId ?? genLocalId(),
              });
            }
          });

          (cohorte.documentosAsignados?.documentosConsejo ?? []).forEach((pa) => {
            const match = consejo.find((d) => String(d.id) === String(pa.idDocrequisito ?? pa.id));
            const nombre = match ? String(match.nombre ?? '').trim() : String(pa.nombre ?? '').trim();
            if (nombre && !byName.has(normalizeDocName(nombre))) {
              byName.set(normalizeDocName(nombre), {
                nombre,
                obligatorio: true,
                __localId: genLocalId(),
              });
            }
          });

          (cohorte.documentosAsignados?.documentosPrograma ?? []).forEach((pa) => {
            const match = programa.find((d) => String(d.id) === String(pa.idDocrequisito ?? pa.id));
            const nombre = match ? String(match.nombre ?? '').trim() : String(pa.nombre ?? '').trim();
            if (nombre && !byName.has(normalizeDocName(nombre))) {
              byName.set(normalizeDocName(nombre), {
                nombre,
                obligatorio: false,
                __localId: genLocalId(),
              });
            }
          });

          return { ...prev, documentos: Array.from(byName.values()) } as CohorteDetalle;
        });
      } catch (err) {
        console.error('Error cargando datos de edición', err);
      } finally {
        if (mounted) {
          setIsLoadingDocs(false);
          setIsLoadingCriterios(false);
          setIsLoadingSemestres(false);
          setIsLoadingModalidades(false);
          setIsLoadingInitialData(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [cohorte, parentCriterios]);

  const selectedDocsMap = useMemo(() => {
    const selected = new Set((editedData.documentos ?? []).map((doc) => normalizeDocName(doc.nombre ?? '')));
    return [...availableConsejoDocs, ...availableProgramaDocs].reduce<Record<string, boolean>>((acc, doc) => {
      acc[doc.nombre] = selected.has(normalizeDocName(doc.nombre));
      return acc;
    }, {});
  }, [availableConsejoDocs, availableProgramaDocs, editedData.documentos]);

  const findSelectedCriterion = useCallback(
    (criterion: { id?: string | number; nombre: string }) =>
      (editedData.criterios ?? []).find((selected) => criterionMatchesProgramId(selected, criterion.id ?? '')),
    [editedData.criterios]
  );

  const totalPeso = useMemo(
    () => (editedData.criterios ?? []).reduce((s, c: CriterioItem) => s + (Number(c.peso ?? 0) || 0), 0),
    [editedData.criterios]
  );

  const selectedCriteriosCount = (editedData.criterios ?? []).length;

  useEffect(() => {
    if ((editedData.criterios ?? []).length > 0) {
      if ((editedData.criterios ?? []).some((c: CriterioItem) => c.peso === undefined))
        setCriterioError('Todos los criterios seleccionados deben tener un puntaje asignado.');
      else if (totalPeso > 100) setCriterioError('La suma de los puntos de criterios no puede ser mayor a 100.');
      else if (totalPeso < 100) setCriterioError('La suma de los puntos de criterios debe ser exactamente 100.');
      else setCriterioError(null);
    } else {
      setCriterioError(null);
    }
  }, [totalPeso, editedData.criterios]);

  const setDocumentoSeleccion = (nombre: string, checked: boolean) => {
    const normalized = normalizeDocName(nombre);
    setEditedData((prev) => {
      const documentos = [...(prev.documentos ?? [])];
      const index = documentos.findIndex((doc) => normalizeDocName(doc.nombre ?? '') === normalized);

      if (checked && index === -1) {
        documentos.push({ nombre, obligatorio: false, __localId: genLocalId() } as LocalDocumento);
      }

      if (!checked && index !== -1) {
        documentos.splice(index, 1);
      }

      return { ...prev, documentos };
    });
  };

  const toggleCriterioSeleccion = (c: CriterioEvaluacion, checked: boolean) => {
    const programKey = normalizeCriterionKey(c.id);
    setEditedData((prev) => {
      const criterios = [...(prev.criterios ?? [])];
      const index = criterios.findIndex((it: CriterioItem) => criterionMatchesProgramId(it, c.id));
      if (checked && index === -1) {
        criterios.push({
          id: criterioIdMapRef.current[programKey],
          idCriterioevaluacion: c.id,
          nombre: c.nombre,
          peso: c.peso,
        });
      }
      if (!checked && index !== -1) {
        criterios.splice(index, 1);
      }
      return { ...prev, criterios } as CohorteDetalle;
    });
  };

  const setPesoCriterio = (criterioId: string | number, peso: number | undefined) => {
    setEditedData((prev) => ({
      ...prev,
      criterios: (prev.criterios ?? []).map((c: CriterioItem) =>
        criterionMatchesProgramId(c, criterioId) ? { ...c, peso } : c
      ),
    } as CohorteDetalle));
  };

  const isLoading = isLoadingInitialData || isLoadingDocs || isLoadingCriterios || isLoadingSemestres || isLoadingModalidades;
  const disabled = isSaving || isLoading;

  const handleSave = useCallback(async () => {
    const documentosSincronizados = (editedData.documentos ?? []).map((doc) => ({ ...doc, nombre: (doc.nombre ?? '').trim() }));
    const documentosConsejo = documentosSincronizados
      .filter((doc) => availableConsejoDocs.some((available) => normalizeDocName(available.nombre) === normalizeDocName(doc.nombre ?? '')))
      .map((doc) => ({
        id: cohorte.documentosAsignados?.documentosConsejo?.find((pa) => String(pa.idDocrequisito ?? pa.id) === String(availableConsejoDocs.find((available) => normalizeDocName(available.nombre) === normalizeDocName(doc.nombre ?? ''))?.id))?.id,
        idDocrequisito: availableConsejoDocs.find((available) => normalizeDocName(available.nombre) === normalizeDocName(doc.nombre ?? ''))?.id,
        idCohorte: cohorte.id,
        nombre: doc.nombre,
      }));
    const documentosPrograma = documentosSincronizados
      .filter((doc) => availableProgramaDocs.some((available) => normalizeDocName(available.nombre) === normalizeDocName(doc.nombre ?? '')))
      .map((doc) => ({
        id: cohorte.documentosAsignados?.documentosPrograma?.find((pa) => String(pa.idDocrequisito ?? pa.id) === String(availableProgramaDocs.find((available) => normalizeDocName(available.nombre) === normalizeDocName(doc.nombre ?? ''))?.id))?.id,
        idDocrequisito: availableProgramaDocs.find((available) => normalizeDocName(available.nombre) === normalizeDocName(doc.nombre ?? ''))?.id,
        idCohorte: cohorte.id,
        nombre: doc.nombre,
      }));

    if (Number(editedData.cupos) < 0) {
      mostrarAlerta('Los cupos no pueden ser negativos.', 'advertencia');
      return;
    }
    if (editedData.idSemestre === undefined || editedData.idSemestre === null || editedData.idSemestre === '') {
      mostrarAlerta('Selecciona un semestre para la cohorte.', 'advertencia');
      return;
    }
    if (editedData.idModalidad === undefined || editedData.idModalidad === null || editedData.idModalidad === '') {
      mostrarAlerta('Selecciona una modalidad para la cohorte.', 'advertencia');
      return;
    }
    if (documentosSincronizados.some((doc) => !doc.nombre.trim())) {
      mostrarAlerta('Todos los documentos deben tener nombre.', 'advertencia');
      return;
    }
    if (documentosSincronizados.length === 0) {
      mostrarAlerta('Selecciona al menos un documento requerido para la cohorte.', 'advertencia');
      return;
    }
    if ((editedData.criterios ?? []).length === 0) {
      mostrarAlerta('Selecciona al menos un criterio para continuar.', 'advertencia');
      return;
    }
    if ((editedData.criterios ?? []).some((c: CriterioItem) => c.peso === undefined)) {
      mostrarAlerta('Todos los criterios seleccionados deben tener un puntaje asignado.', 'advertencia');
      return;
    }

    setIsSaving(true);
    try {
      const criteriosSelected = editedData.criterios ?? [];
      const total = criteriosSelected.reduce((s, c: CriterioItem) => s + (Number(c.peso ?? 0) || 0), 0);
      if (total !== 100) {
        mostrarAlerta('La suma de los puntos de criterios debe ser exactamente 100.', 'advertencia');
        return;
      }

      const payload = {
        id: cohorte.id,
        idSemestre: editedData.idSemestre,
        idModalidad: editedData.idModalidad,
        cupos: editedData.cupos,
        nombre: editedData.nombre,
        fechaInicioDocumentacion: editedData.fechaInicioDocumentacion,
        fechaFinDocumentacion: editedData.fechaFinDocumentacion,
        fechaInicioInscripcion: editedData.fechaInicioInscripcion,
        fechaFinInscripcion: editedData.fechaFinInscripcion,
        fechaInicioPago: editedData.fechaInicioPago,
        fechaFinPago: editedData.fechaFinPago,
        documentosConsejo,
        documentosPrograma,
        criteriosCohorte: (editedData.criterios ?? []).map((criterio) => ({
          ...(criterio.id !== undefined && criterio.id !== null && String(criterio.id).trim() !== '' && String(criterio.id) !== '0' ? { id: criterio.id } : {}),
          idCriterio: criterio.idCriterioevaluacion,
          pesoSnapshot: Number(criterio.peso ?? 0) || 0,
        })),
      };

      await onSaved(payload);

      try {
        if (onSavedConfirmedRef.current) await onSavedConfirmedRef.current();
      } catch {
        // refresh error already handled by parent
      }

      setEditClosing(true);
      setTimeout(() => onCancel(), 170);
    } catch (error) {
      const message = mensajeErrorCohorte(error, 'No se pudo guardar la cohorte.', {
        415: 'El criterio no se puede editar ni borrar porque ya tiene calificaciones registradas.',
      });
      mostrarAlerta(message, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [editedData, onSaved, onCancel, mostrarAlerta, availableConsejoDocs, availableProgramaDocs, cohorte.id, cohorte.documentosAsignados?.documentosConsejo, cohorte.documentosAsignados?.documentosPrograma]);

  const handleCancelOrBack = () => {
    setEditClosing(true);
    setTimeout(() => {
      onCancel();
    }, 170);
  };

  const cerrarModalGuardar = () => {
    setCerrandoConfirmarGuardar(true);
    setTimeout(() => {
      setMostrarConfirmarGuardar(false);
      setCerrandoConfirmarGuardar(false);
    }, 170);
  };

  const confirmarGuardar = () => {
    cerrarModalGuardar();
    void handleSave();
  };

  return (
    <>
    <div className={`bg-white rounded-lg border border-gray-200 p-8 animate-fade-in-up delay-150 ${editClosing ? 'animate-modal-out' : ''}`}>
      {isLoading && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-red-700" />
          <span>Cargando datos actualizados de la cohorte...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la cohorte</label>
          <input
            type="text"
            value={editedData.nombre}
            onChange={(e) => setEditedData({ ...editedData, nombre: e.target.value })}
            disabled={disabled}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Nombre de la cohorte"
          />
        </div>
        {editedData.cupos !== undefined && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cupos</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={cuposStr}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                  setCuposStr(val);
                  setEditedData({ ...editedData, cupos: val === '' ? 0 : parseInt(val, 10) });
                }
              }}
              disabled={disabled}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        )}
        <Select
          id="semestre"
          label="Semestre"
          value={String(editedData.idSemestre ?? '')}
          onChange={(value) => setEditedData({ ...editedData, idSemestre: value })}
          options={availableSemestres.map((s): SelectOption => ({ value: String(s.id), label: s.nombre }))}
          loading={isLoadingSemestres}
          disabled={disabled}
        />
        <Select
          id="modalidad"
          label="Modalidad"
          value={String(editedData.idModalidad ?? '')}
          onChange={(value) => setEditedData({ ...editedData, idModalidad: value })}
          options={availableModalidades.map((m): SelectOption => ({ value: String(m.id), label: m.nombre }))}
          loading={isLoadingModalidades}
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
            value={editedData.fechaInicioInscripcion ?? ''}
            onChange={(value) => setEditedData({ ...editedData, fechaInicioInscripcion: value })}
          />

          <DatePicker
            id="fechaFinInscripcion"
            label="Fecha límite de inscripción"
            value={editedData.fechaFinInscripcion ?? ''}
            onChange={(value) => setEditedData({ ...editedData, fechaFinInscripcion: value })}
          />

          <div className="col-span-full mt-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Documentos</p>
          </div>

          <DatePicker
            id="fechaInicioDocumentacion"
            label="Fecha inicio de cargue de documentos"
            value={editedData.fechaInicioDocumentacion ?? ''}
            onChange={(value) => setEditedData({ ...editedData, fechaInicioDocumentacion: value })}
          />

          <DatePicker
            id="fechaFinDocumentacion"
            label="Fecha límite de cargue de documentos"
            value={editedData.fechaFinDocumentacion ?? ''}
            onChange={(value) => setEditedData({ ...editedData, fechaFinDocumentacion: value })}
          />

          <div className="col-span-full mt-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Pago</p>
          </div>

          <DatePicker
            id="fechaInicioPago"
            label="Fecha inicio de pago de inscripción"
            value={editedData.fechaInicioPago ?? ''}
            onChange={(value) => setEditedData({ ...editedData, fechaInicioPago: value })}
          />

          <DatePicker
            id="fechaFinPago"
            label="Fecha límite de pago de inscripción"
            value={editedData.fechaFinPago ?? ''}
            onChange={(value) => setEditedData({ ...editedData, fechaFinPago: value })}
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Documentos requeridos</h2>
          {((editedData.documentos ?? []).length ?? 0) > 0 && (
            <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 rounded-lg px-2.5 py-1">{(editedData.documentos ?? []).length} seleccionados</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Documentos del Consejo (obligatorios)</div>
            <div className="space-y-2 mb-4">
              {isLoadingDocs ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-neutral-50 shadow-sm">
                  <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" />
                  <div className="text-sm text-neutral-500">Cargando documentos del consejo...</div>
                </div>
              ) : availableConsejoDocs.length > 0 ? (
                availableConsejoDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-transparent bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 border-l-4 border-l-red-200">
                    <DocumentTextIcon className="w-5 h-5 text-neutral-400" />
                    <div className="text-sm text-gray-900">{d.nombre}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral-500">No hay documentos del consejo disponibles.</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Documentos del Programa (seleccionables)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {isLoadingDocs ? (
                <div className="flex items-center gap-3 rounded-lg border border-transparent p-3 bg-neutral-50 shadow-sm md:col-span-2">
                  <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" />
                  <div className="text-sm text-neutral-500">Cargando documentos del programa...</div>
                </div>
              ) : availableProgramaDocs.length > 0 ? (
                availableProgramaDocs.map((d) => {
                  const nombre = (d.nombre ?? '').toString().trim();
                  return (
                    <label key={`prog-edit-${d.id}`} className="flex items-center gap-3 rounded-lg border border-transparent p-3 bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 cursor-pointer border-l-4 border-l-gray-100">
                      <input type="checkbox" checked={selectedDocsMap[nombre] ?? false} onChange={(e) => setDocumentoSeleccion(nombre, e.target.checked)} disabled={disabled} className="h-4 w-4" />
                      <DocumentTextIcon className="w-5 h-5 text-neutral-400" />
                      <span className="text-sm text-gray-900">{nombre}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-sm text-neutral-500 md:col-span-2">No hay documentos del programa disponibles.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Criterios de evaluación</h2>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700">
                {selectedCriteriosCount} seleccionados
              </span>
              <span className={`rounded-lg border px-2.5 py-1 ${totalPeso === 100 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                Suma: {totalPeso} pts
              </span>
            </div>
          </div>
          {isLoadingCriterios ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-gray-100">
                <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" />
                <div className="text-sm text-neutral-500">Cargando criterios...</div>
              </div>
            </div>
          ) : availableCriteriosState && availableCriteriosState.length > 0 ? (
            <div className="space-y-2">
              {availableCriteriosState.map((c: CriterioEvaluacion) => {
                const selected = Boolean(findSelectedCriterion(c));
                const selectedValue = findSelectedCriterion(c);
                return (
                  <label key={`crit-${c.id ?? c.nombre}`} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-transparent bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 border-l-4 border-l-indigo-100 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selected} onChange={(e) => toggleCriterioSeleccion(c, e.target.checked)} disabled={disabled} className="h-4 w-4" />
                      <SparklesIcon className="w-5 h-5 text-indigo-400" />
                      <div className="text-sm text-gray-900">{c.nombre}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selected ? (selectedValue?.peso !== undefined ? selectedValue.peso : '') : (c.peso !== undefined ? c.peso : '')}
                        placeholder="-"
                        onChange={(e) => setPesoCriterio(c.id ?? c.nombre, e.target.value === '' ? undefined : Number(e.target.value))}
                        disabled={disabled || !selected}
                        className="w-20 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-2 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <div className="text-sm text-neutral-600">pts</div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : Array.isArray(editedData.criterios) && editedData.criterios.length > 0 ? (
            <div className="space-y-2">
              {editedData.criterios.map((crit: CriterioItem, idx) => (
                <div key={`${crit.id ?? crit.nombre}-${idx}`} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-transparent bg-white shadow-sm hover:shadow transition-shadow hover:border-gray-200 border-l-4 border-l-indigo-200">
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="w-5 h-5 text-indigo-400" />
                    <div className="text-sm text-gray-900">{crit.nombre}</div>
                  </div>
                  <div className="text-sm text-neutral-600 font-semibold">{crit.peso} pts</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">No hay criterios definidos para esta cohorte.</div>
          )}
        </div>

        {criterioError && <div className="mt-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">{criterioError}</div>}

        <div className={`flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 ${editClosing ? 'animate-modal-out' : 'animate-fade-in-up'}`}>
          <button disabled={disabled} onClick={handleCancelOrBack} className="px-6 py-2 bg-white text-gray-700 text-sm border border-gray-200 rounded-lg hover:bg-neutral-200 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed">Cancelar</button>
          <button disabled={disabled || Boolean(criterioError) || selectedCriteriosCount === 0} onClick={() => setMostrarConfirmarGuardar(true)} className="inline-flex items-center gap-2 px-6 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed">
            {isSaving ? <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" /> : null}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>

    <DialogoConfirmacion
      abierto={mostrarConfirmarGuardar}
      cerrando={cerrandoConfirmarGuardar}
      titulo="Confirmar cambios"
      onCancelar={cerrarModalGuardar}
      onConfirmar={confirmarGuardar}
      textoConfirmar="Sí, guardar"
      textoProcesando="Guardando..."
      procesando={isSaving}
    >
      <p className="text-sm text-gray-700">¿Está seguro de guardar los cambios realizados en la cohorte <strong>"{cohorte.nombre}"</strong>?</p>
    </DialogoConfirmacion>
    </>
  );
}
