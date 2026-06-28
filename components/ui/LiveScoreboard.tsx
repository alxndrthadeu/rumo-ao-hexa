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
    <div className="bg-preto px-[18px] py-[14px] flex items-center justify-between gap-[12px]">
      {/* Brasil */}
      <div className="text-center min-w-[48px]">
        <p className="font-headline font-black italic text-[20px] leading-none text-white">BRA</p>
        <p className="font-headline font-bold text-[9px] text-white/35 mt-[2px] tracking-[0.05em]">Brasil</p>
      </div>

      {/* Placar + minuto */}
      <div className="flex-1 text-center">
        <div
          key={pulseKey}
          className="font-headline font-black italic text-[48px] leading-none tracking-[-3px] text-white animate-score-pulse"
          style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}
        >
          {bra} — {adv}
        </div>
        <div className="flex items-center justify-center gap-[6px] mt-[5px]">
          {!finalizado && (
            <span
              className="w-[6px] h-[6px] rounded-full bg-vermelho"
              style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
            />
          )}
          <span
            className="font-headline font-black italic text-[14px] tracking-[0.02em]"
            style={{ color: finalizado ? 'rgba(255,255,255,0.4)' : is90 ? 'var(--color-vermelho)' : 'var(--color-amarelo)' }}
          >
            {minuto}
          </span>
        </div>
      </div>

      {/* Adversário */}
      <div className="text-center min-w-[48px]">
        <p className="font-headline font-black italic text-[20px] leading-none text-white/55">
          {advAbrev}
        </p>
        <p className="font-headline font-bold text-[9px] text-white/35 mt-[2px] tracking-[0.05em] truncate max-w-[52px]">
          {adversario}
        </p>
      </div>
    </div>
  )
}
