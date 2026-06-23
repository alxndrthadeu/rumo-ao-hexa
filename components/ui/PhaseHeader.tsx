import type { Fase } from '@/engine/types'

const LABELS: Record<Fase, { titulo: string; sub: string }> = {
  planejar:   { titulo: 'VÉSPERA',     sub: 'CONCENTRAÇÃO' },
  reagir:     { titulo: '90 MINUTOS',  sub: '' },
  entrevista: { titulo: 'ZONA MISTA',  sub: 'COLETIVA' },
}

export default function PhaseHeader({
  fase,
  adversario,
  partida,
}: {
  fase: Fase
  adversario?: string
  partida: number
}) {
  const { titulo, sub } = LABELS[fase]
  const subtitulo = fase === 'reagir' && adversario ? `vs ${adversario.toUpperCase()}` : sub

  return (
    <div className="text-center py-2">
      <p className="font-headline font-black text-[10px] tracking-[0.2em] text-amarelo/70 uppercase">
        PARTIDA {partida} · {titulo}
      </p>
      {subtitulo && (
        <p className="font-headline font-bold text-xs tracking-widest text-white/60 uppercase mt-0.5">
          {subtitulo}
        </p>
      )}
    </div>
  )
}
