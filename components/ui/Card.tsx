'use client'

import { useState } from 'react'
import { useDrag } from '@use-gesture/react'
import clsx from 'clsx'
import type { Arquetipo, Carta, CartaEntrevista, Escolha } from '@/engine/types'

type AnyCard = Carta | CartaEntrevista

function resolveCard(
  card: AnyCard,
  arquetipo: Arquetipo
): { texto: string; esquerda: Escolha; direita: Escolha } {
  if (card.fase === 'entrevista') {
    const c = card as CartaEntrevista
    const v = c.variantes[arquetipo]
    return { texto: v.pergunta, esquerda: v.esquerda, direita: v.direita }
  }
  const c = card as Carta
  return { texto: c.texto, esquerda: c.esquerda, direita: c.direita }
}

function EfeitoChips({ efeitos }: { efeitos: Escolha['efeitos'] }) {
  const labels: Record<string, string> = {
    torcida: 'Tor',
    midia: 'Míd',
    moral: 'Mor',
    fisico: 'Fís',
    placar: 'Plc',
  }
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(efeitos).map(([k, v]) => {
        if (v === 'condicional') return null
        if (typeof v !== 'number') return null
        return (
          <span
            key={k}
            className={clsx(
              'text-[10px] font-bold px-1.5 py-0.5 rounded',
              v > 0 ? 'bg-verde/15 text-verde' : 'bg-vermelho/15 text-vermelho'
            )}
          >
            {labels[k] ?? k} {v > 0 ? `+${v}` : v}
          </span>
        )
      })}
    </div>
  )
}

const DRAG_THRESHOLD = 72

export default function Card({
  card,
  arquetipo,
  onChoice,
  disabled = false,
}: {
  card: AnyCard
  arquetipo: Arquetipo
  onChoice: (lado: 'esquerda' | 'direita') => void
  disabled?: boolean
}) {
  const [dragX, setDragX] = useState(0)
  const [confirming, setConfirming] = useState<'esquerda' | 'direita' | null>(null)

  const { texto, esquerda, direita } = resolveCard(card, arquetipo)

  function choose(lado: 'esquerda' | 'direita') {
    if (disabled || confirming) return
    setConfirming(lado)
    setTimeout(() => {
      onChoice(lado)
      setDragX(0)
      setConfirming(null)
    }, 280)
  }

  const bind = useDrag(
    ({ movement: [mx], last, cancel }) => {
      if (disabled || confirming) { cancel?.(); return }
      if (!last) {
        setDragX(mx)
      } else {
        if (mx < -DRAG_THRESHOLD) {
          choose('esquerda')
        } else if (mx > DRAG_THRESHOLD) {
          choose('direita')
        } else {
          setDragX(0)
        }
      }
    },
    { axis: 'x', filterTaps: true }
  )

  const isDraggingLeft = dragX < -24
  const isDraggingRight = dragX > 24
  const isDragging = isDraggingLeft || isDraggingRight

  const rotate = dragX * 0.04
  const tx = confirming === 'esquerda' ? -320 : confirming === 'direita' ? 320 : dragX * 0.35

  return (
    <div className="flex flex-col flex-1 select-none">
      {/* Card */}
      <div
        {...bind()}
        className={clsx(
          'flex-1 mx-4 rounded-2xl p-6 flex flex-col justify-between',
          'shadow-lg cursor-grab active:cursor-grabbing touch-none',
          isDraggingLeft && !confirming ? 'bg-vermelho/8' :
          isDraggingRight && !confirming ? 'bg-verde/8' : 'bg-white',
          confirming && 'opacity-0',
          disabled && 'pointer-events-none opacity-60'
        )}
        style={{
          transform: `translateX(${tx}px) rotate(${rotate}deg)`,
          transition: isDragging ? 'background-color 0.1s' : 'transform 0.28s ease, background-color 0.1s, opacity 0.22s',
        }}
      >
        <p className="font-headline font-bold italic text-xl leading-snug text-preto">
          {texto}
        </p>

        <div className="flex gap-3 mt-6">
          {/* Hint esquerda */}
          <div
            className={clsx(
              'flex-1 rounded-xl border-2 p-3 transition-all duration-150',
              isDraggingLeft
                ? 'border-vermelho bg-vermelho/10 opacity-100'
                : 'border-gray-200 opacity-35'
            )}
          >
            <p className="text-xs font-medium text-preto leading-tight">← {esquerda.texto}</p>
            <EfeitoChips efeitos={esquerda.efeitos} />
          </div>

          {/* Hint direita */}
          <div
            className={clsx(
              'flex-1 rounded-xl border-2 p-3 transition-all duration-150',
              isDraggingRight
                ? 'border-verde bg-verde/10 opacity-100'
                : 'border-gray-200 opacity-35'
            )}
          >
            <p className="text-xs font-medium text-preto leading-tight text-right">{direita.texto} →</p>
            <EfeitoChips efeitos={direita.efeitos} />
          </div>
        </div>
      </div>

      {/* Botões de toque (fallback acessível) */}
      <div className="flex gap-3 px-4 pt-3 pb-6">
        <button
          onClick={() => choose('esquerda')}
          disabled={disabled || !!confirming}
          className={clsx(
            'flex-1 py-3 px-2 rounded-xl border-2 font-headline font-bold text-sm transition-colors',
            'border-vermelho text-vermelho hover:bg-vermelho/8 active:bg-vermelho/15',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          ← {esquerda.texto}
        </button>
        <button
          onClick={() => choose('direita')}
          disabled={disabled || !!confirming}
          className={clsx(
            'flex-1 py-3 px-2 rounded-xl border-2 font-headline font-bold text-sm transition-colors',
            'border-verde text-verde hover:bg-verde/8 active:bg-verde/15',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {direita.texto} →
        </button>
      </div>
    </div>
  )
}
