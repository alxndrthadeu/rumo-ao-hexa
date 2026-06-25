import type { RunState } from '@/engine/types'

type CompletedRunRow = { state: RunState; createdAt: string }

const completedRuns = new Map<string, CompletedRunRow>()

export const memStore = {
  completedRuns: {
    save(sessionId: string, state: RunState): void {
      completedRuns.set(sessionId, { state, createdAt: new Date().toISOString() })
    },
    findById(sessionId: string): CompletedRunRow | null {
      return completedRuns.get(sessionId) ?? null
    },
    findMany(sessionIds: string[]): { sessionId: string; state: RunState; createdAt: string }[] {
      return sessionIds.flatMap(id => {
        const row = completedRuns.get(id)
        return row ? [{ sessionId: id, ...row }] : []
      })
    },
  },
}

export const IS_MEM = !process.env.NEXT_PUBLIC_SUPABASE_URL

if (IS_MEM && process.env.NODE_ENV === 'development') {
  console.warn(
    '[mem-store] NEXT_PUBLIC_SUPABASE_URL não configurado — usando in-memory store.\n' +
    '  Dados são perdidos ao reiniciar o servidor. Copie .env.local.example para .env.local.'
  )
}
