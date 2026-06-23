import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { applyCardChoice, resolveMatchEnd } from '@/engine/phases'
import { buildPreGameDeck, buildMatchDeck, getInterviewCard, loadBracket } from '@/engine/deck'
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

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('run_states')
    .select('state')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  const state = data.state as RunState
  if (state.morto) {
    return NextResponse.json({ error: 'run já encerrada' }, { status: 400 })
  }

  const bracket = loadBracket()
  const bracketEntry = bracket[state.partidaAtual - 1]

  // Encontra carta pelo ID na fase atual
  const card = findCardById(state, cardId, bracketEntry.classe)
  if (!card) {
    return NextResponse.json({ error: 'carta não encontrada' }, { status: 400 })
  }

  // Aplica a escolha
  let newState: RunState = applyCardChoice(state, card, escolha)

  // Remove carta das cartasRestantes
  newState = {
    ...newState,
    cartasRestantes: newState.cartasRestantes.filter(id => id !== cardId),
  }

  let nextCards: Carta[] | CartaEntrevista[] | null = null

  if (!newState.morto && newState.cartasRestantes.length === 0) {
    // Transição de fase
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
    // Ainda na mesma fase — retorna cartas restantes
    nextCards = getRemainingCards(newState, bracket) as Carta[] | CartaEntrevista[]
  }

  await supabase
    .from('run_states')
    .update({
      state: newState,
      partida_atual: newState.partidaAtual,
      morto: newState.morto,
      causa_morte: newState.causaMorte ?? null,
    })
    .eq('session_id', sessionId)

  return NextResponse.json({
    state: newState,
    nextCards,
    isGameOver: newState.morto,
  })
}

function findCardById(
  state: RunState,
  cardId: string,
  classe: ClasseInimigo
): Carta | CartaEntrevista | null {
  if (state.fase === 'planejar') {
    const [ancora, circo] = buildPreGameDeck(state.partidaAtual)
    if (ancora.id === cardId) return ancora
    if (circo.id === cardId) return circo
    return null
  }
  if (state.fase === 'reagir') {
    const { cards } = buildMatchDeck(state.partidaAtual, classe, state.arquetipo, state.seed)
    return cards.find(c => c.id === cardId) ?? null
  }
  if (state.fase === 'entrevista') {
    const card = getInterviewCard(state)
    return card.id === cardId ? card : null
  }
  return null
}

function getRemainingCards(
  state: RunState,
  bracket: BracketEntry[]
): (Carta | CartaEntrevista)[] {
  const entry = bracket[state.partidaAtual - 1]
  if (state.fase === 'planejar') {
    const [ancora, circo] = buildPreGameDeck(state.partidaAtual)
    return [ancora, circo].filter(c => state.cartasRestantes.includes(c.id))
  }
  if (state.fase === 'reagir') {
    const { cards } = buildMatchDeck(state.partidaAtual, entry.classe, state.arquetipo, state.seed)
    return cards.filter(c => state.cartasRestantes.includes(c.id))
  }
  if (state.fase === 'entrevista') {
    return [getInterviewCard(state)]
  }
  return []
}
