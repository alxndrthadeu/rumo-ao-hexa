'use client'

import { useEffect } from 'react'
import type { BracketEntry } from '@/engine/types'

export type TransitionType = 'match_start' | 'entrevista_start' | 'nova_partida' | 'penaltis_start'

const FASE_LABEL: Record<string, string> = {
  grupo:   'Fase de Grupos',
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semi:    'Semifinal',
  final:   'Final',
}

const AUTO_DISMISS_MS: Record<TransitionType, number> = {
  match_start:      3800,
  entrevista_start: 3200,
  nova_partida:     3600,
  penaltis_start:   3200,
}

type LastResult = {
  adversario: string
  placarDelta: number
  golsBrasil?: number
  golsAdversario?: number
  viaPenaltis?: boolean
}

type Props = {
  type: TransitionType
  bracketEntry: BracketEntry
  partida: number
  initialPlacar?: number
  lastResult?: LastResult | null
  onDismiss: () => void
}

// Overlay de gramado listrado — visível apenas no tema Pixel 16-bit via --fx-scan
function GramadoOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent 0 30px, rgba(255,255,255,.04) 30px 60px)',
        display: 'var(--fx-scan)',
      }}
    />
  )
}

// Shell compartilhado: fundo --color-hud, fullscreen, centralizado
function HudScreen({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col h-[100dvh] w-full items-center justify-center px-[22px] text-center cursor-pointer select-none overflow-hidden relative"
      style={{ background: 'var(--color-hud)' }}
    >
      <GramadoOverlay />
      {children}
    </button>
  )
}

// Badge skewed — accent (default) ou custom bg/ink
function SkewBadge({
  label,
  bg = 'var(--color-accent)',
  ink = 'var(--color-accent-ink)',
  className = '',
}: {
  label: string
  bg?: string
  ink?: string
  className?: string
}) {
  return (
    <span
      className={`font-headline font-black italic text-[10px] tracking-[0.2em] uppercase px-[10px] py-[4px] ${className}`}
      style={{ background: bg, color: ink, transform: 'skewX(-8deg)', display: 'inline-block' }}
    >
      {label}
    </span>
  )
}

// Placar minimalista BRA n — n ADV (match_start usa 0—0 fixo)
function PlacarLine({ bra, adv, adversario }: { bra: number; adv: number; adversario: string }) {
  const advAbrev = adversario.slice(0, 3).toUpperCase()
  return (
    <div className="flex items-baseline gap-[6px]">
      <span className="font-headline font-black italic text-[14px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.55 }}>BRA</span>
      <span className="font-headline font-black italic text-[44px] leading-none tracking-[-2px]" style={{ color: 'var(--color-accent)' }}>
        {bra}
      </span>
      <span className="font-headline font-black italic text-[24px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.3 }}>—</span>
      <span className="font-headline font-black italic text-[44px] leading-none tracking-[-2px]" style={{ color: 'var(--color-accent)' }}>
        {adv}
      </span>
      <span className="font-headline font-black italic text-[14px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}>{advAbrev}</span>
    </div>
  )
}

// Resultado da partida anterior (entrevista_start / nova_partida)
function BadgeResultado({
  adversario,
  alvoVitoria,
  empateValido,
  golsBrasil,
  golsAdversario,
}: {
  adversario: string
  alvoVitoria: number
  empateValido: boolean
  golsBrasil?: number
  golsAdversario?: number
}) {
  const bra = Math.floor((golsBrasil ?? 0) / alvoVitoria)
  const adv = Math.floor((golsAdversario ?? 0) / alvoVitoria)
  const isVitoria = bra > adv
  const isEmpate  = !isVitoria && bra === adv && empateValido
  const advAbrev = adversario.slice(0, 3).toUpperCase()

  const scoreLine = (
    <span
      className="font-headline font-black italic text-[28px] leading-none tracking-[-1px]"
      style={{ color: 'var(--color-hud-ink)', opacity: 0.8 }}
    >
      BRA {bra} — {adv} {advAbrev}
    </span>
  )

  if (isVitoria) {
    return (
      <div className="flex flex-col items-center gap-[8px] mb-[28px]">
        <SkewBadge label={empateValido ? 'Vitória' : 'Classificado'} />
        {scoreLine}
      </div>
    )
  }

  if (isEmpate) {
    return (
      <div className="flex flex-col items-center gap-[8px] mb-[28px]">
        <span
          className="font-headline font-black italic text-[11px] tracking-[0.15em] uppercase px-[12px] py-[4px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.7, border: 'var(--border-w) solid', transform: 'skewX(-8deg)', display: 'inline-block' }}
        >
          Empate
        </span>
        {scoreLine}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-[8px] mb-[28px]">
      <SkewBadge label="Derrota" bg="var(--color-vermelho)" ink="#fff" />
      {scoreLine}
    </div>
  )
}

// ─── TransitionScreen ────────────────────────────────────────────────────────

export default function TransitionScreen({
  type,
  bracketEntry,
  partida,
  lastResult,
  onDismiss,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS[type])
    return () => clearTimeout(t)
  }, [type, onDismiss])

  // ── match_start ────────────────────────────────────────────────────────────

  if (type === 'match_start') {
    return (
      <HudScreen onClick={onDismiss}>
        {/* Badge da fase */}
        <div className="animate-fade-up-1 mb-[28px]">
          <SkewBadge label={FASE_LABEL[bracketEntry.fase] ?? bracketEntry.fase} />
        </div>

        {/* Brasil */}
        <p
          className="animate-fade-up-2 font-headline font-black italic text-[18px] tracking-[0.25em] uppercase mb-[6px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.75 }}
        >
          Brasil
        </p>

        {/* VERSUS */}
        <p
          className="animate-fade-up-2 font-headline font-bold text-[11px] tracking-[0.3em] uppercase mb-[8px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}
        >
          versus
        </p>

        {/* Adversário */}
        <h2
          className="animate-fade-up-3 font-headline font-black italic text-[46px] leading-[0.85] tracking-[-2px] uppercase mb-[28px]"
          style={{ color: 'var(--color-accent)' }}
        >
          {bracketEntry.adversario}
        </h2>

        {/* Placar inicial 0—0 */}
        <div className="animate-fade-up-3">
          <PlacarLine bra={0} adv={0} adversario={bracketEntry.adversario} />
        </div>

        {/* Filete + hint */}
        <div className="animate-fade-up-4 flex flex-col items-center gap-[16px] mt-[36px]">
          <div className="h-[2px] w-[64px]" style={{ background: 'var(--color-hud-ink)', opacity: 0.2 }} />
          <p
            className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.3 }}
          >
            Apita o Árbitro · Toque para jogar
          </p>
        </div>
      </HudScreen>
    )
  }

  // ── penaltis_start ─────────────────────────────────────────────────────────

  if (type === 'penaltis_start') {
    return (
      <HudScreen onClick={onDismiss}>
        <div className="mb-[28px]">
          <SkewBadge label="Mata-mata" bg="var(--color-accent)" ink="var(--color-accent-ink)" />
        </div>

        <h2
          className="font-headline font-black italic text-[72px] leading-[0.82] tracking-[-3px] mb-[18px]"
          style={{ color: 'var(--color-accent)' }}
        >
          PÊN<br />ALTIS
        </h2>

        <p className="font-headline font-bold text-[13px] mb-[4px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.5 }}>
          {bracketEntry.adversario}
        </p>
        <p className="font-headline font-bold text-[11px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}>
          A decisão é sua.
        </p>

        <p
          className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mt-[52px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.25 }}
        >
          toque para cobrar
        </p>
      </HudScreen>
    )
  }

  // ── entrevista_start ───────────────────────────────────────────────────────

  if (type === 'entrevista_start') {
    const viaPenaltis = lastResult?.viaPenaltis
    return (
      <HudScreen onClick={onDismiss}>
        {lastResult && !viaPenaltis && (
          <BadgeResultado
            adversario={lastResult.adversario}
            alvoVitoria={bracketEntry.alvoVitoria}
            empateValido={bracketEntry.empateValido}
            golsBrasil={lastResult.golsBrasil}
            golsAdversario={lastResult.golsAdversario}
          />
        )}

        {viaPenaltis && (
          <div className="mb-[28px]">
            <SkewBadge label="Classificado nas Penalidades" />
          </div>
        )}

        <div className="mb-[20px]">
          <SkewBadge
            label={viaPenaltis ? 'Fim dos Pênaltis' : 'Fim dos 90 Minutos'}
            bg="var(--color-line)"
            ink="var(--color-surface)"
          />
        </div>

        <h2
          className="font-headline font-black italic text-[52px] leading-[0.85] tracking-[-2px] mb-[14px]"
          style={{ color: 'var(--color-hud-ink)' }}
        >
          Zona<br />Mista
        </h2>

        <p className="font-headline font-bold text-[15px] mb-[6px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.7 }}>
          A imprensa te espera.
        </p>
        <p className="font-headline font-bold text-[13px]" style={{ color: 'var(--color-hud-ink)', opacity: 0.5 }}>
          Uma pergunta. Pense antes de responder.
        </p>

        <p
          className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mt-[52px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}
        >
          toque para continuar
        </p>
      </HudScreen>
    )
  }

  // ── nova_partida ───────────────────────────────────────────────────────────

  return (
    <HudScreen onClick={onDismiss}>
      <div className="mb-[16px]">
        <SkewBadge label="Próxima Partida" />
      </div>

      {lastResult?.viaPenaltis && (
        <div className="mb-[12px]">
          <SkewBadge label="Classificado nas Penalidades" bg="var(--color-line)" ink="var(--color-surface)" />
        </div>
      )}

      <p
        className="font-headline font-bold text-[11px] tracking-[0.2em] uppercase mb-[4px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
      >
        {FASE_LABEL[bracketEntry.fase] ?? bracketEntry.fase}
      </p>

      <h2
        className="font-headline font-black italic text-[40px] leading-[0.88] tracking-[-1.5px] uppercase mb-[24px]"
        style={{ color: 'var(--color-hud-ink)' }}
      >
        vs {bracketEntry.adversario}
      </h2>

      <span
        className="font-headline font-bold text-[12px] tracking-[0.1em] uppercase px-[10px] py-[4px] mb-[36px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.6, border: 'var(--border-w) solid', borderColor: 'var(--color-hud-ink)', display: 'inline-block' }}
        // opacity on the element affects the border too; use rgba alternative if needed
      >
        Concentração P{partida}
      </span>

      <p
        className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.25 }}
      >
        toque para começar
      </p>
    </HudScreen>
  )
}
