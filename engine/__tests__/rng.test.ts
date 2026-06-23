import { describe, it, expect } from 'vitest'
import { createRng, rollRisk } from '../rng'

describe('createRng', () => {
  it('mesma seed produz mesma sequência (3 chamadas)', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
    expect(rng1()).toBe(rng2())
  })

  it('seeds diferentes produzem sequências diferentes', () => {
    const rng1 = createRng(1)
    const rng2 = createRng(2)
    expect(rng1()).not.toBe(rng2())
  })
})

describe('rollRisk', () => {
  it('chance 1.0 sempre retorna true', () => {
    const rng = createRng(999)
    for (let i = 0; i < 20; i++) {
      expect(rollRisk(rng, 1.0)).toBe(true)
    }
  })

  it('chance 0.0 sempre retorna false', () => {
    const rng = createRng(999)
    for (let i = 0; i < 20; i++) {
      expect(rollRisk(rng, 0.0)).toBe(false)
    }
  })
})
