import { programaApiClient } from "./programaService";

export interface EntrevistaBackend {
  id: number;
  fecha: string;
  tiempo: string;
  idEstado: number;
  estado: string;
  idTipoentrevista: number;
  tipoentrevista: string;
  ubicacion: string;
  motivocambio: string | null;
}

export interface AgendarPayload {
  fecha: string;
  tiempo: string;
  idTipoentrevista: number;
  ubicacion: string;
}

export interface ReagendarPayload {
  fecha: string;
  tiempo: string;
  idTipoentrevista: number;
  ubicacion: string;
}

export interface CriterioBackend {
  id: number;
  nombreCriterio: string;
  peso: number;
  puntajeObtenido: number;
}

export interface CriteriosResponse {
  criterios: CriterioBackend[];
  puntajeTotal: number;
}

export interface CalificarCriterioPayload {
  idAspirante: number;
  idCriterio: number;
  puntajeObtenido: number | null;
}

export interface DatosAspiranteResponse {
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  documento: string;
  tipodocumento: string;
  egresadoufps: boolean;
  empresa: string;
  experiencialaboral: string;
  promediopregrado: number;
  titulopregrado: string;
  titulosposgrados: string;
  ubicaciontrabajo: string;
}

// GET /api/application/case/director-programa/aspirantes/{idAspirante}/datos
export async function getDatosAspirante(idAspirante: number): Promise<DatosAspiranteResponse> {
  return programaApiClient.fetch<DatosAspiranteResponse>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/datos`
  );
}

// GET /api/application/case/director-programa/aspirantes/{idAspirante}/entrevistas
export async function getEntrevistasByAspirante(idAspirante: number): Promise<EntrevistaBackend[]> {
  return programaApiClient.fetch<EntrevistaBackend[]>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/entrevistas`
  );
}

// POST /api/application/case/director-programa/aspirantes/{idAspirante}/entrevistas/agendar
export async function agendarEntrevista(idAspirante: number, data: AgendarPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/entrevistas/agendar`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

// PATCH /api/application/case/director-programa/entrevistas/{idEntrevista}/reagendar
export async function reagendarEntrevista(idEntrevista: number, data: ReagendarPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/entrevistas/${idEntrevista}/reagendar`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

// PATCH /api/application/case/director-programa/entrevistas/{idEntrevista}/editar
export async function editarEntrevista(idEntrevista: number, data: ReagendarPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/entrevistas/${idEntrevista}/editar`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

// PATCH /api/application/case/director-programa/entrevistas/{idEntrevista}/completar
export async function completarEntrevista(idEntrevista: number): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/entrevistas/${idEntrevista}/completar`,
    { method: "PATCH" }
  );
}

// PATCH /api/application/case/director-programa/entrevistas/{idEntrevista}/cancelar
export async function cancelarEntrevista(idEntrevista: number, motivocambio: string): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/entrevistas/${idEntrevista}/cancelar`,
    { method: "PATCH", body: JSON.stringify({ motivocambio }) }
  );
}

// GET /api/application/case/director-programa/aspirantes/{idAspirante}/criterios
export async function getCriteriosByAspirante(idAspirante: number): Promise<CriteriosResponse> {
  return programaApiClient.fetch<CriteriosResponse>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/criterios`
  );
}

// PATCH /api/application/case/director-programa/aspirantes/{idAspirante}/criterios/{idCriterio}/calificar
export async function updateCriterio(data: CalificarCriterioPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/aspirantes/${data.idAspirante}/criterios/${data.idCriterio}/calificar`,
    { method: "PATCH", body: JSON.stringify({ puntajeObtenido: data.puntajeObtenido }) }
  );
}

export interface PruebaBackend {
  id: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  tiempo: string;
  idEstado: number;
  estado: string;
  idTipoprueba: number;
  tipoprueba: string;
  ubicacion: string;
  motivocambio: string | null;
}

export interface CrearPruebaPayload {
  nombre: string;
  descripcion: string;
  fecha: string;
  tiempo: string;
  idTipoprueba: number;
  ubicacion: string;
}

export interface ReagendarPruebaPayload {
  fecha: string;
  tiempo: string;
  idTipoprueba: number;
  ubicacion: string;
}

export interface EditarPruebaPayload {
  nombre: string;
  descripcion: string;
  fecha: string;
  tiempo: string;
  idTipoprueba: number;
  ubicacion: string;
}

// GET /api/application/case/director-programa/aspirantes/{idAspirante}/pruebas
export async function getPruebasByAspirante(idAspirante: number): Promise<PruebaBackend[]> {
  return programaApiClient.fetch<PruebaBackend[]>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/pruebas`
  );
}

// POST /api/application/case/director-programa/aspirantes/{idAspirante}/pruebas/crear
export async function crearPrueba(idAspirante: number, data: CrearPruebaPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/aspirantes/${idAspirante}/pruebas/crear`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

// PATCH /api/application/case/director-programa/pruebas/{idPrueba}/reagendar
export async function reagendarPrueba(idPrueba: number, data: ReagendarPruebaPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/pruebas/${idPrueba}/reagendar`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

// PATCH /api/application/case/director-programa/pruebas/{idPrueba}/editar
export async function editarPrueba(idPrueba: number, data: EditarPruebaPayload): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/pruebas/${idPrueba}/editar`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

// PATCH /api/application/case/director-programa/pruebas/{idPrueba}/completar
export async function completarPrueba(idPrueba: number): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/pruebas/${idPrueba}/completar`,
    { method: "PATCH" }
  );
}

// PATCH /api/application/case/director-programa/pruebas/{idPrueba}/cancelar
export async function cancelarPrueba(idPrueba: number, motivocambio: string): Promise<void> {
  return programaApiClient.fetch<void>(
    `/api/application/case/director-programa/pruebas/${idPrueba}/cancelar`,
    { method: "PATCH", body: JSON.stringify({ motivocambio }) }
  );
}
