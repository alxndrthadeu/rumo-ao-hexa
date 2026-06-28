'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/lib/useTheme'

const BARRAS = ['Torcida', 'Mídia', 'Moral', 'Físico']

export default function Home() {
  const router = useRouter()
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    localStorage.removeItem('rtt_session_id')
    try {
      const raw = localStorage.getItem('rtt_active_run')
      if (!raw) return
      const active = JSON.parse(raw)
      if (active?.sessionId) setActiveSession(active.sessionId)
    } catch {}
  }, [])

  const isPixel = theme === 'pixel16'

  return (
    <div className="min-h-screen bg-papel flex flex-col">
      {/* ── Cover ── */}
      <div className="relative bg-azul px-[22px] pt-[52px] pb-[40px] overflow-hidden">
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.12 }}
        />

        {/* Botão de tema — canto superior direito */}
        <button
          onClick={toggle}
          title={isPixel ? 'Mudar para Revista' : 'Mudar para Pixel 16-bit'}
          className="absolute top-[14px] right-[14px] z-10 flex items-center gap-[6px] px-[10px] py-[6px] border-2 border-white/25 text-white/70 hover:border-white/50 hover:text-white transition-colors"
          style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 700 }}
        >
          {isPixel ? (
            <>
              <span style={{ fontSize: '13px' }}>📰</span>
              <span className="font-headline uppercase">Revista</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '13px' }}>👾</span>
              <span className="font-headline uppercase">Pixel</span>
            </>
          )}
        </button>

        <p
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase mb-[10px]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Edição especial · Copa do Mundo 2026
        </p>
        <div className="inline-block mb-[16px]">
          <span
            className="font-headline font-black italic text-white bg-vermelho px-[18px] py-[2px] inline-block text-[96px] leading-[0.78] tracking-[-3px]"
            style={{ boxShadow: '5px 5px 0 #100F0D' }}
          >
            26
          </span>
        </div>
        <h1
          className="font-headline font-black italic text-[38px] leading-[0.86] tracking-[-1.5px]"
          style={{ color: 'var(--color-amarelo)', textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
        >
          Rumo ao Hexa<br />Brasil!
        </h1>
        <p
          className="font-headline font-bold text-[14px] mt-[10px]"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          7 jogos. 1 craque. 1 vida só.
        </p>
      </div>

      {/* ── Run ativa ── */}
      {activeSession && (
        <div className="mx-[15px] mt-[18px] bg-amarelo/20 border-2 border-amarelo px-[14px] py-[10px] flex items-center justify-between gap-3">
          <div>
            <p className="font-headline font-bold text-[13px] text-preto">Run em andamento</p>
            <p className="text-[12px] text-preto/60 mt-[1px]">Continuar de onde parou?</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => router.push(`/jogar/${activeSession}`)}
              className="px-[12px] py-[7px] bg-verde text-white font-headline font-black text-[12px]"
              style={{ boxShadow: '2px 2px 0 #100F0D' }}
            >
              Continuar
            </button>
            <button
              onClick={() => { localStorage.removeItem('rtt_active_run'); setActiveSession(null) }}
              className="px-[10px] py-[7px] border-2 border-preto/30 text-preto/50 font-headline font-bold text-[11px]"
            >
              Abandonar
            </button>
          </div>
        </div>
      )}

      {/* ── Pitch editorial ── */}
      <div className="px-[15px] pt-[28px] pb-[6px]">
        <div className="border-t-[3px] border-preto pt-[16px]">
          <p className="font-headline font-black italic text-[22px] leading-[1.1] tracking-[-0.5px] text-preto mb-[12px]">
            Você veste a camisa.<br />Cada escolha é sua.
          </p>
          <p className="text-[14px] leading-[1.55] text-preto/70">
            Do Grupo à Final, você toma decisões antes do apito, nos 90 minutos e na coletiva pós-jogo. Cada resposta move quatro forças — e basta uma delas chegar ao limite para a Copa acabar.
          </p>

          <div className="flex flex-wrap gap-[6px] mt-[16px]">
            {BARRAS.map(b => (
              <span
                key={b}
                className="font-headline font-bold text-[10px] tracking-[0.08em] uppercase px-[9px] py-[4px] border-2 border-preto/20 text-preto/55"
              >
                {b}
              </span>
            ))}
          </div>

          <p className="text-[12px] leading-[1.4] text-preto/45 mt-[14px]">
            Escolha seu arquétipo — Estrela, Craque Caído ou Promessa — e enfrente a Copa do Mundo 2026 do seu jeito.
          </p>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="px-[15px] pt-[24px] pb-[40px] flex flex-col gap-[10px]">
        <Link
          href="/arquetipo"
          className="w-full text-center block font-headline font-black italic text-[22px] tracking-[0.5px] text-white py-[13px] bg-verde"
          style={{ boxShadow: '4px 4px 0 #100F0D' }}
        >
          Escolher Arquétipo →
        </Link>

        <Link
          href="/historico"
          className="w-full text-center block font-headline font-black italic text-[18px] tracking-[0.3px] text-amarelo py-[13px] bg-preto"
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}
        >
          Histórico de Runs →
        </Link>

        <Link
          href="/como-jogar"
          className="w-full text-center block font-headline font-bold text-[13px] text-preto/45 py-[10px] hover:text-preto/70 transition-colors"
        >
          Primeira vez? Veja o guia →
        </Link>
      </div>

      {/* ── Crédito de tema ── */}
      <div className="px-[15px] pb-[20px] text-center">
        <p className="text-[10px] tracking-[0.12em] uppercase text-preto/30">
          {isPixel ? '👾 Pixel 16-bit' : '📰 Tema Revista'}
        </p>
      </div>
    </div>
  )
}
