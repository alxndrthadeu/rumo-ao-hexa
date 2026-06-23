import type { Arquetipo, BracketEntry, Carta, CartaEntrevista, ClasseInimigo } from './types'
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

export function loadBracket(): BracketEntry[] {
  return bracketData as BracketEntry[]
}

// ─── Pré-jogo ─────────────────────────────────────────────────────────────────
// Retorna 2 cartas normalmente; 3 quando mídia é extrema (carta de imprensa extra)

export function buildPreGameDeck(partida: number, midia?: number): Carta[] {
  const ancoras = ancoraCards.filter(c => !c.requer_passiva)
  const circos  = circoCards.filter(c => !c.requer_passiva)

  const assCirco = assinaturaCards.find(
    c => c.naipe === 'circo' && c.partida === partida
  )

  const ancora = ancoras[(partida - 1) % ancoras.length]
  const circo  = assCirco ?? circos[(partida - 1) % circos.length]

  const deck: Carta[] = [ancora, circo]

  if (midia !== undefined) {
    const { midiaHighThreshold, midiaLowThreshold } = config.deckBonus
    if (midia >= midiaHighThreshold) deck.push(IMPRENSA_FAVORAVEL)
    else if (midia <= midiaLowThreshold) deck.push(IMPRENSA_HOSTIL)
  }

  return deck
}

// ─── Deck de reagir ───────────────────────────────────────────────────────────
// 5 cartas: [0..3] padrão (com efeitos de barra) + [4] especial baseado em torcida

export function buildMatchDeck(
  partida: number,
  classe: ClasseInimigo,
  arquetipo: Arquetipo,
  seed: number,
  barras: { moral: number; fisico: number; torcida: number }
): { cards: Carta[]; seed: number } {
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

  // 7. Seleciona carta especial (slot 4) baseada em torcida
  let especialPool: Carta[]
  if (barras.torcida >= highThreshold) {
    especialPool = especFavorCards
  } else if (barras.torcida <= lowThreshold) {
    especialPool = especHostilCards
  } else {
    especialPool = especNeutroCards
  }
  s = advanceSeed(s)
  const especial = especialPool[Math.floor(seedToFloat(s) * especialPool.length)]

  const cards = [...standard, especial]
  return { cards, seed: s }
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
  ...Object.values(CLASS_CARDS).flat(),
]

export function getCardById(id: string): Carta | CartaEntrevista | null {
  return ALL_PLAY_CARDS.find(c => c.id === id) ?? null
}

// ─── Entrevista ───────────────────────────────────────────────────────────────

export function getInterviewCard(
  state: Parameters<typeof resolveInterviewFlag>[0]
): CartaEntrevista {
  const flag = resolveInterviewFlag(state)
  const card = entrevistaCards.find(c => c.requer_flag === flag)
  if (card) return card
  return entrevistaCards.find(c => c.requer_flag === 'fallback')!
}
