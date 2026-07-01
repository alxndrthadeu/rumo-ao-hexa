'use client'

import { useEffect, useState } from 'react'
import type { RunState } from '@/engine/types'

function seedCode(seed: number): string {
  return seed.toString(16).toUpperCase().padStart(8, '0').slice(-8)
}

const BARRA_LABEL: Record<string, string> = {
  torcida: 'Torcida',
  midia:   'Mídia',
  moral:   'Moral',
  fisico:  'Físico',
}

const ARQUETIPO_LABEL: Record<string, string> = {
  estrela: 'A Estrela do Momento',
  caido:   'O Craque Caído',
  futuro:  'O Futuro do País',
}

function buildMensagem(state: RunState): { titulo: string; subtitulo: string } {
  const { causaMorte, barraMorte } = state

  if (causaMorte === 'vitoria') {
    return { titulo: 'HEXA!', subtitulo: 'Campeão do Mundo.' }
  }
  if (causaMorte === 'placar') {
    return { titulo: 'ELIMINADO', subtitulo: 'Placar insuficiente. A jornada termina aqui.' }
  }
  if (causaMorte === 'penaltis') {
    return { titulo: 'ELIMINADO', subtitulo: 'A Copa termina nas penalidades. Tão perto, tão longe.' }
  }
  if (causaMorte === 'barra' && barraMorte) {
    const barra   = BARRA_LABEL[barraMorte.barra] ?? barraMorte.barra
    const extremo = barraMorte.extreme === 'min' ? 'zerou' : 'estourou'
    return { titulo: 'ELIMINADO', subtitulo: `${barra} ${extremo}. Você perdeu o controle.` }
  }
  return { titulo: 'FIM DE JOGO', subtitulo: 'A Copa acabou para você.' }
}

export default function GameOverScreen({
  state,
  onDone,
}: {
  state: RunState
  onDone: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const { titulo, subtitulo } = buildMensagem(state)
  const isVitoria = state.causaMorte === 'vitoria'
  const code = seedCode(state.initialSeed)

  const totalJogos = state.historicoPartidas.length
  const totalGols  = state.historicoPartidas.reduce((s, r) => s + r.golsBrasil, 0)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleCopySeed(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-[22px] select-none overflow-hidden"
      style={{
        background: 'var(--color-hud)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div className="fx-scan" />

      {/* Badge */}
      <span
        className="font-headline font-black italic text-[9px] tracking-[0.3em] uppercase mb-[18px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.35, display: 'inline-block', transform: 'skewX(-8deg)' }}
      >
        {isVitoria ? 'Copa do Mundo 2026' : 'Fim de Jogo'}
      </span>

      {/* Big result */}
      <h1
        className="font-headline font-black italic leading-none tracking-[-3px]"
        style={{
          fontSize: isVitoria ? '86px' : '68px',
          color: isVitoria ? 'var(--color-accent)' : 'var(--color-vermelho)',
          textShadow: `4px 4px 0 color-mix(in srgb, var(--color-line) 40%, transparent)`,
        }}
      >
        {titulo}
      </h1>

      {/* Subtitle */}
      <p
        className="font-headline font-bold text-[15px] leading-[1.35] text-center mt-[10px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.6, maxWidth: '280px' }}
      >
        {subtitulo}
      </p>

      {/* Divider */}
      <div className="w-[48px] mt-[28px] mb-[24px]" style={{ height: '2px', background: 'var(--color-hud-ink)', opacity: 0.15 }} />

      {/* Player identity */}
      <p
        className="font-headline font-black italic text-[22px] tracking-[-0.5px] leading-none"
        style={{ color: 'var(--color-hud-ink)' }}
      >
        #{state.camisa} {state.nomeJogador}
      </p>
      <p
        className="font-headline font-bold text-[11px] tracking-[0.15em] uppercase mt-[6px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.45 }}
      >
        {ARQUETIPO_LABEL[state.arquetipo] ?? state.arquetipo}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-[16px] mt-[14px]">
        <div className="flex flex-col items-center gap-[2px]">
          <span
            className="font-headline font-black italic text-[26px] leading-none"
            style={{ color: 'var(--color-hud-ink)' }}
          >
            {totalJogos}
          </span>
          <span
            className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
          >
            {totalJogos === 1 ? 'Jogo' : 'Jogos'}
          </span>
        </div>
        <div style={{ width: '1px', height: '32px', background: 'var(--color-hud-ink)', opacity: 0.2 }} />
        <div className="flex flex-col items-center gap-[2px]">
          <span
            className="font-headline font-black italic text-[26px] leading-none"
            style={{ color: 'var(--color-hud-ink)' }}
          >
            {totalGols}
          </span>
          <span
            className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
          >
            {totalGols === 1 ? 'Gol' : 'Gols'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[48px] mt-[28px] mb-[20px]" style={{ height: '2px', background: 'var(--color-hud-ink)', opacity: 0.15 }} />

      {/* Seed */}
      <button
        onClick={handleCopySeed}
        className="flex flex-col items-center gap-[4px] mb-[28px]"
        aria-label="Copiar seed da run"
      >
        <span
          className="font-headline font-black italic text-[20px] tracking-[0.12em]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
        >
          {code}
        </span>
        <span
          className="font-headline font-bold text-[7px] tracking-[0.2em] uppercase"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.25 }}
        >
          {copied ? 'COPIADO!' : 'SEED · TOQUE PARA COPIAR'}
        </span>
      </button>

      {/* CTA */}
      <button
        onClick={onDone}
        className="font-headline font-black italic text-[14px] tracking-[0.08em] uppercase px-[32px] py-[14px] active:scale-[0.97] transition-transform"
        style={{
          background: isVitoria ? 'var(--color-accent)' : 'var(--color-hud-ink)',
          color: isVitoria ? 'var(--color-accent-ink)' : 'var(--color-hud)',
          borderRadius: '4px',
          letterSpacing: '0.05em',
        }}
      >
        Ver meu legado →
      </button>
    </div>
  )
}
