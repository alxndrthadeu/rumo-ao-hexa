import type {
  BracketEntry,
  Carta,
  CartaEntrevista,
  Escolha,
  RunState,
} from './types'
import { applyBarDelta, applyNiggleModifier, checkBarDeath } from './bars'
import { applyScoreDelta } from './score'
import { raiseFlag, applyCareerFlag, resetMatchFlags } from './flags'
import { applyMediaBias } from './media'
import { advanceSeed, seedToFloat } from './rng'
import { checkMatchResult, matchPoints } from './score'
import { initMatchScore } from './score'
import { buildMatchRecord } from './jornal'

// ─── Helpers internos ────────────────────────────────────────────────────────

function applyEfeitos(state: RunState, escolha: Escolha): RunState {
  let s = state

  // Barras (não-placar) — niggle aumenta custo de Físico negativo para divida_lesao
  const rawBarEfeitos = {
    torcida: escolha.efeitos.torcida,
    midia:   escolha.efeitos.midia,
    moral:   escolha.efeitos.moral,
    fisico:  escolha.efeitos.fisico,
  }
  const barEfeitos = applyNiggleModifier(s.niggles, rawBarEfeitos)
  s = applyBarDelta(s, barEfeitos)

  // Placar — resolve condicional se necessário
  if (escolha.efeitos.placar !== undefined) {
    if (escolha.efeitos.placar === 'condicional') {
      const cond = escolha.condicional!
      // Futuro soma bonusCrescimento ao placar antes de checar o limiar
      const placarEfetivo = s.placarPartida + (s.arquetipo === 'futuro' ? s.bonusCrescimento : 0)
      const ramo = placarEfetivo >= cond.limiar ? cond.ramoA : cond.ramoB
      s = applyBarDelta(s, { ...ramo.efeitos, placar: undefined })
      if (typeof ramo.efeitos.placar === 'number') {
        s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, ramo.efeitos.placar) }
      }
      for (const flag of ramo.flags_partida ?? []) s = raiseFlag(s, flag, { climax: ramo.climax })
    } else {
      s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, escolha.efeitos.placar) }
    }
  }

  return s
}

function applyFlags(state: RunState, escolha: Escolha): RunState {
  let s = state
  for (const flag of escolha.flags_partida ?? []) {
    s = raiseFlag(s, flag, { climax: escolha.climax })
  }
  return s
}

function applyRisco(state: RunState, escolha: Escolha): RunState {
  if (!escolha.risco) return state
  const { tipo, chance, efeitos } = escolha.risco
  const newSeed = advanceSeed(state.seed)
  const roll = seedToFloat(newSeed)
  let s = { ...state, seed: newSeed }
  if (roll < chance) {
    if (tipo === 'cartao_vermelho') {
      return { ...s, morto: true, causaMorte: 'expulsao' }
    }
    s = applyBarDelta(s, efeitos)
    if (typeof efeitos.placar === 'number') {
      s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, efeitos.placar) }
    }
  }
  return s
}

function applyNiggle(state: RunState, escolha: Escolha): RunState {
  if (!escolha.niggle) return state
  const niggles = state.niggles.includes(escolha.niggle)
    ? state.niggles
    : [...state.niggles, escolha.niggle]
  return { ...state, niggles }
}

// ─── Função principal ────────────────────────────────────────────────────────

export function applyCardChoice(
  state: RunState,
  card: Carta | CartaEntrevista,
  lado: 'esquerda' | 'direita'
): RunState {
  if (state.morto) return state

  if (card.fase === 'entrevista') {
    return applyInterviewChoice(state, card as CartaEntrevista, lado)
  }

  const carta = card as Carta
  const escolha = carta[lado]

  // 1. Efeitos de barras + placar (incluindo condicional)
  let s = applyEfeitos(state, escolha)

  // 2. Flags de partida (do conteúdo direto da escolha — condicional já levantou as suas)
  if (escolha.efeitos.placar !== 'condicional') {
    s = applyFlags(s, escolha)
  }

  // 3. Flag de carreira (só âncora/circo podem ter)
  if (escolha.flag_carreira) s = applyCareerFlag(s, escolha.flag_carreira)

  // 4. Niggle
  s = applyNiggle(s, escolha)

  // 5. Risco
  s = applyRisco(s, escolha)

  // 6. Morte de barra — imediata
  const death = checkBarDeath(s)
  if (death.dead) {
    return {
      ...s,
      morto: true,
      causaMorte: 'barra',
      barraMorte: { barra: death.barra!, extreme: death.extreme! },
    }
  }

  return s
}

function applyInterviewChoice(
  state: RunState,
  card: CartaEntrevista,
  lado: 'esquerda' | 'direita'
): RunState {
  const variante = card.variantes[state.arquetipo]
  const escolha = variante[lado]

  // Efeitos: midia recebe viés do arquétipo
  const rawMidia = escolha.efeitos.midia ?? 0
  const biasedMidia = rawMidia !== 0
    ? applyMediaBias(rawMidia, card.carga, state.arquetipo)
    : 0

  const efeitos = { ...escolha.efeitos, midia: biasedMidia || undefined }

  let s = applyBarDelta(state, efeitos)

  // Flag de carreira
  if (escolha.flag_carreira) s = applyCareerFlag(s, escolha.flag_carreira)

  // Morte de barra
  const death = checkBarDeath(s)
  if (death.dead) {
    return {
      ...s,
      morto: true,
      causaMorte: 'barra',
      barraMorte: { barra: death.barra!, extreme: death.extreme! },
    }
  }

  // Reset das flags de partida ao fim da entrevista
  s = resetMatchFlags(s)

  return s
}

// ─── Resolução de fim de partida ─────────────────────────────────────────────

export function resolveMatchEnd(
  state: RunState,
  bracket: BracketEntry,
  flagsPartidaSnapshot: string[] = []
): RunState {
  if (state.morto) return state

  const resultado = checkMatchResult(state.placarPartida, bracket.alvoVitoria, bracket.partida)
  const pontos = matchPoints(resultado)

  // Registra a partida no histórico (flags capturadas antes do reset da entrevista)
  const record = buildMatchRecord(
    state.partidaAtual,
    bracket.adversario,
    bracket.fase,
    state.placarPartida,
    resultado,
    flagsPartidaSnapshot
  )

  let s: RunState = {
    ...state,
    historicoPartidas: [...state.historicoPartidas, record],
  }

  // Vitória na final = hexa
  if (bracket.partida === 7 && resultado === 'vitoria') {
    return { ...s, morto: true, causaMorte: 'vitoria' }
  }

  // Mata-mata: derrota = eliminação imediata
  if (!bracket.empateValido && resultado !== 'vitoria') {
    return { ...s, morto: true, causaMorte: 'placar' }
  }

  // Grupos: acumula pontos
  if (bracket.empateValido) {
    const novosPontos = s.pontosGrupo + pontos

    // J3 com pontos insuficientes = eliminação
    if (bracket.partida === 3 && novosPontos < 5) {
      return { ...s, pontosGrupo: novosPontos, morto: true, causaMorte: 'placar' }
    }

    s = { ...s, pontosGrupo: novosPontos }
  }

  // Avança para próxima partida
  const nextPartida = s.partidaAtual + 1
  const nextMoral = s.barras.moral
  const bonusCrescimento = resultado === 'vitoria' && s.arquetipo === 'futuro'
    ? Math.min(s.bonusCrescimento + 1, 3)
    : s.bonusCrescimento

  s = {
    ...s,
    partidaAtual: nextPartida,
    fase: 'planejar',
    placarPartida: initMatchScore(nextMoral),
    flagsPartida: [],
    bonusCrescimento,
  }

  return s
}
