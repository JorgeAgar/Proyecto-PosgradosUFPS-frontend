import { programaApiClient } from './programaService';

export interface DocumentoAspiranteValidacionApi {
  idDocumento: number;
  idDocumentosrequisitoconsejocohorte: number;
  idDocumentosrequisitoprogramacohorte: number;
  nombreTitulo: string;
  estado: string;
  motivoRechazo: string | null;
  linkArchivo: string;
}

export interface DocumentosAspiranteResponse {
  idAspirante: number;
  nombreAspirante: string;
  cedula: string;
  estadoGeneral: "APROBADO" | "PENDIENTE" | "RECHAZADO";
  documentos: DocumentoAspiranteValidacionApi[];
}

export interface AccionDocumentoResponse {
  id: number;
  nombre: string;
  estado: string;
  motivoRechazo?: string | null;
}

export async function obtenerDocumentosAspirante(idAspirante: number): Promise<DocumentosAspiranteResponse> {
  return programaApiClient.fetch<DocumentosAspiranteResponse>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/documentos`
  );
}

export async function aprobarDocumento(idDocumento: number): Promise<AccionDocumentoResponse> {
  return programaApiClient.fetch<AccionDocumentoResponse>(
    `/api/application/case/director-programa/documentos/${idDocumento}/aprobar`,
    { method: "PATCH" }
  );
}

export async function rechazarDocumento(
  idDocumento: number,
  motivoRechazo: string,
): Promise<AccionDocumentoResponse> {
  return programaApiClient.fetch<AccionDocumentoResponse>(
    `/api/application/case/director-programa/documentos/${idDocumento}/rechazar`,
    { method: "PATCH", body: JSON.stringify(motivoRechazo) }
  );
}
