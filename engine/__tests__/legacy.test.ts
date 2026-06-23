import { describe, it, expect } from 'vitest'
import { generateLegacy } from '../legacy'
import { createRunState } from '../state'

function makeState(overrides: Partial<Parameters<typeof createRunState>[0] extends never ? never : ReturnType<typeof createRunState>>) {
  return { ...createRunState('estrela', 1, 'Teste', 10), ...overrides }
}

describe('generateLegacy', () => {
  it('campeão + humilde → epitáfio correto', () => {
    const s = makeState({
      causaMorte: 'vitoria',
      morto: true,
      flagsCarreira: { humilde: 3 },
    })
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('agradeceu a todos')
    expect(leg.causa).toBe('vitoria')
  })

  it('campeão + arrogante → epitáfio correto', () => {
    const s = makeState({
      causaMorte: 'vitoria',
      morto: true,
      flagsCarreira: { arrogante: 2 },
    })
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('disse que sempre soube')
  })

  it('eliminado (placar) + ídolo → epitáfio correto', () => {
    const s = makeState({
      causaMorte: 'placar',
      morto: true,
      partidaAtual: 5,
      flagsCarreira: { idolo: 3 },
    })
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('braços do povo')
  })

  it('morte Físico=0 → epitáfio de lesão', () => {
    const s = makeState({
      causaMorte: 'barra',
      morto: true,
      barraMorte: { barra: 'fisico', extreme: 'min' },
      flagsCarreira: {},
    })
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('corpo traiu')
  })

  it('morte Mídia=100 → epitáfio de circo', () => {
    const s = makeState({
      causaMorte: 'barra',
      morto: true,
      barraMorte: { barra: 'midia', extreme: 'max' },
      flagsCarreira: {},
    })
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('novela')
  })

  it('Príncipe + vitória → epitáfio especial', () => {
    const s = {
      ...createRunState('caido', 1, 'Teste', 10),
      causaMorte: 'vitoria' as const,
      morto: true,
      flagsCarreira: { humilde: 1 },
    }
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('Príncipe enfim virou Rei')
  })

  it('Menino + eliminação precoce → epitáfio especial', () => {
    const s = {
      ...createRunState('futuro', 1, 'Teste', 10),
      causaMorte: 'placar' as const,
      morto: true,
      partidaAtual: 2,
      flagsCarreira: {},
    }
    const leg = generateLegacy(s)
    expect(leg.epitafio).toContain('Aos 18')
  })
})
