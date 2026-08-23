import { programaApiClient, getProgramaRealId } from './programaService';

export interface DocumentoRequerido {
  id: number;
  nombre: string;
  obligatorio: boolean;
  idCohorte?: number;
}

export interface CohorteValidacionApi {
  id: number;
  nombre: string;
  activa: boolean;
  semestre: string;
  cupos: number;
  fechaLimiteDocs: string;
  fechaLimiteInscripcion: string;
  totalInscritos: number;
  totalPazysalvo: number;
  totalValidados: number;
  totalAdmitidos: number | null;
  documentos: DocumentoRequerido[];
}

export async function obtenerCohortesPorPrograma(): Promise<CohorteValidacionApi[]> {
  const programaId = await getProgramaRealId();
  return programaApiClient.fetch<CohorteValidacionApi[]>(
    `/api/application/case/director-programa/programa/${programaId}/cohortes`
  );
}
