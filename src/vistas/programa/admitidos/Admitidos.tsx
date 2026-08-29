import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { fetchCohortes, type CohorteItem } from "../../../services/programa/programaCohorteService";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { SpinnerIcon } from "../../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 shrink-0 text-neutral-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Admitidos() {
  const navigate = useNavigate();
  const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

  const [cargando, setCargando] = useState(true);
  const [cohortes, setCohortes] = useState<CohorteItem[]>([]);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const datos = await fetchCohortes();
        const ordenadas = [...(datos ?? [])].sort((a, b) => Number(b.activa) - Number(a.activa));
        setCohortes(ordenadas);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : "Error al cargar las cohortes. Intenta de nuevo.", "error");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeleccionarCohorte = (cohorte: CohorteItem) => {
    navigate(`/programa/admision/admitidos/cohorte/${cohorte.id}`, {
      state: { nombreCohorte: cohorte.nombre },
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="">

        {/* Encabezado */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-xl font-bold text-gray-900">Admitidos</h1>
          <h2 className="text-base font-semibold text-gray-700 mt-3">Cohortes</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Selecciona una cohorte para gestionar la admisión de sus aspirantes calificados.
          </p>
        </div>

        {/* Estado de carga */}
        {cargando ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
              Cargando cohortes...
            </div>
          </div>
        ) : cohortes.length === 0 ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <p className="text-sm text-neutral-400">No hay cohortes disponibles.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up delay-100">
            {cohortes.map((cohorte, idx) => {
              const admitidos = cohorte.totalAdmitidos ?? 0;
              const calificados = cohorte.totalCalificados ?? 0;
              const totalEnAdmision = admitidos + calificados;
              const pct = totalEnAdmision > 0 ? Math.min(100, Math.round((admitidos / totalEnAdmision) * 100)) : 0;

              return (
                <button
                  key={cohorte.id}
                  onClick={() => handleSeleccionarCohorte(cohorte)}
                  className="w-full text-left p-6 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${100 + idx * 75}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Nombre + badge activa */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h2 className="text-lg font-semibold text-gray-900">{cohorte.nombre}</h2>
                        {cohorte.activa ? (
                          <span className="bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-lg shrink-0">
                            Activa
                          </span>
                        ) : (
                          <span className="bg-neutral-200 text-neutral-500 text-xs font-semibold px-3 py-1 rounded-lg shrink-0">
                            Inactiva
                          </span>
                        )}
                      </div>

                      {/* Inscritos y Cupos */}
                      <div className="flex gap-6 flex-wrap mb-2">
                        <div className="text-sm">
                          <span className="text-neutral-400">Inscritos: </span>
                          <span className="font-semibold text-red-700">{cohorte.totalInscritos ?? 0}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-neutral-400">Cupos: </span>
                          <span className="font-semibold text-red-700">{cohorte.cupos}</span>
                        </div>
                      </div>

                      {/* Por admitir y Admitidos */}
                      <div className="flex gap-6 flex-wrap mb-3">
                        <div className="text-sm">
                          <span className="text-neutral-400">Por admitir: </span>
                          <span className="font-semibold text-gray-800">{calificados}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-neutral-400">Admitidos: </span>
                          <span className="font-semibold text-gray-800">{admitidos}</span>
                        </div>
                      </div>

                      {/* Barra de progreso admitidos */}
                      {totalEnAdmision > 0 && (
                        <div>
                          <div className="text-xs text-neutral-400 mb-1">Admitidos / Total en admisión</div>
                          <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                            <div className="h-2 bg-red-700 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-sm mt-1.5">
                            <span className="text-neutral-400">Admitidos: </span>
                            <span className="font-semibold text-red-700">{admitidos}</span>
                            <span className="text-neutral-400"> de </span>
                            <span className="font-semibold text-gray-800">{totalEnAdmision}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <ChevronRightIcon />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
