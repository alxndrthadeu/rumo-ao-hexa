import { NextRequest, NextResponse } from 'next/server'
import { dbGetCompletedRuns } from '@/lib/db'
import { generateLegacy } from '@/engine/legacy'
import type { RunHistoryEntry } from '@/lib/history'
import type { RunState } from '@/engine/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids') ?? ''
  const sessionIds = idsParam.split(',').filter(Boolean)

  if (sessionIds.length === 0) {
    return NextResponse.json({ runs: [] })
  }

  const rows = await dbGetCompletedRuns(sessionIds)

  const runs: RunHistoryEntry[] = rows.map(row => {
    const state = row.state as RunState
    const legacy = generateLegacy(state)
    return {
      sessionId: row.sessionId,
      data: row.createdAt.split('T')[0],
      nomeJogador: state.nomeJogador,
      camisa: state.camisa,
      arquetipo: state.arquetipo,
      causaMorte: state.causaMorte ?? 'placar',
      nota: legacy.nota,
      initialSeed: state.initialSeed,
      epitafio: legacy.epitafio,
      partidaFinal: state.partidaAtual,
      resultado: state.causaMorte === 'vitoria' ? 'vitoria' : 'eliminado',
      historicoPartidas: state.historicoPartidas,
    }
  })

  // Preservar ordem do sessionIds (mais recente primeiro)
  const orderMap = new Map(sessionIds.map((id, i) => [id, i]))
  runs.sort((a, b) => (orderMap.get(a.sessionId) ?? 0) - (orderMap.get(b.sessionId) ?? 0))

  return NextResponse.json({ runs })
}
