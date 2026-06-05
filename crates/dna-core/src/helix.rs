use crate::base::Base;
use crate::strand::Strand;
use serde::Serialize;

pub const RISE_PER_BP_ANGSTROM: f32 = 3.4;
pub const BP_PER_TURN: f32 = 10.5;
pub const HELIX_RADIUS_ANGSTROM: f32 = 10.0;
pub const TWIST_OFFSET: f32 = 0.6;

#[derive(Debug, Clone, Copy, Serialize)]
pub struct BaseCoord {
    pub index: usize,
    pub base: u8,
    pub is_sense: bool,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub partner_index: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct Helix {
    pub coords: Vec<BaseCoord>,
    pub length: usize,
    pub turn_count: f32,
}

pub fn compute_helix(strand: &Strand) -> Helix {
    let n = strand.len();
    let twist = std::f32::consts::TAU / BP_PER_TURN;
    let mut coords = Vec::with_capacity(n * 2);
    for i in 0..n {
        let angle = (i as f32) * twist + TWIST_OFFSET;
        let y = (i as f32) * RISE_PER_BP_ANGSTROM;
        let x_sense = HELIX_RADIUS_ANGSTROM * angle.cos();
        let z_sense = HELIX_RADIUS_ANGSTROM * angle.sin();
        coords.push(BaseCoord {
            index: i,
            base: strand.bases[i].code(),
            is_sense: true,
            x: x_sense,
            y,
            z: z_sense,
            partner_index: i,
        });
        let angle_as = angle + std::f32::consts::PI;
        let x_as = HELIX_RADIUS_ANGSTROM * angle_as.cos();
        let z_as = HELIX_RADIUS_ANGSTROM * angle_as.sin();
        let partner_base = strand.bases[i].complement().code();
        coords.push(BaseCoord {
            index: i,
            base: partner_base,
            is_sense: false,
            x: x_as,
            y,
            z: z_as,
            partner_index: i,
        });
    }
    let turn_count = if n == 0 {
        0.0
    } else {
        n as f32 / BP_PER_TURN
    };
    Helix {
        coords,
        length: n,
        turn_count,
    }
}

pub fn flatten_positions(helix: &Helix) -> Vec<f32> {
    let mut out = Vec::with_capacity(helix.coords.len() * 3);
    for c in &helix.coords {
        out.push(c.x);
        out.push(c.y);
        out.push(c.z);
    }
    out
}

pub fn flatten_bases(helix: &Helix) -> Vec<u8> {
    helix.coords.iter().map(|c| c.base).collect()
}

pub fn sense_count(helix: &Helix) -> u32 {
    helix.coords.iter().filter(|c| c.is_sense).count() as u32
}

pub fn _suppress_unused_base() {
    let _ = Base::A;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::base::NucleicAcid;

    fn dna(s: &str) -> Strand {
        Strand::from_string(s, NucleicAcid::Dna).unwrap()
    }

    #[test]
    fn empty_helix() {
        let h = compute_helix(&dna(""));
        assert_eq!(h.length, 0);
        assert_eq!(h.coords.len(), 0);
    }

    #[test]
    fn sense_and_antisense_paired() {
        let h = compute_helix(&dna("ATGC"));
        assert_eq!(h.length, 4);
        assert_eq!(h.coords.len(), 8);
        for chunk in h.coords.chunks(2) {
            assert!(chunk[0].is_sense);
            assert!(!chunk[1].is_sense);
            assert_eq!(chunk[0].index, chunk[1].index);
        }
    }

    #[test]
    fn bases_complement_in_pairs() {
        let h = compute_helix(&dna("ATGC"));
        for chunk in h.coords.chunks(2) {
            let s = Base::from_char(match chunk[0].base {
                0 => 'A',
                1 => 'T',
                2 => 'G',
                3 => 'C',
                4 => 'U',
                _ => 'N',
            })
            .unwrap();
            let a = Base::from_char(match chunk[1].base {
                0 => 'A',
                1 => 'T',
                2 => 'G',
                3 => 'C',
                4 => 'U',
                _ => 'N',
            })
            .unwrap();
            assert_eq!(a, s.complement());
        }
    }

    #[test]
    fn twist_completes_one_turn_every_10_5_bp() {
        let h = compute_helix(&dna(&"A".repeat(11)));
        let first_sense = h.coords[0];
        let last_sense = h.coords[20];
        let dy = last_sense.y - first_sense.y;
        let expected = 10.0 * RISE_PER_BP_ANGSTROM;
        assert!((dy - expected).abs() < 0.001);
    }

    #[test]
    fn flatten_helpers() {
        let h = compute_helix(&dna("ATGC"));
        let p = flatten_positions(&h);
        assert_eq!(p.len(), 24);
        let b = flatten_bases(&h);
        assert_eq!(b.len(), 8);
    }
}
