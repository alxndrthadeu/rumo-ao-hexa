import { describe, it, expect } from 'vitest'
import { applyMediaBias } from '../media'

describe('applyMediaBias', () => {
  it('Estrela ELOGIO +10 → +10', () => {
    expect(applyMediaBias(10, 'ELOGIO', 'estrela')).toBe(10)
  })

  it('Craque Caído ELOGIO +10 → +5', () => {
    expect(applyMediaBias(10, 'ELOGIO', 'caido')).toBe(5)
  })

  it('Futuro ELOGIO +10 → +20', () => {
    expect(applyMediaBias(10, 'ELOGIO', 'futuro')).toBe(20)
  })

  it('Estrela CRITICA -10 → -10', () => {
    expect(applyMediaBias(-10, 'CRITICA', 'estrela')).toBe(-10)
  })

  it('Craque Caído CRITICA -10 → -20', () => {
    expect(applyMediaBias(-10, 'CRITICA', 'caido')).toBe(-20)
  })

  it('Futuro CRITICA -10 → -5', () => {
    expect(applyMediaBias(-10, 'CRITICA', 'futuro')).toBe(-5)
  })

  it('NEUTRA não aplica multiplicador', () => {
    expect(applyMediaBias(10, 'NEUTRA', 'caido')).toBe(10)
    expect(applyMediaBias(-10, 'NEUTRA', 'futuro')).toBe(-10)
  })
})
