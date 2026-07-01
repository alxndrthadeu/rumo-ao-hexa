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
                className="font-headline font-black leading-none"
                style={{ fontSize: 'var(--fs-hud-player)', color: 'var(--color-accent)' }}
              >
                {minuto}
              </span>
            )}

            {/* Badge de tokens */}
            {totalTokens > 0 ? (
              <button
                onClick={() => setShowTokens(true)}
                className="flex items-center gap-[4px] font-headline font-bold tracking-[0.06em] uppercase px-[8px] py-[3px]"
                style={{
                  fontSize: 'var(--fs-label)',
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-ink)',
                  border: 'var(--border-w) solid var(--color-accent)',
                }}
                title="Ver tokens de bônus"
              >
                <span className="font-black leading-none">◆</span>
                <span>{totalTokens}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowTokens(true)}
                className="flex items-center gap-[4px] font-headline font-bold tracking-[0.06em] uppercase px-[7px] py-[3px] transition-colors"
                style={{
                  fontSize: 'var(--fs-label)',
                  border: 'var(--border-w) solid var(--color-hud-ink)',
                  color: 'var(--color-hud-ink)',
                  opacity: 0.3,
                }}
                title="Ver tokens de bônus"
              >
                <span className="leading-none">◆</span>
                <span>0</span>
              </button>
            )}

            {/* Seed — oculto no tema pixel (muito largo em Press Start 2P) */}
            <span
              className="font-headline font-bold tracking-[0.08em] select-all"
              style={{
                fontSize: 'var(--fs-label)',
                color: 'var(--color-hud-ink)',
                opacity: 0.25,
                display: 'var(--seed-display)' as React.CSSProperties['display'],
              }}
              title={`Seed da run: ${state.initialSeed}`}
            >
              {seedCode(state.initialSeed)}
            </span>

            {/* Link do jornal — oculto no tema pixel */}
            {sessionId && state.fase === 'planejar' && (
              <Link
                href={`/historico/${sessionId}`}
                className="font-headline font-bold tracking-[0.12em] uppercase px-[7px] py-[3px] transition-colors hover:opacity-70"
                style={{
                  fontSize: 'var(--fs-label)',
                  color: 'var(--color-hud-ink)',
                  border: 'var(--border-w) solid var(--color-hud-ink)',
                  opacity: 0.4,
                  display: 'var(--editions-display)' as React.CSSProperties['display'],
                }}
              >
                Edições
              </Link>
            )}
          </div>
        </div>

        {/* Linha 2: confronto Brasil × Adversário + camisa/nome do jogador */}
        <div className="flex items-baseline justify-between gap-[8px] mb-[11px]">
          <div
            className="font-headline font-black leading-none truncate"
            style={{ fontSize: 'var(--fs-hud-match)', letterSpacing: 'var(--score-tracking)' }}
          >
            Brasil{' '}
            <span style={{ opacity: 0.4 }}>×</span>{' '}
            <span style={{ color: 'var(--color-accent)' }}>{bracketEntry.adversario}</span>
          </div>
          <span
            className="font-headline font-bold tracking-[0.06em] shrink-0"
            style={{ fontSize: 'var(--fs-hud-player)', color: 'var(--color-hud-ink)', opacity: 0.45, display: 'var(--hud-player-display)' as React.CSSProperties['display'] }}
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
