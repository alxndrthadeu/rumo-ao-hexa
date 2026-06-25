import { NextRequest, NextResponse } from 'next/server'
import { applyCardChoice, resolveMatchEnd, resolvePenaltyEnd } from '@/engine/phases'
import { applyMatchDecay } from '@/engine/bars'
import { BRACKET, buildPreGameDeck, buildMatchDeck, buildPenaltyDeck, getCardById, getInterviewCard } from '@/engine/deck'
import type { BracketEntry, Carta, CartaEntrevista, ClasseInimigo, RunState } from '@/engine/types'
import { assertUnreachable } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

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
  const bracketEntry = bracket[state.partidaAtual - 1]

  const card = findCardById(state, cardId)
  if (!card) {
    // Carta não está em cartasRestantes — pode ser retry de rede de ação já processada.
    // Se o cardId existe no catálogo, retorna o estado atual idempotentemente.
    const cardExists = getCardById(cardId) !== null
    if (cardExists) {
      return NextResponse.json({
        state,
        nextCards: getRemainingCards(state),
        bracketEntry,
        isGameOver: state.morto,
      })
    }
    return NextResponse.json({ error: 'carta inválida' }, { status: 400 })
  }

  const isCriseCard = card.fase !== 'entrevista' && (card as import('@/engine/types').Carta).camada === 'crise'

  // Captura flags ANTES da entrevista resetar (applyInterviewChoice chama resetMatchFlags)
  const flagsPartidaSnapshot = state.fase === 'entrevista' ? [...state.flagsPartida] : []

  const prevPlacar = state.placarPartida
  let newState: RunState = applyCardChoice(state, card, escolha)
  newState = {
    ...newState,
    cartasRestantes: newState.cartasRestantes.filter(id => id !== cardId),
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

  // Track individual goals during reagir
  if (state.fase === 'reagir' && !newState.morto) {
    const delta = newState.placarPartida - prevPlacar
    if (delta > 0) {
      newState = { ...newState, golsBrasil: newState.golsBrasil + delta }
    } else if (delta < 0) {
      newState = { ...newState, golsAdversario: newState.golsAdversario + Math.abs(delta) }
    }
  }

  let nextCards: Carta[] | CartaEntrevista[] | null = null

  if (!newState.morto && newState.cartasRestantes.length === 0) {
    if (state.fase === 'planejar') {
      const { cards: reagirCards, seed: newSeed } = buildMatchDeck(
        newState.partidaAtual,
        bracketEntry.classe,
        newState.arquetipo,
        newState.seed,
        newState.barras
      )
      newState = {
        ...newState,
        fase: 'reagir',
        seed: newSeed,
        placarPartida: 0,
        golsBrasil: 0,
        golsAdversario: 0,
        cartasRestantes: reagirCards.map(c => c.id),
      }
      nextCards = reagirCards
    } else if (state.fase === 'reagir') {
      const interviewCard = getInterviewCard(newState)
      newState = {
        ...newState,
        fase: 'entrevista',
        cartasRestantes: [interviewCard.id],
      }
      nextCards = [interviewCard]
    } else if (state.fase === 'entrevista') {
      if (state.penaltisResolvidos) {
        // Pós-pênaltis: avança direto sem re-resolver a partida
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
          if (newState.fase === 'penaltis') {
            const { cards: penaltyCards } = buildPenaltyDeck()
            nextCards = penaltyCards
          } else {
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

  const newBracketEntry = bracket[newState.partidaAtual - 1] ?? bracketEntry

  return NextResponse.json({
    state: newState,
    nextCards,
    bracketEntry: newBracketEntry,
    isGameOver: newState.morto,
  })
}

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
