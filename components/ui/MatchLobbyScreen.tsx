'use client'

import type { BracketEntry, RunState } from '@/engine/types'

const FASE_LABEL: Record<string, string> = {
  grupo:   'Fase de Grupos',
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semi:    'Semifinal',
  final:   'Final',
}

export default function MatchLobbyScreen({
  bracketEntry,
  runState,
  onConfirm,
}: {
  bracketEntry: BracketEntry
  runState: RunState
  onConfirm: () => void
}) {
  return (
    <div className="flex flex-col h-[100dvh] bg-azul relative overflow-hidden">
      <div
        className="absolute bg-amarelo pointer-events-none"
        style={{ top: '-10%', right: '-20%', width: '90%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.06 }}
      />

      <div className="flex flex-col flex-1 items-center justify-center px-[22px] text-center">
        <span
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase text-white bg-vermelho px-[10px] py-[4px] mb-[32px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          Concentração Encerrada
        </span>

        <p
          className="font-headline font-bold text-[11px] tracking-[0.2em] uppercase mb-[6px]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Brasil vs
        </p>

        <h2 className="font-headline font-black italic text-[46px] leading-[0.85] tracking-[-2px] text-white mb-[20px] uppercase">
          {bracketEntry.adversario}
        </h2>

        <div className="flex items-center gap-[10px]">
          <span className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase px-[10px] py-[4px] border-2 border-white/30 text-white/70">
            {FASE_LABEL[bracketEntry.fase] ?? bracketEntry.fase}
          </span>
        </div>
      </div>

      <div className="px-[22px] pb-[44px]">
        <button
          onClick={onConfirm}
          className="w-full bg-amarelo text-preto font-headline font-black italic text-[18px] py-[18px] tracking-[-0.3px]"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
        >
          Ir para o Jogo {runState.partidaAtual} →
        </button>
      </div>
    </div>
  )
}
