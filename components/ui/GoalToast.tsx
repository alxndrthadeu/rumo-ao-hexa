'use client'

import { useEffect, useState } from 'react'

export type GoalEvent = {
  scored: boolean
  minuto: number
  nome: string
}

export default function GoalToast({ event, onDone }: { event: GoalEvent; onDone: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true))
    const hide = setTimeout(() => setVisible(false), 1800)
    const done = setTimeout(onDone, 2200)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(hide)
      clearTimeout(done)
    }
  }, [onDone])

  if (event.scored) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
        style={{ transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }}
      >
        <div
          className="bg-amarelo px-[28px] py-[20px] text-center"
          style={{ boxShadow: '6px 6px 0 #100F0D' }}
        >
          <p className="font-headline font-black italic text-[11px] tracking-[0.25em] uppercase text-preto/60 mb-[2px]">
            Gol do Brasil!
          </p>
          <p className="font-headline font-black italic text-[40px] leading-none tracking-[-1px] text-preto">
            {event.nome.toUpperCase()}
          </p>
          <p className="font-headline font-bold text-[13px] text-preto/60 mt-[4px]">
            {event.minuto}'
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
      style={{ transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }}
    >
      <div
        className="bg-preto px-[28px] py-[20px] text-center border-2 border-vermelho"
        style={{ boxShadow: '6px 6px 0 #5a0000' }}
      >
        <p className="font-headline font-black italic text-[11px] tracking-[0.25em] uppercase text-vermelho mb-[2px]">
          Adversário marca
        </p>
        <p className="font-headline font-black italic text-[34px] leading-none tracking-[-1px] text-white">
          {event.minuto}'
        </p>
      </div>
    </div>
  )
}
