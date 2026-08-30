import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router";
import {
  getAspirantes,
  getCountPorCalificar,
  getCountCalificados,
  type AspiranteCalificacion,
} from "../../../services/programa/programaCalificacionCohorteService";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon, SearchIcon, SpinnerIcon } from "../../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

const POR_PAGINA = 10;

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Aspirante {
  id: string;
  nombre: string;
  estado: "por calificar" | "en progreso" | "calificado";
  correo: string;
  numerodocumento: number;
  puntaje: number | null;
}

// ── Helpers de mapeo ──────────────────────────────────────────────────────────

function mapEstado(estado: string): "por calificar" | "en progreso" | "calificado" {
  const m: Record<string, "por calificar" | "en progreso" | "calificado"> = {
    "VALIDADO_CALIFICADO":    "calificado",
    "VALIDADO_EN_PROGRESO":   "en progreso",
    "VALIDADO_POR_CALIFICAR": "por calificar",
  };
  return m[estado] ?? "por calificar";
}

function mapAspirante(a: AspiranteCalificacion): Aspirante {
  const estado = mapEstado(a.estado);
  return {
    id: String(a.id),
    nombre: a.nombreCompleto,
    estado,
    correo: a.correo,
    numerodocumento: a.numerodocumento,
    puntaje: (estado === "calificado" || a.puntajeTotal > 0) ? a.puntajeTotal : null,
  };
}

// ── Helper: badge de estado ───────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "calificado") {
    return (
      <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-lg">
        Calificado
      </span>
    );
  }
  if (estado === "en progreso") {
    return (
      <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-lg">
        En progreso
      </span>
    );
  }
  return (
    <span className="inline-block bg-neutral-200 text-neutral-600 text-xs font-semibold px-3 py-1 rounded-lg">
      Por calificar
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalificacionCohorte() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cohorteId } = useParams<{ cohorteId: string }>();
  const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

  const idCohorte = Number(cohorteId);
  const nombreCohorte = (location.state as { nombreCohorte?: string; activa?: boolean } | null)?.nombreCohorte;
  const activa        = (location.state as { nombreCohorte?: string; activa?: boolean } | null)?.activa ?? false;

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCerrando, setFiltroCerrando] = useState(false);
  const [pagina, setPagina] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [aspirantes, setAspirantes] = useState<Aspirante[]>([]);
  const [countPorCalificar, setCountPorCalificar] = useState(0);
  const [countCalificados, setCountCalificados] = useState(0);

  useEffect(() => { setPagina(1); }, [searchTerm, filtroEstado]);

  useEffect(() => {
    if (!idCohorte) {
      mostrarAlerta("No se encontró el identificador de la cohorte.", "error");
      return;
    }
    const cargar = async () => {
      setCargando(true);
      try {
        const [datos, porCalificar, calificados] = await Promise.all([
          getAspirantes(idCohorte),
          getCountPorCalificar(idCohorte),
          getCountCalificados(idCohorte),
        ]);
        setAspirantes((datos ?? []).map(mapAspirante));
        setCountPorCalificar(porCalificar ?? 0);
        setCountCalificados(calificados ?? 0);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : "Error al cargar los aspirantes. Intenta de nuevo.", "error");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCohorte]);

  const cerrarFiltro = (nuevoEstado?: string) => {
    setFiltroCerrando(true);
    setTimeout(() => {
      if (nuevoEstado !== undefined) setFiltroEstado(nuevoEstado);
      setMostrarFiltros(false);
      setFiltroCerrando(false);
    }, 120);
  };

  const totalEnCalificacion = aspirantes.length;
  const porcentajeCalificados = totalEnCalificacion > 0
    ? Math.round((countCalificados / totalEnCalificacion) * 100)
    : 0;

  const aspirantesFiltrados = aspirantes.filter(a => {
    const coincideBusqueda =
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.correo.toLowerCase().includes(searchTerm.toLowerCase());
    const coincifeEstado = filtroEstado === "todos" || a.estado === filtroEstado;
    return coincideBusqueda && coincifeEstado;
  });

  const totalPaginas = Math.ceil(aspirantesFiltrados.length / POR_PAGINA);
  const aspirantesPagina = aspirantesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const handleSeleccionarAspirante = (aspirante: Aspirante) => {
    navigate(`/programa/admision/calificacion/${aspirante.id}`, {
      state: { nombre: aspirante.nombre, correo: aspirante.correo, documento: aspirante.numerodocumento, cohorteId: idCohorte, nombreCohorte },
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="">

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <button
            onClick={() => navigate("/programa/admision/calificacion")}
            className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
          >
            <ArrowLeftIcon className="h-[18px] w-[18px] shrink-0" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Calificación de Aspirantes</h1>
            {nombreCohorte && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-neutral-400">Cohorte: {nombreCohorte}</span>
                {activa && (
                  <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg animate-fade-in">Activa</span>
                )}
              </div>
            )}
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
              Cargando aspirantes...
            </div>
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up delay-100">
                <div className="text-xs text-neutral-400 mb-1">Total en calificación</div>
                <div className="text-2xl font-semibold text-gray-900">{totalEnCalificacion}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up delay-200">
                <div className="text-xs text-neutral-400 mb-1">Por calificar</div>
                <div className="text-2xl font-semibold text-amber-400">{countPorCalificar}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up delay-300">
                <div className="text-xs text-neutral-400 mb-1">Calificados</div>
                <div className="text-2xl font-semibold text-green-700">{countCalificados}</div>
              </div>
            </div>

            {/* Barra de progreso */}
            {totalEnCalificacion > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-up delay-300">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-red-700 whitespace-nowrap">
                    {porcentajeCalificados}%
                  </span>
                  <div className="flex-1 bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-red-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${porcentajeCalificados}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-neutral-400 mt-2">
                  <span>Calificados: </span>
                  <span className="font-semibold text-red-700">{countCalificados}</span>
                  <span> de </span>
                  <span className="font-semibold text-gray-800">{totalEnCalificacion}</span>
                </div>
              </div>
            )}

            {/* Barra de búsqueda y filtros */}
            <div className="relative z-10 flex gap-3 mb-6 animate-fade-in-up delay-400">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Buscar aspirante por nombre o correo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-colors"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => mostrarFiltros ? cerrarFiltro() : setMostrarFiltros(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 bg-white"
                >
                  <FunnelIcon />
                  <span className="text-sm font-medium">Filtrar</span>
                </button>

                {mostrarFiltros && (
                  <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 ${filtroCerrando ? "animate-dropdown-out" : "animate-dropdown-in"}`}>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-neutral-400 uppercase px-3 py-2">
                        Estado
                      </div>
                      {[
                        { value: "todos",         label: "Todos" },
                        { value: "por calificar", label: "Por calificar" },
                        { value: "en progreso",   label: "En progreso" },
                        { value: "calificado",    label: "Calificado" },
                      ].map(opcion => (
                        <button
                          key={opcion.value}
                          onClick={() => cerrarFiltro(opcion.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            filtroEstado === opcion.value
                              ? "bg-red-50 text-red-700 font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {opcion.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up delay-500">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Documento</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Correo</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {aspirantesPagina.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-400">
                          No se encontraron aspirantes.
                        </td>
                      </tr>
                    ) : (
                      aspirantesPagina.map(aspirante => (
                        <tr
                          key={aspirante.id}
                          onClick={() => handleSeleccionarAspirante(aspirante)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{aspirante.nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{aspirante.numerodocumento}</td>
                          <td className="px-6 py-4 text-sm">
                            <EstadoBadge estado={aspirante.estado} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{aspirante.correo}</td>
                          <td className="px-6 py-4 text-sm">
                            {aspirante.puntaje !== null ? (
                              <span className="font-semibold text-red-700">{aspirante.puntaje.toFixed(1)}</span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, aspirantesFiltrados.length)} de {aspirantesFiltrados.length} aspirantes
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagina(p => p - 1)}
                      disabled={pagina === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                    >
                      <ChevronLeftIcon />
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-600 px-1">
                      {pagina} / {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPagina(p => p + 1)}
                      disabled={pagina === totalPaginas}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                    >
                      Siguiente
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
