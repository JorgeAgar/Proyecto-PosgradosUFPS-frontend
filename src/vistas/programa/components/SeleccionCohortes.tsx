import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { ChevronRightIcon } from "../../../assets/icons";
import Cargando from "../../../components/Cargando";
import { BadgeActiva } from "../../../components/Badge";
import { BarraProgreso } from "../../../components/Estadisticas";

export interface CohorteResumen {
  id: number | string;
  nombre: string;
  activa: boolean;
  cupos: number;
  totalInscritos?: number;
}

export type MetricaCohorte = { etiqueta: string; valor: React.ReactNode; oculta?: boolean };

export type ProgresoCohorte = {
  /** Texto sobre la barra, p. ej. "Validados / Total en validación". */
  titulo: string;
  /** Texto antes del conteo bajo la barra, p. ej. "Validados". */
  etiqueta: string;
  actual: number;
  total: number;
};

interface SeleccionCohortesProps<T extends CohorteResumen> {
  titulo: string;
  subtitulo?: string;
  descripcion: string;
  cargar: () => Promise<T[]>;
  mensajeError?: string;
  /** Ruta de detalle a la que se navega al seleccionar una cohorte. */
  rutaDetalle: (cohorte: T) => string;
  /** Segunda fila de métricas (por validar, calificados…). */
  metricas: (cohorte: T) => MetricaCohorte[];
  progreso: (cohorte: T) => ProgresoCohorte;
  /** Contenido adicional bajo las métricas (p. ej. fecha límite). */
  extra?: (cohorte: T) => React.ReactNode;
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: React.ReactNode; destacado?: boolean }) {
  return (
    <div className="text-sm">
      <span className="text-neutral-400">{etiqueta}: </span>
      <span className={`font-semibold ${destacado ? "text-red-700" : "text-gray-800"}`}>{valor}</span>
    </div>
  );
}

/**
 * Vista de selección de cohorte usada como puerta de entrada de los módulos
 * del director de programa (validación, pagos, calificación, admitidos).
 */
export default function SeleccionCohortes<T extends CohorteResumen>({
  titulo,
  subtitulo = "Cohortes",
  descripcion,
  cargar,
  mensajeError = "Error al cargar las cohortes. Intenta de nuevo.",
  rutaDetalle,
  metricas,
  progreso,
  extra,
}: SeleccionCohortesProps<T>) {
  const navigate = useNavigate();
  const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

  const [cargando, setCargando] = useState(true);
  const [cohortes, setCohortes] = useState<T[]>([]);

  useEffect(() => {
    const cargarCohortes = async () => {
      setCargando(true);
      try {
        const datos = await cargar();
        setCohortes([...(datos ?? [])].sort((a, b) => Number(b.activa) - Number(a.activa)));
      } catch (err) {
        if (!localStorage.getItem("ufps_programa_session")) {
          navigate("/programa/login", { replace: true });
          return;
        }
        mostrarAlerta(err instanceof Error ? err.message : mensajeError, "error");
      } finally {
        setCargando(false);
      }
    };
    cargarCohortes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
        <h2 className="text-base font-semibold text-gray-700 mt-3">{subtitulo}</h2>
        <p className="text-sm text-neutral-400 mt-1">{descripcion}</p>
      </div>

      {cargando ? (
        <Cargando texto="Cargando cohortes..." />
      ) : cohortes.length === 0 ? (
        <div className="flex items-center justify-center py-20 animate-fade-in">
          <p className="text-sm text-neutral-400">No hay cohortes disponibles.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up delay-100">
          {cohortes.map((cohorte, idx) => {
            const p = progreso(cohorte);
            return (
              <button
                key={cohorte.id}
                type="button"
                onClick={() =>
                  navigate(rutaDetalle(cohorte), {
                    state: { nombreCohorte: cohorte.nombre, activa: cohorte.activa },
                  })
                }
                className="w-full text-left p-6 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all animate-fade-in-up"
                style={{ animationDelay: `${100 + idx * 75}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h2 className="text-lg font-semibold text-gray-900">{cohorte.nombre}</h2>
                      <BadgeActiva activa={cohorte.activa} />
                    </div>

                    <div className="flex gap-6 flex-wrap mb-2">
                      <Dato etiqueta="Inscritos" valor={cohorte.totalInscritos ?? 0} destacado />
                      <Dato etiqueta="Cupos" valor={cohorte.cupos} destacado />
                    </div>

                    <div className="flex gap-6 flex-wrap mb-3">
                      {metricas(cohorte)
                        .filter((m) => !m.oculta)
                        .map((m) => (
                          <Dato key={m.etiqueta} etiqueta={m.etiqueta} valor={m.valor} />
                        ))}
                    </div>

                    {extra?.(cohorte)}

                    {p.total > 0 && (
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">{p.titulo}</div>
                        <BarraProgreso actual={p.actual} total={p.total} />
                        <div className="text-sm mt-1.5">
                          <span className="text-neutral-400">{p.etiqueta}: </span>
                          <span className="font-semibold text-red-700">{p.actual}</span>
                          <span className="text-neutral-400"> de </span>
                          <span className="font-semibold text-gray-800">{p.total}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <ChevronRightIcon className="w-5 h-5 shrink-0 text-neutral-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
