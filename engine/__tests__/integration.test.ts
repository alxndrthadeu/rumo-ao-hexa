import { describe, it, expect } from 'vitest'
import { createRunState } from '../state'
import { applyCardChoice, resolveMatchEnd, resolvePenaltyEnd } from '../phases'
import { buildPreGameDeck, buildMatchDeck, getInterviewCard, loadBracket } from '../deck'
import { generateManchete, buildMatchRecord } from '../jornal'
import type { Carta } from '../types'

describe('Integração — fatia vertical', () => {
  it('run completa Partida 1 como Estrela — mecânica fim-a-fim', () => {
    const SEED = 12345
    let s = createRunState('estrela', SEED, 'Teste', 10)
    const bracket = loadBracket()[0] // Marrocos, técnico

    // ── FASE PLANEJAR ──────────────────────────────────────
    const { cards: preGameCards, seed: pgSeed } = buildPreGameDeck(1, s.seed, s.barras.midia)
    s = { ...s, seed: pgSeed }
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
    // Soft cap impede cards de empurrar barras até 100 naturalmente;
    // teste seta torcida=100 diretamente para verificar o mecanismo de crise.
    s = { ...s, barras: { ...s.barras, torcida: 100 } }

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

  it('resolveMatchEnd avança para partida 2 após J1 vitória (BRA 1-0)', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    // alvoVitoria=2: golsBrasil=2 → floor(2/2)=1 BRA goal; golsAdversario=0 → 0 ADV goals → vitória
    s = { ...s, placarPartida: 2, golsBrasil: 2, pontosGrupo: 0 }
    const bracket = loadBracket()[0]
    const next = resolveMatchEnd(s, bracket)
    expect(next.partidaAtual).toBe(2)
    expect(next.pontosGrupo).toBe(3)
    expect(next.morto).toBe(false)
    expect(next.placarPartida).toBe(0)
  })

  it('resolveMatchEnd elimina no mata-mata por derrota (BRA 0-1)', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    // alvoVitoria=2: golsBrasil=0 → 0 BRA goals; golsAdversario=2 → floor(2/2)=1 ADV goal → derrota
    s = { ...s, placarPartida: -1, golsAdversario: 2, partidaAtual: 4 }
    const bracket = loadBracket()[3] // oitavas, alvo=2
    const next = resolveMatchEnd(s, bracket)
    expect(next.morto).toBe(true)
    expect(next.causaMorte).toBe('placar')
  })

  it('resolveMatchEnd abre fase pênaltis no mata-mata com empate (placar 0)', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, placarPartida: 0, partidaAtual: 4 }
    const bracket = loadBracket()[3] // oitavas, alvo=2
    const mid = resolveMatchEnd(s, bracket)
    // resolveMatchEnd apenas abre as cartas interativas, não resolve ainda
    expect(mid.morto).toBe(false)
    expect(mid.fase).toBe('penaltis')
    expect(mid.cartasRestantes).toEqual(['penalti_aptidao', 'penalti_abertura', 'penalti_cobranca', 'penalti_pressao_torcida', 'penalti_goleiro_provoca', 'penalti_companheiro_falha'])
  })

  it('resolvePenaltyEnd resolve pênaltis via seed — eliminado ou avança', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, placarPartida: 0, partidaAtual: 4, fase: 'penaltis' }
    const next = resolvePenaltyEnd(s)
    const eliminadoNasPenaltis = next.morto && next.causaMorte === 'penaltis'
    const avancouNasPenaltis   = !next.morto && next.penaltisResolvidos === true
    expect(eliminadoNasPenaltis || avancouNasPenaltis).toBe(true)
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
      // niggle: -10 * 1.5 = -15, mas deltaMax=7 limita a -7 → fisicoBefore - 7
      expect(result.barras.fisico).toBe(Math.max(0, fisicoBefore - 7))
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
    const { cards } = buildPreGameDeck(1, 12345, 80)
    expect(cards).toHaveLength(3)
    expect(cards[2].id).toBe('imprensa_favoravel')
  })

  it('pré-jogo retorna 3 cartas com mídia baixa', () => {
    const { cards } = buildPreGameDeck(1, 12345, 20)
    expect(cards).toHaveLength(3)
    expect(cards[2].id).toBe('imprensa_hostil')
  })

  it('pré-jogo retorna 2 cartas com mídia neutra', () => {
    const { cards } = buildPreGameDeck(1, 12345, 50)
    expect(cards).toHaveLength(2)
  })
})

describe('Placar — golsBrasil / golsAdversario', () => {
  it('inicializam em 0 ao criar run', () => {
    const s = createRunState('estrela', 1, 'Teste', 10)
    expect(s.golsBrasil).toBe(0)
    expect(s.golsAdversario).toBe(0)
  })

  it('resolveMatchEnd reseta golsBrasil e golsAdversario', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    s = { ...s, placarPartida: 2, golsBrasil: 2, golsAdversario: 1 }
    const bracket = loadBracket()[0]
    const next = resolveMatchEnd(s, bracket)
    if (!next.morto) {
      expect(next.golsBrasil).toBe(0)
      expect(next.golsAdversario).toBe(0)
    }
  })

  it('golsBrasil incrementa quando delta placar é positivo (lógica da action route)', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    const prevPlacar = s.placarPartida
    const carta: Carta = {
      id: 'test_gol_brasil',
      fase: 'reagir',
      partida: 1,
      texto: 'Gol!',
      esquerda: { texto: 'Marca', efeitos: { placar: 2 } },
      direita:  { texto: 'Neutro', efeitos: {} },
    }
    let newState = applyCardChoice(s, carta, 'esquerda')
    const delta = newState.placarPartida - prevPlacar
    if (delta > 0) newState = { ...newState, golsBrasil: newState.golsBrasil + delta }
    else if (delta < 0) newState = { ...newState, golsAdversario: newState.golsAdversario + Math.abs(delta) }
    expect(newState.golsBrasil).toBe(2)
    expect(newState.golsAdversario).toBe(0)
  })

  it('golsAdversario incrementa quando delta placar é negativo', () => {
    let s = createRunState('estrela', 1, 'Teste', 10)
    const prevPlacar = s.placarPartida
    const carta: Carta = {
      id: 'test_gol_adversario',
      fase: 'reagir',
      partida: 1,
      texto: 'Tomou gol',
      esquerda: { texto: 'Falhou', efeitos: { placar: -1 } },
      direita:  { texto: 'Neutro', efeitos: {} },
    }
    let newState = applyCardChoice(s, carta, 'esquerda')
    const delta = newState.placarPartida - prevPlacar
    if (delta > 0) newState = { ...newState, golsBrasil: newState.golsBrasil + delta }
    else if (delta < 0) newState = { ...newState, golsAdversario: newState.golsAdversario + Math.abs(delta) }
    expect(newState.golsBrasil).toBe(0)
    expect(newState.golsAdversario).toBe(1)
  })
})


describe('Jornal — seed determinismo', () => {
  it('generateManchete é determinístico com mesma seed', () => {
    const r1 = generateManchete('vitoria', ['heroi'], 'Marrocos', 12345)
    const r2 = generateManchete('vitoria', ['heroi'], 'Marrocos', 12345)
    expect(r1.manchete).toBe(r2.manchete)
    expect(r1.corpo).toBe(r2.corpo)
    expect(r1.seed).toBe(r2.seed)
  })

  it('generateManchete produz resultado diferente com seed diferente', () => {
    const r1 = generateManchete('derrota', ['vilao'], 'Alemanha', 11111)
    const r2 = generateManchete('derrota', ['vilao'], 'Alemanha', 99999)
    // Podem ser iguais por coincidência de pool pequeno, mas seeds devem diferir
    expect(r1.seed).not.toBe(r2.seed)
  })

  it('buildMatchRecord é determinístico com mesma seed', () => {
    const r1 = buildMatchRecord(1, 'Marrocos', 'grupos', 3, 3, 0, 'vitoria', ['heroi'], 99999)
    const r2 = buildMatchRecord(1, 'Marrocos', 'grupos', 3, 3, 0, 'vitoria', ['heroi'], 99999)
    expect(r1.record.manchete).toBe(r2.record.manchete)
    expect(r1.record.corpo).toBe(r2.record.corpo)
    expect(r1.seed).toBe(r2.seed)
  })

  it('generateManchete avança o seed (seed retornado !== seed inicial)', () => {
    const { seed: newSeed } = generateManchete('empate', ['frieza'], 'França', 55555)
    expect(newSeed).not.toBe(55555)
  })
})

describe('initialSeed — preservado durante a run', () => {
  it('initialSeed é preservado após resolveMatchEnd', () => {
    const SEED = 42
    let s = createRunState('estrela', SEED, 'Teste', 10)
    expect(s.initialSeed).toBe(SEED)
    s = { ...s, placarPartida: 2 }
    const bracket = loadBracket()[0]
    const next = resolveMatchEnd(s, bracket)
    expect(next.initialSeed).toBe(SEED)
  })

  it('initialSeed não muda quando seed avança pelo jornal', () => {
    const SEED = 777
    const s = createRunState('futuro', SEED, 'Teste', 99)
    expect(s.seed).toBe(SEED)
    expect(s.initialSeed).toBe(SEED)
    const bracket = loadBracket()[0]
    const next = resolveMatchEnd({ ...s, placarPartida: 3 }, bracket)
    // seed pode ter avançado (jornal consumiu RNG)
    expect(next.initialSeed).toBe(SEED)
  })
})
