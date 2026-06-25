import type { Efeitos, ResultadoPartida } from './types'
import config from '@/data/config.json'

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
  golsBrasil: number,
  golsAdversario: number,
  partida: number
): ResultadoPartida {
  const isMataeMata = partida >= 4

  if (golsBrasil > golsAdversario) return 'vitoria'
  if (isMataeMata && golsBrasil === golsAdversario) return 'penaltis'
  if (isMataeMata) return 'derrota'
  return golsBrasil >= golsAdversario ? 'empate' : 'derrota'
}

export function checkGroupClassification(pontosGrupo: number): boolean {
  return pontosGrupo >= config.group.classifyMin
}

export function matchPoints(resultado: ResultadoPartida): number {
  switch (resultado) {
    case 'vitoria':  return config.group.win
    case 'empate':   return config.group.draw
    case 'derrota':  return config.group.loss
    case 'penaltis': return 0
  }
}
