import type { Arquetipo, Carga } from './types'
import config from '@/data/config.json'

export function applyMediaBias(
  delta: number,
  carga: Carga,
  arquetipo: Arquetipo,
  midia = 50
): number {
  if (carga === 'NEUTRA') return delta

  const multipliers = config.media.multipliers[arquetipo]
  let factor = carga === 'ELOGIO' ? multipliers.ELOGIO : multipliers.CRITICA

  const high = config.deckBonus.midiaHighThreshold
  const low  = config.deckBonus.midiaLowThreshold
  const bonus   = config.media.midiaBonusFactor
  const penalty = config.media.midiaPenaltyFactor

  if (midia >= high) {
    // Imprensa favorável: elogios valem mais, críticas doem menos
    factor *= carga === 'ELOGIO' ? bonus : (1 / penalty)
  } else if (midia <= low) {
    // Imprensa hostil: críticas doem mais, elogios valem menos
    factor *= carga === 'ELOGIO' ? (1 / bonus) : penalty
  }

  return Math.round(delta * factor)
}
