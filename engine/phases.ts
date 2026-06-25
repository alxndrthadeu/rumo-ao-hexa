import type {
  BracketEntry,
  Carta,
  CartaEntrevista,
  Escolha,
  RunState,
} from './types'
import { applyBarDelta, applyMatchDecay, applyNiggleModifier, checkBarDeath } from './bars'
import { applyScoreDelta } from './score'
import { raiseFlag, applyCareerFlag, resetMatchFlags } from './flags'
import { applyMediaBias } from './media'
import { advanceSeed, seedToFloat } from './rng'
import { checkMatchResult, matchPoints } from './score'
import { buildMatchRecord } from './jornal'
import { PENALTY_CARD_IDS } from './deck'

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

function grantToken(state: RunState, escolha: Escolha): RunState {
  if (!escolha.concede_token) return state
  const token = escolha.concede_token
  return { ...state, tokens: { ...state.tokens, [token]: (state.tokens[token] ?? 0) + 1 } }
}

function applyRisco(state: RunState, escolha: Escolha): RunState {
  if (!escolha.risco) return state
  const { tipo, chance, efeitos, requer_token } = escolha.risco
  const newSeed = advanceSeed(state.seed)
  const roll = seedToFloat(newSeed)
  let s = { ...state, seed: newSeed }

  // Com token: consome 1 e garante sucesso (risco não dispara)
  if (requer_token) {
    const count = s.tokens[requer_token] ?? 0
    if (count > 0) {
      return { ...s, tokens: { ...s.tokens, [requer_token]: count - 1 } }
    }
  }

  if (roll < chance) {
    if (tipo === 'cartao_vermelho') {
      // Mata-mata (partida >= 4): expulsão elimina a equipe imediatamente
      if (s.partidaAtual >= 4) {
        return { ...s, morto: true, causaMorte: 'expulsao' }
      }
      // Fase de grupos: aplica penalidade mas continua a partida
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

  // 6. Barra no limite — primeira vez dispara crise; segunda vez é morte real
  const death = checkBarDeath(s)
  if (death.dead) {
    if (s.crise) {
      return { ...s, morto: true, causaMorte: 'barra', barraMorte: { barra: death.barra!, extreme: death.extreme! } }
    }
    const criseFloor = death.extreme === 'min' ? 5 : 95
    return {
      ...s,
      crise: { barra: death.barra!, extreme: death.extreme! },
      barras: { ...s.barras, [death.barra!]: criseFloor },
    }
  }

  // 7. Token concedido pela escolha (após tudo — não concede se morreu)
  s = grantToken(s, escolha)

  return s
}

function applyInterviewChoice(
  state: RunState,
  card: CartaEntrevista,
  lado: 'esquerda' | 'direita'
): RunState {
  const variante = card.variantes[state.arquetipo]
  const escolha = variante[lado]

  // Efeitos: midia recebe viés do arquétipo + nível atual de mídia
  const rawMidia = escolha.efeitos.midia ?? 0
  const biasedMidia = rawMidia !== 0
    ? applyMediaBias(rawMidia, card.carga, state.arquetipo, state.barras.midia)
    : 0

  const efeitos = { ...escolha.efeitos, midia: biasedMidia || undefined }

  let s = applyBarDelta(state, efeitos)

  // Flag de carreira
  if (escolha.flag_carreira) s = applyCareerFlag(s, escolha.flag_carreira)

  // Morte de barra — mesma lógica de crise
  const death = checkBarDeath(s)
  if (death.dead) {
    if (s.crise) {
      return { ...s, morto: true, causaMorte: 'barra', barraMorte: { barra: death.barra!, extreme: death.extreme! } }
    }
    const criseFloor = death.extreme === 'min' ? 5 : 95
    return {
      ...s,
      crise: { barra: death.barra!, extreme: death.extreme! },
      barras: { ...s.barras, [death.barra!]: criseFloor },
    }
  }

  // Token concedido pela entrevista
  s = grantToken(s, escolha)

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

  const alvo = bracket.alvoVitoria
  const realGolsBra = Math.floor(state.golsBrasil / alvo)
  const realGolsAdv = Math.floor(state.golsAdversario / alvo)
  const resultado = checkMatchResult(realGolsBra, realGolsAdv, bracket.partida)
  const pontos = matchPoints(resultado)

  // Registra a partida no histórico (flags capturadas antes do reset da entrevista)
  const { record, seed: seedAfterJornal } = buildMatchRecord(
    state.partidaAtual,
    bracket.adversario,
    bracket.fase,
    state.placarPartida,
    realGolsBra,
    realGolsAdv,
    resultado,
    flagsPartidaSnapshot,
    state.seed
  )

  let s: RunState = {
    ...state,
    seed: seedAfterJornal,
    historicoPartidas: [...state.historicoPartidas, record],
  }

  // Vitória na final = hexa
  if (bracket.partida === 7 && resultado === 'vitoria') {
    return { ...s, morto: true, causaMorte: 'vitoria' }
  }

  // Pênaltis (mata-mata com empate exato) → delega para cartas interativas
  if (resultado === 'penaltis') {
    s = {
      ...s,
      fase: 'penaltis',
      cartasRestantes: PENALTY_CARD_IDS,
      placarPartida: 0,
    }
    return s
  } else if (!bracket.empateValido && resultado !== 'vitoria') {
    // Mata-mata: derrota clara = eliminação imediata
    return { ...s, morto: true, causaMorte: 'placar' }
  } else if (bracket.empateValido) {
    // Grupos: acumula pontos
    const novosPontos = s.pontosGrupo + pontos

    // J3 com pontos insuficientes = eliminação
    if (bracket.partida === 3 && novosPontos < 5) {
      return { ...s, pontosGrupo: novosPontos, morto: true, causaMorte: 'placar' }
    }

    s = { ...s, pontosGrupo: novosPontos }
  }

  // Avança para próxima partida
  const nextPartida = s.partidaAtual + 1
  const bonusCrescimento = resultado === 'vitoria' && s.arquetipo === 'futuro'
    ? Math.min(s.bonusCrescimento + 1, 3)
    : s.bonusCrescimento

  s = {
    ...s,
    partidaAtual: nextPartida,
    fase: 'planejar',
    placarPartida: 0,
    golsBrasil: 0,
    golsAdversario: 0,
    flagsPartida: [],
    bonusCrescimento,
  }

  // C — decaimento natural entre partidas
  s = applyMatchDecay(s)

  return s
}

// ─── Resolução dos pênaltis (após as 3 cartas interativas) ───────────────────

export function resolvePenaltyEnd(state: RunState): RunState {
  if (state.morto) return state

  const moral = state.barras.moral / 100

  // Sua cobrança (0 = erro, 1 = gol)
  const yourGoal = state.placarPartida > 0 ? 1 : 0

  // 4 cobranças dos companheiros: 68–78% conforme moral atual
  const teamChance = 0.68 + moral * 0.10
  let teamGoals = yourGoal
  let seed = state.seed
  for (let i = 0; i < 4; i++) {
    seed = advanceSeed(seed)
    if (seedToFloat(seed) < teamChance) teamGoals++
  }

  // 5 cobranças do adversário: 68% fixo
  let opGoals = 0
  for (let i = 0; i < 5; i++) {
    seed = advanceSeed(seed)
    if (seedToFloat(seed) < 0.68) opGoals++
  }

  let s = { ...state, seed }

  // Morte súbita se empatou
  let vitoria = teamGoals > opGoals
  if (teamGoals === opGoals) {
    seed = advanceSeed(s.seed)
    const ourSD   = seedToFloat(seed) < (0.70 + moral * 0.10)
    seed = advanceSeed(seed)
    const theirSD = seedToFloat(seed) < 0.68
    s = { ...s, seed }
    vitoria = ourSD && !theirSD
  }

  if (!vitoria) {
    return { ...s, morto: true, causaMorte: 'penaltis' }
  }

  // Vitória → zona mista pós-pênaltis (flag 'penaltis' seleciona ent_penaltis)
  s = raiseFlag(s, 'penaltis')
  return {
    ...s,
    penaltisResolvidos: true,
    fase: 'entrevista',
    placarPartida: 0,
    cartasRestantes: [],
  }
}
