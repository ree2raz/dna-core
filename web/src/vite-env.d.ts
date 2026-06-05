/// <reference types="vite/client" />

declare module 'dna-core' {
  export default function initWasm(input?: unknown): Promise<unknown>
  export function initSync(input?: unknown): unknown
  export function compute_helix(dna: string): unknown
  export function transcribe_dna(dna: string): string
  export function translate_dna(dna: string, frame: number): string
  export function translate_six_frames_str(dna: string): string[]
  export function find_orfs_js(dna: string, min_aa: number): unknown
  export function gc_content(dna: string): number
  export function reverse_complement(dna: string): string
  export function motif_search(dna: string, motif: string): number[]
  export function mutate_substitution(dna: string, pos: number): string
  export function mutate_deletion(dna: string, pos: number): string
  export function mutate_insertion(dna: string, pos: number): string
  export function mutate_random_kind(): string
  export function validate(dna: string): unknown
  export function base_complement(b: string): string
  export function amino_acid_name(codon: string): string
}
