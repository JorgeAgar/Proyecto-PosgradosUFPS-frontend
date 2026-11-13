import { describe, it, expect } from 'vitest'
import {
  mensajePorCodigo,
  leerCuerpoError,
  camposInvalidos,
  leerErrorApi,
} from '../../../services/erroresApi'
import { extractErrorMessage } from '../../../services/authService'

describe('mensajePorCodigo', () => {
  it('returns undefined for undefined code', () => {
    expect(mensajePorCodigo(undefined)).toBeUndefined()
  })

  it('returns undefined for unknown code', () => {
    expect(mensajePorCodigo('UNKNOWN_CODE_XYZ')).toBeUndefined()
  })

  it('handles VALIDACION_FALLIDA with param fields', () => {
    const result = mensajePorCodigo('VALIDACION_FALLIDA', { nombre: 'x', cupos: 'y' })
    expect(result).toContain('Nombre')
    expect(result).toContain('Cupos')
  })

  it('handles VALIDACION_FALLIDA without param', () => {
    const result = mensajePorCodigo('VALIDACION_FALLIDA')
    expect(result).toContain('inválidos')
  })

  it('handles COHORTE_PLAZO_FECHAS_INVALIDAS', () => {
    const result = mensajePorCodigo('COHORTE_PLAZO_FECHAS_INVALIDAS')
    expect(result).toContain('inicio')
    expect(result).toContain('fin')
  })

  it('handles PROGRAMA_NOT_FOUND', () => {
    expect(mensajePorCodigo('PROGRAMA_NOT_FOUND')).toBe('El programa ya no existe.')
  })

  it('handles USUARIO_YA_EXISTE_CONFLICT with username param', () => {
    const result = mensajePorCodigo('USUARIO_YA_EXISTE_CONFLICT', 'juan123')
    expect(result).toContain('juan123')
    expect(result).toContain('uso')
  })

  it('handles PROGRAMA_CON_ESTUDIANTES_CONFLICT with count', () => {
    const result = mensajePorCodigo('PROGRAMA_CON_ESTUDIANTES_CONFLICT', { estudiantes: 5 })
    expect(result).toContain('5')
    expect(result).toContain('estudiantes')
  })

  it('handles PROGRAMA_CON_ESTUDIANTES_CONFLICT with 1 student (singular)', () => {
    const result = mensajePorCodigo('PROGRAMA_CON_ESTUDIANTES_CONFLICT', { estudiantes: 1 })
    expect(result).toContain('1 estudiante')
  })

  it('handles REGISTRO_EN_USO_CONFLICT', () => {
    expect(mensajePorCodigo('REGISTRO_EN_USO_CONFLICT')).toContain('siendo usado')
  })

  it('handles FACULTAD_NOMBRE_DUPLICADO with param value', () => {
    const result = mensajePorCodigo('FACULTAD_NOMBRE_DUPLICADO', { valor: 'Ingeniería' })
    expect(result).toContain('Ingeniería')
  })
})

describe('leerCuerpoError', () => {
  it('extracts code, message, and param from a valid error body', () => {
    const result = leerCuerpoError({ code: 'TEST_CODE', message: 'Error msg', param: { field: 'val' } })
    expect(result.code).toBe('TEST_CODE')
    expect(result.message).toBe('Error msg')
    expect(result.param).toEqual({ field: 'val' })
  })

  it('returns empty object for null', () => {
    expect(leerCuerpoError(null)).toEqual({})
  })

  it('returns empty object for a string', () => {
    expect(leerCuerpoError('string error')).toEqual({})
  })

  it('returns empty object for undefined', () => {
    expect(leerCuerpoError(undefined)).toEqual({})
  })

  it('ignores non-string code', () => {
    const result = leerCuerpoError({ code: 123, message: 'msg' })
    expect(result.code).toBeUndefined()
    expect(result.message).toBe('msg')
  })

  it('ignores empty string message', () => {
    const result = leerCuerpoError({ code: 'CODE', message: '' })
    expect(result.message).toBeUndefined()
  })
})

describe('camposInvalidos', () => {
  it('returns field names when VALIDACION_FALLIDA with param', () => {
    const error = new Error('validation') as Error & { body: unknown; status: number; code: string; param: unknown }
    error.body = { code: 'VALIDACION_FALLIDA', param: { nombre: 'required', cupos: 'invalid' } }
    error.status = 400
    error.code = 'VALIDACION_FALLIDA'
    error.param = { nombre: 'required', cupos: 'invalid' }
    const fields = camposInvalidos(error)
    expect(fields).toContain('nombre')
    expect(fields).toContain('cupos')
  })

  it('returns empty array for non-VALIDACION_FALLIDA error', () => {
    const error = new Error('other error') as Error & { body: unknown; status: number; code: string }
    error.body = { code: 'PROGRAMA_NOT_FOUND' }
    error.status = 404
    error.code = 'PROGRAMA_NOT_FOUND'
    expect(camposInvalidos(error)).toEqual([])
  })

  it('returns empty array for non-Error value', () => {
    expect(camposInvalidos('not an error')).toEqual([])
    expect(camposInvalidos(null)).toEqual([])
  })
})

describe('leerErrorApi', () => {
  it('extracts status, code, and param from an http error', () => {
    const error = {
      status: 400,
      body: { code: 'VALIDACION_FALLIDA', param: { nombre: 'x' } },
    }
    const result = leerErrorApi(error)
    expect(result.status).toBe(400)
    expect(result.code).toBe('VALIDACION_FALLIDA')
    expect(result.param).toEqual({ nombre: 'x' })
  })

  it('returns empty object for non-object error', () => {
    expect(leerErrorApi('string')).toEqual({})
    expect(leerErrorApi(null)).toEqual({})
  })
})

describe('extractErrorMessage', () => {
  it('uses code message over HTTP status description', () => {
    const result = extractErrorMessage({ code: 'PROGRAMA_NOT_FOUND' }, 404, 'Not Found')
    expect(result).toBe('El programa ya no existe.')
  })

  it('uses body.message when no code matches', () => {
    const result = extractErrorMessage({ message: 'Custom server error' }, 500, 'Server Error')
    expect(result).toBe('Custom server error')
  })

  it('uses string body directly', () => {
    expect(extractErrorMessage('Something went wrong', 400, 'Bad Request')).toBe('Something went wrong')
  })

  it('falls back to HTTP status description', () => {
    const result = extractErrorMessage({}, 500, '')
    expect(result).toContain('500')
    expect(result).toContain('Error interno del servidor')
  })

  it('ignores HTML string body', () => {
    const result = extractErrorMessage('<html>Error</html>', 503, 'Service Unavailable')
    expect(result).toContain('503')
  })

  it('handles empty body object', () => {
    const result = extractErrorMessage({}, 404, 'Not Found')
    expect(result).toContain('404')
  })
})
