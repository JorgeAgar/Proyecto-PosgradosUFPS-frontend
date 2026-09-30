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

// ── Auth Superadmin ───────────────────────────────────────────────────────────

export const superadminAuthService = createAuthService({
  accessTokenKey: ACCESS_TOKEN_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
  sessionKey: SESSION_KEY,
  requestedRole: "Super Administrador",
});

export const superadminApiClient = createApiClient(superadminAuthService);
