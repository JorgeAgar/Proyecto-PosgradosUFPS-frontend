import { describe, it, expect } from 'vitest'
import { soloDigitos, soloDecimal } from '../../../utils/numeros'

describe('soloDigitos', () => {
  it('removes all non-digit characters', () => {
    expect(soloDigitos('abc123def')).toBe('123')
  })

  it('removes decimal point', () => {
    expect(soloDigitos('12.34')).toBe('1234')
  })

  it('removes spaces', () => {
    expect(soloDigitos('1 234 567')).toBe('1234567')
  })

  it('returns empty string for non-digit input', () => {
    expect(soloDigitos('abc')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(soloDigitos('')).toBe('')
  })

  it('preserves leading zeros', () => {
    expect(soloDigitos('007')).toBe('007')
  })

  it('handles already-clean number', () => {
    expect(soloDigitos('1234567890')).toBe('1234567890')
  })
})

describe('soloDecimal', () => {
  it('passes through a valid decimal string', () => {
    expect(soloDecimal('12.34')).toBe('12.34')
  })

  it('converts comma to period as decimal separator', () => {
    expect(soloDecimal('12,34')).toBe('12.34')
  })

  it('removes the second decimal point but keeps following digits', () => {
    // Real behavior: only the extra dot is stripped; digits always pass through.
    // '12.34.56' → '12.3456' (second dot removed, '56' are digits so they stay)
    expect(soloDecimal('12.34.56')).toBe('12.3456')
  })

  it('removes non-numeric characters', () => {
    expect(soloDecimal('abc')).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(soloDecimal('  3.14  ')).toBe('3.14')
  })

  it('returns empty string for empty input', () => {
    expect(soloDecimal('')).toBe('')
  })

  it('handles integer input without decimal', () => {
    expect(soloDecimal('42')).toBe('42')
  })

  it('handles leading decimal point', () => {
    expect(soloDecimal('.5')).toBe('.5')
  })
})
