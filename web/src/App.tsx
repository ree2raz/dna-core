import { useEffect, useMemo, useRef, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { HelixScene } from './components/HelixScene'
import { SequenceView } from './components/SequenceView'
import { ProteinView } from './components/ProteinView'
import { StatsBar } from './components/StatsBar'
import { BaseInfoCard } from './components/BaseInfoCard'
import {
  ensureWasm,
  transcribe as transcribeWasm,
  translate as translateWasm,
  gcContent as gcWasm,
  mutateSubstitution as subWasm,
  mutateDeletion as delWasm,
  mutateInsertion as insWasm,
  reverseComplement as rcWasm,
  computeHelix,
} from './wasm/dnaCore'
import type { HelixData, MutationKind, SelectedBase } from './lib/types'

const INITIAL_SEQUENCE =
  'ATGCTAGCTAGCTGATCGATCGTAGCTAGCATCGATCGATCGATCGATCGATCGATCGAT'

interface Toast {
  id: number
  message: string
  kind: 'info' | 'success' | 'warn'
}

function App() {
  const [sequence, setSequence] = useState<string>(INITIAL_SEQUENCE)
  const [wasmReady, setWasmReady] = useState(false)
  const [wasmError, setWasmError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SelectedBase | null>(null)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showStars, setShowStars] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)
  const [helix, setHelix] = useState<HelixData | null>(null)
  const [mrna, setMrna] = useState<string>('')
  const [protein, setProtein] = useState<string>('')
  const [gc, setGc] = useState<number>(0)

  useEffect(() => {
    ensureWasm()
      .then(() => setWasmReady(true))
      .catch((e) => setWasmError(e?.message ?? String(e)))
  }, [])

  useEffect(() => {
    if (!wasmReady) return
    const clean = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
    if (!clean) {
      setMrna('')
      setProtein('')
      setGc(0)
      return
    }
    try {
      setMrna(transcribeWasm(clean))
      setProtein(translateWasm(clean, 0))
      setGc(gcWasm(clean))
    } catch (e) {
      console.error(e)
    }
  }, [sequence, wasmReady])

  useEffect(() => {
    if (!wasmReady || !sequence) {
      setHelix(null)
      return
    }
    const clean = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
    if (!clean) {
      setHelix(null)
      return
    }
    try {
      setHelix(computeHelix(clean))
    } catch (e) {
      console.error(e)
    }
  }, [sequence, wasmReady])

  const pushToast = (message: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastIdRef.current
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }

  const handleMutate = (kind: MutationKind) => {
    if (!sequence) return
    const clean = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
    if (!clean) return
    const pos = Math.floor(Math.random() * clean.length)
    try {
      let next: string
      if (kind === 'substitution') next = subWasm(clean, pos)
      else if (kind === 'deletion') next = delWasm(clean, pos)
      else next = insWasm(clean, pos)
      setSequence(next)
      setHighlightIndex(pos)
      setTimeout(() => setHighlightIndex(null), 1800)
      pushToast(`${kind} at position ${pos + 1}`, kind === 'deletion' ? 'warn' : 'info')
    } catch (e) {
      pushToast(`mutation failed: ${(e as Error).message}`, 'warn')
    }
  }

  const handleAutoMutate = () => {
    const kinds: MutationKind[] = ['substitution', 'substitution', 'substitution', 'deletion', 'insertion']
    let next = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
    if (!next) return
    const positions: number[] = []
    for (let i = 0; i < 3; i++) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      const pos = Math.floor(Math.random() * next.length)
      if (kind === 'substitution') next = subWasm(next, pos)
      else if (kind === 'deletion') next = delWasm(next, pos)
      else next = insWasm(next, pos)
      positions.push(pos)
    }
    setSequence(next)
    setHighlightIndex(positions[positions.length - 1])
    setTimeout(() => setHighlightIndex(null), 1800)
    pushToast('UV burst: 3 mutations applied', 'warn')
  }

  const handleReverse = () => {
    setSequence((s) => s.split('').reverse().join(''))
    pushToast('reversed', 'info')
  }

  const handleComplement = () => {
    try {
      const clean = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
      const rc = rcWasm(clean)
      setSequence(rc)
      pushToast('reverse complement applied', 'info')
    } catch (e) {
      pushToast(`complement failed: ${(e as Error).message}`, 'warn')
    }
  }

  const handleClear = () => {
    setSequence('')
    setSelected(null)
  }

  const handleSelectBase = (b: SelectedBase) => {
    setSelected(b)
    setHighlightIndex(b.index)
    setTimeout(() => setHighlightIndex(null), 1500)
  }

  const stats = useMemo(() => {
    if (!helix) return { length: 0, turns: 0, height: 0, at: 0 }
    return {
      length: helix.length,
      turns: helix.turn_count,
      height: helix.length * 3.4,
      at: 1 - gc,
    }
  }, [helix, gc])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink-950 text-ink-100">
      {wasmError && (
        <div className="absolute inset-x-0 top-0 z-50 bg-rose-900/90 p-3 text-center text-sm text-rose-100">
          WASM failed to load: {wasmError}
        </div>
      )}

      <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr_360px]">
        <aside className="border-r border-ink-700/40 bg-ink-900/40 p-4 overflow-y-auto">
          <header className="mb-4">
            <div className="flex items-center gap-2">
              <DnaLogo />
              <h1 className="text-lg font-semibold tracking-tight text-ink-100">genome-canvas</h1>
            </div>
            <p className="mt-1 text-[11px] text-ink-500">
              3D DNA playground · Rust <span className="text-accent">→</span> WASM <span className="text-accent">→</span> Three.js
            </p>
          </header>
          <ControlPanel
            sequence={sequence}
            onSequenceChange={setSequence}
            onMutate={handleMutate}
            onAutoMutate={handleAutoMutate}
            onReverse={handleReverse}
            onComplement={handleComplement}
            onClear={handleClear}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            showStars={showStars}
            onToggleStars={() => setShowStars((v) => !v)}
            canMutate={sequence.length > 0}
          />
          <div className="mt-4">
            <StatsBar
              length={stats.length}
              gc={gc}
              at={stats.at}
              turns={stats.turns}
              helixHeight={stats.height}
            />
          </div>
        </aside>

        <main className="relative bg-ink-950">
          {!wasmReady && !wasmError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-ink-400">
              <div className="text-center">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin-slow rounded-full border-2 border-ink-700 border-t-accent" />
                <p className="text-sm">loading Rust → WebAssembly core…</p>
              </div>
            </div>
          )}
          <HelixScene
            sequence={sequence}
            highlightIndex={highlightIndex}
            onSelectBase={handleSelectBase}
            autoRotate={autoRotate}
            showStars={showStars}
          />
          <BaseInfoCard
            selected={selected}
            sequence={sequence}
            onClose={() => setSelected(null)}
          />
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900/60 px-3 py-1 text-[10px] uppercase tracking-wider text-ink-500 backdrop-blur">
            drag to rotate · scroll to zoom · click a base
          </div>
          <div className="pointer-events-none absolute right-4 top-4 flex flex-col gap-1">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-auto rounded-md border px-3 py-1.5 text-xs backdrop-blur ${
                  t.kind === 'warn'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                    : t.kind === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-ink-700/40 bg-ink-900/80 text-ink-200'
                }`}
              >
                {t.message}
              </div>
            ))}
          </div>
        </main>

        <aside className="border-l border-ink-700/40 bg-ink-900/40 p-4 overflow-y-auto">
          <div className="panel p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">Sequences</h2>
            <SequenceView
              sequence={sequence}
              mrna={mrna}
              protein={protein}
              highlightIndex={highlightIndex}
              onBaseClick={(i) => {
                setHighlightIndex(i)
                setTimeout(() => setHighlightIndex(null), 1500)
              }}
            />
          </div>
          <div className="panel mt-4 p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-100">
              Protein{' '}
              <span className="text-[11px] font-normal text-ink-500">frame +1</span>
            </h2>
            <ProteinView protein={protein} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function DnaLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="20" cy="20" r="6" fill="#ef4444" />
      <circle cx="44" cy="20" r="6" fill="#3b82f6" />
      <circle cx="20" cy="44" r="6" fill="#22c55e" />
      <circle cx="44" cy="44" r="6" fill="#facc15" />
      <line x1="20" y1="20" x2="44" y2="20" stroke="#64748b" strokeWidth="2" />
      <line x1="20" y1="44" x2="44" y2="44" stroke="#64748b" strokeWidth="2" />
      <line x1="20" y1="20" x2="20" y2="44" stroke="#a78bfa" strokeWidth="2" opacity="0.6" />
      <line x1="44" y1="20" x2="44" y2="44" stroke="#22d3ee" strokeWidth="2" opacity="0.6" />
    </svg>
  )
}

export default App
