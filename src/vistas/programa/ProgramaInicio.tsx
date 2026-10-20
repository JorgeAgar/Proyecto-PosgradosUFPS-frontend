import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
  CalendarDaysIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { fetchProgramaInicioData, type ProgramaInicioData } from '../../services/programa/programaInicioService';
import type { ProgramaOutletContext } from '../../layouts/ProgramaLayout';
import { SpinnerIcon } from "../../assets/icons";

function LoadingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="h-5 w-56 bg-neutral-200 rounded" />
        <div className="h-4 w-14 bg-neutral-200 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-gray-200 p-4 bg-neutral-50">
          <div className="h-4 w-40 bg-neutral-200 rounded mb-3" />
          <div className="h-8 w-32 bg-neutral-200 rounded" />
        </div>
        <div className="rounded-lg border border-gray-200 p-4 bg-neutral-50">
          <div className="h-4 w-28 bg-neutral-200 rounded mb-3" />
          <div className="h-8 w-32 bg-neutral-200 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-24 bg-neutral-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="h-14 bg-neutral-200 rounded" />
            <div className="h-14 bg-neutral-200 rounded" />
          </div>
          <div className="h-3 w-full bg-neutral-200 rounded-full" />
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-24 bg-neutral-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="h-14 bg-neutral-200 rounded" />
            <div className="h-14 bg-neutral-200 rounded" />
          </div>
          <div className="h-3 w-full bg-neutral-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-semibold text-red-700 whitespace-nowrap">{value}%</span>
      <div className="flex-1 bg-neutral-200 rounded-full h-3">
        <div className="bg-red-700 h-3 rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ProgramaInicio() {
  const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgramaInicioData[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await fetchProgramaInicioData();
        setData(result);
        if (!result.length) {
          mostrarAlerta('No hay cohortes activas para mostrar.', 'advertencia');
        }
      } catch (err) {
        console.error(err);
        mostrarAlerta('No fue posible cargar la información del inicio.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const porcentajeValidados = useMemo(() => {
    if (!data[0]) return 0;
    const { totalInscritos, aspirantesValidados } = data[0].validacion;
    return totalInscritos > 0 ? Math.round((aspirantesValidados / totalInscritos) * 100) : 0;
  }, [data]);

  const porcentajeCalificados = useMemo(() => {
    if (!data[0]) return 0;
    const { totalValidados, aspirantesCalificados } = data[0].calificacion;
    return totalValidados > 0 ? Math.round((aspirantesCalificados / totalValidados) * 100) : 0;
  }, [data]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="">
          <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center gap-3 text-neutral-400 text-sm mb-6 animate-fade-in">
            <SpinnerIcon className="animate-spin shrink-0 h-5 w-5 text-red-700" />
            <span>Cargando información del programa...</span>
          </div>
          <div className="space-y-4">
            <LoadingCardSkeleton />
            <LoadingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fade-in">
            <p className="text-sm text-neutral-400">No hay cohortes activas para mostrar.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCohorteCard = (item: ProgramaInicioData) => {
    const { cohorteActual, validacion, calificacion } = item;
    const porcentajeValidadosCard = validacion.totalInscritos > 0 ? Math.round((validacion.aspirantesValidados / validacion.totalInscritos) * 100) : 0;
    const porcentajeCalificadosCard = calificacion.totalValidados > 0 ? Math.round((calificacion.aspirantesCalificados / calificacion.totalValidados) * 100) : 0;

    return (
      <div key={cohorteActual.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all animate-fade-in-up">
          <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{cohorteActual.nombre}</h2>
            {cohorteActual.activa && (
              <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">Activa</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg border border-gray-200 p-4 bg-neutral-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <CalendarDaysIcon className="text-red-700 w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Fecha límite documentos</h3>
            </div>
            <div className="text-xl font-bold text-red-700">{cohorteActual.fechaLimiteDocumentos}</div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 bg-neutral-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg border border-green-200">
                <CalendarDaysIcon className="text-green-700 w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Fecha límite pago</h3>
            </div>
            <div className="text-xl font-bold text-red-700">{cohorteActual.fechaLimitePago}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 border border-amber-200 rounded-lg">
                <DocumentCheckIcon className="text-amber-400 w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Validación</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Inscritos</div>
                <div className="text-lg font-semibold text-gray-900">{validacion.totalInscritos}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-1">Validados</div>
                <div className="text-lg font-semibold text-green-700">{validacion.aspirantesValidados}</div>
              </div>
            </div>
            <ProgressBar value={porcentajeValidadosCard} />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 border border-red-200 rounded-lg">
                <ClipboardDocumentListIcon className="text-red-700 w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Calificación</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Validados</div>
                <div className="text-lg font-semibold text-gray-900">{calificacion.totalValidados}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-1">Calificados</div>
                <div className="text-lg font-semibold text-green-700">{calificacion.aspirantesCalificados}</div>
              </div>
            </div>
            <ProgressBar value={porcentajeCalificadosCard} />
          </div>
        </div>
      </div>
    );
  };

  const [firstItem] = data;
  const hasMultiple = data.length > 1;
  const { cohorteActual, validacion, calificacion } = firstItem;

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="">
        {!hasMultiple ? (
          <>
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <h1 className="text-xl font-bold text-gray-900">{cohorteActual.nombre}</h1>
              {cohorteActual.activa && (
                <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">Activa</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all animate-fade-in-up delay-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <CalendarDaysIcon className="text-red-700 w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Fecha límite cargue de documentos</h2>
                </div>
                <div className="text-2xl font-bold text-red-700">{cohorteActual.fechaLimiteDocumentos}</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all animate-fade-in-up delay-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg border border-green-200">
                    <CalendarDaysIcon className="text-green-700 w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Fecha límite pago de inscripción</h2>
                </div>
                <div className="text-2xl font-bold text-red-700">{cohorteActual.fechaLimitePago}</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:border-gray-300 transition-all animate-fade-in-up delay-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 border border-amber-200 rounded-lg">
                  <DocumentCheckIcon className="text-amber-400 w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Validación de documentos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Total inscritos</div>
                  <div className="text-xl font-semibold text-gray-900">{validacion.totalInscritos}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Documentos validados</div>
                  <div className="text-xl font-semibold text-green-700">{validacion.aspirantesValidados}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Por validar</div>
                  <div className="text-xl font-semibold text-yellow-400">
                    {Math.max(validacion.totalInscritos - validacion.aspirantesValidados, 0)}
                  </div>
                </div>
              </div>

              <ProgressBar value={porcentajeValidados} />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all animate-fade-in-up delay-400">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 border border-red-200 rounded-lg">
                  <ClipboardDocumentListIcon className="text-red-700 w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Calificación de aspirantes</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Aspirantes validados</div>
                  <div className="text-xl font-semibold text-gray-900">{calificacion.totalValidados}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Aspirantes calificados</div>
                  <div className="text-xl font-semibold text-green-700">{calificacion.aspirantesCalificados}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Por calificar</div>
                  <div className="text-xl font-semibold text-yellow-400">
                    {Math.max(calificacion.totalValidados - calificacion.aspirantesCalificados, 0)}
                  </div>
                </div>
              </div>

              <ProgressBar value={porcentajeCalificados} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 animate-fade-in">
              <h1 className="text-xl font-bold text-gray-900">Cohortes activas del programa</h1>
              <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">{data.length}</span>
            </div>
            <div className="space-y-4">
              {data.map(renderCohorteCard)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
