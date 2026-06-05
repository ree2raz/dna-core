use crate::base::{Base, NucleicAcid};
use crate::strand::Strand;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AminoAcid {
    Ala,
    Arg,
    Asn,
    Asp,
    Cys,
    Gln,
    Glu,
    Gly,
    His,
    Ile,
    Leu,
    Lys,
    Met,
    Phe,
    Pro,
    Ser,
    Thr,
    Trp,
    Tyr,
    Val,
    Stop,
}

impl AminoAcid {
    pub fn letter(self) -> char {
        match self {
            AminoAcid::Ala => 'A',
            AminoAcid::Arg => 'R',
            AminoAcid::Asn => 'N',
            AminoAcid::Asp => 'D',
            AminoAcid::Cys => 'C',
            AminoAcid::Gln => 'Q',
            AminoAcid::Glu => 'E',
            AminoAcid::Gly => 'G',
            AminoAcid::His => 'H',
            AminoAcid::Ile => 'I',
            AminoAcid::Leu => 'L',
            AminoAcid::Lys => 'K',
            AminoAcid::Met => 'M',
            AminoAcid::Phe => 'F',
            AminoAcid::Pro => 'P',
            AminoAcid::Ser => 'S',
            AminoAcid::Thr => 'T',
            AminoAcid::Trp => 'W',
            AminoAcid::Tyr => 'Y',
            AminoAcid::Val => 'V',
            AminoAcid::Stop => '*',
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            AminoAcid::Ala => "Alanine",
            AminoAcid::Arg => "Arginine",
            AminoAcid::Asn => "Asparagine",
            AminoAcid::Asp => "Aspartic acid",
            AminoAcid::Cys => "Cysteine",
            AminoAcid::Gln => "Glutamine",
            AminoAcid::Glu => "Glutamic acid",
            AminoAcid::Gly => "Glycine",
            AminoAcid::His => "Histidine",
            AminoAcid::Ile => "Isoleucine",
            AminoAcid::Leu => "Leucine",
            AminoAcid::Lys => "Lysine",
            AminoAcid::Met => "Methionine (Start)",
            AminoAcid::Phe => "Phenylalanine",
            AminoAcid::Pro => "Proline",
            AminoAcid::Ser => "Serine",
            AminoAcid::Thr => "Threonine",
            AminoAcid::Trp => "Tryptophan",
            AminoAcid::Tyr => "Tyrosine",
            AminoAcid::Val => "Valine",
            AminoAcid::Stop => "Stop",
        }
    }

    pub fn is_start(self) -> bool {
        matches!(self, AminoAcid::Met)
    }

    pub fn is_stop(self) -> bool {
        matches!(self, AminoAcid::Stop)
    }
}

fn codon_to_aminoacid(c1: Base, c2: Base, c3: Base) -> AminoAcid {
    use AminoAcid::*;
    use Base::*;
    match (c1, c2, c3) {
        (T, T, T) | (T, T, C) => Phe,
        (T, T, A) | (T, T, G) => Leu,
        (C, T, T) | (C, T, C) | (C, T, A) | (C, T, G) => Leu,
        (A, T, T) | (A, T, C) | (A, T, A) => Ile,
        (A, T, G) => Met,
        (G, T, T) | (G, T, C) | (G, T, A) | (G, T, G) => Val,

        (T, C, T) | (T, C, C) | (T, C, A) | (T, C, G) => Ser,
        (C, C, T) | (C, C, C) | (C, C, A) | (C, C, G) => Pro,
        (A, C, T) | (A, C, C) | (A, C, A) | (A, C, G) => Thr,
        (G, C, T) | (G, C, C) | (G, C, A) | (G, C, G) => Ala,

        (T, A, T) | (T, A, C) => Tyr,
        (T, A, A) | (T, A, G) => Stop,
        (C, A, T) | (C, A, C) => His,
        (C, A, A) | (C, A, G) => Gln,
        (A, A, T) | (A, A, C) => Asn,
        (A, A, A) | (A, A, G) => Lys,
        (G, A, T) | (G, A, C) => Asp,
        (G, A, A) | (G, A, G) => Glu,

        (T, G, T) | (T, G, C) => Cys,
        (T, G, A) => Stop,
        (T, G, G) => Trp,
        (C, G, T) | (C, G, C) | (C, G, A) | (C, G, G) => Arg,
        (A, G, T) | (A, G, C) => Ser,
        (A, G, A) | (A, G, G) => Arg,
        (G, G, T) | (G, G, C) | (G, G, A) | (G, G, G) => Gly,

        _ => Stop,
    }
}

pub fn translate(dna: &Strand, frame: usize) -> Result<Vec<AminoAcid>, String> {
    if dna.kind != NucleicAcid::Dna {
        return Err("translate() requires a DNA strand".to_string());
    }
    if frame > 2 {
        return Err(format!("frame must be 0, 1, or 2 (got {frame})"));
    }
    if dna.len() < frame + 3 {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    let mut i = frame;
    while i + 3 <= dna.len() {
        let codon = [dna.bases[i], dna.bases[i + 1], dna.bases[i + 2]];
        out.push(codon_to_aminoacid(codon[0], codon[1], codon[2]));
        i += 3;
    }
    Ok(out)
}

pub fn translate_six_frames(dna: &Strand) -> Result<[Vec<AminoAcid>; 6], String> {
    let rev = dna.reverse_complement();
    let f0 = translate(dna, 0)?;
    let f1 = translate(dna, 1)?;
    let f2 = translate(dna, 2)?;
    let r0 = translate(&rev, 0)?;
    let r1 = translate(&rev, 1)?;
    let r2 = translate(&rev, 2)?;
    Ok([f0, f1, f2, r0, r1, r2])
}

pub fn protein_string(aa: &[AminoAcid]) -> String {
    aa.iter().map(|a| a.letter()).collect()
}

pub fn dna_to_protein_string(dna: &Strand, frame: usize) -> Result<String, String> {
    Ok(protein_string(&translate(dna, frame)?))
}

pub fn find_orfs(dna: &Strand, min_aa_len: usize) -> Result<Vec<(usize, usize, usize)>, String> {
    if dna.kind != NucleicAcid::Dna {
        return Err("find_orfs() requires a DNA strand".to_string());
    }
    let mut orfs = Vec::new();
    let rev = dna.reverse_complement();
    for (strand_label, target) in [(0usize, dna), (1, &rev)] {
        for frame in 0..3usize {
            if target.len() < frame + 3 {
                continue;
            }
            let mut i = frame;
            let mut start_codon_pos: Option<usize> = None;
            while i + 3 <= target.len() {
                let codon = [target.bases[i], target.bases[i + 1], target.bases[i + 2]];
                let aa = codon_to_aminoacid(codon[0], codon[1], codon[2]);
                if aa.is_start() {
                    if start_codon_pos.is_none() {
                        start_codon_pos = Some(i);
                    }
                } else if aa.is_stop() {
                    if let Some(start) = start_codon_pos {
                        let aa_len = (i - start) / 3;
                        if aa_len >= min_aa_len {
                            orfs.push((strand_label, start, i + 3));
                        }
                        start_codon_pos = None;
                    }
                }
                i += 3;
            }
            if let Some(start) = start_codon_pos {
                let aa_len = (target.len() - start) / 3;
                if aa_len >= min_aa_len {
                    orfs.push((strand_label, start, target.len()));
                }
            }
        }
    }
    Ok(orfs)
}

pub fn _unused_warnings() {
    let _ = NucleicAcid::Dna;
    let _ = Base::A;
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dna(s: &str) -> Strand {
        Strand::from_string(s, NucleicAcid::Dna).unwrap()
    }

    #[test]
    fn codon_table_basic() {
        assert_eq!(codon_to_aminoacid(Base::A, Base::T, Base::G), AminoAcid::Met);
        assert_eq!(codon_to_aminoacid(Base::T, Base::G, Base::G), AminoAcid::Trp);
        assert_eq!(codon_to_aminoacid(Base::T, Base::A, Base::A), AminoAcid::Stop);
        assert_eq!(codon_to_aminoacid(Base::G, Base::C, Base::A), AminoAcid::Ala);
    }

    #[test]
    fn translate_simple() {
        let s = dna("ATGTGGTAATAA");
        let p = protein_string(&translate(&s, 0).unwrap());
        assert_eq!(p, "MW**");
    }

    #[test]
    fn translate_with_offset() {
        let s = dna("CATGTGGTAATAA");
        let p0 = protein_string(&translate(&s, 0).unwrap());
        let p1 = protein_string(&translate(&s, 1).unwrap());
        let p2 = protein_string(&translate(&s, 2).unwrap());
        assert_eq!(p0, "HVVI");
        assert_eq!(p1, "MW**");
        assert_eq!(p2, "CGN");
    }

    #[test]
    fn translate_rejects_rna() {
        let r = Strand::from_string("AUG", NucleicAcid::Rna).unwrap();
        assert!(translate(&r, 0).is_err());
    }
}
