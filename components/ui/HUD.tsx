'use client'

import { useState } from 'react'
import clsx from 'clsx'
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
      <div className="bg-azul text-white px-[14px] pt-[11px] pb-[12px]">
        {/* Linha superior: fase + partida/adversário + minuto + histórico */}
        <div className="flex items-center justify-between mb-[3px]">
          <PhaseHeader
            fase={state.fase}
            adversario={bracketEntry.adversario}
            partida={state.partidaAtual}
          />
          <div className="flex items-center gap-[10px]">
            {minuto && (
              <span className="font-headline font-black italic text-[15px] leading-none text-amarelo">
                {minuto}
              </span>
            )}
            {/* Badge de tokens — clique abre painel */}
            <button
              onClick={() => setShowTokens(true)}
              className={clsx(
                'flex items-center gap-[4px] font-headline font-bold text-[10px] tracking-[0.06em] px-[7px] py-[3px] transition-colors',
                totalTokens > 0
                  ? 'bg-amarelo text-preto'
                  : 'bg-white/10 text-white/40'
              )}
              title="Ver tokens de bônus"
            >
              <span>⬡</span>
              <span>{totalTokens}</span>
            </button>
            {/* Código da run */}
            <span
              className="font-headline font-bold text-[8px] tracking-[0.08em] text-white/25 select-all"
              title={`Seed da run: ${state.initialSeed}`}
            >
              {seedCode(state.initialSeed)}
            </span>
            {/* Link do jornal */}
            {sessionId && state.fase !== 'planejar' && (
              <Link
                href={`/historico/${sessionId}`}
                className="font-headline font-bold text-[9px] tracking-[0.12em] uppercase text-white/40 border border-white/20 px-[7px] py-[3px] hover:text-white/70 hover:border-white/40 transition-colors"
              >
                Edições
              </Link>
            )}
          </div>
        </div>

        {/* Linha do jogador + placar */}
        <div className="flex items-center gap-[8px] mb-[11px]">
          <span className="font-headline font-black italic text-[22px] leading-none text-white/40 shrink-0">
            #{state.camisa}
          </span>
          <span className="font-headline font-black italic text-[22px] tracking-[-0.5px] leading-none truncate">
            {state.nomeJogador.toUpperCase()}
          </span>
        </div>

        {/* 4 mini-barras horizontais */}
        <Bars barras={state.barras} preview={previewEfeitos} />
      </div>

      {showTokens && (
        <TokenPanel
          tokens={state.tokens}
          onClose={() => setShowTokens(false)}
        />
      )}
    </>
  )
}
