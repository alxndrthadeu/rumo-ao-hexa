'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MatchRecord } from '@/engine/types'

const RESULTADO_LABEL: Record<string, string> = {
  vitoria: 'VITÓRIA',
  empate:  'EMPATE',
  derrota: 'DERROTA',
}

const RESULTADO_COR: Record<string, string> = {
  vitoria: 'var(--color-verde)',
  empate:  'var(--color-azul)',
  derrota: 'var(--color-vermelho)',
}

function formatPlacar(delta: number, adversario: string): string {
  const bra = Math.max(0, delta)
  const adv = Math.max(0, -delta)
  return `Brasil ${bra} × ${adv} ${adversario}`
}

export default function JornalScreen({
  record,
  sessionId,
  onDismiss,
}: {
  record: MatchRecord
  sessionId: string
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const resultadoCor = RESULTADO_COR[record.resultado] ?? 'var(--color-preto)'
  const resultadoLabel = RESULTADO_LABEL[record.resultado] ?? record.resultado.toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{
        background: 'var(--color-papel)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
      onClick={onDismiss}
    >
      {/* Cabeçalho */}
      <div className="flex-shrink-0 px-[22px] pt-[48px]">
        <div className="flex items-center justify-between">
          <span
            className="font-headline font-black italic text-[11px] tracking-[0.3em] uppercase"
            style={{ color: 'var(--color-preto)', opacity: 0.5 }}
          >
            Diário da Copa
          </span>
          <span
            className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-preto)', opacity: 0.35 }}
          >
            Edição Nº {record.partida}
          </span>
        </div>

        {/* Linha divisória dupla estilo jornal */}
        <div className="mt-[10px] border-t-4 border-preto" />
        <div className="mt-[2px] border-t border-preto opacity-30" />
      </div>

      {/* Resultado badge */}
      <div className="flex-shrink-0 px-[22px] mt-[20px]">
        <div className="flex items-center gap-[10px]">
          <span
            className="font-headline font-black text-[11px] tracking-[0.25em] uppercase px-[8px] py-[3px]"
            style={{ background: resultadoCor, color: 'var(--color-papel)' }}
          >
            {resultadoLabel}
          </span>
          <span
            className="font-sans text-[12px]"
            style={{ color: 'var(--color-preto)', opacity: 0.5 }}
          >
            {record.fase.toUpperCase()} · {formatPlacar(record.placarDelta, record.adversario)}
          </span>
        </div>
      </div>

      {/* Manchete */}
      <div className="flex-shrink-0 px-[22px] mt-[18px]">
        <h1
          className="font-headline font-black italic leading-[1.05] tracking-[-1.5px]"
          style={{
            fontSize: 'clamp(28px, 8vw, 40px)',
            color: 'var(--color-preto)',
          }}
        >
          {record.manchete}
        </h1>
      </div>

      {/* Linha divisória */}
      <div className="flex-shrink-0 px-[22px] mt-[18px]">
        <div className="border-t border-preto opacity-20" />
      </div>

      {/* Corpo */}
      <div className="flex-shrink-0 px-[22px] mt-[14px]">
        <p
          className="font-sans text-[15px] leading-[1.65]"
          style={{ color: 'var(--color-preto)', opacity: 0.75 }}
        >
          {record.corpo}
        </p>
      </div>

      {/* Flags de destaque */}
      {record.flagsDestaque.length > 0 && (
        <div className="flex-shrink-0 px-[22px] mt-[20px] flex flex-wrap gap-[6px]">
          {record.flagsDestaque.map(flag => (
            <span
              key={flag}
              className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase px-[8px] py-[4px] border border-preto/20"
              style={{ color: 'var(--color-preto)', opacity: 0.5 }}
            >
              #{flag}
            </span>
          ))}
        </div>
      )}

      {/* Espaçador */}
      <div className="flex-1" />

      {/* Linha divisória footer */}
      <div className="flex-shrink-0 px-[22px] mt-[32px]">
        <div className="border-t-2 border-preto" />
      </div>

      {/* Footer: histórico + continuar */}
      <div
        className="flex-shrink-0 px-[22px] py-[32px] flex items-center justify-between"
        onClick={e => e.stopPropagation()}
      >
        <Link
          href={`/historico/${sessionId}`}
          className="font-headline font-bold text-[12px] tracking-[0.1em] uppercase underline underline-offset-4"
          style={{ color: 'var(--color-preto)', opacity: 0.45 }}
        >
          Ver histórico →
        </Link>

        <button
          onClick={onDismiss}
          className="font-headline font-black italic text-[13px] tracking-[0.15em] uppercase px-[20px] py-[12px]"
          style={{ background: 'var(--color-preto)', color: 'var(--color-amarelo)' }}
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
