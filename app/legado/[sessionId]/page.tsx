import { redirect } from 'next/navigation'
import { dbGetCompletedRun } from '@/lib/db'
import { generateLegacy } from '@/engine/legacy'
import type { RunState } from '@/engine/types'
import LegacyCard from '@/components/ui/LegacyCard'

export default async function LegadoPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const row = await dbGetCompletedRun(sessionId)
  if (!row) redirect('/')

  const state = row.state as RunState
  const legacy = generateLegacy(state)

  return (
    <LegacyCard
      legacy={legacy}
      nomeJogador={state.nomeJogador}
      camisa={state.camisa}
      arquetipo={state.arquetipo}
      initialSeed={state.initialSeed}
      historicoPartidas={state.historicoPartidas}
      sessionId={sessionId}
    />
  )
}
