import { aspiranteApiClient, getAspiranteRealId } from "./aspiranteService";

// ── Tipos backend ─────────────────────────────────────────────────────────────

interface PasoBackend {
  id: number;
  name: string;
  status: string;
}

// ── Tipos frontend ────────────────────────────────────────────────────────────

export type EstadoPaso = "completado" | "en-progreso" | "pendiente";

export interface PasoProceso {
  id: number;
  nombre: string;
  estado: EstadoPaso;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapEstado(apiStatus: string): EstadoPaso {
  const s = apiStatus.toLowerCase().trim();
  if (s === "completado") return "completado";
  if (s === "en progreso") return "en-progreso";
  return "pendiente";
}

// ── Función exportada ─────────────────────────────────────────────────────────

// GET /api/application/case/aspirantes/{idAspirante}/estado-proceso
export async function fetchEstadoProceso(): Promise<PasoProceso[]> {
  const idAspirante = await getAspiranteRealId();
  const list = await aspiranteApiClient.fetch<PasoBackend[]>(
    `/api/application/case/aspirantes/${idAspirante}/estado-proceso`
  );
  return (list ?? []).map(p => ({
    id: p.id,
    nombre: p.name,
    estado: mapEstado(p.status),
  }));
}

export default { fetchEstadoProceso };
