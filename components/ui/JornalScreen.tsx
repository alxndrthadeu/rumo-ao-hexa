'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MatchRecord, RunState } from '@/engine/types'

// ─── Fake news determinísticas por edição ───────────────────────────────────

const FAKE_NEWS: Array<{ secao: string; titulo: string }> = [
  { secao: 'ENQUETE',     titulo: '78% dos brasileiros assistem ao jogo de cueca, diz Ibope' },
  { secao: 'EXCLUSIVO',   titulo: 'Pizzaiolo de BH diz ter previsto o placar em sonho na véspera' },
  { secao: 'COPA',        titulo: "Garrafa d'água no camarote custa R$ 47 — FIFA diz que é preço justo" },
  { secao: 'REDES',       titulo: 'Neymar posta foto de pijama e a web para: "Sonhando com o Hexa?"' },
  { secao: 'MERCADO',     titulo: 'Palmeiras nega interesse em craque gerado por inteligência artificial' },
  { secao: 'BASTIDORES',  titulo: 'CBF distribui 3.000 camisetas nos treinos — sobraram 2.997' },
  { secao: 'TORCIDA',     titulo: 'Fã tatua escudo no peito antes do 1º jogo. "Deu sorte", garante' },
  { secao: 'TRADIÇÃO',    titulo: 'Torcedor usa a mesma cueca de 2002. "Vou até o Hexa ou a derrota"' },
  { secao: 'SELEÇÃO',     titulo: 'Comissão técnica confirma: existe galinha mascote. Ela se chama Vitória' },
  { secao: 'ARBITRAGEM',  titulo: 'Árbitro da final tem 23 anos de carreira e nunca apitou o Brasil' },
  { secao: 'GLOBO',       titulo: 'Comentarista chora pela 7ª vez no torneio — "são só 7 jogos", diz ele' },
  { secao: 'POLÍTICA',    titulo: 'Lula: "Se ganhar o Hexa, decreto feriado de 30 dias corridos"' },
]

function getFakeNews(partida: number) {
  const base = (partida - 1) * 3
  return [0, 1, 2].map(i => FAKE_NEWS[(base + i) % FAKE_NEWS.length])
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESULTADO_LABEL: Record<string, string> = {
  vitoria: 'Vitória',
  empate:  'Empate',
  derrota: 'Derrota',
}

const RESULTADO_BG: Record<string, string> = {
  vitoria: 'var(--color-verde)',
  empate:  'var(--color-azul)',
  derrota: 'var(--color-vermelho)',
}

const FASE_LABEL: Record<string, string> = {
  grupo:   'Fase de Grupos',
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semi:    'Semifinal',
  final:   'Final',
}

function scoreFromDelta(delta: number) {
  return { bra: Math.max(0, delta), adv: Math.max(0, -delta) }
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function DoubleRule() {
  return (
    <div className="mt-[10px]">
      <div className="border-t-[3px] border-preto" />
      <div className="mt-[2px] border-t border-preto" style={{ opacity: 0.35 }} />
    </div>
  )
}

function PlacarBox({ record }: { record: MatchRecord }) {
  const { bra, adv } = scoreFromDelta(record.placarDelta)
  const advAbrev = record.adversario.slice(0, 3).toUpperCase()

  return (
    <div className="flex-1 bg-preto p-[12px]">
      <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase text-white/40 mb-[8px]">
        Placar
      </p>
      <div className="flex items-baseline gap-[6px]">
        <span className="font-headline font-black italic text-[11px] text-white/60">BRA</span>
        <span className="font-headline font-black italic text-[30px] leading-none text-white tracking-[-1px]">
          {bra} × {adv}
        </span>
        <span className="font-headline font-black italic text-[11px] text-white/40">{advAbrev}</span>
      </div>
      <p className="font-headline font-bold text-[9px] text-white/35 mt-[3px] tracking-[0.05em] uppercase">
        {record.adversario}
      </p>
    </div>
  )
}

function GrupoBox({ runState }: { runState: RunState }) {
  const historico = runState.historicoPartidas.filter(h => h.fase === 'grupo')
  const v = historico.filter(h => h.resultado === 'vitoria').length
  const e = historico.filter(h => h.resultado === 'empate').length
  const d = historico.filter(h => h.resultado === 'derrota').length
  const pts = runState.pontosGrupo
  const classificado = pts >= 5

  return (
    <div className="flex-1 border-2 border-preto p-[12px]">
      <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase text-preto/40 mb-[8px]">
        Grupo G
      </p>
      <p className="font-headline font-black italic text-[30px] leading-none text-preto tracking-[-1px]">
        {pts}
        <span className="text-[14px] font-bold tracking-normal"> pts</span>
      </p>
      <p className="font-headline font-bold text-[10px] text-preto/55 mt-[2px]">
        {v}V {e}E {d}D
      </p>
      {classificado && (
        <span
          className="inline-block font-headline font-black italic text-[8px] tracking-[0.1em] uppercase text-white px-[6px] py-[2px] mt-[4px]"
          style={{ background: 'var(--color-verde)' }}
        >
          Classificado
        </span>
      )}
    </div>
  )
}

// ─── JornalScreen ────────────────────────────────────────────────────────────

export default function JornalScreen({
  record,
  sessionId,
  runState,
  onDismiss,
}: {
  record: MatchRecord
  sessionId: string
  runState: RunState
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const fakeNews = getFakeNews(record.partida)
  const isGrupo = record.fase === 'grupo'
  const resultadoCor = RESULTADO_BG[record.resultado] ?? 'var(--color-preto)'
  const resultadoLabel = RESULTADO_LABEL[record.resultado] ?? record.resultado

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col md:flex-row md:justify-center md:bg-azul"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
    >
      {/* Coluna de conteúdo — ocupa tela toda no mobile, coluna centrada no desktop */}
      <div className="w-full md:max-w-[480px] bg-papel flex flex-col overflow-y-auto">

        {/* ── Masthead ── */}
        <div className="px-[20px] pt-[44px] pb-[0px] flex-shrink-0">
          <div className="flex items-baseline justify-between">
            <p className="font-headline font-black italic text-[13px] tracking-[0.35em] uppercase text-preto">
              Diário da Copa
            </p>
            <div className="text-right">
              <p className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase text-preto/40">
                Edição Nº {record.partida}
              </p>
              <p className="font-headline font-bold text-[9px] text-preto/30">
                {FASE_LABEL[record.fase] ?? record.fase}
              </p>
            </div>
          </div>
          <DoubleRule />
        </div>

        {/* ── Resultado + Manchete ── */}
        <div className="px-[20px] pt-[18px] flex-shrink-0">
          <div className="flex items-center gap-[8px] mb-[14px]">
            <span
              className="font-headline font-black italic text-[11px] tracking-[0.2em] uppercase px-[10px] py-[4px] text-white"
              style={{ background: resultadoCor, transform: 'skewX(-6deg)' }}
            >
              {resultadoLabel}
            </span>
            <span className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase text-preto/40">
              Brasil vs {record.adversario}
            </span>
          </div>

          <h1
            className="font-headline font-black italic leading-[0.92] tracking-[-1.5px] text-preto"
            style={{ fontSize: 'clamp(30px, 8.5vw, 42px)' }}
          >
            {record.manchete}
          </h1>

          <div className="mt-[3px] border-b border-preto/15 pb-[16px]">
            <p className="font-headline font-bold text-[11px] tracking-[0.08em] uppercase text-preto/35 mt-[4px]">
              Correspondente · Copa do Mundo 2026
            </p>
          </div>

          <p className="text-[14px] leading-[1.65] text-preto/70 pt-[14px]">
            {record.corpo}
          </p>
        </div>

        {/* ── Flags de destaque ── */}
        {record.flagsDestaque.length > 0 && (
          <div className="px-[20px] mt-[14px] flex flex-wrap gap-[5px] flex-shrink-0">
            {record.flagsDestaque.map(flag => (
              <span
                key={flag}
                className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase px-[7px] py-[3px] border border-preto/20 text-preto/45"
              >
                #{flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* ── Placar + Grupo ── */}
        <div className="px-[20px] mt-[20px] flex-shrink-0">
          <div className="border-t border-b border-preto/15 py-[4px] mb-[10px]">
            <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase text-preto/35">
              Boletim da Copa
            </p>
          </div>
          <div className="flex gap-[8px]">
            <PlacarBox record={record} />
            {isGrupo && <GrupoBox runState={runState} />}
            {!isGrupo && (
              <div className="flex-1 border-2 border-preto p-[12px] flex flex-col justify-center">
                <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase text-preto/40 mb-[6px]">
                  Mata-mata
                </p>
                <span
                  className="font-headline font-black italic text-[13px] tracking-[0.05em] uppercase text-white px-[8px] py-[4px] inline-block"
                  style={{ background: record.resultado === 'vitoria' ? 'var(--color-verde)' : 'var(--color-vermelho)' }}
                >
                  {record.resultado === 'vitoria' ? 'Classificado' : 'Eliminado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Outras Notícias ── */}
        <div className="px-[20px] mt-[22px] flex-shrink-0">
          <div className="flex items-center gap-[10px] mb-[12px]">
            <div className="flex-1 border-t border-preto/25" />
            <span className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase text-preto/35 whitespace-nowrap">
              Outras Notícias
            </span>
            <div className="flex-1 border-t border-preto/25" />
          </div>

          <div className="flex flex-col gap-[0px]">
            {fakeNews.map((n, i) => (
              <div key={i} className="flex gap-[10px] py-[9px] border-b border-preto/10 last:border-b-0">
                <span
                  className="font-headline font-black italic text-[8px] tracking-[0.08em] uppercase text-white px-[5px] py-[2px] shrink-0 self-start mt-[1px]"
                  style={{ background: 'var(--color-preto)' }}
                >
                  {n.secao}
                </span>
                <p className="text-[12px] leading-[1.35] text-preto/65">{n.titulo}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Espaçador ── */}
        <div className="flex-1 min-h-[24px]" />

        {/* ── Rodapé ── */}
        <div className="flex-shrink-0 mt-[24px]">
          <div className="border-t-[3px] border-preto mx-[20px]" />
          <div className="mt-[1px] border-t border-preto mx-[20px]" style={{ opacity: 0.3 }} />

          <div className="px-[20px] py-[24px] flex items-center justify-between">
            <Link
              href={`/historico/${sessionId}`}
              className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase underline underline-offset-4 text-preto/45"
            >
              Arquivo Completo →
            </Link>
            <button
              onClick={onDismiss}
              className="font-headline font-black italic text-[14px] tracking-[0.1em] uppercase px-[22px] py-[12px] text-amarelo"
              style={{ background: 'var(--color-preto)', boxShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}
            >
              Continuar →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
