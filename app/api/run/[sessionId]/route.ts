import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildPreGameDeck, buildMatchDeck, getInterviewCard, loadBracket } from '@/engine/deck'
import type { RunState } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('run_states')
    .select('state, morto')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  const state = data.state as RunState
  const bracket = loadBracket()
  const bracketEntry = bracket[state.partidaAtual - 1]
  const isGameOver = data.morto

  let cards = null
  if (!isGameOver) {
    if (state.fase === 'planejar') {
      const [ancora, circo] = buildPreGameDeck(state.partidaAtual)
      cards = [ancora, circo]
    } else if (state.fase === 'reagir') {
      const { cards: matchCards } = buildMatchDeck(
        state.partidaAtual,
        bracketEntry.classe,
        state.arquetipo,
        state.seed
      )
      // Filtra as já jogadas via cartasRestantes
      cards = matchCards.filter(c => state.cartasRestantes.includes(c.id))
    } else if (state.fase === 'entrevista') {
      cards = [getInterviewCard(state)]
    }
  }

  return NextResponse.json({ state, cards, bracketEntry, isGameOver })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params
  const supabase = createServerClient()

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'abandoned' })
    .eq('id', sessionId)

  if (error) {
    return NextResponse.json({ error: 'erro ao abandonar sessão' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
