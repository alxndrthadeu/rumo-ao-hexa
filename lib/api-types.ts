import type { BracketEntry, Carta, CartaEntrevista, RunState } from '@/engine/types'

export interface SessionResponse {
  sessionId: string
  state: RunState
  cards: [Carta, Carta]
}

export interface RunStateResponse {
  state: RunState
  cards: Carta[] | CartaEntrevista[] | null
  bracketEntry: BracketEntry
  isGameOver: boolean
}

export interface ActionResponse {
  state: RunState
  nextCards: Carta[] | CartaEntrevista[] | null
  isGameOver: boolean
}

export interface LegacyResponse {
  nota: number
  epitafio: string
  causa: string
  reputacao: string
}
