import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router";
import {
  getEntrevistas,
  aceptarEntrevista,
  solicitarCambioEntrevista,
  cancelarEntrevista,
  type Entrevista,
} from "../../services/aspirante/aspiranteEntrevistaService";
import type { AspiranteOutletContext } from "../../layouts/AspiranteLayout";
import { CalendarIcon, ClockIcon, MapPinIcon } from "../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ButtonSpinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-neutral-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300 ease-in-out ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatFecha(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${parseInt(day)} de ${MESES[parseInt(month) - 1]} de ${year}`;
}

function formatHora(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500", "delay-600"] as const;

// ── Badges ─────────────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    confirmada:          "bg-blue-100 text-blue-700 border border-blue-200",
    pendiente:           "bg-yellow-100 text-yellow-700 border border-yellow-200",
    solicitud_de_cambio: "bg-amber-100 text-amber-600 border border-amber-200",
    cancelada:           "bg-red-100 text-red-700 border border-red-200",
    completada:          "bg-green-100 text-green-700 border border-green-200",
  };
  const labels: Record<string, string> = {
    confirmada:          "Confirmada",
    pendiente:           "Pendiente de confirmación",
    solicitud_de_cambio: "Solicitud de cambio",
    cancelada:           "Cancelada",
    completada:          "Completada",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${estilos[estado] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

// ── Tarjeta de entrevista ──────────────────────────────────────────────────────

interface TarjetaProps {
  entrevista: Entrevista;
  delay: string;
  children?: React.ReactNode;
  className?: string;
}

function TarjetaEntrevista({ entrevista: e, delay, children, className = "" }: TarjetaProps) {
  return (
    <div className={`bg-white border rounded-lg p-5 transition-colors animate-fade-in-up ${delay} ${className}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <EstadoBadge estado={e.estado} />
        <span className="inline-block bg-neutral-200 text-neutral-600 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
          {e.modalidad}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700">
          <span className="flex items-center gap-1.5">
            <CalendarIcon />{formatFecha(e.fecha)}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon />{formatHora(e.tiempo)}
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-sm text-gray-700">
          <MapPinIcon /><span>{e.lugar}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function AspiranteEntrevista() {
  const { mostrarAlerta, mostrarConfirm, soloInscrito } = useOutletContext<AspiranteOutletContext>();

  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modal: aceptar
  const [aceptarId, setAceptarId] = useState<string | null>(null);
  const [cerrandoAceptar, setCerrandoAceptar] = useState(false);
  const [cargandoAceptar, setCargandoAceptar] = useState(false);

  // Modal: solicitar cambio
  const [cambioId, setCambioId] = useState<string | null>(null);
  const [cerrandoCambio, setCerrandoCambio] = useState(false);
  const [motivoCambio, setMotivoCambio] = useState("");
  const [cargandoCambio, setCargandoCambio] = useState(false);

  // Modal: cancelar
  const [cancelarId, setCancelarId] = useState<string | null>(null);
  const [cerrandoCancelar, setCerrandoCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cargandoCancelar, setCargandoCancelar] = useState(false);

  const [historialAbierto, setHistorialAbierto] = useState(false);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const cargarEntrevistas = useCallback(async () => {
    if (soloInscrito !== false) return;
    setCargando(true);
    try {
      const data = await getEntrevistas();
      setEntrevistas(data);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar las entrevistas.");
    } finally {
      setCargando(false);
    }
  }, [mostrarAlerta, soloInscrito]);

  useEffect(() => {
    cargarEntrevistas();
  }, [cargarEntrevistas]);

  // ── Cierre animado de modales ────────────────────────────────────────────

  const cerrarAceptar = () => {
    setCerrandoAceptar(true);
    setTimeout(() => {
      setAceptarId(null);
      setCerrandoAceptar(false);
    }, 170);
  };

  const cerrarCambio = () => {
    setCerrandoCambio(true);
    setTimeout(() => {
      setCambioId(null);
      setMotivoCambio("");
      setCerrandoCambio(false);
    }, 170);
  };

  const cerrarCancelar = () => {
    setCerrandoCancelar(true);
    setTimeout(() => {
      setCancelarId(null);
      setMotivoCancelacion("");
      setCerrandoCancelar(false);
    }, 170);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAceptar = async () => {
    if (!aceptarId) return;
    setCargandoAceptar(true);
    try {
      await aceptarEntrevista(aceptarId);
      cerrarAceptar();
      await cargarEntrevistas();
      mostrarConfirm("Entrevista confirmada con éxito.");
    } catch (err) {
      cerrarAceptar();
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo confirmar la entrevista.");
    } finally {
      setCargandoAceptar(false);
    }
  };

  const handleSolicitarCambio = async () => {
    if (!cambioId || !motivoCambio.trim()) return;
    setCargandoCambio(true);
    try {
      await solicitarCambioEntrevista(cambioId, motivoCambio.trim());
      cerrarCambio();
      await cargarEntrevistas();
      mostrarConfirm("Solicitud de cambio enviada con éxito.");
    } catch (err) {
      cerrarCambio();
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo enviar la solicitud de cambio.");
    } finally {
      setCargandoCambio(false);
    }
  };

  const handleCancelar = async () => {
    if (!cancelarId || !motivoCancelacion.trim()) return;
    setCargandoCancelar(true);
    try {
      await cancelarEntrevista(cancelarId, `El aspirante canceló la entrevista por el motivo: ${motivoCancelacion.trim()}`);
      cerrarCancelar();
      await cargarEntrevistas();
      mostrarConfirm("Entrevista cancelada.");
    } catch (err) {
      cerrarCancelar();
      mostrarAlerta(err instanceof Error ? err.message : "No se pudo cancelar la entrevista.");
    } finally {
      setCargandoCancelar(false);
    }
  };

  // ── Grupos por estado ────────────────────────────────────────────────────

  const confirmadas       = entrevistas.filter(e => e.estado === "confirmada");
  const pendientes        = entrevistas.filter(e => e.estado === "pendiente");
  const solicitudesCambio = entrevistas.filter(e => e.estado === "solicitud_de_cambio");
  const completadas       = entrevistas.filter(e => e.estado === "completada");
  const canceladas        = entrevistas.filter(e => e.estado === "cancelada");

  // ── UI ────────────────────────────────────────────────────────────────────

  if (soloInscrito === true) {
    return (
      <div className="p-6 bg-gray-100 min-h-full flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
              <LockIcon />
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
          <h1 className="text-xl font-bold text-gray-900">Entrevistas</h1>
          <p className="text-sm text-neutral-400 mt-1">Gestiona tus entrevistas programadas</p>
        </div>

        {/* Estado de carga */}
        {cargando && (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <Spinner />
              Cargando entrevistas...
            </div>
          </div>
        )}

        {/* Sin entrevistas */}
        {!cargando && entrevistas.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center animate-fade-in-up delay-100">
            <p className="text-sm text-neutral-400">No tienes entrevistas registradas.</p>
          </div>
        )}

        {/* ── Confirmadas ────────────────────────────────────────────────── */}
        {!cargando && confirmadas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 animate-fade-in-up delay-100">
              Confirmadas
            </h2>
            <div className="space-y-3">
              {confirmadas.map((e, idx) => (
                <TarjetaEntrevista
                  key={e.id}
                  entrevista={e}
                  delay={DELAYS[Math.min(idx, DELAYS.length - 1)]}
                  className="border-blue-200 bg-blue-50/20"
                >
                  <div className="mt-4 pt-3 border-t border-blue-200 flex gap-2">
                    <button
                      onClick={() => setCancelarId(e.id)}
                      className="px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Cancelar entrevista
                    </button>
                  </div>
                </TarjetaEntrevista>
              ))}
            </div>
          </div>
        )}

        {/* ── Otras entrevistas ─────────────────────────────────────────── */}
        {!cargando && (pendientes.length > 0 || solicitudesCambio.length > 0) && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 animate-fade-in-up delay-200">
              Otras entrevistas
            </h2>
            <div className="space-y-3">
              {pendientes.map((e, idx) => (
                <TarjetaEntrevista
                  key={e.id}
                  entrevista={e}
                  delay={DELAYS[Math.min(idx + 1, DELAYS.length - 1)]}
                  className="border-gray-200 hover:border-gray-300"
                >
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setAceptarId(e.id)}
                      className="px-3 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => setCambioId(e.id)}
                      className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Solicitar cambio
                    </button>
                  </div>
                </TarjetaEntrevista>
              ))}
              {solicitudesCambio.map((e, idx) => (
                <TarjetaEntrevista
                  key={e.id}
                  entrevista={e}
                  delay={DELAYS[Math.min(idx + 2, DELAYS.length - 1)]}
                  className="border-gray-200 hover:border-gray-300"
                >
                  {e.motivocambio && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-neutral-400 mb-1">Motivo de solicitud:</div>
                      <div className="text-sm text-gray-700 italic">"{e.motivocambio}"</div>
                    </div>
                  )}
                </TarjetaEntrevista>
              ))}
            </div>
          </div>
        )}

        {/* ── Historial (completadas → canceladas) ──────────────────────── */}
        {!cargando && (completadas.length > 0 || canceladas.length > 0) && (
          <div className="border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up delay-400">
            <button
              onClick={() => setHistorialAbierto(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors group focus:outline-none"
            >
              <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                Historial
                <span className="ml-2 text-neutral-400 font-normal">({completadas.length + canceladas.length})</span>
              </span>
              <ChevronDownIcon open={historialAbierto} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                historialAbierto ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 space-y-3 bg-white">
                {[...completadas, ...canceladas].map((e, idx) => (
                  <TarjetaEntrevista
                    key={e.id}
                    entrevista={e}
                    delay={DELAYS[Math.min(idx + 3, DELAYS.length - 1)]}
                    className="border-gray-200 bg-gray-50"
                  >
                    {e.motivocambio && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-neutral-400 mb-1">
                          {e.estado === "cancelada" ? "Motivo de cancelación:" : "Motivo:"}
                        </div>
                        <div className="text-sm text-gray-700 italic">"{e.motivocambio}"</div>
                      </div>
                    )}
                  </TarjetaEntrevista>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Modal: Confirmar aceptar ────────────────────────────────────── */}
      {aceptarId && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoAceptar ? "animate-overlay-out" : "animate-overlay-in"}`}
          onClick={cerrarAceptar}
        >
          <div
            className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-sm w-full mx-4 ${cerrandoAceptar ? "animate-modal-out" : "animate-modal-in"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Confirmar entrevista</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas aceptar esta entrevista? Una vez confirmada, quedará registrada en tu calendario de actividades.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarAceptar}
                disabled={cargandoAceptar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptar}
                disabled={cargandoAceptar}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoAceptar ? <><ButtonSpinner />Confirmando...</> : "Sí, aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Solicitar cambio ────────────────────────────────────── */}
      {cambioId && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoCambio ? "animate-overlay-out" : "animate-overlay-in"}`}
          onClick={cerrarCambio}
        >
          <div
            className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoCambio ? "animate-modal-out" : "animate-modal-in"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Solicitar cambio de fecha/hora</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Completa el formulario para solicitar un cambio en la fecha u hora de la entrevista.
              </p>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Motivo del cambio y disponibilidad <span className="text-red-700">*</span>
              </label>
              <textarea
                value={motivoCambio}
                onChange={e => setMotivoCambio(e.target.value)}
                rows={5}
                placeholder="Explica brevemente por qué solicitas el cambio e indica tus horarios disponibles para que los directivos puedan reasignarte una mejor fecha..."
                disabled={cargandoCambio}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-neutral-400 outline-none transition resize-none focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!motivoCambio.trim() && (
                <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para solicitar el cambio.</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarCambio}
                disabled={cargandoCambio}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarCambio}
                disabled={!motivoCambio.trim() || cargandoCambio}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoCambio ? <><ButtonSpinner />Enviando...</> : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Cancelar entrevista ────────────────────────────────── */}
      {cancelarId && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoCancelar ? "animate-overlay-out" : "animate-overlay-in"}`}
          onClick={cerrarCancelar}
        >
          <div
            className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoCancelar ? "animate-modal-out" : "animate-modal-in"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Cancelar entrevista</h3>
            </div>
            <div className="p-6">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Motivo de cancelación <span className="text-red-700">*</span>
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                rows={4}
                placeholder="Explica brevemente por qué deseas cancelar la entrevista..."
                disabled={cargandoCancelar}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-neutral-400 outline-none transition resize-none focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!motivoCancelacion.trim() && (
                <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para cancelar.</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarCancelar}
                disabled={cargandoCancelar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium disabled:opacity-60"
              >
                Volver
              </button>
              <button
                onClick={handleCancelar}
                disabled={!motivoCancelacion.trim() || cargandoCancelar}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoCancelar ? <><ButtonSpinner />Cancelando...</> : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
