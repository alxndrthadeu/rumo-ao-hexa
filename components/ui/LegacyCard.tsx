'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Legacy, MatchRecord } from '@/engine/types'
import bracketData from '@/data/bracket.json'

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  legacy: Legacy
  nomeJogador: string
  camisa: number
  arquetipo: string
  initialSeed: number
  historicoPartidas: MatchRecord[]
  sessionId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ARQUETIPO_LABEL: Record<string, string> = {
  estrela: 'A Estrela do Momento',
  caido:   'O Craque Caído',
  futuro:  'O Futuro do País',
}

const CAUSA_LABEL: Record<string, string> = {
  vitoria:  'Hexacampeão',
  placar:   'Placar insuficiente',
  barra:    'Limite de barra',
  expulsao: 'Expulsão',
  penaltis: 'Pênaltis',
}

const FASE_ABREV: Record<string, string> = {
  oitavas: 'Oit',
  quartas: 'Qua',
  semi:    'Semi',
  final:   'Final',
}

const RESULT_BG: Record<string, string> = {
  vitoria:  'bg-verde',
  empate:   'bg-azul',
  derrota:  'bg-vermelho',
  penaltis: 'bg-amarelo',
}

const RESULT_TEXT: Record<string, string> = {
  vitoria:  'text-white',
  empate:   'text-white',
  derrota:  'text-white',
  penaltis: 'text-preto',
}

function seedCode(seed: number): string {
  return seed.toString(16).toUpperCase().padStart(8, '0').slice(-8)
}

function formatNota(n: number): string {
  return (n / 10).toFixed(1).replace('.', ',')
}

function getNotaLetter(nota: number): string {
  if (nota >= 80) return 'A'
  if (nota >= 60) return 'B'
  if (nota >= 40) return 'C'
  if (nota >= 20) return 'D'
  return 'F'
}

// ─── Nota Seal ───────────────────────────────────────────────────────────────

function NotaSeal({ nota }: { nota: number }) {
  const letter = getNotaLetter(nota)
  return (
    <div
      className="w-[68px] h-[68px] rounded-full flex items-center justify-center font-headline font-black shrink-0"
      style={{
        fontFamily: 'var(--font-head)',
        fontSize: '32px',
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        boxShadow: '0 0 0 5px var(--color-hud), 0 0 0 8px var(--color-accent)',
      }}
    >
      {letter}
    </div>
  )
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({
  jogos,
  gols,
  nota,
}: {
  jogos: number
  gols: number
  nota: number
}) {
  const boxes = [
    { label: 'Jogos',  value: String(jogos),       accent: false },
    { label: 'Gols',   value: String(gols),        accent: false },
    { label: 'Legado', value: formatNota(nota),    accent: true  },
  ]
  return (
    <div className="flex gap-[6px]">
      {boxes.map(({ label, value, accent }) => (
        <div
          key={label}
          className="flex-1 p-[10px]"
          style={accent
            ? { background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }
            : { border: 'var(--border-w) solid var(--color-line)' }
          }
        >
          <p
            className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase mb-[4px]"
            style={{ color: accent ? 'var(--color-accent-ink)' : 'var(--color-hud-ink)', opacity: 0.5 }}
          >
            {label}
          </p>
          <p
            className="font-headline font-black italic text-[22px] leading-none tracking-[-1px]"
            style={{ color: accent ? 'var(--color-accent-ink)' : 'var(--color-hud-ink)' }}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────

type BracketSlot = { partida: number; fase: string; adversario: string }

function Timeline({ historico }: { historico: MatchRecord[] }) {
  const bracket = bracketData as BracketSlot[]

  return (
    <div>
      <p
        className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mb-[9px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
      >
        Jornada pela Copa 2026
      </p>
      <div className="flex gap-[5px]">
        {bracket.map((slot, i) => {
          const record = historico.find(r => r.partida === slot.partida)
          const adv = slot.adversario.slice(0, 3).toUpperCase()
          const fase = slot.fase === 'grupo'
            ? `G${slot.partida}`
            : (FASE_ABREV[slot.fase] ?? slot.fase)

          if (!record) {
            return (
              <div key={i} className="flex-1 min-w-0 text-center">
                <div
                  className="h-[32px] flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--color-line) 35%, transparent)' }}
                >
                  <span
                    className="font-headline font-bold text-[7px]"
                    style={{ color: 'var(--color-hud-ink)', opacity: 0.2 }}
                  >
                    {adv}
                  </span>
                </div>
                <p
                  className="font-headline font-bold text-[6px] mt-[3px] truncate"
                  style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}
                >
                  {fase}
                </p>
              </div>
            )
          }

          const bg   = RESULT_BG[record.resultado]  ?? 'bg-line'
          const text = RESULT_TEXT[record.resultado] ?? 'text-white'

          return (
            <div key={i} className="flex-1 min-w-0 text-center">
              <div className={`h-[32px] ${bg} flex flex-col items-center justify-center gap-[1px]`}>
                <span className={`font-headline font-black italic text-[7px] leading-none ${text}`}>{adv}</span>
                <span className={`font-headline font-bold text-[6px] leading-none ${text} opacity-80`}>
                  {record.golsBrasil}–{record.golsAdversario}
                </span>
              </div>
              <p
                className="font-headline font-bold text-[6px] mt-[3px] truncate"
                style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
              >
                {fase}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Masthead ─────────────────────────────────────────────────────────────────

function Masthead({ titulo, nomeJogador, camisa, arquetipo }: {
  titulo: string
  nomeJogador: string
  camisa: number
  arquetipo: string
}) {
  return (
    <div className="text-center mb-[18px]">
      <p
        className="font-headline font-black italic text-[10px] tracking-[0.35em] uppercase mb-[3px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
      >
        {titulo}
      </p>
      <div className="border-t-4 mb-[1px]" style={{ borderColor: 'var(--color-line)' }} />
      <div className="border-t mb-[6px]" style={{ borderColor: 'var(--color-line)', opacity: 0.25 }} />
      <p
        className="font-headline font-bold text-[8px] tracking-[0.12em] uppercase"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}
      >
        {nomeJogador} · #{camisa} · {ARQUETIPO_LABEL[arquetipo] ?? arquetipo}
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LegacyCard({
  legacy,
  nomeJogador,
  camisa,
  arquetipo,
  initialSeed,
  historicoPartidas,
  sessionId,
}: Props) {
  const { nota, epitafio, causa, reputacao } = legacy
  const [copied, setCopied] = useState(false)
  const isVitoria = causa === 'vitoria'
  const code       = seedCode(initialSeed)
  const partidaFinal = historicoPartidas.length
  const totalGols    = historicoPartidas.reduce((s, r) => s + r.golsBrasil, 0)

  async function handleShare() {
    const caminho = historicoPartidas
      .map(r => `${r.adversario.slice(0, 3).toUpperCase()} ${r.golsBrasil}-${r.golsAdversario}`)
      .join(' · ')
    const quem = `#${camisa} ${nomeJogador} (${ARQUETIPO_LABEL[arquetipo] ?? arquetipo})`
    const text = isVitoria
      ? `🇧🇷 HEXACAMPEÃO DO MUNDO!\n${quem}\n"${epitafio}"\n\n${caminho}\nNota ${formatNota(nota)}/10 · Run ${code}\n#RumoAoHexa`
      : `🇧🇷 ${quem} · P${partidaFinal}/7\n"${epitafio}"\n\n${caminho}\nNota ${formatNota(nota)}/10 · Run ${code}\n#RumoAoHexa`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Rumo ao Hexa', text }) } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  function FooterButtons() {
    return (
      <div className="flex flex-col gap-[8px]">
        <button
          onClick={handleShare}
          className="w-full font-headline font-black italic text-[18px] tracking-[0.5px] py-[13px]"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            boxShadow: 'var(--btn-shadow)',
          }}
        >
          {copied ? 'Copiado!' : 'Compartilhar'}
        </button>

        <Link
          href={`/historico/${sessionId}`}
          className="w-full text-center font-headline font-bold text-[13px] py-[10px] block"
          style={{ border: 'var(--border-w) solid var(--color-line)', color: 'var(--color-hud-ink)', opacity: 0.65 }}
        >
          Ver Jornais da Copa
        </Link>

        <div className="flex gap-[8px]">
          <Link
            href="/historico"
            className="flex-1 text-center font-headline font-bold text-[12px] py-[9px] block"
            style={{ border: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 50%, transparent)', color: 'var(--color-hud-ink)', opacity: 0.45 }}
          >
            Minhas Runs
          </Link>
          <Link
            href="/"
            className="flex-1 text-center font-headline font-black italic text-[12px] py-[9px] block"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
          >
            Nova carreira
          </Link>
        </div>
      </div>
    )
  }

  // ── Tela compartilhada ────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col min-h-screen px-[15px] pt-[22px] pb-[32px] relative overflow-hidden"
      style={{ background: 'var(--color-hud)' }}
    >
      {/* Scanlines overlay (pixel16 only) */}
      <div className="fx-scan" />

      <Masthead
        titulo={isVitoria ? 'Diário da Copa · Edição Histórica' : 'Diário da Copa · Edição Final'}
        nomeJogador={nomeJogador}
        camisa={camisa}
        arquetipo={arquetipo}
      />

      {/* Badge de causa */}
      <div className="flex items-center justify-center gap-[10px] mb-[14px]">
        <span
          className="inline-block font-headline font-black italic text-[10px] tracking-[0.2em] uppercase px-[14px] py-[5px]"
          style={{
            background: isVitoria ? 'var(--color-accent)' : 'var(--color-vermelho)',
            color: isVitoria ? 'var(--color-accent-ink)' : '#fff',
            transform: 'skewX(-8deg)',
          }}
        >
          {CAUSA_LABEL[causa] ?? causa}
        </span>
        {!isVitoria && (
          <span
            className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}
          >
            P{partidaFinal} de 7
          </span>
        )}
      </div>

      {/* Título */}
      <h1
        className="font-headline font-black italic leading-[0.85] tracking-[-3px] text-center mb-[8px]"
        style={{
          fontSize: isVitoria ? '76px' : '56px',
          fontFamily: 'var(--font-head)',
          color: isVitoria ? 'var(--color-accent)' : 'var(--color-hud-ink)',
        }}
      >
        {isVitoria ? 'HEXA!' : 'FIM'}
      </h1>

      {/* Nota Seal + Stats */}
      <div className="flex items-center gap-[14px] mb-[18px]">
        <NotaSeal nota={nota} />
        <div className="flex-1">
          <StatsRow jogos={partidaFinal} gols={totalGols} nota={nota} />
        </div>
      </div>

      {/* Epitáfio */}
      <p
        className="italic text-[17px] leading-[1.35] text-center px-[2px] mb-[22px] tracking-[-0.2px]"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-hud-ink)', opacity: 0.65 }}
      >
        &ldquo;{epitafio}&rdquo;
      </p>

      {/* Código da Run */}
      <div
        className="flex items-center justify-between py-[10px] mb-[18px]"
        style={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 50%, transparent)' }}
      >
        <div>
          <p className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase mb-[2px]"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}>
            Código da Run
          </p>
          <p className="font-headline font-black italic text-[20px] tracking-[0.08em]"
            style={{ color: 'var(--color-hud-ink)', opacity: 0.8 }}>
            {code}
          </p>
        </div>
        {!isVitoria && (
          <div className="text-right">
            <p className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase mb-[2px]"
              style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}>
              Reputação
            </p>
            <p className="font-headline font-bold text-[13px] capitalize"
              style={{ color: 'var(--color-hud-ink)', opacity: 0.7 }}>
              {reputacao.replace(/_/g, ' ')}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="mb-[22px]">
        <Timeline historico={historicoPartidas} />
      </div>

      <FooterButtons />
    </div>
  )
}
