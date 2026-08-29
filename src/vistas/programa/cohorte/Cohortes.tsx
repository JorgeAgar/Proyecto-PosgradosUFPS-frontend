import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { PlusIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import CrearCohorte from './CrearCohorte';
import CohorteDetalleView from './CohorteDetalleView';
import { fetchCohortes, type CohorteItem } from '../../../services/programa/programaCohorteService';
import {
  fetchCohorteDetalle,
  abrirCohorte,
  cerrarCohorte,
  updateCohorte,
  type CohorteDetalle,
} from '../../../services/programa/programaCohorteDetalleService';
import type { ProgramaOutletContext } from '../../../layouts/ProgramaLayout';
import { SpinnerIcon } from "../../../assets/icons";

export default function Cohortes() {
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();

  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [cohortes, setCohortes] = useState<CohorteItem[]>([]);
  const [selectedCohorteId, setSelectedCohorteId] = useState<string | null>(null);
  const [selectedDetalle, setSelectedDetalle] = useState<CohorteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await fetchCohortes();
        setCohortes(list);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : 'No se pudo cargar la lista de cohortes.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCohorteId || view !== 'detail') return;
    setSelectedDetalle(null);
    (async () => {
      try {
        const detail = await fetchCohorteDetalle(selectedCohorteId);
        setSelectedDetalle(detail);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : 'No se pudo cargar el detalle de la cohorte.', 'error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohorteId, view]);

  const selectedCohorte = useMemo(() => cohortes.find((c) => c.id === selectedCohorteId) || null, [cohortes, selectedCohorteId]);

  const handleSelectCohorte = (cohorte: CohorteItem) => {
    setSelectedDetalle(null);
    setSelectedCohorteId(cohorte.id);
    setView('detail');
  };

  const refreshList = async () => {
    setLoading(true);
    try {
      const list = await fetchCohortes();
      setCohortes(list);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo cargar la lista de cohortes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetalle = async (payload: Partial<{ cupos: number; idSemestre?: string | number; idModalidad?: string | number; nombre: string; activa: boolean; fechaInicioDocumentacion?: string; fechaFinDocumentacion?: string; fechaInicioInscripcion?: string; fechaFinInscripcion?: string; fechaInicioPago?: string; fechaFinPago?: string; documentosConsejo: { idDocrequisito?: string | number; idCohorte?: string | number; nombre?: string }[]; documentosPrograma: { idDocrequisito?: string | number; idCohorte?: string | number; nombre?: string }[]; criteriosCohorte: { id?: string | number; idCriterio?: string | number; pesoSnapshot?: number }[] }>) => {
    if (!selectedCohorteId) return;
    await updateCohorte(selectedCohorteId, payload);
  };

  const handleSaveDetalleConfirmed = async () => {
    if (!selectedCohorteId) return;
    try {
      setSelectedDetalle(null);
      await refreshList();
      const detail = await fetchCohorteDetalle(selectedCohorteId);
      setSelectedDetalle(detail);
      setView('detail');
      mostrarConfirm('La cohorte se editó correctamente.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo refrescar la cohorte editada.', 'error');
      throw new Error('No se pudo refrescar');
    }
  };

  const handleToggleEstadoDetalle = async (nextActiva: boolean) => {
    if (!selectedCohorteId || !selectedDetalle) return;
    try {
      if (nextActiva) {
        const updated = await abrirCohorte(selectedCohorteId);
        setCohortes((prev) => prev.map((c) => (c.id === selectedCohorteId ? { ...c, ...updated } : c)));
        setSelectedDetalle((prev) => (prev ? { ...prev, ...updated } as CohorteDetalle : updated as CohorteDetalle));
        return;
      }
      const updated = await cerrarCohorte(selectedCohorteId);
      setCohortes((prev) => prev.map((c) => (c.id === selectedCohorteId ? { ...c, ...updated } : c)));
      setSelectedDetalle((prev) => (prev ? { ...prev, ...updated } as CohorteDetalle : updated as CohorteDetalle));
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la cohorte.', 'error');
    }
  };

  if (view === 'new') {
    return (
      <CrearCohorte
        onSaved={async () => {
          await refreshList();
          setView('list');
        }}
        onBack={() => setView('list')}
      />
    );
  }

  if (view === 'detail' && selectedDetalle && selectedDetalle.id === selectedCohorteId) {
    return (
      <CohorteDetalleView
        cohorte={selectedDetalle}
        onBack={() => setView('list')}
        onSave={handleSaveDetalle}
        onSaveConfirmed={handleSaveDetalleConfirmed}
        onToggleEstado={handleToggleEstadoDetalle}
      />
    );
  }

  if (view === 'detail' && selectedCohorte && (!selectedDetalle || selectedDetalle.id !== selectedCohorteId)) {
    return (
      <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4.5 w-4.5 shrink-0" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cohorte</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-neutral-400">{selectedCohorte.nombre}</span>
                {selectedCohorte.activa && (
                  <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg animate-fade-in">Activa</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-red-700" />
              Cargando detalle de cohorte...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <h1 className="text-xl font-bold text-gray-900">Cohortes</h1>
          {!loading && (
            <button onClick={() => setView('new')} className="animate-fade-in flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium">
              <PlusIcon className="w-4 h-4" />
              <span>Nueva cohorte</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-red-700" />
              Cargando cohortes...
            </div>
          </div>
        ) : cohortes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fade-in">
            <p className="text-sm text-neutral-400">No hay cohortes disponibles.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up delay-100">
            {cohortes.map((cohorte) => (
              <button key={cohorte.id} onClick={() => handleSelectCohorte(cohorte)} className="w-full text-left p-6 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-semibold text-gray-900">{cohorte.nombre}</h2>
                      {cohorte.activa && <span className="bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-lg">Activa</span>}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm"><span className="text-neutral-400">Semestre: </span><span className="font-semibold text-gray-800">{cohorte.nombreSemestre ?? cohorte.semestre ?? 'Sin semestre'}</span></div>
                      <div className="flex gap-6 flex-wrap">
                        <div className="text-sm"><span className="text-neutral-400">Inscritos: </span><span className="font-semibold text-red-700">{cohorte.totalInscritos ?? cohorte.inscritos ?? 0}</span></div>
                        <div className="text-sm"><span className="text-neutral-400">Cupos: </span><span className="font-semibold text-red-700">{cohorte.cupos}</span></div>
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className="text-neutral-400 shrink-0 mt-1 w-6 h-6" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
