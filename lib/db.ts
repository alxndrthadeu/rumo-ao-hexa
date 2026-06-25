import type { RunState } from '@/engine/types'
import { IS_MEM, memStore } from './mem-store'
import { createServerClient } from './supabase/server'

export async function dbSaveCompletedRun(sessionId: string, state: RunState): Promise<boolean> {
  if (IS_MEM) {
    memStore.completedRuns.save(sessionId, state)
    return true
  }
  const sb = createServerClient()
  const { error } = await sb.from('completed_runs').insert({ session_id: sessionId, state })
  return !error
}

export async function dbGetCompletedRun(
  sessionId: string
): Promise<{ state: RunState; createdAt: string } | null> {
  if (IS_MEM) {
    const row = memStore.completedRuns.findById(sessionId)
    if (!row) return null
    return { state: row.state, createdAt: row.createdAt }
  }
  const sb = createServerClient()
  const { data, error } = await sb
    .from('completed_runs')
    .select('state, created_at')
    .eq('session_id', sessionId)
    .single()
  if (error || !data) return null
  return { state: data.state as RunState, createdAt: data.created_at as string }
}

export async function dbGetCompletedRuns(
  sessionIds: string[]
): Promise<{ sessionId: string; state: RunState; createdAt: string }[]> {
  if (IS_MEM) {
    return memStore.completedRuns.findMany(sessionIds)
  }
  const sb = createServerClient()
  const { data, error } = await sb
    .from('completed_runs')
    .select('session_id, state, created_at')
    .in('session_id', sessionIds)
  if (error || !data) return []
  return (data as { session_id: string; state: RunState; created_at: string }[]).map(row => ({
    sessionId: row.session_id,
    state: row.state,
    createdAt: row.created_at,
  }))
}
