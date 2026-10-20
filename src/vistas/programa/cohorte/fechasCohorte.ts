import { formatFecha } from '../../../utils/fechas';
import { camposInvalidos, leerErrorApi } from '../../../services/erroresApi';

export type CampoFechaCohorte =
  | 'fechaInicioDocumentacion'
  | 'fechaFinDocumentacion'
  | 'fechaInicioInscripcion'
  | 'fechaFinInscripcion'
  | 'fechaInicioPago'
  | 'fechaFinPago';

export type FechasCohorte = Partial<Record<CampoFechaCohorte, string>>;
export type ErroresFechasCohorte = Partial<Record<CampoFechaCohorte, string>>;

export const CAMPOS_FECHA_COHORTE: CampoFechaCohorte[] = [
  'fechaInicioDocumentacion',
  'fechaFinDocumentacion',
  'fechaInicioInscripcion',
  'fechaFinInscripcion',
  'fechaInicioPago',
  'fechaFinPago',
];

/** Cada plazo se valida por separado: su inicio no puede ser posterior a su fin. */
const PLAZOS: { inicio: CampoFechaCohorte; fin: CampoFechaCohorte }[] = [
  { inicio: 'fechaInicioDocumentacion', fin: 'fechaFinDocumentacion' },
  { inicio: 'fechaInicioInscripcion', fin: 'fechaFinInscripcion' },
  { inicio: 'fechaInicioPago', fin: 'fechaFinPago' },
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
 * Ventana permitida para `fechaInicioDocumentacion`: entre el inicio del
 * semestre y dos meses después (regla de negocio del backend).
 */
export function ventanaInicioDocumentacion(fechaInicioSemestre?: string): { min: string; max: string } | undefined {
  if (!fechaInicioSemestre || !ISO_FECHA.test(fechaInicioSemestre)) return undefined;
  const min = fechaInicioSemestre.slice(0, 10);
  return { min, max: sumarMeses(min, 2) };
}

/**
 * Valida las fechas de una cohorte. Con `requeridas` las seis fechas son
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

  for (const { inicio, fin } of PLAZOS) {
    const desde = fechas[inicio];
    const hasta = fechas[fin];
    if (desde && hasta && desde > hasta) errores[fin] = 'La fecha de fin no puede ser anterior a la de inicio.';
  }

  const ventana = ventanaInicioDocumentacion(fechaInicioSemestre);
  const inicioDocs = fechas.fechaInicioDocumentacion;
  if (validarSemestre && ventana && inicioDocs && (inicioDocs < ventana.min || inicioDocs > ventana.max)) {
    errores.fechaInicioDocumentacion =
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
    errores.fechaInicioDocumentacion = 'Debe estar entre el inicio del semestre y dos meses después.';
  }
  return errores;
}
