import type { Arquetipo, Carta, ClasseInimigo } from './types'
import { advanceSeed, seedToFloat } from './rng'

// Substitui 1 carta genérica por 1 carta aleatória da classe do adversário.
// O deck de entrada mantém o mesmo tamanho.
export function injectClassCards(
  base: Carta[],
  classeCards: Carta[],
  seed: number
): { cards: Carta[]; seed: number } {
  if (classeCards.length === 0 || base.length === 0) return { cards: base, seed }

  // Escolhe qual carta da classe injetar
  const s1 = advanceSeed(seed)
  const classIdx = Math.floor(seedToFloat(s1) * classeCards.length)
  const classCard = classeCards[classIdx]

  // Substitui a primeira carta genérica (índice 0 — posição de maior visibilidade)
  const result = [classCard, ...base.slice(1)]
  return { cards: result, seed: s1 }
}

// Injeta carta de passiva do arquétipo se houver no pool.
// Por ora retorna inalterado — passivas de conteúdo chegam na Sprint 5.
export function injectPassiveCards(
  cards: Carta[],
  _arquetipo: Arquetipo
): Carta[] {
  return cards
}

// Regra especial de Evolução: toda carta "talento" garante uma carta "brecha" na mesma partida.
// Identifica por convenção de id: *_talento_* → agenda *_brecha_* correspondente.
export function injectEvolucaoPair(
  cards: Carta[],
  seed: number
): { cards: Carta[]; seed: number } {
  // Sem cartas de evolução no deck desta sprint — lógica completa na Sprint 5
  return { cards, seed }
}
