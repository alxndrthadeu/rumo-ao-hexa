import clsx from 'clsx'
import type { Efeitos, RunState } from '@/engine/types'

const BARS = [
  { key: 'torcida' as const, label: 'Tor' },
  { key: 'midia'   as const, label: 'Míd' },
  { key: 'moral'   as const, label: 'Mor' },
  { key: 'fisico'  as const, label: 'Fís' },
]

const ALERT_MIN = 15
const ALERT_MAX = 85

function MiniBar({ label, value, showDot }: { label: string; value: number; showDot: boolean }) {
  const isDanger = value <= ALERT_MIN || value >= ALERT_MAX
  return (
    <div>
      {/* Label + valor numérico */}
      <div className="flex items-center justify-between mb-[3px]">
        <span
          className="font-headline font-bold text-[8px] tracking-[0.06em] uppercase"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {label}
        </span>
        <span
          className="font-headline font-black text-[10px] tabular-nums"
          style={{ color: isDanger ? 'var(--color-amarelo)' : 'rgba(255,255,255,0.85)' }}
        >
          {value}
        </span>
      </div>
      {/* Barra */}
      <div className="h-[6px]" style={{ background: 'rgba(255,255,255,0.18)' }}>
        <div
          className={clsx(
            'h-full transition-all duration-500',
            isDanger ? 'bg-vermelho' : 'bg-amarelo'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      {/* Preview dot */}
      <div className="h-[5px] flex items-center justify-center mt-[1px]">
        {showDot && (
          <span className="w-[4px] h-[4px] rounded-full block" style={{ background: 'rgba(255,255,255,0.7)' }} />
        )}
      </div>
    </div>
  )
}

export default function Bars({ barras, preview }: { barras: RunState['barras']; preview?: Efeitos | null }) {
  return (
    <div className="grid grid-cols-4 gap-[7px]">
      {BARS.map(({ key, label }) => (
        <MiniBar
          key={key}
          label={label}
          value={barras[key]}
          showDot={!!preview && typeof preview[key] === 'number' && (preview[key] as number) !== 0}
        />
      ))}
    </div>
  )
}
