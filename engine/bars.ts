import type { Barra, BarDeathResult, Efeitos, RunState } from './types'
import config from '@/data/config.json'

const { deathMin, deathMax } = config.bars

const BAR_KEYS: Barra[] = ['torcida', 'midia', 'moral', 'fisico']

export function applyBarDelta(state: RunState, efeitos: Efeitos): RunState {
  const barras = { ...state.barras }

  for (const key of BAR_KEYS) {
    const delta = efeitos[key]
    if (delta !== undefined) {
      barras[key] = Math.max(deathMin, Math.min(deathMax, barras[key] + delta))
    }
  }

  return { ...state, barras }
}

export function checkBarDeath(state: RunState): BarDeathResult {
  for (const key of BAR_KEYS) {
    const value = state.barras[key]
    if (value <= deathMin) return { dead: true, barra: key, extreme: 'min' }
    if (value >= deathMax) return { dead: true, barra: key, extreme: 'max' }
  }
  return { dead: false }
}
