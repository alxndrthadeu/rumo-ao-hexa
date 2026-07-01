// ─── Unions primitivos ───────────────────────────────────────────────────────

export type Carga = 'ELOGIO' | 'CRITICA' | 'NEUTRA'
export type Fase = 'planejar' | 'reagir' | 'entrevista' | 'penaltis'
export type Naipe = 'ancora' | 'circo'
export type Camada = 'generica' | 'classe' | 'assinatura' | 'bonus' | 'especial' | 'crise'
export type Barra = 'torcida' | 'midia' | 'moral' | 'fisico'
export type Arquetipo = 'estrela' | 'caido' | 'futuro'
export type ClasseInimigo =
  | 'favorito'
  | 'rival_historico'
  | 'tecnico'
  | 'fisico'
  | 'evolucao'
  | 'saco_pancada'

export type ResultadoPartida = 'vitoria' | 'empate' | 'derrota' | 'penaltis'
export type CausaMorte = 'placar' | 'barra' | 'vitoria' | 'penaltis'

export interface CriseState {
  barra: Barra
  extreme: 'min' | 'max'
}

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

export interface RiscoSucesso {
  efeitos?: Efeitos
  flags_partida?: string[]
  eco?: Carta | string
}

export interface Risco {
  tipo?: string
  chance: number
  requer_token?: string
  efeitos?: Efeitos
  flags_partida?: string[]
  niggle?: string
  sucesso?: RiscoSucesso
}

export interface Escolha {
  texto: string
  efeitos: Efeitos
  flags_partida?: string[]
  flag_carreira?: string
  climax?: boolean
  niggle?: string
  gancho_entrevista?: string
  concede_token?: string
  risco?: Risco
  eco?: Carta | string
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
  posicao?: 'inicio' | 'fim'
  quando?: 'agora' | 'proximo_slot' | 'fim_partida'
  chance?: number
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
  adversarios?: string[]
  classe: ClasseInimigo
  alvoVitoria: number
  empateValido: boolean
}

// ─── Eco diferido ────────────────────────────────────────────────────────────

export interface EcoDiferido {
  cartaId: string
  quando: 'proximo_slot' | 'fim_partida'
  chance?: number
}

// ─── Estado da run ───────────────────────────────────────────────────────────

export interface RunState {
  arquetipo: Arquetipo
  nomeJogador: string
  camisa: number
  partidaAtual: number
  historicoPartidas: MatchRecord[]
  fase: Fase
  cartasRestantes: string[]
  barras: { torcida: number; midia: number; moral: number; fisico: number }
  pontosGrupo: number
  placarPartida: number
  golsBrasil: number
  golsAdversario: number
  flagsPartida: string[]
  flagsCarreira: Record<string, number>
  niggles: string[]
  bonusCrescimento: number
  crise?: CriseState
  penaltisResolvidos?: boolean
  cartasVistas: string[]
  especialsVistas?: string[]
  morto: boolean
  causaMorte?: CausaMorte
  barraMorte?: { barra: Barra; extreme: 'min' | 'max' }
  seed: number
  initialSeed: number
  tokens: Record<string, number>
  ecoPendente?: string
  ecoCadeia?: string[]
  ecosDiferidos?: EcoDiferido[]
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

// ─── Histórico de partidas ───────────────────────────────────────────────────

export interface MatchRecord {
  partida: number
  adversario: string
  fase: string
  placarDelta: number
  golsBrasil: number
  golsAdversario: number
  resultado: ResultadoPartida
  flagsDestaque: string[]
  manchete: string
  corpo: string
}

// ─── Legacy ──────────────────────────────────────────────────────────────────

export interface Legacy {
  nota: number
  epitafio: string
  causa: string
  reputacao: string
}

// ─── Utilitário de exhaustiveness ────────────────────────────────────────────

export function assertUnreachable(x: never): never {
  throw new Error(`Fase não tratada: ${JSON.stringify(x)}`)
}
