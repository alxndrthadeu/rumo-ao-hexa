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

const EFFECT_LABELS: Record<string, string> = {
  torcida: 'Tor', midia: 'Míd', moral: 'Mor', fisico: 'Fís', placar: 'Plc',
}

function Chip({ label, value, isFlag }: { label: string; value?: number; isFlag?: boolean }) {
  if (isFlag) {
    return (
      <span className="font-headline font-bold text-[10px] tracking-[0.03em] px-[7px] py-[3px] bg-vermelho text-white whitespace-nowrap">
        {label}
      </span>
    )
  }
  if (value === undefined) return null
  return (
    <span
      className={clsx(
        'font-headline font-bold text-[10px] tracking-[0.03em] px-[7px] py-[3px] whitespace-nowrap',
        value > 0 ? 'bg-verde text-white' : 'bg-vermelho text-white'
      )}
    >
      {EFFECT_LABELS[label] ?? label} {value > 0 ? `+${value}` : value}
    </span>
  )
}

function EfeitosRow({ escolha }: { escolha: Escolha }) {
  const chips: React.ReactNode[] = []
  Object.entries(escolha.efeitos).forEach(([k, v]) => {
    if (typeof v === 'number') chips.push(<Chip key={k} label={k} value={v} />)
  })
  escolha.flags_partida?.slice(0, 1).forEach(f =>
    chips.push(<Chip key={`flag-${f}`} label={f.replace(/_/g, ' ')} isFlag />)
  )
  if (chips.length === 0) return null
  return <div className="flex flex-wrap gap-[4px] mt-[6px]">{chips}</div>
}

const DRAG_THRESHOLD = 80

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
    }, 260)
  }

  const bind = useDrag(
    ({ movement: [mx], last, cancel }) => {
      if (disabled || confirming) { cancel?.(); return }
      if (!last) {
        setDragX(mx)
      } else {
        if (mx < -DRAG_THRESHOLD) choose('esquerda')
        else if (mx > DRAG_THRESHOLD) choose('direita')
        else setDragX(0)
      }
    },
    { axis: 'x', filterTaps: true }
  )

  const isDraggingLeft  = dragX < -24
  const isDraggingRight = dragX > 24
  const tx = confirming === 'esquerda' ? -360 : confirming === 'direita' ? 360 : dragX * 0.35
  const rot = dragX * 0.04

  return (
    <div className="flex flex-col flex-1 select-none">
      {/* Carta arrastável */}
      <div
        {...bind()}
        className="flex-1 mx-[15px] flex flex-col justify-between bg-papel border-2 border-preto cursor-grab active:cursor-grabbing touch-none"
        style={{
          transform: `translateX(${tx}px) rotate(${rot}deg)`,
          transition: Math.abs(dragX) > 0 ? 'none' : 'transform 0.26s ease, opacity 0.22s',
          opacity: confirming ? 0 : 1,
          boxShadow: isDraggingLeft
            ? `inset 3px 0 0 var(--color-vermelho)`
            : isDraggingRight
            ? `inset -3px 0 0 var(--color-verde)`
            : undefined,
        }}
      >
        {/* Texto da carta */}
        <div className="px-[15px] pt-[18px] pb-[14px]">
          <p className="font-headline font-bold italic text-[19px] leading-[1.25] tracking-[-0.3px] text-preto text-center">
            {texto}
          </p>
        </div>

        {/* Escolhas */}
        <div>
          {/* Esquerda */}
          <div
            className={clsx(
              'border-t-2 border-preto px-[12px] py-[11px] flex items-start gap-[10px]',
              isDraggingLeft ? 'bg-vermelho/10' : 'bg-white'
            )}
          >
            <span className="font-headline font-black italic text-[17px] text-vermelho leading-none mt-[1px] shrink-0">←</span>
            <div className="flex-1">
              <p className="text-[14px] leading-[1.2] font-medium text-preto">{esquerda.texto}</p>
              <EfeitosRow escolha={esquerda} />
            </div>
          </div>
          {/* Direita */}
          <div
            className={clsx(
              'border-t-2 border-preto px-[12px] py-[11px] flex items-start gap-[10px]',
              isDraggingRight ? 'bg-verde/10' : 'bg-white'
            )}
          >
            <div className="flex-1 text-right">
              <p className="text-[14px] leading-[1.2] font-medium text-preto">{direita.texto}</p>
              <div className="flex flex-wrap gap-[4px] mt-[6px] justify-end">
                {Object.entries(direita.efeitos).map(([k, v]) =>
                  typeof v === 'number' ? <Chip key={k} label={k} value={v} /> : null
                )}
                {direita.flags_partida?.slice(0, 1).map(f =>
                  <Chip key={`flag-${f}`} label={f.replace(/_/g, ' ')} isFlag />
                )}
              </div>
            </div>
            <span className="font-headline font-black italic text-[17px] text-verde leading-none mt-[1px] shrink-0">→</span>
          </div>
        </div>
      </div>

      {/* Hint swipe */}
      <p className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase text-center mt-[14px] mb-[4px]"
         style={{ color: 'var(--color-tinta-2, #4B4A45)' }}>
        ← arrasta para escolher →
      </p>

      {/* Botões fallback acessíveis */}
      <div className="flex gap-[9px] px-[15px] pb-[20px] pt-[6px]">
        <button
          onClick={() => choose('esquerda')}
          disabled={disabled || !!confirming}
          className="flex-1 min-h-[44px] border-2 border-preto bg-white font-headline font-bold italic text-[13px] text-vermelho tracking-[0.3px] hover:bg-vermelho hover:text-white transition-colors disabled:opacity-40"
          style={{ boxShadow: '3px 3px 0 #100F0D' }}
        >
          ← {esquerda.texto}
        </button>
        <button
          onClick={() => choose('direita')}
          disabled={disabled || !!confirming}
          className="flex-1 min-h-[44px] border-2 border-preto bg-white font-headline font-bold italic text-[13px] text-verde tracking-[0.3px] hover:bg-verde hover:text-white transition-colors disabled:opacity-40"
          style={{ boxShadow: '3px 3px 0 #100F0D' }}
        >
          {direita.texto} →
        </button>
      </div>
    </div>
  )
}
