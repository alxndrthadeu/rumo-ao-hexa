import { NextRequest, NextResponse } from 'next/server'
import { createRunState } from '@/engine/state'
import { buildPreGameDeck } from '@/engine/deck'
import type { Arquetipo } from '@/engine/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const arquetipo: Arquetipo = body.arquetipo
  const nomeJogador: string  = (body.nome ?? '').trim().slice(0, 20)
  const camisa: number       = Math.min(99, Math.max(1, Number(body.camisa) || 10))

  if (!['estrela', 'caido', 'futuro'].includes(arquetipo)) {
    return NextResponse.json({ error: 'arquetipo inválido' }, { status: 400 })
  }
  if (!nomeJogador) {
    return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })
  }

  const rawSeed = typeof body.seed === 'string' ? parseInt(body.seed, 16) : NaN
  const seed = (isNaN(rawSeed) || rawSeed < 0 ? Math.floor(Math.random() * 0x100000000) : rawSeed) >>> 0
  const sessionId = crypto.randomUUID()
  const baseState = createRunState(arquetipo, seed, nomeJogador, camisa)
  const { cards: preGameCards, seed: newSeed, cartasVistas } = buildPreGameDeck(
    1, seed, baseState.barras.midia, undefined, arquetipo
  )
  const state = {
    ...baseState,
    seed: newSeed,
    cartasRestantes: preGameCards.map(c => c.id),
    cartasVistas,
  }

  return NextResponse.json({ sessionId, state, cards: preGameCards })
}
