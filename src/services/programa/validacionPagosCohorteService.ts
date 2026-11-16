import { programaApiClient, getProgramaRealId } from './programaService';

export interface CohortePagos {
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
}

export async function getCohortesPagos(): Promise<CohortePagos[]> {
  const idPrograma = await getProgramaRealId();
  return programaApiClient.fetch<CohortePagos[]>(
    `/api/application/case/director-programa/programa/${idPrograma}/cohortes`
  );
}
