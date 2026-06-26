import { describe, it, expect } from 'vitest'
import { applyCardChoice } from '../phases'
import { createRunState } from '../state'
import { advanceSeed, seedToFloat } from '../rng'
import type { Carta, RunState } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseState(seed = 42): RunState {
  return {
    ...createRunState('estrela', seed, 'Teste', 10),
    fase: 'reagir',
    cartasRestantes: ['x'],
    placarPartida: 0,
  }
}

// Determina se um seed faz o risco DISPARAR (roll < chance) ou não
function rollDisparaComSeed(seed: number, chance: number): boolean {
  const newSeed = advanceSeed(seed)
  return seedToFloat(newSeed) < chance
}

// Encontra seed que faça o risco disparar (true) ou não (false)
function seedPara(dispara: boolean, chance: number, maxTries = 2000): number {
  for (let s = 1; s <= maxTries; s++) {
    if (rollDisparaComSeed(s, chance) === dispara) return s
  }
  throw new Error(`Não encontrou seed para dispara=${dispara} chance=${chance}`)
}

function cartaComRisco(opts: {
  chance: number
  requer_token?: string
  efeitos_falha?: object
  flags_falha?: string[]
  niggle?: string
  sucesso_efeitos?: object
  sucesso_flags?: string[]
  sucesso_eco?: string
}): Carta {
  return {
    id: 'carta_risco_test',
    fase: 'reagir',
    partida: 1,
    texto: 'Teste de risco',
    esquerda: {
      texto: 'Direita',
      efeitos: {},
      risco: {
        chance: opts.chance,
        requer_token: opts.requer_token,
        efeitos: opts.efeitos_falha as never ?? {},
        flags_partida: opts.flags_falha,
        niggle: opts.niggle,
        sucesso: (opts.sucesso_efeitos || opts.sucesso_flags || opts.sucesso_eco) ? {
          efeitos: opts.sucesso_efeitos as never,
          flags_partida: opts.sucesso_flags,
          eco: opts.sucesso_eco,
        } : undefined,
      },
    },
    direita: { texto: 'Direita', efeitos: {} },
  }
}

// ─── Risco.sucesso via token ──────────────────────────────────────────────────

describe('Risco.sucesso — token suprime risco', () => {
  it('token consome 1 e aplica sucesso.efeitos', () => {
    const carta = cartaComRisco({
      chance: 0.9,
      requer_token: 'raca',
      efeitos_falha: { fisico: -20 },
      sucesso_efeitos: { placar: 1, moral: 5 },
      sucesso_flags: ['raca'],
    })
    const s0: RunState = { ...baseState(), tokens: { raca: 2 } }
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.tokens['raca']).toBe(1)          // consumiu 1
    expect(s1.placarPartida).toBe(1)             // sucesso.efeitos.placar
    expect(s1.barras.moral).toBeGreaterThan(s0.barras.moral) // sucesso.efeitos.moral
    expect(s1.flagsPartida).toContain('raca')    // sucesso.flags
    expect(s1.barras.fisico).toBe(s0.barras.fisico) // falha não aplicada
  })

  it('sem token → risco dispara com rolagem < chance, não aplica sucesso', () => {
    const seedDispara = seedPara(true, 0.9)
    const carta = cartaComRisco({
      chance: 0.9,
      requer_token: 'raca',
      efeitos_falha: { fisico: -20 },
      sucesso_efeitos: { placar: 1 },
    })
    const s0: RunState = { ...baseState(seedDispara), tokens: {} }
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.barras.fisico).toBeLessThan(s0.barras.fisico) // falha aplicada
    expect(s1.placarPartida).toBe(0)  // sucesso não aplicado
  })
})

// ─── Risco.sucesso via rolagem segura ─────────────────────────────────────────

describe('Risco.sucesso — rolagem não dispara', () => {
  it('rolagem segura aplica sucesso.efeitos', () => {
    const seedSalvo = seedPara(false, 0.5)
    const carta = cartaComRisco({
      chance: 0.5,
      efeitos_falha: { fisico: -15 },
      sucesso_efeitos: { placar: 2, torcida: 8 },
      sucesso_flags: ['heroi'],
    })
    const s0 = baseState(seedSalvo)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.placarPartida).toBe(2)
    expect(s1.flagsPartida).toContain('heroi')
    expect(s1.barras.fisico).toBe(s0.barras.fisico) // falha não aplicada
  })

  it('rolagem dispara → sucesso NÃO é aplicado', () => {
    const seedDispara = seedPara(true, 0.5)
    const carta = cartaComRisco({
      chance: 0.5,
      efeitos_falha: { fisico: -15 },
      sucesso_efeitos: { placar: 2 },
    })
    const s0 = baseState(seedDispara)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.placarPartida).toBe(0)
    expect(s1.barras.fisico).toBeLessThan(s0.barras.fisico)
  })
})

// ─── Risco.niggle ────────────────────────────────────────────────────────────

describe('Risco.niggle', () => {
  it('niggle é adicionado quando risco dispara', () => {
    const seedDispara = seedPara(true, 0.8)
    const carta = cartaComRisco({
      chance: 0.8,
      efeitos_falha: { fisico: -8 },
      niggle: 'divida_lesao',
    })
    const s0 = baseState(seedDispara)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.niggles).toContain('divida_lesao')
  })

  it('niggle NÃO é adicionado quando risco não dispara', () => {
    const seedSalvo = seedPara(false, 0.8)
    const carta = cartaComRisco({
      chance: 0.8,
      efeitos_falha: { fisico: -8 },
      niggle: 'divida_lesao',
    })
    const s0 = baseState(seedSalvo)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.niggles).not.toContain('divida_lesao')
  })

  it('niggle não duplica se já presente', () => {
    const seedDispara = seedPara(true, 0.9)
    const carta = cartaComRisco({
      chance: 0.9,
      efeitos_falha: {},
      niggle: 'divida_lesao',
    })
    const s0: RunState = { ...baseState(seedDispara), niggles: ['divida_lesao'] }
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.niggles.filter(n => n === 'divida_lesao')).toHaveLength(1)
  })
})

// ─── Risco.flags_partida ─────────────────────────────────────────────────────

describe('Risco.flags_partida', () => {
  it('flags de falha são levantadas quando risco dispara', () => {
    const seedDispara = seedPara(true, 0.7)
    const carta = cartaComRisco({
      chance: 0.7,
      efeitos_falha: {},
      flags_falha: ['pavio_curto', 'amarelo'],
    })
    const s0 = baseState(seedDispara)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.flagsPartida).toContain('pavio_curto')
    expect(s1.flagsPartida).toContain('amarelo')
  })

  it('flags de falha NÃO são levantadas quando risco não dispara', () => {
    const seedSalvo = seedPara(false, 0.7)
    const carta = cartaComRisco({
      chance: 0.7,
      efeitos_falha: {},
      flags_falha: ['pavio_curto'],
    })
    const s0 = baseState(seedSalvo)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.flagsPartida).not.toContain('pavio_curto')
  })
})

// ─── sucesso.eco é enfileirado ────────────────────────────────────────────────

describe('Risco.sucesso.eco', () => {
  it('token suprime risco e enfileira sucesso.eco como ecoPendente', () => {
    const carta = cartaComRisco({
      chance: 0.9,
      requer_token: 'ousado',
      efeitos_falha: { placar: -1 },
      sucesso_eco: 'eco_penalti_sofrido',  // existe no catálogo
    })
    const s0: RunState = { ...baseState(), tokens: { ousado: 1 } }
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.tokens['ousado']).toBe(0)
    expect(s1.ecoPendente).toBe('eco_penalti_sofrido')
    expect(s1.ecoCadeia).toContain('eco_penalti_sofrido')
  })

  it('rolagem segura enfileira sucesso.eco', () => {
    const seedSalvo = seedPara(false, 0.55)
    const carta = cartaComRisco({
      chance: 0.55,
      efeitos_falha: { placar: -1 },
      sucesso_eco: 'eco_penalti_sofrido',
    })
    const s0 = baseState(seedSalvo)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.ecoPendente).toBe('eco_penalti_sofrido')
  })

  it('risco dispara → sucesso.eco NÃO é enfileirado', () => {
    const seedDispara = seedPara(true, 0.55)
    const carta = cartaComRisco({
      chance: 0.55,
      efeitos_falha: { placar: -1 },
      sucesso_eco: 'eco_penalti_sofrido',
    })
    const s0 = baseState(seedDispara)
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.ecoPendente).toBeUndefined()
  })
})
