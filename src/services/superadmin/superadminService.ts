/**
 * superadminService.ts
 *
 * Servicio de autenticación y peticiones autenticadas para el módulo SUPERADMIN.
 */

import { createApiClient } from "../apiService";
import { createAuthService } from "../authService";

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

// ── Auth Superadmin ───────────────────────────────────────────────────────────

export const superadminAuthService = createAuthService({
  accessTokenKey: ACCESS_TOKEN_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
  sessionKey: SESSION_KEY,
  requestedRole: "Super Administrador",
});

export const superadminApiClient = createApiClient(superadminAuthService);
