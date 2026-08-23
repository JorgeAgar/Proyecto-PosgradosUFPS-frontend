import { aspiranteApiClient, getAspiranteRealId } from "./aspiranteService";

// ── Tipos backend ─────────────────────────────────────────────────────────────

interface PruebaBackend {
  id: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  tiempo: string;
  idEstado: number;
  estado: string;
  idTipoprueba: number;
  tipoprueba: string;
  ubicacion: string;
  motivocambio: string | null;
}

// ── Tipos frontend ────────────────────────────────────────────────────────────

export type EstadoPrueba =
  | "confirmada"
  | "pendiente"
  | "solicitud_de_cambio"
  | "cancelada"
  | "completada";

export interface Prueba {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  tiempo: string;
  lugar: string;
  modalidad: string;
  estado: EstadoPrueba;
  motivocambio?: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapEstado(estado: string): EstadoPrueba {
  const m: Record<string, EstadoPrueba> = {
    "CONFIRMADA":                "confirmada",
    "PENDIENTE DE CONFIRMACION": "pendiente",
    "SOLICITUD DE CAMBIO":       "solicitud_de_cambio",
    "CANCELADA":                 "cancelada",
    "COMPLETADA":                "completada",
  };
  return m[estado] ?? "pendiente";
}

// ── Funciones exportadas ──────────────────────────────────────────────────────

// GET /api/application/case/aspirantes/{idAspirante}/pruebas
export async function getPruebas(): Promise<Prueba[]> {
  const idAspirante = await getAspiranteRealId();
  const list = await aspiranteApiClient.fetch<PruebaBackend[]>(
    `/api/application/case/aspirantes/${idAspirante}/pruebas`
  );
  return (list ?? []).map(p => ({
    id: String(p.id),
    nombre: p.nombre ?? "",
    descripcion: p.descripcion ?? "",
    fecha: p.fecha,
    tiempo: p.tiempo,
    lugar: p.ubicacion,
    modalidad: p.tipoprueba,
    estado: mapEstado(p.estado),
    motivocambio: p.motivocambio ?? undefined,
  }));
}

// PATCH /api/application/case/aspirantes/pruebas/{idPrueba}/aceptar
export async function aceptarPrueba(idPrueba: string): Promise<void> {
  return aspiranteApiClient.fetch<void>(
    `/api/application/case/aspirantes/pruebas/${idPrueba}/aceptar`,
    { method: "PATCH" }
  );
}

// PATCH /api/application/case/aspirantes/pruebas/{idPrueba}/solicitar-cambio
export async function solicitarCambioPrueba(idPrueba: string, motivocambio: string): Promise<void> {
  return aspiranteApiClient.fetch<void>(
    `/api/application/case/aspirantes/pruebas/${idPrueba}/solicitar-cambio`,
    { method: "PATCH", body: JSON.stringify({ motivocambio }) }
  );
}

// PATCH /api/application/case/aspirantes/pruebas/{idPrueba}/cancelar
export async function cancelarPrueba(idPrueba: string, motivocambio: string): Promise<void> {
  return aspiranteApiClient.fetch<void>(
    `/api/application/case/aspirantes/pruebas/${idPrueba}/cancelar`,
    { method: "PATCH", body: JSON.stringify({ motivocambio }) }
  );
}
