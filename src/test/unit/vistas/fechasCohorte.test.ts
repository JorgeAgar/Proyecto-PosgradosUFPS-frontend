import { describe, it, expect } from 'vitest'
import {
  validarFechasCohorte,
  ventanaInicioDocumentacion,
  erroresFechasDesdeApi,
  type FechasCohorte,
} from '../../../vistas/programa/cohorte/fechasCohorte'

const FECHAS_VALIDAS: FechasCohorte = {
  fechaInicioDocumentacion: '2026-02-01',
  fechaFinDocumentacion: '2026-03-01',
  fechaInicioInscripcion: '2026-03-02',
  fechaFinInscripcion: '2026-04-01',
  fechaInicioPago: '2026-04-02',
  fechaFinPago: '2026-04-30',
}

describe('validarFechasCohorte – campo requerido', () => {
  it('returns 6 errors when all fields are missing and requeridas=true', () => {
    const errors = validarFechasCohorte({}, { requeridas: true })
    expect(Object.keys(errors)).toHaveLength(6)
  })

  it('returns no errors for all valid dates with requeridas=true (no semestre check)', () => {
    const errors = validarFechasCohorte(FECHAS_VALIDAS, { requeridas: true, validarSemestre: false })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('reports each missing field individually', () => {
    const errors = validarFechasCohorte({}, { requeridas: true })
    expect(errors.fechaInicioDocumentacion).toBe('Selecciona la fecha.')
    expect(errors.fechaFinDocumentacion).toBe('Selecciona la fecha.')
    expect(errors.fechaInicioInscripcion).toBe('Selecciona la fecha.')
    expect(errors.fechaFinInscripcion).toBe('Selecciona la fecha.')
    expect(errors.fechaInicioPago).toBe('Selecciona la fecha.')
    expect(errors.fechaFinPago).toBe('Selecciona la fecha.')
  })
})

describe('validarFechasCohorte – plazo inválido', () => {
  it('errors when fin de documentación is before inicio', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioDocumentacion: '2026-03-01',
      fechaFinDocumentacion: '2026-02-01',
    }
    const errors = validarFechasCohorte(fechas, { validarSemestre: false })
    expect(errors.fechaFinDocumentacion).toBeTruthy()
  })

  it('errors when fin de inscripción is before inicio', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioInscripcion: '2026-04-01',
      fechaFinInscripcion: '2026-03-01',
    }
    const errors = validarFechasCohorte(fechas, { validarSemestre: false })
    expect(errors.fechaFinInscripcion).toBeTruthy()
  })

  it('errors when fin de pago is before inicio', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioPago: '2026-05-01',
      fechaFinPago: '2026-04-01',
    }
    const errors = validarFechasCohorte(fechas, { validarSemestre: false })
    expect(errors.fechaFinPago).toBeTruthy()
  })

  it('allows same start and end date in a plazo', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioDocumentacion: '2026-02-01',
      fechaFinDocumentacion: '2026-02-01',
    }
    const errors = validarFechasCohorte(fechas, { validarSemestre: false })
    expect(errors.fechaFinDocumentacion).toBeUndefined()
  })
})

describe('validarFechasCohorte – validación de semestre', () => {
  it('errors when fechaInicioDocumentacion is before semester start', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioDocumentacion: '2025-12-01',
    }
    const errors = validarFechasCohorte(fechas, {
      fechaInicioSemestre: '2026-01-01',
      validarSemestre: true,
    })
    expect(errors.fechaInicioDocumentacion).toBeTruthy()
  })

  it('errors when fechaInicioDocumentacion is more than 2 months after semester start', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioDocumentacion: '2026-04-01',
    }
    const errors = validarFechasCohorte(fechas, {
      fechaInicioSemestre: '2026-01-01',
      validarSemestre: true,
    })
    expect(errors.fechaInicioDocumentacion).toBeTruthy()
  })

  it('no error when fechaInicioDocumentacion is within allowed window', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioDocumentacion: '2026-01-15',
    }
    const errors = validarFechasCohorte(fechas, {
      fechaInicioSemestre: '2026-01-01',
      validarSemestre: true,
    })
    expect(errors.fechaInicioDocumentacion).toBeUndefined()
  })

  it('skips semester check when validarSemestre=false', () => {
    const fechas: FechasCohorte = {
      ...FECHAS_VALIDAS,
      fechaInicioDocumentacion: '2025-01-01',
    }
    const errors = validarFechasCohorte(fechas, {
      fechaInicioSemestre: '2026-01-01',
      validarSemestre: false,
    })
    expect(errors.fechaInicioDocumentacion).toBeUndefined()
  })
})

describe('ventanaInicioDocumentacion', () => {
  it('returns min=semestreStart and max=semestreStart+2months', () => {
    const result = ventanaInicioDocumentacion('2026-01-01')
    expect(result).toEqual({ min: '2026-01-01', max: '2026-03-01' })
  })

  it('handles month overflow correctly (Jan + 2 = Mar)', () => {
    const result = ventanaInicioDocumentacion('2026-01-31')
    // Jan 31 + 2 months → March 31
    expect(result?.max).toBe('2026-03-31')
  })

  it('returns undefined for empty input', () => {
    expect(ventanaInicioDocumentacion('')).toBeUndefined()
  })

  it('returns undefined for invalid date format', () => {
    expect(ventanaInicioDocumentacion('not-a-date')).toBeUndefined()
  })
})

describe('erroresFechasDesdeApi', () => {
  it('maps VALIDACION_FALLIDA param fields to fechas errors', () => {
    const error = {
      body: {
        code: 'VALIDACION_FALLIDA',
        param: { fechaInicioDocumentacion: 'required', fechaFinPago: 'invalid' },
      },
      status: 400,
    }
    const errors = erroresFechasDesdeApi(error)
    expect(errors.fechaInicioDocumentacion).toBeTruthy()
    expect(errors.fechaFinPago).toBeTruthy()
  })

  it('maps COHORTE_SEMESTRE_FECHA_INVALIDA_CONFLICT', () => {
    const error = {
      body: { code: 'COHORTE_SEMESTRE_FECHA_INVALIDA_CONFLICT' },
      status: 409,
    }
    const errors = erroresFechasDesdeApi(error)
    expect(errors.fechaInicioDocumentacion).toBeTruthy()
  })

  it('returns empty errors for unrelated API error', () => {
    const error = {
      body: { code: 'PROGRAMA_NOT_FOUND' },
      status: 404,
    }
    const errors = erroresFechasDesdeApi(error)
    expect(Object.keys(errors)).toHaveLength(0)
  })
})
