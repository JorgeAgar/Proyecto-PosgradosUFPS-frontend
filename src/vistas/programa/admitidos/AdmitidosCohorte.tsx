import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router";
import {
  fetchRankingAdmitidosByCohorte,
  admitirAspirante,
  revertirAdmision,
  finalizarProcesoAdmision,
  estaFinalizadoProcesoAdmision,
  downloadAdmittedListPdf,
  type AspiranteRankingItem,
  type FiltroAdmision,
} from "../../../services/programa/programaAdmitidosCohorteService";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { SpinnerIcon } from "../../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-[18px] w-[18px] shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-[18px] w-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function FunnelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-[18px] w-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function ListBulletIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}


const POR_PAGINA = 10;

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdmitidosCohorte() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cohorteId } = useParams<{ cohorteId: string }>();
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();

  const nombreCohorteState = (location.state as { nombreCohorte?: string } | null)?.nombreCohorte;

  // ── Estado de ranking ─────────────────────────────────────────────────────
  const [rankingLoading, setRankingLoading] = useState(true);
  const [cohorteNombre, setCohorteNombre] = useState(nombreCohorteState ?? "");
  const [cohorteActiva, setCohorteActiva] = useState(false);
  const [cuposDisponibles, setCuposDisponibles] = useState(0);
  const [totalAdmitidos, setTotalAdmitidos] = useState(0);
  const [aspirantes, setAspirantes] = useState<AspiranteRankingItem[]>([]);
  const [procesoFinalizado, setProcesoFinalizado] = useState(false);

  // ── Estado de búsqueda/filtro ─────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroAdmision, setFiltroAdmision] = useState<FiltroAdmision>("todos");
  const [pagina, setPagina] = useState(1);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCerrando, setFiltroCerrando] = useState(false);

  // ── Estado de confirmación (admitir / revertir) ───────────────────────────
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [confirmacionCerrando, setConfirmacionCerrando] = useState(false);
  const [aspiranteObjetivo, setAspiranteObjetivo] = useState<AspiranteRankingItem | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [finalizandoProceso, setFinalizandoProceso] = useState(false);

  // ── Estado de confirmación (finalizar proceso) ────────────────────────────
  const [mostrarConfirmarFinalizar, setMostrarConfirmarFinalizar] = useState(false);
  const [confirmarFinalizarCerrando, setConfirmarFinalizarCerrando] = useState(false);

  // ── Estado descarga PDF de admitidos ──────────────────────────────────────
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // ── Carga inicial del ranking ─────────────────────────────────────────────

  const loadRanking = async (id: string) => {
    setRankingLoading(true);
    try {
      const data = await fetchRankingAdmitidosByCohorte(id);
      setCohorteNombre(data.cohorteActual.nombre || nombreCohorteState || "");
      setCohorteActiva(data.cohorteActual.activa);
      setCuposDisponibles(data.cohorteActual.cuposDisponibles);
      setTotalAdmitidos(data.cohorteActual.totalAdmitidos);
      setAspirantes(data.aspirantes);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Error al cargar el ranking de la cohorte. Intenta de nuevo.", "error");
    } finally {
      setRankingLoading(false);
    }
  };

  const loadEstadoProceso = async (id: string) => {
    setProcesoFinalizado(false);
    try {
      const finalizado = await estaFinalizadoProcesoAdmision(id);
      setProcesoFinalizado(finalizado);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo verificar el estado del proceso de admisión.", "error");
    }
  };

  useEffect(() => {
    if (!cohorteId) {
      mostrarAlerta("No se encontró el identificador de la cohorte.", "error");
      return;
    }
    loadRanking(cohorteId);
    loadEstadoProceso(cohorteId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohorteId]);

  useEffect(() => { setPagina(1); }, [searchTerm, filtroAdmision]);

  // ── Aspirantes filtrados ──────────────────────────────────────────────────

  const aspirantesFiltrados = useMemo(() => {
    return aspirantes.filter((a) => {
      const coincideBusqueda =
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.correo.toLowerCase().includes(searchTerm.toLowerCase());
      const coincideAdmision =
        filtroAdmision === "todos" ||
        (filtroAdmision === "admitidos" && a.admitido) ||
        (filtroAdmision === "porAdmitir" && !a.admitido);
      return a.completamenteCalificado && coincideBusqueda && coincideAdmision;
    });
  }, [aspirantes, searchTerm, filtroAdmision]);

  // ── Handlers filtro ───────────────────────────────────────────────────────

  const cerrarFiltro = (nuevoFiltro?: FiltroAdmision) => {
    setFiltroCerrando(true);
    setTimeout(() => {
      if (nuevoFiltro !== undefined) setFiltroAdmision(nuevoFiltro);
      setMostrarFiltros(false);
      setFiltroCerrando(false);
    }, 120);
  };

  // ── Handlers admisión ─────────────────────────────────────────────────────

  const handleAdmitir = (aspirante: AspiranteRankingItem) => {
    setAspiranteObjetivo(aspirante);
    setMostrarConfirmacion(true);
  };

  const handleQuitarAdmision = (aspirante: AspiranteRankingItem) => {
    setAspiranteObjetivo(aspirante);
    setMostrarConfirmacion(true);
  };

  const cerrarConfirmacion = () => {
    setConfirmacionCerrando(true);
    setTimeout(() => {
      setMostrarConfirmacion(false);
      setAspiranteObjetivo(null);
      setConfirmacionCerrando(false);
    }, 170);
  };

  const confirmarAccion = async () => {
    if (!aspiranteObjetivo || !cohorteId) return;
    setProcesando(true);
    try {
      if (aspiranteObjetivo.admitido) {
        await revertirAdmision(cohorteId, aspiranteObjetivo.id);
        setAspirantes((prev) =>
          prev.map((a) => (a.id === aspiranteObjetivo.id ? { ...a, admitido: false } : a))
        );
        setTotalAdmitidos((prev) => Math.max(prev - 1, 0));
        cerrarConfirmacion();
        mostrarConfirm("Admisión revertida correctamente.");
      } else {
        if (totalAdmitidos >= cuposDisponibles) {
          mostrarAlerta("No hay cupos disponibles para admitir más aspirantes.", "advertencia");
          cerrarConfirmacion();
          return;
        }
        await admitirAspirante(cohorteId, aspiranteObjetivo.id);
        setAspirantes((prev) =>
          prev.map((a) => (a.id === aspiranteObjetivo.id ? { ...a, admitido: true } : a))
        );
        setTotalAdmitidos((prev) => prev + 1);
        cerrarConfirmacion();
        mostrarConfirm("Aspirante admitido correctamente.");
      }
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo completar la operación de admisión. Intenta de nuevo.", "error");
      cerrarConfirmacion();
    } finally {
      setProcesando(false);
    }
  };

  // ── Handlers generar lista ────────────────────────────────────────────────

  const handleGenerarLista = async () => {
    if (!cohorteId || generandoPdf) return;
    setGenerandoPdf(true);
    try {
      const blob = await downloadAdmittedListPdf(cohorteId);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      mostrarConfirm("PDF de admitidos generado correctamente.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Error al generar el PDF de admitidos. Intenta de nuevo.", "error");
    } finally {
      setGenerandoPdf(false);
    }
  };

  const cerrarConfirmarFinalizar = () => {
    setConfirmarFinalizarCerrando(true);
    setTimeout(() => {
      setMostrarConfirmarFinalizar(false);
      setConfirmarFinalizarCerrando(false);
    }, 170);
  };

  const handleFinalizarProceso = async () => {
    if (!cohorteId || procesoFinalizado || finalizandoProceso) return;
    cerrarConfirmarFinalizar();
    setFinalizandoProceso(true);
    try {
      await finalizarProcesoAdmision(cohorteId);
      setProcesoFinalizado(true);
      mostrarConfirm("Proceso de admisión finalizado correctamente.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo finalizar el proceso de admisión. Intenta de nuevo.", "error");
    } finally {
      setFinalizandoProceso(false);
    }
  };

  const totalPaginas = Math.ceil(aspirantesFiltrados.length / POR_PAGINA);
  const aspirantesPagina = aspirantesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const totalEnAdmision = aspirantes.filter((a) => a.completamenteCalificado).length;
  const porAdmitir = aspirantes.filter((a) => a.completamenteCalificado && !a.admitido).length;
  const pctAdmitidos = totalEnAdmision > 0 ? Math.round((totalAdmitidos / totalEnAdmision) * 100) : 0;

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="">

        {/* Encabezado */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <button
              onClick={() => navigate("/programa/admision/admitidos")}
              className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
            >
              <ArrowLeftIcon />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admitidos</h1>
              {cohorteNombre && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-neutral-400">Cohorte: {cohorteNombre}</span>
                  {cohorteActiva && (
                    <span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg animate-fade-in">Activa</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => cohorteId && loadRanking(cohorteId)}
              disabled={rankingLoading}
              title="Recargar ranking"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {rankingLoading ? <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-red-700" /> : <RefreshIcon />}
              <span>Refrescar</span>
            </button>
            <button
              onClick={handleGenerarLista}
              disabled={rankingLoading || generandoPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generandoPdf ? <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" /> : <ListBulletIcon />}
              Generar lista de admitidos
            </button>
            <button
              onClick={() => setMostrarConfirmarFinalizar(true)}
              disabled={rankingLoading || finalizandoProceso || procesoFinalizado}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-white text-red-700 text-sm rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {finalizandoProceso ? <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-red-700" /> : null}
              <span>{procesoFinalizado ? "Proceso finalizado" : "Finalizar proceso de admisión"}</span>
            </button>
          </div>
        </div>

        {rankingLoading ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-red-700" />
              Cargando ranking...
            </div>
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up delay-100">
                <div className="text-xs text-neutral-400 mb-1">Total en admisión</div>
                <div className="text-2xl font-bold text-gray-900">{totalEnAdmision}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up delay-200">
                <div className="text-xs text-neutral-400 mb-1">Por admitir</div>
                <div className="text-2xl font-bold text-amber-400">{porAdmitir}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up delay-300">
                <div className="text-xs text-neutral-400 mb-1">Admitidos</div>
                <div className="text-2xl font-bold text-green-700">{totalAdmitidos}<span className="text-base font-normal text-neutral-400"> / {totalEnAdmision}</span></div>
              </div>
            </div>

            {/* Barra de progreso */}
            {totalEnAdmision > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-up delay-300">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-red-700 whitespace-nowrap">
                    {pctAdmitidos}%
                  </span>
                  <div className="flex-1 bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-red-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pctAdmitidos}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-neutral-400 mt-2">
                  <span>Admitidos: </span>
                  <span className="font-semibold text-red-700">{totalAdmitidos}</span>
                  <span> de </span>
                  <span className="font-semibold text-gray-800">{totalEnAdmision}</span>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-colors"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => (mostrarFiltros ? cerrarFiltro() : setMostrarFiltros(true))}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 bg-white"
                >
                  <FunnelIcon />
                  <span className="text-sm font-medium">Filtrar</span>
                </button>

                {mostrarFiltros && (
                  <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 ${filtroCerrando ? "animate-dropdown-out" : "animate-dropdown-in"}`}>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-neutral-400 uppercase px-3 py-2">
                        Estado de admisión
                      </div>
                      {([
                        { value: "todos" as FiltroAdmision, label: "Todos" },
                        { value: "admitidos" as FiltroAdmision, label: "Admitidos" },
                        { value: "porAdmitir" as FiltroAdmision, label: "Por admitir" },
                      ]).map((opcion) => (
                        <button
                          key={opcion.value}
                          onClick={() => cerrarFiltro(opcion.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            filtroAdmision === opcion.value
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

            {/* Tabla de ranking */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up delay-500">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ranking</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Correo</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Puntaje</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Admisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {aspirantesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-400">
                          No hay aspirantes que coincidan con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      aspirantesPagina.map((aspirante) => (
                        <tr
                          key={aspirante.id}
                          className={`transition-colors ${
                            aspirante.admitido ? "bg-green-50 hover:bg-green-100/60" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4 text-sm">
                            <span className="font-bold text-red-700 text-base">#{aspirante.ranking}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{aspirante.nombre}</td>
                          <td className="px-6 py-4 text-sm text-neutral-400">{aspirante.correo}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="font-semibold text-red-700">{aspirante.puntaje.toFixed(1)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {aspirante.admitido ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-lg border border-green-200">
                                  <CheckCircleIcon />
                                  Admitido
                                </span>
                                {!procesoFinalizado ? (
                                  <button
                                    onClick={() => handleQuitarAdmision(aspirante)}
                                    disabled={procesando}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-60 transition-colors font-medium"
                                  >
                                    {procesando && aspiranteObjetivo?.id === aspirante.id ? <SpinnerIcon className="animate-spin shrink-0 h-3.5 w-3.5 text-white" /> : null}
                                    Revertir
                                  </button>
                                ) : (
                                  <span className="text-xs text-neutral-400">Proceso finalizado</span>
                                )}
                              </div>
                            ) : (
                              !procesoFinalizado ? (
                                <button
                                  onClick={() => handleAdmitir(aspirante)}
                                  disabled={totalAdmitidos >= cuposDisponibles || procesando}
                                  className="px-4 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {procesando && aspiranteObjetivo?.id === aspirante.id ? <SpinnerIcon className="animate-spin shrink-0 h-3.5 w-3.5 text-white inline mr-1" /> : null}
                                  Admitir
                                </button>
                              ) : (
                                <span className="text-xs text-neutral-400">Proceso finalizado</span>
                              )
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
                      onClick={() => setPagina((p) => p - 1)}
                      disabled={pagina === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                    >
                      <ChevronLeftIcon />
                      Anterior
                    </button>
                    <span className="text-sm font-medium text-gray-600 px-1">{pagina} / {totalPaginas}</span>
                    <button
                      onClick={() => setPagina((p) => p + 1)}
                      disabled={pagina === totalPaginas}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                    >
                      Siguiente
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: Confirmar finalizar proceso ───────────────────────────────── */}
      {mostrarConfirmarFinalizar && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${confirmarFinalizarCerrando ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${confirmarFinalizarCerrando ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Finalizar proceso de admisión</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas finalizar el proceso de admisión? Esta acción no se puede deshacer y bloqueará la modificación de admisiones.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmarFinalizar}
                disabled={finalizandoProceso}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizarProceso}
                disabled={finalizandoProceso}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finalizandoProceso ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" />Finalizando...</> : "Finalizar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar admitir / revertir ───────────────────────────────── */}
      {mostrarConfirmacion && aspiranteObjetivo && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${confirmacionCerrando ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${confirmacionCerrando ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {aspiranteObjetivo.admitido ? "Revertir admisión" : "Confirmar admisión"}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700">
                {aspiranteObjetivo.admitido
                  ? `¿Estás seguro de revertir la admisión de ${aspiranteObjetivo.nombre}?`
                  : `¿Estás seguro de admitir a ${aspiranteObjetivo.nombre}?`}
              </p>
              {!aspiranteObjetivo.admitido && totalAdmitidos >= cuposDisponibles && (
                <div className="mt-3 text-sm text-amber-400 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2">
                  No hay cupos disponibles para admitir más aspirantes.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmacion}
                disabled={procesando}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAccion}
                disabled={procesando || (!aspiranteObjetivo.admitido && totalAdmitidos >= cuposDisponibles)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" />Procesando...</> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
