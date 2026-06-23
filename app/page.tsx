'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import type { Arquetipo } from '@/engine/types'
import archetypesData from '@/data/archetypes.json'

type ArchetypeKey = Arquetipo

const ARQUETIPO_ORDEM: ArchetypeKey[] = ['estrela', 'caido', 'futuro']

const VIES_LABEL: Record<string, string> = {
  neutro: 'Mídia neutra',
  hostil: 'Imprensa hostil',
  permissivo: 'Mídia favorável',
}

const PASSIVA_LABEL: Record<string, string> = {
  homem_marcado: 'Homem Marcado — adversários te dobram',
  divida_lesao: 'Dívida — começa com niggle muscular',
  joia_bruta: 'Joia Bruta — +bônus por vitória',
}

function BarMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/50 w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
        <div className="h-full bg-amarelo rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-white/50 w-6 text-right">{value}</span>
    </div>
  )
}

function ArquetipoCard({
  id,
  selected,
  onClick,
}: {
  id: ArchetypeKey
  selected: boolean
  onClick: () => void
}) {
  const data = archetypesData[id]

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-2xl p-5 border-2 transition-all duration-200',
        selected
          ? 'border-amarelo bg-amarelo/10'
          : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="font-headline font-black text-[10px] tracking-[0.2em] text-amarelo/60 uppercase">
          #{data.camisa} · {data.viesMidia.replace(/_/g, ' ')}
        </span>
        {selected && (
          <span className="text-amarelo text-xs font-bold">✓</span>
        )}
      </div>

      <h2 className="font-headline font-black italic text-xl text-white leading-tight mb-0.5">
        {data.nome}
      </h2>
      <p className="text-xs text-white/50 mb-4">{data.personagem}</p>

      <div className="flex flex-col gap-1.5 mb-4">
        <BarMini label="Tor" value={data.torcida} />
        <BarMini label="Míd" value={data.midia} />
        <BarMini label="Mor" value={data.moral} />
        <BarMini label="Fís" value={data.fisico} />
      </div>

      <p className="text-[11px] text-white/40 italic leading-snug">
        {PASSIVA_LABEL[data.passiva] ?? data.passiva}
      </p>
    </button>
  )
}

export default function Home() {
  const router = useRouter()
  const [selected, setSelected] = useState<ArchetypeKey | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('rtt_session_id')
    if (id) {
      setHasSession(true)
      setActiveSession(id)
    }
  }, [])

  async function startRun() {
    if (!selected || isPending) return
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arquetipo: selected }),
        })

        if (!res.ok) throw new Error('Erro ao criar sessão')

        const data = await res.json()
        localStorage.setItem('rtt_session_id', data.sessionId)
        router.push(`/jogar/${data.sessionId}`)
      } catch {
        setError('Não foi possível iniciar a run. Tente novamente.')
      }
    })
  }

  function abandonAndNew() {
    localStorage.removeItem('rtt_session_id')
    setHasSession(false)
    setActiveSession(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-azul text-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <p className="font-headline font-black italic text-[10px] tracking-[0.3em] text-amarelo/60 uppercase mb-1">
          Copa do Mundo 2026
        </p>
        <h1 className="font-display text-5xl leading-none text-white">
          26
        </h1>
        <p className="font-headline font-bold text-lg text-white/70 mt-1">
          Rumo ao Hexa
        </p>
      </div>

      <div className="flex-1 px-4 pb-6">
        {/* Retomar sessão ativa */}
        {hasSession && activeSession && (
          <div className="mb-4 rounded-xl border border-amarelo/30 bg-amarelo/10 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-headline font-bold text-sm text-amarelo">Run em andamento</p>
              <p className="text-xs text-white/50 mt-0.5">Continuar de onde parou?</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => router.push(`/jogar/${activeSession}`)}
                className="px-4 py-2 rounded-lg bg-amarelo text-preto font-headline font-black text-xs"
              >
                Continuar
              </button>
              <button
                onClick={abandonAndNew}
                className="px-3 py-2 rounded-lg border border-white/20 text-white/50 font-headline font-bold text-xs"
              >
                Abandonar
              </button>
            </div>
          </div>
        )}

        {/* Escolha de arquétipo */}
        <p className="font-headline font-bold text-xs tracking-widest text-white/40 uppercase mb-3">
          Escolha seu arquétipo
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {ARQUETIPO_ORDEM.map((id) => (
            <ArquetipoCard
              key={id}
              id={id}
              selected={selected === id}
              onClick={() => setSelected(id)}
            />
          ))}
        </div>

        {error && (
          <p className="text-vermelho text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={startRun}
          disabled={!selected || isPending}
          className={clsx(
            'w-full py-4 rounded-xl font-headline font-black text-base tracking-wide transition-all',
            selected && !isPending
              ? 'bg-verde text-white hover:bg-verde-2 active:scale-[0.98]'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          )}
        >
          {isPending ? 'Entrando em campo…' : 'Entrar em campo →'}
        </button>
      </div>
    </div>
  )
}
