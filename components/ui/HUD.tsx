import clsx from 'clsx'
import type { RunState, BracketEntry } from '@/engine/types'
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
    <div className="bg-azul text-white px-4 pt-2 pb-4 shadow-lg">
      <PhaseHeader
        fase={state.fase}
        adversario={bracketEntry.adversario}
        partida={state.partidaAtual}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="font-headline font-black text-base tracking-[0.12em] text-amarelo">
          BRASIL
        </span>

        {state.fase === 'reagir' && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 tracking-widest uppercase">Placar</span>
            <span
              className={clsx(
                'font-headline font-black text-2xl leading-none',
                placar > 0 ? 'text-verde' : placar < 0 ? 'text-vermelho' : 'text-white/50'
              )}
            >
              {placar > 0 ? `+${placar}` : placar}
            </span>
          </div>
        )}
      </div>

      <Bars barras={state.barras} />
    </div>
  )
}
