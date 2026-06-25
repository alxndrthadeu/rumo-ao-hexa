import { describe, it, expect } from 'vitest'
import {
  applyScoreDelta,
  resolveCondicional,
  checkMatchResult,
  checkGroupClassification,
} from '../score'

describe('checkMatchResult', () => {
  // Grupo (partidas 1-3): empate válido, resultado por gols reais
  it('grupo, BRA 1-0 → vitória', () => {
    expect(checkMatchResult(1, 0, 1)).toBe('vitoria')
  })

  it('grupo, BRA 2-1 → vitória', () => {
    expect(checkMatchResult(2, 1, 1)).toBe('vitoria')
  })

  it('grupo, 0-0 → empate', () => {
    expect(checkMatchResult(0, 0, 1)).toBe('empate')
  })

  it('grupo, BRA 1-1 → empate', () => {
    expect(checkMatchResult(1, 1, 1)).toBe('empate')
  })

  it('grupo, BRA 0-1 → derrota', () => {
    expect(checkMatchResult(0, 1, 1)).toBe('derrota')
  })

  it('grupo partida 3, BRA 2-0 → vitória', () => {
    expect(checkMatchResult(2, 0, 3)).toBe('vitoria')
  })

  it('grupo partida 3, BRA 1-1 → empate', () => {
    expect(checkMatchResult(1, 1, 3)).toBe('empate')
  })

  // Mata-mata (partidas 4-7): empate → pênaltis
  it('oitavas, BRA 1-0 → vitória (mata-mata)', () => {
    expect(checkMatchResult(1, 0, 4)).toBe('vitoria')
  })

  it('oitavas, BRA 2-1 → vitória (mata-mata)', () => {
    expect(checkMatchResult(2, 1, 4)).toBe('vitoria')
  })

  it('oitavas, 0-0 → pênaltis', () => {
    expect(checkMatchResult(0, 0, 4)).toBe('penaltis')
  })

  it('oitavas, BRA 1-1 → pênaltis', () => {
    expect(checkMatchResult(1, 1, 4)).toBe('penaltis')
  })

  it('oitavas, BRA 0-1 → derrota', () => {
    expect(checkMatchResult(0, 1, 4)).toBe('derrota')
  })

  // Cenário exato do bug: 2-1 na semi era contado como derrota
  it('semi (partida 6), BRA 2-1 → vitória', () => {
    expect(checkMatchResult(2, 1, 6)).toBe('vitoria')
  })

  it('semi, 1-1 → pênaltis', () => {
    expect(checkMatchResult(1, 1, 6)).toBe('penaltis')
  })

  it('semi, BRA 0-1 → derrota', () => {
    expect(checkMatchResult(0, 1, 6)).toBe('derrota')
  })

  it('final (partida 7), BRA 1-0 → vitória', () => {
    expect(checkMatchResult(1, 0, 7)).toBe('vitoria')
  })

  it('final, BRA 0-2 → derrota', () => {
    expect(checkMatchResult(0, 2, 7)).toBe('derrota')
  })

  it('final, 0-0 → pênaltis', () => {
    expect(checkMatchResult(0, 0, 7)).toBe('penaltis')
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
