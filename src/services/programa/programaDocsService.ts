import { programaApiClient, getProgramaRealId } from './programaService';

type RequiredDocPayload = { nombre: string; formato?: string | null; tamanomaximo?: number };

export type RequiredDoc = {
  id: string | number;
  nombre: string;
  formato?: string | null;
  tamanomaximo?: number;
  urlformato?: string | null;
};

function buildDocumentForm(body: { nombre: string; idPrograma: number }, file?: File | null) {
  const form = new FormData();
  form.append('body', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  if (file) form.append('file', file);
  return form;
}

const programaDocsService = {
  async fetchRequiredDocuments() {
    const programaId = await getProgramaRealId();
    return programaApiClient.fetch<{ documentosConsejo: RequiredDoc[]; documentosPrograma: RequiredDoc[] }>(
      `/api/application/case/director-programa/programa/${programaId}/documentos/requeridos`,
      { method: 'GET' }
    );
  },

  // Create a document: send `nombre` and `idPrograma` as the JSON `body` part and the optional `file`.
  async createRequiredDocument(nombre: string, file?: File | null) {
    const idPrograma = await getProgramaRealId();
    return programaApiClient.upload<RequiredDoc>(
      '/api/application/case/director-programa/programa/documentos',
      buildDocumentForm({ nombre, idPrograma }, file)
    );
  },

  // Update a document: send `body` part (application/json) and optional `file` in multipart/form-data
  async updateRequiredDocument(docId: string, payload: RequiredDocPayload, file?: File | null) {
    const idPrograma = await getProgramaRealId();
    return programaApiClient.upload<RequiredDoc>(
      `/api/application/case/director-programa/programa/documento/${docId}`,
      buildDocumentForm({ nombre: payload.nombre, idPrograma }, file),
      'PUT'
    );
  },

  async deleteRequiredDocument(docId: string) {
    return programaApiClient.fetch<{ success: boolean }>(
      `/api/application/case/director-programa/programa/documento/${docId}`,
      { method: 'DELETE' }
    );
  },
};

export default programaDocsService;
