import { aspiranteApiClient, getAspiranteRealId } from "./aspiranteService";

// ── Tipos backend ─────────────────────────────────────────────────────────────

interface EntrevistaBackend {
  id: number;
  fecha: string;
  tiempo: string;
  idEstado: number;
  estado: string;
  idTipoentrevista: number;
  tipoentrevista: string;
  ubicacion: string;
  motivocambio: string | null;
}

// ── Tipos frontend ────────────────────────────────────────────────────────────

export type EstadoEntrevista =
  | "confirmada"
  | "pendiente"
  | "solicitud_de_cambio"
  | "cancelada"
  | "completada";

export interface Entrevista {
  id: string;
  fecha: string;
  tiempo: string;
  lugar: string;
  modalidad: string;
  estado: EstadoEntrevista;
  motivocambio?: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapEstado(estado: string): EstadoEntrevista {
  const m: Record<string, EstadoEntrevista> = {
    "CONFIRMADA":                "confirmada",
    "PENDIENTE DE CONFIRMACION": "pendiente",
    "SOLICITUD DE CAMBIO":       "solicitud_de_cambio",
    "CANCELADA":                 "cancelada",
    "COMPLETADA":                "completada",
  };
  return m[estado] ?? "pendiente";
}

// ── Funciones exportadas ──────────────────────────────────────────────────────

// GET /api/application/case/aspirantes/{idAspirante}/entrevistas
export async function getEntrevistas(): Promise<Entrevista[]> {
  const idAspirante = await getAspiranteRealId();
  const list = await aspiranteApiClient.fetch<EntrevistaBackend[]>(
    `/api/application/case/aspirantes/${idAspirante}/entrevistas`
  );
  return (list ?? []).map(e => ({
    id: String(e.id),
    fecha: e.fecha,
    tiempo: e.tiempo,
    lugar: e.ubicacion,
    modalidad: e.tipoentrevista,
    estado: mapEstado(e.estado),
    motivocambio: e.motivocambio ?? undefined,
  }));
}

// PATCH /api/application/case/aspirantes/entrevistas/{idEntrevista}/aceptar
export async function aceptarEntrevista(idEntrevista: string): Promise<void> {
  return aspiranteApiClient.fetch<void>(
    `/api/application/case/aspirantes/entrevistas/${idEntrevista}/aceptar`,
    { method: "PATCH" }
  );
}

// PATCH /api/application/case/aspirantes/entrevistas/{idEntrevista}/solicitar-cambio
export async function solicitarCambioEntrevista(idEntrevista: string, motivocambio: string): Promise<void> {
  return aspiranteApiClient.fetch<void>(
    `/api/application/case/aspirantes/entrevistas/${idEntrevista}/solicitar-cambio`,
    { method: "PATCH", body: JSON.stringify({ motivocambio }) }
  );
}

// PATCH /api/application/case/aspirantes/entrevistas/{idEntrevista}/cancelar
export async function cancelarEntrevista(idEntrevista: string, motivocambio: string): Promise<void> {
  return aspiranteApiClient.fetch<void>(
    `/api/application/case/aspirantes/entrevistas/${idEntrevista}/cancelar`,
    { method: "PATCH", body: JSON.stringify({ motivocambio }) }
  );
}
