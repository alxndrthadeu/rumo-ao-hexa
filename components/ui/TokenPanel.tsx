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

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const activeTokens   = TOKEN_ORDER.filter(t => (tokens[t] ?? 0) > 0)
  const inactiveTokens = TOKEN_ORDER.filter(t => (tokens[t] ?? 0) === 0)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-preto/40" onClick={onClose} />

      {/* Painel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-[448px]"
        style={{
          background: 'var(--color-surface)',
          borderTop: 'var(--border-w) solid var(--color-line)',
          boxShadow: '0 -4px 0 var(--color-line)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-[16px] py-[14px]"
          style={{ borderBottom: 'var(--border-w) solid', borderColor: 'color-mix(in srgb, var(--color-line) 25%, transparent)' }}
        >
          <div>
            <p
              className="font-headline font-black italic text-[18px] leading-none tracking-[-0.5px]"
              style={{ color: 'var(--color-ink)' }}
            >
              Bônus Ativos
            </p>
            <p
              className="font-headline font-bold text-[10px] tracking-[0.15em] uppercase mt-[2px]"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}
            >
              {total > 0 ? `${total} token${total !== 1 ? 's' : ''} disponíveis` : 'Nenhum token ainda'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase px-[8px] py-[4px] transition-colors"
            style={{ color: 'var(--color-ink)', opacity: 0.5, border: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 30%, transparent)' }}
          >
            Fechar
          </button>
        </div>

        {/* Lista */}
        <div className="px-[16px] py-[12px] space-y-[8px] max-h-[50vh] overflow-y-auto">
          {total === 0 ? (
            <p
              className="text-[13px] font-medium py-[8px] text-center"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}
            >
              Faça escolhas no pré-jogo e na zona mista para ganhar tokens.
            </p>
          ) : (
            <>
              {activeTokens.map(token => {
                const meta  = TOKEN_META[token]
                const count = tokens[token] ?? 0
                return (
                  <div key={token} className="flex items-center gap-[12px] py-[6px]">
                    <div className="flex items-center justify-center w-[32px] h-[32px] bg-amarelo shrink-0">
                      <span className="font-headline font-black text-[15px] text-preto leading-none">
                        {count}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-headline font-bold text-[14px] leading-none"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {meta?.label ?? token}
                      </p>
                      <p
                        className="font-medium text-[11px] mt-[2px] leading-[1.2]"
                        style={{ color: 'var(--color-ink)', opacity: 0.5 }}
                      >
                        {meta?.desc}
                      </p>
                    </div>
                  </div>
                )
              })}

              {inactiveTokens.length > 0 && activeTokens.length > 0 && (
                <div
                  className="pt-[8px] mt-[4px]"
                  style={{ borderTop: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 20%, transparent)' }}
                >
                  {inactiveTokens.map(token => {
                    const meta = TOKEN_META[token]
                    return (
                      <div key={token} className="flex items-center gap-[12px] py-[5px] opacity-30">
                        <div
                          className="flex items-center justify-center w-[32px] h-[32px] shrink-0"
                          style={{ border: '1px solid', borderColor: 'var(--color-line)' }}
                        >
                          <span
                            className="font-headline font-bold text-[13px]"
                            style={{ color: 'var(--color-ink)', opacity: 0.5 }}
                          >
                            0
                          </span>
                        </div>
                        <p
                          className="font-headline font-bold text-[13px]"
                          style={{ color: 'var(--color-ink)' }}
                        >
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
