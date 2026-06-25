import { NextRequest, NextResponse } from 'next/server'
import { dbSaveCompletedRun } from '@/lib/db'
import type { RunState } from '@/engine/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, state } = body as { sessionId: string; state: RunState }

  if (!sessionId || !state) {
    return NextResponse.json({ error: 'parâmetros inválidos' }, { status: 400 })
  }

  const ok = await dbSaveCompletedRun(sessionId, state)
  if (!ok) return NextResponse.json({ error: 'erro ao salvar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
