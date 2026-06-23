import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateLegacy } from '@/engine/legacy'
import type { RunState } from '@/engine/types'

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('run_states')
    .select('state, morto')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'sessão não encontrada' }, { status: 404 })
  }

  if (!data.morto) {
    return NextResponse.json({ error: 'run ainda em andamento' }, { status: 400 })
  }

  const state = data.state as RunState
  const legacy = generateLegacy(state)

  await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  return NextResponse.json(legacy)
}
