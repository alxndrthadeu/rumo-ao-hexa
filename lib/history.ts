import type { BracketEntry, Carta, CartaEntrevista, MatchRecord, RunState } from '@/engine/types'

export const ACTIVE_RUN_KEY     = 'rtt_active_run'
export const COMPLETED_IDS_KEY  = 'rtt_completed_ids'
export const MAX_COMPLETED      = 20

export type ActiveRun = {
  sessionId: string
  state: RunState
  bracketEntry: BracketEntry
  currentCard: Carta | CartaEntrevista
}

export type RunHistoryEntry = {
  sessionId: string
  data: string           // "YYYY-MM-DD"
  nomeJogador: string
  camisa: number
  arquetipo: string
  causaMorte: string
  nota: number           // 0–100
  initialSeed: number
  epitafio: string
  partidaFinal: number   // quantas partidas foram disputadas
  resultado: 'vitoria' | 'eliminado'
  historicoPartidas: MatchRecord[]
}

// ─── Active run (run em andamento, só no browser) ────────────────────────────

export function saveActiveRun(run: ActiveRun): void {
  try { localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(run)) } catch {}
}

export function loadActiveRun(): ActiveRun | null {
  try {
    const raw = localStorage.getItem(ACTIVE_RUN_KEY)
    return raw ? (JSON.parse(raw) as ActiveRun) : null
  } catch { return null }
}

export function clearActiveRun(): void {
  try { localStorage.removeItem(ACTIVE_RUN_KEY) } catch {}
}

// ─── Completed session IDs (para a lista do histórico) ──────────────────────

export function saveCompletedSession(sessionId: string): void {
  try {
    const raw = localStorage.getItem(COMPLETED_IDS_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(sessionId)) {
      localStorage.setItem(
        COMPLETED_IDS_KEY,
        JSON.stringify([sessionId, ...ids].slice(0, MAX_COMPLETED))
      )
    }
  } catch {}
}

export function loadCompletedSessionIds(): string[] {
  try {
    const raw = localStorage.getItem(COMPLETED_IDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
