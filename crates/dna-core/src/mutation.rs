use crate::base::Base;
use crate::strand::Strand;
use rand::seq::SliceRandom;
use rand::Rng;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MutationKind {
    Substitution,
    Deletion,
    Insertion,
}

impl MutationKind {
    pub fn as_str(self) -> &'static str {
        match self {
            MutationKind::Substitution => "substitution",
            MutationKind::Deletion => "deletion",
            MutationKind::Insertion => "insertion",
        }
    }
}

pub fn mutate_substitution(strand: &mut Strand, pos: usize) -> Result<Base, String> {
    if strand.is_empty() {
        return Err("cannot mutate an empty strand".to_string());
    }
    if pos >= strand.len() {
        return Err(format!(
            "position {pos} out of bounds (len={})",
            strand.len()
        ));
    }
    let current = strand.bases[pos];
    let choices: [Base; 3] = match current {
        Base::A => [Base::T, Base::G, Base::C],
        Base::T => [Base::A, Base::G, Base::C],
        Base::G => [Base::A, Base::T, Base::C],
        Base::C => [Base::A, Base::T, Base::G],
        Base::U => [Base::A, Base::G, Base::C],
    };
    let mut rng = rand::thread_rng();
    let new_base = *choices.choose(&mut rng).expect("non-empty choice array");
    strand.bases[pos] = new_base;
    Ok(new_base)
}

pub fn mutate_deletion(strand: &mut Strand, pos: usize) -> Result<Base, String> {
    if strand.is_empty() {
        return Err("cannot mutate an empty strand".to_string());
    }
    if pos >= strand.len() {
        return Err(format!(
            "position {pos} out of bounds (len={})",
            strand.len()
        ));
    }
    Ok(strand.remove(pos)?)
}

pub fn mutate_insertion(strand: &mut Strand, pos: usize) -> Result<Base, String> {
    if pos > strand.len() {
        return Err(format!(
            "position {pos} out of bounds (len={})",
            strand.len()
        ));
    }
    let mut rng = rand::thread_rng();
    let pool = [Base::A, Base::T, Base::G, Base::C];
    let new_base = *pool.choose(&mut rng).expect("non-empty pool");
    strand.insert(pos, new_base)?;
    Ok(new_base)
}

pub fn mutate_random<R: Rng + ?Sized>(
    strand: &mut Strand,
    rng: &mut R,
) -> Result<MutationKind, String> {
    if strand.is_empty() {
        return Err("cannot mutate an empty strand".to_string());
    }
    let kind = *[
        MutationKind::Substitution,
        MutationKind::Substitution,
        MutationKind::Substitution,
        MutationKind::Deletion,
        MutationKind::Insertion,
    ]
    .choose(rng)
    .expect("non-empty array");
    let pos = rng.gen_range(0..strand.len());
    match kind {
        MutationKind::Substitution => {
            mutate_substitution(strand, pos)?;
        }
        MutationKind::Deletion => {
            mutate_deletion(strand, pos)?;
        }
        MutationKind::Insertion => {
            mutate_insertion(strand, pos)?;
        }
    }
    Ok(kind)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::base::NucleicAcid;

    fn dna(s: &str) -> Strand {
        Strand::from_string(s, NucleicAcid::Dna).unwrap()
    }

    #[test]
    fn substitution_changes_base() {
        let mut s = dna("AAAA");
        let new = mutate_substitution(&mut s, 1).unwrap();
        assert_ne!(new, Base::A);
        assert_eq!(s.len(), 4);
    }

    #[test]
    fn deletion_shrinks() {
        let mut s = dna("ATGC");
        let removed = mutate_deletion(&mut s, 1).unwrap();
        assert_eq!(removed, Base::T);
        assert_eq!(s.to_string(), "AGC");
    }

    #[test]
    fn insertion_grows() {
        let mut s = dna("ATGC");
        mutate_insertion(&mut s, 1).unwrap();
        assert_eq!(s.len(), 5);
    }

    #[test]
    fn random_mutation_keeps_strand_valid() {
        let mut s = dna("ATGCATGC");
        let original_len = s.len();
        let mut rng = rand::thread_rng();
        for _ in 0..50 {
            let _ = mutate_random(&mut s, &mut rng).unwrap();
            assert!(s.len() >= 1);
        }
        assert!(s.len() <= original_len + 50);
    }

    #[test]
    fn out_of_bounds_rejected() {
        let mut s = dna("AT");
        assert!(mutate_substitution(&mut s, 5).is_err());
        assert!(mutate_deletion(&mut s, 5).is_err());
        assert!(mutate_insertion(&mut s, 5).is_err());
    }
}
