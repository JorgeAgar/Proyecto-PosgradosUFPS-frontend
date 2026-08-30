import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { getCriterios, type Criterio } from "../../services/aspirante/aspiranteCriteriosService";
import type { AspiranteOutletContext } from "../../layouts/AspiranteLayout";
import { LockIcon, SpinnerIcon } from "../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── Componente principal ──────────────────────────────────────────────────────

export default function AspiranteCriterios() {
  const { mostrarAlerta, soloInscrito } = useOutletContext<AspiranteOutletContext>();

  const [cargando, setCargando] = useState(true);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [puntajeTotal, setPuntajeTotal] = useState(0);

  useEffect(() => {
    if (soloInscrito !== false) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await getCriterios();
        setCriterios(res.criterios);
        setPuntajeTotal(res.puntajeTotal);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : "Error al cargar los criterios. Intenta de nuevo.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloInscrito]);

  if (soloInscrito === true) {
    return (
      <div className="p-6 bg-gray-100 min-h-full flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-neutral-400" />
            </div>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Sección no disponible</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Esta sección estará disponible una vez hayas completado el pago de inscripción{" "}
            <span className="font-medium text-gray-600">(Paz y salvo)</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="">

        {/* Encabezado */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-xl font-bold text-gray-900">Criterios de evaluación</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Aquí puedes consultar los criterios con los que serás evaluado y los puntajes registrados.
          </p>
        </div>

        {/* Estado de carga */}
        {cargando && (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
              Cargando criterios...
            </div>
          </div>
        )}

        {/* Tabla */}
        {!cargando && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up delay-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Criterio</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Puntaje máximo</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Puntaje obtenido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {criterios.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-400">
                      No hay criterios de evaluación registrados.
                    </td>
                  </tr>
                ) : (
                  criterios.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">{c.nombre}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{c.peso}</td>
                      <td className="px-6 py-4 text-center text-sm">
                        {c.puntaje !== null
                          ? <span className="font-semibold text-red-700">{c.puntaje.toFixed(1)}</span>
                          : <span className="text-neutral-400">—</span>
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!cargando && criterios.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Total</td>
                    <td />
                    <td className="px-6 py-4 text-center">
                      {criterios.every(c => c.puntaje === null)
                        ? <span className="text-lg font-bold text-neutral-400">—</span>
                        : <span className="text-lg font-bold text-red-700">{puntajeTotal.toFixed(1)}</span>
                      }
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        )} {/* fin !cargando */}

      </div>
    </div>
  );
}
