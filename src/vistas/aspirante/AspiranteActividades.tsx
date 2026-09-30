import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router";
import {
  getEntrevistas,
  aceptarEntrevista,
  solicitarCambioEntrevista,
  cancelarEntrevista,
  type Entrevista,
} from "../../services/aspirante/aspiranteEntrevistaService";
import {
  getPruebas,
  aceptarPrueba,
  solicitarCambioPrueba,
  cancelarPrueba,
} from "../../services/aspirante/aspirantePruebaService";
import type { AspiranteOutletContext } from "../../layouts/AspiranteLayout";
import { CalendarIcon, ChevronDownIcon, ClockIcon, MapPinIcon } from "../../assets/icons";
import Cargando from "../../components/Cargando";
import { DialogoConfirmacion } from "../../components/Dialogo";
import SeccionBloqueada from "./components/SeccionBloqueada";

// ── Configuración por tipo ─────────────────────────────────────────────────────

export type TipoActividad = "entrevista" | "prueba";

/** Entrevistas y pruebas comparten forma; las pruebas añaden nombre y descripción. */
type Actividad = Entrevista & { nombre?: string; descripcion?: string };

const CONFIG: Record<TipoActividad, {
  /** Nombre en singular y minúscula ("entrevista"). */
  singular: string;
  plural: string;
  titulo: string;
  descripcion: string;
  obtener: () => Promise<Actividad[]>;
  aceptar: (id: string) => Promise<void>;
  solicitarCambio: (id: string, motivo: string) => Promise<void>;
  cancelar: (id: string, motivo: string) => Promise<void>;
}> = {
  entrevista: {
    singular: "entrevista",
    plural: "entrevistas",
    titulo: "Entrevistas",
    descripcion: "Gestiona tus entrevistas programadas",
    obtener: getEntrevistas,
    aceptar: aceptarEntrevista,
    solicitarCambio: solicitarCambioEntrevista,
    cancelar: cancelarEntrevista,
  },
  prueba: {
    singular: "prueba",
    plural: "pruebas",
    titulo: "Pruebas",
    descripcion: "Gestiona tus pruebas de admisión programadas",
    obtener: getPruebas,
    aceptar: aceptarPrueba,
    solicitarCambio: solicitarCambioPrueba,
    cancelar: cancelarPrueba,
  },
};

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

const TEXTAREA =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-neutral-400 outline-none transition resize-none focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed";

// ── Badge de estado ────────────────────────────────────────────────────────────

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

// ── Tarjeta de actividad ───────────────────────────────────────────────────────

interface TarjetaProps {
  actividad: Actividad;
  delay: string;
  children?: React.ReactNode;
  className?: string;
}

function TarjetaActividad({ actividad: a, delay, children, className = "" }: TarjetaProps) {
  return (
    <div className={`bg-white border rounded-lg p-5 transition-colors animate-fade-in-up ${delay} ${className}`}>
      {/* Nombre y descripción (solo pruebas) */}
      {a.nombre && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-900">{a.nombre}</div>
          {a.descripcion && (
            <div className="text-xs text-neutral-400 mt-0.5">{a.descripcion}</div>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <EstadoBadge estado={a.estado} />
        <span className="inline-block bg-neutral-200 text-neutral-600 border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
          {a.modalidad}
        </span>
      </div>

      {/* Fecha, hora y lugar */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-700">
          <span className="flex items-center gap-1.5">
            <CalendarIcon />{formatFecha(a.fecha)}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon />{formatHora(a.tiempo)}
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-sm text-gray-700">
          <MapPinIcon /><span>{a.lugar}</span>
        </div>
      </div>

      {children}
    </div>
  );
}

function Motivo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs font-semibold text-neutral-400 mb-1">{titulo}</div>
      <div className="text-sm text-gray-700 italic">"{texto}"</div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

/** Gestión de entrevistas o pruebas programadas del aspirante (aceptar, solicitar cambio, cancelar). */
export default function AspiranteActividades({ tipo }: { tipo: TipoActividad }) {
  const cfg = CONFIG[tipo];
  const Singular = cfg.singular.charAt(0).toUpperCase() + cfg.singular.slice(1);
  const { mostrarAlerta, mostrarConfirm, soloInscrito } = useOutletContext<AspiranteOutletContext>();

  const [actividades, setActividades] = useState<Actividad[]>([]);
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

  const cargarActividades = useCallback(async () => {
    if (soloInscrito !== false) return;
    setCargando(true);
    try {
      setActividades(await cfg.obtener());
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : `No se pudieron cargar las ${cfg.plural}.`);
    } finally {
      setCargando(false);
    }
  }, [mostrarAlerta, soloInscrito, cfg]);

  useEffect(() => {
    cargarActividades();
  }, [cargarActividades]);

  // ── Cierre animado de modales ─────────────────────────────────────────────

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
      await cfg.aceptar(aceptarId);
      cerrarAceptar();
      await cargarActividades();
      mostrarConfirm(`${Singular} confirmada con éxito.`);
    } catch (err) {
      cerrarAceptar();
      mostrarAlerta(err instanceof Error ? err.message : `No se pudo confirmar la ${cfg.singular}.`);
    } finally {
      setCargandoAceptar(false);
    }
  };

  const handleSolicitarCambio = async () => {
    if (!cambioId || !motivoCambio.trim()) return;
    setCargandoCambio(true);
    try {
      await cfg.solicitarCambio(cambioId, motivoCambio.trim());
      cerrarCambio();
      await cargarActividades();
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
      await cfg.cancelar(cancelarId, `El aspirante canceló la ${cfg.singular} por el motivo: ${motivoCancelacion.trim()}`);
      cerrarCancelar();
      await cargarActividades();
      mostrarConfirm(`${Singular} cancelada.`);
    } catch (err) {
      cerrarCancelar();
      mostrarAlerta(err instanceof Error ? err.message : `No se pudo cancelar la ${cfg.singular}.`);
    } finally {
      setCargandoCancelar(false);
    }
  };

  // ── Grupos por estado ────────────────────────────────────────────────────

  const confirmadas       = actividades.filter(a => a.estado === "confirmada");
  const pendientes        = actividades.filter(a => a.estado === "pendiente");
  const solicitudesCambio = actividades.filter(a => a.estado === "solicitud_de_cambio");
  const completadas       = actividades.filter(a => a.estado === "completada");
  const canceladas        = actividades.filter(a => a.estado === "cancelada");

  // ── UI ────────────────────────────────────────────────────────────────────

  if (soloInscrito === true) {
    return <SeccionBloqueada />;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      {/* Encabezado */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl font-bold text-gray-900">{cfg.titulo}</h1>
        <p className="text-sm text-neutral-400 mt-1">{cfg.descripcion}</p>
      </div>

      {cargando && <Cargando texto={`Cargando ${cfg.plural}...`} />}

      {!cargando && actividades.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center animate-fade-in-up delay-100">
          <p className="text-sm text-neutral-400">No tienes {cfg.plural} registradas.</p>
        </div>
      )}

      {/* ── Confirmadas ────────────────────────────────────────────────── */}
      {!cargando && confirmadas.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 animate-fade-in-up delay-100">
            Confirmadas
          </h2>
          <div className="space-y-3">
            {confirmadas.map((a, idx) => (
              <TarjetaActividad
                key={a.id}
                actividad={a}
                delay={DELAYS[Math.min(idx, DELAYS.length - 1)]}
                className="border-blue-200 bg-blue-50/20"
              >
                <div className="mt-4 pt-3 border-t border-blue-200 flex gap-2">
                  <button
                    onClick={() => setCancelarId(a.id)}
                    className="px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Cancelar {cfg.singular}
                  </button>
                </div>
              </TarjetaActividad>
            ))}
          </div>
        </div>
      )}

      {/* ── Otras (pendientes y solicitudes de cambio) ─────────────────── */}
      {!cargando && (pendientes.length > 0 || solicitudesCambio.length > 0) && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 animate-fade-in-up delay-200">
            Otras {cfg.plural}
          </h2>
          <div className="space-y-3">
            {pendientes.map((a, idx) => (
              <TarjetaActividad
                key={a.id}
                actividad={a}
                delay={DELAYS[Math.min(idx + 1, DELAYS.length - 1)]}
                className="border-gray-200 hover:border-gray-300"
              >
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setAceptarId(a.id)}
                    className="px-3 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => setCambioId(a.id)}
                    className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    Solicitar cambio
                  </button>
                </div>
              </TarjetaActividad>
            ))}
            {solicitudesCambio.map((a, idx) => (
              <TarjetaActividad
                key={a.id}
                actividad={a}
                delay={DELAYS[Math.min(idx + 2, DELAYS.length - 1)]}
                className="border-gray-200 hover:border-gray-300"
              >
                {a.motivocambio && <Motivo titulo="Motivo de solicitud:" texto={a.motivocambio} />}
              </TarjetaActividad>
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
              historialAbierto ? "max-h-1000 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 space-y-3 bg-white">
              {[...completadas, ...canceladas].map((a, idx) => (
                <TarjetaActividad
                  key={a.id}
                  actividad={a}
                  delay={DELAYS[Math.min(idx + 3, DELAYS.length - 1)]}
                  className="border-gray-200 bg-gray-50"
                >
                  {a.motivocambio && (
                    <Motivo
                      titulo={a.estado === "cancelada" ? "Motivo de cancelación:" : "Motivo:"}
                      texto={a.motivocambio}
                    />
                  )}
                </TarjetaActividad>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar aceptar ────────────────────────────────────── */}
      <DialogoConfirmacion
        abierto={aceptarId !== null}
        cerrando={cerrandoAceptar}
        tamano="sm"
        titulo={`Confirmar ${cfg.singular}`}
        onClickFondo={cerrarAceptar}
        onCancelar={cerrarAceptar}
        onConfirmar={handleAceptar}
        textoConfirmar="Sí, aceptar"
        textoProcesando="Confirmando..."
        procesando={cargandoAceptar}
      >
        {`¿Estás seguro de que deseas aceptar esta ${cfg.singular}? Una vez confirmada, quedará registrada en tu calendario de actividades.`}
      </DialogoConfirmacion>

      {/* ── Modal: Solicitar cambio ────────────────────────────────────── */}
      <DialogoConfirmacion
        abierto={cambioId !== null}
        cerrando={cerrandoCambio}
        titulo="Solicitar cambio de fecha/hora"
        onClickFondo={cerrarCambio}
        onCancelar={cerrarCambio}
        onConfirmar={handleSolicitarCambio}
        textoConfirmar="Enviar solicitud"
        textoProcesando="Enviando..."
        procesando={cargandoCambio}
        confirmarDeshabilitado={!motivoCambio.trim()}
      >
        <p className="text-sm text-gray-600 mb-4">
          Completa el formulario para solicitar un cambio en la fecha u hora de la {cfg.singular}.
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
          className={TEXTAREA}
        />
        {!motivoCambio.trim() && (
          <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para solicitar el cambio.</p>
        )}
      </DialogoConfirmacion>

      {/* ── Modal: Cancelar ────────────────────────────────────────────── */}
      <DialogoConfirmacion
        abierto={cancelarId !== null}
        cerrando={cerrandoCancelar}
        titulo={`Cancelar ${cfg.singular}`}
        onClickFondo={cerrarCancelar}
        onCancelar={cerrarCancelar}
        onConfirmar={handleCancelar}
        textoCancelar="Volver"
        textoConfirmar="Confirmar cancelación"
        textoProcesando="Cancelando..."
        procesando={cargandoCancelar}
        confirmarDeshabilitado={!motivoCancelacion.trim()}
      >
        <label className="text-sm font-semibold text-gray-700 mb-1 block">
          Motivo de cancelación <span className="text-red-700">*</span>
        </label>
        <textarea
          value={motivoCancelacion}
          onChange={e => setMotivoCancelacion(e.target.value)}
          rows={4}
          placeholder={`Explica brevemente por qué deseas cancelar la ${cfg.singular}...`}
          disabled={cargandoCancelar}
          className={TEXTAREA}
        />
        {!motivoCancelacion.trim() && (
          <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para cancelar.</p>
        )}
      </DialogoConfirmacion>
    </div>
  );
}
