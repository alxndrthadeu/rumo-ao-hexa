import type { Arquetipo, BracketEntry, Carta, CartaEntrevista, ClasseInimigo } from './types'
import { advanceSeed, seedToFloat } from './rng'
import { resolveInterviewFlag } from './flags'
import { injectClassCards, injectPassiveCards } from './injection'

import ancoraData from '@/data/cards/planejar/ancora.json'
import circoData from '@/data/cards/planejar/circo.json'
import genericData from '@/data/cards/reagir/generic.json'
import tecnicoData from '@/data/cards/reagir/classes/tecnico.json'
import entrevistaData from '@/data/cards/entrevista.json'
import bracketData from '@/data/bracket.json'

const ancoraCards = ancoraData as unknown as Carta[]
const circoCards  = circoData  as unknown as Carta[]
const genericCards = genericData as unknown as Carta[]
const entrevistaCards = entrevistaData as unknown as CartaEntrevista[]

const CLASS_CARDS: Partial<Record<ClasseInimigo, Carta[]>> = {
  tecnico: tecnicoData as unknown as Carta[],
}

export function loadBracket(): BracketEntry[] {
  return bracketData as BracketEntry[]
}

// Seleção determinística por partida: (partida - 1) % pool.length
export function buildPreGameDeck(partida: number): [Carta, Carta] {
  const ancora = ancoraCards[(partida - 1) % ancoraCards.length]
  const circo  = circoCards[(partida - 1) % circoCards.length]
  return [ancora, circo]
}

// Monta deck de REAGIR com exatamente 3 cartas (2 genéricas + 1 classe)
export function buildMatchDeck(
  _partida: number,
  classe: ClasseInimigo,
  arquetipo: Arquetipo,
  seed: number
): { cards: Carta[]; seed: number } {
  // Embaralha genéricas e pega as 2 primeiras
  let s = seed
  const shuffled = [...genericCards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = advanceSeed(s)
    const j = Math.floor(seedToFloat(s) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const base = shuffled.slice(0, 3)

  // Injeta 1 carta da classe (substitui posição 0)
  const classePool = CLASS_CARDS[classe] ?? []
  const { cards: afterClass, seed: s2 } = injectClassCards(base, classePool, s)

  // Injeta passiva (sem efeito no MVP)
  const afterPassiva = injectPassiveCards(afterClass, arquetipo)

  return { cards: afterPassiva, seed: s2 }
}

// Seleciona carta de entrevista pela flag dominante; fallback se não encontrar
export function getInterviewCard(
  state: Parameters<typeof resolveInterviewFlag>[0]
): CartaEntrevista {
  const flag = resolveInterviewFlag(state)
  const card = entrevistaCards.find(c => c.requer_flag === flag)
  if (card) return card
  return entrevistaCards.find(c => c.requer_flag === 'fallback')!
}
