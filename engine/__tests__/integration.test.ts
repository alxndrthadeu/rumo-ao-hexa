import { describe, it, expect } from 'vitest'
import { createRunState } from '../state'
import { applyCardChoice, resolveMatchEnd } from '../phases'
import { buildPreGameDeck, buildMatchDeck, getInterviewCard, loadBracket } from '../deck'
import type { Carta } from '../types'

describe('Integração — fatia vertical', () => {
  it('run completa Partida 1 como Estrela — mecânica fim-a-fim', () => {
    const SEED = 12345
    let s = createRunState('estrela', SEED, 'Teste', 10)
    const bracket = loadBracket()[0] // Marrocos, técnico

    // ── FASE PLANEJAR ──────────────────────────────────────
    const preGameCards = buildPreGameDeck(1, s.barras.midia)
    expect(preGameCards.length).toBeGreaterThanOrEqual(2)

    s = applyCardChoice(s, preGameCards[0], 'esquerda')
    if (!s.morto) s = applyCardChoice(s, preGameCards[1], 'direita')

    expect(s.morto).toBe(false)

    // ── FASE REAGIR ────────────────────────────────────────
    const { cards: matchDeck, seed: newSeed } = buildMatchDeck(
      1, 'tecnico', 'estrela', s.seed, s.barras
    )
    expect(matchDeck).toHaveLength(5)

    s = { ...s, placarPartida: 0, seed: newSeed }

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
      expect(sPos.partidaAtual === 2 || sPos.morto).toBe(true)
      // Próxima partida começa com placar 0
      if (!sPos.morto) expect(sPos.placarPartida).toBe(0)
    }
  })

  it('primeiro estouro de barra dispara crise (não morte imediata)', () => {
    let s = createRunState('caido', 99999, 'Teste', 10)
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
    expect(result.morto).toBe(false)
    expect(result.crise).toEqual({ barra: 'fisico', extreme: 'min' })
    expect(result.barras.fisico).toBe(5)
  })

  it('segundo estouro de barra com crise ativa mata imediatamente', () => {
    let s = createRunState('caido', 99999, 'Teste', 10)
    s = { ...s, barras: { ...s.barras, fisico: 5 }, crise: { barra: 'moral', extreme: 'min' } }

    const carta: Carta = {
      id: 'test_drena_fisico_2',
      fase: 'reagir',
      partida: 1,
      texto: 'Teste — drena Físico (crise ativa)',
      esquerda: { texto: 'Drena -10', efeitos: { fisico: -10 } },
      direita:  { texto: 'Neutro',    efeitos: {} },
    }

    const result = applyCardChoice(s, carta, 'esquerda')
    expect(result.morto).toBe(true)
    expect(result.causaMorte).toBe('barra')
    expect(result.barraMorte?.barra).toBe('fisico')
    expect(result.barraMorte?.extreme).toBe('min')
  })

  it('primeiro estouro máximo (Torcida=100) dispara crise', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
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
    expect(result.morto).toBe(false)
    expect(result.crise).toEqual({ barra: 'torcida', extreme: 'max' })
    expect(result.barras.torcida).toBe(95)
  })

  it('estado não muta após applyCardChoice', () => {
    const s = createRunState('futuro', 42, 'Teste', 10)
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

  it('resolveMatchEnd avança para partida 2 após J1 com placar 0', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, placarPartida: 2, pontosGrupo: 0 } // vitória (alvo=2)
    const bracket = loadBracket()[0]
    const next = resolveMatchEnd(s, bracket)
    expect(next.partidaAtual).toBe(2)
    expect(next.pontosGrupo).toBe(3)
    expect(next.morto).toBe(false)
    expect(next.placarPartida).toBe(0) // sempre começa zerado
  })

  it('resolveMatchEnd elimina no mata-mata por derrota', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, placarPartida: 0, partidaAtual: 4 }
    const bracket = loadBracket()[3] // oitavas, alvo=2
    const next = resolveMatchEnd(s, bracket)
    expect(next.morto).toBe(true)
    expect(next.causaMorte).toBe('placar')
  })

  it('resolveMatchEnd elimina grupos com pontos insuficientes após J3', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, placarPartida: 0, partidaAtual: 3, pontosGrupo: 3 }
    const bracket = loadBracket()[2] // grupo 3, alvo=2
    const next = resolveMatchEnd(s, bracket)
    expect(next.morto).toBe(true)
    expect(next.causaMorte).toBe('placar')
  })

  it('niggle divida_lesao aumenta custo de Físico negativo (Craque Caído)', () => {
    let s = createRunState('caido', 1, 'Teste', 10)
    expect(s.niggles).toContain('divida_lesao')
    const fisicoBefore = s.barras.fisico

    const carta: Carta = {
      id: 'test_fisico_drain',
      fase: 'reagir',
      partida: 1,
      texto: 'Drena físico',
      esquerda: { texto: 'Drena -10', efeitos: { fisico: -10 } },
      direita:  { texto: 'Neutro',    efeitos: {} },
    }

    const result = applyCardChoice(s, carta, 'esquerda')
    if (!result.morto) {
      expect(result.barras.fisico).toBe(Math.max(0, fisicoBefore - 15))
    } else {
      expect(result.causaMorte).toBe('barra')
    }
  })

  it('growth bonus do Futuro soma ao placar antes da checagem condicional', () => {
    let s = createRunState('futuro', 1, 'Teste', 10)
    s = { ...s, bonusCrescimento: 2, placarPartida: 0 }

    const carta: Carta = {
      id: 'test_condicional',
      fase: 'reagir',
      partida: 1,
      texto: 'Condicional',
      esquerda: {
        texto: 'Condicional',
        efeitos: { placar: 'condicional' },
        condicional: {
          limiar: 2,
          ramoA: { efeitos: { placar: 3 } },
          ramoB: { efeitos: { placar: -1 } },
        },
      },
      direita: { texto: 'Neutro', efeitos: {} },
    }

    const result = applyCardChoice(s, carta, 'esquerda')
    expect(result.placarPartida).toBe(3)
  })

  it('growth bonus NÃO se aplica a outros arquétipos', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, bonusCrescimento: 2, placarPartida: 0 }

    const carta: Carta = {
      id: 'test_condicional_estrela',
      fase: 'reagir',
      partida: 1,
      texto: 'Condicional',
      esquerda: {
        texto: 'Condicional',
        efeitos: { placar: 'condicional' },
        condicional: {
          limiar: 2,
          ramoA: { efeitos: { placar: 3 } },
          ramoB: { efeitos: { placar: -1 } },
        },
      },
      direita: { texto: 'Neutro', efeitos: {} },
    }

    const result = applyCardChoice(s, carta, 'esquerda')
    expect(result.placarPartida).toBe(-1)
  })

  it('deck de reagir tem 5 cartas para todos os arquétipos', () => {
    const barras = { moral: 60, fisico: 65, torcida: 70 }
    for (const arq of ['estrela', 'caido', 'futuro'] as const) {
      const { cards } = buildMatchDeck(1, 'tecnico', arq, 42, barras)
      expect(cards).toHaveLength(5)
    }
  })

  it('bar effects: moral alta injeta bonus_moral_alto no slot 0 (sem assinatura inicio)', () => {
    // Partida 2 não tem assinatura com posicao='inicio', então moral injeta no slot 0
    const barrasAltas = { moral: 80, fisico: 60, torcida: 60 }
    const { cards } = buildMatchDeck(2, 'saco_pancada', 'estrela', 42, barrasAltas)
    expect(cards[0].id).toBe('bonus_moral_alto')
  })

  it('bar effects: físico baixo injeta cansaco_extremo no slot 3', () => {
    const barrasBaixas = { moral: 60, fisico: 20, torcida: 60 }
    const { cards } = buildMatchDeck(1, 'tecnico', 'estrela', 42, barrasBaixas)
    expect(cards[3].id).toBe('cansaco_extremo')
  })

  it('pré-jogo retorna 3 cartas com mídia alta', () => {
    const cards = buildPreGameDeck(1, 80)
    expect(cards).toHaveLength(3)
    expect(cards[2].id).toBe('imprensa_favoravel')
  })

  it('pré-jogo retorna 3 cartas com mídia baixa', () => {
    const cards = buildPreGameDeck(1, 20)
    expect(cards).toHaveLength(3)
    expect(cards[2].id).toBe('imprensa_hostil')
  })

  it('pré-jogo retorna 2 cartas com mídia neutra', () => {
    const cards = buildPreGameDeck(1, 50)
    expect(cards).toHaveLength(2)
  })
})
