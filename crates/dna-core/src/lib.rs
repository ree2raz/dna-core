pub mod base;
pub mod helix;
pub mod mutation;
pub mod protein;
pub mod rna;
pub mod strand;

use base::{Base, NucleicAcid};
use helix::{compute_helix as compute_helix_inner, flatten_bases, flatten_positions, Helix};
use mutation::MutationKind;
use protein::{protein_string, translate, translate_six_frames, find_orfs, AminoAcid};
use rna::{reverse_transcribe, transcribe};
use serde::Serialize;
use strand::Strand;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct HelixOutput {
    positions: Vec<f32>,
    bases: Vec<u8>,
    is_sense: Vec<bool>,
    indices: Vec<u32>,
    length: u32,
    turn_count: f32,
}

fn helix_to_output(h: Helix) -> HelixOutput {
    let positions = flatten_positions(&h);
    let bases = flatten_bases(&h);
    let is_sense: Vec<bool> = h.coords.iter().map(|c| c.is_sense).collect();
    let indices: Vec<u32> = h.coords.iter().map(|c| c.index as u32).collect();
    HelixOutput {
        positions,
        bases,
        is_sense,
        indices,
        length: h.length as u32,
        turn_count: h.turn_count,
    }
}

fn parse_dna(s: &str) -> Result<Strand, JsValue> {
    Strand::from_string(s, NucleicAcid::Dna).map_err(|e| JsValue::from_str(&e))
}

fn parse_rna(s: &str) -> Result<Strand, JsValue> {
    Strand::from_string(s, NucleicAcid::Rna).map_err(|e| JsValue::from_str(&e))
}

fn js_err<E: std::fmt::Display>(e: E) -> JsValue {
    JsValue::from_str(&e.to_string())
}

#[wasm_bindgen(start)]
pub fn _start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn compute_helix(dna: &str) -> Result<JsValue, JsValue> {
    let strand = parse_dna(dna)?;
    let h = compute_helix_inner(&strand);
    serde_wasm_bindgen::to_value(&helix_to_output(h)).map_err(js_err)
}

#[wasm_bindgen]
pub fn transcribe_dna(dna: &str) -> Result<String, JsValue> {
    let s = parse_dna(dna)?;
    Ok(transcribe(&s).map_err(js_err)?.to_string())
}

#[wasm_bindgen]
pub fn translate_dna(dna: &str, frame: u8) -> Result<String, JsValue> {
    let s = parse_dna(dna)?;
    Ok(protein_string(&translate(&s, frame as usize).map_err(js_err)?))
}

#[wasm_bindgen]
pub fn translate_six_frames_str(dna: &str) -> Result<JsValue, JsValue> {
    let s = parse_dna(dna)?;
    let frames = translate_six_frames(&s).map_err(js_err)?;
    let arr: [String; 6] = [
        protein_string(&frames[0]),
        protein_string(&frames[1]),
        protein_string(&frames[2]),
        protein_string(&frames[3]),
        protein_string(&frames[4]),
        protein_string(&frames[5]),
    ];
    serde_wasm_bindgen::to_value(&arr).map_err(js_err)
}

#[derive(Serialize)]
pub struct OrfOutput {
    pub strand: u8,
    pub frame: u8,
    pub start: u32,
    pub end: u32,
    pub length_bp: u32,
    pub length_aa: u32,
}

#[wasm_bindgen]
pub fn find_orfs_js(dna: &str, min_aa: u32) -> Result<JsValue, JsValue> {
    let s = parse_dna(dna)?;
    let orfs = find_orfs(&s, min_aa as usize).map_err(js_err)?;
    let out: Vec<OrfOutput> = orfs
        .into_iter()
        .map(|(strand, start, end)| {
            let frame = (start % 3) as u8;
            let length_bp = (end - start) as u32;
            OrfOutput {
                strand: strand as u8,
                frame,
                start: start as u32,
                end: end as u32,
                length_bp,
                length_aa: length_bp / 3,
            }
        })
        .collect();
    serde_wasm_bindgen::to_value(&out).map_err(js_err)
}

#[wasm_bindgen]
pub fn gc_content(dna: &str) -> Result<f64, JsValue> {
    let s = parse_dna(dna)?;
    Ok(s.gc_content())
}

#[wasm_bindgen]
pub fn reverse_complement(dna: &str) -> Result<String, JsValue> {
    let s = parse_dna(dna)?;
    Ok(s.reverse_complement().to_string())
}

#[wasm_bindgen]
pub fn motif_search(dna: &str, motif: &str) -> Result<JsValue, JsValue> {
    let s = parse_dna(dna)?;
    let m = parse_dna(motif)?;
    let hits = s.motif_search(&m);
    serde_wasm_bindgen::to_value(&hits).map_err(js_err)
}

#[wasm_bindgen]
pub fn mutate_substitution(dna: &str, pos: u32) -> Result<String, JsValue> {
    let mut s = parse_dna(dna)?;
    mutation::mutate_substitution(&mut s, pos as usize).map_err(js_err)?;
    Ok(s.to_string())
}

#[wasm_bindgen]
pub fn mutate_deletion(dna: &str, pos: u32) -> Result<String, JsValue> {
    let mut s = parse_dna(dna)?;
    mutation::mutate_deletion(&mut s, pos as usize).map_err(js_err)?;
    Ok(s.to_string())
}

#[wasm_bindgen]
pub fn mutate_insertion(dna: &str, pos: u32) -> Result<String, JsValue> {
    let mut s = parse_dna(dna)?;
    mutation::mutate_insertion(&mut s, pos as usize).map_err(js_err)?;
    Ok(s.to_string())
}

#[wasm_bindgen]
pub fn mutate_random_kind() -> String {
    MutationKind::Substitution.as_str().to_string()
}

#[derive(Serialize)]
pub struct ValidateOutput {
    pub ok: bool,
    pub length: u32,
    pub gc_content: f64,
    pub at_content: f64,
    pub kind: String,
}

#[wasm_bindgen]
pub fn validate(dna: &str) -> Result<JsValue, JsValue> {
    let s = parse_dna(dna)?;
    let out = ValidateOutput {
        ok: true,
        length: s.len() as u32,
        gc_content: s.gc_content(),
        at_content: s.at_content(),
        kind: match s.kind {
            NucleicAcid::Dna => "dna".to_string(),
            NucleicAcid::Rna => "rna".to_string(),
        },
    };
    serde_wasm_bindgen::to_value(&out).map_err(js_err)
}

#[wasm_bindgen]
pub fn base_complement(b: &str) -> Result<String, JsValue> {
    if b.len() != 1 {
        return Err(JsValue::from_str("expected a single base character"));
    }
    let base = Base::from_char(b.chars().next().unwrap()).map_err(js_err)?;
    Ok(base.complement().to_string())
}

#[wasm_bindgen]
pub fn amino_acid_name(codon: &str) -> Result<String, JsValue> {
    use protein::AminoAcid;
    if codon.len() != 3 {
        return Err(JsValue::from_str("expected a 3-character codon"));
    }
    let mut chars = codon.chars();
    let c1 = Base::from_char(chars.next().unwrap()).map_err(js_err)?;
    let c2 = Base::from_char(chars.next().unwrap()).map_err(js_err)?;
    let c3 = Base::from_char(chars.next().unwrap()).map_err(js_err)?;
    let aa: AminoAcid = match (c1, c2, c3) {
        (Base::T, Base::T, Base::T) | (Base::T, Base::T, Base::C) => AminoAcid::Phe,
        (Base::T, Base::T, Base::A) | (Base::T, Base::T, Base::G) => AminoAcid::Leu,
        (Base::C, Base::T, Base::T)
        | (Base::C, Base::T, Base::C)
        | (Base::C, Base::T, Base::A)
        | (Base::C, Base::T, Base::G) => AminoAcid::Leu,
        (Base::A, Base::T, Base::T)
        | (Base::A, Base::T, Base::C)
        | (Base::A, Base::T, Base::A) => AminoAcid::Ile,
        (Base::A, Base::T, Base::G) => AminoAcid::Met,
        (Base::G, Base::T, Base::T)
        | (Base::G, Base::T, Base::C)
        | (Base::G, Base::T, Base::A)
        | (Base::G, Base::T, Base::G) => AminoAcid::Val,

        (Base::T, Base::C, Base::T)
        | (Base::T, Base::C, Base::C)
        | (Base::T, Base::C, Base::A)
        | (Base::T, Base::C, Base::G) => AminoAcid::Ser,
        (Base::C, Base::C, Base::T)
        | (Base::C, Base::C, Base::C)
        | (Base::C, Base::C, Base::A)
        | (Base::C, Base::C, Base::G) => AminoAcid::Pro,
        (Base::A, Base::C, Base::T)
        | (Base::A, Base::C, Base::C)
        | (Base::A, Base::C, Base::A)
        | (Base::A, Base::C, Base::G) => AminoAcid::Thr,
        (Base::G, Base::C, Base::T)
        | (Base::G, Base::C, Base::C)
        | (Base::G, Base::C, Base::A)
        | (Base::G, Base::C, Base::G) => AminoAcid::Ala,

        (Base::T, Base::A, Base::T) | (Base::T, Base::A, Base::C) => AminoAcid::Tyr,
        (Base::T, Base::A, Base::A) | (Base::T, Base::A, Base::G) => AminoAcid::Stop,
        (Base::C, Base::A, Base::T) | (Base::C, Base::A, Base::C) => AminoAcid::His,
        (Base::C, Base::A, Base::A) | (Base::C, Base::A, Base::G) => AminoAcid::Gln,
        (Base::A, Base::A, Base::T) | (Base::A, Base::A, Base::C) => AminoAcid::Asn,
        (Base::A, Base::A, Base::A) | (Base::A, Base::A, Base::G) => AminoAcid::Lys,
        (Base::G, Base::A, Base::T) | (Base::G, Base::A, Base::C) => AminoAcid::Asp,
        (Base::G, Base::A, Base::A) | (Base::G, Base::A, Base::G) => AminoAcid::Glu,

        (Base::T, Base::G, Base::T) | (Base::T, Base::G, Base::C) => AminoAcid::Cys,
        (Base::T, Base::G, Base::A) => AminoAcid::Stop,
        (Base::T, Base::G, Base::G) => AminoAcid::Trp,
        (Base::C, Base::G, Base::T)
        | (Base::C, Base::G, Base::C)
        | (Base::C, Base::G, Base::A)
        | (Base::C, Base::G, Base::G) => AminoAcid::Arg,
        (Base::A, Base::G, Base::T) | (Base::A, Base::G, Base::C) => AminoAcid::Ser,
        (Base::A, Base::G, Base::A) | (Base::A, Base::G, Base::G) => AminoAcid::Arg,
        (Base::G, Base::G, Base::T)
        | (Base::G, Base::G, Base::C)
        | (Base::G, Base::G, Base::A)
        | (Base::G, Base::G, Base::G) => AminoAcid::Gly,

        _ => AminoAcid::Stop,
    };
    Ok(aa.letter().to_string())
}
