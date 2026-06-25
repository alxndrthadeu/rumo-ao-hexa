'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadCompletedSessionIds, type RunHistoryEntry } from '@/lib/history'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ARQUETIPO_LABEL: Record<string, string> = {
  estrela: 'A Estrela',
  caido:   'O Craque Caído',
  futuro:  'O Futuro do País',
}

const CAUSA_LABEL: Record<string, string> = {
  vitoria:  'Hexacampeão',
  placar:   'Placar',
  barra:    'Barra',
  expulsao: 'Expulsão',
  penaltis: 'Pênaltis',
}

const ADVERSARIO_ABREV: Record<string, string> = {
  Marrocos:  'MAR',
  Haiti:     'HAI',
  Escocia:   'ESC',
  Holanda:   'HOL',
  Senegal:   'SEN',
  Argentina: 'ARG',
  Franca:    'FRA',
}

type Filtro = 'todas' | 'vitoria' | 'eliminado'

function seedCode(seed: number): string {
  return seed.toString(16).toUpperCase().padStart(8, '0').slice(-8)
}

function formatNota(n: number): string {
  return (n / 10).toFixed(1).replace('.', ',')
}

function formatData(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function buildCaminho(run: RunHistoryEntry): string {
  return run.historicoPartidas
    .map(r => {
      const adv = ADVERSARIO_ABREV[r.adversario] ?? r.adversario.slice(0, 3).toUpperCase()
      return `${adv} ${r.golsBrasil}-${r.golsAdversario}`
    })
    .join(' · ')
}

// ─── RunCard ─────────────────────────────────────────────────────────────────

function RunCard({ run }: { run: RunHistoryEntry }) {
  const isVitoria = run.resultado === 'vitoria'
  const accentColor = isVitoria ? 'bg-amarelo' : 'bg-vermelho'
  const accentText  = isVitoria ? 'text-preto'  : 'text-white'
  const label       = isVitoria ? 'HEXA!' : (CAUSA_LABEL[run.causaMorte] ?? run.causaMorte)
  const caminho     = buildCaminho(run)

  return (
    <article className="border-2 border-preto/10 bg-papel overflow-hidden"
      style={{ boxShadow: '2px 2px 0 rgba(16,15,13,0.06)' }}>

      {/* Faixa de cor */}
      <div className={`${accentColor} px-[14px] py-[6px] flex items-center justify-between`}>
        <span className={`font-headline font-black italic text-[11px] tracking-[0.15em] uppercase ${accentText}`}>
          {label}
        </span>
        {!isVitoria && (
          <span className={`font-headline font-bold text-[10px] uppercase ${accentText} opacity-70`}>
            P{run.partidaFinal}/7
          </span>
        )}
      </div>

      <div className="px-[14px] pt-[12px] pb-[14px]">
        {/* Jogador + Arquétipo */}
        <div className="flex items-start justify-between gap-[8px] mb-[8px]">
          <div className="min-w-0">
            <p className="font-headline font-black italic text-[18px] leading-none tracking-[-0.5px] text-preto truncate">
              #{run.camisa} {run.nomeJogador}
            </p>
            <p className="font-headline font-bold text-[10px] tracking-[0.06em] uppercase text-preto/40 mt-[2px]">
              {ARQUETIPO_LABEL[run.arquetipo] ?? run.arquetipo}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-headline font-black italic text-[22px] leading-none tracking-[-1px] text-preto">
              {formatNota(run.nota)}<span className="text-[12px] font-bold not-italic">/10</span>
            </p>
            <p className="font-headline font-bold text-[9px] text-preto/30 mt-[2px]">{formatData(run.data)}</p>
          </div>
        </div>

        {/* Epitáfio */}
        <p className="font-headline font-bold italic text-[12px] leading-[1.4] text-preto/60 mb-[10px] line-clamp-2">
          &ldquo;{run.epitafio}&rdquo;
        </p>

        {/* Caminho resumido */}
        {caminho && (
          <p className="font-headline font-bold text-[9px] tracking-[0.04em] text-preto/35 mb-[10px] truncate">
            {caminho}
          </p>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-preto/8 pt-[8px]">
          <span className="font-headline font-black italic text-[11px] tracking-[0.08em] text-preto/25">
            {seedCode(run.initialSeed)}
          </span>
          <Link
            href={`/legado/${run.sessionId}`}
            className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase text-azul border border-azul/30 px-[10px] py-[4px] hover:bg-azul hover:text-white transition-colors"
          >
            Ver Legado →
          </Link>
        </div>
      </div>
    </article>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HistoricoRunsPage() {
  const [runs, setRuns]     = useState<RunHistoryEntry[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const ids = loadCompletedSessionIds()
      if (ids.length === 0) { setLoaded(true); return }

      try {
        const res = await fetch(`/api/runs?ids=${ids.join(',')}`)
        if (res.ok) {
          const data = await res.json()
          setRuns(data.runs ?? [])
        }
      } catch {}

      setLoaded(true)
    }
    load()
  }, [])

  const filtered = filtro === 'todas'
    ? runs
    : runs.filter(r => r.resultado === filtro)

  const vitorias   = runs.filter(r => r.resultado === 'vitoria').length
  const eliminados = runs.filter(r => r.resultado === 'eliminado').length

  return (
    <div className="min-h-screen bg-papel">
      {/* Header */}
      <div className="bg-preto px-[22px] pt-[48px] pb-[28px] relative overflow-hidden">
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '70%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.08 }}
        />
        <Link
          href="/"
          className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase text-white/40 mb-[16px] block"
        >
          ← Início
        </Link>
        <h1 className="font-headline font-black italic text-[28px] leading-[0.9] tracking-[-1px] text-white mb-[4px]">
          Minhas Runs
        </h1>
        {loaded && runs.length > 0 && (
          <p className="font-headline font-bold text-[11px] text-white/40">
            {vitorias} título{vitorias !== 1 ? 's' : ''} · {eliminados} eliminação{eliminados !== 1 ? 'ões' : ''}
          </p>
        )}
      </div>

      {/* Filtros */}
      {loaded && runs.length > 0 && (
        <div className="px-[15px] py-[14px] flex gap-[8px] border-b-2 border-preto/8">
          {(['todas', 'vitoria', 'eliminado'] as Filtro[]).map(f => {
            const label = f === 'todas' ? 'Todas' : f === 'vitoria' ? 'Títulos' : 'Eliminações'
            const active = filtro === f
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`font-headline font-bold text-[10px] tracking-[0.1em] uppercase px-[12px] py-[6px] border-2 transition-colors ${
                  active
                    ? 'bg-preto text-white border-preto'
                    : 'bg-transparent text-preto/50 border-preto/20 hover:border-preto/40'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Lista de runs */}
      <div className="px-[15px] pt-[16px] pb-[48px] flex flex-col gap-[12px]">
        {!loaded ? (
          <div className="flex items-center justify-center py-[60px]">
            <div className="w-6 h-6 border-2 border-preto/20 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-[60px] text-center">
            <p className="font-headline font-bold italic text-[18px] text-preto/25 mb-[16px]">
              {runs.length === 0 ? 'Nenhuma run ainda.' : 'Nenhuma run nessa categoria.'}
            </p>
            {runs.length === 0 && (
              <Link
                href="/arquetipo"
                className="inline-block font-headline font-black italic text-[15px] tracking-[0.3px] bg-verde text-white px-[22px] py-[12px]"
                style={{ boxShadow: '3px 3px 0 #100F0D' }}
              >
                Começar →
              </Link>
            )}
          </div>
        ) : (
          filtered.map(run => <RunCard key={run.sessionId} run={run} />)
        )}
      </div>
    </div>
  )
}
