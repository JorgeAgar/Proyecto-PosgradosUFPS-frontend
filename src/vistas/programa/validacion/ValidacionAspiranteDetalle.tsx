import { useEffect, useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useLocation,
} from "react-router";
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import {
  aprobarDocumento,
  rechazarDocumento,
  obtenerDocumentosAspirante,
  type DocumentoAspiranteValidacionApi,
  type DocumentosAspiranteResponse,
} from "../../../services/programa/validacionAspiranteService";
import { CheckIcon, SpinnerIcon, XMarkIcon } from "../../../assets/icons";

interface Documento {
  id: string;
  idDocumento: number;
  nombreTitulo: string;
  estado: DocumentoAspiranteValidacionApi["estado"];
  motivoRechazo: string | null;
  linkArchivo: string;
}

type TipoArchivo = "pdf" | "imagen" | "otro";

function detectarTipoArchivo(url: string): TipoArchivo {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|gif|webp|svg|bmp)$/.test(path)) return "imagen";
  return "otro";
}

function VisualizadorDocumento({ url, nombre }: { url: string; nombre: string }) {
  const tipo = detectarTipoArchivo(url);

  if (tipo === "pdf") {
    return (
      <object
        data={url}
        type="application/pdf"
        className="block h-full w-full"
      >
        <p className="p-4 text-sm text-gray-500">
          Tu navegador no soporta visualización de PDFs.{" "}
          <a href={url} className="text-red-700 underline">
            Descárgalo aquí
          </a>
          .
        </p>
      </object>
    );
  }

  if (tipo === "imagen") {
    return (
      <div className="flex h-full min-h-0 items-center justify-center p-4">
        <img
          src={url}
          alt={nombre}
          className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center text-sm text-gray-500 px-6 text-center">
      Formato no compatible para previsualización.
    </div>
  );
}

function calcularPorcentaje(validados: number, total: number) {
  if (total === 0) return 0;
  return Math.round((validados / total) * 100);
}

export default function ValidacionAspiranteDetalle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mostrarAlerta, mostrarConfirm } =
    useOutletContext<ProgramaOutletContext>();
  const { cohorteId, aspiranteId } = useParams();
  const aspiranteIdNumerico = aspiranteId ? Number(aspiranteId) : undefined;

  const nombreCohorte = (
    location.state as { nombreCohorte?: string; activa?: boolean } | null
  )?.nombreCohorte;
  const activa =
    (location.state as { nombreCohorte?: string; activa?: boolean } | null)
      ?.activa ?? false;

  const [aspirante, setAspirante] =
    useState<DocumentosAspiranteResponse | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentoSeleccionadoId, setDocumentoSeleccionadoId] = useState<
    string | null
  >(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarConfirmacionAprobar, setMostrarConfirmacionAprobar] =
    useState(false);
  const [cerrandoConfirmacionAprobar, setCerrandoConfirmacionAprobar] =
    useState(false);
  const [mostrarDialogoRechazo, setMostrarDialogoRechazo] = useState(false);
  const [cerrandoDialogoRechazo, setCerrandoDialogoRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [accionEnviando, setAccionEnviando] = useState<
    "APROBAR" | "RECHAZAR" | null
  >(null);

  useEffect(() => {
    const cargar = async () => {
      if (!aspiranteIdNumerico || Number.isNaN(aspiranteIdNumerico)) {
        mostrarAlerta("Los parámetros de la ruta no son válidos.", "error");
        setCargando(false);
        return;
      }
      setCargando(true);
      try {
        const data = await obtenerDocumentosAspirante(aspiranteIdNumerico);
        const normalizados: Documento[] = data.documentos.map((d) => ({
          id: `${d.idDocumentosrequisitoconsejocohorte}-${d.idDocumentosrequisitoprogramacohorte}`,
          idDocumento: d.idDocumento,
          nombreTitulo: d.nombreTitulo,
          estado: d.estado,
          motivoRechazo: d.motivoRechazo,
          linkArchivo: d.linkArchivo,
        }));
        setAspirante(data);
        setDocumentos(normalizados);
        setDocumentoSeleccionadoId(normalizados[0]?.id ?? null);
      } catch {
        mostrarAlerta(
          "No se pudieron cargar los documentos del aspirante.",
          "error",
        );
      } finally {
        setCargando(false);
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspiranteIdNumerico]);

  const documentoSeleccionado =
    documentos.find((d) => d.id === documentoSeleccionadoId) ?? null;

  const documentosValidados = documentos.filter(
    (d) => d.estado === "APROBADO",
  ).length;
  const totalDocumentos = documentos.length;
  const todosValidados =
    totalDocumentos > 0 && documentosValidados === totalDocumentos;

  const cerrarModalAprobar = () => {
    setCerrandoConfirmacionAprobar(true);
    setTimeout(() => {
      setMostrarConfirmacionAprobar(false);
      setCerrandoConfirmacionAprobar(false);
    }, 170);
  };

  const cerrarModalRechazo = () => {
    setCerrandoDialogoRechazo(true);
    setTimeout(() => {
      setMostrarDialogoRechazo(false);
      setCerrandoDialogoRechazo(false);
      setMotivoRechazo("");
    }, 170);
  };

  const actualizarDocumentoSeleccionado = async (
    estado: "APROBADO" | "RECHAZADO",
  ) => {
    if (!documentoSeleccionado) return;

    const respuesta =
      estado === "APROBADO"
        ? await aprobarDocumento(documentoSeleccionado.idDocumento)
        : await rechazarDocumento(
            documentoSeleccionado.idDocumento,
            motivoRechazo.trim(),
          );

    setDocumentos((prev) => {
      const actualizados = prev.map((d) =>
        d.id === documentoSeleccionado.id
          ? {
              ...d,
              estado: respuesta.estado,
              motivoRechazo: respuesta.motivoRechazo ?? null,
            }
          : d,
      );
      const currentIndex = actualizados.findIndex(d => d.id === documentoSeleccionado.id);
      const siguiente = actualizados.find(
        (d, i) => i > currentIndex && d.estado !== "APROBADO",
      );
      setDocumentoSeleccionadoId(siguiente?.id ?? documentoSeleccionado.id);
      return actualizados;
    });
  };

  const confirmarAprobar = async () => {
    try {
      setAccionEnviando("APROBAR");
      await actualizarDocumentoSeleccionado("APROBADO");
      cerrarModalAprobar();
      mostrarConfirm("Documento aprobado correctamente.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo actualizar el estado del documento.");
    } finally {
      setAccionEnviando(null);
    }
  };

  const confirmarRechazo = async () => {
    if (!motivoRechazo.trim()) return;
    try {
      setAccionEnviando("RECHAZAR");
      await actualizarDocumentoSeleccionado("RECHAZADO");
      cerrarModalRechazo();
      mostrarConfirm("Documento rechazado.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo actualizar el estado del documento.");
    } finally {
      setAccionEnviando(null);
    }
  };

  return (
    <div
      className="p-6 bg-gray-100 min-h-full"
      style={{ fontFamily: "Segoe UI, sans-serif" }}
    >
      <div className="">
        <button
          type="button"
          onClick={() =>
            navigate(`/programa/validacion/cohorte/${cohorteId}`, {
              state: { nombreCohorte, activa },
            })
          }
          className="flex items-center gap-2 text-red-700 hover:text-red-800 mb-6 transition-colors animate-fade-in"
        >
          <ArrowLeftIcon className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium truncate">
            Validación / {nombreCohorte ?? `Cohorte ${cohorteId}`} / Aspirantes
          </span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-auto lg:h-[calc(100vh-160px)]">
          {cargando ? (
            <>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-36">
                  <div className="flex items-center gap-3 text-neutral-400 text-sm">
                    <SpinnerIcon className="animate-spin h-5 w-5 text-red-700 shrink-0" />
                    Cargando información del aspirante...
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-40">
                  <div className="flex items-center gap-3 text-neutral-400 text-sm">
                    <SpinnerIcon className="animate-spin h-5 w-5 text-red-700 shrink-0" />
                    Cargando documentos...
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-52">
                <div className="flex items-center gap-3 text-neutral-400 text-sm">
                  <SpinnerIcon className="animate-spin h-5 w-5 text-red-700 shrink-0" />
                  Cargando visualizador...
                </div>
              </div>
            </>
          ) : aspirante ? (
            <>
              {/* Columna izquierda */}
              <div className="space-y-3 sm:space-y-4 lg:overflow-y-auto animate-fade-in-up delay-100">
                {/* Info aspirante */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                    Información del aspirante
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <div className="text-xs text-neutral-400 mb-1">
                        Nombre completo
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {aspirante.nombreAspirante}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 mb-1">
                        Documento de identidad
                      </div>
                      <div className="text-sm text-gray-900">
                        {aspirante.cedula}
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600">
                          Progreso de validación
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {documentosValidados}/{totalDocumentos}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-700 h-2 rounded-full transition-all"
                          style={{
                            width: `${calcularPorcentaje(documentosValidados, totalDocumentos)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista documentos */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 shrink-0" />
                    Documentos
                  </h2>
                  <div className="space-y-2">
                    {documentos.map((documento) => (
                      <button
                        key={documento.id}
                        type="button"
                        onClick={() => setDocumentoSeleccionadoId(documento.id)}
                        className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 min-h-[3rem] ${
                          documentoSeleccionado?.id === documento.id
                            ? "border-red-700 bg-red-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {documento.nombreTitulo}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 self-center w-5 h-5 aspect-square rounded-full border-2 flex items-center justify-center ${
                            documento.estado === "APROBADO"
                              ? "border-green-500 bg-green-500"
                              : documento.estado === "RECHAZADO"
                                ? "border-red-700 bg-red-700"
                                : "border-yellow-400 bg-yellow-50"
                          }`}
                        >
                          {documento.estado === "APROBADO" && (
                            <CheckIcon className="w-2.5 h-2.5 text-white" />
                          )}
                          {documento.estado === "RECHAZADO" && (
                            <XMarkIcon className="w-2.5 h-2.5 text-white" strokeWidth="2.5" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna derecha — visualizador */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 flex flex-col animate-fade-in-up delay-200 min-h-[360px] sm:min-h-[480px] lg:min-h-0">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {documentoSeleccionado?.nombreTitulo ?? "Documento"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (documentoSeleccionado?.linkArchivo) {
                        window.open(
                          documentoSeleccionado.linkArchivo,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                    }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Descargar</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden bg-gray-100 rounded-lg flex flex-col mb-4 min-h-[240px] sm:min-h-[280px]">
                  {documentoSeleccionado ? (
                    <VisualizadorDocumento
                      url={documentoSeleccionado.linkArchivo}
                      nombre={documentoSeleccionado.nombreTitulo}
                    />
                  ) : (
                    <div className="flex h-full min-h-0 items-center justify-center text-sm text-neutral-400">
                      Selecciona un documento para visualizarlo.
                    </div>
                  )}
                </div>

                {documentoSeleccionado && (
                  <div className="space-y-3">
                    {todosValidados && (
                      <div className="text-center">
                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-lg border border-green-200">
                          <CheckIcon className="w-4 h-4 shrink-0" strokeWidth="2" />
                          Todos los documentos validados
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setMostrarDialogoRechazo(true)}
                        disabled={accionEnviando !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-700 border-2 border-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmacionAprobar(true)}
                        disabled={
                          accionEnviando !== null ||
                          documentoSeleccionado.estado === "APROBADO"
                        }
                        title={
                          documentoSeleccionado.estado === "APROBADO"
                            ? "Este documento ya está aprobado"
                            : undefined
                        }
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal: Confirmar aprobación */}
        {mostrarConfirmacionAprobar && (
          <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoConfirmacionAprobar ? "animate-overlay-out" : "animate-overlay-in"}`}
          >
            <div
              className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoConfirmacionAprobar ? "animate-modal-out" : "animate-modal-in"}`}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar aprobación
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700">
                  ¿Está seguro de aprobar el documento{" "}
                  <strong>"{documentoSeleccionado?.nombreTitulo}"</strong>?
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalAprobar}
                  disabled={accionEnviando !== null}
                  className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarAprobar}
                  disabled={accionEnviando !== null}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accionEnviando === "APROBAR" ? (
                    <>
                      <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
                      Aprobando...
                    </>
                  ) : (
                    "Sí, aprobar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Rechazar documento */}
        {mostrarDialogoRechazo && (
          <div
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoDialogoRechazo ? "animate-overlay-out" : "animate-overlay-in"}`}
          >
            <div
              className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full mx-4 ${cerrandoDialogoRechazo ? "animate-modal-out" : "animate-modal-in"}`}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Rechazar documento
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-gray-700">
                  Está rechazando{" "}
                  <strong>"{documentoSeleccionado?.nombreTitulo}"</strong>.
                  Ingrese el motivo:
                </p>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ingrese el motivo del rechazo..."
                  rows={4}
                  disabled={accionEnviando !== null}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!motivoRechazo.trim() && (
                  <p className="text-xs text-neutral-400">
                    El motivo es obligatorio para rechazar.
                  </p>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalRechazo}
                  disabled={accionEnviando !== null}
                  className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarRechazo}
                  disabled={!motivoRechazo.trim() || accionEnviando !== null}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accionEnviando === "RECHAZAR" ? (
                    <>
                      <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
                      Rechazando...
                    </>
                  ) : (
                    "Rechazar documento"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
