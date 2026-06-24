'use client'

import { useEffect, useRef } from 'react'

const TOKEN_META: Record<string, { label: string; desc: string }> = {
  ousado:       { label: 'Ousado',     desc: 'Garante jogadas de risco ofensivo' },
  disciplinado: { label: 'Disciplina', desc: 'Evita erros por impulsividade' },
  raca:         { label: 'Raça',       desc: 'Resiste a lesões e desgaste físico' },
  frieza:       { label: 'Frieza',     desc: 'Mantém a cabeça em momentos de pressão' },
  lider:        { label: 'Liderança',  desc: 'Força coletiva em momentos decisivos' },
}

const TOKEN_ORDER = ['ousado', 'disciplinado', 'raca', 'frieza', 'lider']

export default function TokenPanel({
  tokens,
  onClose,
}: {
  tokens: Record<string, number>
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const total = Object.values(tokens).reduce((s, n) => s + n, 0)

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const activeTokens = TOKEN_ORDER.filter(t => (tokens[t] ?? 0) > 0)
  const inactiveTokens = TOKEN_ORDER.filter(t => (tokens[t] ?? 0) === 0)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-preto/40" onClick={onClose} />

      {/* Painel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-[448px] bg-papel border-t-2 border-preto"
        style={{ boxShadow: '0 -4px 0 #100F0D' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] py-[14px] border-b-2 border-preto/10">
          <div>
            <p className="font-headline font-black italic text-[18px] leading-none tracking-[-0.5px] text-preto">
              Bônus Ativos
            </p>
            <p className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase text-preto/40 mt-[2px]">
              {total > 0 ? `${total} token${total !== 1 ? 's' : ''} disponíveis` : 'Nenhum token ainda'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase text-preto/40 border border-preto/20 px-[8px] py-[4px] hover:text-preto hover:border-preto/50 transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Lista */}
        <div className="px-[16px] py-[12px] space-y-[8px] max-h-[50vh] overflow-y-auto">
          {total === 0 ? (
            <p className="text-[13px] text-preto/40 font-medium py-[8px] text-center">
              Faça escolhas no pré-jogo e na zona mista para ganhar tokens.
            </p>
          ) : (
            <>
              {activeTokens.map(token => {
                const meta = TOKEN_META[token]
                const count = tokens[token] ?? 0
                return (
                  <div key={token} className="flex items-center gap-[12px] py-[6px]">
                    <div className="flex items-center justify-center w-[32px] h-[32px] bg-amarelo shrink-0">
                      <span className="font-headline font-black text-[15px] text-preto leading-none">
                        {count}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-bold text-[14px] leading-none text-preto">
                        {meta?.label ?? token}
                      </p>
                      <p className="font-medium text-[11px] text-preto/50 mt-[2px] leading-[1.2]">
                        {meta?.desc}
                      </p>
                    </div>
                  </div>
                )
              })}

              {inactiveTokens.length > 0 && activeTokens.length > 0 && (
                <div className="border-t border-preto/10 pt-[8px] mt-[4px]">
                  {inactiveTokens.map(token => {
                    const meta = TOKEN_META[token]
                    return (
                      <div key={token} className="flex items-center gap-[12px] py-[5px] opacity-30">
                        <div className="flex items-center justify-center w-[32px] h-[32px] border border-preto/20 shrink-0">
                          <span className="font-headline font-bold text-[13px] text-preto/50">0</span>
                        </div>
                        <p className="font-headline font-bold text-[13px] text-preto">
                          {meta?.label ?? token}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
