import type { BaseCode } from './colors'

export interface HelixData {
  positions: number[]
  bases: number[]
  is_sense: boolean[]
  indices: number[]
  length: number
  turn_count: number
}

export interface SelectedBase {
  index: number
  is_sense: boolean
  base: BaseCode
}

export type MutationKind = 'substitution' | 'deletion' | 'insertion'

export interface MutationEvent {
  kind: MutationKind
  position: number
  newSequence: string
  previousBase?: string
  newBase?: string
}
