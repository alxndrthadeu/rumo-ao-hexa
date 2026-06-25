'use client'

import { useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import clsx from 'clsx'
import type { Arquetipo, Carta, CartaEntrevista, Efeitos, Escolha } from '@/engine/types'

function isCriseCard(card: Carta | CartaEntrevista): boolean {
  return card.fase !== 'entrevista' && (card as Carta).camada === 'crise'
}

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

// Nomes de exibição para tokens
const TOKEN_LABEL: Record<string, string> = {
  ousado:      'Ousado',
  disciplinado:'Disciplina',
  raca:        'Raça',
  frieza:      'Frieza',
  lider:       'Liderança',
}

function TokenBadge({
  token,
  mode,
  available,
}: {
  token: string
  mode: 'earn' | 'spend'
  available?: boolean
}) {
  const label = TOKEN_LABEL[token] ?? token

  if (mode === 'earn') {
    return (
      <span className="inline-flex items-center gap-[3px] font-headline font-bold text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] bg-amarelo text-preto whitespace-nowrap">
        <span>+</span>{label}
      </span>
    )
  }

  // spend
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-[3px] font-headline font-bold text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] whitespace-nowrap',
        available
          ? 'bg-verde text-white'
          : 'bg-preto/20 text-preto/50'
      )}
    >
      <span>{available ? '✓' : '?'}</span>{label}
    </span>
  )
}

function ChoiceFooter({
  escolha,
  tokens,
  className,
}: {
  escolha: Escolha
  tokens: Record<string, number>
  className?: string
}) {
  const earnToken = escolha.concede_token
  const spendToken = escolha.risco?.requer_token

  if (!earnToken && !spendToken) return null

  return (
    <div className={clsx('flex flex-wrap gap-[4px] mt-[5px]', className)}>
      {earnToken && <TokenBadge token={earnToken} mode="earn" />}
      {spendToken && (
        <TokenBadge
          token={spendToken}
          mode="spend"
          available={(tokens[spendToken] ?? 0) > 0}
        />
      )}
    </div>
  )
}

const DRAG_THRESHOLD = 80

export default function Card({
  card,
  arquetipo,
  tokens,
  onChoice,
  onPreview,
  disabled = false,
  showHint = false,
}: {
  card: AnyCard
  arquetipo: Arquetipo
  tokens: Record<string, number>
  onChoice: (lado: 'esquerda' | 'direita') => void
  onPreview?: (efeitos: Efeitos | null) => void
  disabled?: boolean
  showHint?: boolean
}) {
  const [dragX, setDragX] = useState(0)
  const [confirming, setConfirming] = useState<'esquerda' | 'direita' | null>(null)
  const [hintDone, setHintDone] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const { texto, esquerda, direita } = resolveCard(card, arquetipo)

  function choose(lado: 'esquerda' | 'direita') {
    if (disabled || confirming) return
    onPreview?.(null)
    setConfirming(lado)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      onChoice(lado)
      setDragX(0)
      setConfirming(null)
    }, 260)
  }

  const bind = useDrag(
    ({ movement: [mx], last, cancel }) => {
      if (disabled || confirming) { cancel?.(); return }
      // Cancela o hint se o usuário começar a arrastar
      if (showHint && !hintDone) setHintDone(true)
      if (!last) {
        setDragX(mx)
        const preview = mx < -24 ? esquerda.efeitos : mx > 24 ? direita.efeitos : null
        onPreview?.(preview)
      } else {
        if (mx < -DRAG_THRESHOLD) choose('esquerda')
        else if (mx > DRAG_THRESHOLD) choose('direita')
        else { setDragX(0); onPreview?.(null) }
      }
    },
    { axis: 'x', filterTaps: true }
  )

  const isHinting = showHint && !hintDone
  const isDraggingLeft  = dragX < -24
  const isDraggingRight = dragX > 24
  const tx = confirming === 'esquerda' ? -360 : confirming === 'direita' ? 360 : dragX * 0.35
  const rot = dragX * 0.04
  const isCrise = isCriseCard(card)

  return (
    <div className="flex flex-col flex-1 select-none">
      {/* Carta arrastável */}
      <div
        {...bind()}
        className={clsx(
          'flex-1 mx-[15px] flex flex-col justify-between bg-papel cursor-grab active:cursor-grabbing',
          isCrise ? 'border-2 border-vermelho' : 'border-2 border-preto',
          isHinting && 'animate-swipe-hint'
        )}
        onAnimationEnd={() => setHintDone(true)}
        style={{
          touchAction: 'none',
          transform: isHinting ? undefined : `translateX(${tx}px) rotate(${rot}deg)`,
          transition: isHinting || Math.abs(dragX) > 0 ? 'none' : 'transform 0.26s ease, opacity 0.22s',
          opacity: confirming ? 0 : 1,
          boxShadow: isDraggingLeft
            ? `inset 3px 0 0 var(--color-vermelho)`
            : isDraggingRight
            ? `inset -3px 0 0 var(--color-verde)`
            : isCrise
            ? '4px 4px 0 var(--color-vermelho)'
            : undefined,
        }}
      >
        {/* Cabeçalho de crise */}
        {isCrise && (
          <div className="bg-vermelho px-[15px] py-[9px] flex items-center gap-[8px]">
            <span className="font-headline font-black italic text-[11px] tracking-[0.2em] uppercase text-white">
              Crise de Vestiario
            </span>
            <span className="font-headline font-bold text-[10px] text-white/60 ml-auto">
              Segunda chance
            </span>
          </div>
        )}

        {/* Texto da carta */}
        <div className="px-[15px] pt-[18px] pb-[14px]">
          <p className={clsx(
            'font-headline font-bold italic leading-[1.25] tracking-[-0.3px] text-preto text-center',
            isCrise ? 'text-[17px]' : 'text-[19px]'
          )}>
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
              <ChoiceFooter escolha={esquerda} tokens={tokens} />
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
              <ChoiceFooter escolha={direita} tokens={tokens} className="justify-end" />
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
