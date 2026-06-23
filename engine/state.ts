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
    historicoPartidas: [],
    crise: undefined,
    morto: false,
    causaMorte: undefined,
    seed,
  }
}


export function isGameOver(state: RunState): boolean {
  return state.morto
}
