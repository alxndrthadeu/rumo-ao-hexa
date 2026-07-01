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
    <div
      className="flex flex-col overflow-hidden bg-papel"
      style={{ height: '100dvh' }}
    >
      {/* ── Cover ── */}
      <div
        className="relative bg-azul px-[20px] overflow-hidden shrink-0"
        style={{
          paddingTop: 'max(24px, env(safe-area-inset-top))',
          paddingBottom: '22px',
        }}
      >
        {/* Diagonal amarelo */}
        <div
          className="absolute pointer-events-none bg-amarelo"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.09 }}
        />

        {/* Toggle de tema */}
        <button
          onClick={toggle}
          title={isPixel ? 'Mudar para Revista' : 'Mudar para Pixel 16-bit'}
          className="absolute z-10 flex items-center gap-[5px] px-[9px] py-[5px] border border-white/20 text-white/55 hover:border-white/40 hover:text-white transition-colors font-headline uppercase"
          style={{
            top: 'max(12px, calc(env(safe-area-inset-top) + 6px))',
            right: '14px',
            fontSize: 'var(--home-chips)',
            letterSpacing: '0.1em',
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: '12px' }}>{isPixel ? '📰' : '👾'}</span>
          {isPixel ? 'Revista' : 'Pixel'}
        </button>

        {/* Eyebrow */}
        <p
          className="font-headline font-black italic uppercase mb-[10px]"
          style={{ fontSize: 'var(--home-chips)', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)' }}
        >
          Edição especial · Copa do Mundo 2026
        </p>

        {/* "26" badge + título lado a lado */}
        <div className="flex items-center gap-[14px]">
          <div
            className="shrink-0 bg-vermelho px-[10px] py-[2px]"
            style={{ boxShadow: 'var(--card-shadow)' }}
          >
            <span
              className="font-headline font-black italic text-white block"
              style={{
                fontSize: 'var(--home-badge)',
                lineHeight: '0.82',
                letterSpacing: isPixel ? '0' : '-4px',
              }}
            >
              26
            </span>
          </div>
          <h1
            className="font-headline font-black"
            style={{
              fontSize: 'var(--home-h1)',
              fontStyle: 'var(--head-style)',
              lineHeight: isPixel ? '1.6' : '0.88',
              letterSpacing: 'var(--head-track)',
              color: 'var(--color-amarelo)',
              textShadow: '2px 2px 0 rgba(0,0,0,0.35)',
            }}
          >
            Rumo ao<br />Hexa Brasil!
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="font-headline font-bold mt-[10px]"
          style={{ fontSize: 'var(--home-tagline)', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}
        >
          7 jogos. 1 craque. 1 vida só.
        </p>
      </div>

      {/* ── Run ativa ── */}
      {activeSession && (
        <div className="mx-[15px] mt-[10px] bg-amarelo/15 border-2 border-amarelo px-[12px] py-[8px] flex items-center justify-between gap-3 shrink-0">
          <div>
            <p
              className="font-headline font-bold"
              style={{ fontSize: 'var(--home-body-sm)', color: 'var(--color-ink)', lineHeight: '1.5' }}
            >
              Run em andamento
            </p>
            <p
              style={{ fontSize: 'var(--home-body-sm)', color: 'var(--color-ink)', opacity: 0.55, lineHeight: '1.5', marginTop: '2px' }}
            >
              Continuar de onde parou?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => router.push(`/jogar/${activeSession}`)}
              className="bg-verde text-white font-headline font-black px-[11px] py-[6px]"
              style={{ fontSize: 'var(--home-body-sm)', boxShadow: 'var(--btn-shadow)' }}
            >
              Continuar
            </button>
            <button
              onClick={() => { localStorage.removeItem('rtt_active_run'); setActiveSession(null) }}
              className="border font-headline font-bold px-[9px] py-[6px]"
              style={{
                fontSize: 'var(--home-body-sm)',
                borderColor: 'color-mix(in srgb, var(--color-line) 35%, transparent)',
                color: 'var(--color-ink)',
                opacity: 0.5,
              }}
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {/* ── Pitch ── */}
      <div className="px-[15px] flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
        <div
          className="border-t-[3px] pt-[16px]"
          style={{ borderColor: 'var(--color-line)' }}
        >
          <p
            className="font-headline font-black italic mb-[12px]"
            style={{ fontSize: 'var(--home-pitch-h)', lineHeight: '1.15', letterSpacing: 'var(--head-track)', color: 'var(--color-ink)' }}
          >
            Você veste a camisa.<br />Cada escolha é sua.
          </p>

          <p
            style={{ fontSize: 'var(--home-body)', lineHeight: '1.55', color: 'var(--color-ink)', opacity: 0.65, marginBottom: '12px' }}
          >
            Do Grupo à Final, você toma decisões antes do apito, nos 90 minutos e na coletiva pós-jogo. Cada resposta move quatro forças — e basta uma delas chegar ao limite para a Copa acabar.
          </p>

          <div className="flex flex-wrap gap-[6px] mb-[11px]">
            {BARRAS.map(b => (
              <span
                key={b}
                className="font-headline font-bold uppercase border px-[8px] py-[3px]"
                style={{
                  fontSize: 'var(--home-chips)',
                  letterSpacing: '0.08em',
                  borderColor: 'color-mix(in srgb, var(--color-line) 28%, transparent)',
                  color: 'var(--color-ink)',
                  opacity: 0.55,
                }}
              >
                {b}
              </span>
            ))}
          </div>

          <p
            style={{ fontSize: 'var(--home-body-sm)', lineHeight: '1.5', color: 'var(--color-ink)', opacity: 0.42 }}
          >
            Escolha seu arquétipo — Estrela, Craque Caído ou Promessa — e enfrente a Copa do Mundo 2026 do seu jeito.
          </p>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div
        className="px-[15px] flex flex-col gap-[8px] shrink-0"
        style={{
          paddingTop: '14px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <Link
          href="/arquetipo"
          className="w-full text-center block font-headline font-black text-white py-[12px] bg-verde"
          style={{
            fontStyle: 'var(--head-style)',
            fontSize: 'var(--home-cta-main)',
            letterSpacing: '0.05em',
            boxShadow: 'var(--btn-shadow)',
            lineHeight: isPixel ? '1.6' : '1',
          }}
        >
          Escolher Arquétipo →
        </Link>

        <Link
          href="/historico"
          className="w-full text-center block font-headline font-black text-amarelo py-[10px]"
          style={{
            fontStyle: 'var(--head-style)',
            fontSize: 'var(--home-cta-sec)',
            letterSpacing: '0.03em',
            background: 'var(--color-hud)',
            boxShadow: 'var(--btn-shadow)',
            lineHeight: isPixel ? '1.6' : '1',
          }}
        >
          Histórico de Runs →
        </Link>

        <Link
          href="/como-jogar"
          className="w-full text-center block font-headline font-bold py-[8px]"
          style={{
            fontSize: 'var(--home-cta-ter)',
            color: 'var(--color-ink)',
            opacity: 0.38,
            lineHeight: isPixel ? '1.6' : '1',
          }}
        >
          Primeira vez? Veja o guia →
        </Link>
      </div>
    </div>
  )
}
