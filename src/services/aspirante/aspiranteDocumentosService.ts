import { aspiranteApiClient, getAspiranteRealId } from "./aspiranteService";

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

  const formData = new FormData();
  formData.append("file", file);
  await aspiranteApiClient.upload<void>(
    `/api/application/case/aspirantes/${idAspirante}/documentos/requeridos?${params.toString()}`,
    formData,
    method
  );
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
