'use client'

import { useEffect, useRef, useState } from 'react'

const MINUTOS: Record<number, string> = { 5: "15'", 4: "45'", 3: "60'", 2: "88'", 1: "90+'" }

export default function LiveScoreboard({
  golsBrasil,
  golsAdversario,
  adversario,
  cartasRestantes,
  finalizado = false,
}: {
  golsBrasil: number
  golsAdversario: number
  adversario: string
  cartasRestantes: number
  finalizado?: boolean
}) {
  const bra = golsBrasil
  const adv = golsAdversario
  const advAbrev = adversario.slice(0, 3).toUpperCase()
  const minuto = finalizado ? 'FIM' : (MINUTOS[cartasRestantes] ?? "90+'")
  const is90 = !finalizado && cartasRestantes === 1

  const prevBra = useRef(bra)
  const prevAdv = useRef(adv)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    if (bra !== prevBra.current || adv !== prevAdv.current) {
      prevBra.current = bra
      prevAdv.current = adv
      setPulseKey(k => k + 1)
    }
  }, [bra, adv])

  return (
    <div
      className="px-[18px] py-[12px] flex items-center gap-[14px]"
      style={{ background: 'var(--color-line)' }}
    >
      {/* Col 1: AO VIVO indicator */}
      <div className="flex flex-col items-center gap-[4px] min-w-[36px]">
        {!finalizado ? (
          <>
            <span
              className="animate-blink w-[7px] h-[7px] rounded-full"
              style={{ background: 'var(--color-vermelho)' }}
            />
            <span
              className="font-headline font-bold text-[7px] tracking-[0.1em] uppercase"
              style={{ color: 'var(--color-hud-ink)', opacity: 0.55 }}
            >
              Ao Vivo
            </span>
          </>
        ) : (
          <span
            className="font-headline font-bold text-[8px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.3 }}
          >
            Fim
          </span>
        )}
      </div>

      {/* Col 2: Placar BRA n — n ADV */}
      <div className="flex-1 text-center">
        <div
          key={pulseKey}
          className="animate-score-pulse leading-none"
          style={{
            fontFamily: 'var(--font-head)',
            fontStyle: 'var(--head-style)',
            fontWeight: 'var(--head-weight)' as React.CSSProperties['fontWeight'],
            letterSpacing: 'var(--score-tracking)',
          }}
        >
          <span style={{ fontSize: 'var(--fs-score-label)', color: 'var(--color-hud-ink)', opacity: 0.55 }}>BRA </span>
          <span style={{ fontSize: 'var(--fs-score-big)', color: 'var(--color-accent)' }}>{bra}</span>
          <span style={{ fontSize: 'var(--fs-score-sep)', color: 'var(--color-hud-ink)', opacity: 0.35 }}> — </span>
          <span style={{ fontSize: 'var(--fs-score-big)', color: 'var(--color-accent)' }}>{adv}</span>
          <span style={{ fontSize: 'var(--fs-score-label)', color: 'var(--color-hud-ink)', opacity: 0.4 }}> {advAbrev}</span>
        </div>
      </div>

      {/* Col 3: Minuto */}
      <div className="text-center min-w-[36px]">
        <span
          className="font-headline font-black leading-none"
          style={{
            fontStyle: 'var(--head-style)',
            fontSize: 'var(--fs-hud-match)',
            color: finalizado
              ? 'var(--color-hud-ink)'
              : is90
              ? 'var(--color-vermelho)'
              : 'var(--color-accent)',
            opacity: finalizado ? 0.35 : 1,
          }}
        >
          {minuto}
        </span>
      </div>
    </div>
  )
}
