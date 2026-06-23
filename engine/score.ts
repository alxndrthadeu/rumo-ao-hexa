import type { Efeitos, ResultadoPartida } from './types'
import config from '@/data/config.json'

export function initMatchScore(moral: number): number {
  if (moral >= config.moral.highThreshold) return config.moral.highBonus
  if (moral <= config.moral.lowThreshold) return config.moral.lowPenalty
  return config.moral.neutralScore
}

export function applyScoreDelta(placar: number, delta: number): number {
  return placar + delta
}

export function resolveCondicional(
  placar: number,
  limiar: number,
  ramoA: Efeitos,
  ramoB: Efeitos
): Efeitos {
  return placar >= limiar ? ramoA : ramoB
}

export function checkMatchResult(
  placar: number,
  alvoVitoria: number,
  partida: number
): ResultadoPartida {
  const isMataeMata = partida >= 4

  if (placar >= alvoVitoria) return 'vitoria'
  if (isMataeMata) return 'derrota'
  return placar > 0 ? 'empate' : 'derrota'
}

export function checkGroupClassification(pontosGrupo: number): boolean {
  return pontosGrupo >= config.group.classifyMin
}

export function matchPoints(resultado: ResultadoPartida): number {
  switch (resultado) {
    case 'vitoria': return config.group.win
    case 'empate':  return config.group.draw
    case 'derrota': return config.group.loss
  }
}
