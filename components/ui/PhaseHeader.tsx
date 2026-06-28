import type { Fase } from '@/engine/types'

// Badge usa accent (amarelo) em concentração, verde em jogo/entrevista, vermelho em pênaltis
const BADGE: Record<Fase, { label: string; bg: string; ink: string }> = {
  planejar:   { label: 'Concentração', bg: 'var(--color-accent)',   ink: 'var(--color-accent-ink)' },
  reagir:     { label: '90 Min',       bg: 'var(--color-verde)',    ink: '#fff' },
  entrevista: { label: 'Zona Mista',   bg: 'var(--color-verde)',    ink: '#fff' },
  penaltis:   { label: 'Pênaltis',     bg: 'var(--color-vermelho)', ink: '#fff' },
}

export default function PhaseHeader({
  fase,
  adversario,
  partida,
}: {
  fase: Fase
  adversario?: string
  partida: number
}) {
  const { label, bg, ink } = BADGE[fase]
  const context = fase === 'reagir' && adversario
    ? adversario.toUpperCase()
    : `P${partida}`

  return (
    <div className="flex items-center gap-[8px]">
      <span
        className="font-headline font-black text-[10px] tracking-[0.1em] uppercase px-[8px] py-[3px] shrink-0"
        style={{ background: bg, color: ink }}
      >
        {label}
      </span>
      <span
        className="font-headline font-bold text-[9px] tracking-[0.15em] uppercase truncate"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.65 }}
      >
        {context}
      </span>
    </div>
  )
}
