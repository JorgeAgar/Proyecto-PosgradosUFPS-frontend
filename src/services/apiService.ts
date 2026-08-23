import { extractErrorMessage, type AuthService } from "./authService";

const BASE_URL = (import.meta.env.VITE_API_URL as string ?? "").replace(/\/$/, "");

export interface ApiClient {
  fetch<T>(path: string, options?: RequestInit): Promise<T>;
}

export function createApiClient(authService: AuthService): ApiClient {
  async function apiFetch<T>(path: string, options?: RequestInit, isRetry = false): Promise<T> {
    const token = authService.getAccessToken();
    const headers = new Headers(options?.headers);

    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if ((response.status === 401 || response.status === 403) && !isRetry) {
      const refreshed = await authService.refreshSession();
      if (!refreshed) {
        authService.logout();
        throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
      }
      return apiFetch<T>(path, options, true);
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

    const text = await response.text().catch(() => "");
    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  return { fetch: apiFetch };
}
