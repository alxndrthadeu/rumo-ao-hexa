import type { Arquetipo, RunState } from './types'
import config from '@/data/config.json'

export function createRunState(arquetipo: Arquetipo, seed: number, nomeJogador: string, camisa: number): RunState {
  const barras = config.bars.initial[arquetipo]
  return {
    arquetipo,
    nomeJogador,
    camisa,
    partidaAtual: 1,
    fase: 'planejar',
    cartasRestantes: [],
    barras: { ...barras },
    pontosGrupo: 0,
    placarPartida: 0,
    flagsPartida: [],
    flagsCarreira: {},
    niggles: arquetipo === 'caido' ? ['divida_lesao'] : [],
    bonusCrescimento: 0,
    morto: false,
    causaMorte: undefined,
    seed,
  }
}

export function getInitialPlacar(moral: number): number {
  if (moral >= config.moral.highThreshold) return config.moral.highBonus
  if (moral <= config.moral.lowThreshold) return config.moral.lowPenalty
  return config.moral.neutralScore
}

export function isGameOver(state: RunState): boolean {
  return state.morto
}
