import { describe, it, expect } from 'vitest'
import { mensajeErrorCohorte } from '../../../vistas/programa/cohorte/mensajeErrorCohorte'

function makeHttpError(opts: { body?: unknown; status?: number; message?: string }) {
  const err = new Error(opts.message ?? 'error') as Error & {
    body: unknown
    status: number
  }
  err.body = opts.body
  err.status = opts.status ?? 500
  return err
}

describe('mensajeErrorCohorte', () => {
  it('returns mapped message for known backend code', () => {
    const error = makeHttpError({
      body: { code: 'PROGRAMA_NOT_FOUND' },
      status: 404,
    })
    const msg = mensajeErrorCohorte(error, 'Error por defecto')
    expect(msg).toBe('El programa ya no existe.')
  })

  it('returns mensajesPorEstado message when status matches', () => {
    const error = makeHttpError({ body: { code: 'SOME_CODE' }, status: 409 })
    const msg = mensajeErrorCohorte(error, 'Default', { 409: 'Conflicto detectado' })
    expect(msg).toBe('Conflicto detectado')
  })

  it('prefers mensajesPorEstado over backend code', () => {
    const error = makeHttpError({ body: { code: 'PROGRAMA_NOT_FOUND' }, status: 404 })
    const msg = mensajeErrorCohorte(error, 'Default', { 404: 'Recurso no disponible' })
    expect(msg).toBe('Recurso no disponible')
  })

  it('falls back to body.message when no code matches', () => {
    const error = makeHttpError({
      body: { message: 'Custom backend message' },
      status: 500,
    })
    const msg = mensajeErrorCohorte(error, 'Default')
    expect(msg).toBe('Custom backend message')
  })

  it('falls back to Error.message when body has nothing useful', () => {
    const error = makeHttpError({ body: {}, status: 500, message: 'Plain error message' })
    const msg = mensajeErrorCohorte(error, 'Default')
    expect(msg).toBe('Plain error message')
  })

  it('returns porDefecto when Error.message is empty', () => {
    const error = makeHttpError({ body: {}, status: 500, message: '' })
    const msg = mensajeErrorCohorte(error, 'Error por defecto')
    expect(msg).toBe('Error por defecto')
  })

  it('handles string error directly', () => {
    const msg = mensajeErrorCohorte('String error message', 'Default')
    expect(msg).toBe('String error message')
  })

  it('returns porDefecto for empty string error', () => {
    const msg = mensajeErrorCohorte('   ', 'Default message')
    expect(msg).toBe('Default message')
  })

  it('handles object error with message field', () => {
    const msg = mensajeErrorCohorte({ message: 'Object error' }, 'Default')
    expect(msg).toBe('Object error')
  })

  it('returns porDefecto for null/undefined', () => {
    expect(mensajeErrorCohorte(null, 'Default')).toBe('Default')
    expect(mensajeErrorCohorte(undefined, 'Default')).toBe('Default')
  })

  it('handles COHORTE_PLAZO_FECHAS_INVALIDAS', () => {
    const error = makeHttpError({
      body: { code: 'COHORTE_PLAZO_FECHAS_INVALIDAS' },
      status: 422,
    })
    const msg = mensajeErrorCohorte(error, 'Default')
    expect(msg).toContain('inicio')
  })

  it('handles VALIDACION_FALLIDA with param fields', () => {
    const error = makeHttpError({
      body: { code: 'VALIDACION_FALLIDA', param: { nombre: 'required' } },
      status: 400,
    })
    const msg = mensajeErrorCohorte(error, 'Default')
    expect(msg).toContain('Nombre')
  })
})
