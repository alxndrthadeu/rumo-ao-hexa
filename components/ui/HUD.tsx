'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BracketEntry, Efeitos, RunState } from '@/engine/types'
import Bars from './Bars'
import PhaseHeader from './PhaseHeader'
import TokenPanel from './TokenPanel'
import { REAGIR_MINUTO_LABEL } from '@/lib/match-constants'

function seedCode(seed: number): string {
  return seed.toString(16).toUpperCase().padStart(8, '0').slice(-8)
}

export default function HUD({
  state,
  bracketEntry,
  sessionId,
  previewEfeitos,
}: {
  state: RunState
  bracketEntry: BracketEntry
  sessionId?: string
  previewEfeitos?: Efeitos | null
}) {
  const [showTokens, setShowTokens] = useState(false)
  const minuto = state.fase === 'reagir'
    ? (REAGIR_MINUTO_LABEL[state.cartasRestantes.length] ?? "90'")
    : null

  const totalTokens = Object.values(state.tokens).reduce((s, n) => s + n, 0)

  return (
    <>
      <div
        className="px-[14px] pt-[11px] pb-[12px]"
        style={{ background: 'var(--color-hud)', color: 'var(--color-hud-ink)' }}
      >
        {/* Linha 1: badge de fase + direita (minuto, tokens, seed, edições) */}
        <div className="flex items-start justify-between gap-[8px] mb-[6px]">
          <PhaseHeader
            fase={state.fase}
            adversario={bracketEntry.adversario}
            partida={state.partidaAtual}
          />

          <div className="flex items-center gap-[8px] shrink-0">
            {/* Minuto (só em reagir) */}
            {minuto && (
              <span
                className="font-headline font-black text-[14px] leading-none"
                style={{ color: 'var(--color-accent)' }}
              >
                {minuto}
              </span>
            )}

            {/* Badge de tokens */}
            {totalTokens > 0 ? (
              <button
                onClick={() => setShowTokens(true)}
                className="flex items-center gap-[4px] font-headline font-bold text-[10px] tracking-[0.06em] uppercase px-[8px] py-[3px]"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-ink)',
                  border: 'var(--border-w) solid var(--color-accent)',
                }}
                title="Ver tokens de bônus"
              >
                <span className="font-black text-[12px] leading-none">◆</span>
                <span>{totalTokens}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowTokens(true)}
                className="flex items-center gap-[4px] font-headline font-bold text-[9px] tracking-[0.06em] uppercase px-[7px] py-[3px] transition-colors"
                style={{
                  border: 'var(--border-w) solid var(--color-hud-ink)',
                  color: 'var(--color-hud-ink)',
                  opacity: 0.3,
                }}
                title="Ver tokens de bônus"
              >
                <span className="text-[10px] leading-none">◆</span>
                <span>0</span>
              </button>
            )}

            {/* Seed */}
            <span
              className="font-headline font-bold text-[8px] tracking-[0.08em] select-all"
              style={{ color: 'var(--color-hud-ink)', opacity: 0.25 }}
              title={`Seed da run: ${state.initialSeed}`}
            >
              {seedCode(state.initialSeed)}
            </span>

            {/* Link do jornal */}
            {sessionId && state.fase === 'planejar' && (
              <Link
                href={`/historico/${sessionId}`}
                className="font-headline font-bold text-[9px] tracking-[0.12em] uppercase px-[7px] py-[3px] transition-colors hover:opacity-70"
                style={{
                  color: 'var(--color-hud-ink)',
                  border: 'var(--border-w) solid var(--color-hud-ink)',
                  opacity: 0.4,
                }}
              >
                Edições
              </Link>
            )}
          </div>
        </div>

        {/* Linha 2: confronto Brasil × Adversário + camisa/nome do jogador */}
        <div className="flex items-baseline justify-between gap-[8px] mb-[11px]">
          <div className="font-headline font-black text-[18px] leading-none truncate" style={{ letterSpacing: '-0.3px' }}>
            Brasil{' '}
            <span style={{ opacity: 0.4 }}>×</span>{' '}
            <span style={{ color: 'var(--color-accent)' }}>{bracketEntry.adversario}</span>
          </div>
          <span
            className="font-headline font-bold text-[10px] tracking-[0.06em] shrink-0"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.45 }}
          >
            #{state.camisa} {state.nomeJogador.toUpperCase()}
          </span>
        </div>

        {/* Barras */}
        <Bars barras={state.barras} preview={previewEfeitos} />
      </div>

      {/* Régua de acento (3px) — separa HUD do conteúdo */}
      <div className="h-[3px] w-full" style={{ background: 'var(--color-accent)' }} />

      {showTokens && (
        <TokenPanel
          tokens={state.tokens}
          onClose={() => setShowTokens(false)}
        />
      )}
    </>
  )
}
