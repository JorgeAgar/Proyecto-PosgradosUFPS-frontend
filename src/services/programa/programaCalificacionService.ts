import { programaApiClient, getProgramaRealId } from "./programaService";

const getIdPrograma = getProgramaRealId;

export interface DocumentoCohorte {
  id: number;
  nombre: string;
  obligatorio: boolean;
  idCohorte: number;
}

export interface CohorteCalificacion {
  id: number;
  nombre: string;
  activa: boolean;
  semestre: string;
  cupos: number;
  fechaLimitePago: string;
  fechaLimiteDocs: string;
  fechaLimiteInscripcion: string;
  totalInscritos: number;
  totalPazysalvo: number;
  totalValidados: number;
  totalCalificados: number;
  totalAdmitidos: number;
  documentos: DocumentoCohorte[];
}

export async function getCohortesByPrograma(): Promise<CohorteCalificacion[]> {
  const idPrograma = await getIdPrograma();
  return programaApiClient.fetch<CohorteCalificacion[]>(
    `/api/application/case/director-programa/programa/${idPrograma}/cohortes`
  );
}
