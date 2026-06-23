// LCG — parâmetros do Numerical Recipes
const A = 1664525
const C = 1013904223
const M = 2 ** 32

export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return function () {
    state = (A * state + C) >>> 0
    return state / M
  }
}

// Avança o estado LCG uma vez e retorna o novo estado (para manter seed em RunState)
export function advanceSeed(seed: number): number {
  return (A * (seed >>> 0) + C) >>> 0
}

export function seedToFloat(seed: number): number {
  return seed / M
}

export function rollRisk(rng: () => number, chance: number): boolean {
  return rng() < chance
}
