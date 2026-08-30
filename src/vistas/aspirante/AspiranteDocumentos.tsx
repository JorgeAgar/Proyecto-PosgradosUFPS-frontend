import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router";
import {
  fetchDocumentosRequeridos,
  fetchDocumentosSubidos,
  subirDocumento,
  actualizarDocumento,
  type DocumentoRequerido,
  type DocumentoSubido,
} from "../../services/aspirante/aspiranteDocumentosService";
import type { AspiranteOutletContext } from "../../layouts/AspiranteLayout";
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, DocumentTextIcon, InformationCircleIcon, LockIcon, SpinnerIcon } from "../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface DocView extends DocumentoRequerido {
  estado?: string;
  motivoRechazo?: string | null;
  linkArchivo?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esRechazado(estado?: string): boolean {
  return !!estado && estado.toLowerCase().includes("rechaz");
}

function puedeSubirArchivo(estado?: string): boolean {
  return !estado || esRechazado(estado) || (!!estado && estado.toLowerCase().includes("pendient"));
}

function mergeSubidos(requeridos: DocView[], subidos: DocumentoSubido[]): DocView[] {
  return requeridos.map(d => {
    const subido = subidos.find(
      s =>
        s.idDocumentosrequisitoconsejocohorte === d.idDocumentosrequisitoconsejocohorte &&
        s.idDocumentosrequisitoprogramacohorte === d.idDocumentosrequisitoprogramacohorte
    );
    if (!subido) return { ...d, estado: undefined, motivoRechazo: undefined, linkArchivo: undefined };
    return { ...d, estado: subido.estado, motivoRechazo: subido.motivoRechazo, linkArchivo: subido.linkArchivo };
  });
}

// ── Badge de estado ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado?: string }) {
  if (!estado) return null;
  const lower = estado.toLowerCase();
  if (lower.includes("rechaz")) {
    return (
      <span className="inline-block bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
        Rechazado
      </span>
    );
  }
  if (lower.includes("aprob")) {
    return (
      <span className="inline-block bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
        Aprobado
      </span>
    );
  }
  if (lower.includes("revis")) {
    return (
      <span className="inline-block bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
        En revisión
      </span>
    );
  }
  if (lower.includes("pendient")) {
    return (
      <span className="inline-block bg-yellow-100 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-block bg-neutral-200 text-neutral-600 border border-gray-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
      {estado}
    </span>
  );
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500", "delay-600"] as const;

// ── Componente principal ──────────────────────────────────────────────────────

export default function AspiranteDocumentos() {
  const { mostrarAlerta, mostrarConfirm, soloInscrito } = useOutletContext<AspiranteOutletContext>();

  const [documentos, setDocumentos] = useState<DocView[]>([]);
  const [submittedCount, setSubmittedCount] = useState<number>(0);
  const [cargando, setCargando] = useState(true);
  const [localFiles, setLocalFiles] = useState<Record<number, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviandoIdx, setEnviandoIdx] = useState<Record<number, boolean>>({});
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cerrandoConfirmar, setCerrandoConfirmar] = useState(false);

  // ── Cierre animado del modal ──────────────────────────────────────────────

  const cerrarConfirmar = useCallback(() => {
    setCerrandoConfirmar(true);
    setTimeout(() => {
      setMostrarConfirmar(false);
      setCerrandoConfirmar(false);
    }, 170);
  }, []);

  // ── Carga inicial ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (soloInscrito !== false) return;
    let cancelled = false;

    async function cargarTodo() {
      setCargando(true);
      try {
        const requeridos = await fetchDocumentosRequeridos();
        if (cancelled) return;
        const inicial: DocView[] = requeridos.map(r => ({
          ...r,
          estado: undefined,
          motivoRechazo: undefined,
          linkArchivo: undefined,
        }));
        setDocumentos(inicial);

        try {
          const res = await fetchDocumentosSubidos();
          if (cancelled) return;
          setSubmittedCount(res.documentos.length);
          setDocumentos(mergeSubidos(inicial, res.documentos));
        } catch {
          setSubmittedCount(0);
        }
      } catch (err) {
        if (cancelled) return;
        mostrarAlerta(
          err instanceof Error ? err.message : "Error al cargar los documentos requeridos."
        );
      } finally {
        if (!cancelled) setCargando(false);
      }
    }

    cargarTodo();
    return () => { cancelled = true; };
  }, [mostrarAlerta, soloInscrito]);

  // ── Selección local de archivos ───────────────────────────────────────────

  const TIPOS_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg'];

  const handleFileChange = (idx: number, file: File | null) => {
    if (!file) return;
    const doc = documentos[idx];
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setFileErrors(prev => ({
        ...prev,
        [idx]: 'Solo se permiten archivos PDF, PNG, JPG o JPEG.',
      }));
      return;
    }
    const maxBytes = doc.tamanoMaximoMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileErrors(prev => ({
        ...prev,
        [idx]: `El archivo supera el tamaño máximo permitido de ${doc.tamanoMaximoMB} MB.`,
      }));
      return;
    }
    setFileErrors(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    setLocalFiles(prev => ({ ...prev, [idx]: file }));
  };

  // ── Envío de documentos ───────────────────────────────────────────────────

  const handleEnviarConfirmado = async () => {
    cerrarConfirmar();
    setEnviando(true);
    let errorMsg: string | null = null;

    for (let i = 0; i < documentos.length; i++) {
      const doc = documentos[i];
      const file = localFiles[i];
      if (!file) continue;

      try {
        await subirDocumento(
          doc.idDocumentosrequisitoconsejocohorte,
          doc.idDocumentosrequisitoprogramacohorte,
          file
        );
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : `Error al subir "${doc.nombre}"`;
        break;
      }
    }

    try {
      const res = await fetchDocumentosSubidos();
      setSubmittedCount(res.documentos.length);
      setDocumentos(prev => mergeSubidos(prev, res.documentos));
    } catch {
      // ignorar error de refresco
    }

    setEnviando(false);

    if (errorMsg) {
      mostrarAlerta(errorMsg);
    } else {
      setLocalFiles({});
      mostrarConfirm("Documentos enviados con éxito.");
    }
  };

  const handleEnviarIndividual = async (idx: number) => {
    const doc = documentos[idx];
    const file = localFiles[idx];
    if (!file) return;

    setEnviandoIdx(prev => ({ ...prev, [idx]: true }));
    try {
      await actualizarDocumento(
        doc.idDocumentosrequisitoconsejocohorte,
        doc.idDocumentosrequisitoprogramacohorte,
        file
      );
      try {
        const res = await fetchDocumentosSubidos();
        setSubmittedCount(res.documentos.length);
        setDocumentos(prev => mergeSubidos(prev, res.documentos));
      } catch {
        // ignorar error de refresco
      }
      setLocalFiles(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
      mostrarConfirm(`"${doc.nombre}" enviado con éxito.`);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : `Error al subir "${doc.nombre}"`);
    } finally {
      setEnviandoIdx(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  // ── Condición para habilitar el botón ─────────────────────────────────────

  const modoIndividual = submittedCount > 0;
  const tieneArchivosNuevos = documentos.some((_, i) => !!localFiles[i]);
  const todosCubiertos =
    documentos.length > 0 &&
    documentos.every((d, i) => {
      const tieneSubidaValida = !!d.linkArchivo && !esRechazado(d.estado);
      return tieneSubidaValida || !!localFiles[i];
    });
  const tieneErroresArchivo = Object.keys(fileErrors).length > 0;
  const puedeEnviar = todosCubiertos && tieneArchivosNuevos && !tieneErroresArchivo;

  // ── UI ────────────────────────────────────────────────────────────────────

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
          <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
          <p className="text-sm text-neutral-400 mt-1">Carga y gestiona los documentos requeridos para tu postulación</p>
        </div>

        {/* Estado de carga */}
        {cargando && (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-red-700" />
              Cargando documentos...
            </div>
          </div>
        )}

        {/* Aviso informativo — solo visible cuando ya cargó */}
        {!cargando && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3.5 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <InformationCircleIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Una vez cargados todos los documentos requeridos, estos serán sometidos a revisión por parte del
                  director del programa correspondiente. Durante dicho proceso, no le será posible enviar documentos
                  nuevamente hasta que el director haya concluido la revisión. Le recomendamos verificar cuidadosamente
                  cada archivo antes de proceder con el envío, ya que los documentos serán evaluados en función de su
                  exactitud y completitud.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mt-2">
                  En caso de que algún documento sea rechazado, deberá cargarlo nuevamente con las correcciones pertinentes
                  indicadas en el motivo de rechazo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sin documentos requeridos */}
        {!cargando && documentos.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center animate-fade-in-up delay-100">
            <p className="text-sm text-neutral-400">No hay documentos requeridos en este momento.</p>
          </div>
        )}

        {/* Lista de documentos */}
        {!cargando && documentos.length > 0 && (
          <>
            <div className="space-y-4">
              {documentos.map((doc, idx) => {
                const localFile = localFiles[idx];
                const rechazado = esRechazado(doc.estado);
                const delay = DELAYS[Math.min(idx, DELAYS.length - 1)];

                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-lg p-5 transition-colors animate-fade-in-up ${delay} ${
                      rechazado
                        ? "border-red-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícono */}
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          rechazado ? "bg-red-50" : "bg-neutral-100"
                        }`}
                      >
                        <DocumentTextIcon
                          className={`w-5 h-5 ${rechazado ? "text-red-600" : "text-gray-600"}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Nombre y estado */}
                        <div className="mb-2">
                          <h3 className="font-semibold text-sm text-gray-900">{doc.nombre}</h3>
                          {doc.estado && (
                            <div className="mt-1">
                              <EstadoBadge estado={doc.estado} />
                            </div>
                          )}
                        </div>

                        {/* Enlace al formato (solo si no es null) */}
                        {doc.urlformato && (
                          <div className="mb-2">
                            <a
                              href={doc.urlformato}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-red-700 hover:text-red-800 hover:underline"
                            >
                              <ArrowDownTrayIcon />
                              Descargar formato
                            </a>
                          </div>
                        )}

                        {/* Motivo de rechazo */}
                        {rechazado && doc.motivoRechazo && (
                          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-red-700 leading-relaxed">
                              <span className="font-semibold">Motivo de rechazo:</span>{" "}
                              {doc.motivoRechazo}
                            </p>
                          </div>
                        )}

                        {/* Ver documento cargado */}
                        {doc.linkArchivo && (
                          <div className="mb-3">
                            <a
                              href={doc.linkArchivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-gray-700 hover:underline"
                            >
                              <ArrowTopRightOnSquareIcon />
                              Ver documento cargado
                            </a>
                          </div>
                        )}

                        {/* Input de archivo */}
                        {puedeSubirArchivo(doc.estado) && (
                          <div className="mt-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                type="file"
                                id={`file-${idx}`}
                                className="hidden"
                                disabled={enviando || !!enviandoIdx[idx]}
                                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                                onChange={e =>
                                  handleFileChange(idx, e.target.files?.[0] || null)
                                }
                              />
                              <button
                                type="button"
                                disabled={enviando || !!enviandoIdx[idx]}
                                onClick={() => document.getElementById(`file-${idx}`)?.click()}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  rechazado
                                    ? "border-red-200 text-red-700 bg-white hover:bg-red-50"
                                    : "border-gray-200 text-gray-700 bg-white hover:bg-neutral-100"
                                }`}
                              >
                                {localFile
                                  ? "Cambiar archivo"
                                  : doc.linkArchivo
                                  ? "Reemplazar documento"
                                  : "Seleccionar archivo"}
                              </button>

                              {localFile && !fileErrors[idx] && (
                                <span className="flex items-center gap-1.5 text-xs text-green-700 min-w-0">
                                  <CheckCircleIcon className="w-4 h-4 shrink-0 text-green-600" />
                                  <span className="truncate max-w-[200px]">{localFile.name}</span>
                                </span>
                              )}

                              {modoIndividual && localFile && !fileErrors[idx] && (
                                <button
                                  type="button"
                                  disabled={!!enviandoIdx[idx]}
                                  onClick={() => handleEnviarIndividual(idx)}
                                  className={`relative px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    enviandoIdx[idx]
                                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                      : "bg-red-700 text-white hover:bg-red-800"
                                  }`}
                                >
                                  {/* reserva el ancho del estado más amplio */}
                                  <span className="flex items-center gap-1.5 invisible select-none pointer-events-none" aria-hidden="true">
                                    <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />
                                    Enviando...
                                  </span>
                                  <span className="absolute inset-0 flex items-center justify-center gap-1.5">
                                    {enviandoIdx[idx] ? (
                                      <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" /> Enviando...</>
                                    ) : (
                                      "Enviar"
                                    )}
                                  </span>
                                </button>
                              )}
                            </div>

                            {fileErrors[idx] ? (
                              <p className="mt-1.5 text-xs text-red-600">{fileErrors[idx]}</p>
                            ) : (
                              <p className="mt-1.5 text-xs text-neutral-400">
                                Tamaño máximo: {doc.tamanoMaximoMB} MB
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón enviar — solo en carga inicial (primera vez) */}
            {!modoIndividual && (
              <div className="mt-8 flex justify-end animate-fade-in-up delay-600">
                <button
                  disabled={!puedeEnviar || enviando}
                  onClick={() => setMostrarConfirmar(true)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    puedeEnviar && !enviando
                      ? "bg-red-700 text-white hover:bg-red-800"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  {enviando ? (
                    <>
                      <SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-neutral-400" />
                      Enviando documentos...
                    </>
                  ) : (
                    "Enviar documentos"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Confirmar envío ──────────────────────────────────────────── */}
      {mostrarConfirmar && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${
            cerrandoConfirmar ? "animate-overlay-out" : "animate-overlay-in"
          }`}
          onClick={cerrarConfirmar}
        >
          <div
            className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-sm w-full mx-4 ${
              cerrandoConfirmar ? "animate-modal-out" : "animate-modal-in"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Enviar documentos</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas enviar los archivos seleccionados para revisión?
                Asegúrate de que todos los documentos estén correctos antes de continuar.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarConfirmado}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
              >
                Sí, enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
