import { formatFecha } from '../../../utils/fechas';
import { camposInvalidos, leerErrorApi } from '../../../services/erroresApi';

export type CampoFechaCohorte =
  | 'fechaInicio'
  | 'fechaLimiteDocumentos'
  | 'fechaLimitePago';

export type FechasCohorte = Partial<Record<CampoFechaCohorte, string>>;
export type ErroresFechasCohorte = Partial<Record<CampoFechaCohorte, string>>;

export const CAMPOS_FECHA_COHORTE: CampoFechaCohorte[] = [
  'fechaInicio', 'fechaLimiteDocumentos', 'fechaLimitePago',
];

const ISO_FECHA = /^\d{4}-\d{2}-\d{2}/;

/** Suma meses a una fecha "YYYY-MM-DD"; si el día no existe se usa el último del mes (31 ene + 1 → 28 feb). */
function sumarMeses(iso: string, meses: number): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  const destino = new Date(Date.UTC(year, month - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(day, ultimoDia));
  return destino.toISOString().slice(0, 10);
}

/**
 * Ventana permitida para `fechaInicio`: entre el inicio del
 * semestre y dos meses después (regla de negocio del backend).
 */
export function ventanaInicioCohorte(fechaInicioSemestre?: string): { min: string; max: string } | undefined {
  if (!fechaInicioSemestre || !ISO_FECHA.test(fechaInicioSemestre)) return undefined;
  const min = fechaInicioSemestre.slice(0, 10);
  return { min, max: sumarMeses(min, 2) };
}

/**
 * Valida las fechas de una cohorte. Con `requeridas` las tres fechas son
 * obligatorias (crear); sin ella solo se validan las que tengan valor (editar).
 */
export function validarFechasCohorte(
  fechas: FechasCohorte,
  { requeridas = false, fechaInicioSemestre, validarSemestre = true }: { requeridas?: boolean; fechaInicioSemestre?: string; validarSemestre?: boolean } = {},
): ErroresFechasCohorte {
  const errores: ErroresFechasCohorte = {};

  if (requeridas) {
    for (const campo of CAMPOS_FECHA_COHORTE) {
      if (!fechas[campo]) errores[campo] = 'Selecciona la fecha.';
    }
  }

  for (const campo of ['fechaLimiteDocumentos', 'fechaLimitePago'] as const) {
    if (fechas.fechaInicio && fechas[campo] && fechas[campo] < fechas.fechaInicio) {
      errores[campo] = 'La fecha límite no puede ser anterior al inicio de la cohorte.';
    }
  }

  const ventana = ventanaInicioCohorte(fechaInicioSemestre);
  const inicioDocs = fechas.fechaInicio;
  if (validarSemestre && ventana && inicioDocs && (inicioDocs < ventana.min || inicioDocs > ventana.max)) {
    errores.fechaInicio =
      `Debe estar entre el inicio del semestre (${formatFecha(ventana.min)}) y dos meses después (${formatFecha(ventana.max)}).`;
  }

  return errores;
}

/** Errores por campo a partir de la respuesta del backend (se usan las claves, no los textos). */
export function erroresFechasDesdeApi(error: unknown): ErroresFechasCohorte {
  const errores: ErroresFechasCohorte = {};
  for (const campo of camposInvalidos(error)) {
    if ((CAMPOS_FECHA_COHORTE as string[]).includes(campo)) {
      errores[campo as CampoFechaCohorte] = 'Fecha obligatoria o inválida.';
    }
  }
  if (leerErrorApi(error).code === 'COHORTE_SEMESTRE_FECHA_INVALIDA_CONFLICT') {
    errores.fechaInicio = 'Debe estar entre el inicio del semestre y dos meses después.';
  }
  return errores;
}
