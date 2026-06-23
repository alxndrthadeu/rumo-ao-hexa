import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { generateLegacy } from '@/engine/legacy'
import type { RunState } from '@/engine/types'
import LegacyCard from '@/components/ui/LegacyCard'

export default async function LegadoPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('run_states')
    .select('state, morto')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    redirect('/')
  }

  if (!data.morto) {
    redirect(`/jogar/${sessionId}`)
  }

  const legacy = generateLegacy(data.state as RunState)

  return <LegacyCard legacy={legacy} />
}
