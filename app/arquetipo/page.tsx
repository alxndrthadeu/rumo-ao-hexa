'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import type { Arquetipo } from '@/engine/types'
import { BRACKET } from '@/engine/deck'
import { saveActiveRun } from '@/lib/history'
import archetypesData from '@/data/archetypes.json'

type ArchetypeKey = Arquetipo
const ORDEM: ArchetypeKey[] = ['estrela', 'caido', 'futuro']

const TOP_COR: Record<ArchetypeKey, string> = {
  estrela: 'bg-azul',
  caido:   'bg-vermelho',
  futuro:  'bg-verde',
}

const VIES_COR: Record<string, string> = {
  neutro:     'text-preto/50',
  hostil:     'text-vermelho',
  permissivo: 'text-verde',
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
  const d = archetypesData[id] as typeof archetypesData['estrela'] & { lore: string; especial: string; viesExplicado: string }
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left bg-white border-2 transition-all duration-150',
        selected ? 'border-preto' : 'border-transparent hover:border-preto/30'
      )}
      style={selected ? { boxShadow: '4px 4px 0 #100F0D' } : undefined}
    >
      {/* topo colorido */}
      <div className={clsx('font-headline font-black italic text-[14px] tracking-[0.08em] uppercase text-white px-[14px] py-[6px]', TOP_COR[id])}>
        {d.nome}
      </div>

      {/* body */}
      <div className="px-[16px] pt-[12px] pb-[4px]">
        {/* Lore */}
        <p className="text-[13px] text-preto/70 leading-[1.4] mb-[12px]">{d.lore}</p>

        {/* Barras */}
        <div className="flex flex-col gap-[6px] mb-[12px]">
          <BarRow label="Tor" value={d.torcida} />
          <BarRow label="Míd" value={d.midia} />
          <BarRow label="Mor" value={d.moral} />
          <BarRow label="Fís" value={d.fisico} />
        </div>

        {/* Mecânica especial */}
        <div className="bg-papel px-[10px] py-[7px] mb-[10px]">
          <p className="font-headline font-bold text-[9px] tracking-[0.12em] uppercase text-preto/40 mb-[2px]">Mecânica especial</p>
          <p className="font-headline font-bold text-[12px] text-preto leading-[1.3]">{d.especial}</p>
        </div>
      </div>

      {/* rodapé: viés de mídia */}
      <div className={clsx(
        'font-headline font-bold text-[11px] tracking-[0.05em] uppercase mx-[16px] border-t-2 border-preto pt-[8px] pb-[10px]',
        VIES_COR[d.viesMidia]
      )}>
        {d.viesExplicado}
      </div>
    </button>
  )
}

export default function ArquetipoPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<ArchetypeKey | null>(null)
  const [nome, setNome] = useState('')
  const [camisa, setCamisa] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selected) return
    const t = setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
    return () => clearTimeout(t)
  }, [selected])

  const camisaNum = parseInt(camisa, 10)
  const camisaValida = camisa !== '' && !isNaN(camisaNum) && camisaNum >= 1 && camisaNum <= 99
  const nomeValido = nome.trim().length >= 2
  const pronto = selected !== null && nomeValido && camisaValida

  function handleCamisa(v: string) {
    const num = v.replace(/\D/g, '').slice(0, 2)
    setCamisa(num)
  }

  async function startRun() {
    if (!pronto || isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquetipo: selected, nome: nome.trim(), camisa: camisaNum }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      saveActiveRun({
        sessionId: data.sessionId,
        state: data.state,
        bracketEntry: BRACKET[0],
        currentCard: data.cards[0],
      })
      router.push(`/jogar/${data.sessionId}`)
    } catch {
      setError('Não foi possível iniciar. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-papel flex flex-col">
      {/* Header */}
      <div className="relative bg-azul px-[22px] pt-[44px] pb-[28px] overflow-hidden">
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.12 }}
        />
        <Link
          href="/"
          className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase mb-[16px] block"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← Voltar
        </Link>
        <h1 className="font-headline font-black italic text-[28px] leading-[0.9] tracking-[-1px] text-white">
          Quem é você<br />nessa seleção?
        </h1>
        <p className="font-headline font-bold text-[13px] mt-[8px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Escolha o arquétipo, depois seu nome e número.
        </p>
      </div>

      {/* Arquétipos */}
      <div className="px-[15px] pt-[20px] flex flex-col gap-[10px]">
        {ORDEM.map(id => (
          <ArquetipoCard key={id} id={id} selected={selected === id} onClick={() => setSelected(id)} />
        ))}
      </div>

      {/* Form de identificação */}
      {selected && (
        <div ref={formRef} className="px-[15px] pt-[20px] pb-[8px]">
          <div className="border-2 border-preto bg-white p-[16px]" style={{ boxShadow: '4px 4px 0 #100F0D' }}>
            <p
              className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mb-[14px]"
              style={{ color: '#4B4A45' }}
            >
              Suas informações
            </p>

            <div className="flex gap-[10px] items-start">
              {/* Nome */}
              <div className="flex-1 min-w-0">
                <label className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase text-preto/50 block mb-[5px]">
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value.slice(0, 20))}
                  placeholder="Ex: Ronaldo"
                  maxLength={20}
                  className="w-full h-[46px] border-2 border-preto/20 focus:border-preto px-[10px] font-headline font-bold text-[15px] text-preto bg-papel outline-none transition-colors"
                />
              </div>

              {/* Número */}
              <div className="w-[72px] shrink-0">
                <label className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase text-preto/50 block mb-[5px]">
                  Camisa
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={camisa}
                  onChange={e => handleCamisa(e.target.value)}
                  placeholder="10"
                  className="w-full h-[46px] border-2 border-preto/20 focus:border-preto px-[10px] font-headline font-black italic text-[20px] text-preto text-center bg-papel outline-none transition-colors"
                />
              </div>
            </div>

            {/* Preview */}
            {nomeValido && camisaValida && (
              <div className={clsx(
                'mt-[12px] px-[12px] py-[8px] flex items-center gap-[10px]',
                TOP_COR[selected]
              )}>
                <span
                  className="font-headline font-black italic text-[28px] leading-none text-white shrink-0"
                  style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}
                >
                  #{camisaNum}
                </span>
                <span className="font-headline font-black italic text-[18px] uppercase tracking-[0.02em] text-white truncate min-w-0">
                  {nome.trim()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-[15px] pt-[16px] pb-[32px] flex flex-col gap-[10px]">
        {error && (
          <p className="text-vermelho text-sm text-center font-headline font-bold">{error}</p>
        )}
        <button
          onClick={startRun}
          disabled={!pronto || isLoading}
          className={clsx(
            'w-full font-headline font-black italic text-[22px] tracking-[0.5px] text-white py-[13px] transition-opacity',
            pronto && !isLoading ? 'bg-verde' : 'bg-preto/20 cursor-not-allowed'
          )}
          style={pronto && !isLoading ? { boxShadow: '4px 4px 0 #100F0D' } : undefined}
        >
          {isLoading ? 'Entrando em campo…' : 'Entrar em campo →'}
        </button>
      </div>
    </div>
  )
}
