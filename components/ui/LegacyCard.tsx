'use client'

import Link from 'next/link'
import type { Legacy } from '@/engine/types'

const CAUSA_LABEL: Record<string, string> = {
  vitoria: '🏆 Campeão do Mundo',
  placar: '⚽ Eliminado em Campo',
  barra: '💔 Saiu pelo Limite',
}

const NOTA_COR: (nota: number) => string = (nota) => {
  if (nota >= 80) return 'text-verde'
  if (nota >= 60) return 'text-amarelo'
  if (nota >= 40) return 'text-white'
  return 'text-vermelho'
}

export default function LegacyCard({ legacy }: { legacy: Legacy }) {
  const { nota, epitafio, causa, reputacao } = legacy

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-10 bg-azul min-h-screen">
      {/* Nota estilo revista */}
      <div className="flex flex-col items-center mb-8">
        <span className="font-headline font-black text-[10px] tracking-[0.3em] text-amarelo/60 uppercase mb-2">
          Nota Final
        </span>
        <span className={`font-display text-[96px] leading-none ${NOTA_COR(nota)}`}>
          {nota}
        </span>
        <span className="font-headline text-sm text-white/40 tracking-widest mt-1">/ 100</span>
      </div>

      {/* Causa */}
      <span className="font-headline font-bold text-sm tracking-wide text-white/60 uppercase mb-6">
        {CAUSA_LABEL[causa] ?? causa}
      </span>

      {/* Epitáfio */}
      <blockquote className="text-center max-w-xs mb-6">
        <p className="font-headline font-bold italic text-lg leading-snug text-white">
          &ldquo;{epitafio}&rdquo;
        </p>
      </blockquote>

      {/* Reputação */}
      {reputacao !== 'desconhecido' && (
        <div className="mb-10 px-4 py-2 rounded-full border border-amarelo/30 bg-amarelo/10">
          <span className="font-headline font-bold text-xs tracking-widest text-amarelo uppercase">
            {reputacao.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && navigator.share) {
              navigator.share({
                title: 'Rumo ao Hexa',
                text: `Nota ${nota}/100 · "${epitafio}"`,
              }).catch(() => {})
            }
          }}
          className="w-full py-4 rounded-xl bg-amarelo text-preto font-headline font-black text-sm tracking-wide hover:bg-amarelo-2 transition-colors"
        >
          Compartilhar Legado
        </button>

        <Link
          href="/"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('rtt_session_id')
            }
          }}
          className="w-full py-4 rounded-xl border-2 border-white/20 text-white font-headline font-bold text-sm tracking-wide text-center hover:bg-white/10 transition-colors"
        >
          Nova Run
        </Link>
      </div>
    </div>
  )
}
