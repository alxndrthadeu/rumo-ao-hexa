import type { Arquetipo, BracketEntry, Carta, CartaEntrevista, ClasseInimigo } from './types'
import { advanceSeed, seedToFloat } from './rng'
import { resolveInterviewFlag } from './flags'
import { injectClassCards, injectEvolucaoPair, injectPassiveCards } from './injection'

import ancoraData from '@/data/cards/planejar/ancora.json'
import circoData from '@/data/cards/planejar/circo.json'
import genericData from '@/data/cards/reagir/generic.json'
import tecnicoData from '@/data/cards/reagir/classes/tecnico.json'
import fisicoData from '@/data/cards/reagir/classes/fisico.json'
import favoritoData from '@/data/cards/reagir/classes/favorito.json'
import rivalData from '@/data/cards/reagir/classes/rival.json'
import evolucaoData from '@/data/cards/reagir/classes/evolucao.json'
import sacoData from '@/data/cards/reagir/classes/saco.json'
import assinaturaData from '@/data/cards/reagir/assinatura.json'
import entrevistaData from '@/data/cards/entrevista.json'
import bracketData from '@/data/bracket.json'

const ancoraCards   = ancoraData as unknown as Carta[]
const circoCards    = circoData  as unknown as Carta[]
const genericCards  = genericData as unknown as Carta[]
const assinaturaCards = assinaturaData as unknown as Carta[]
const entrevistaCards = entrevistaData as unknown as CartaEntrevista[]

const CLASS_CARDS: Record<ClasseInimigo, Carta[]> = {
  tecnico:        tecnicoData    as unknown as Carta[],
  fisico:         fisicoData     as unknown as Carta[],
  favorito:       favoritoData   as unknown as Carta[],
  rival_historico: rivalData     as unknown as Carta[],
  evolucao:       evolucaoData   as unknown as Carta[],
  saco_pancada:   sacoData       as unknown as Carta[],
}

export function loadBracket(): BracketEntry[] {
  return bracketData as BracketEntry[]
}

// Seleção de âncora e circo: rotação por partida dentro do pool
export function buildPreGameDeck(partida: number): [Carta, Carta] {
  // Filtra âncoras/circos disponíveis (sem requer_passiva) por pool
  const ancoras = ancoraCards.filter(c => !c.requer_passiva)
  const circos  = circoCards.filter(c => !c.requer_passiva)
  // Circo de assinatura para partidas específicas (ex: ass_proposta_europa)
  const assCirco = assinaturaCards.find(
    c => c.naipe === 'circo' && c.partida === partida
  )

  const ancora = ancoras[(partida - 1) % ancoras.length]
  const circo  = assCirco ?? circos[(partida - 1) % circos.length]

  return [ancora, circo]
}

// Monta deck de REAGIR com exatamente 3 cartas
export function buildMatchDeck(
  partida: number,
  classe: ClasseInimigo,
  arquetipo: Arquetipo,
  seed: number
): { cards: Carta[]; seed: number } {
  let s = seed

  // Embaralha genéricas com RNG semeável
  const shuffled = [...genericCards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = advanceSeed(s)
    const j = Math.floor(seedToFloat(s) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const base = shuffled.slice(0, 3)

  // Injeta cartas da classe — evolucao injeta par obrigatório (talento + brecha)
  const classePool = CLASS_CARDS[classe] ?? []
  const { cards: afterClass, seed: s2 } = classe === 'evolucao'
    ? injectEvolucaoPair(base, classePool, s)
    : injectClassCards(base, classePool, s)

  // Injeta passiva do arquétipo
  const afterPassiva = injectPassiveCards(afterClass, arquetipo)

  // Injeta cartas de assinatura válidas — substitui a última carta (deck fica em 3)
  const assinatura = assinaturaCards.find(
    c => c.fase === 'reagir' &&
         c.partida === partida &&
         (!c.requer_passiva || c.requer_passiva === arquetipo)
  )

  const finalCards = assinatura
    ? assinatura.posicao === 'inicio'
      ? [assinatura, ...afterPassiva.slice(0, 2)]
      : [...afterPassiva.slice(0, 2), assinatura]
    : afterPassiva

  return { cards: finalCards, seed: s2 }
}

// Lookup global por ID — evita rebuildar o deck com seed errado
const ALL_PLAY_CARDS: Carta[] = [
  ...genericCards,
  ...ancoraCards,
  ...circoCards,
  ...assinaturaCards,
  ...Object.values(CLASS_CARDS).flat(),
]

export function getCardById(id: string): Carta | CartaEntrevista | null {
  return ALL_PLAY_CARDS.find(c => c.id === id) ?? null
}

// Seleciona carta de entrevista pela flag dominante
export function getInterviewCard(
  state: Parameters<typeof resolveInterviewFlag>[0]
): CartaEntrevista {
  const flag = resolveInterviewFlag(state)
  // Tenta flag exata, depois gancho_entrevista, por fim fallback
  const card = entrevistaCards.find(c => c.requer_flag === flag)
  if (card) return card
  return entrevistaCards.find(c => c.requer_flag === 'fallback')!
}
