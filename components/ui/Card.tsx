'use client'

import { useEffect, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import clsx from 'clsx'
import type { Arquetipo, Carta, CartaEntrevista, Efeitos, Escolha } from '@/engine/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCriseCard(card: Carta | CartaEntrevista): boolean {
  return card.fase !== 'entrevista' && (card as Carta).camada === 'crise'
}

function getCardNaipe(card: Carta | CartaEntrevista): string | null {
  if (card.fase === 'entrevista') return 'Entrevista'
  const c = card as Carta
  if (c.camada === 'crise')      return null  // handled by crise header
  if (c.camada === 'assinatura') return 'Especial'
  if (c.camada === 'especial')   return 'Especial'
  if (c.naipe === 'ancora')      return 'Âncora'
  if (c.naipe === 'circo')       return 'Circo'
  return null
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

// Resumo textual dos efeitos: "Físico −8 · Placar +1"
function formatEfeitos(efeitos: Efeitos): string {
  const MAP: [keyof Efeitos, string][] = [
    ['torcida', 'Torcida'], ['midia', 'Mídia'],
    ['moral', 'Moral'], ['fisico', 'Físico'], ['placar', 'Placar'],
  ]
  const parts: string[] = []
  for (const [k, label] of MAP) {
    const v = efeitos[k]
    if (typeof v === 'number' && v !== 0) parts.push(`${label} ${v > 0 ? '+' : ''}${v}`)
    else if (v === 'condicional') parts.push('Placar ±')
  }
  return parts.join(' · ')
}

// Nomes de exibição para tokens
const TOKEN_LABEL: Record<string, string> = {
  ousado:       'Ousado',
  disciplinado: 'Disciplina',
  raca:         'Raça',
  frieza:       'Frieza',
  lider:        'Liderança',
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TokenBadge({ token, mode, available }: { token: string; mode: 'earn' | 'spend'; available?: boolean }) {
  const label = TOKEN_LABEL[token] ?? token
  if (mode === 'earn') {
    return (
      <span
        className="inline-flex items-center gap-[3px] font-headline font-bold text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] whitespace-nowrap"
        style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
      >
        ◆ +{label}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-[3px] font-headline font-bold text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] whitespace-nowrap"
      style={available
        ? { background: 'var(--color-verde)', color: '#fff' }
        : { background: 'var(--color-line)', color: 'var(--color-surface)', opacity: 0.4 }
      }
    >
      {available ? '✓' : '?'} {label}
    </span>
  )
}

function EcoBadge() {
  return (
    <span
      className="inline-flex items-center gap-[3px] font-headline font-bold text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] whitespace-nowrap"
      style={{ background: 'var(--color-azul)', color: '#fff' }}
    >
      ⚡ Reação
    </span>
  )
}

// Botão de escolha: aresta colorida à esquerda + chevron + texto + efeitos + badges
function ChoiceButton({
  escolha,
  tokens,
  side,
  onChoose,
  disabled,
  isDragging,
}: {
  escolha: Escolha
  tokens: Record<string, number>
  side: 'esquerda' | 'direita'
  onChoose: () => void
  disabled: boolean
  isDragging: boolean
}) {
  const isLeft = side === 'esquerda'
  const accentColor = isLeft ? 'var(--color-vermelho)' : 'var(--color-verde)'
  const earnToken   = escolha.concede_token
  const spendToken  = escolha.risco?.requer_token
  const hasEco      = !!(escolha.eco || escolha.risco?.sucesso?.eco)
  const efeitosText = formatEfeitos(escolha.efeitos)

  return (
    <button
      onClick={onChoose}
      disabled={disabled}
      className="w-full flex items-center gap-[10px] text-left transition-colors disabled:opacity-40 active:scale-[0.985]"
      style={{
        background: isDragging ? `color-mix(in srgb, ${accentColor} 8%, var(--color-surface))` : 'var(--color-surface)',
        border: `var(--border-w) solid var(--color-line)`,
        borderLeft: `6px solid ${accentColor}`,
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--btn-shadow)',
        padding: '11px 13px',
      }}
    >
      {/* Chevron */}
      <span className="text-[20px] leading-none shrink-0 font-bold" style={{ color: accentColor }}>
        {isLeft ? '‹' : '›'}
      </span>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Texto da escolha */}
        <span
          className="block font-headline font-black leading-tight"
          style={{ color: 'var(--color-ink)', fontSize: 'var(--fs-btn)', fontStyle: 'var(--head-style)', textTransform: 'var(--head-transform)' as React.CSSProperties['textTransform'], letterSpacing: 'var(--head-track)' }}
        >
          {escolha.texto}
        </span>

        {/* Efeitos + badges */}
        <div className="flex flex-wrap items-center gap-[5px] mt-[5px]">
          {efeitosText && (
            <span
              className="font-headline font-bold uppercase leading-none"
              style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-label)', letterSpacing: '0.08em' }}
            >
              {efeitosText}
            </span>
          )}
          {hasEco && <EcoBadge />}
          {earnToken && <TokenBadge token={earnToken} mode="earn" />}
          {spendToken && <TokenBadge token={spendToken} mode="spend" available={(tokens[spendToken] ?? 0) > 0} />}
        </div>
      </div>
    </button>
  )
}

// ─── Card principal ───────────────────────────────────────────────────────────

const DRAG_THRESHOLD = 80

export default function Card({
  card,
  arquetipo,
  tokens,
  onChoice,
  onPreview,
  disabled = false,
  showHint = false,
  isEco = false,
}: {
  card: AnyCard
  arquetipo: Arquetipo
  tokens: Record<string, number>
  onChoice: (lado: 'esquerda' | 'direita') => void
  onPreview?: (efeitos: Efeitos | null) => void
  disabled?: boolean
  showHint?: boolean
  isEco?: boolean
}) {
  const [dragX, setDragX] = useState(0)
  const [confirming, setConfirming] = useState<'esquerda' | 'direita' | null>(null)
  const [hintDone, setHintDone] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timeoutRef.current !== null) clearTimeout(timeoutRef.current) }
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
      if (showHint && !hintDone) setHintDone(true)
      if (!last) {
        setDragX(mx)
        const preview = mx < -24 ? esquerda.efeitos : mx > 24 ? direita.efeitos : null
        onPreview?.(preview)
      } else {
        if (mx < -DRAG_THRESHOLD)      choose('esquerda')
        else if (mx > DRAG_THRESHOLD)  choose('direita')
        else { setDragX(0); onPreview?.(null) }
      }
    },
    { axis: 'x', filterTaps: true, preventScroll: true }
  )

  const isHinting      = showHint && !hintDone
  const isDraggingLeft = dragX < -24
  const isDraggingRight= dragX > 24
  const tx  = confirming === 'esquerda' ? -360 : confirming === 'direita' ? 360 : dragX * 0.35
  const rot = dragX * 0.04
  const isCrise = isCriseCard(card)
  const naipe   = getCardNaipe(card)

  // Cor da borda da carta no estado normal
  const cardBorderColor = isCrise ? 'var(--color-vermelho)'
    : isEco                        ? 'var(--color-azul)'
    :                                'var(--color-line)'

  // Sombra da carta no estado normal
  const cardShadow = isDraggingLeft
    ? `inset 3px 0 0 var(--color-vermelho)`
    : isDraggingRight
    ? `inset -3px 0 0 var(--color-verde)`
    : isCrise
    ? 'var(--card-shadow)'
    : isEco
    ? `0 0 0 3px color-mix(in srgb, var(--color-azul) 25%, transparent), var(--card-shadow)`
    : 'var(--card-shadow)'

  return (
    <div className="flex flex-col flex-1 min-h-0 select-none">

      {/* Wrapper de animação de entrada (eco vem da direita, normal vem de baixo) */}
      <div className={clsx('flex-1 min-h-0 relative', isEco ? 'animate-card-deal-eco' : 'animate-card-deal')}>

        {/* Cartas fantasma (stack visual) */}
        <div
          className="absolute inset-0 mx-[15px] pointer-events-none"
          style={{
            background: 'var(--color-surface)',
            border: `var(--border-w) solid var(--color-line)`,
            borderRadius: 'var(--radius)',
            opacity: 0.35,
            transform: 'rotate(2.4deg)',
            transformOrigin: '50% 110%',
          }}
        />
        <div
          className="absolute inset-0 mx-[15px] pointer-events-none"
          style={{
            background: 'var(--color-surface)',
            border: `var(--border-w) solid var(--color-line)`,
            borderRadius: 'var(--radius)',
            opacity: 0.55,
            transform: 'rotate(-1.6deg) translateY(3px)',
            transformOrigin: '50% 110%',
          }}
        />

        {/* Carta principal arrastável */}
        <div
          {...bind()}
          className={clsx('absolute inset-0 mx-[15px] flex flex-col cursor-grab active:cursor-grabbing', isHinting && 'animate-swipe-hint')}
          onAnimationEnd={() => setHintDone(true)}
          style={{
            background: 'var(--color-surface)',
            border: `var(--border-w) solid ${cardBorderColor}`,
            borderRadius: 'var(--radius)',
            boxShadow: cardShadow,
            touchAction: 'none',
            transformOrigin: '50% 120%',
            transform: isHinting ? undefined : `translateX(${tx}px) rotate(${rot}deg)`,
            transition: isHinting || Math.abs(dragX) > 0 ? 'none' : 'transform 0.26s ease, opacity 0.22s',
            opacity: confirming ? 0 : 1,
          }}
        >
          {/* Header: crise */}
          {isCrise && (
            <div className="flex items-center gap-[8px] px-[15px] py-[9px]" style={{ background: 'var(--color-vermelho)' }}>
              <span className="font-headline font-black text-[11px] tracking-[0.15em] uppercase text-white" style={{ fontStyle: 'var(--head-style)' }}>
                Crise de Vestiário
              </span>
              <span className="font-headline font-bold text-[10px] text-white/60 ml-auto">Segunda chance</span>
            </div>
          )}

          {/* Header: eco */}
          {isEco && !isCrise && (
            <div className="flex items-center gap-[8px] px-[15px] py-[9px]" style={{ background: 'var(--color-azul)' }}>
              <span className="font-headline font-black text-[11px] tracking-[0.15em] uppercase text-white" style={{ fontStyle: 'var(--head-style)' }}>
                ⚡ Reação
              </span>
              <span className="font-headline font-bold text-[10px] text-white/60 ml-auto">Sem custo</span>
            </div>
          )}

          {/* Selo de naipe (âncora, circo, etc.) — só quando não é crise/eco */}
          {!isCrise && !isEco && naipe && (
            <div className="flex items-center justify-between px-[15px] pt-[12px] pb-[4px]">
              <span
                className="font-headline font-bold text-[9px] tracking-[0.12em] uppercase px-[7px] py-[2px]"
                style={{ background: 'var(--color-line)', color: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
              >
                {naipe}
              </span>
            </div>
          )}

          {/* Texto da carta */}
          <div className="flex-1 flex items-center justify-center px-[15px] py-[14px]">
            <p
              className="text-center leading-[var(--body-lh)]"
              style={{
                color: 'var(--color-ink)',
                fontSize: 'var(--fs-body)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {texto}
            </p>
          </div>

          {/* Separador "Arraste para decidir" */}
          <div
            className="flex items-center gap-[8px] px-[15px] pb-[12px]"
            style={{ color: 'var(--color-ink-soft)' }}
          >
            <span className="flex-1 h-[1px] opacity-30" style={{ background: 'var(--color-line)' }} />
            <span className="font-headline font-bold text-[8px] tracking-[0.14em] uppercase">
              Arraste para decidir
            </span>
            <span className="flex-1 h-[1px] opacity-30" style={{ background: 'var(--color-line)' }} />
          </div>
        </div>
      </div>

      {/* Botões de escolha — verticalmente empilhados */}
      <div className="flex flex-col gap-[7px] px-[15px] pb-[18px] pt-[8px]">
        <ChoiceButton
          escolha={esquerda}
          tokens={tokens}
          side="esquerda"
          onChoose={() => choose('esquerda')}
          disabled={disabled || !!confirming}
          isDragging={isDraggingLeft}
        />
        <ChoiceButton
          escolha={direita}
          tokens={tokens}
          side="direita"
          onChoose={() => choose('direita')}
          disabled={disabled || !!confirming}
          isDragging={isDraggingRight}
        />
      </div>
    </div>
  )
}
