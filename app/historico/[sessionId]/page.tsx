'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { MatchRecord, RunState } from '@/engine/types'

const RESULTADO_LABEL: Record<string, string> = {
  vitoria: 'Vitória',
  empate:  'Empate',
  derrota: 'Derrota',
}

const RESULTADO_COR: Record<string, string> = {
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

function formatPlacar(delta: number, adversario: string): string {
  const bra = Math.max(0, delta)
  const adv = Math.max(0, -delta)
  return `BRA ${bra} × ${adv} ${adversario.slice(0, 3).toUpperCase()}`
}

function EditionCard({ record }: { record: MatchRecord }) {
  const cor = RESULTADO_COR[record.resultado] ?? 'var(--color-preto)'
  const label = RESULTADO_LABEL[record.resultado] ?? record.resultado

  return (
    <article className="border border-preto/15 bg-papel p-[18px]" style={{ boxShadow: '2px 2px 0 rgba(16,15,13,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-[10px]">
        <span
          className="font-headline font-black italic text-[9px] tracking-[0.3em] uppercase"
          style={{ color: 'var(--color-preto)', opacity: 0.4 }}
        >
          Edição Nº {record.partida}
        </span>
        <span
          className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase px-[6px] py-[2px]"
          style={{ background: cor, color: 'var(--color-papel)', fontSize: '8px' }}
        >
          {label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-preto mb-[10px]" />

      {/* Manchete */}
      <h2
        className="font-headline font-black italic leading-[1.05] tracking-[-0.5px] mb-[8px]"
        style={{ fontSize: '18px', color: 'var(--color-preto)' }}
      >
        {record.manchete}
      </h2>

      {/* Placar + Fase */}
      <p
        className="font-sans text-[11px] mb-[8px]"
        style={{ color: 'var(--color-preto)', opacity: 0.5 }}
      >
        {formatPlacar(record.placarDelta, record.adversario)} · {FASE_LABEL[record.fase] ?? record.fase}
      </p>

      {/* Corpo */}
      <p
        className="font-sans text-[13px] leading-[1.55]"
        style={{ color: 'var(--color-preto)', opacity: 0.65 }}
      >
        {record.corpo}
      </p>

      {/* Flags */}
      {record.flagsDestaque.length > 0 && (
        <div className="flex flex-wrap gap-[5px] mt-[10px]">
          {record.flagsDestaque.map(flag => (
            <span
              key={flag}
              className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase px-[6px] py-[3px] border border-preto/15"
              style={{ color: 'var(--color-preto)', opacity: 0.4 }}
            >
              #{flag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

export default function HistoricoPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { sessionId } = params

  const [historico, setHistorico] = useState<MatchRecord[]>([])
  const [nomeJogador, setNomeJogador] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/run/${sessionId}`)
        if (!res.ok) throw new Error('Sessão não encontrada')
        const data = await res.json()
        const state = data.state as RunState
        setHistorico(state.historicoPartidas ?? [])
        setNomeJogador(state.nomeJogador)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-papel">
        <div className="w-8 h-8 border-2 border-preto/30 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-papel px-6 text-center">
        <p className="font-sans text-[14px] mb-4" style={{ color: 'var(--color-preto)', opacity: 0.5 }}>
          {error}
        </p>
        <button
          onClick={() => router.back()}
          className="font-headline font-black italic text-[12px] tracking-[0.1em] uppercase px-[16px] py-[10px]"
          style={{ background: 'var(--color-preto)', color: 'var(--color-amarelo)' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-papel">
      {/* Header */}
      <div className="px-[22px] pt-[48px] pb-[24px]">
        <div className="flex items-center justify-between">
          <div>
            <span
              className="font-headline font-black italic text-[11px] tracking-[0.3em] uppercase block"
              style={{ color: 'var(--color-preto)', opacity: 0.4 }}
            >
              Diário da Copa
            </span>
            <h1
              className="font-headline font-black italic text-[28px] leading-[1] tracking-[-1px]"
              style={{ color: 'var(--color-preto)' }}
            >
              Run de {nomeJogador}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/jogar/${sessionId}`)}
            className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase px-[12px] py-[8px] border border-preto/25"
            style={{ color: 'var(--color-preto)', opacity: 0.6 }}
          >
            ← Jogar
          </button>
        </div>

        <div className="mt-[12px] border-t-4 border-preto" />
        <div className="mt-[2px] border-t border-preto opacity-30" />
      </div>

      {/* Sem partidas */}
      {historico.length === 0 && (
        <div className="px-[22px] py-[60px] text-center">
          <p
            className="font-headline font-bold text-[16px] italic"
            style={{ color: 'var(--color-preto)', opacity: 0.3 }}
          >
            Nenhuma partida disputada ainda.
          </p>
        </div>
      )}

      {/* Lista de edições */}
      <div className="px-[22px] pb-[48px] flex flex-col gap-[16px]">
        {[...historico].reverse().map(record => (
          <EditionCard key={`${record.partida}-${record.adversario}`} record={record} />
        ))}
      </div>
    </div>
  )
}
