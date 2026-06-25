import { describe, it, expect } from 'vitest'
import { applyBarDelta, applyNiggleModifier, checkBarDeath } from '../bars'
import { createRunState } from '../state'

function stateWith(barras: { torcida: number; midia: number; moral: number; fisico: number }) {
  const s = createRunState('estrela', 1, 'Teste', 10)
  return { ...s, barras }
}

const mid = { torcida: 50, midia: 50, moral: 50, fisico: 50 }

describe('checkBarDeath', () => {
  it('barra Torcida no 0 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, torcida: 0 }))).toMatchObject({ dead: true, barra: 'torcida', extreme: 'min' })
  })

  it('barra Torcida no 100 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, torcida: 100 }))).toMatchObject({ dead: true, barra: 'torcida', extreme: 'max' })
  })

  it('barra Moral no 0 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, moral: 0 }))).toMatchObject({ dead: true, barra: 'moral', extreme: 'min' })
  })

  it('barra Moral no 100 → dead: false (assimetria intencional — overconfidence não mata)', () => {
    expect(checkBarDeath(stateWith({ ...mid, moral: 100 }))).toMatchObject({ dead: false })
  })

  it('barra Física no 0 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, fisico: 0 }))).toMatchObject({ dead: true, barra: 'fisico', extreme: 'min' })
  })

  it('barra Física no 100 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, fisico: 100 }))).toMatchObject({ dead: true, barra: 'fisico', extreme: 'max' })
  })

  it('barra Mídia no 0 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, midia: 0 }))).toMatchObject({ dead: true, barra: 'midia', extreme: 'min' })
  })

  it('barra Mídia no 100 → dead: true', () => {
    expect(checkBarDeath(stateWith({ ...mid, midia: 100 }))).toMatchObject({ dead: true, barra: 'midia', extreme: 'max' })
  })

  it('barra em 50 → dead: false', () => {
    expect(checkBarDeath(stateWith(mid))).toMatchObject({ dead: false })
  })
})

describe('applyBarDelta', () => {
  it('delta negativo não passa de 0 (clamp)', () => {
    const state = stateWith({ ...mid, torcida: 5 })
    const next = applyBarDelta(state, { torcida: -20 })
    expect(next.barras.torcida).toBe(0)
  })

  it('delta positivo não passa de 100 (clamp)', () => {
    // soft cap impede alcançar 100 de 95 via carta; testa o hard clamp partindo de 100
    const state = stateWith({ ...mid, fisico: 100 })
    const next = applyBarDelta(state, { fisico: 20 })
    expect(next.barras.fisico).toBe(100)
  })

  it('aplica delta normalmente dentro dos limites (deltaMax 7 + soft cap)', () => {
    const state = stateWith(mid)
    const next = applyBarDelta(state, { moral: 10, midia: -5 })
    // moral 50 + min(10,7) = 57 | midia 50 - 5 = 45
    expect(next.barras.moral).toBe(57)
    expect(next.barras.midia).toBe(45)
  })

  it('não muta o estado original', () => {
    const state = stateWith(mid)
    applyBarDelta(state, { torcida: 10 })
    expect(state.barras.torcida).toBe(50)
  })
})

describe('applyNiggleModifier', () => {
  it('sem niggle: efeitos não mudam', () => {
    const efeitos = { fisico: -10, moral: 5 }
    expect(applyNiggleModifier([], efeitos)).toEqual(efeitos)
  })

  it('com divida_lesao: custo negativo de Físico aumenta 1.5×', () => {
    const result = applyNiggleModifier(['divida_lesao'], { fisico: -10 })
    expect(result.fisico).toBe(-15)
  })

  it('com divida_lesao: Físico positivo não é afetado', () => {
    const result = applyNiggleModifier(['divida_lesao'], { fisico: 10 })
    expect(result.fisico).toBe(10)
  })

  it('com divida_lesao: outras barras não são afetadas', () => {
    const result = applyNiggleModifier(['divida_lesao'], { fisico: -8, moral: -5 })
    expect(result.fisico).toBe(-12)
    expect(result.moral).toBe(-5)
  })

  it('niggle diferente de divida_lesao não aplica modificador', () => {
    const efeitos = { fisico: -10 }
    expect(applyNiggleModifier(['outro_niggle'], efeitos)).toEqual(efeitos)
  })
})
