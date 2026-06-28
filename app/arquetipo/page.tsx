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

const VIES_INK: Record<string, string> = {
  neutro:     'var(--color-ink)',
  hostil:     'var(--color-vermelho)',
  permissivo: 'var(--color-verde)',
}
const VIES_OPACITY: Record<string, number> = {
  neutro: 0.5,
  hostil: 1,
  permissivo: 1,
}

function BarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span
        className="font-headline font-bold text-[9px] tracking-[0.05em] uppercase w-7 shrink-0"
        style={{ color: 'var(--color-ink)', opacity: 0.5 }}
      >
        {label}
      </span>
      <div className="flex-1 h-[6px]" style={{ background: 'var(--bar-track)' }}>
        <div className="h-full" style={{ width: `${value}%`, background: 'var(--color-azul)' }} />
      </div>
      <span
        className="font-headline font-bold tabular-nums text-[11px] w-6 text-right"
        style={{ color: 'var(--color-ink)', opacity: 0.5 }}
      >
        {value}
      </span>
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
      className="w-full text-left transition-all duration-150"
      style={{
        background: 'var(--color-surface)',
        border: selected
          ? 'var(--border-w) solid var(--color-accent)'
          : 'var(--border-w) solid var(--color-line)',
        opacity: selected ? 1 : 0.78,
        boxShadow: selected
          ? '0 0 0 3px color-mix(in srgb, var(--color-accent) 44%, transparent), var(--card-shadow)'
          : 'none',
      }}
    >
      {/* Topo colorido */}
      <div
        className={clsx(
          'font-headline font-black italic text-[14px] tracking-[0.08em] uppercase text-white px-[14px] py-[6px]',
          TOP_COR[id]
        )}
      >
        {d.nome}
      </div>

      {/* Body */}
      <div className="px-[16px] pt-[12px] pb-[4px]">
        {/* Lore */}
        <p
          className="text-[13px] leading-[1.4] mb-[12px]"
          style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', lineHeight: 'var(--body-lh)', color: 'var(--color-ink)', opacity: 0.7 }}
        >
          {d.lore}
        </p>

        {/* Barras */}
        <div className="flex flex-col gap-[6px] mb-[12px]">
          <BarRow label="Tor" value={d.torcida} />
          <BarRow label="Míd" value={d.midia} />
          <BarRow label="Mor" value={d.moral} />
          <BarRow label="Fís" value={d.fisico} />
        </div>

        {/* Mecânica especial */}
        <div className="px-[10px] py-[7px] mb-[10px]" style={{ background: 'var(--bar-track)' }}>
          <p
            className="font-headline font-bold text-[9px] tracking-[0.12em] uppercase mb-[2px]"
            style={{ color: 'var(--color-ink)', opacity: 0.4 }}
          >
            Mecânica especial
          </p>
          <p
            className="font-headline font-bold text-[12px] leading-[1.3]"
            style={{ color: 'var(--color-ink)' }}
          >
            {d.especial}
          </p>
        </div>
      </div>

      {/* Rodapé: viés de mídia */}
      <div
        className="font-headline font-bold text-[11px] tracking-[0.05em] uppercase mx-[16px] pt-[8px] pb-[10px]"
        style={{
          borderTop: 'var(--border-w) solid var(--color-line)',
          color: VIES_INK[d.viesMidia] ?? 'var(--color-ink)',
          opacity: VIES_OPACITY[d.viesMidia] ?? 0.5,
        }}
      >
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div
        className="relative px-[22px] pt-[44px] pb-[0px] overflow-hidden"
        style={{ background: 'var(--color-hud)' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.08, background: 'var(--color-accent)' }}
        />
        <Link
          href="/"
          className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase mb-[16px] block"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.5 }}
        >
          ← Voltar
        </Link>
        <h1
          className="font-headline font-black italic text-[28px] leading-[0.9] tracking-[-1px]"
          style={{ color: 'var(--color-hud-ink)' }}
        >
          Quem é você<br />nessa seleção?
        </h1>
        <p
          className="font-headline font-bold text-[13px] mt-[8px] mb-[20px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.6 }}
        >
          Escolha o arquétipo, depois seu nome e número.
        </p>
        {/* Régua de acento */}
        <div className="h-[3px] w-full" style={{ background: 'var(--color-accent)' }} />
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
          <div
            className="p-[16px]"
            style={{ border: 'var(--border-w) solid var(--color-line)', background: 'var(--color-surface)', boxShadow: 'var(--card-shadow)' }}
          >
            <p
              className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase mb-[14px]"
              style={{ color: 'var(--color-ink)', opacity: 0.5 }}
            >
              Suas informações
            </p>

            <div className="flex gap-[10px] items-start">
              {/* Nome */}
              <div className="flex-1 min-w-0">
                <label
                  className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase block mb-[5px]"
                  style={{ color: 'var(--color-ink)', opacity: 0.5 }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value.slice(0, 20))}
                  placeholder="Ex: Ronaldo"
                  maxLength={20}
                  className="w-full h-[46px] px-[10px] font-headline font-bold text-[15px] outline-none transition-colors"
                  style={{
                    border: 'var(--border-w) solid var(--color-line)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                    opacity: 0.85,
                  }}
                />
              </div>

              {/* Número */}
              <div className="w-[72px] shrink-0">
                <label
                  className="font-headline font-bold text-[10px] tracking-[0.1em] uppercase block mb-[5px]"
                  style={{ color: 'var(--color-ink)', opacity: 0.5 }}
                >
                  Camisa
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={camisa}
                  onChange={e => handleCamisa(e.target.value)}
                  placeholder="10"
                  className="w-full h-[46px] px-[10px] font-headline font-black italic text-[20px] text-center outline-none transition-colors"
                  style={{
                    border: 'var(--border-w) solid var(--color-line)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            {nomeValido && camisaValida && (
              <div className={clsx('mt-[12px] px-[12px] py-[8px] flex items-center gap-[10px]', TOP_COR[selected])}>
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
          className="w-full font-headline font-black italic text-[22px] tracking-[0.5px] py-[13px] transition-opacity disabled:cursor-not-allowed"
          style={pronto && !isLoading
            ? { background: 'var(--color-accent)', color: 'var(--color-accent-ink)', boxShadow: 'var(--btn-shadow)' }
            : { background: 'color-mix(in srgb, var(--color-line) 20%, transparent)', color: 'var(--color-ink)', opacity: 0.5 }
          }
        >
          {isLoading
            ? 'Entrando em campo…'
            : `Vestir a camisa ${camisaValida ? camisaNum : 10} →`
          }
        </button>
      </div>
    </div>
  )
}
