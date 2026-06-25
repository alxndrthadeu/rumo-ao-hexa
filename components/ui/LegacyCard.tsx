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

// ─── Timeline ────────────────────────────────────────────────────────────────

type BracketSlot = { partida: number; fase: string; adversario: string }

function Timeline({ historico, isVitoria }: { historico: MatchRecord[]; isVitoria: boolean }) {
  const bracket = bracketData as BracketSlot[]
  const labelColor = isVitoria ? 'text-preto/45' : 'text-preto/30'

  return (
    <div>
      <p className={`font-headline font-bold text-[9px] tracking-[0.2em] uppercase mb-[9px] ${labelColor}`}>
        {isVitoria ? 'O Caminho para o Hexa' : 'Jornada pela Copa 2026'}
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
                <div className="h-[32px] bg-preto/8 flex items-center justify-center">
                  <span className="font-headline font-bold text-[7px] text-preto/18">{adv}</span>
                </div>
                <p className={`font-headline font-bold text-[6px] ${labelColor} mt-[3px] truncate`}>{fase}</p>
              </div>
            )
          }

          const bg   = RESULT_BG[record.resultado]   ?? 'bg-preto/20'
          const text = RESULT_TEXT[record.resultado]  ?? 'text-white'

          return (
            <div key={i} className="flex-1 min-w-0 text-center">
              <div className={`h-[32px] ${bg} flex flex-col items-center justify-center gap-[1px]`}>
                <span className={`font-headline font-black italic text-[7px] leading-none ${text}`}>{adv}</span>
                <span className={`font-headline font-bold text-[6px] leading-none ${text} opacity-80`}>
                  {record.golsBrasil}–{record.golsAdversario}
                </span>
              </div>
              <p className={`font-headline font-bold text-[6px] ${labelColor} mt-[3px] truncate`}>{fase}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Masthead ─────────────────────────────────────────────────────────────────

function Masthead({ titulo, nomeJogador, camisa, arquetipo, isVitoria }: {
  titulo: string
  nomeJogador: string
  camisa: number
  arquetipo: string
  isVitoria: boolean
}) {
  const mutedColor = isVitoria ? 'text-preto/40' : 'text-preto/35'
  return (
    <div className="text-center mb-[18px]">
      <p className={`font-headline font-black italic text-[10px] tracking-[0.35em] uppercase ${mutedColor} mb-[3px]`}>
        {titulo}
      </p>
      <div className="border-t-4 border-preto mb-[1px]" />
      <div className="border-t border-preto mb-[6px]" />
      <p className={`font-headline font-bold text-[8px] tracking-[0.12em] uppercase ${mutedColor}`}>
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
  const code      = seedCode(initialSeed)
  const partidaFinal = historicoPartidas.length


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

  // ── Botões de rodapé (reutilizado em vitória e derrota) ────────────────────

  function FooterButtons() {
    const shareBtnClass = isVitoria
      ? 'bg-preto text-amarelo'
      : 'bg-azul text-white'
    const secondBtnClass = isVitoria
      ? 'border-2 border-preto text-preto'
      : 'border-2 border-preto/20 text-preto/60'
    const tertiaryClass = isVitoria
      ? 'border border-preto/30 text-preto/50'
      : 'border border-preto/18 text-preto/40'

    return (
      <div className="flex flex-col gap-[8px]">
        <button
          onClick={handleShare}
          className={`w-full font-headline font-black italic text-[18px] tracking-[0.5px] py-[13px] ${shareBtnClass}`}
          style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.18)' }}
        >
          {copied ? 'Copiado!' : 'Compartilhar'}
        </button>

        <Link
          href={`/historico/${sessionId}`}
          className={`w-full text-center font-headline font-bold text-[13px] py-[10px] block ${secondBtnClass}`}
        >
          Ver Jornais da Copa
        </Link>

        <div className="flex gap-[8px]">
          <Link
            href="/historico"
            className={`flex-1 text-center font-headline font-bold text-[12px] py-[9px] block ${tertiaryClass}`}
          >
            Minhas Runs
          </Link>
          <Link
            href="/"
            className={`flex-1 text-center font-headline font-bold text-[12px] py-[9px] block ${tertiaryClass}`}
          >
            Nova Run
          </Link>
        </div>
      </div>
    )
  }

  // ── VITÓRIA ────────────────────────────────────────────────────────────────

  if (isVitoria) {
    return (
      <div className="flex flex-col min-h-screen bg-amarelo px-[15px] pt-[22px] pb-[32px]">
        <Masthead
          titulo="Diário da Copa · Edição Histórica"
          nomeJogador={nomeJogador}
          camisa={camisa}
          arquetipo={arquetipo}
          isVitoria
        />

        <div className="text-center mb-[10px]">
          <span
            className="inline-block font-headline font-black italic text-[10px] tracking-[0.2em] uppercase bg-preto text-amarelo px-[14px] py-[5px]"
            style={{ transform: 'skewX(-8deg)' }}
          >
            Hexacampeão do Mundo
          </span>
        </div>

        <h1 className="font-headline font-black italic text-[76px] leading-[0.78] tracking-[-4px] text-preto text-center mb-[8px]">
          HEXA!
        </h1>

        <p className="font-headline font-bold italic text-[17px] leading-[1.35] text-center text-preto/65 px-[2px] mb-[22px] tracking-[-0.2px]">
          &ldquo;{epitafio}&rdquo;
        </p>

        <div className="flex items-center justify-between border-t-2 border-b-2 border-preto/20 py-[12px] mb-[18px]">
          <div>
            <p className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase text-preto/40 mb-[2px]">Nota Final</p>
            <p className="font-headline font-black italic text-[30px] leading-none tracking-[-1px] text-preto">
              {formatNota(nota)}<small className="text-[14px] font-bold not-italic">/10</small>
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase text-preto/40 mb-[2px]">Código da Run</p>
            <p className="font-headline font-black italic text-[20px] tracking-[0.08em] text-preto">{code}</p>
          </div>
        </div>

        <div className="mb-[22px]">
          <Timeline historico={historicoPartidas} isVitoria />
        </div>

        <FooterButtons />
      </div>
    )
  }

  // ── DERROTA ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-papel px-[15px] pt-[22px] pb-[32px]">
      <Masthead
        titulo="Diário da Copa · Edição Final"
        nomeJogador={nomeJogador}
        camisa={camisa}
        arquetipo={arquetipo}
        isVitoria={false}
      />

      <div className="flex items-center justify-center gap-[10px] mb-[14px]">
        <span
          className="inline-block font-headline font-black italic text-[10px] tracking-[0.15em] uppercase bg-vermelho text-white px-[12px] py-[4px]"
          style={{ transform: 'skewX(-8deg)' }}
        >
          {CAUSA_LABEL[causa] ?? causa}
        </span>
        <span className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase text-preto/35">
          P{partidaFinal} de 7
        </span>
      </div>

      <p className="font-headline font-bold italic text-[20px] leading-[1.3] text-center text-preto px-[2px] pb-[18px] tracking-[-0.2px]">
        &ldquo;{epitafio}&rdquo;
      </p>

      <div className="border-t-2 border-preto/10 mb-[16px]" />

      <div className="mb-[16px]">
        <Timeline historico={historicoPartidas} isVitoria={false} />
      </div>

      <div className="border-t-2 border-preto/10 mb-[14px]" />

      <div className="flex items-center justify-between mb-[22px]">
        <div>
          <p className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase text-preto/35 mb-[2px]">Nota Final</p>
          <p className="font-headline font-black italic text-[30px] leading-none tracking-[-1px] text-preto">
            {formatNota(nota)}<small className="text-[14px] font-bold not-italic">/10</small>
          </p>
        </div>
        <div className="text-right">
          <p className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase text-preto/35 mb-[2px]">Reputação</p>
          <p className="font-headline font-bold text-[14px] text-preto capitalize">{reputacao.replace(/_/g, ' ')}</p>
          <p className="font-headline font-bold text-[9px] tracking-[0.06em] uppercase text-preto/25 mt-[2px]">
            Run {code}
          </p>
        </div>
      </div>

      <FooterButtons />
    </div>
  )
}
