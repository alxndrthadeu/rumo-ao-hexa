import type { Carga, RunState } from './types'

// Tabela estática de flags de partida — fonte de verdade de carga, climax e peso
const FLAG_DEFS: Record<string, { carga: Carga; climax: boolean; peso: number }> = {
  heroi:        { carga: 'ELOGIO',  climax: true,  peso: 99 },
  coletivo:     { carga: 'ELOGIO',  climax: true,  peso: 99 },
  afobado:      { carga: 'CRITICA', climax: true,  peso: 99 },
  vilao:        { carga: 'CRITICA', climax: true,  peso: 99 },
  frieza:       { carga: 'ELOGIO',  climax: false, peso: 7  },
  raca:         { carga: 'ELOGIO',  climax: false, peso: 6  },
  ousado:       { carga: 'NEUTRA',  climax: false, peso: 5  },
  showman:      { carga: 'NEUTRA',  climax: false, peso: 6  },
  pavio_curto:  { carga: 'CRITICA', climax: false, peso: 8  },
  apagado:      { carga: 'CRITICA', climax: false, peso: 7  },
  covarde:      { carga: 'CRITICA', climax: false, peso: 5  },
  disciplinado: { carga: 'NEUTRA',  climax: false, peso: 2  },
  frio:         { carga: 'NEUTRA',  climax: false, peso: 4  },
  boemio:       { carga: 'NEUTRA',  climax: false, peso: 5  },
  lider:        { carga: 'ELOGIO',  climax: false, peso: 3  },
  penaltis:     { carga: 'ELOGIO',  climax: true,  peso: 99 },
}

export function getFlagDef(flag: string) {
  return FLAG_DEFS[flag]
}

// Adiciona flag ao pool de partida. Se já existe, move para o fim (mais recente).
export function raiseFlag(
  state: RunState,
  flag: string,
  options: { climax?: boolean; peso?: number } = {}
): RunState {
  const without = state.flagsPartida.filter(f => f !== flag)
  return { ...state, flagsPartida: [...without, flag] }
}

// Regra de prioridade PRD §9.1: clímax > peso > recência > fallback
export function resolveInterviewFlag(state: RunState): string {
  const flags = state.flagsPartida
  if (flags.length === 0) return 'fallback'

  // 1. Flag de clímax domina (só uma possível por partida)
  const climaxFlag = flags.find(f => FLAG_DEFS[f]?.climax)
  if (climaxFlag) return climaxFlag

  // 2. Maior peso; empate → mais recente (maior índice)
  const scored = flags.map((f, idx) => ({
    flag: f,
    peso: FLAG_DEFS[f]?.peso ?? 0,
    recencia: idx,
  }))
  scored.sort((a, b) => b.peso !== a.peso ? b.peso - a.peso : b.recencia - a.recencia)

  return scored[0]?.flag ?? 'fallback'
}

export function applyCareerFlag(state: RunState, flag: string): RunState {
  const prev = state.flagsCarreira[flag] ?? 0
  return {
    ...state,
    flagsCarreira: { ...state.flagsCarreira, [flag]: prev + 1 },
  }
}

export function resetMatchFlags(state: RunState): RunState {
  return { ...state, flagsPartida: [] }
}

// Retorna a flag de carreira com maior contador; 'nenhuma' se vazio
export function dominantCareerFlag(flags: Record<string, number>): string {
  let best = 'nenhuma'
  let max = 0
  for (const [flag, count] of Object.entries(flags)) {
    if (count > max) {
      max = count
      best = flag
    }
  }
  return best
}
