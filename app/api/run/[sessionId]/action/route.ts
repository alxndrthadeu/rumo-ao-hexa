import { NextRequest, NextResponse } from 'next/server'
import { dbGetRunState, dbUpdateRunState } from '@/lib/db'
import { applyCardChoice, resolveMatchEnd } from '@/engine/phases'
import { buildPreGameDeck, buildMatchDeck, getCardById, getInterviewCard, loadBracket } from '@/engine/deck'
import { initMatchScore } from '@/engine/score'
import type { BracketEntry, Carta, CartaEntrevista, ClasseInimigo, RunState } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { sessionId } = await params
  const body = await req.json()
  const { cardId, escolha } = body as { cardId: string; escolha: 'esquerda' | 'direita' }

  if (!cardId || !['esquerda', 'direita'].includes(escolha)) {
    return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 })
  }

  const row = await dbGetRunState(sessionId)
  if (!row) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  const state = row.state as RunState
  if (state.morto) {
    return NextResponse.json({ error: 'run já encerrada' }, { status: 400 })
  }

  const bracket = loadBracket()
  const bracketEntry = bracket[state.partidaAtual - 1]

  const card = findCardById(state, cardId, bracketEntry.classe)
  if (!card) {
    return NextResponse.json({ error: 'carta não encontrada' }, { status: 400 })
  }

  let newState: RunState = applyCardChoice(state, card, escolha)
  newState = {
    ...newState,
    cartasRestantes: newState.cartasRestantes.filter(id => id !== cardId),
  }

  let nextCards: Carta[] | CartaEntrevista[] | null = null

  if (!newState.morto && newState.cartasRestantes.length === 0) {
    if (state.fase === 'planejar') {
      const { cards: reagirCards, seed: newSeed } = buildMatchDeck(
        newState.partidaAtual,
        bracketEntry.classe,
        newState.arquetipo,
        newState.seed
      )
      newState = {
        ...newState,
        fase: 'reagir',
        seed: newSeed,
        placarPartida: initMatchScore(newState.barras.moral),
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
      newState = resolveMatchEnd(newState, bracketEntry)
      if (!newState.morto) {
        const [ancora, circo] = buildPreGameDeck(newState.partidaAtual)
        newState = {
          ...newState,
          cartasRestantes: [ancora.id, circo.id],
        }
        nextCards = [ancora, circo]
      }
    }
  } else if (!newState.morto) {
    nextCards = getRemainingCards(newState, bracket) as Carta[] | CartaEntrevista[]
  }

  await dbUpdateRunState(sessionId, {
    state: newState,
    partida_atual: newState.partidaAtual,
    morto: newState.morto,
    causa_morte: newState.causaMorte ?? null,
  })

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
  _classe: ClasseInimigo
): Carta | CartaEntrevista | null {
  if (state.fase === 'planejar') {
    const [ancora, circo] = buildPreGameDeck(state.partidaAtual)
    if (ancora.id === cardId) return ancora
    if (circo.id === cardId) return circo
    return null
  }
  if (state.fase === 'reagir') {
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
  _bracket: BracketEntry[]
): (Carta | CartaEntrevista)[] {
  if (state.fase === 'planejar') {
    const [ancora, circo] = buildPreGameDeck(state.partidaAtual)
    return [ancora, circo].filter(c => state.cartasRestantes.includes(c.id))
  }
  if (state.fase === 'reagir') {
    return state.cartasRestantes
      .map(id => getCardById(id))
      .filter((c): c is NonNullable<typeof c> => c !== null)
  }
  if (state.fase === 'entrevista') {
    return [getInterviewCard(state)]
  }
  return []
}
