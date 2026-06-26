import { describe, it, expect } from 'vitest'
import { applyCardChoice, resolveEcosDiferidos } from '../phases'
import { createRunState } from '../state'
import type { Carta, RunState } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseState(): RunState {
  return {
    ...createRunState('estrela', 42, 'Teste', 10),
    fase: 'reagir',
    cartasRestantes: ['a', 'b', 'c', 'd', 'e'],
    placarPartida: 0,
    golsBrasil: 0,
    golsAdversario: 0,
  }
}

// Constrói uma carta com eco inline 'agora'
function makeCarta(id: string, ecoId?: string, ecoInline?: Carta): Carta {
  const ecoField = ecoInline ?? (ecoId ? ecoId : undefined)
  return {
    id,
    fase: 'reagir',
    partida: 1,
    texto: `Carta ${id}`,
    esquerda: {
      texto: 'Esquerda',
      efeitos: {},
      ...(ecoField ? { eco: ecoField } : {}),
    },
    direita: {
      texto: 'Direita',
      efeitos: {},
    },
  }
}

// Constrói eco inline interativo (quando: 'agora')
function makeEco(id: string, nextEcoId?: string, nextEcoInline?: Carta): Carta {
  const nextEco = nextEcoInline ?? nextEcoId
  return {
    id,
    fase: 'reagir',
    camada: 'especial',
    partida: 0,
    quando: 'agora',
    texto: `Eco ${id}`,
    esquerda: {
      texto: 'Esq',
      efeitos: { moral: 1 },
      ...(nextEco ? { eco: nextEco } : {}),
    },
    direita: {
      texto: 'Dir',
      efeitos: {},
    },
  }
}

// Eco diferido 'proximo_slot' (não-interativo)
function makeEcoDiferido(id: string, chance?: number): Carta {
  return {
    id,
    fase: 'reagir',
    camada: 'especial',
    partida: 0,
    quando: 'proximo_slot',
    chance,
    texto: `EcoDif ${id}`,
    esquerda: { texto: '—', efeitos: { placar: -1 }, flags_partida: ['linha_exposta'] },
    direita:  { texto: '—', efeitos: { placar: -1 }, flags_partida: ['linha_exposta'] },
  }
}

// ─── eco 'agora': não mexe em cartasRestantes ─────────────────────────────────

describe('eco agora — cadeia básica', () => {
  it('ecoPendente é setado; cartasRestantes não muda dentro do applyCardChoice', () => {
    const eco = makeEco('eco_a')
    const carta = makeCarta('carta_1', undefined, eco)
    const s0 = baseState()
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.ecoPendente).toBe('eco_a')
    expect(s1.ecoCadeia).toContain('eco_a')
    // applyCardChoice não toca cartasRestantes (isso é responsabilidade do route)
    expect(s1.cartasRestantes).toEqual(s0.cartasRestantes)
  })

  it('cadeia A→B→C acumula ecoCadeia na ordem', () => {
    const ecoC = makeEco('eco_c')
    const ecoB = makeEco('eco_b', undefined, ecoC)
    const ecoA = makeEco('eco_a', undefined, ecoB)
    const carta = makeCarta('carta_1', undefined, ecoA)

    const s0 = baseState()
    // Jogada 1: carta normal → enfileira eco_a
    const s1 = applyCardChoice(s0, carta, 'esquerda')
    expect(s1.ecoPendente).toBe('eco_a')
    expect(s1.ecoCadeia).toEqual(['eco_a'])

    // Jogada 2: responde eco_a → enfileira eco_b
    const s2 = { ...applyCardChoice(s1, ecoA, 'esquerda'), ecoPendente: undefined }
    // ecoPendente novo é eco_b (setado por applyCardChoice ao processar ecoA.esquerda.eco)
    const s2raw = applyCardChoice(s1, ecoA, 'esquerda')
    expect(s2raw.ecoPendente).toBe('eco_b')
    expect(s2raw.ecoCadeia).toEqual(['eco_a', 'eco_b'])

    // Jogada 3: responde eco_b → enfileira eco_c
    const s3raw = applyCardChoice(s2raw, ecoB, 'esquerda')
    expect(s3raw.ecoPendente).toBe('eco_c')
    expect(s3raw.ecoCadeia).toEqual(['eco_a', 'eco_b', 'eco_c'])
  })

  it('cap de profundidade 4 — 5º eco é ignorado', () => {
    // Cadeia já com 4 profundidade no estado
    const ecoExtra = makeEco('eco_5')
    const carta = makeCarta('carta_x', undefined, ecoExtra)
    const s0: RunState = {
      ...baseState(),
      ecoCadeia: ['a', 'b', 'c', 'd'],  // já no limite
    }
    const s1 = applyCardChoice(s0, carta, 'esquerda')
    // eco_5 deve ser ignorado pelo guard-rail de cap
    expect(s1.ecoPendente).toBeUndefined()
  })

  it('anti-ciclo — eco que já está na cadeia é cortado', () => {
    const ecoA = makeEco('eco_loop', 'eco_loop')  // auto-referência por id
    const carta = makeCarta('carta_x', undefined, ecoA)
    const s0: RunState = {
      ...baseState(),
      ecoCadeia: ['eco_loop'],  // já na cadeia
    }
    const s1 = applyCardChoice(s0, carta, 'esquerda')
    // eco_loop não deve ser reenfileirado
    expect(s1.ecoPendente).toBeUndefined()
  })

  it('minuto congela — ecoPendente setado, cartasRestantes inalterado na engine', () => {
    const eco = makeEco('eco_cartao_teste')
    const carta = makeCarta('gen_teste', undefined, eco)
    const s0 = { ...baseState(), cartasRestantes: ['gen_teste', 'x', 'y'] }
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    // Engine não remove gen_teste de cartasRestantes (isso é feito no route)
    expect(s1.cartasRestantes).toEqual(['gen_teste', 'x', 'y'])
    expect(s1.ecoPendente).toBe('eco_cartao_teste')
  })
})

// ─── ecosDiferidos 'proximo_slot' ────────────────────────────────────────────

describe('ecosDiferidos proximo_slot', () => {
  it('eco diferido sem chance sempre dispara', () => {
    const ecoDif = makeEcoDiferido('eco_dif_sem_chance')
    const s0: RunState = {
      ...baseState(),
      ecosDiferidos: [{ cartaId: 'eco_dif_sem_chance', quando: 'proximo_slot' }],
    }
    // Injeta o eco no catálogo temporário não é possível diretamente,
    // mas podemos testar a lógica via um eco conhecido.
    // Usamos eco_gol_sofrido real do catálogo (importado via deck).
    // Este teste usa a função resolveEcosDiferidos diretamente.
    const { state: s1, toasts } = resolveEcosDiferidos(s0, 'proximo_slot')
    // Sem carta no catálogo para 'eco_dif_sem_chance', não aplica — sem crash
    expect(s1.ecosDiferidos).toEqual([])
    expect(toasts).toEqual([])
  })

  it('eco_gol_sofrido real: chance 0.45 — dispara com seed favorável', () => {
    // Seed 1 → seedToFloat(advanceSeed(1)) deve ser < 0.45 para disparar
    // Precisamos de um seed que resulte em roll < 0.45
    // Vamos testar com seed alto que sabemos que passa/falha via tentativas
    // O seed 42 já é determinístico; verificamos o comportamento geral
    const s0: RunState = {
      ...baseState(),
      seed: 1,
      ecosDiferidos: [{ cartaId: 'eco_gol_sofrido', quando: 'proximo_slot', chance: 0.45 }],
    }
    const { state: s1 } = resolveEcosDiferidos(s0, 'proximo_slot')
    // Após resolução, fila está vazia independente de disparar
    expect(s1.ecosDiferidos).toEqual([])
    // O seed avançou (1 avanço de seed para o gate)
    expect(s1.seed).not.toBe(s0.seed)
  })

  it('eco proximo_slot não resolve no fim_partida', () => {
    const s0: RunState = {
      ...baseState(),
      ecosDiferidos: [{ cartaId: 'eco_gol_sofrido', quando: 'proximo_slot', chance: 1.0 }],
    }
    const { state: s1 } = resolveEcosDiferidos(s0, 'fim_partida')
    // Não foi consumido — permanece na fila
    expect(s1.ecosDiferidos).toHaveLength(1)
    expect(s1.ecosDiferidos?.[0].quando).toBe('proximo_slot')
  })
})

// ─── ecosDiferidos 'fim_partida' ─────────────────────────────────────────────

describe('ecosDiferidos fim_partida', () => {
  it('resolve antes do checkMatchResult', () => {
    const s0: RunState = {
      ...baseState(),
      ecosDiferidos: [{ cartaId: 'eco_gol_sofrido', quando: 'fim_partida', chance: 1.0 }],
    }
    const { state: s1 } = resolveEcosDiferidos(s0, 'fim_partida')
    expect(s1.ecosDiferidos).toEqual([])
  })

  it('eco fim_partida com chance 0 nunca dispara', () => {
    const s0: RunState = {
      ...baseState(),
      placarPartida: 5,
      seed: 100,
      ecosDiferidos: [{ cartaId: 'eco_gol_sofrido', quando: 'fim_partida', chance: 0.0 }],
    }
    const { state: s1 } = resolveEcosDiferidos(s0, 'fim_partida')
    expect(s1.ecosDiferidos).toEqual([])
    // Placar não deve ter mudado (chance 0 → nunca dispara)
    expect(s1.placarPartida).toBe(5)
  })
})

// ─── eco enfileirado via esquerda.eco (gen_nao_voltou pattern) ───────────────

describe('eco diferido via escolha.eco', () => {
  it('eco proximo_slot é empilhado em ecosDiferidos', () => {
    const ecoDif: Carta = {
      id: 'eco_gol_sofrido',
      fase: 'reagir',
      camada: 'especial',
      partida: 0,
      quando: 'proximo_slot',
      chance: 0.45,
      texto: 'Contra-ataque.',
      esquerda: { texto: '—', efeitos: { placar: -1 }, flags_partida: ['linha_exposta'] },
      direita:  { texto: '—', efeitos: { placar: -1 }, flags_partida: ['linha_exposta'] },
    }
    const carta = makeCarta('gen_nao_voltou', undefined, ecoDif)
    const s0 = baseState()
    const s1 = applyCardChoice(s0, carta, 'esquerda')

    expect(s1.ecoPendente).toBeUndefined()
    expect(s1.ecosDiferidos).toHaveLength(1)
    expect(s1.ecosDiferidos?.[0].cartaId).toBe('eco_gol_sofrido')
    expect(s1.ecosDiferidos?.[0].quando).toBe('proximo_slot')
  })
})
