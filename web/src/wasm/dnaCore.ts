import initWasm, * as wasm from 'dna-core'
import type { HelixData } from '../lib/types'

const WASM_URL = `${import.meta.env.BASE_URL}wasm/dna_core_bg.wasm`

let initialized = false
let initializing: Promise<void> | null = null

export async function ensureWasm(): Promise<void> {
  if (initialized) return
  if (initializing) return initializing
  initializing = (async () => {
    await initWasm(WASM_URL)
    initialized = true
  })()
  return initializing
}

export function computeHelix(dna: string): HelixData {
  const raw = wasm.compute_helix(dna) as HelixData
  return raw
}

export function transcribe(dna: string): string {
  return wasm.transcribe_dna(dna)
}

export function translate(dna: string, frame: number): string {
  return wasm.translate_dna(dna, frame)
}

export function translateSixFrames(dna: string): string[] {
  return wasm.translate_six_frames_str(dna) as string[]
}

export function gcContent(dna: string): number {
  return wasm.gc_content(dna)
}

export function reverseComplement(dna: string): string {
  return wasm.reverse_complement(dna)
}

export function motifSearch(dna: string, motif: string): number[] {
  return wasm.motif_search(dna, motif) as number[]
}

export function mutateSubstitution(dna: string, pos: number): string {
  return wasm.mutate_substitution(dna, pos)
}

export function mutateDeletion(dna: string, pos: number): string {
  return wasm.mutate_deletion(dna, pos)
}

export function mutateInsertion(dna: string, pos: number): string {
  return wasm.mutate_insertion(dna, pos)
}

export function validate(dna: string): { ok: boolean; length: number; gc_content: number; at_content: number; kind: string } {
  return wasm.validate(dna) as { ok: boolean; length: number; gc_content: number; at_content: number; kind: string }
}

export function baseComplement(b: string): string {
  return wasm.base_complement(b)
}

export function aminoAcidLetter(codon: string): string {
  return wasm.amino_acid_name(codon)
}

export function cleanSequence(s: string): string {
  return s.replace(/[^ATGCatgcuU]/g, '').toUpperCase()
}
