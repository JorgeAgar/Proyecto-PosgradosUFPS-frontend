import { API_BASE_URL, extractErrorMessage, type AuthService } from "./authService";

export interface ApiClient {
  /** Petición autenticada; la respuesta se interpreta como JSON (o texto si no lo es). */
  fetch<T>(path: string, options?: RequestInit): Promise<T>;
  /** Envía un `multipart/form-data` autenticado. */
  upload<T>(path: string, formData: FormData, method?: "POST" | "PUT" | "PATCH"): Promise<T>;
  /** Petición autenticada cuya respuesta es un archivo binario. */
  blob(path: string, options?: RequestInit): Promise<Blob>;
}

export function createApiClient(authService: AuthService): ApiClient {
  /** Hace la petición con token, renueva la sesión ante 401/403 y lanza un error si la respuesta no es OK. */
  async function request(path: string, options?: RequestInit, isRetry = false): Promise<Response> {
    const token = authService.getAccessToken();
    const headers = new Headers(options?.headers);

    // Con FormData el navegador debe poner el Content-Type (incluye el boundary).
    if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if ((response.status === 401 || response.status === 403) && !isRetry) {
      const refreshed = await authService.refreshSession();
      if (!refreshed) {
        authService.logout();
        throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
      }
      return request(path, options, true);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      const error = new Error(
        extractErrorMessage(body, response.status, response.statusText),
      ) as Error & { body?: unknown; status?: number; statusText?: string };
      error.body = body;
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    return response;
  }

  async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await request(path, options);
    const text = await response.text().catch(() => "");
    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  return {
    fetch: apiFetch,
    upload: (path, formData, method = "POST") => apiFetch(path, { method, body: formData }),
    blob: async (path, options) => (await request(path, options)).blob(),
  };
}
