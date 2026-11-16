import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { useOutletContext } from 'react-router';
import {
  CalendarDaysIcon,
  UsersIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  fetchProgramaInicioData,
  calcularEmbudo,
  type ProgramaInicioData,
} from '../../services/programa/programaInicioService';
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

      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="h-4 w-40 bg-neutral-200 rounded" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-full bg-neutral-200 rounded-full" />
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-semibold text-red-700 whitespace-nowrap w-11 text-right">{value}%</span>
      <div className="flex-1 bg-neutral-200 rounded-full h-3">
        <div className="bg-red-700 h-3 rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function porcentaje(valor: number, base: number) {
  if (base <= 0) return 0;
  return Math.min(100, Math.round((valor / base) * 100));
}

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

interface EtapaEmbudo {
  etiqueta: string;
  descripcion: string;
  valor: number;
  Icon: Icono;
  iconClass: string;
  base?: { valor: number; etiqueta: string };
}

function construirEtapas(item: ProgramaInicioData): EtapaEmbudo[] {
  const e = calcularEmbudo(item);
  return [
    {
      etiqueta: 'Inscritos',
      descripcion: 'Total de aspirantes inscritos en la cohorte',
      valor: e.inscritos,
      Icon: UsersIcon,
      iconClass: 'bg-neutral-100 border-neutral-200 text-neutral-600',
    },
    {
      etiqueta: 'Paz y salvo',
      descripcion: 'Pagaron la inscripción',
      valor: e.pazYSalvo,
      Icon: BanknotesIcon,
      iconClass: 'bg-green-100 border-green-200 text-green-700',
      base: { valor: e.inscritos, etiqueta: 'inscritos' },
    },
    {
      etiqueta: 'Validados',
      descripcion: 'Documentos aprobados',
      valor: e.validados,
      Icon: DocumentCheckIcon,
      iconClass: 'bg-amber-100 border-amber-200 text-amber-500',
      base: { valor: e.pazYSalvo, etiqueta: 'a paz y salvo' },
    },
    {
      etiqueta: 'Calificados',
      descripcion: 'Con notas en los criterios',
      valor: e.calificados,
      Icon: ClipboardDocumentListIcon,
      iconClass: 'bg-red-100 border-red-200 text-red-700',
      base: { valor: e.validados, etiqueta: 'validados' },
    },
    {
      etiqueta: 'Admitidos',
      descripcion: 'Admitidos al programa',
      valor: e.admitidos,
      Icon: AcademicCapIcon,
      iconClass: 'bg-blue-100 border-blue-200 text-blue-700',
      base: { valor: e.calificados, etiqueta: 'calificados' },
    },
  ];
}

function EmbudoAspirantes({ item, compacto = false }: { item: ProgramaInicioData; compacto?: boolean }) {
  const etapas = construirEtapas(item);

  return (
    <div className={compacto ? 'space-y-3' : 'space-y-5'}>
      {etapas.map(({ etiqueta, descripcion, valor, Icon, iconClass, base }) => (
        <div key={etiqueta} className="grid grid-cols-1 md:grid-cols-[minmax(0,16rem)_1fr] gap-2 md:gap-6 md:items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg border shrink-0 ${iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900">{etiqueta}</div>
              {!compacto && <div className="text-xs text-neutral-400 truncate">{descripcion}</div>}
            </div>
            <div className={`${compacto ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 tabular-nums`}>{valor}</div>
          </div>

          {base ? (
            <div>
              <ProgressBar value={porcentaje(valor, base.valor)} />
              <div className="text-xs text-neutral-400 mt-1 md:pl-15">
                {valor} de {base.valor} {base.etiqueta}
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-400 md:pl-15">Base del proceso</div>
          )}
        </div>
      ))}
    </div>
  );
}

function FechaCard({
  titulo,
  fin,
  inicio,
  iconClass,
  grande = false,
}: {
  titulo: string;
  fin?: string;
  inicio?: string;
  iconClass: string;
  grande?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg border ${iconClass}`}>
          <CalendarDaysIcon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
      </div>
      <div className={`${grande ? 'text-2xl' : 'text-xl'} font-bold text-red-700`}>{fin || '—'}</div>
      {inicio && <div className="text-xs text-neutral-500 mt-1">Desde {inicio}</div>}
    </>
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
    const { cohorteActual } = item;

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
            <FechaCard
              titulo="Fecha límite documentos"
              fin={cohorteActual.fechaFinDocumentacion || cohorteActual.fechaLimiteDocumentos}
              inicio={cohorteActual.fechaInicioDocumentacion}
              iconClass="bg-red-100 border-red-200 text-red-700"
            />
          </div>
          <div className="rounded-lg border border-gray-200 p-4 bg-neutral-50">
            <FechaCard
              titulo="Fecha límite pago"
              fin={cohorteActual.fechaFinPago || cohorteActual.fechaLimitePago}
              inicio={cohorteActual.fechaInicioPago}
              iconClass="bg-green-100 border-green-200 text-green-700"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Avance de aspirantes</h3>
          <EmbudoAspirantes item={item} compacto />
        </div>
      </div>
    );
  };

  const [firstItem] = data;
  const hasMultiple = data.length > 1;
  const { cohorteActual } = firstItem;

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
                <FechaCard
                  titulo="Fecha límite cargue de documentos"
                  fin={cohorteActual.fechaFinDocumentacion || cohorteActual.fechaLimiteDocumentos}
                  inicio={cohorteActual.fechaInicioDocumentacion}
                  iconClass="bg-red-100 border-red-200 text-red-700"
                  grande
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all animate-fade-in-up delay-200">
                <FechaCard
                  titulo="Fecha límite pago de inscripción"
                  fin={cohorteActual.fechaFinPago || cohorteActual.fechaLimitePago}
                  inicio={cohorteActual.fechaInicioPago}
                  iconClass="bg-green-100 border-green-200 text-green-700"
                  grande
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all animate-fade-in-up delay-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-red-100 border border-red-200 rounded-lg">
                  <FunnelIcon className="text-red-700 w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Avance de aspirantes</h2>
              </div>
              <EmbudoAspirantes item={firstItem} />
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
