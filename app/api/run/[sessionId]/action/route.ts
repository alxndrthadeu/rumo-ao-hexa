import { NextRequest, NextResponse } from 'next/server'
import { applyCardChoice, resolveMatchEnd, resolvePenaltyEnd, resolveEcosDiferidos } from '@/engine/phases'
import { applyMatchDecay } from '@/engine/bars'
import { BRACKET, buildPreGameDeck, buildMatchDeck, buildPenaltyDeck, PENALTY_CARD_IDS, getCardById, getInterviewCard, resolveBracketEntry } from '@/engine/deck'
import { checkMatchResult } from '@/engine/score'
import type { Carta, CartaEntrevista, RunState } from '@/engine/types'
import { assertUnreachable } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export type EcoToast = { texto: string; tipo: 'gol_sofrido' | 'neutro' }

export async function POST(req: NextRequest, { params }: Params) {
  const { sessionId: _sessionId } = await params
  const body = await req.json()
  const { state: rawState, cardId, escolha } = body as {
    state: RunState
    cardId: string
    escolha: 'esquerda' | 'direita'
  }

  if (!rawState || !cardId || !['esquerda', 'direita'].includes(escolha)) {
    return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 })
  }

  const state = rawState as RunState
  if (state.morto) {
    return NextResponse.json({ error: 'run já encerrada' }, { status: 400 })
  }

  const bracket = BRACKET
  const bracketEntry = resolveBracketEntry(bracket[state.partidaAtual - 1], state.initialSeed)

  // ── Validação: eco pendente, carta normal, ou idempotência ──────────────────

  const isEcoPendente = !!state.ecoPendente && cardId === state.ecoPendente

  const card = isEcoPendente
    ? (getCardById(cardId) as Carta | null)
    : findCardById(state, cardId)

  if (!card) {
    // Idempotência: cardId existe no catálogo mas já foi processado
    const cardExists = getCardById(cardId) !== null
    if (cardExists) {
      return NextResponse.json({
        state,
        nextCards: getRemainingCards(state),
        bracketEntry,
        isGameOver: state.morto,
        ecoToasts: [],
      })
    }
    return NextResponse.json({ error: 'carta inválida' }, { status: 400 })
  }

  const isCriseCard = card.fase !== 'entrevista' && (card as Carta).camada === 'crise'
  const flagsPartidaSnapshot = state.fase === 'entrevista' ? [...state.flagsPartida] : []

  const prevPlacar = state.placarPartida
  let newState: RunState = applyCardChoice(state, card, escolha)

  // ── Remoção de cartasRestantes: eco não consome slot ────────────────────────

  if (isEcoPendente) {
    // Limpa ecoPendente; cartasRestantes intacto
    newState = { ...newState, ecoPendente: undefined }
  } else {
    newState = {
      ...newState,
      cartasRestantes: newState.cartasRestantes.filter(id => id !== cardId),
    }
  }

  // Sobreviveu à carta de crise — limpa crise e marca flag de carreira
  if (isCriseCard && !newState.morto) {
    newState = {
      ...newState,
      crise: undefined,
      flagsCarreira: {
        ...newState.flagsCarreira,
        sobreviveu_crise: (newState.flagsCarreira.sobreviveu_crise ?? 0) + 1,
      },
    }
  }

  // ── Prioridade 1: novo eco 'agora' → serve eco, minuto congela ──────────────

  if (!newState.morto && newState.ecoPendente) {
    const ecoCard = getCardById(newState.ecoPendente) as Carta | null
    if (ecoCard) {
      // Persiste currentCard = eco para resume-after-refresh
      const newBracketEntry = resolveBracketEntry(bracket[newState.partidaAtual - 1] ?? bracketEntry, state.initialSeed)
      return NextResponse.json({
        state: newState,
        nextCards: [ecoCard],
        bracketEntry: newBracketEntry,
        isGameOver: false,
        ecoToasts: [],
      })
    }
  }

  // ── Tracking de gols (placar delta da carta normal + risco) ─────────────────

  if ((state.fase === 'reagir' || isEcoPendente) && !newState.morto) {
    const delta = newState.placarPartida - prevPlacar
    if (delta > 0) {
      newState = { ...newState, golsBrasil: newState.golsBrasil + delta }
    } else if (delta < 0) {
      newState = { ...newState, golsAdversario: newState.golsAdversario + Math.abs(delta) }
    }
  }

  // ── Prioridade 2: resolver ecosDiferidos 'proximo_slot' ─────────────────────

  const ecoToasts: EcoToast[] = []

  if (!newState.morto && !isEcoPendente && state.fase === 'reagir') {
    const { state: afterDif, toasts } = resolveEcosDiferidos(newState, 'proximo_slot')
    newState = afterDif
    ecoToasts.push(...toasts)
  }

  let nextCards: Carta[] | CartaEntrevista[] | null = null

  if (!newState.morto && newState.cartasRestantes.length === 0) {
    if (state.fase === 'planejar') {
      const { cards: reagirCards, seed: newSeed, especialsVistas: newEspecialsVistas } = buildMatchDeck(
        newState.partidaAtual,
        bracketEntry.classe,
        newState.arquetipo,
        newState.seed,
        newState.barras,
        newState.especialsVistas ?? []
      )
      newState = {
        ...newState,
        fase: 'reagir',
        seed: newSeed,
        placarPartida: 0,
        golsBrasil: 0,
        golsAdversario: 0,
        cartasRestantes: reagirCards.map(c => c.id),
        especialsVistas: newEspecialsVistas,
      }
      nextCards = reagirCards
    } else if (state.fase === 'reagir') {
      // Prioridade 3: resolver ecosDiferidos 'fim_partida' antes de checkMatchResult
      if (!newState.morto) {
        const { state: afterFim, toasts } = resolveEcosDiferidos(newState, 'fim_partida')
        newState = afterFim
        ecoToasts.push(...toasts)
      }

      const alvo = bracketEntry.alvoVitoria
      const realGolsBra = Math.floor(newState.golsBrasil / alvo)
      const realGolsAdv = Math.floor(newState.golsAdversario / alvo)
      const resultadoRapido = checkMatchResult(realGolsBra, realGolsAdv, bracketEntry.partida)

      if (resultadoRapido === 'penaltis') {
        const flagsSnapshot = [...newState.flagsPartida]
        newState = resolveMatchEnd(newState, bracketEntry, flagsSnapshot)
        if (!newState.morto && newState.fase === 'penaltis') {
          const { cards: penaltyCards } = buildPenaltyDeck()
          newState = { ...newState, cartasRestantes: PENALTY_CARD_IDS }
          nextCards = penaltyCards
        }
      } else {
        const interviewCard = getInterviewCard(newState)
        newState = {
          ...newState,
          fase: 'entrevista',
          cartasRestantes: [interviewCard.id],
        }
        nextCards = [interviewCard]
      }
    } else if (state.fase === 'entrevista') {
      if (state.penaltisResolvidos) {
        newState = {
          ...newState,
          penaltisResolvidos: false,
          partidaAtual: newState.partidaAtual + 1,
          fase: 'planejar',
          placarPartida: 0,
          golsBrasil: 0,
          golsAdversario: 0,
          flagsPartida: [],
        }
        newState = applyMatchDecay(newState)
        const { cards: preGameCards, seed: newSeed, cartasVistas: vistas } = buildPreGameDeck(
          newState.partidaAtual,
          newState.seed,
          newState.barras.midia,
          newState.crise,
          newState.arquetipo,
          newState.cartasVistas
        )
        newState = { ...newState, seed: newSeed, cartasRestantes: preGameCards.map(c => c.id), cartasVistas: vistas }
        nextCards = preGameCards
      } else {
        newState = resolveMatchEnd(newState, bracketEntry, flagsPartidaSnapshot)
        if (!newState.morto) {
          const { cards: preGameCards, seed: newSeed, cartasVistas: vistas } = buildPreGameDeck(
            newState.partidaAtual,
            newState.seed,
            newState.barras.midia,
            newState.crise,
            newState.arquetipo,
            newState.cartasVistas
          )
          newState = {
            ...newState,
            seed: newSeed,
            cartasRestantes: preGameCards.map(c => c.id),
            cartasVistas: vistas,
          }
          nextCards = preGameCards
        }
      }
    } else if (state.fase === 'penaltis') {
      newState = resolvePenaltyEnd(newState)
      if (!newState.morto) {
        const interviewCard = getInterviewCard(newState)
        newState = { ...newState, cartasRestantes: [interviewCard.id] }
        nextCards = [interviewCard]
      }
    } else {
      assertUnreachable(state.fase)
    }
  } else if (!newState.morto) {
    nextCards = getRemainingCards(newState) as Carta[] | CartaEntrevista[]
  }

  const newBracketEntry = resolveBracketEntry(bracket[newState.partidaAtual - 1] ?? bracketEntry, state.initialSeed)

  return NextResponse.json({
    state: newState,
    nextCards,
    bracketEntry: newBracketEntry,
    isGameOver: newState.morto,
    ecoToasts,
  })
}

// ─── Helpers de busca ────────────────────────────────────────────────────────

function findCardById(
  state: RunState,
  cardId: string,
): Carta | CartaEntrevista | null {
  if (state.fase === 'planejar' || state.fase === 'reagir' || state.fase === 'penaltis') {
    if (!state.cartasRestantes.includes(cardId)) return null
    return getCardById(cardId)
  }
  if (state.fase === 'entrevista') {
    const card = getInterviewCard(state)
    return card.id === cardId ? card : null
  }
  return null
}

function getRemainingCards(
  state: RunState,
): (Carta | CartaEntrevista)[] {
  if (state.fase === 'planejar' || state.fase === 'reagir' || state.fase === 'penaltis') {
    return state.cartasRestantes
      .map(id => getCardById(id))
      .filter((c): c is NonNullable<typeof c> => c !== null)
  }
  if (state.fase === 'entrevista') {
    return [getInterviewCard(state)]
  }
  return []
}
