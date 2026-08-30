import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useOutletContext } from "react-router";
import { fetchEstadoProceso, type PasoProceso } from "../../services/aspirante/aspiranteInicioService";
import { getCorreoAspirante, patchCorreoAspirante, enviarConfirmacionCorreo } from "../../services/aspirante/aspiranteService";
import type { AspiranteOutletContext } from "../../layouts/AspiranteLayout";
import { CalendarIcon, CheckCircleIcon, SpinnerIcon } from "../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className ?? "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ExclamationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EstadoTarjeta = "completado" | "en-revision" | "pendiente";

interface TarjetaEstado {
  titulo: string;
  descripcion: string;
  estado: EstadoTarjeta;
  Icono: ComponentType<{ className?: string }>;
}

interface ProximoPaso {
  num: number;
  titulo: string;
  descripcion: string;
  activo: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTILOS_TARJETA: Record<EstadoTarjeta, { wrapper: string; iconoBg: string; icono: string }> = {
  completado:    { wrapper: "border-green-200",  iconoBg: "bg-green-100",   icono: "text-green-700" },
  "en-revision": { wrapper: "border-amber-200",  iconoBg: "bg-amber-100",   icono: "text-amber-400" },
  pendiente:     { wrapper: "border-gray-200",   iconoBg: "bg-neutral-200", icono: "text-neutral-400" },
};

const ICONOS_ESTADO: Record<EstadoTarjeta, ComponentType<{ className?: string }>> = {
  completado:    CheckCircleIcon,
  "en-revision": ClockIcon,
  pendiente:     CalendarIcon,
};

function toEstadoTarjeta(estado: PasoProceso["estado"]): EstadoTarjeta {
  if (estado === "en-progreso") return "en-revision";
  return estado as EstadoTarjeta;
}

function getDescripcionTarjeta(nombre: string, estado: EstadoTarjeta): string {
  const n = nombre.toLowerCase();
  if (estado === "completado") {
    if (n.includes("result")) return "¡Fuiste admitido al programa! El siguiente paso es la legalización de tu matrícula para obtener tu código estudiantil.";
    if (n.includes("legaliz")) return "Legalización de matrícula completada. Tu código estudiantil ha sido generado.";
    return `${nombre} completado exitosamente.`;
  }
  if (estado === "en-revision") return `${nombre} en revisión. Te notificaremos cuando haya actualizaciones.`;
  return `${nombre} pendiente. Será procesado próximamente.`;
}

function getDescripcionPaso(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("inscri")) return "Completa el formulario de inscripción con toda la información requerida.";
  if (n.includes("pago")) return "Realiza el pago de inscripción correspondiente y adjunta el comprobante.";
  if (n.includes("doc")) return "Espera la validación de los documentos enviados. Si alguno es rechazado, podrás reemplazarlo.";
  if (n.includes("calif")) return "Una vez aprobados tus documentos, se evaluará tu candidatura.";
  if (n.includes("result")) return "Recibirás la notificación sobre tu admisión al programa.";
  if (n.includes("legaliz")) return "Completa el proceso de legalización de matrícula para obtener tu código estudiantil.";
  return "Próximamente recibirás información sobre este paso del proceso.";
}

function buildTarjetas(pasos: PasoProceso[]): TarjetaEstado[] {
  return pasos.map(p => {
    const estado = toEstadoTarjeta(p.estado);
    return {
      titulo: p.nombre,
      descripcion: getDescripcionTarjeta(p.nombre, estado),
      estado,
      Icono: ICONOS_ESTADO[estado],
    };
  });
}

function buildProximosPasos(pasos: PasoProceso[]): ProximoPaso[] {
  return pasos
    .filter(p => p.estado !== "completado")
    .map((p, idx) => ({
      num: idx + 1,
      titulo: p.nombre,
      descripcion: getDescripcionPaso(p.nombre),
      activo: idx === 0,
    }));
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AspiranteInicio() {
  const { mostrarAlerta } = useOutletContext<AspiranteOutletContext>();

  const [cargando, setCargando] = useState(true);
  const [pasos, setPasos] = useState<PasoProceso[]>([]);

  const [correo, setCorreo] = useState<string | null>(null);
  const [correoCargando, setCorreoCargando] = useState(false);
  const [editandoCorreo, setEditandoCorreo] = useState(false);
  const [correoInput, setCorreoInput] = useState("");
  const [envioCargando, setEnvioCargando] = useState(false);
  const [guardandoCorreo, setGuardandoCorreo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeErrorCorreo, setMensajeErrorCorreo] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchEstadoProceso();
      setPasos(data);
    } catch (err) {
      mostrarAlerta((err as Error).message ?? "No fue posible cargar la información del proceso.");
    } finally {
      setCargando(false);
    }
  }, [mostrarAlerta]);

  const cargarCorreo = useCallback(async () => {
    setCorreoCargando(true);
    try {
      const c = await getCorreoAspirante();
      setCorreo(c);
    } catch (err) {
      mostrarAlerta((err as Error).message ?? "No fue posible obtener el correo.");
    } finally {
      setCorreoCargando(false);
    }
  }, [mostrarAlerta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const necesitaValidarCorreo = pasos.some(p => p.nombre.toLowerCase().includes("inscri") && p.estado === "en-progreso");

  useEffect(() => {
    if (necesitaValidarCorreo) cargarCorreo();
  }, [necesitaValidarCorreo, cargarCorreo]);

  const tarjetas = buildTarjetas(pasos);
  const proximosPasos = buildProximosPasos(pasos);
  const pasoEnRevision = tarjetas.find(t => t.estado === "en-revision");
  const esAdmitido = pasos.some(p => p.nombre.toLowerCase().includes("result") && p.estado === "completado")
    || (pasos.length > 0 && pasos.every(p => p.estado === "completado"));
  const todoCompletado = pasos.length > 0 && pasos.every(p => p.estado === "completado");

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <div className="">

        {/* Encabezado */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-xl font-bold text-gray-900">
            Bienvenido al Sistema de Posgrados
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Panel de control de tu proceso de admisión
          </p>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
              Cargando información del proceso...
            </div>
          </div>
        ) : (
          <>
            {/* Sección: validación de correo (solo si la inscripción está en progreso) */}
            {necesitaValidarCorreo && (
              <>
                <div className="flex items-start gap-3 bg-amber-100 border border-amber-200 text-amber-400 rounded-lg px-4 py-3 mb-6 animate-fade-in-up delay-200">
                  <ExclamationIcon />
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Acción requerida: </span>
                    Debes validar tu correo electrónico para continuar con la inscripción.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 animate-fade-in-up delay-300 mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Validar correo electrónico</h2>

                  {mensajeExito && (
                    <div className="mb-3 bg-green-100 border border-green-200 text-green-700 rounded-lg px-3 py-2">{mensajeExito}</div>
                  )}
                  {mensajeErrorCorreo && (
                    <div className="mb-3 bg-red-100 border border-red-200 text-red-700 rounded-lg px-3 py-2">{mensajeErrorCorreo}</div>
                  )}

                  {correoCargando ? (
                    <div className="flex items-center gap-3 text-neutral-400 text-sm">
                      <SpinnerIcon className="animate-spin h-6 w-6 text-red-700" /> Cargando correo...
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-sm text-neutral-400 mb-1">Correo registrado</p>
                        <p className="text-sm font-medium text-gray-900" style={{ wordBreak: 'break-word' }}>{correo ?? "No registrado"}</p>
                      </div>

                      {!editandoCorreo ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <button
                            className="w-full sm:w-auto bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 disabled:opacity-50"
                            onClick={async () => {
                              setEnvioCargando(true);
                              setMensajeErrorCorreo(null);
                              try {
                                await enviarConfirmacionCorreo();
                                setMensajeExito("Enlace de confirmación enviado. Revisa tu correo (válido 24 horas).");
                              } catch (err) {
                                setMensajeErrorCorreo((err as Error).message ?? "No fue posible enviar el enlace.");
                              } finally {
                                setEnvioCargando(false);
                              }
                            }}
                            disabled={envioCargando}
                          >
                            {envioCargando ? <><SpinnerIcon className="animate-spin h-4 w-4 text-white inline mr-2" />Enviando...</> : "Enviar enlace de confirmación"}
                          </button>

                          <button
                            className="w-full sm:w-auto bg-white border border-gray-200 text-red-700 px-4 py-2 rounded-lg hover:border-gray-300"
                            onClick={() => { setEditandoCorreo(true); setCorreoInput(correo ?? ""); setMensajeErrorCorreo(null); setMensajeExito(null); }}
                          >
                            Editar correo
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <input
                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                            value={correoInput}
                            onChange={e => setCorreoInput(e.target.value)}
                            placeholder="nuevo@correo.com"
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              className="w-full sm:w-auto bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 disabled:opacity-50"
                              onClick={async () => {
                                setMensajeErrorCorreo(null);
                                setGuardandoCorreo(true);
                                try {
                                  await patchCorreoAspirante(correoInput.trim());
                                  setCorreo(correoInput.trim());
                                  setEditandoCorreo(false);
                                  setMensajeExito("Correo actualizado correctamente.");
                                } catch (err) {
                                  setMensajeErrorCorreo((err as Error).message ?? "No fue posible actualizar el correo.");
                                } finally {
                                  setGuardandoCorreo(false);
                                }
                              }}
                              disabled={guardandoCorreo}
                            >
                              {guardandoCorreo ? <><SpinnerIcon className="animate-spin h-4 w-4 text-white inline mr-2" />Guardando...</> : "Guardar"}
                            </button>
                            <button
                              className="w-full sm:w-auto bg-white border border-gray-200 text-red-700 px-4 py-2 rounded-lg hover:border-gray-300"
                              onClick={() => { setEditandoCorreo(false); setCorreoInput(""); }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Banner admitido */}
            {esAdmitido && todoCompletado && (
              <div className="bg-green-100 border border-green-200 rounded-lg px-5 py-4 mb-6 animate-fade-in-up delay-100">
                <h2 className="text-sm font-semibold text-green-700 mb-1">¡Proceso completado!</h2>
                <p className="text-sm text-green-700/80">
                  Has completado todo el proceso de admisión. Tu{" "}
                  <span className="font-semibold">código estudiantil</span> ha sido generado.
                  ¡Bienvenido oficialmente al programa de postgrado!
                </p>
              </div>
            )}
            {esAdmitido && !todoCompletado && (
              <div className="bg-green-100 border border-green-200 rounded-lg px-5 py-4 mb-6 animate-fade-in-up delay-100">
                <h2 className="text-sm font-semibold text-green-700 mb-1">¡Felicitaciones! Fuiste admitido al programa</h2>
                <p className="text-sm text-green-700/80">
                  El siguiente paso es realizar la{" "}
                  <span className="font-semibold">legalización de tu matrícula</span> para la generación
                  de tu código estudiantil. Revisa tu correo registrado con los plazos y montos de pago,
                  o acércate a la oficina de Posgrados.
                </p>
              </div>
            )}

            {/* Alerta — solo si hay un paso en revisión (no mostrar si ya mostramos la validación de correo) */}
            {pasoEnRevision && !esAdmitido && !necesitaValidarCorreo && (
              <div className="flex items-start gap-3 bg-amber-100 border border-amber-200 text-amber-400 rounded-lg px-4 py-3 mb-6 animate-fade-in-up delay-100">
                <ExclamationIcon />
                <p className="text-sm">
                  <span className="font-semibold text-gray-900">Acción requerida: </span>
                  {pasoEnRevision.titulo} en revisión. Te notificaremos cuando haya actualizaciones.
                </p>
              </div>
            )}

            {/* Grid de tarjetas de estado */}
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              {tarjetas.map((t, idx) => {
                const estilos = ESTILOS_TARJETA[t.estado];
                const ultimaSola = tarjetas.length % 2 !== 0 && idx === tarjetas.length - 1;
                return (
                  <div
                    key={t.titulo}
                    className={`bg-white border ${estilos.wrapper} rounded-lg p-5 animate-fade-in-up delay-${(idx + 2) * 100} ${ultimaSola ? "sm:col-span-2 sm:w-1/2 sm:mx-auto" : ""}`}
                  >
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${estilos.iconoBg}`}>
                      <t.Icono className={`w-5 h-5 ${estilos.icono}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{t.titulo}</h3>
                    <p className="text-sm text-neutral-400">{t.descripcion}</p>
                  </div>
                );
              })}
            </div>

            {/* Próximos pasos — solo si hay pasos pendientes */}
            {proximosPasos.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 animate-fade-in-up delay-600">
                <h2 className="text-sm font-semibold text-gray-900 mb-5">Próximos pasos</h2>
                <div className="space-y-5">
                  {proximosPasos.map(paso => (
                    <div key={paso.num} className="flex gap-4">
                      <div
                        className={`rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-sm font-semibold ${
                          paso.activo
                            ? "bg-red-700/10 text-red-700"
                            : "bg-neutral-200 text-neutral-400"
                        }`}
                      >
                        {paso.num}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold mb-0.5 ${paso.activo ? "text-gray-900" : "text-neutral-400"}`}>
                          {paso.titulo}
                        </p>
                        <p className="text-sm text-neutral-400">{paso.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
