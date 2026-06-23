import { redirect } from 'next/navigation'
import { dbGetRunState } from '@/lib/db'
import { generateLegacy } from '@/engine/legacy'
import type { RunState } from '@/engine/types'
import LegacyCard from '@/components/ui/LegacyCard'

export default async function LegadoPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const row = await dbGetRunState(sessionId)
  if (!row) redirect('/')
  if (!row.morto) redirect(`/jogar/${sessionId}`)

  const state = row.state as RunState
  const legacy = generateLegacy(state)

  return (
    <LegacyCard
      legacy={legacy}
      nomeJogador={state.nomeJogador}
      camisa={state.camisa}
    />
  )
}
