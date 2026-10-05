/**
 * posgradosService.ts
 *
 * Servicio de autenticación y peticiones autenticadas para el módulo POSGRADOS.
 */

import { createApiClient } from "../apiService";
import { createAuthService } from "../authService";

const ACCESS_TOKEN_KEY  = "ufps_posgrados_access_token";
const REFRESH_TOKEN_KEY = "ufps_posgrados_refresh_token";
const SESSION_KEY       = "ufps_posgrados_session";

export const posgradosAuthService = createAuthService({
  accessTokenKey: ACCESS_TOKEN_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
  sessionKey: SESSION_KEY,
  requestedRole: "POSGRADOS",
});

export const posgradosApiClient = createApiClient(posgradosAuthService);
