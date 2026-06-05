import { BASE_COLOR } from '../lib/colors'

interface SequenceViewProps {
  sequence: string
  mrna: string
  protein: string
  highlightIndex?: number | null
  onBaseClick?: (index: number) => void
}

export function SequenceView({ sequence, mrna, protein, highlightIndex, onBaseClick }: SequenceViewProps) {
  const renderLine = (s: string, label: string, colorize = false) => (
    <div className="flex items-start gap-3">
      <div className="w-16 shrink-0 pt-0.5 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="flex-1 overflow-x-auto rounded-lg border border-ink-700/40 bg-ink-950/40 p-2 font-mono text-sm leading-relaxed">
        {s.length === 0 ? (
          <span className="text-ink-500">—</span>
        ) : colorize ? (
          <span className="whitespace-pre">
            {Array.from(s).map((c, i) => {
              const code = c as 'A' | 'T' | 'G' | 'C'
              const colorKey = (['A', 'T', 'G', 'C'].indexOf(c) === -1
                ? c === 'U' ? 4 : 0
                : (['A', 'T', 'G', 'C'].indexOf(c) as 0 | 1 | 2 | 3)) as 0 | 1 | 2 | 3 | 4
              void code
              const isHighlight = highlightIndex === i
              return (
                <span
                  key={i}
                  onClick={() => onBaseClick?.(i)}
                  className={`inline-block cursor-pointer px-px transition-all ${
                    isHighlight ? 'rounded bg-fuchsia-500/40 text-white' : 'hover:bg-ink-700/60'
                  }`}
                  style={{ color: BASE_COLOR[colorKey] }}
                >
                  {c}
                </span>
              )
            })}
          </span>
        ) : (
          <span className="whitespace-pre text-ink-200">{s}</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {renderLine(sequence, '5′ DNA 3′', true)}
      {renderLine(mrna, 'mRNA', true)}
      <div className="flex items-start gap-3">
        <div className="w-16 shrink-0 pt-0.5 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          Protein
        </div>
        <div className="flex-1 overflow-x-auto rounded-lg border border-ink-700/40 bg-ink-950/40 p-2 font-mono text-sm leading-relaxed">
          {protein.length === 0 ? (
            <span className="text-ink-500">—</span>
          ) : (
            <span className="whitespace-pre text-ink-200">{protein}</span>
          )}
        </div>
      </div>
    </div>
  )
}
