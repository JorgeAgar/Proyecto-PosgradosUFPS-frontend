/**
 * erroresApi.ts
 *
 * Contrato de errores del backend: `{ code, message, param }`. Se lee el
 * `code` (no solo el estado HTTP) para mostrar un texto claro al usuario.
 */

export interface ErrorApi {
  status?: number;
  code?: string;
  message?: string;
  param?: unknown;
}

/** Error lanzado por los clientes HTTP con el cuerpo de la respuesta adjunto. */
export type ErrorHttp = Error & { body?: unknown; status?: number; statusText?: string; code?: string; param?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function paramDe(param: unknown, clave: string): unknown {
  return isRecord(param) ? param[clave] : undefined;
}

function plural(cantidad: number, singular: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}

/** Etiquetas legibles para las claves de `param` en `VALIDACION_FALLIDA`. */
const ETIQUETAS_CAMPOS: Record<string, string> = {
  id: "Identificador",
  nombre: "Nombre",
  cupos: "Cupos",
  idSemestre: "Semestre",
  idModalidad: "Modalidad",
  fechaInicioDocumentacion: "Inicio de documentación",
  fechaFinDocumentacion: "Fin de documentación",
  fechaInicioInscripcion: "Inicio de inscripción",
  fechaFinInscripcion: "Fin de inscripción",
  fechaInicioPago: "Inicio de pago",
  fechaFinPago: "Fin de pago",
};

const MENSAJES_POR_CODIGO: Record<string, (param: unknown) => string> = {
  // Validación genérica
  VALIDACION_FALLIDA: (param) => {
    const campos = isRecord(param) ? Object.keys(param).map((clave) => ETIQUETAS_CAMPOS[clave] ?? clave) : [];
    return campos.length > 0
      ? `Hay campos inválidos o incompletos: ${campos.join(", ")}.`
      : "Hay campos inválidos en la solicitud.";
  },
  CUERPO_INVALIDO: () => "La solicitud tiene un formato inválido. Revisa que las fechas y los datos sean correctos.",

  // Cohortes
  COHORTE_PLAZO_FECHAS_INVALIDAS: () => "La fecha de inicio de un plazo no puede ser posterior a su fecha de fin.",
  COHORTE_SEMESTRE_FECHA_INVALIDA_CONFLICT: () =>
    "El inicio de documentación debe estar entre el inicio del semestre y dos meses después.",

  // Programas
  PROGRAMA_PARAMETRO_REQUERIDO: () => "No se indicó el programa.",
  PROGRAMA_NOT_FOUND: () => "El programa ya no existe.",
  PROGRAMA_CON_ESTUDIANTES_CONFLICT: (param) => {
    const estudiantes = Number(paramDe(param, "estudiantes") ?? 0);
    return estudiantes > 0
      ? `Este programa tiene ${plural(estudiantes, "estudiante", "estudiantes")}.`
      : "Este programa tiene estudiantes.";
  },
  PROGRAMA_CON_COHORTES_CONFLICT: (param) => {
    const cohortes = Number(paramDe(param, "cohortes") ?? 0);
    return cohortes > 0
      ? `Este programa tiene ${plural(cohortes, "cohorte creada", "cohortes creadas")}.`
      : "Este programa tiene cohortes creadas.";
  },
  PROGRAMA_CON_DIRECTOR_CONFLICT: (param) => {
    const administrativos = Number(paramDe(param, "administrativos") ?? 0);
    const detalle = administrativos > 0 ? ` (${plural(administrativos, "administrativo", "administrativos")}, incluidos los finalizados)` : "";
    return `Hay un director asignado a este programa${detalle}.`;
  },
  PROGRAMA_REFERENCIADO_CONFLICT: () => "El programa está referenciado por otros registros y no se puede eliminar.",
  PROGRAMA_CODIGO_DUPLICADO: (param) => {
    const valor = paramDe(param, "valor");
    return valor !== undefined && valor !== null ? `Ya existe un programa con el código ${valor}.` : "Ya existe un programa con ese código.";
  },

  // Facultades
  FACULTAD_NOMBRE_DUPLICADO: (param) => {
    const valor = paramDe(param, "valor");
    return typeof valor === "string" && valor ? `Ya existe una facultad llamada "${valor}".` : "Ya existe una facultad con ese nombre.";
  },
  FACULTAD_NOT_FOUND: () => "La facultad ya no existe.",
  FACULTAD_PARAMETRO_REQUERIDO: () => "No se indicó la facultad.",

  // Aspirantes
  PERSONA_INSCRIPCION_YA_EXISTE_CONFLICT: (param) =>
    typeof param === "string" || typeof param === "number"
      ? `Ya existe una inscripción con el documento ${param}.`
      : "Ya existe una inscripción con ese documento.",
  USUARIO_YA_EXISTE_CONFLICT: (param) =>
    typeof param === "string" && param ? `El usuario "${param}" ya está en uso.` : "Ese usuario ya está en uso.",

  // Integridad (globales)
  REGISTRO_EN_USO_CONFLICT: () => "El registro está siendo usado por otros datos y no se puede eliminar.",
  REGISTRO_DUPLICADO_CONFLICT: () => "Ya existe un registro con esos datos.",
  REFERENCIA_INEXISTENTE: () => "Uno de los datos seleccionados ya no existe.",
  INTEGRIDAD_DATOS_CONFLICT: () => "Los datos no cumplen las reglas de integridad del sistema.",
};

/** Texto para un `code` conocido del backend, o `undefined` si no se reconoce. */
export function mensajePorCodigo(code: string | undefined, param?: unknown): string | undefined {
  if (!code) return undefined;
  return MENSAJES_POR_CODIGO[code]?.(param);
}

/** Lee `{ code, message, param }` de un cuerpo de error del backend. */
export function leerCuerpoError(body: unknown): Omit<ErrorApi, "status"> {
  if (!isRecord(body)) return {};
  return {
    code: typeof body.code === "string" ? body.code : undefined,
    message: typeof body.message === "string" && body.message ? body.message : undefined,
    param: body.param,
  };
}

/** Lee el error de una petición fallida (lanzado por `apiService` o `registroService`). */
export function leerErrorApi(error: unknown): ErrorApi {
  if (!isRecord(error)) return {};
  const http = error as Partial<ErrorHttp>;
  return { status: typeof http.status === "number" ? http.status : undefined, ...leerCuerpoError(http.body) };
}

/** Claves de `param` en `VALIDACION_FALLIDA`, para marcar los campos con error. */
export function camposInvalidos(error: unknown): string[] {
  const { code, param } = leerErrorApi(error);
  return code === "VALIDACION_FALLIDA" && isRecord(param) ? Object.keys(param) : [];
}
