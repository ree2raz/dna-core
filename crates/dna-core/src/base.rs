use serde::Serialize;
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Base {
    A,
    T,
    G,
    C,
    U,
}

impl Base {
    pub fn from_char(c: char) -> Result<Self, String> {
        match c {
            'A' | 'a' => Ok(Base::A),
            'T' | 't' => Ok(Base::T),
            'G' | 'g' => Ok(Base::G),
            'C' | 'c' => Ok(Base::C),
            'U' | 'u' => Ok(Base::U),
            other => Err(format!("invalid base character: '{other}'")),
        }
    }

    pub fn to_char(self) -> char {
        match self {
            Base::A => 'A',
            Base::T => 'T',
            Base::G => 'G',
            Base::C => 'C',
            Base::U => 'U',
        }
    }

    pub fn is_purine(self) -> bool {
        matches!(self, Base::A | Base::G)
    }

    pub fn is_pyrimidine(self) -> bool {
        matches!(self, Base::T | Base::C | Base::U)
    }

    pub fn complement(self) -> Self {
        match self {
            Base::A => Base::T,
            Base::T => Base::A,
            Base::G => Base::C,
            Base::C => Base::G,
            Base::U => Base::A,
        }
    }

    pub fn rna_complement(self) -> Self {
        match self {
            Base::A => Base::U,
            Base::U => Base::A,
            Base::G => Base::C,
            Base::C => Base::G,
            Base::T => Base::A,
        }
    }

    pub fn code(self) -> u8 {
        match self {
            Base::A => 0,
            Base::T => 1,
            Base::G => 2,
            Base::C => 3,
            Base::U => 4,
        }
    }
}

impl fmt::Display for Base {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Base::A => "A",
            Base::T => "T",
            Base::G => "G",
            Base::C => "C",
            Base::U => "U",
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NucleicAcid {
    Dna,
    Rna,
}

impl NucleicAcid {
    pub fn allows(self, b: Base) -> bool {
        match self {
            NucleicAcid::Dna => !matches!(b, Base::U),
            NucleicAcid::Rna => !matches!(b, Base::T),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_all_bases_case_insensitive() {
        assert_eq!(Base::from_char('A').unwrap(), Base::A);
        assert_eq!(Base::from_char('a').unwrap(), Base::A);
        assert_eq!(Base::from_char('U').unwrap(), Base::U);
        assert!(Base::from_char('X').is_err());
        assert!(Base::from_char('N').is_err());
    }

    #[test]
    fn complement_pairs_correctly() {
        assert_eq!(Base::A.complement(), Base::T);
        assert_eq!(Base::T.complement(), Base::A);
        assert_eq!(Base::G.complement(), Base::C);
        assert_eq!(Base::C.complement(), Base::G);
        assert_eq!(Base::U.complement(), Base::A);
    }

    #[test]
    fn purine_pyrimidine() {
        assert!(Base::A.is_purine());
        assert!(Base::G.is_purine());
        assert!(!Base::A.is_pyrimidine());
        assert!(Base::C.is_pyrimidine());
        assert!(Base::T.is_pyrimidine());
        assert!(Base::U.is_pyrimidine());
    }

    #[test]
    fn nucleic_acid_filtering() {
        assert!(NucleicAcid::Dna.allows(Base::T));
        assert!(!NucleicAcid::Dna.allows(Base::U));
        assert!(NucleicAcid::Rna.allows(Base::U));
        assert!(!NucleicAcid::Rna.allows(Base::T));
    }
}
