import { superadminApiClient } from './superadminService';

export interface DocumentoConsejoOutput {
  id: number;
  nombre: string;
  tamanomaximo: number;
  urlformato?: string | null;
}

export interface DocumentoConsejoPayload {
  nombre: string;
  tamanomaximo: number;
}

let documentosCache: DocumentoConsejoOutput[] = [];
let documentosLoaded = false;
let documentosPromise: Promise<DocumentoConsejoOutput[]> | null = null;

function documentForm(data: DocumentoConsejoPayload, file?: File | null) {
  const form = new FormData();
  form.append('body', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (file) form.append('file', file);
  return form;
}

export const superadminDocumentosService = {
  async listar(forceRefresh = false): Promise<DocumentoConsejoOutput[]> {
    if (!forceRefresh && documentosLoaded) return [...documentosCache];
    if (!documentosPromise || forceRefresh) {
      documentosPromise = superadminApiClient.fetch<DocumentoConsejoOutput[]>(
        '/api/dev/endpoint/documentosrequisitoconsejo/listall',
      ).then((data) => {
        documentosCache = data;
        documentosLoaded = true;
        return [...data];
      }).finally(() => { documentosPromise = null; });
    }
    return documentosPromise;
  },

  async crear(data: DocumentoConsejoPayload, file?: File | null): Promise<DocumentoConsejoOutput[]> {
    await superadminApiClient.upload<unknown>(
      '/api/dev/endpoint/documentosrequisitoconsejo/superadmin/create',
      documentForm({ nombre: data.nombre.trim(), tamanomaximo: data.tamanomaximo }, file),
    );
    return this.listar(true);
  },

  async actualizar(data: DocumentoConsejoPayload & { id: number }, file?: File | null): Promise<DocumentoConsejoOutput[]> {
    const body = { id: data.id, nombre: data.nombre.trim(), tamanomaximo: data.tamanomaximo };
    if (file) {
      await superadminApiClient.upload<unknown>(
        `/api/dev/endpoint/documentosrequisitoconsejo/superadmin/${data.id}`,
        documentForm(body, file), 'PUT',
      );
    } else {
      await superadminApiClient.fetch<DocumentoConsejoOutput>('/api/dev/endpoint/documentosrequisitoconsejo/update', {
        method: 'PUT', body: JSON.stringify(body),
      });
    }
    return this.listar(true);
  },

  async eliminar(id: number): Promise<DocumentoConsejoOutput[]> {
    await superadminApiClient.fetch<void>('/api/dev/endpoint/documentosrequisitoconsejo/delete', {
      method: 'DELETE', body: JSON.stringify({ id }),
    });
    return this.listar(true);
  },

  getCachedDocumentos(): DocumentoConsejoOutput[] { return [...documentosCache]; },
  hasCachedDocumentos(): boolean { return documentosLoaded; },
};
