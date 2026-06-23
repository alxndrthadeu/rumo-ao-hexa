import type { RunState } from '@/engine/types'
import { IS_MEM, memStore } from './mem-store'
import { createServerClient } from './supabase/server'

export async function dbInsertSession(arquetipo: string): Promise<{ id: string } | null> {
  if (IS_MEM) {
    const { data } = memStore.sessions.insert({ arquetipo })
    return data
  }
  const sb = createServerClient()
  const { data, error } = await sb.from('sessions').insert({ arquetipo }).select('id').single()
  if (error || !data) return null
  return data as { id: string }
}

export async function dbInsertRunState(row: {
  session_id: string
  partida_atual: number
  morto: boolean
  state: RunState
}): Promise<boolean> {
  if (IS_MEM) {
    memStore.runStates.insert(row)
    return true
  }
  const sb = createServerClient()
  const { error } = await sb.from('run_states').insert(row)
  return !error
}

export async function dbGetRunState(sessionId: string): Promise<{ state: RunState; morto: boolean } | null> {
  if (IS_MEM) {
    const { data } = memStore.runStates.findBySession(sessionId)
    if (!data) return null
    return { state: data.state, morto: data.morto }
  }
  const sb = createServerClient()
  const { data, error } = await sb
    .from('run_states')
    .select('state, morto')
    .eq('session_id', sessionId)
    .single()
  if (error || !data) return null
  return data as { state: RunState; morto: boolean }
}

export async function dbUpdateRunState(
  sessionId: string,
  patch: { state: RunState; partida_atual: number; morto: boolean; causa_morte?: string | null }
): Promise<void> {
  if (IS_MEM) {
    memStore.runStates.update(sessionId, patch)
    return
  }
  const sb = createServerClient()
  await sb.from('run_states').update(patch).eq('session_id', sessionId)
}

export async function dbCompleteSession(sessionId: string): Promise<void> {
  if (IS_MEM) return
  const sb = createServerClient()
  await sb.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
}
