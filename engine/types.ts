// ─── Unions primitivos ───────────────────────────────────────────────────────

export type Carga = 'ELOGIO' | 'CRITICA' | 'NEUTRA'
export type Fase = 'planejar' | 'reagir' | 'entrevista'
export type Naipe = 'ancora' | 'circo'
export type Camada = 'generica' | 'classe' | 'assinatura'
export type Barra = 'torcida' | 'midia' | 'moral' | 'fisico'
export type Arquetipo = 'estrela' | 'caido' | 'futuro'
export type ClasseInimigo =
  | 'favorito'
  | 'rival_historico'
  | 'tecnico'
  | 'fisico'
  | 'evolucao'
  | 'saco_pancada'

export type ResultadoPartida = 'vitoria' | 'empate' | 'derrota'
export type CausaMorte = 'placar' | 'barra' | 'vitoria'

// ─── Estruturas de carta ─────────────────────────────────────────────────────

export interface Efeitos {
  torcida?: number
  midia?: number
  moral?: number
  fisico?: number
  placar?: number | 'condicional'
}

export interface CondicionalRamo {
  efeitos: Efeitos
  flags_partida?: string[]
  climax?: boolean
}

export interface Risco {
  tipo: string
  chance: number
  efeitos: Efeitos
}

export interface Escolha {
  texto: string
  efeitos: Efeitos
  flags_partida?: string[]
  flag_carreira?: string
  climax?: boolean
  niggle?: string
  gancho_entrevista?: string
  risco?: Risco
  // Preenchido quando efeitos.placar === 'condicional'
  condicional?: {
    limiar: number
    ramoA: CondicionalRamo
    ramoB: CondicionalRamo
  }
}

export interface Carta {
  id: string
  fase: Fase
  partida: number
  texto: string
  esquerda: Escolha
  direita: Escolha
  naipe?: Naipe
  camada?: Camada
  requer_classe?: ClasseInimigo
  requer_passiva?: Arquetipo
}

export interface CartaEntrevista {
  id: string
  fase: 'entrevista'
  partida: number
  requer_flag: string
  carga: Carga
  variantes: {
    [a in Arquetipo]: { pergunta: string; esquerda: Escolha; direita: Escolha }
  }
}

// ─── Chaveamento ─────────────────────────────────────────────────────────────

export interface BracketEntry {
  partida: number
  fase: string
  adversario: string
  classe: ClasseInimigo
  alvoVitoria: number
  empateValido: boolean
}

// ─── Estado da run ───────────────────────────────────────────────────────────

export interface RunState {
  arquetipo: Arquetipo
  partidaAtual: number
  fase: Fase
  cartasRestantes: string[]
  barras: { torcida: number; midia: number; moral: number; fisico: number }
  pontosGrupo: number
  placarPartida: number
  flagsPartida: string[]
  flagsCarreira: Record<string, number>
  niggles: string[]
  bonusCrescimento: number
  morto: boolean
  causaMorte?: CausaMorte
  barraMorte?: { barra: Barra; extreme: 'min' | 'max' }
  seed: number
}

// ─── Resultados de API / engine ──────────────────────────────────────────────

export interface BarDeathResult {
  dead: boolean
  barra?: Barra
  extreme?: 'min' | 'max'
}

export interface PhaseResult {
  resultado: ResultadoPartida
  partida: number
  placarFinal: number
  eliminado: boolean
}

export interface ActionResult {
  state: RunState
  barDeath?: BarDeathResult
  phaseResult?: PhaseResult
  nextCards?: Carta[]
  nextInterviewCard?: CartaEntrevista
}

// ─── Legacy ──────────────────────────────────────────────────────────────────

export interface Legacy {
  nota: number
  epitafio: string
  causa: string
  reputacao: string
}
