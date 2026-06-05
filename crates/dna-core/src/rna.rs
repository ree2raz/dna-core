use crate::base::{Base, NucleicAcid};
use crate::strand::Strand;

pub fn transcribe(dna: &Strand) -> Result<Strand, String> {
    if dna.kind != NucleicAcid::Dna {
        return Err("transcribe() requires a DNA strand".to_string());
    }
    let bases: Vec<Base> = dna
        .bases
        .iter()
        .map(|b| match b {
            Base::T => Base::U,
            other => *other,
        })
        .collect();
    Strand::new(bases, NucleicAcid::Rna)
}

pub fn reverse_transcribe(mrna: &Strand) -> Result<Strand, String> {
    if mrna.kind != NucleicAcid::Rna {
        return Err("reverse_transcribe() requires an RNA strand".to_string());
    }
    let mut bases: Vec<Base> = mrna
        .bases
        .iter()
        .map(|b| b.rna_complement())
        .collect();
    bases.reverse();
    let bases: Vec<Base> = bases
        .into_iter()
        .map(|b| match b {
            Base::U => Base::T,
            other => other,
        })
        .collect();
    Strand::new(bases, NucleicAcid::Dna)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn transcribes_dna_to_mrna() {
        let dna = Strand::from_string("ATGC", NucleicAcid::Dna).unwrap();
        let mrna = transcribe(&dna).unwrap();
        assert_eq!(mrna.to_string(), "AUGC");
        assert_eq!(mrna.kind, NucleicAcid::Rna);
    }

    #[test]
    fn reverse_transcribe_makes_cdna() {
        let mrna = Strand::from_string("AUGCAUG", NucleicAcid::Rna).unwrap();
        let cdna = reverse_transcribe(&mrna).unwrap();
        assert_eq!(cdna.to_string(), "CATGCAT");
    }

    #[test]
    fn transcribe_rejects_rna() {
        let rna = Strand::from_string("AUGC", NucleicAcid::Rna).unwrap();
        assert!(transcribe(&rna).is_err());
    }
}
