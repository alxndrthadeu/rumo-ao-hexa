import { NextRequest, NextResponse } from 'next/server'
import { dbGetCompletedRun } from '@/lib/db'
import { generateLegacy } from '@/engine/legacy'
import type { RunState } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params

  const row = await dbGetCompletedRun(sessionId)
  if (!row) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  const state = row.state as RunState
  const legacy = generateLegacy(state)

  return NextResponse.json(legacy)
}
