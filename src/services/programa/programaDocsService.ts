import { programaApiClient, programaAuthService, getProgramaRealId } from './programaService';

type RequiredDocPayload = { nombre: string; formato?: string | null; tamanomaximo?: number };

export type RequiredDoc = {
  id: string | number;
  nombre: string;
  formato?: string | null;
  tamanomaximo?: number;
  urlformato?: string | null;
};

const programaDocsService = {
  async fetchRequiredDocuments() {
    const programaId = await getProgramaRealId();
    return programaApiClient.fetch<{ documentosConsejo: RequiredDoc[]; documentosPrograma: RequiredDoc[] }>(
      `/api/application/case/director-programa/programa/${programaId}/documentos/requeridos`,
      { method: 'GET' }
    );
  },

  // Create a document: send only `nombre` and `idPrograma` as a JSON string in the request body.
  // If a file is provided, upload it after creation via `uploadFormat`.
  async createRequiredDocument(nombre: string, file?: File | null) {
    const idPrograma = await getProgramaRealId();
    const url = `${(import.meta.env.VITE_API_URL as string)}/api/application/case/director-programa/programa/documentos`;

    const payloadString = JSON.stringify({ nombre, idPrograma });

    const form = new FormData();
    form.append('body', new Blob([payloadString], { type: 'application/json' }));
    if (file) form.append('file', file);

    const token = programaAuthService.getAccessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(url, { method: 'POST', headers, body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
    }

    const created = (await res.json()) as RequiredDoc;
    return created;
  },

  // Update a document: send `body` part (application/json) and optional `file` in multipart/form-data
  async updateRequiredDocument(docId: string, payload: RequiredDocPayload, file?: File | null) {
    const idPrograma = await getProgramaRealId();
    const url = `${(import.meta.env.VITE_API_URL as string)}/api/application/case/director-programa/programa/documento/${docId}`;

    const payloadString = JSON.stringify({ nombre: payload.nombre, idPrograma });
    const form = new FormData();
    form.append('body', new Blob([payloadString], { type: 'application/json' }));
    if (file) form.append('file', file);

    const token = programaAuthService.getAccessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(url, { method: 'PUT', headers, body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
    }

    // handle empty response
    const text = await res.text().catch(() => '');
    if (!text) return undefined as unknown as RequiredDoc;
    try {
      return JSON.parse(text) as RequiredDoc;
    } catch {
      return text as unknown as RequiredDoc;
    }
  },

  async deleteRequiredDocument(docId: string) {
    return programaApiClient.fetch<{ success: boolean }>(
      `/api/application/case/director-programa/programa/documento/${docId}`,
      { method: 'DELETE' }
    );
  },

  async uploadFormat(docId: string, file: File) {
    const url = `${(import.meta.env.VITE_API_URL as string)}/api/application/case/director-programa/documentos/${docId}/formato`;
    const form = new FormData();
    form.append('file', file);
    const token = programaAuthService.getAccessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(url, { method: 'POST', headers, body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
    }
    return res.json();
  },
};

export default programaDocsService;

/* Suggested backend endpoints (example)

GET  /api/application/case/director-programa/programa/:programaId/documentos/requeridos
  Response:
  {
    "documentosConsejo": [ { "id", "nombre", "tamanomaximo", "urlformato", "id_programa" } ],
    "documentosPrograma": [ { "id", "nombre", "tamanomaximo", "urlformato", "id_programa" } ]
  }

POST /api/application/case/director-programa/programa/:programaId/documentos/requeridos
  Body: { nombre, tamanomaximo?, formato? }
  Response: { id, nombre, tamanomaximo, urlformato }

PUT  /api/application/case/director-programa/documentos/:documentoId
  Body: { nombre, tamanomaximo?, formato? }
  Response: { id, nombre, tamanomaximo, urlformato }

DELETE /api/application/case/director-programa/documentos/:documentoId
  Response: { success: true }

POST /api/application/case/director-programa/documentos/:documentoId/formato
  multipart/form-data: file
  Response: { success: true, urlformato: 'https://...' }

*/
