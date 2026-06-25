'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const REGRAS = [
  {
    num: '01',
    titulo: 'A jornada',
    corpo: '7 jogos do Grupo à Final. Você joga carta a carta — antes do apito, nos 90 minutos e na coletiva. Uma escolha ruim pode mudar tudo.',
  },
  {
    num: '02',
    titulo: 'As 4 barras',
    corpo: 'Torcida, Mídia, Moral e Físico. Se qualquer uma chegar a 0 ou 100, a run acaba. Equilibrar é o jogo dentro do jogo.',
  },
  {
    num: '03',
    titulo: 'A coletiva',
    corpo: 'Cada partida termina com uma pergunta da imprensa. Sua resposta afeta as barras — e define o seu legado.',
  },
  {
    num: '04',
    titulo: 'O arquétipo',
    corpo: 'Estrela, Craque Caído ou Promessa. Cada um começa diferente, sofre pressões diferentes e tem seu próprio viés de mídia.',
  },
]

export default function Home() {
  const router = useRouter()
  const [activeSession, setActiveSession] = useState<string | null>(null)

  useEffect(() => {
    // Limpa chave antiga da arquitetura anterior (se existir)
    localStorage.removeItem('rtt_session_id')

    try {
      const raw = localStorage.getItem('rtt_active_run')
      if (!raw) return
      const active = JSON.parse(raw)
      if (active?.sessionId) setActiveSession(active.sessionId)
    } catch {}
  }, [])

  return (
    <div className="min-h-screen bg-papel flex flex-col">
      {/* ── Cover ── */}
      <div className="relative bg-azul px-[22px] pt-[52px] pb-[40px] overflow-hidden">
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.12 }}
        />
        <p
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase mb-[10px]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Edição especial · Copa do Mundo 2026
        </p>
        <div className="inline-block mb-[16px]">
          <span
            className="font-headline font-black italic text-white bg-vermelho px-[18px] py-[2px] inline-block text-[96px] leading-[0.78] tracking-[-3px]"
            style={{ boxShadow: '5px 5px 0 #100F0D' }}
          >
            26
          </span>
        </div>
        <h1
          className="font-headline font-black italic text-[38px] leading-[0.86] tracking-[-1.5px]"
          style={{ color: 'var(--color-amarelo)', textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
        >
          Rumo ao Hexa<br />Brasil!
        </h1>
        <p
          className="font-headline font-bold text-[14px] mt-[10px]"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Um Reigns de futebol. 7 jogos. 1 vida só.
        </p>
      </div>

      {/* ── Run ativa ── */}
      {activeSession && (
        <div className="mx-[15px] mt-[18px] bg-amarelo/20 border-2 border-amarelo px-[14px] py-[10px] flex items-center justify-between gap-3">
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
              onClick={() => { localStorage.removeItem('rtt_active_run'); setActiveSession(null) }}
              className="px-[10px] py-[7px] border-2 border-preto/30 text-preto/50 font-headline font-bold text-[11px]"
            >
              Abandonar
            </button>
          </div>
        </div>
      )}

      {/* ── Como jogar ── */}
      <div id="como-jogar" className="px-[15px] pt-[28px] pb-[10px]">
        <div className="flex items-center gap-3 mb-[20px]">
          <span
            className="font-headline font-black italic text-[11px] tracking-[0.08em] uppercase text-white bg-vermelho px-[10px] py-[4px]"
            style={{ transform: 'skewX(-8deg)' }}
          >
            Como jogar
          </span>
          <span className="font-headline font-bold text-[9px] tracking-[0.15em] uppercase text-preto/40">
            4 regras simples
          </span>
        </div>

        <div className="flex flex-col gap-[10px]">
          {REGRAS.map(r => (
            <div key={r.num} className="flex gap-[14px] border-l-[4px] border-preto pl-[12px] py-[2px]">
              <span className="font-headline font-black italic text-[28px] leading-none text-preto/15 shrink-0 w-8">
                {r.num}
              </span>
              <div>
                <p className="font-headline font-black italic text-[15px] tracking-[-0.2px] text-preto leading-none mb-[5px]">
                  {r.titulo}
                </p>
                <p className="text-[13px] leading-[1.4] text-preto/70">
                  {r.corpo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-[15px] pt-[24px] pb-[40px]">
        <Link
          href="/arquetipo"
          className="w-full text-center block font-headline font-black italic text-[22px] tracking-[0.5px] text-white py-[13px] bg-verde"
          style={{ boxShadow: '4px 4px 0 #100F0D' }}
        >
          Escolher Arquétipo →
        </Link>
        <Link
          href="/como-jogar"
          className="w-full text-center block font-headline font-bold text-[13px] text-preto/50 py-[14px] hover:text-preto/80 transition-colors"
        >
          Primeira vez? Veja o guia →
        </Link>
      </div>
    </div>
  )
}
