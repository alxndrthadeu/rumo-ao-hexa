import type { RunState } from '@/engine/types'

type SessionRow  = { id: string; arquetipo: string }
type RunStateRow = { session_id: string; partida_atual: number; morto: boolean; state: RunState }

const sessions  = new Map<string, SessionRow>()
const runStates = new Map<string, RunStateRow>()

function uuid(): string {
  return crypto.randomUUID()
}

export const memStore = {
  sessions: {
    insert(data: { arquetipo: string }): { data: SessionRow | null; error: null } {
      const row: SessionRow = { id: uuid(), ...data }
      sessions.set(row.id, row)
      return { data: row, error: null }
    },
    findById(id: string): { data: SessionRow | null; error: null } {
      return { data: sessions.get(id) ?? null, error: null }
    },
  },
  runStates: {
    insert(data: RunStateRow): { error: null } {
      runStates.set(data.session_id, data)
      return { error: null }
    },
    findBySession(sessionId: string): { data: RunStateRow | null; error: null } {
      return { data: runStates.get(sessionId) ?? null, error: null }
    },
    update(sessionId: string, patch: Partial<RunStateRow>): { error: null } {
      const row = runStates.get(sessionId)
      if (row) runStates.set(sessionId, { ...row, ...patch })
      return { error: null }
    },
  },
}

export const IS_MEM = !process.env.NEXT_PUBLIC_SUPABASE_URL
