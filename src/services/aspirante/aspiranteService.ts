import { createApiClient } from "../apiService";
import { createAuthService } from "../authService";

export const ACCESS_TOKEN_KEY = "ufps_aspirante_access_token";
export const REFRESH_TOKEN_KEY = "ufps_aspirante_refresh_token";
export const SESSION_KEY = "ufps_aspirante_session";
export const ASPIRANTE_ID_KEY = "ufps_aspirante_id";

let _aspiranteIdCache: number | null = null;

export async function getAspiranteRealId(): Promise<number> {
  if (_aspiranteIdCache !== null) return _aspiranteIdCache;
  const stored = localStorage.getItem(ASPIRANTE_ID_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (!isNaN(parsed) && parsed > 0) {
      _aspiranteIdCache = parsed;
      return _aspiranteIdCache;
    }
  }
  const session = aspiranteAuthService.getSession();
  const userId = session?.userId ?? 0;
  const res = await aspiranteApiClient.fetch<{ idAspirante: number }>(
    `/api/application/case/aspirantes/aspirante/${userId}`
  );
  const id = res.idAspirante;
  _aspiranteIdCache = id;
  localStorage.setItem(ASPIRANTE_ID_KEY, String(id));
  return _aspiranteIdCache;
}

// ── Correo del aspirante ─────────────────────────────────────────────────────

export async function getCorreoAspirante(): Promise<string | null> {
  const id = await getAspiranteRealId();
  const res = await aspiranteApiClient.fetch<{ correo?: string } | string>(
    `/api/application/case/aspirantes/${id}/correo`
  );
  if (!res) return null;
  if (typeof res === "string") return res as string;
  if (typeof res === "object" && res.correo) return res.correo;
  return null;
}

export async function patchCorreoAspirante(correoNuevo: string): Promise<void> {
  const id = await getAspiranteRealId();
  const q = `?correoNuevo=${encodeURIComponent(correoNuevo)}`;
  await aspiranteApiClient.fetch<void>(`/api/application/case/aspirantes/${id}/correo${q}`, {
    method: "PATCH",
  });
}

export async function enviarConfirmacionCorreo(): Promise<void> {
  const id = await getAspiranteRealId();
  await aspiranteApiClient.fetch<void>(`/api/application/case/aspirantes/${id}/enviar-confirmacion-correo`, {
    method: "POST",
  });
}

export const aspiranteAuthService = createAuthService({
  accessTokenKey: ACCESS_TOKEN_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
  sessionKey: SESSION_KEY,
  requestedRole: "Aspirante",
  extraKeys: [ASPIRANTE_ID_KEY],
  onLogin: async (data) => {
    // El ID cacheado de la sesión anterior ya fue limpiado; se resuelve el nuevo
    _aspiranteIdCache = null;
    try {
      const res = await aspiranteApiClient.fetch<{ idAspirante: number }>(
        `/api/application/case/aspirantes/aspirante/${data.userId}`
      );
      _aspiranteIdCache = res.idAspirante;
      localStorage.setItem(ASPIRANTE_ID_KEY, String(res.idAspirante));
    } catch {
      // idAspirante se obtendrá en el primer uso
    }
  },
  onLogout: () => {
    _aspiranteIdCache = null;
  },
});

export const aspiranteApiClient = createApiClient(aspiranteAuthService);
