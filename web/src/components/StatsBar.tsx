interface StatsBarProps {
  length: number
  gc: number
  at: number
  turns: number
  helixHeight: number
}

export function StatsBar({ length, gc, at, turns, helixHeight }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-700/40 bg-ink-700/20 sm:grid-cols-5">
      <Stat label="Length" value={`${length} bp`} />
      <Stat label="GC content" value={`${(gc * 100).toFixed(1)}%`} accent={gc > 0.6 || gc < 0.3 ? 'rose' : 'cyan'} />
      <Stat label="AT content" value={`${(at * 100).toFixed(1)}%`} />
      <Stat label="Turns" value={turns.toFixed(2)} />
      <Stat label="Height" value={`${helixHeight.toFixed(1)} Å`} />
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'cyan' | 'rose' }) {
  const color =
    accent === 'rose'
      ? 'text-rose-300'
      : accent === 'cyan'
        ? 'text-accent'
        : 'text-ink-100'
  return (
    <div className="bg-ink-900/80 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-0.5 font-mono text-base font-semibold ${color}`}>{value}</div>
    </div>
  )
}
