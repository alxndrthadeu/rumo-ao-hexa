'use client'

import clsx from 'clsx'
import type { RunState } from '@/engine/types'

const BARS = [
  { key: 'torcida' as const, label: 'Torcida', emoji: '🏟️' },
  { key: 'midia' as const, label: 'Mídia', emoji: '📺' },
  { key: 'moral' as const, label: 'Moral', emoji: '🤝' },
  { key: 'fisico' as const, label: 'Físico', emoji: '⚽' },
]

const ALERT_MIN = 15
const ALERT_MAX = 85

function BarItem({ label, emoji, value }: { label: string; emoji: string; value: number }) {
  const isDanger = value <= ALERT_MIN || value >= ALERT_MAX

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-white/80">
          {emoji} {label}
        </span>
        <span className={clsx('text-xs tabular-nums font-bold', isDanger ? 'text-vermelho' : 'text-white/60')}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            isDanger ? 'bg-vermelho' : 'bg-amarelo'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function Bars({ barras }: { barras: RunState['barras'] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {BARS.map(({ key, label, emoji }) => (
        <BarItem key={key} label={label} emoji={emoji} value={barras[key]} />
      ))}
    </div>
  )
}
