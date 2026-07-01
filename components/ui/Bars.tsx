import type { Efeitos, RunState } from '@/engine/types'

// Cor por barra — usa as CSS vars do tema ativo (Torcida=accent, Mídia=vermelho, Moral=verde, Físico=azul)
const BAR_CONFIG = [
  { key: 'torcida' as const, label: 'Tor', color: 'var(--color-accent)'   },
  { key: 'midia'   as const, label: 'Míd', color: 'var(--color-vermelho)' },
  { key: 'moral'   as const, label: 'Mor', color: 'var(--color-verde)'    },
  { key: 'fisico'  as const, label: 'Fís', color: 'var(--color-bar-fisico)' },
]

const ALERT_MIN = 15
const ALERT_MAX = 85

function MiniBar({
  label,
  value,
  color,
  delta,
}: {
  label: string
  value: number
  color: string
  delta?: number
}) {
  const isDanger = value <= ALERT_MIN || value >= ALERT_MAX
  const hasDelta = typeof delta === 'number' && delta !== 0

  return (
    <div>
      {/* Indicador de preview acima da barra */}
      <div className="h-[7px] flex items-center justify-center mb-[2px]">
        {hasDelta && (
          <span
            className="w-[4px] h-[4px] rounded-full block"
            style={{ background: isDanger ? 'var(--color-vermelho)' : color, opacity: 0.9 }}
          />
        )}
      </div>
      <div
        className="font-headline font-bold text-[8px] tracking-[0.06em] uppercase mb-[3px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.65 }}
      >
        {label}
      </div>
      {/* Trilho */}
      <div className="h-[7px] overflow-hidden" style={{ background: 'var(--bar-track)', borderRadius: 'var(--radius)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${value}%`,
            background: isDanger ? 'var(--color-vermelho)' : color,
            borderRadius: 'var(--radius)',
          }}
        />
      </div>
    </div>
  )
}

export default function Bars({ barras, preview }: { barras: RunState['barras']; preview?: Efeitos | null }) {
  return (
    <div className="grid grid-cols-4 gap-[7px]">
      {BAR_CONFIG.map(({ key, label, color }) => (
        <MiniBar
          key={key}
          label={label}
          value={barras[key]}
          color={color}
          delta={preview && typeof preview[key] === 'number' ? (preview[key] as number) : undefined}
        />
      ))}
    </div>
  )
}
