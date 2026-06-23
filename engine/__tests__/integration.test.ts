import { describe, it, expect } from 'vitest'
import { createRunState } from '../state'
import { initMatchScore } from '../score'
import { applyCardChoice, resolveMatchEnd } from '../phases'
import { buildPreGameDeck, buildMatchDeck, getInterviewCard, loadBracket } from '../deck'
import type { Carta } from '../types'

describe('Integração — fatia vertical', () => {
  it('run completa Partida 1 como Estrela — mecânica fim-a-fim', () => {
    const SEED = 12345
    let s = createRunState('estrela', SEED)
    const bracket = loadBracket()[0] // Marrocos, técnico

    // ── FASE PLANEJAR ──────────────────────────────────────
    const [ancora, circo] = buildPreGameDeck(1)
    s = applyCardChoice(s, ancora, 'esquerda')
    if (!s.morto) s = applyCardChoice(s, circo, 'direita')

    expect(s.flagsPartida.length).toBeGreaterThan(0)
    expect(s.morto).toBe(false)

    // ── FASE REAGIR ────────────────────────────────────────
    const { cards: matchDeck, seed: newSeed } = buildMatchDeck(1, 'tecnico', 'estrela', s.seed)
    expect(matchDeck).toHaveLength(3)

    s = { ...s, placarPartida: initMatchScore(s.barras.moral), seed: newSeed }

    for (const carta of matchDeck) {
      if (s.morto) break
      s = applyCardChoice(s, carta, 'direita')
    }

    // ── FASE ENTREVISTA ────────────────────────────────────
    if (!s.morto) {
      const entrevistaCarta = getInterviewCard(s)
      expect(entrevistaCarta).toBeDefined()
      expect(entrevistaCarta.fase).toBe('entrevista')

      s = applyCardChoice(s, entrevistaCarta, 'esquerda')

      expect(s.flagsCarreira).toBeDefined()
      expect(Object.keys(s.flagsCarreira).length).toBeGreaterThan(0)
      expect(s.flagsPartida).toHaveLength(0) // flags de partida resetaram
    }

    // ── RESOLUÇÃO ──────────────────────────────────────────
    if (!s.morto) {
      const sPos = resolveMatchEnd(s, bracket)
      // Após resolução, estado avançou ou foi eliminado
      expect(sPos.partidaAtual === 2 || sPos.morto).toBe(true)
    }
  })

  it('morte por barra interrompe a partida imediatamente', () => {
    let s = createRunState('caido', 99999)
    s = { ...s, barras: { ...s.barras, fisico: 5 } }

    const carta: Carta = {
      id: 'test_drena_fisico',
      fase: 'reagir',
      partida: 1,
      texto: 'Teste — drena Físico',
      esquerda: { texto: 'Drena -10', efeitos: { fisico: -10 } },
      direita:  { texto: 'Neutro',    efeitos: {} },
    }

    const result = applyCardChoice(s, carta, 'esquerda')
    expect(result.morto).toBe(true)
    expect(result.causaMorte).toBe('barra')
    expect(result.barraMorte?.barra).toBe('fisico')
    expect(result.barraMorte?.extreme).toBe('min')
  })

  it('morte por barra no extremo máximo (Torcida=100)', () => {
    let s = createRunState('estrela', 1)
    s = { ...s, barras: { ...s.barras, torcida: 95 } }

    const carta: Carta = {
      id: 'test_boost_torcida',
      fase: 'reagir',
      partida: 1,
      texto: 'Teste — infla Torcida',
      esquerda: { texto: 'Boost +10', efeitos: { torcida: 10 } },
      direita:  { texto: 'Neutro',    efeitos: {} },
    }

    const result = applyCardChoice(s, carta, 'esquerda')
    expect(result.morto).toBe(true)
    expect(result.causaMorte).toBe('barra')
    expect(result.barraMorte?.barra).toBe('torcida')
    expect(result.barraMorte?.extreme).toBe('max')
  })

  it('estado não muta após applyCardChoice', () => {
    const s = createRunState('futuro', 42)
    const original = JSON.stringify(s)
    const carta: Carta = {
      id: 'test_neutral',
      fase: 'reagir',
      partida: 1,
      texto: 'Teste',
      esquerda: { texto: 'A', efeitos: { moral: 5 } },
      direita:  { texto: 'B', efeitos: {} },
    }
    applyCardChoice(s, carta, 'esquerda')
    expect(JSON.stringify(s)).toBe(original)
  })

  it('resolveMatchEnd avança para partida 2 após J1', () => {
    let s = createRunState('estrela', 1)
    s = { ...s, placarPartida: 3, pontosGrupo: 0 } // vitória clara
    const bracket = loadBracket()[0]
    const next = resolveMatchEnd(s, bracket)
    expect(next.partidaAtual).toBe(2)
    expect(next.pontosGrupo).toBe(3)
    expect(next.morto).toBe(false)
  })

  it('resolveMatchEnd elimina no mata-mata por derrota', () => {
    let s = createRunState('estrela', 1)
    s = { ...s, placarPartida: 0, partidaAtual: 4 }
    const bracket = loadBracket()[3] // oitavas
    const next = resolveMatchEnd(s, bracket)
    expect(next.morto).toBe(true)
    expect(next.causaMorte).toBe('placar')
  })

  it('resolveMatchEnd elimina grupos com pontos insuficientes após J3', () => {
    let s = createRunState('estrela', 1)
    s = { ...s, placarPartida: 0, partidaAtual: 3, pontosGrupo: 3 }
    const bracket = loadBracket()[2] // grupo 3
    const next = resolveMatchEnd(s, bracket)
    expect(next.morto).toBe(true)
    expect(next.causaMorte).toBe('placar')
  })
})
