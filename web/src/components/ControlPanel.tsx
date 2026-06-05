import { useState } from 'react'
import { PRESETS } from '../lib/presets'
import { motifSearch } from '../wasm/dnaCore'

interface ControlPanelProps {
  sequence: string
  onSequenceChange: (s: string) => void
  onMutate: (kind: 'substitution' | 'deletion' | 'insertion') => void
  onAutoMutate: () => void
  onReverse: () => void
  onComplement: () => void
  onClear: () => void
  autoRotate: boolean
  onToggleAutoRotate: () => void
  showStars: boolean
  onToggleStars: () => void
  canMutate: boolean
}

export function ControlPanel({
  sequence,
  onSequenceChange,
  onMutate,
  onAutoMutate,
  onReverse,
  onComplement,
  onClear,
  autoRotate,
  onToggleAutoRotate,
  showStars,
  onToggleStars,
  canMutate,
}: ControlPanelProps) {
  const [motifQuery, setMotifQuery] = useState('')
  const [motifHits, setMotifHits] = useState<number[]>([])

  const handleMotifSearch = () => {
    if (!motifQuery.trim()) {
      setMotifHits([])
      return
    }
    try {
      const hits = motifSearch(sequence, motifQuery.toUpperCase())
      setMotifHits(hits)
    } catch {
      setMotifHits([])
    }
  }

  return (
    <div className="panel flex flex-col gap-4 p-4">
      <div>
        <label className="label mb-1.5 block">DNA sequence</label>
        <textarea
          className="input min-h-[88px] resize-y break-all"
          value={sequence}
          spellCheck={false}
          placeholder="Paste or type A T G C bases…"
          onChange={(e) => onSequenceChange(e.target.value.toUpperCase())}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              className="btn-ghost text-[11px] py-1"
              onClick={() => onSequenceChange(p.sequence)}
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label mb-1.5 block">Mutations</label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            className="btn-primary"
            disabled={!canMutate}
            onClick={() => onMutate('substitution')}
            title="Substitute the base at a random position"
          >
            Substitute
          </button>
          <button
            className="btn-danger"
            disabled={!canMutate}
            onClick={() => onMutate('deletion')}
            title="Delete the base at a random position"
          >
            Delete
          </button>
          <button
            className="btn-primary"
            disabled={!canMutate}
            onClick={() => onMutate('insertion')}
            title="Insert a random base at a random position"
          >
            Insert
          </button>
        </div>
        <button
          className="btn-ghost mt-1.5 w-full text-xs"
          disabled={!canMutate}
          onClick={onAutoMutate}
          title="Apply 3 random mutations in a row"
        >
          UV burst (3× random)
        </button>
      </div>

      <div>
        <label className="label mb-1.5 block">Sequence ops</label>
        <div className="grid grid-cols-3 gap-1.5">
          <button className="btn-ghost text-xs" disabled={!sequence} onClick={onReverse}>
            Reverse
          </button>
          <button className="btn-ghost text-xs" disabled={!sequence} onClick={onComplement}>
            Complement
          </button>
          <button className="btn-ghost text-xs" disabled={!sequence} onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div>
        <label className="label mb-1.5 block">Motif search</label>
        <div className="flex gap-1.5">
          <input
            className="input flex-1"
            value={motifQuery}
            onChange={(e) => setMotifQuery(e.target.value.toUpperCase())}
            placeholder="GAATTC"
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Enter' && handleMotifSearch()}
          />
          <button className="btn-ghost" onClick={handleMotifSearch}>
            Find
          </button>
        </div>
        {motifHits.length > 0 && (
          <p className="mt-1.5 text-[11px] text-ink-400">
            Hits at positions:{' '}
            <span className="font-mono text-accent">{motifHits.join(', ')}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center justify-between text-xs text-ink-400">
          <span>Auto-rotate</span>
          <button
            className={`pill ${autoRotate ? 'bg-accent/20 text-accent' : 'bg-ink-800 text-ink-500'}`}
            onClick={onToggleAutoRotate}
          >
            {autoRotate ? 'on' : 'off'}
          </button>
        </label>
        <label className="flex items-center justify-between text-xs text-ink-400">
          <span>Star field</span>
          <button
            className={`pill ${showStars ? 'bg-accent/20 text-accent' : 'bg-ink-800 text-ink-500'}`}
            onClick={onToggleStars}
          >
            {showStars ? 'on' : 'off'}
          </button>
        </label>
      </div>
    </div>
  )
}
