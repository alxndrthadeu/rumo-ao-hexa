import type { Arquetipo, Carga } from './types'
import config from '@/data/config.json'

export function applyMediaBias(delta: number, carga: Carga, arquetipo: Arquetipo): number {
  if (carga === 'NEUTRA') return delta
  const multipliers = config.media.multipliers[arquetipo]
  const factor = carga === 'ELOGIO' ? multipliers.ELOGIO : multipliers.CRITICA
  return Math.round(delta * factor)
}
