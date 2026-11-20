import { describe, it, expect } from 'vitest'
import { formatFecha, formatHora } from '../../../utils/fechas'

describe('formatFecha', () => {
  it('formats a mid-year date correctly', () => {
    expect(formatFecha('2026-03-05')).toBe('5 de marzo de 2026')
  })

  it('formats January 1st', () => {
    expect(formatFecha('2026-01-01')).toBe('1 de enero de 2026')
  })

  it('formats December 31st', () => {
    expect(formatFecha('2026-12-31')).toBe('31 de diciembre de 2026')
  })

  it('formats February without zero-padding the day', () => {
    expect(formatFecha('2026-02-28')).toBe('28 de febrero de 2026')
  })

  it('formats each month correctly', () => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ]
    meses.forEach((mes, i) => {
      const month = String(i + 1).padStart(2, '0')
      expect(formatFecha(`2026-${month}-15`)).toBe(`15 de ${mes} de 2026`)
    })
  })

  it('returns empty string for empty input', () => {
    expect(formatFecha('')).toBe('')
  })

  it('strips leading zero from day number', () => {
    expect(formatFecha('2026-06-07')).toBe('7 de junio de 2026')
  })
})

describe('formatHora', () => {
  it('converts 14:30 to 2:30 PM', () => {
    expect(formatHora('14:30')).toBe('2:30 PM')
  })

  it('converts 09:00 to 9:00 AM', () => {
    expect(formatHora('09:00')).toBe('9:00 AM')
  })

  it('converts midnight 00:00 to 12:00 AM', () => {
    expect(formatHora('00:00')).toBe('12:00 AM')
  })

  it('converts noon 12:00 to 12:00 PM', () => {
    expect(formatHora('12:00')).toBe('12:00 PM')
  })

  it('converts 23:59 to 11:59 PM', () => {
    expect(formatHora('23:59')).toBe('11:59 PM')
  })

  it('pads single-digit minutes with leading zero', () => {
    expect(formatHora('10:05')).toBe('10:05 AM')
  })

  it('returns empty string for empty input', () => {
    expect(formatHora('')).toBe('')
  })

  it('converts 13:01 to 1:01 PM', () => {
    expect(formatHora('13:01')).toBe('1:01 PM')
  })
})
