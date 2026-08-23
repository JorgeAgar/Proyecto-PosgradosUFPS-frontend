/**
 * programaService.ts
 *
 * Servicio de autenticación para el módulo Programa (Director de Programa).
 * Implementa `login`, `logout`, `refreshSession` y helpers similares al patrón
 * usado en `superadminService.ts`.
 */

import { createApiClient } from "../apiService";
import { createAuthService } from "../authService";

const ACCESS_TOKEN_KEY = "ufps_programa_access_token";
const REFRESH_TOKEN_KEY = "ufps_programa_refresh_token";
const SESSION_KEY = "ufps_programa_session";
const PROGRAMA_KEY = "ufps_programa_id";

let _programaIdCache: number | null = null;

export async function getProgramaRealId(): Promise<number> {
  if (_programaIdCache !== null) return _programaIdCache;
  const stored = localStorage.getItem(PROGRAMA_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (!isNaN(parsed) && parsed > 0) {
      _programaIdCache = parsed;
      return _programaIdCache;
    }
  }
  const session = programaAuthService.getSession();
  const userId = session?.userId ?? 0;
  interface ProgramaIdResponse {
    idPrograma: number;
  }
  const resp = await programaApiClient.fetch<ProgramaIdResponse>(
    `/api/application/case/director-programa/programa/director/${userId}`,
    { method: "GET" }
  );
  const id = resp.idPrograma;
  if (!id || typeof id !== "number") throw new Error("No se pudo obtener el id del programa desde el servidor.");
  _programaIdCache = id;
  localStorage.setItem(PROGRAMA_KEY, String(id));
  return _programaIdCache;
}

// ── Helpers específicos de Programa ──────────────────────────────────────────
export interface ProgramaBackend {
  id: number;
  codigo?: number;
  nombre: string;
  semestres?: number;
  correo?: string;
  sede?: { id?: number; nombre?: string };
  facultad?: { id?: number; nombre?: string };
  ofertaacademicaList?: Array<{ id?: number; encuentros?: string }>;
}

export const programaAuthService = {
  ...createAuthService({
    accessTokenKey: ACCESS_TOKEN_KEY,
    refreshTokenKey: REFRESH_TOKEN_KEY,
    sessionKey: SESSION_KEY,
    requestedRole: "Director de programa",
    extraKeys: [PROGRAMA_KEY],
    onLogin: () => {
      // Se limpia el programaId cacheado para que se resuelva de nuevo en la sesión nueva
      _programaIdCache = null;
    },
    onLogout: () => {
      _programaIdCache = null;
    },
  }),

  async setProgramaId() {
    await getProgramaRealId();
  },
};

export const programaApiClient = createApiClient(programaAuthService);
