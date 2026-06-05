import { BASE_COLOR, BASE_LETTER, BASE_NAME } from '../lib/colors'
import type { SelectedBase } from '../lib/types'

interface BaseInfoCardProps {
  selected: SelectedBase | null
  sequence: string
  onClose: () => void
}

export function BaseInfoCard({ selected, sequence, onClose }: BaseInfoCardProps) {
  if (!selected) return null
  const letter = BASE_LETTER[selected.base]
  const name = BASE_NAME[selected.base]
  const color = BASE_COLOR[selected.base]
  const complement = complementOf(letter)
  const codon = sequence.slice(selected.index, selected.index + 3)
  const codonAA = codon.length === 3 ? codonTable[codon] : '—'

  return (
    <div
      className="panel pointer-events-auto absolute right-4 top-4 w-72 p-4 text-sm"
      style={{ boxShadow: `0 0 32px -8px ${color}66` }}
    >
      <button
        className="absolute right-2 top-2 rounded p-1 text-ink-500 hover:bg-ink-700/60 hover:text-ink-100"
        onClick={onClose}
      >
        ✕
      </button>
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl font-mono text-xl font-bold"
          style={{
            background: `${color}28`,
            color,
            border: `1px solid ${color}55`,
          }}
        >
          {letter}
        </div>
        <div>
          <div className="text-base font-semibold text-ink-100">{name}</div>
          <div className="text-[11px] uppercase tracking-wider text-ink-500">
            {selected.is_sense ? 'Sense strand' : 'Antisense strand'}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="label">Position</div>
          <div className="font-mono text-ink-100">{selected.index + 1}</div>
        </div>
        <div>
          <div className="label">Complement</div>
          <div className="font-mono" style={{ color: BASE_COLOR[codeFor(complement) as 0 | 1 | 2 | 3] }}>
            {complement}
          </div>
        </div>
        <div>
          <div className="label">Codon (frame 0)</div>
          <div className="font-mono text-ink-100">{codon || '—'}</div>
        </div>
        <div>
          <div className="label">Amino acid</div>
          <div className="font-mono text-ink-100">{codonAA}</div>
        </div>
      </div>
    </div>
  )
}

function complementOf(b: string): string {
  if (b === 'A') return 'T'
  if (b === 'T') return 'A'
  if (b === 'G') return 'C'
  if (b === 'C') return 'G'
  if (b === 'U') return 'A'
  return 'N'
}

function codeFor(b: string): 0 | 1 | 2 | 3 | 4 {
  if (b === 'A') return 0
  if (b === 'T') return 1
  if (b === 'G') return 2
  if (b === 'C') return 3
  if (b === 'U') return 4
  return 0
}

const codonTable: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
}
