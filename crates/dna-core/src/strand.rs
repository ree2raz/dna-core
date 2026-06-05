use crate::base::{Base, NucleicAcid};
use serde::Serialize;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Strand {
    pub bases: Vec<Base>,
    pub kind: NucleicAcid,
}

impl Strand {
    pub fn new(bases: Vec<Base>, kind: NucleicAcid) -> Result<Self, String> {
        for b in &bases {
            if !kind.allows(*b) {
                return Err(format!(
                    "base '{}' is not valid in {:?}",
                    b, kind
                ));
            }
        }
        Ok(Strand { bases, kind })
    }

    pub fn from_string(s: &str, kind: NucleicAcid) -> Result<Self, String> {
        let mut bases = Vec::with_capacity(s.len());
        for (i, c) in s.chars().enumerate() {
            if c.is_whitespace() {
                continue;
            }
            let b = Base::from_char(c).map_err(|e| {
                format!("error at position {i}: {e}")
            })?;
            if !kind.allows(b) {
                return Err(format!(
                    "error at position {i}: base '{b}' is not valid in {kind:?}"
                ));
            }
            bases.push(b);
        }
        Strand::new(bases, kind)
    }

    pub fn empty(kind: NucleicAcid) -> Self {
        Strand {
            bases: Vec::new(),
            kind,
        }
    }

    pub fn len(&self) -> usize {
        self.bases.len()
    }

    pub fn is_empty(&self) -> bool {
        self.bases.is_empty()
    }

    pub fn get(&self, index: usize) -> Option<Base> {
        self.bases.get(index).copied()
    }

    pub fn gc_content(&self) -> f64 {
        if self.bases.is_empty() {
            return 0.0;
        }
        let gc = self
            .bases
            .iter()
            .filter(|b| matches!(b, Base::G | Base::C))
            .count();
        gc as f64 / self.bases.len() as f64
    }

    pub fn at_content(&self) -> f64 {
        1.0 - self.gc_content()
    }

    pub fn complement(&self) -> Strand {
        let bases = self
            .bases
            .iter()
            .map(|b| match self.kind {
                NucleicAcid::Dna => b.complement(),
                NucleicAcid::Rna => b.rna_complement(),
            })
            .collect();
        Strand {
            bases,
            kind: self.kind,
        }
    }

    pub fn reverse(&self) -> Strand {
        let mut bases = self.bases.clone();
        bases.reverse();
        Strand {
            bases,
            kind: self.kind,
        }
    }

    pub fn reverse_complement(&self) -> Strand {
        self.complement().reverse()
    }

    pub fn motif_search(&self, motif: &Strand) -> Vec<usize> {
        let mut hits = Vec::new();
        if motif.is_empty() || motif.len() > self.len() {
            return hits;
        }
        for i in 0..=self.len() - motif.len() {
            if self.bases[i..i + motif.len()] == motif.bases[..] {
                hits.push(i);
            }
        }
        hits
    }

    pub fn hamming_distance(&self, other: &Strand) -> Result<usize, String> {
        if self.len() != other.len() {
            return Err(format!(
                "hamming_distance requires equal-length strands ({} vs {})",
                self.len(),
                other.len()
            ));
        }
        Ok(self
            .bases
            .iter()
            .zip(other.bases.iter())
            .filter(|(a, b)| a != b)
            .count())
    }

    pub fn push(&mut self, b: Base) -> Result<(), String> {
        if !self.kind.allows(b) {
            return Err(format!("base '{b}' not valid in {:?}", self.kind));
        }
        self.bases.push(b);
        Ok(())
    }

    pub fn set(&mut self, index: usize, b: Base) -> Result<(), String> {
        if !self.kind.allows(b) {
            return Err(format!("base '{b}' not valid in {:?}", self.kind));
        }
        if index >= self.bases.len() {
            return Err(format!("index {index} out of bounds (len={})", self.len()));
        }
        self.bases[index] = b;
        Ok(())
    }

    pub fn insert(&mut self, index: usize, b: Base) -> Result<(), String> {
        if !self.kind.allows(b) {
            return Err(format!("base '{b}' not valid in {:?}", self.kind));
        }
        if index > self.bases.len() {
            return Err(format!("index {index} out of bounds (len={})", self.len()));
        }
        self.bases.insert(index, b);
        Ok(())
    }

    pub fn remove(&mut self, index: usize) -> Result<Base, String> {
        if index >= self.bases.len() {
            return Err(format!("index {index} out of bounds (len={})", self.len()));
        }
        Ok(self.bases.remove(index))
    }
}

impl fmt::Display for Strand {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for b in &self.bases {
            f.write_str(&b.to_string())?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dna(s: &str) -> Strand {
        Strand::from_string(s, NucleicAcid::Dna).unwrap()
    }

    #[test]
    fn parses_with_whitespace() {
        let s = Strand::from_string("AT GC\nA", NucleicAcid::Dna).unwrap();
        assert_eq!(s.len(), 5);
    }

    #[test]
    fn rejects_invalid_base() {
        assert!(Strand::from_string("ATGU", NucleicAcid::Dna).is_err());
        assert!(Strand::from_string("ATGA", NucleicAcid::Rna).is_err());
    }

    #[test]
    fn gc_content() {
        assert!((dna("GGCC").gc_content() - 1.0).abs() < 1e-9);
        assert!((dna("ATAT").gc_content() - 0.0).abs() < 1e-9);
        assert!((dna("ATGC").gc_content() - 0.5).abs() < 1e-9);
        assert!((dna("").gc_content() - 0.0).abs() < 1e-9);
    }

    #[test]
    fn reverse_complement_round_trip() {
        let s = dna("ATGC");
        let rc = s.reverse_complement();
        assert_eq!(rc.to_string(), "GCAT");
        let rc2 = rc.reverse_complement();
        assert_eq!(rc2, s);
    }

    #[test]
    fn motif_search_basic() {
        let s = dna("ATGCATGCATGC");
        let motif = dna("ATG");
        assert_eq!(s.motif_search(&motif), vec![0, 4, 8]);
        assert_eq!(dna("ATAT").motif_search(&dna("CCC")), vec![]);
    }

    #[test]
    fn hamming_distance_basic() {
        let a = dna("ATGC");
        let b = dna("ATGG");
        assert_eq!(a.hamming_distance(&b).unwrap(), 1);
        assert!(dna("ATGC").hamming_distance(&dna("AT")).is_err());
    }

    #[test]
    fn mutation_helpers() {
        let mut s = dna("ATGC");
        s.set(0, Base::C).unwrap();
        assert_eq!(s.to_string(), "CTGC");
        assert!(s.set(0, Base::U).is_err());
        s.insert(1, Base::A).unwrap();
        assert_eq!(s.to_string(), "CATGC");
        let removed = s.remove(2).unwrap();
        assert_eq!(removed, Base::T);
        assert_eq!(s.to_string(), "CAGC");
    }
}
