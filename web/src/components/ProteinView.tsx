import { AA_COLOR, AA_NAME } from '../lib/colors'

interface ProteinViewProps {
  protein: string
}

export function ProteinView({ protein }: ProteinViewProps) {
  if (!protein) {
    return <div className="text-xs text-ink-500">No protein produced.</div>
  }

  const stats: Record<string, number> = {}
  for (const c of protein) {
    stats[c] = (stats[c] ?? 0) + 1
  }
  const stopCount = stats['*'] ?? 0
  const proteinLen = protein.length - stopCount
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 text-xs text-ink-400">
        <div>
          <span className="text-ink-500">Length: </span>
          <span className="font-mono text-ink-200">{proteinLen} aa</span>
        </div>
        <div>
          <span className="text-ink-500">Stops: </span>
          <span className="font-mono text-ink-200">{stopCount}</span>
        </div>
        <div>
          <span className="text-ink-500">Unique: </span>
          <span className="font-mono text-ink-200">{sorted.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {Array.from(protein).map((c, i) => (
          <div
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm font-bold shadow-sm"
            style={{
              background: `${AA_COLOR[c] ?? '#6b7280'}28`,
              color: AA_COLOR[c] ?? '#6b7280',
              border: `1px solid ${AA_COLOR[c] ?? '#6b7280'}55`,
            }}
            title={AA_NAME[c] ?? c}
          >
            {c}
          </div>
        ))}
      </div>

      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:grid-cols-3">
          {sorted.map(([c, n]) => (
            <div key={c} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: AA_COLOR[c] ?? '#6b7280' }}
              />
              <span className="font-mono text-ink-200">{c}</span>
              <span className="text-ink-500">·</span>
              <span className="text-ink-500">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
