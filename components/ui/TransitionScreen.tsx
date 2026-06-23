'use client'

import { useEffect } from 'react'
import type { BracketEntry } from '@/engine/types'

export type TransitionType = 'match_start' | 'entrevista_start' | 'nova_partida'

const FASE_LABEL: Record<string, string> = {
  grupo:   'Fase de Grupos',
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semi:    'Semifinal',
  final:   'Final',
}

const AUTO_DISMISS_MS: Record<TransitionType, number> = {
  match_start:      3800,
  entrevista_start: 3000,
  nova_partida:     3600,
}

type LastResult = { adversario: string; placarDelta: number }

type Props = {
  type: TransitionType
  bracketEntry: BracketEntry
  partida: number
  lastResult?: LastResult | null
  onDismiss: () => void
}

function ResultadoPartida({ lastResult }: { lastResult: LastResult }) {
  const { adversario, placarDelta } = lastResult
  if (placarDelta > 0) {
    return (
      <div className="flex items-center gap-[12px] mb-[32px]">
        <span
          className="font-headline font-black italic text-[11px] tracking-[0.15em] uppercase text-preto bg-amarelo px-[10px] py-[3px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          Classificado
        </span>
        <span className="font-headline font-bold text-[13px] text-white/60">
          Brasil {placarDelta} × 0 {adversario}
        </span>
      </div>
    )
  }
  if (placarDelta === 0) {
    return (
      <div className="flex items-center gap-[12px] mb-[32px]">
        <span
          className="font-headline font-black italic text-[11px] tracking-[0.15em] uppercase text-white/60 border border-white/30 px-[10px] py-[3px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          Empate
        </span>
        <span className="font-headline font-bold text-[13px] text-white/50">
          Brasil 0 × 0 {adversario}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-[12px] mb-[32px]">
      <span
        className="font-headline font-black italic text-[11px] tracking-[0.15em] uppercase text-white bg-vermelho px-[10px] py-[3px]"
        style={{ transform: 'skewX(-8deg)' }}
      >
        Derrota
      </span>
      <span className="font-headline font-bold text-[13px] text-white/50">
        Brasil 0 × {Math.abs(placarDelta)} {adversario}
      </span>
    </div>
  )
}

export default function TransitionScreen({ type, bracketEntry, partida, lastResult, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS[type])
    return () => clearTimeout(t)
  }, [type, onDismiss])

  if (type === 'match_start') {
    return (
      <button
        onClick={onDismiss}
        className="flex flex-col min-h-screen w-full bg-azul items-center justify-center px-[22px] text-center cursor-pointer select-none overflow-hidden relative"
      >
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-20%', width: '90%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.08 }}
        />

        <span
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase text-white bg-vermelho px-[10px] py-[4px] mb-[28px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          Apita o Árbitro
        </span>

        <p
          className="font-headline font-bold text-[11px] tracking-[0.2em] uppercase mb-[6px]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Brasil vs
        </p>
        <h2 className="font-headline font-black italic text-[46px] leading-[0.85] tracking-[-2px] text-white mb-[18px] uppercase">
          {bracketEntry.adversario}
        </h2>

        <div className="flex items-center gap-[10px] mb-[36px]">
          <span className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase px-[10px] py-[4px] border-2 border-white/30 text-white/70">
            {FASE_LABEL[bracketEntry.fase] ?? bracketEntry.fase}
          </span>
          <span className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase text-white/50">
            P{partida}
          </span>
          <span className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase text-amarelo">
            Alvo +{bracketEntry.alvoVitoria}
          </span>
        </div>

        <div className="flex items-center gap-[20px]">
          <span className="font-headline font-black italic text-[28px] text-white">BRA</span>
          <span
            className="font-headline font-black italic text-[40px] leading-none text-white bg-vermelho px-[16px] py-[4px]"
            style={{ boxShadow: '4px 4px 0 #100F0D' }}
          >
            0 – 0
          </span>
          <span className="font-headline font-black italic text-[28px] text-white/60 uppercase">
            {bracketEntry.adversario.slice(0, 3)}
          </span>
        </div>

        <p className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mt-[48px]"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          toque para jogar
        </p>
      </button>
    )
  }

  if (type === 'entrevista_start') {
    return (
      <button
        onClick={onDismiss}
        className="flex flex-col min-h-screen w-full bg-verde items-center justify-center px-[22px] text-center cursor-pointer select-none overflow-hidden relative"
      >
        <div
          className="absolute bg-white pointer-events-none"
          style={{ top: '-10%', left: '-20%', width: '90%', height: '130%', transform: 'rotate(12deg)', opacity: 0.05 }}
        />

        <span
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase text-white bg-preto px-[10px] py-[4px] mb-[28px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          Fim dos 90 Minutos
        </span>

        <h2 className="font-headline font-black italic text-[52px] leading-[0.85] tracking-[-2px] text-white mb-[12px]">
          Zona<br />Mista
        </h2>

        <p className="font-headline font-bold text-[15px] text-white/70 mb-[8px]">
          A imprensa te espera.
        </p>
        <p className="font-headline font-bold text-[13px] text-white/50">
          Uma pergunta. Pense antes de responder.
        </p>

        <p className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mt-[56px]"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          toque para continuar
        </p>
      </button>
    )
  }

  // nova_partida
  return (
    <button
      onClick={onDismiss}
      className="flex flex-col min-h-screen w-full bg-preto items-center justify-center px-[22px] text-center cursor-pointer select-none overflow-hidden relative"
    >
      <div
        className="absolute bg-amarelo pointer-events-none"
        style={{ top: '-10%', right: '-20%', width: '90%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.06 }}
      />

      {/* Resultado da partida anterior */}
      {lastResult && <ResultadoPartida lastResult={lastResult} />}

      <span
        className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase text-white bg-azul px-[10px] py-[4px] mb-[16px]"
        style={{ transform: 'skewX(-8deg)' }}
      >
        Próxima Partida
      </span>

      <p
        className="font-headline font-bold text-[11px] tracking-[0.2em] uppercase mb-[4px]"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {FASE_LABEL[bracketEntry.fase] ?? bracketEntry.fase}
      </p>

      <h2 className="font-headline font-black italic text-[40px] leading-[0.88] tracking-[-1.5px] text-white mb-[24px] uppercase">
        vs {bracketEntry.adversario}
      </h2>

      <div className="flex items-center gap-[8px] mb-[36px]">
        <span
          className="font-headline font-bold text-[12px] tracking-[0.1em] uppercase text-white/60 border-2 border-white/20 px-[10px] py-[4px]"
        >
          Concentração P{partida}
        </span>
        <span className="font-headline font-bold text-[12px] text-amarelo">
          Alvo +{bracketEntry.alvoVitoria}
        </span>
      </div>

      <p className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase"
        style={{ color: 'rgba(255,255,255,0.25)' }}>
        toque para começar
      </p>
    </button>
  )
}
