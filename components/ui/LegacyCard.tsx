'use client'

import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import type { Legacy } from '@/engine/types'

const NOTA_BORDER: Record<string, string> = {
  vitoria: 'border-verde',
  placar:  'border-amarelo',
  barra:   'border-vermelho',
}

const CAUSA_LABEL: Record<string, string> = {
  vitoria: 'Campeão do Mundo',
  placar:  'Placar no Jogo',
  barra:   'Limite de Barra',
}

function formatNota(n: number): string {
  return (n / 10).toFixed(1).replace('.', ',')
}

export default function LegacyCard({ legacy }: { legacy: Legacy }) {
  const { nota, epitafio, causa, reputacao } = legacy
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = `🇧🇷 Rumo ao Hexa — nota ${formatNota(nota)}/10\n"${epitafio}"\n#RumoAoHexa`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Rumo ao Hexa', text }) } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  const borderCor = NOTA_BORDER[causa] ?? 'border-azul'

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-papel px-[15px] pt-[22px] pb-[24px]">
      {/* leg-stamp */}
      <span className="self-center font-display font-black italic text-[12px] tracking-[1px] uppercase text-white bg-vermelho px-[11px] py-[5px]"
        style={{ transform: 'skewX(-8deg)' }}>
        Fim da run
      </span>

      {/* leg-nota */}
      <div
        className={clsx(
          'self-center mt-[14px] mb-[8px] w-[104px] h-[104px] rounded-full border-[5px] bg-white grid place-items-center text-center',
          borderCor
        )}
      >
        <span>
          <b className="font-display font-black text-[38px] leading-[0.9] text-preto block">
            {formatNota(nota)}
          </b>
          <small className="font-headline font-[800] text-[8px] tracking-[1.5px] uppercase block"
            style={{ color: '#4B4A45' }}>
            nota final
          </small>
        </span>
      </div>

      {/* epitaph */}
      <p className="font-headline font-bold italic text-[18px] leading-[1.3] text-center text-preto px-[4px] pb-[14px] tracking-[-0.2px]">
        &ldquo;{epitafio}&rdquo;
      </p>

      {/* leg-meta */}
      <div className="flex justify-between font-headline font-[800] text-[10px] tracking-[1px] uppercase border-t-2 border-b-2 border-preto py-[10px] mb-[14px]"
        style={{ color: '#4B4A45' }}>
        <span>
          Causa
          <b className="text-azul text-[13px] tracking-normal normal-case block mt-[3px]">
            {CAUSA_LABEL[causa] ?? causa}
          </b>
        </span>
        <span className="text-right">
          Reputação
          <b className="text-azul text-[13px] tracking-normal normal-case block mt-[3px]">
            {reputacao.replace(/_/g, ' ')}
          </b>
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={handleShare}
        className="w-full text-center bg-azul text-white font-headline font-black italic text-[22px] tracking-[0.5px] py-[13px] mb-[10px]"
        style={{ boxShadow: '4px 4px 0 #100F0D' }}
      >
        {copied ? 'Copiado!' : 'Compartilhar'}
      </button>

      <Link
        href="/"
        onClick={() => {
          if (typeof window !== 'undefined') localStorage.removeItem('rtt_session_id')
        }}
        className="w-full text-center border-2 border-preto/30 text-preto/60 font-headline font-bold text-[14px] py-[11px]"
      >
        Nova Run
      </Link>
    </div>
  )
}
