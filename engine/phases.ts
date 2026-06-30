import type {
  BracketEntry,
  Carta,
  CartaEntrevista,
  EcoDiferido,
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
import { PENALTY_CARD_IDS, getCardById } from './deck'

const ECO_CHAIN_CAP = 4

// ─── Helpers internos ────────────────────────────────────────────────────────

function applyEfeitos(state: RunState, escolha: Escolha): RunState {
  let s = state

  const rawBarEfeitos = {
    torcida: escolha.efeitos.torcida,
    midia:   escolha.efeitos.midia,
    moral:   escolha.efeitos.moral,
    fisico:  escolha.efeitos.fisico,
  }
  const barEfeitos = applyNiggleModifier(s.niggles, rawBarEfeitos)
  s = applyBarDelta(s, barEfeitos)

  if (escolha.efeitos.placar !== undefined) {
    if (escolha.efeitos.placar === 'condicional') {
      const cond = escolha.condicional!
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

// Enfileira um eco no estado; respeita guard-rails para 'agora', empilha diferidos para os demais.
function queueEco(state: RunState, ecoRef: Carta | string): RunState {
  let ecoId: string
  let quando: 'agora' | 'proximo_slot' | 'fim_partida'
  let chance: number | undefined

  if (typeof ecoRef === 'string') {
    ecoId = ecoRef
    // Resolve quando/chance a partir do catálogo — necessário para refs por id.
    const resolved = getCardById(ecoId)
    if (!resolved || resolved.fase === 'entrevista') return state
    const carta = resolved as Carta
    quando = carta.quando ?? 'agora'
    chance = carta.chance
  } else {
    ecoId = ecoRef.id
    quando = ecoRef.quando ?? 'agora'
    chance = ecoRef.chance
  }

  if (quando === 'proximo_slot' || quando === 'fim_partida') {
    const diferido: EcoDiferido = { cartaId: ecoId, quando, chance }
    return { ...state, ecosDiferidos: [...(state.ecosDiferidos ?? []), diferido] }
  }

  // quando === 'agora': guard-rails de cadeia
  const cadeia = state.ecoCadeia ?? []
  if (cadeia.length >= ECO_CHAIN_CAP) return state
  if (cadeia.includes(ecoId)) return state

  return { ...state, ecoPendente: ecoId, ecoCadeia: [...cadeia, ecoId] }
}

// Aplica risco e retorna estado + flag de sucesso (para decidir se ativa sucesso.eco).
function applyRisco(
  state: RunState,
  escolha: Escolha
): { state: RunState; riscoFired: boolean } {
  if (!escolha.risco) return { state, riscoFired: false }

  const { chance, efeitos, requer_token, flags_partida: riscoFlags, niggle: riscoNiggle, sucesso } = escolha.risco
  const newSeed = advanceSeed(state.seed)
  const roll = seedToFloat(newSeed)
  let s = { ...state, seed: newSeed }

  // Token suprime o risco → aplica ramo de sucesso
  if (requer_token) {
    const count = s.tokens[requer_token] ?? 0
    if (count > 0) {
      s = { ...s, tokens: { ...s.tokens, [requer_token]: count - 1 } }
      if (sucesso?.efeitos) {
        s = applyBarDelta(s, sucesso.efeitos)
        if (typeof sucesso.efeitos.placar === 'number') {
          s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, sucesso.efeitos.placar) }
        }
      }
      for (const f of sucesso?.flags_partida ?? []) s = raiseFlag(s, f, {})
      return { state: s, riscoFired: false }
    }
  }

  if (roll < chance) {
    // Risco dispara (falha)
    if (efeitos) {
      s = applyBarDelta(s, efeitos)
      if (typeof efeitos.placar === 'number') {
        s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, efeitos.placar) }
      }
    }
    for (const f of riscoFlags ?? []) s = raiseFlag(s, f, {})
    if (riscoNiggle && !s.niggles.includes(riscoNiggle)) {
      s = { ...s, niggles: [...s.niggles, riscoNiggle] }
    }
    return { state: s, riscoFired: true }
  }

  // Rolagem segura → sucesso
  if (sucesso?.efeitos) {
    s = applyBarDelta(s, sucesso.efeitos)
    if (typeof sucesso.efeitos.placar === 'number') {
      s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, sucesso.efeitos.placar) }
    }
  }
  for (const f of sucesso?.flags_partida ?? []) s = raiseFlag(s, f, {})
  return { state: s, riscoFired: false }
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

  // 1. Efeitos de barras + placar
  let s = applyEfeitos(state, escolha)

  // 2. Flags de partida
  if (escolha.efeitos.placar !== 'condicional') {
    s = applyFlags(s, escolha)
  }

  // 3. Flag de carreira
  if (escolha.flag_carreira) s = applyCareerFlag(s, escolha.flag_carreira)

  // 4. Niggle da escolha
  s = applyNiggle(s, escolha)

  // 5. Risco
  const { state: afterRisco, riscoFired } = applyRisco(s, escolha)
  s = afterRisco

  // 6. Barra no limite
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

  // 7. Token concedido
  s = grantToken(s, escolha)

  // 8. Eco: escolha.eco (sempre) e risco.sucesso.eco (só no sucesso)
  if (escolha.eco) s = queueEco(s, escolha.eco)
  if (!riscoFired && escolha.risco?.sucesso?.eco) s = queueEco(s, escolha.risco.sucesso.eco)

  // 9. Reset da cadeia se nenhum eco 'agora' foi enfileirado neste passo
  if (!s.ecoPendente || s.ecoPendente === state.ecoPendente) {
    s = { ...s, ecoCadeia: [] }
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

  const rawMidia = escolha.efeitos.midia ?? 0
  const biasedMidia = rawMidia !== 0
    ? applyMediaBias(rawMidia, card.carga, state.arquetipo, state.barras.midia)
    : 0

  const efeitos = { ...escolha.efeitos, midia: biasedMidia || undefined }

  let s = applyBarDelta(state, efeitos)

  if (escolha.flag_carreira) s = applyCareerFlag(s, escolha.flag_carreira)

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

  s = grantToken(s, escolha)
  s = resetMatchFlags(s)

  return s
}

// ─── Resolução de ecosDiferidos ──────────────────────────────────────────────

export type EcoToastItem = { texto: string; tipo: 'gol_sofrido' | 'neutro' }

export function resolveEcosDiferidos(
  state: RunState,
  quando: 'proximo_slot' | 'fim_partida'
): { state: RunState; toasts: EcoToastItem[] } {
  const fila = state.ecosDiferidos ?? []
  const restantes: import('./types').EcoDiferido[] = []
  const toasts: EcoToastItem[] = []
  let s = state

  for (const dif of fila) {
    if (dif.quando !== quando) {
      restantes.push(dif)
      continue
    }

    if (dif.chance !== undefined) {
      const newSeed = advanceSeed(s.seed)
      const roll = seedToFloat(newSeed)
      s = { ...s, seed: newSeed }
      if (roll >= dif.chance) continue
    }

    const ecoCard = getCardById(dif.cartaId) as Carta | null
    if (!ecoCard) continue

    const ef = ecoCard.esquerda.efeitos
    const rawBarEfeitos = {
      torcida: ef.torcida,
      midia:   ef.midia,
      moral:   ef.moral,
      fisico:  ef.fisico,
    }
    s = applyBarDelta(s, rawBarEfeitos)

    if (typeof ef.placar === 'number') {
      s = { ...s, placarPartida: applyScoreDelta(s.placarPartida, ef.placar) }
      if (ef.placar < 0) {
        s = { ...s, golsAdversario: s.golsAdversario + Math.abs(ef.placar) }
        toasts.push({ texto: ecoCard.texto, tipo: 'gol_sofrido' })
      }
    }
    for (const f of ecoCard.esquerda.flags_partida ?? []) {
      s = raiseFlag(s, f, {})
    }
  }

  return { state: { ...s, ecosDiferidos: restantes }, toasts }
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

  if (bracket.partida === 7 && resultado === 'vitoria') {
    return { ...s, morto: true, causaMorte: 'vitoria' }
  }

  if (resultado === 'penaltis') {
    s = {
      ...s,
      fase: 'penaltis',
      cartasRestantes: PENALTY_CARD_IDS,
      placarPartida: 0,
    }
    return s
  } else if (!bracket.empateValido && resultado !== 'vitoria') {
    return { ...s, morto: true, causaMorte: 'placar' }
  } else if (bracket.empateValido) {
    const novosPontos = s.pontosGrupo + pontos

    if (bracket.partida === 3 && novosPontos < 5) {
      return { ...s, pontosGrupo: novosPontos, morto: true, causaMorte: 'placar' }
    }

    s = { ...s, pontosGrupo: novosPontos }
  }

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

  s = applyMatchDecay(s)

  return s
}

// ─── Resolução dos pênaltis ───────────────────────────────────────────────────

export function resolvePenaltyEnd(state: RunState): RunState {
  if (state.morto) return state

  const moral = state.barras.moral / 100

  const yourGoal = state.placarPartida > 0 ? 1 : 0

  const teamChance = 0.68 + moral * 0.10
  let teamGoals = yourGoal
  let seed = state.seed
  for (let i = 0; i < 4; i++) {
    seed = advanceSeed(seed)
    if (seedToFloat(seed) < teamChance) teamGoals++
  }

  let opGoals = 0
  for (let i = 0; i < 5; i++) {
    seed = advanceSeed(seed)
    if (seedToFloat(seed) < 0.68) opGoals++
  }

  let s = { ...state, seed }

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

  s = raiseFlag(s, 'penaltis')

  // Final (partida 7) vencida nos pênaltis = HEXA
  if (s.partidaAtual === 7) {
    return { ...s, morto: true, causaMorte: 'vitoria' }
  }

  return {
    ...s,
    penaltisResolvidos: true,
    fase: 'entrevista',
    placarPartida: 0,
    cartasRestantes: [],
  }
}
