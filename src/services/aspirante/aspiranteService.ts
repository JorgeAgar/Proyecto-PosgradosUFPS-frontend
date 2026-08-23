import { createApiClient } from "../apiService";
import { createAuthService, extractErrorMessage } from "../authService";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const ACCESS_TOKEN_KEY = "ufps_aspirante_access_token";
export const REFRESH_TOKEN_KEY = "ufps_aspirante_refresh_token";
export const SESSION_KEY = "ufps_aspirante_session";
export const ASPIRANTE_ID_KEY = "ufps_aspirante_id";

export async function aspiranteApiUploadFile<T>(path: string, formData: FormData, _isRetry = false, method: 'POST' | 'PATCH' = 'POST'): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData });

  if ((res.status === 401 || res.status === 403) && !_isRetry) {
    const refreshed = await aspiranteAuthService.refreshSession();
    if (!refreshed) {
      aspiranteAuthService.logout();
      throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
    }
    return aspiranteApiUploadFile<T>(path, formData, true, method);
  }

  if (!res.ok) {
    const rawText = await res.text().catch(() => "");
    let body: unknown;
    try { body = JSON.parse(rawText); } catch { body = rawText; }
    throw new Error(extractErrorMessage(body, res.status, res.statusText));
  }

  if (res.status === 204) return undefined as T;
  if (res.headers.get("content-length") === "0") return undefined as T;
  const rawText = await res.text();
  if (!rawText) return undefined as T;
  try { return JSON.parse(rawText) as T; } catch { return undefined as T; }
}

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
