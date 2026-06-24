'use client'

import { useEffect, useRef, useState } from 'react'
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

function buildMensagem(state: RunState): { titulo: string; subtitulo: string } {
  const { causaMorte, barraMorte } = state

  if (causaMorte === 'vitoria') {
    return { titulo: 'HEXA!', subtitulo: 'Campeão do Mundo.' }
  }
  if (causaMorte === 'expulsao') {
    return { titulo: 'EXPULSO', subtitulo: 'Cartão vermelho. A Copa acabou aqui.' }
  }
  if (causaMorte === 'placar') {
    return { titulo: 'ELIMINADO', subtitulo: 'Placar insuficiente. A jornada termina aqui.' }
  }
  if (causaMorte === 'barra' && barraMorte) {
    const barra = BARRA_LABEL[barraMorte.barra] ?? barraMorte.barra
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { titulo, subtitulo } = buildMensagem(state)
  const isVitoria = state.causaMorte === 'vitoria'
  const code = seedCode(state.initialSeed)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    timerRef.current = setTimeout(onDone, 3200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onDone])

  function handleCopySeed(e: React.MouseEvent) {
    e.stopPropagation()
    // Para o auto-dismiss para o jogador ter tempo de copiar
    if (timerRef.current) clearTimeout(timerRef.current)
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={onDone}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-[22px] cursor-pointer select-none"
      style={{
        background: isVitoria ? 'var(--color-amarelo)' : 'var(--color-preto)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {!isVitoria && (
        <span
          className="font-headline font-black italic text-[10px] tracking-[0.25em] uppercase text-white/40 mb-[20px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          Fim de Jogo
        </span>
      )}

      <h1
        className="font-headline font-black italic leading-none tracking-[-3px] mb-[16px]"
        style={{
          fontSize: isVitoria ? '80px' : '64px',
          color: isVitoria ? 'var(--color-preto)' : 'var(--color-amarelo)',
          textShadow: isVitoria ? '4px 4px 0 rgba(0,0,0,0.15)' : '4px 4px 0 rgba(255,203,5,0.2)',
        }}
      >
        {titulo}
      </h1>

      <p
        className="font-headline font-bold text-[16px] leading-[1.3]"
        style={{ color: isVitoria ? 'rgba(16,15,13,0.7)' : 'rgba(255,255,255,0.6)' }}
      >
        {subtitulo}
      </p>

      {/* Seed da run — para compartilhamento */}
      <button
        onClick={handleCopySeed}
        className="mt-[40px] flex flex-col items-center gap-[4px] group"
        aria-label="Copiar seed da run"
      >
        <span
          className="font-headline font-black italic text-[22px] tracking-[0.12em] transition-opacity"
          style={{ color: isVitoria ? 'rgba(16,15,13,0.5)' : 'rgba(255,255,255,0.35)' }}
        >
          {code}
        </span>
        <span
          className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase transition-opacity"
          style={{ color: isVitoria ? 'rgba(16,15,13,0.3)' : 'rgba(255,255,255,0.2)' }}
        >
          {copied ? 'COPIADO!' : 'SEED · TOQUE PARA COPIAR'}
        </span>
      </button>

      <p
        className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mt-[24px]"
        style={{ color: isVitoria ? 'rgba(16,15,13,0.35)' : 'rgba(255,255,255,0.25)' }}
      >
        toque para ver seu legado
      </p>
    </button>
  )
}
