/**
 * superadminService.ts
 *
 * Servicio de autenticación y peticiones autenticadas para el módulo SUPERADMIN.
 */

import { createApiClient } from "../apiService";
import { createAuthService, extractErrorMessage } from "../authService";

const BASE_URL = (import.meta.env.VITE_API_URL as string ?? "").replace(/\/$/, "");

const ACCESS_TOKEN_KEY  = "ufps_superadmin_access_token";
const REFRESH_TOKEN_KEY = "ufps_superadmin_refresh_token";
const SESSION_KEY       = "ufps_superadmin_session";

// ── Tipos para el catálogo de endpoints ──────────────────────────────────────

export interface EndpointField {
  name: string;
  type: string;
  required: boolean;
  example: unknown;
  fields?: EndpointField[];
}

export interface EndpointRequestBody {
  type: string;
  required: boolean;
  template: unknown;
  fields: EndpointField[];
}

export interface EndpointQueryParam {
  name: string;
  source: string;
  type: string;
  required: boolean;
  example: unknown;
}

export interface EndpointPathVariable {
  name: string;
  source: string;
  type: string;
  required: boolean;
  example: unknown;
}

export interface BackendEndpoint {
  path: string;
  methods: string[];
  consumes: string[];
  produces: string[];
  controller: string;
  handler: string;
  requestBody: EndpointRequestBody | null;
  queryParameters: EndpointQueryParam[];
  pathVariables: EndpointPathVariable[];
}

export interface SuperAdminCatalog {
  role: string;
  description: string;
  total: number;
  endpoints: BackendEndpoint[];
}

export interface EntityGroup {
  controller: string;
  endpoints: BackendEndpoint[];
}

// ── Helper de fetch autenticado ───────────────────────────────────────────────

export async function superadminApiUploadFile<T>(
  path: string,
  formData: FormData,
  _isRetry = false,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData });

  if ((res.status === 401 || res.status === 403) && !_isRetry) {
    const refreshed = await superadminAuthService.refreshSession();
    if (!refreshed) {
      superadminAuthService.logout();
      throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
    }
    return superadminApiUploadFile<T>(path, formData, true, method);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    throw new Error(extractErrorMessage(body, res.status, res.statusText));
  }

  if (res.status === 204) return undefined as T;
  if (res.headers.get("content-length") === "0") return undefined as T;
  const respText = await res.text();
  if (!respText) return undefined as T;
  try {
    return JSON.parse(respText) as T;
  } catch {
    return undefined as T;
  }
}

// ── Auth Superadmin ───────────────────────────────────────────────────────────

export const superadminAuthService = createAuthService({
  accessTokenKey: ACCESS_TOKEN_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
  sessionKey: SESSION_KEY,
  requestedRole: "Super Administrador",
});

export const superadminApiClient = createApiClient(superadminAuthService);
