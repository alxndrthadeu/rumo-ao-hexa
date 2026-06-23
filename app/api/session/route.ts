import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createRunState } from '@/engine/state'
import { buildPreGameDeck } from '@/engine/deck'
import type { Arquetipo } from '@/engine/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const arquetipo: Arquetipo = body.arquetipo

  if (!['estrela', 'caido', 'futuro'].includes(arquetipo)) {
    return NextResponse.json({ error: 'arquetipo inválido' }, { status: 400 })
  }

  const seed = Date.now()
  const baseState = createRunState(arquetipo, seed)

  // Inicializa cartasRestantes com as 2 cartas do pré-jogo da Partida 1
  const [ancora, circo] = buildPreGameDeck(1)
  const state = { ...baseState, cartasRestantes: [ancora.id, circo.id] }

  const supabase = createServerClient()

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ arquetipo })
    .select('id')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'erro ao criar sessão' }, { status: 500 })
  }

  const { error: stateError } = await supabase.from('run_states').insert({
    session_id: session.id,
    partida_atual: state.partidaAtual,
    morto: false,
    state,
  })

  if (stateError) {
    return NextResponse.json({ error: 'erro ao criar estado' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id, state, cards: [ancora, circo] })
}
