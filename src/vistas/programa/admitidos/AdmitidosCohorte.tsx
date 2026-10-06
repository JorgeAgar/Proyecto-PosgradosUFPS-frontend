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
import { CheckCircleIcon, ListBulletIcon, RefreshIcon, SpinnerIcon } from "../../../assets/icons";
import BuscadorConFiltro from "../../../components/BuscadorConFiltro";
import Cargando from "../../../components/Cargando";
import { DialogoConfirmacion } from "../../../components/Dialogo";
import EncabezadoVolver from "../../../components/EncabezadoVolver";
import { TarjetasEstadisticas, TarjetaProgreso } from "../../../components/Estadisticas";
import Paginacion from "../../../components/Paginacion";
import Tabla from "../../../components/Tabla";

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

  const aspirantesPagina = aspirantesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const totalEnAdmision = aspirantes.filter((a) => a.completamenteCalificado).length;
  const porAdmitir = aspirantes.filter((a) => a.completamenteCalificado && !a.admitido).length;

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="">

        <EncabezadoVolver
          titulo="Admitidos"
          onVolver={() => navigate("/programa/admision/admitidos")}
          nombreCohorte={cohorteNombre}
          activa={cohorteActiva}
        >
          {/* Acciones */}
          <div className="flex items-center gap-2 mt-6 flex-wrap">
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
        </EncabezadoVolver>

        {rankingLoading ? (
          <Cargando texto="Cargando ranking..." />
        ) : (
          <>
            <TarjetasEstadisticas
              items={[
                { etiqueta: "Total en admisión", valor: totalEnAdmision },
                { etiqueta: "Por admitir", valor: porAdmitir, color: "text-amber-400" },
                {
                  etiqueta: "Admitidos",
                  valor: <>{totalAdmitidos}<span className="text-base font-normal text-neutral-400"> / {totalEnAdmision}</span></>,
                  color: "text-green-700",
                },
              ]}
            />

            <TarjetaProgreso etiqueta="Admitidos" actual={totalAdmitidos} total={totalEnAdmision} />

            <BuscadorConFiltro
              busqueda={searchTerm}
              onBusqueda={(v) => { setSearchTerm(v); setPagina(1); }}
              placeholder="Buscar aspirante por nombre o correo..."
              tituloFiltro="Estado de admisión"
              filtro={filtroAdmision}
              onFiltro={(v) => { setFiltroAdmision(v); setPagina(1); }}
              opciones={[
                { value: "todos", label: "Todos" },
                { value: "admitidos", label: "Admitidos" },
                { value: "porAdmitir", label: "Por admitir" },
              ]}
            />

            {/* Tabla de ranking */}
            <Tabla
              columnas={["Ranking", "Nombre", "Correo", "Puntaje", { titulo: "Admisión", alinear: "center" }]}
              vacia={aspirantesFiltrados.length === 0}
              mensajeVacio="No hay aspirantes que coincidan con los filtros seleccionados."
              pie={<Paginacion pagina={pagina} porPagina={POR_PAGINA} totalElementos={aspirantesFiltrados.length} onCambiar={setPagina} />}
            >
                      {aspirantesPagina.map((aspirante) => (
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
                                  <CheckCircleIcon className="h-4 w-4" />
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
                      ))}
          </Tabla>
        </>
      )}
      </div>

      {/* ── Modal: Confirmar finalizar proceso ───────────────────────────────── */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarFinalizar}
        cerrando={confirmarFinalizarCerrando}
        titulo="Finalizar proceso de admisión"
        onCancelar={cerrarConfirmarFinalizar}
        onConfirmar={handleFinalizarProceso}
        textoConfirmar="Finalizar"
        textoProcesando="Finalizando..."
        procesando={finalizandoProceso}
      >
        ¿Estás seguro de que deseas finalizar el proceso de admisión? Esta acción no se puede deshacer y bloqueará la modificación de admisiones.
      </DialogoConfirmacion>

      {/* ── Modal: Confirmar admitir / revertir ───────────────────────────────── */}
      {aspiranteObjetivo && (
        <DialogoConfirmacion
          abierto={mostrarConfirmacion}
          cerrando={confirmacionCerrando}
          titulo={aspiranteObjetivo.admitido ? "Revertir admisión" : "Confirmar admisión"}
          onCancelar={cerrarConfirmacion}
          onConfirmar={confirmarAccion}
          procesando={procesando}
          confirmarDeshabilitado={!aspiranteObjetivo.admitido && totalAdmitidos >= cuposDisponibles}
        >
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
        </DialogoConfirmacion>
      )}

    </div>
  );
}
