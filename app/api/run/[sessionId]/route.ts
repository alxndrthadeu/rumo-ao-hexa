import { NextRequest, NextResponse } from 'next/server'
import { dbGetCompletedRun } from '@/lib/db'

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params

  const row = await dbGetCompletedRun(sessionId)
  if (!row) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ state: row.state, createdAt: row.createdAt, isGameOver: true })
}
