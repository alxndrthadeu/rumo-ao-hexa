import clsx from 'clsx'
import type { BracketEntry, RunState } from '@/engine/types'
import Bars from './Bars'
import PhaseHeader from './PhaseHeader'

export default function HUD({
  state,
  bracketEntry,
}: {
  state: RunState
  bracketEntry: BracketEntry
}) {
  const placar = state.placarPartida

  return (
    <div className="bg-azul text-white px-[14px] pt-[11px] pb-[12px]">
      {/* Linha superior: fase + partida/adversário */}
      <div className="flex items-center justify-between mb-[3px]">
        <PhaseHeader
          fase={state.fase}
          adversario={bracketEntry.adversario}
          partida={state.partidaAtual}
        />
        {state.fase === 'reagir' && (
          <span
            className="font-headline font-bold text-[9.5px] tracking-[0.15em] uppercase"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            MOM
          </span>
        )}
      </div>

      {/* Linha do placar */}
      <div className="flex items-baseline gap-2 mb-[11px]">
        <span className="font-headline font-black italic text-[27px] tracking-[-0.5px] leading-none">
          BRASIL
        </span>
        {state.fase === 'reagir' && (
          <span
            className={clsx(
              'font-headline font-black italic text-[15px] ml-auto',
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
