export interface Preset {
  name: string
  description: string
  sequence: string
}

export const PRESETS: Preset[] = [
  {
    name: 'Random 60',
    description: 'A random 60bp starter sequence',
    sequence:
      'ATGCTAGCTAGCTGATCGATCGTAGCTAGCATCGATCGATCGATCGATCGATCGATCGAT',
  },
  {
    name: 'GFP start',
    description: 'The first 60 bases of Green Fluorescent Protein (GFP)',
    sequence:
      'ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGAC',
  },
  {
    name: 'TP53 promoter',
    description: 'A 60bp region of the TP53 tumor suppressor promoter',
    sequence:
      'TCCGAGGGGTCGGGAGGGGCGGGTCCTCAGCCCTTGGTCCCTCCTCCCTCTCCCTGTGCC',
  },
  {
    name: 'EcoRI site',
    description: 'A 60bp sequence containing the EcoRI cut site (GAATTC)',
    sequence:
      'ATGCGAATTCAAGCTTGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG',
  },
  {
    name: 'Short demo',
    description: 'A small 24bp sequence for quick experimentation',
    sequence: 'ATGCATGCATGCATGCATGCATGC',
  },
]
