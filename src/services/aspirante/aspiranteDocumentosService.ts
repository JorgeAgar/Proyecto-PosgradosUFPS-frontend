import { aspiranteApiClient, getAspiranteRealId, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./aspiranteService";

const BASE_URL = import.meta.env.VITE_API_URL as string;

// ── Tipos backend ─────────────────────────────────────────────────────────────

export interface DocumentoRequerido {
  idDocumento: number;
  idDocumentosrequisitoconsejocohorte: number;
  idDocumentosrequisitoprogramacohorte: number;
  nombre: string;
  urlformato: string | null;
  tamanoMaximoMB: number;
}

export interface DocumentoSubido {
  idDocumento: number;
  idDocumentosrequisitoconsejocohorte: number;
  idDocumentosrequisitoprogramacohorte: number;
  nombre: string;
  estado: string;
  motivoRechazo: string | null;
  linkArchivo: string | null;
}

export interface DocumentosSubidosResponse {
  idAspirante: number;
  nombreAspirante: string;
  cedula: string;
  estadoGeneral: string;
  documentos: DocumentoSubido[];
}

// ── Funciones de servicio ─────────────────────────────────────────────────────

export async function fetchDocumentosRequeridos(): Promise<DocumentoRequerido[]> {
  const idAspirante = await getAspiranteRealId();
  return aspiranteApiClient.fetch<DocumentoRequerido[]>(
    `/api/application/case/aspirantes/${idAspirante}/documentos/requeridos`
  );
}

export async function fetchDocumentosSubidos(): Promise<DocumentosSubidosResponse> {
  const idAspirante = await getAspiranteRealId();
  return aspiranteApiClient.fetch<DocumentosSubidosResponse>(
    `/api/application/case/aspirantes/${idAspirante}/documentos`
  );
}

async function _refreshAccessToken(): Promise<string | null> {
  const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!rt) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    if (data.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

function _extractErrorMessage(body: unknown, status: number): string {
  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (typeof obj.message === "string" && obj.message) return obj.message;
  if (typeof obj.mensaje === "string" && obj.mensaje) return obj.mensaje;
  return `Error ${status} al subir el documento`;
}

async function _enviarDocumento(
  method: "POST" | "PATCH",
  idDocumentosrequisitoconsejocohorte: number,
  idDocumentosrequisitoprogramacohorte: number,
  file: File
): Promise<void> {
  const idAspirante = await getAspiranteRealId();

  const params = new URLSearchParams();
  if (idDocumentosrequisitoconsejocohorte > 0) {
    params.set("idDocumentosrequisitoconsejocohorte", String(idDocumentosrequisitoconsejocohorte));
  }
  if (idDocumentosrequisitoprogramacohorte > 0) {
    params.set("idDocumentosrequisitoprogramacohorte", String(idDocumentosrequisitoprogramacohorte));
  }

  const url = `${BASE_URL}/api/application/case/aspirantes/${idAspirante}/documentos/requeridos?${params.toString()}`;

  const doFetch = async (token: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(url, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  };

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  let res = await doFetch(token);

  if (res.status === 401 || res.status === 403) {
    const newToken = await _refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    throw new Error(_extractErrorMessage(body, res.status));
  }
}

export async function subirDocumento(
  idDocumentosrequisitoconsejocohorte: number,
  idDocumentosrequisitoprogramacohorte: number,
  file: File
): Promise<void> {
  return _enviarDocumento("POST", idDocumentosrequisitoconsejocohorte, idDocumentosrequisitoprogramacohorte, file);
}

export async function actualizarDocumento(
  idDocumentosrequisitoconsejocohorte: number,
  idDocumentosrequisitoprogramacohorte: number,
  file: File
): Promise<void> {
  return _enviarDocumento("PATCH", idDocumentosrequisitoconsejocohorte, idDocumentosrequisitoprogramacohorte, file);
}
