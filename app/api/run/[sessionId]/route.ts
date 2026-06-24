import { NextRequest, NextResponse } from 'next/server'
import { dbGetRunState } from '@/lib/db'
import { getCardById, getInterviewCard, loadBracket } from '@/engine/deck'
import type { RunState } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params

  const row = await dbGetRunState(sessionId)
  if (!row) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  const state = row.state as RunState
  const bracket = loadBracket()
  const bracketEntry = bracket[state.partidaAtual - 1]
  const isGameOver = row.morto

  let cards = null
  if (!isGameOver) {
    if (state.fase === 'planejar') {
      cards = state.cartasRestantes
        .map(id => getCardById(id))
        .filter((c): c is NonNullable<typeof c> => c !== null)
    } else if (state.fase === 'reagir') {
      cards = state.cartasRestantes
        .map(id => getCardById(id))
        .filter((c): c is NonNullable<typeof c> => c !== null)
    } else if (state.fase === 'entrevista') {
      cards = [getInterviewCard(state)]
    }
  }

  return NextResponse.json({ state, cards, bracketEntry, isGameOver })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params

  const row = await dbGetRunState(sessionId)
  if (!row) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
