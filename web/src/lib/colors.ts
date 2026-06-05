export type BaseCode = 0 | 1 | 2 | 3 | 4

export const BASE_LETTER: Record<BaseCode, string> = {
  0: 'A',
  1: 'T',
  2: 'G',
  3: 'C',
  4: 'U',
}

export const BASE_NAME: Record<BaseCode, string> = {
  0: 'Adenine',
  1: 'Thymine',
  2: 'Guanine',
  3: 'Cytosine',
  4: 'Uracil',
}

export const BASE_COLOR: Record<BaseCode, string> = {
  0: '#ef4444',
  1: '#3b82f6',
  2: '#22c55e',
  3: '#facc15',
  4: '#fb923c',
}

export const BASE_TINT: Record<BaseCode, string> = {
  0: 'rgba(239, 68, 68, 0.85)',
  1: 'rgba(59, 130, 246, 0.85)',
  2: 'rgba(34, 197, 94, 0.85)',
  3: 'rgba(250, 204, 21, 0.85)',
  4: 'rgba(251, 146, 60, 0.85)',
}

export const AA_COLOR: Record<string, string> = {
  A: '#ef4444',
  R: '#3b82f6',
  N: '#a855f7',
  D: '#f97316',
  C: '#facc15',
  Q: '#14b8a6',
  E: '#f97316',
  G: '#22c55e',
  H: '#ec4899',
  I: '#06b6d4',
  L: '#0ea5e9',
  K: '#8b5cf6',
  M: '#fbbf24',
  F: '#84cc16',
  P: '#10b981',
  S: '#22d3ee',
  T: '#fde047',
  W: '#a3e635',
  Y: '#f472b6',
  V: '#34d399',
  '*': '#6b7280',
}

export const AA_NAME: Record<string, string> = {
  A: 'Alanine',
  R: 'Arginine',
  N: 'Asparagine',
  D: 'Aspartic acid',
  C: 'Cysteine',
  Q: 'Glutamine',
  E: 'Glutamic acid',
  G: 'Glycine',
  H: 'Histidine',
  I: 'Isoleucine',
  L: 'Leucine',
  K: 'Lysine',
  M: 'Methionine',
  F: 'Phenylalanine',
  P: 'Proline',
  S: 'Serine',
  T: 'Threonine',
  W: 'Tryptophan',
  Y: 'Tyrosine',
  V: 'Valine',
  '*': 'Stop',
}
