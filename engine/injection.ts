import type { Arquetipo, Carta } from './types'
import { advanceSeed, seedToFloat } from './rng'

// Pares de evolucao: cada par [talento, brecha] deve aparecer junto na mesma partida.
// Índices no array do pool: (0,1), (2,3), (4,5)
const EVOLUCAO_PAIRS: [number, number][] = [[0, 1], [2, 3], [4, 5]]

// Substitui 1 carta genérica por 1 carta aleatória da classe do adversário.
export function injectClassCards(
  base: Carta[],
  classeCards: Carta[],
  seed: number
): { cards: Carta[]; seed: number } {
  if (classeCards.length === 0 || base.length === 0) return { cards: base, seed }

  const s1 = advanceSeed(seed)
  const classIdx = Math.floor(seedToFloat(s1) * classeCards.length)
  const classCard = classeCards[classIdx]

  const result = [classCard, ...base.slice(1)]
  return { cards: result, seed: s1 }
}

// Para a classe evolucao: substitui 2 genéricas por um par (talento + brecha) sorteado.
// Garante que os dois cards apareçam juntos na mesma partida.
export function injectEvolucaoPair(
  base: Carta[],
  evolucaoCards: Carta[],
  seed: number
): { cards: Carta[]; seed: number } {
  if (evolucaoCards.length < 2 || base.length < 2) return { cards: base, seed }

  const s1 = advanceSeed(seed)
  const pairIdx = Math.floor(seedToFloat(s1) * EVOLUCAO_PAIRS.length)
  const [iA, iB] = EVOLUCAO_PAIRS[pairIdx]

  const talento = evolucaoCards[iA]
  const brecha  = evolucaoCards[iB]

  // Substitui posições 0 e 1; posição 2 permanece genérica
  const result = [talento, brecha, ...base.slice(2)]
  return { cards: result, seed: s1 }
}

// Injeta carta de passiva do arquétipo se houver no pool.
// As passivas de arquétipo são tratadas via cartas de assinatura com requer_passiva —
// não há cards de passiva autônomos no reagir, então retorna inalterado.
export function injectPassiveCards(
  cards: Carta[],
  _arquetipo: Arquetipo
): Carta[] {
  return cards
}
