import type { Arquetipo, BracketEntry, Carta, CartaEntrevista, ClasseInimigo, CriseState } from './types'
import { advanceSeed, seedToFloat } from './rng'
import { resolveInterviewFlag } from './flags'
import { injectClassCards, injectEvolucaoPair, injectPassiveCards } from './injection'
import config from '@/data/config.json'

import ancoraData     from '@/data/cards/planejar/ancora.json'
import circoData      from '@/data/cards/planejar/circo.json'
import imprensaData   from '@/data/cards/planejar/imprensa.json'
import genericData    from '@/data/cards/reagir/generic.json'
import tecnicoData    from '@/data/cards/reagir/classes/tecnico.json'
import fisicoData     from '@/data/cards/reagir/classes/fisico.json'
import favoritoData   from '@/data/cards/reagir/classes/favorito.json'
import rivalData      from '@/data/cards/reagir/classes/rival.json'
import evolucaoData   from '@/data/cards/reagir/classes/evolucao.json'
import sacoData       from '@/data/cards/reagir/classes/saco.json'
import assinaturaData from '@/data/cards/reagir/assinatura.json'
import bonusData      from '@/data/cards/reagir/bonus.json'
import especNeutroData    from '@/data/cards/reagir/especial_neutro.json'
import especFavorData     from '@/data/cards/reagir/especial_favoravel.json'
import especHostilData    from '@/data/cards/reagir/especial_hostil.json'
import entrevistaData from '@/data/cards/entrevista.json'
import criseData      from '@/data/cards/crise.json'
import penaltisData   from '@/data/cards/penaltis.json'
import ecosData       from '@/data/cards/reagir/ecos.json'
import bracketData    from '@/data/bracket.json'

const ancoraCards     = ancoraData     as unknown as Carta[]
const circoCards      = circoData      as unknown as Carta[]
const imprensaCards   = imprensaData   as unknown as Carta[]
const genericCards    = genericData    as unknown as Carta[]
const assinaturaCards = assinaturaData as unknown as Carta[]
const bonusCards      = bonusData      as unknown as Carta[]
const especNeutroCards    = especNeutroData    as unknown as Carta[]
const especFavorCards     = especFavorData     as unknown as Carta[]
const especHostilCards    = especHostilData    as unknown as Carta[]
const entrevistaCards = entrevistaData as unknown as CartaEntrevista[]
const criseCards      = criseData      as unknown as Carta[]
const penaltisCards   = penaltisData   as unknown as Carta[]
const ecosCards       = ecosData       as unknown as Carta[]

const CLASS_CARDS: Record<ClasseInimigo, Carta[]> = {
  tecnico:         tecnicoData    as unknown as Carta[],
  fisico:          fisicoData     as unknown as Carta[],
  favorito:        favoritoData   as unknown as Carta[],
  rival_historico: rivalData      as unknown as Carta[],
  evolucao:        evolucaoData   as unknown as Carta[],
  saco_pancada:    sacoData       as unknown as Carta[],
}

// Referências rápidas às cartas de bonus por papel
const BONUS_MORAL_ALTO  = bonusCards.find(c => c.id === 'bonus_moral_alto')!
const BONUS_MORAL_BAIXO = bonusCards.find(c => c.id === 'crise_moral')!
const BONUS_FISICO_ALTO  = bonusCards.find(c => c.id === 'bonus_fisico_alto')!
const BONUS_FISICO_BAIXO = bonusCards.find(c => c.id === 'cansaco_extremo')!

const IMPRENSA_FAVORAVEL = imprensaCards.find(c => c.id === 'imprensa_favoravel')!
const IMPRENSA_HOSTIL    = imprensaCards.find(c => c.id === 'imprensa_hostil')!

export const BRACKET: BracketEntry[] = bracketData as BracketEntry[]

/** @deprecated Use BRACKET directly */
export function loadBracket(): BracketEntry[] {
  return BRACKET
}

// ─── Pré-jogo ─────────────────────────────────────────────────────────────────
// Retorna 2-4 cartas:
//   [ancora, circo] base
//   + carta especial do arquétipo (requer_passiva), se existir para esta partida
//   + carta de imprensa (se mídia extrema)
//   + carta de crise na frente (se ativa)

export function buildPreGameDeck(
  partida: number,
  seed: number,
  midia?: number,
  crise?: CriseState,
  arquetipo?: Arquetipo,
  cartasVistas: string[] = []
): { cards: Carta[]; seed: number; cartasVistas: string[] } {
  const baseAncoras = ancoraCards.filter(c => !c.requer_passiva)
  const baseCircos  = circoCards.filter(c => !c.requer_passiva)

  // Exclui cartas já vistas nesta run; fallback para pool completo se esgotou
  const ancoraPool = baseAncoras.filter(c => !cartasVistas.includes(c.id))
  const circoPool  = baseCircos.filter(c => !cartasVistas.includes(c.id))
  const ancoras = ancoraPool.length > 0 ? ancoraPool : baseAncoras
  const circos  = circoPool.length  > 0 ? circoPool  : baseCircos

  const assCirco = assinaturaCards.find(
    c => c.naipe === 'circo' && c.partida === partida
  )

  let s = advanceSeed(seed)
  const ancora = ancoras[Math.floor(seedToFloat(s) * ancoras.length)]

  let circo: Carta
  if (assCirco) {
    circo = assCirco
  } else {
    s = advanceSeed(s)
    circo = circos[Math.floor(seedToFloat(s) * circos.length)]
  }

  const deck: Carta[] = [ancora, circo]

  // Carta especial do arquétipo (ancora ou circo com requer_passiva)
  if (arquetipo) {
    const passiva = [...ancoraCards, ...circoCards].find(
      c => c.requer_passiva === arquetipo && c.partida === partida
    )
    if (passiva) deck.push(passiva)
  }

  if (midia !== undefined) {
    const { midiaHighThreshold, midiaLowThreshold } = config.deckBonus
    if (midia >= midiaHighThreshold) deck.push(IMPRENSA_FAVORAVEL)
    else if (midia <= midiaLowThreshold) deck.push(IMPRENSA_HOSTIL)
  }

  // Carta de crise é sempre a primeira — aparece antes da concentração normal
  if (crise) {
    const criseCard = criseCards.find(c => c.id === `crise_${crise.barra}`)
    if (criseCard) deck.unshift(criseCard)
  }

  // Registra ancora e circo como vistos (assinatura e passiva não entram — são fixas por design)
  const novasVistas = [...cartasVistas, ancora.id]
  if (!assCirco) novasVistas.push(circo.id)

  return { cards: deck, seed: s, cartasVistas: novasVistas }
}

// ─── Deck de reagir ───────────────────────────────────────────────────────────
// 5 cartas: [0..3] padrão (com efeitos de barra) + [4] especial baseado em torcida

export function buildMatchDeck(
  partida: number,
  classe: ClasseInimigo,
  arquetipo: Arquetipo,
  seed: number,
  barras: { moral: number; fisico: number; torcida: number },
  especialsVistas: string[] = []
): { cards: Carta[]; seed: number; especialsVistas: string[] } {
  let s = seed
  const { highThreshold, lowThreshold } = config.deckBonus

  // 1. Embaralha genéricas e pega 4 base
  const shuffled = [...genericCards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = advanceSeed(s)
    const j = Math.floor(seedToFloat(s) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const base = shuffled.slice(0, 4)

  // 2. Injeta cartas da classe
  const classePool = CLASS_CARDS[classe] ?? []
  const { cards: afterClass, seed: s2 } = classe === 'evolucao'
    ? injectEvolucaoPair(base, classePool, s)
    : injectClassCards(base, classePool, s)
  s = s2

  // 3. Injeta passiva do arquétipo
  const afterPassiva = injectPassiveCards(afterClass, arquetipo)

  // 4. Injeta assinatura — respeita posicao 'inicio' (slot 0) ou 'fim' (slot 3)
  const assinatura = assinaturaCards.find(
    c => c.fase === 'reagir' &&
         c.partida === partida &&
         (!c.requer_passiva || c.requer_passiva === arquetipo)
  )

  let standard: Carta[] = assinatura
    ? assinatura.posicao === 'inicio'
      ? [assinatura, ...afterPassiva.slice(0, 3)]
      : [...afterPassiva.slice(0, 3), assinatura]
    : afterPassiva.slice(0, 4)

  // 5. Efeito de Moral — injeta em slot 0 (se não ocupado por assinatura de início)
  const assAtInicio = assinatura?.posicao === 'inicio'
  if (!assAtInicio) {
    if (barras.moral >= highThreshold) {
      standard = [BONUS_MORAL_ALTO, ...standard.slice(1)]
    } else if (barras.moral <= lowThreshold) {
      standard = [BONUS_MORAL_BAIXO, ...standard.slice(1)]
    }
  }

  // 6. Efeito de Físico — injeta em slot 3 (se não ocupado por assinatura de fim)
  const assAtFim = assinatura?.posicao === 'fim'
  if (!assAtFim) {
    if (barras.fisico >= highThreshold) {
      standard = [...standard.slice(0, 3), BONUS_FISICO_ALTO]
    } else if (barras.fisico <= lowThreshold) {
      standard = [...standard.slice(0, 3), BONUS_FISICO_BAIXO]
    }
  }

  // 7. Seleciona carta especial (slot 4) baseada em torcida — sem repetição entre partidas
  let especialPool: Carta[]
  if (barras.torcida >= highThreshold) {
    especialPool = especFavorCards
  } else if (barras.torcida <= lowThreshold) {
    especialPool = especHostilCards
  } else {
    especialPool = especNeutroCards
  }
  const especialPoolFiltrado = especialPool.filter(c => !especialsVistas.includes(c.id))
  const especialSource = especialPoolFiltrado.length > 0 ? especialPoolFiltrado : especialPool
  s = advanceSeed(s)
  const especial = especialSource[Math.floor(seedToFloat(s) * especialSource.length)]
  const novasEspecialsVistas = especialPoolFiltrado.length > 0
    ? [...especialsVistas, especial.id]
    : [especial.id]

  const cards = [...standard, especial]
  return { cards, seed: s, especialsVistas: novasEspecialsVistas }
}

// ─── Lookup global ────────────────────────────────────────────────────────────

const ALL_PLAY_CARDS: Carta[] = [
  ...genericCards,
  ...ancoraCards,
  ...circoCards,
  ...imprensaCards,
  ...assinaturaCards,
  ...bonusCards,
  ...especNeutroCards,
  ...especFavorCards,
  ...especHostilCards,
  ...criseCards,
  ...penaltisCards,
  ...ecosCards,
  ...Object.values(CLASS_CARDS).flat(),
]

// ─── Pênaltis ─────────────────────────────────────────────────────────────────

// IDs derivados do JSON de pênaltis — usado em phases.ts para montar cartasRestantes
// sem hardcodar strings que podem divergir do arquivo de dados.
export const PENALTY_CARD_IDS: string[] = penaltisCards.map(c => c.id)

if (PENALTY_CARD_IDS.length === 0) {
  throw new Error('penaltis.json está vazio — nenhuma carta de pênalti disponível')
}

export function buildPenaltyDeck(): { cards: Carta[] } {
  return { cards: penaltisCards }
}

export function getCardById(id: string): Carta | CartaEntrevista | null {
  return ALL_PLAY_CARDS.find(c => c.id === id) ?? null
}

// ─── Entrevista ───────────────────────────────────────────────────────────────

export function getInterviewCard(
  state: Parameters<typeof resolveInterviewFlag>[0]
): CartaEntrevista {
  const flag = resolveInterviewFlag(state)
  const partida = state.partidaAtual
  const todasComFlag = entrevistaCards.filter(c => c.requer_flag === flag)

  // Prefere cartas específicas da partida atual; fallback para todo o pool da flag
  const especificas = todasComFlag.filter(c => c.partida === partida)
  const candidatas = especificas.length > 0 ? especificas : todasComFlag

  if (candidatas.length === 0) return entrevistaCards.find(c => c.requer_flag === 'fallback')!
  const idx = Math.floor(seedToFloat(advanceSeed(state.seed)) * candidatas.length)
  return candidatas[idx] ?? entrevistaCards.find(c => c.requer_flag === 'fallback')!
}
