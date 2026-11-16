import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { useOutletContext } from 'react-router';
import {
  CalendarDaysIcon,
  UsersIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import {
  fetchProgramaInicioData,
  calcularEmbudo,
  type ProgramaInicioData,
} from '../../services/programa/programaInicioService';
import type { ProgramaOutletContext } from '../../layouts/ProgramaLayout';
import { SpinnerIcon } from "../../assets/icons";

// ── Utilidades ────────────────────────────────────────────────────────────────

/** "2027-07-31" → "31/07/2027". Si no viene en formato ISO se deja tal cual. */
function formatearFecha(fecha?: string) {
  if (!fecha) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : fecha;
}

/**
 * Rango de fechas. Cada fecha va en un bloque que no se parte, pero el rango sí
 * puede pasar a otra línea entre las dos fechas cuando no cabe (celulares).
 */
function RangoFechas({ inicio, fin }: { inicio?: string; fin?: string }) {
  if (inicio && fin) {
    return (
      <>
        <span className="whitespace-nowrap">{formatearFecha(inicio)} –</span>{' '}
        <span className="whitespace-nowrap">{formatearFecha(fin)}</span>
      </>
    );
  }
  if (fin) return <span className="whitespace-nowrap">Hasta {formatearFecha(fin)}</span>;
  return <>Sin fecha</>;
}

function porcentaje(valor: number, base: number) {
  if (base <= 0) return 0;
  return Math.min(100, Math.round((valor / base) * 100));
}

// ── Etapas del embudo ─────────────────────────────────────────────────────────

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

interface EtapaEmbudo {
  etiqueta: string;
  descripcion: string;
  valor: number;
  Icon: Icono;
  iconClass: string;
  /** Etapa anterior sobre la que se calcula el porcentaje (inscritos no tiene). */
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
    {
      etiqueta: 'Legalizados',
      descripcion: 'Pagaron la matrícula',
      valor: e.legalizados,
      Icon: CheckBadgeIcon,
      iconClass: 'bg-emerald-100 border-emerald-200 text-emerald-700',
      base: { valor: e.admitidos, etiqueta: 'admitidos' },
    },
  ];
}

// ── Componentes ───────────────────────────────────────────────────────────────

/** Mini tarjeta de una etapa: nombre, cantidad, % sobre la etapa anterior y barra. */
function EtapaCard({ etapa, conDescripcion }: { etapa: EtapaEmbudo; conDescripcion: boolean }) {
  const { etiqueta, descripcion, valor, Icon, iconClass, base } = etapa;
  const pct = base ? porcentaje(valor, base.valor) : null;

  return (
    <div className="rounded-lg border border-gray-200 p-3 flex flex-col gap-2 min-w-0" title={descripcion}>
      <div className="flex items-center gap-2 min-w-0">
        {/* En pantallas pequeñas se oculta el ícono para que el nombre quepa completo. */}
        <div className={`hidden sm:block p-1 rounded-md border shrink-0 ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-gray-900 leading-tight">{etiqueta}</span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{valor}</span>
        {pct !== null && <span className="text-xs font-semibold text-red-700 tabular-nums">{pct}%</span>}
      </div>

      <div className="h-1.5 rounded-full bg-neutral-200">
        <div
          className={`h-1.5 rounded-full transition-all ${base ? 'bg-red-700' : 'bg-neutral-400'}`}
          style={{ width: `${pct ?? 100}%` }}
        />
      </div>

      <div className="text-[11px] leading-tight text-neutral-400">
        {base ? `${valor} de ${base.valor} ${base.etiqueta}` : 'Total del proceso'}
        {conDescripcion && <div className="mt-0.5">{descripcion}</div>}
      </div>
    </div>
  );
}

function FechaChip({ titulo, inicio, fin }: { titulo: string; inicio?: string; fin?: string }) {
  return (
    // max-w-full + texto que puede partirse: en pantallas angostas la etiqueta
    // crece hacia abajo en lugar de salirse de la tarjeta.
    <div className="inline-flex max-w-full items-start gap-1.5 rounded-md bg-neutral-50 border border-gray-200 px-2.5 py-1 text-xs leading-5">
      <CalendarDaysIcon className="w-4 h-4 mt-0.5 text-red-700 shrink-0" />
      <span className="min-w-0">
        <span className="text-neutral-500 whitespace-nowrap">{titulo}:</span>{' '}
        {/* inline-block: el rango baja completo a la línea siguiente y solo se
            parte entre las dos fechas si ni así cabe. */}
        <span className="inline-block font-semibold text-gray-900">
          <RangoFechas inicio={inicio} fin={fin} />
        </span>
      </span>
    </div>
  );
}

/**
 * Tarjeta de una cohorte. `amplia` se usa cuando es la única cohorte: las 6 etapas
 * caben en una fila en pantallas grandes y se muestra la descripción de cada una.
 */
function CohorteCard({ item, amplia }: { item: ProgramaInicioData; amplia: boolean }) {
  const { cohorteActual } = item;
  const etapas = construirEtapas(item);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-all animate-fade-in-up">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
        <h2 className="text-base font-bold text-gray-900">{cohorteActual.nombre}</h2>
        {cohorteActual.activa && (
          <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">Activa</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <FechaChip
          titulo="Documentos"
          inicio={cohorteActual.fechaInicioDocumentacion}
          fin={cohorteActual.fechaFinDocumentacion || cohorteActual.fechaLimiteDocumentos}
        />
        <FechaChip
          titulo="Pago de inscripción"
          inicio={cohorteActual.fechaInicioPago}
          fin={cohorteActual.fechaFinPago || cohorteActual.fechaLimitePago}
        />
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Avance de aspirantes</h3>
      <div className={`grid gap-2 grid-cols-2 sm:grid-cols-3 ${amplia ? 'lg:grid-cols-6' : ''}`}>
        {etapas.map((etapa) => (
          <EtapaCard key={etapa.etiqueta} etapa={etapa} conDescripcion={amplia} />
        ))}
      </div>
    </div>
  );
}

function LoadingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
      <div className="h-5 w-56 bg-neutral-200 rounded mb-3" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-52 bg-neutral-200 rounded" />
        <div className="h-6 w-60 bg-neutral-200 rounded" />
      </div>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-neutral-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Vista ─────────────────────────────────────────────────────────────────────

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
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 text-neutral-400 text-sm mb-4 animate-fade-in">
          <SpinnerIcon className="animate-spin shrink-0 h-5 w-5 text-red-700" />
          <span>Cargando información del programa...</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <LoadingCardSkeleton />
          <LoadingCardSkeleton />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fade-in">
          <p className="text-sm text-neutral-400">No hay cohortes activas para mostrar.</p>
        </div>
      </div>
    );
  }

  const varias = data.length > 1;

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <h1 className="text-xl font-bold text-gray-900">{varias ? 'Cohortes activas del programa' : 'Cohorte activa del programa'}</h1>
        {varias && (
          <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg">{data.length}</span>
        )}
      </div>

      <div className={varias ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : ''}>
        {data.map((item) => (
          <CohorteCard key={item.cohorteActual.id} item={item} amplia={!varias} />
        ))}
      </div>
    </div>
  );
}
