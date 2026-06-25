import type { Barra, BarDeathResult, Efeitos, RunState } from './types'
import config from '@/data/config.json'

const { deathMin, deathMax } = config.bars

const BAR_KEYS: Barra[] = ['torcida', 'midia', 'moral', 'fisico']

// Aumenta o custo de efeitos negativos no Físico quando niggle divida_lesao está ativo.
export function applyNiggleModifier(niggles: string[], efeitos: Efeitos): Efeitos {
  if (!niggles.includes('divida_lesao')) return efeitos
  const fisico = efeitos.fisico
  if (fisico === undefined || fisico >= 0) return efeitos
  return {
    ...efeitos,
    fisico: Math.round(fisico * config.niggle.costMultiplier),
  }
}

// A — Soft cap: ganhos positivos são reduzidos quando a barra está alta.
// Evita acumulação descontrolada acima de 80 sem mexer em nenhuma carta.
function applySoftCap(current: number, delta: number): number {
  if (delta <= 0) return delta
  const { threshold1, multiplier1, threshold2, multiplier2 } = config.softCap
  if (current >= threshold2) return Math.max(1, Math.round(delta * multiplier2))
  if (current >= threshold1) return Math.max(1, Math.round(delta * multiplier1))
  return delta
}

export function applyBarDelta(state: RunState, efeitos: Efeitos): RunState {
  const barras = { ...state.barras }
  const { deltaMax } = config.bars

  for (const key of BAR_KEYS) {
    const delta = efeitos[key]
    if (delta !== undefined) {
      const clamped  = Math.max(-deltaMax, Math.min(deltaMax, delta))
      const effective = applySoftCap(barras[key], clamped)
      barras[key] = Math.max(deathMin, Math.min(deathMax, barras[key] + effective))
    }
  }

  return { ...state, barras }
}

// B — Assimetria de morte: barras em deathAtMaxExclude não morrem pelo máximo.
// Moral atingir 100 não elimina — apenas trava. Só morre no mínimo.
export function checkBarDeath(state: RunState): BarDeathResult {
  const noMaxDeath = new Set<string>(config.bars.deathAtMaxExclude)
  for (const key of BAR_KEYS) {
    const value = state.barras[key]
    if (value <= deathMin) return { dead: true, barra: key, extreme: 'min' }
    if (value >= deathMax && !noMaxDeath.has(key)) return { dead: true, barra: key, extreme: 'max' }
  }
  return { dead: false }
}

// C — Decaimento natural: ao avançar de partida, barras acima do threshold
// perdem alguns pontos. Simula o desgaste acumulado da competição.
export function applyMatchDecay(state: RunState): RunState {
  const { threshold, amount } = config.decay
  const barras = { ...state.barras }
  for (const key of BAR_KEYS) {
    if (barras[key] > threshold) {
      barras[key] = Math.max(threshold, barras[key] - amount)
    }
  }
  return { ...state, barras }
}
