import { describe, it, expect } from 'vitest'
import {
  initMatchScore,
  applyScoreDelta,
  resolveCondicional,
  checkMatchResult,
  checkGroupClassification,
} from '../score'

describe('initMatchScore (Moral → Placar inicial)', () => {
  it('Moral 75 → Placar inicial +1', () => {
    expect(initMatchScore(75)).toBe(1)
  })

  it('Moral 50 → Placar inicial 0', () => {
    expect(initMatchScore(50)).toBe(0)
  })

  it('Moral 20 → Placar inicial -1', () => {
    expect(initMatchScore(20)).toBe(-1)
  })

  it('Moral 70 → Placar inicial +1 (exato no limiar)', () => {
    expect(initMatchScore(70)).toBe(1)
  })

  it('Moral 30 → Placar inicial -1 (exato no limiar)', () => {
    expect(initMatchScore(30)).toBe(-1)
  })
})

describe('checkMatchResult', () => {
  // Grupo (partidas 1-3): empate é possível
  it('partida 1, placar +2 → vitória', () => {
    expect(checkMatchResult(2, 2, 1)).toBe('vitoria')
  })

  it('partida 1, placar +1 → empate', () => {
    expect(checkMatchResult(1, 2, 1)).toBe('empate')
  })

  it('partida 1, placar 0 → derrota', () => {
    expect(checkMatchResult(0, 2, 1)).toBe('derrota')
  })

  it('partida 3, placar +3 → vitória', () => {
    expect(checkMatchResult(3, 3, 3)).toBe('vitoria')
  })

  it('partida 3, placar +2 → empate', () => {
    expect(checkMatchResult(2, 3, 3)).toBe('empate')
  })

  // Mata-mata (partidas 4-7): empate = derrota
  it('partida 4, placar +2 → derrota (mata-mata, empate não vale)', () => {
    expect(checkMatchResult(2, 3, 4)).toBe('derrota')
  })

  it('partida 4, placar +3 → vitória (mata-mata)', () => {
    expect(checkMatchResult(3, 3, 4)).toBe('vitoria')
  })

  it('partida 7, placar +5 → vitória (final)', () => {
    expect(checkMatchResult(5, 5, 7)).toBe('vitoria')
  })

  it('partida 7, placar +4 → derrota (final, empate = derrota)', () => {
    expect(checkMatchResult(4, 5, 7)).toBe('derrota')
  })
})

describe('resolveCondicional', () => {
  const ramoA = { placar: 2, midia: 10 }
  const ramoB = { placar: -1, moral: -5 }

  it('placar acima do limiar → ramoA', () => {
    expect(resolveCondicional(2, 1, ramoA, ramoB)).toEqual(ramoA)
  })

  it('placar igual ao limiar → ramoA', () => {
    expect(resolveCondicional(1, 1, ramoA, ramoB)).toEqual(ramoA)
  })

  it('placar abaixo do limiar → ramoB', () => {
    expect(resolveCondicional(0, 1, ramoA, ramoB)).toEqual(ramoB)
  })
})

describe('checkGroupClassification', () => {
  it('pontosGrupo 5 → classifica', () => {
    expect(checkGroupClassification(5)).toBe(true)
  })

  it('pontosGrupo 7 → classifica', () => {
    expect(checkGroupClassification(7)).toBe(true)
  })

  it('pontosGrupo 4 → não classifica', () => {
    expect(checkGroupClassification(4)).toBe(false)
  })

  it('pontosGrupo 0 → não classifica', () => {
    expect(checkGroupClassification(0)).toBe(false)
  })
})

describe('applyScoreDelta', () => {
  it('soma delta positivo', () => {
    expect(applyScoreDelta(0, 2)).toBe(2)
  })

  it('subtrai delta negativo', () => {
    expect(applyScoreDelta(3, -1)).toBe(2)
  })
})
