import {
  obtenerPagosInscripcion,
  aprobarPagoInscripcion,
  rechazarPagoInscripcion,
  type PagoInscripcionApi,
} from "../../../services/programa/validacionPagosInscripcionService";
import {
  obtenerPagosMatricula,
  aprobarPagoMatricula,
  rechazarPagoMatricula,
} from "../../../services/programa/validacionPagosMatriculaService";

export type TipoPago = "inscripcion" | "matricula";

/** Inscripción y matrícula comparten la misma forma de pago. */
export type PagoApi = PagoInscripcionApi;

interface ConfigTipoPago {
  /** Nombre visible: "Inscripción" / "Matrícula". */
  nombre: string;
  /** Ruta base del módulo en el panel de programa. */
  ruta: string;
  obtener: (idCohorte: number) => Promise<PagoApi[]>;
  aprobar: (idRecibo: number) => Promise<unknown>;
  rechazar: (idRecibo: number) => Promise<unknown>;
}

export const TIPOS_PAGO: Record<TipoPago, ConfigTipoPago> = {
  inscripcion: {
    nombre: "Inscripción",
    ruta: "/programa/pagos/inscripcion",
    obtener: obtenerPagosInscripcion,
    aprobar: aprobarPagoInscripcion,
    rechazar: rechazarPagoInscripcion,
  },
  matricula: {
    nombre: "Matrícula",
    ruta: "/programa/pagos/matricula",
    obtener: obtenerPagosMatricula,
    aprobar: aprobarPagoMatricula,
    rechazar: rechazarPagoMatricula,
  },
};
