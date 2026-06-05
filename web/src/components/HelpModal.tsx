import { useEffect } from 'react'
import { BASE_COLOR, BASE_LETTER, BASE_NAME } from '../lib/colors'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Help"
    >
      <div
        className="panel relative max-h-[88vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink-500 transition hover:bg-ink-700/60 hover:text-ink-100"
          onClick={onClose}
          aria-label="Close help"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.1 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-100">How to use genome-canvas</h2>
            <p className="text-[12px] text-ink-500">A 3D DNA playground powered by Rust → WebAssembly</p>
          </div>
        </div>

        <Section title="Quick start" icon="play">
          <ol className="list-decimal space-y-1.5 pl-5 text-ink-300">
            <li>
              Type or paste a DNA sequence (A, T, G, C) in the <strong>DNA sequence</strong> box on the left.
            </li>
            <li>
              The 3D double helix renders instantly in the center. Drag to rotate, scroll to zoom, right-click to pan.
            </li>
            <li>
              Click any base in the helix (or in the sequence strip on the right) to inspect it.
            </li>
            <li>
              Try the preset buttons (<em>Random 60</em>, <em>GFP start</em>, <em>TP53 promoter</em>, <em>EcoRI site</em>, <em>Short demo</em>) for quick examples.
            </li>
          </ol>
        </Section>

        <Section title="Reading the 3D structure" icon="eye">
          <ul className="list-disc space-y-1.5 pl-5 text-ink-300">
            <li>
              The <strong>two backbone ribbons</strong> trace the sugar-phosphate strands. They twist once every
              10.5 base pairs (B-form geometry).
            </li>
            <li>
              The <strong>colored rungs</strong> are the base pairs. Each rung connects a sense base to its antisense
              complement across the helix axis.
            </li>
            <li>
              The <strong>small sphere at each end</strong> of a rung is the base itself. Click it to see its name,
              complement, codon, and amino acid.
            </li>
          </ul>
        </Section>

        <Section title="Base color key" icon="palette">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([0, 1, 2, 3] as const).map((code) => (
              <div
                key={code}
                className="flex items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-800/40 px-2.5 py-1.5"
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ background: BASE_COLOR[code], boxShadow: `0 0 8px ${BASE_COLOR[code]}66` }}
                />
                <div className="leading-tight">
                  <div className="font-mono text-sm font-semibold text-ink-100">{BASE_LETTER[code]}</div>
                  <div className="text-[10px] text-ink-500">{BASE_NAME[code]}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-ink-500">
            Pairs always bond <span className="font-mono text-rose-300">A↔T</span> and{' '}
            <span className="font-mono text-emerald-300">G↔C</span> — visible in the 3D scene as you rotate.
          </p>
        </Section>

        <Section title="Mutations & operations" icon="dna">
          <div className="space-y-2 text-ink-300">
            <Row label="Substitute" desc="Swap a random base for a different one (point mutation)." />
            <Row label="Delete" desc="Remove a random base (frameshift risk)." />
            <Row label="Insert" desc="Add a random base (frameshift risk)." />
            <Row label="UV burst" desc="Apply 3 random mutations in a row." />
            <Row label="Reverse" desc="Read the sequence 3′→5′." />
            <Row label="Complement" desc="Apply the reverse complement (switches strand orientation)." />
            <Row label="Clear" desc="Empty the sequence box." />
          </div>
        </Section>

        <Section title="Right-side panels" icon="panel">
          <ul className="list-disc space-y-1.5 pl-5 text-ink-300">
            <li>
              <strong>Sequences</strong> — live view of the 5′→3′ DNA, the transcribed mRNA, and the translated
              protein.
            </li>
            <li>
              <strong>Protein (frame +1)</strong> — amino acid tiles, counts of each residue, and the translated
              length.
            </li>
            <li>
              <strong>Motif search</strong> — type a short pattern (e.g. <span className="font-mono text-accent">GAATTC</span>,
              the EcoRI site) and find every position it occurs.
            </li>
          </ul>
        </Section>

        <Section title="Tips & shortcuts" icon="key">
          <ul className="list-disc space-y-1.5 pl-5 text-ink-300">
            <li>
              Press <Kbd>Esc</Kbd> to close this help window.
            </li>
            <li>
              <Kbd>Drag</Kbd> to rotate, <Kbd>scroll</Kbd> to zoom, <Kbd>right-drag</Kbd> to pan the camera.
            </li>
            <li>
              Toggle <strong>auto-rotate</strong> in the control panel to keep the helix spinning while you read.
            </li>
            <li>
              The whole app is computed locally in your browser — no data leaves your machine.
            </li>
          </ul>
        </Section>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-ink-700/40 pt-4 sm:flex-row sm:items-center">
          <p className="text-[12px] text-ink-500">
            Built with Rust · WebAssembly · React · Three.js. Source on GitHub:{' '}
            <a
              className="text-accent hover:underline"
              href="https://github.com/ree2raz/dna-core"
              target="_blank"
              rel="noreferrer noopener"
            >
              ree2raz/dna-core
            </a>
          </p>
          <button className="btn-primary text-xs" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: 'play' | 'eye' | 'palette' | 'dna' | 'panel' | 'key'
  children: React.ReactNode
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        <SectionIcon name={icon} />
        {title}
      </h3>
      <div className="text-sm">{children}</div>
    </section>
  )
}

function SectionIcon({ name }: { name: 'play' | 'eye' | 'palette' | 'dna' | 'panel' | 'key' }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'play':
      return (
        <svg {...common}>
          <polygon points="6 4 20 12 6 20 6 4" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'palette':
      return (
        <svg {...common}>
          <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
          <path d="M12 2a10 10 0 100 20 2 2 0 002-2 2 2 0 012-2h2a4 4 0 004-4 10 10 0 00-10-10z" />
        </svg>
      )
    case 'dna':
      return (
        <svg {...common}>
          <path d="M4 4c4 4 12 4 16 0M4 20c4-4 12-4 16 0" />
          <path d="M4 4c4 4 4 12 0 16M20 4c-4 4-4 12 0 16" />
        </svg>
      )
    case 'panel':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      )
    case 'key':
      return (
        <svg {...common}>
          <path d="M21 2l-2 2m-7.6 7.6a5 5 0 11-7 7 5 5 0 017-7L19 9l-2 2-2-2 2-2 2 2" />
        </svg>
      )
  }
}

function Row({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 font-medium text-ink-100">{label}</span>
      <span className="text-ink-400">{desc}</span>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ink-700 bg-ink-800/80 px-1.5 py-0.5 font-mono text-[11px] text-ink-200">
      {children}
    </kbd>
  )
}
