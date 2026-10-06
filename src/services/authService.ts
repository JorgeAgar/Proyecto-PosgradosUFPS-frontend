/**
 * authService.ts
 *
 * Servicio de autenticación global y reutilizable.
 *
 * Cada rol (aspirante, programa, posgrados, superadmin) guarda sus tokens en
 * claves distintas de localStorage, pero la lógica de login / logout / refresh
 * es la misma. `createAuthService` recibe esas claves (y opcionalmente algunos
 * hooks propios del rol) y devuelve el objeto de autenticación ya armado.
 */

/** URL base del backend (VITE_API_URL sin la barra final). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string ?? "").replace(/\/$/, "");

const HTTP_STATUS_TEXT: Record<number, string> = {
  400: "Solicitud incorrecta",
  401: "No autorizado",
  403: "Acceso denegado",
  404: "Recurso no encontrado",
  409: "Conflicto con el estado actual",
  422: "Datos no procesables",
  500: "Error interno del servidor",
  502: "Error de puerta de enlace",
  503: "Servicio no disponible",
};

export function extractErrorMessage(body: unknown, status: number, statusText: string): string {
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (trimmed && !trimmed.startsWith("<")) return trimmed;
  }
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.mensaje === "string" && obj.mensaje) return obj.mensaje;
    const skip = new Set(["timestamp", "path", "trace", "error", "status"]);
    for (const [key, val] of Object.entries(obj)) {
      if (!skip.has(key) && typeof val === "string" && val) return val;
    }
  }
  const desc = statusText || HTTP_STATUS_TEXT[status];
  return desc ? `Error ${status}: ${desc}` : `Error ${status}`;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  userId?: number;
  username?: string;
  roles?: string[];
}

export interface AuthSession {
  userId: number;
  username: string;
  roles: string[];
  displayName: string;
  loginAt: string;
}

export interface AuthServiceOptions {
  /** Clave de localStorage donde se guarda el access token. */
  accessTokenKey: string;
  /** Clave de localStorage donde se guarda el refresh token. */
  refreshTokenKey: string;
  /** Clave de localStorage donde se guarda la sesión. */
  sessionKey: string;
  /** Rol solicitado al backend en el login. */
  requestedRole: string;
  /** Claves adicionales del rol que se limpian al iniciar y cerrar sesión. */
  extraKeys?: string[];
  /** Hook ejecutado después de guardar la sesión en el login. */
  onLogin?: (data: LoginResponse) => void | Promise<void>;
  /** Hook ejecutado al cerrar sesión (antes de limpiar localStorage). */
  onLogout?: () => void;
}

export interface AuthService {
  login(usuario: string, password: string, requestedRole?: string): Promise<void>;
  logout(): void;
  refreshSession(): Promise<boolean>;
  getSession(): AuthSession | null;
  getAccessToken(): string | null;
  isAuthenticated(): boolean;
}

export function createAuthService(options: AuthServiceOptions): AuthService {
  const {
    accessTokenKey,
    refreshTokenKey,
    sessionKey,
    requestedRole: defaultRequestedRole,
    extraKeys = [],
    onLogin,
    onLogout,
  } = options;

  function persistSession(data: LoginResponse) {
    if (data.accessToken) localStorage.setItem(accessTokenKey, data.accessToken);
    if (data.refreshToken) localStorage.setItem(refreshTokenKey, data.refreshToken);
    localStorage.setItem(
      sessionKey,
      JSON.stringify({
        userId: data.userId,
        username: data.username,
        roles: data.roles,
        displayName: data.username,
        loginAt: new Date().toISOString(),
      })
    );
  }

  function clearStorage() {
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    for (const key of extraKeys) localStorage.removeItem(key);
  }

  function getSession(): AuthSession | null {
    const raw = localStorage.getItem(sessionKey);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  }

  return {
    async login(usuario: string, password: string, requestedRole = defaultRequestedRole): Promise<void> {
      if (!usuario.trim() || !password) throw new Error("Usuario y contraseña son obligatorios.");

      let data: LoginResponse;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usuario.trim(), password, requestedRole }),
        });

        if (res.status === 401 || res.status === 403) throw new Error("Usuario o contraseña incorrectos.");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(extractErrorMessage(body, res.status, res.statusText));
        }

        data = await res.json();
      } catch (err) {
        if (err instanceof TypeError) throw new Error("No se pudo conectar con el servidor. Verifica tu conexión.");
        throw err as Error;
      }

      if (!data.accessToken) throw new Error("Respuesta inválida del servidor: falta accessToken.");

      // Limpiar datos cacheados de la sesión anterior
      for (const key of extraKeys) localStorage.removeItem(key);

      persistSession(data);

      await onLogin?.(data);
    },

    logout() {
      onLogout?.();
      clearStorage();
    },

    async refreshSession(): Promise<boolean> {
      const rt = localStorage.getItem(refreshTokenKey);
      if (!rt) return false;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as LoginResponse;
        persistSession(data);
        return true;
      } catch {
        return false;
      }
    },

    getSession,

    getAccessToken(): string | null {
      return localStorage.getItem(accessTokenKey);
    },

    isAuthenticated(): boolean {
      return !!getSession();
    },
  };
}
