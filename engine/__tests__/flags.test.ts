import { describe, it, expect } from 'vitest'
import {
  raiseFlag,
  resolveInterviewFlag,
  applyCareerFlag,
  resetMatchFlags,
  dominantCareerFlag,
} from '../flags'
import { createRunState } from '../state'

function baseState() {
  return createRunState('estrela', 1, 'Teste', 10)
}

describe('raiseFlag', () => {
  it('adiciona flag ao pool', () => {
    const s = raiseFlag(baseState(), 'raca')
    expect(s.flagsPartida).toContain('raca')
  })

  it('flag duplicada move para o fim (mais recente)', () => {
    let s = raiseFlag(baseState(), 'frieza')
    s = raiseFlag(s, 'raca')
    s = raiseFlag(s, 'frieza') // re-raise frieza
    expect(s.flagsPartida[s.flagsPartida.length - 1]).toBe('frieza')
    expect(s.flagsPartida.filter(f => f === 'frieza')).toHaveLength(1)
  })
})

describe('resolveInterviewFlag', () => {
  it('clímax domina sobre peso maior', () => {
    // pavio_curto tem peso 8 (maior não-climax), heroi é climax
    let s = raiseFlag(baseState(), 'pavio_curto')
    s = raiseFlag(s, 'heroi')
    expect(resolveInterviewFlag(s)).toBe('heroi')
  })

  it('empate de peso → flag mais recente ganha', () => {
    // ousado e boemio têm peso 5
    let s = raiseFlag(baseState(), 'boemio')
    s = raiseFlag(s, 'ousado') // mais recente
    expect(resolveInterviewFlag(s)).toBe('ousado')
  })

  it('sem flags → fallback', () => {
    expect(resolveInterviewFlag(baseState())).toBe('fallback')
  })

  it('flag de circo (pré-jogo) entra no pool de prioridade', () => {
    // boemio é flag plantada no pré-jogo; deve ganhar sobre disciplinado (peso 2)
    let s = raiseFlag(baseState(), 'disciplinado')
    s = raiseFlag(s, 'boemio') // peso 5
    expect(resolveInterviewFlag(s)).toBe('boemio')
  })

  it('maior peso vence sem clímax', () => {
    let s = raiseFlag(baseState(), 'disciplinado') // peso 2
    s = raiseFlag(s, 'pavio_curto') // peso 8
    expect(resolveInterviewFlag(s)).toBe('pavio_curto')
  })
})

describe('applyCareerFlag', () => {
  it('incrementa contador na primeira vez', () => {
    const s = applyCareerFlag(baseState(), 'humilde')
    expect(s.flagsCarreira['humilde']).toBe(1)
  })

  it('acumula através de múltiplas aplicações', () => {
    let s = applyCareerFlag(baseState(), 'lider')
    s = applyCareerFlag(s, 'lider')
    s = applyCareerFlag(s, 'lider')
    expect(s.flagsCarreira['lider']).toBe(3)
  })

  it('flag de carreira persiste ao resetar flags de partida', () => {
    let s = applyCareerFlag(baseState(), 'idolo')
    s = resetMatchFlags(raiseFlag(s, 'heroi'))
    expect(s.flagsCarreira['idolo']).toBe(1)
    expect(s.flagsPartida).toHaveLength(0)
  })
})

describe('resetMatchFlags', () => {
  it('limpa flagsPartida, mantém flagsCarreira', () => {
    let s = raiseFlag(baseState(), 'raca')
    s = applyCareerFlag(s, 'humilde')
    s = resetMatchFlags(s)
    expect(s.flagsPartida).toHaveLength(0)
    expect(s.flagsCarreira['humilde']).toBe(1)
  })
})

describe('dominantCareerFlag', () => {
  it('retorna a flag com maior contador', () => {
    const flags = { humilde: 1, lider: 3, idolo: 2 }
    expect(dominantCareerFlag(flags)).toBe('lider')
  })

  it('retorna "nenhuma" se vazio', () => {
    expect(dominantCareerFlag({})).toBe('nenhuma')
  })
})
