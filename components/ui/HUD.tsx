import clsx from 'clsx'
import Link from 'next/link'
import type { BracketEntry, RunState } from '@/engine/types'
import Bars from './Bars'
import PhaseHeader from './PhaseHeader'

// Minuto simbólico por cartas restantes antes da escolha (5 cartas no deck)
const REAGIR_MINUTO: Record<number, string> = { 5: "15'", 4: "45'", 3: "60'", 2: "88'", 1: "90+'" }

export default function HUD({
  state,
  bracketEntry,
  sessionId,
}: {
  state: RunState
  bracketEntry: BracketEntry
  sessionId?: string
}) {
  const placar = state.placarPartida
  const minuto = state.fase === 'reagir'
    ? (REAGIR_MINUTO[state.cartasRestantes.length] ?? "90'")
    : null

  return (
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
          {/* Link do jornal visível só durante reagir/entrevista — planejar usa o banner */}
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
        <span
          className="font-headline font-black italic text-[22px] leading-none text-white/40 shrink-0"
        >
          #{state.camisa}
        </span>
        <span className="font-headline font-black italic text-[22px] tracking-[-0.5px] leading-none truncate">
          {state.nomeJogador.toUpperCase()}
        </span>
        {state.fase === 'reagir' && (
          <span
            className={clsx(
              'font-headline font-black italic text-[15px] ml-auto shrink-0',
              placar > 0 ? 'text-amarelo' : placar < 0 ? 'text-vermelho' : 'text-white/50'
            )}
          >
            {placar > 0 ? `+${placar}` : placar}
          </span>
        )}
      </div>

      {/* 4 mini-barras horizontais */}
      <Bars barras={state.barras} />
    </div>
  )
}
