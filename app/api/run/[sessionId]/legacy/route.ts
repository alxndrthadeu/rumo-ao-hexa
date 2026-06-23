import { NextRequest, NextResponse } from 'next/server'
import { dbGetRunState, dbCompleteSession } from '@/lib/db'
import { generateLegacy } from '@/engine/legacy'
import type { RunState } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params

  const row = await dbGetRunState(sessionId)
  if (!row) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  if (!row.morto) {
    return NextResponse.json({ error: 'run ainda em andamento' }, { status: 400 })
  }

  const state = row.state as RunState
  const legacy = generateLegacy(state)

  await dbCompleteSession(sessionId)

  return NextResponse.json(legacy)
}
