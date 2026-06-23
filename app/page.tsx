'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import type { Arquetipo } from '@/engine/types'
import archetypesData from '@/data/archetypes.json'

type ArchetypeKey = Arquetipo
const ORDEM: ArchetypeKey[] = ['estrela', 'caido', 'futuro']

const VIES_LABEL: Record<string, string> = {
  neutro:     'Mídia neutra',
  hostil:     'Imprensa hostil',
  permissivo: 'Mídia favorável',
}

const TOP_COR: Record<ArchetypeKey, string> = {
  estrela: 'bg-azul',
  caido:   'bg-vermelho',
  futuro:  'bg-verde',
}

function BarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="font-headline font-bold text-[9px] tracking-[0.05em] uppercase text-preto/50 w-7 shrink-0">{label}</span>
      <div className="flex-1 h-[6px] bg-black/10">
        <div className="h-full bg-azul" style={{ width: `${value}%` }} />
      </div>
      <span className="font-headline font-bold tabular-nums text-[11px] text-preto/50 w-6 text-right">{value}</span>
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
  const d = archetypesData[id]
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left bg-white border-2 transition-all duration-150',
        selected ? 'border-preto' : 'border-transparent hover:border-preto/30'
      )}
      style={selected ? { boxShadow: '4px 4px 0 #100F0D' } : undefined}
    >
      {/* .card .top */}
      <div className={clsx('font-headline font-black italic text-[14px] tracking-[0.08em] uppercase text-white px-[14px] py-[6px] flex justify-between', TOP_COR[id])}>
        <span>{d.nome}</span>
        <span>#{d.camisa}</span>
      </div>

      {/* .card .body */}
      <div className="px-[16px] py-[14px]">
        <p className="font-headline font-black italic text-[23px] tracking-[-0.5px] text-preto mb-[2px] leading-tight">
          {d.personagem}
        </p>
        <div className="flex flex-col gap-[6px] mt-[10px]">
          <BarRow label="Tor" value={d.torcida} />
          <BarRow label="Míd" value={d.midia} />
          <BarRow label="Mor" value={d.moral} />
          <BarRow label="Fís" value={d.fisico} />
        </div>
      </div>

      {/* .card .foot */}
      <div className="font-headline font-bold text-[11.5px] tracking-[0.05em] uppercase text-vermelho mx-[16px] border-t-2 border-preto pt-[9px] pb-[12px]">
        {VIES_LABEL[d.viesMidia]}
      </div>
    </button>
  )
}

export default function Home() {
  const router = useRouter()
  const [selected, setSelected] = useState<ArchetypeKey | null>(null)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('rtt_session_id')
    if (id) setActiveSession(id)
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
        if (!res.ok) throw new Error()
        const data = await res.json()
        localStorage.setItem('rtt_session_id', data.sessionId)
        router.push(`/jogar/${data.sessionId}`)
      } catch {
        setError('Não foi possível iniciar. Tente novamente.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-papel flex flex-col overflow-hidden">
      {/* Cover header — faixa diagonal com "26" */}
      <div className="relative bg-azul px-[22px] pt-[52px] pb-[32px] overflow-hidden">
        {/* Faixa diagonal amarela */}
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.12 }}
        />
        <p
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase mb-[6px]"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Edição especial · Copa do Mundo 2026
        </p>
        {/* .plate — "26" com flat shadow */}
        <div className="inline-block">
          <span
            className="font-headline font-black italic text-white bg-vermelho px-[18px] py-[2px] inline-block text-[96px] leading-[0.78] tracking-[-3px]"
            style={{ boxShadow: '5px 5px 0 #100F0D' }}
          >
            26
          </span>
        </div>
        <h1
          className="font-headline font-black italic text-[34px] leading-[0.86] tracking-[-1.5px] mt-[14px]"
          style={{ color: 'var(--color-amarelo)', textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
        >
          Rumo ao Hexa<br />Brasil!
        </h1>
        <ul className="mt-[18px] space-y-[7px]">
          {['Um Reigns de futebol', '7 jogos · 4 barras · 1 vida só', 'A coletiva pode te enterrar'].map(l => (
            <li key={l} className="font-headline font-bold text-[14px] border-l-[5px] border-vermelho pl-[12px] py-[3px] bg-white/10 text-white">
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 px-[15px] py-[20px] flex flex-col gap-[16px]">
        {/* Retomar sessão */}
        {activeSession && (
          <div className="bg-amarelo/20 border-2 border-amarelo px-[14px] py-[10px] flex items-center justify-between gap-3">
            <div>
              <p className="font-headline font-bold text-[13px] text-preto">Run em andamento</p>
              <p className="text-[12px] text-preto/60 mt-[1px]">Continuar de onde parou?</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => router.push(`/jogar/${activeSession}`)}
                className="px-[12px] py-[7px] bg-verde text-white font-headline font-black text-[12px]"
                style={{ boxShadow: '2px 2px 0 #100F0D' }}
              >
                Continuar
              </button>
              <button
                onClick={() => { localStorage.removeItem('rtt_session_id'); setActiveSession(null) }}
                className="px-[10px] py-[7px] border-2 border-preto/30 text-preto/50 font-headline font-bold text-[11px]"
              >
                Abandonar
              </button>
            </div>
          </div>
        )}

        {/* Escolha de arquétipo */}
        <div>
          <p
            className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mb-[12px]"
            style={{ color: 'var(--color-tinta-2, #4B4A45)' }}
          >
            Escolha seu arquétipo
          </p>
          <div className="flex flex-col gap-[12px]">
            {ORDEM.map(id => (
              <ArquetipoCard key={id} id={id} selected={selected === id} onClick={() => setSelected(id)} />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-vermelho text-sm text-center font-headline font-bold">{error}</p>
        )}

        {/* CTA — .cta do layout.html */}
        <button
          onClick={startRun}
          disabled={!selected || isPending}
          className={clsx(
            'w-full font-headline font-black italic text-[22px] tracking-[0.5px] text-white py-[13px] transition-opacity',
            selected && !isPending ? 'bg-verde' : 'bg-preto/20 cursor-not-allowed'
          )}
          style={selected && !isPending ? { boxShadow: '4px 4px 0 #100F0D' } : undefined}
        >
          {isPending ? 'Entrando em campo…' : 'Entrar em campo →'}
        </button>

        <a
          href="#como-jogar"
          className="font-headline font-bold text-[11px] tracking-[0.15em] uppercase text-azul text-center underline underline-offset-[3px]"
        >
          Como jogar
        </a>
      </div>
    </div>
  )
}
