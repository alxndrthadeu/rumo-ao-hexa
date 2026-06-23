import clsx from 'clsx'
import type { Fase } from '@/engine/types'

const LABELS: Record<Fase, { titulo: string; sub: string; cor: string }> = {
  planejar:   { titulo: 'Véspera',    sub: 'Concentração', cor: 'bg-azul'    },
  reagir:     { titulo: '90 Min',     sub: '',             cor: 'bg-vermelho' },
  entrevista: { titulo: 'Zona Mista', sub: 'Coletiva',     cor: 'bg-verde'   },
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
  const { titulo, sub, cor } = LABELS[fase]
  const subtitulo = fase === 'reagir' && adversario ? adversario.toUpperCase() : sub.toUpperCase()

  return (
    <div className="flex items-center gap-3 mb-[3px]">
      <span
        className={clsx(
          'inline-block font-headline font-black italic text-[11px] tracking-[0.08em] uppercase text-white px-[10px] py-[4px]',
          cor
        )}
        style={{ transform: 'skewX(-8deg)' }}
      >
        {titulo}
      </span>
      <span
        className="font-headline font-bold text-[9px] tracking-[0.15em] uppercase"
        style={{ color: 'rgba(255,255,255,0.72)' }}
      >
        P{partida} · {subtitulo}
      </span>
    </div>
  )
}
