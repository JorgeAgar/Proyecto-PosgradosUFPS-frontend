import { useState } from "react";
import { CalendarIcon, ChevronDownIcon, ClockIcon, MapPinIcon, PlusIcon, RefreshIcon, SpinnerIcon } from "../../../assets/icons";

export type EstadoAgenda = "pendiente" | "confirmada" | "solicitud de cambio" | "cancelada" | "completada";

/** Entrevista o prueba agendada para un aspirante. */
export interface ItemAgenda {
  id: string;
  /** Solo las pruebas tienen nombre y descripción. */
  nombre?: string;
  descripcion?: string;
  fecha: string;
  hora: string;
  modalidad: "virtual" | "presencial";
  lugar: string;
  estado: EstadoAgenda;
  motivo?: string;
}

// ── Helper: badge de estado entrevista ────────────────────────────────────────

function EntrevistaBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    confirmada:            "bg-blue-100 text-blue-700 border border-blue-200",
    "solicitud de cambio": "bg-amber-100 text-amber-600 border border-amber-200",
    pendiente:             "bg-yellow-100 text-yellow-600 border border-yellow-200",
    cancelada:             "bg-red-100 text-red-700 border border-red-200",
    completada:            "bg-green-100 text-green-700 border border-green-200",
  };
  const labels: Record<string, string> = {
    confirmada:            "Confirmada",
    "solicitud de cambio": "Solicitud de cambio",
    pendiente:             "Pendiente de confirmación",
    cancelada:             "Cancelada",
    completada:            "Completada",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${map[estado] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

function ModalidadBadge({ modalidad }: { modalidad: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${
      modalidad === "virtual" ? "bg-blue-100 text-blue-700" : "bg-neutral-200 text-neutral-700"
    }`}>
      {modalidad === "virtual" ? "Virtual" : "Presencial"}
    </span>
  );
}

// ── Helpers de formato ────────────────────────────────────────────────────────

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

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

// ── Tarjeta ───────────────────────────────────────────────────────────────────

const BOTON_ROJO_PEQUENO = "px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium";

function Motivo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs font-semibold text-neutral-400 mb-1">{titulo}</div>
      <div className="text-sm text-gray-700 italic">"{texto}"</div>
    </div>
  );
}

function TarjetaAgenda({ item, className, children }: { item: ItemAgenda; className: string; children?: React.ReactNode }) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      {item.nombre && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-900">{item.nombre}</div>
          {item.descripcion && <div className="text-xs text-gray-500 mt-0.5">{item.descripcion}</div>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <EntrevistaBadge estado={item.estado} />
        <ModalidadBadge modalidad={item.modalidad} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CalendarIcon /><span>{formatFecha(item.fecha)}</span>
          <ClockIcon /><span>{formatHora(item.hora)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPinIcon />
          <span>{item.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{item.lugar}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Sección ───────────────────────────────────────────────────────────────────

interface SeccionAgendaProps<T extends ItemAgenda> {
  /** Título de la sección en plural ("Entrevistas"). */
  titulo: string;
  /** Nombre en singular y minúscula ("entrevista"). */
  singular: string;
  items: T[];
  cargando: boolean;
  onRecargar: () => void;
  textoNuevo: string;
  onNuevo: () => void;
  textoCompletar: string;
  onCompletar: (id: string) => void;
  onCancelar: (id: string) => void;
  onReagendar: (item: T) => void;
  onEditar: (item: T) => void;
  mensajeVacio: string;
  className?: string;
}

/**
 * Bloque de entrevistas o pruebas del aspirante en la vista de calificación:
 * confirmadas, pendientes/solicitudes de cambio e historial colapsable.
 */
export default function SeccionAgenda<T extends ItemAgenda>({
  titulo,
  singular,
  items,
  cargando,
  onRecargar,
  textoNuevo,
  onNuevo,
  textoCompletar,
  onCompletar,
  onCancelar,
  onReagendar,
  onEditar,
  mensajeVacio,
  className = "",
}: SeccionAgendaProps<T>) {
  const [historialAbierto, setHistorialAbierto] = useState(false);

  const porEstado = (estado: EstadoAgenda) => items.filter(i => i.estado === estado);
  const confirmadas = porEstado("confirmada");
  const activas     = [...porEstado("solicitud de cambio"), ...porEstado("pendiente")];
  const historial   = [...porEstado("completada"), ...porEstado("cancelada")];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 mb-6 animate-fade-in-up ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{titulo}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRecargar}
            disabled={cargando}
            title={`Recargar ${titulo.toLowerCase()}`}
            className="p-2 text-neutral-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" /> : <RefreshIcon />}
          </button>
          <button
            onClick={onNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium"
          >
            <PlusIcon />
            {textoNuevo}
          </button>
        </div>
      </div>

      {/* Confirmadas */}
      {confirmadas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 mb-3">{titulo} confirmadas</h3>
          <div className="space-y-3">
            {confirmadas.map(item => (
              <TarjetaAgenda key={item.id} item={item} className="border-blue-200 bg-blue-50/30">
                <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                  <button
                    onClick={() => onCompletar(item.id)}
                    className="flex-1 px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                  >
                    {textoCompletar}
                  </button>
                  <button
                    onClick={() => onCancelar(item.id)}
                    className="flex-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </TarjetaAgenda>
            ))}
          </div>
        </div>
      )}

      {/* Pendientes / solicitud de cambio */}
      {activas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-600 mb-3">Otras {titulo.toLowerCase()}</h3>
          <div className="space-y-3">
            {activas.map(item => (
              <TarjetaAgenda key={item.id} item={item} className="border-gray-200">
                {item.estado === "solicitud de cambio" && item.motivo && (
                  <>
                    <Motivo titulo="Motivo de solicitud:" texto={item.motivo} />
                    <div className="mt-2">
                      <button onClick={() => onReagendar(item)} className={BOTON_ROJO_PEQUENO}>
                        Reagendar {singular}
                      </button>
                    </div>
                  </>
                )}
                {item.estado === "pendiente" && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button onClick={() => onEditar(item)} className={BOTON_ROJO_PEQUENO}>
                      Editar {singular}
                    </button>
                  </div>
                )}
              </TarjetaAgenda>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setHistorialAbierto(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors group focus:outline-none"
          >
            <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
              Historial
              <span className="ml-2 text-neutral-400 font-normal">({historial.length})</span>
            </span>
            <ChevronDownIcon open={historialAbierto} />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              historialAbierto ? "max-h-1000 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 space-y-3">
              {historial.map(item => (
                <TarjetaAgenda key={item.id} item={item} className="border-gray-200 bg-gray-50">
                  {item.estado === "cancelada" && item.motivo && (
                    <Motivo titulo="Motivo de cancelación:" texto={item.motivo} />
                  )}
                </TarjetaAgenda>
              ))}
            </div>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
          <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
          Cargando {titulo.toLowerCase()}...
        </div>
      ) : items.length === 0 && (
        <p className="text-center py-8 text-sm text-neutral-400">{mensajeVacio}</p>
      )}
    </div>
  );
}
