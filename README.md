# genome-canvas

A 3D DNA playground in your browser. Type a sequence, see it render as a double helix, apply mutations, and watch the resulting mRNA + protein update in real time.

**Rust → WebAssembly** does the biology (transcription, translation, mutations, motif search, 3D helix coordinates). **React + Three.js** does the visuals. Everything runs in the browser, no server.

![genome-canvas hero](docs/hero.png)

## What you can do

- **Render** any DNA sequence (up to ~500 bp comfortably) as an interactive 3D double helix
- **Mutate** with one click — substitution, deletion, or insertion at a random position
- **Auto-mutate** with a "UV burst" that applies 3 random mutations in a row
- **Transcribe** the sense strand into mRNA live
- **Translate** the mRNA into an amino-acid chain (frame +1)
- **Reverse / complement / reverse-complement** with one click
- **Search for motifs** (e.g. `GAATTC` for EcoRI cut sites) and see hit positions
- **Click any base** in the 3D view for details: position, name, complement, codon, amino acid
- **Drag to rotate**, scroll to zoom, double-click to focus

## Architecture

```
genome-canvas/
├── crates/dna-core/          # Pure-Rust DNA/RNA/protein library → WASM
│   ├── src/
│   │   ├── base.rs           # Base enum, complements
│   │   ├── strand.rs         # Strand type, GC%, motif_search
│   │   ├── rna.rs            # Transcription, reverse-transcription
│   │   ├── protein.rs        # Codon table, 3-frame & 6-frame translation
│   │   ├── mutation.rs       # Substitution / deletion / insertion
│   │   ├── helix.rs          # 3D B-form DNA coordinates
│   │   └── lib.rs            # wasm-bindgen exports
│   └── pkg/                  # ← wasm-pack output (~88 KB)
└── web/                      # Vite + React + TypeScript + Three.js + Tailwind
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── HelixScene.tsx       # React Three Fiber scene
    │   │   ├── ControlPanel.tsx     # Sequence input, mutation buttons
    │   │   ├── SequenceView.tsx     # Color-coded DNA / mRNA / protein
    │   │   ├── ProteinView.tsx      # Amino-acid chain with stats
    │   │   ├── StatsBar.tsx         # GC%, length, turns, height
    │   │   └── BaseInfoCard.tsx     # On-click base details
    │   ├── wasm/dnaCore.ts          # Typed wrapper over the WASM module
    │   └── lib/                     # Colors, presets, types
    └── public/wasm/                 # The compiled .wasm (copied from pkg/)
```

## Quick start

You'll need:
- **Rust** (1.75+) with `wasm32-unknown-unknown` target
- **wasm-pack** (`cargo install wasm-pack`)
- **Node.js** 18+ and **npm**

```bash
# 1. Add the wasm32 target (one-time)
rustup target add wasm32-unknown-unknown

# 2. Install wasm-pack (one-time)
cargo install wasm-pack

# 3. From the repo root, build the Rust → WASM crate
cd crates/dna-core
wasm-pack build --target web --release --out-dir pkg
cd ../..

# 4. Install npm deps and run the dev server
cd web
npm install
npm run dev
```

Then open <http://localhost:5173/>.

The npm scripts `predev` and `prebuild` automatically run `sync:wasm`, which copies the compiled `.wasm` from `crates/dna-core/pkg/` into `web/public/wasm/`. So if you rebuild the Rust side, just re-run `npm run dev` and the latest WASM will be picked up.

## Build for production

```bash
# From web/
npm run build      # also rebuilds + syncs the WASM
npm run preview    # serves dist/ on http://localhost:4173/
```

The output is in `web/dist/`. Drop it on any static host (Vercel, Netlify, GitHub Pages, S3+CloudFront, etc.).

### Deploying to GitHub Pages / Vercel / Netlify

- **Build command**: `cd web && npm install && npm run build`
- **Output directory**: `web/dist`

## Rust core

The Rust crate is intentionally small and dependency-free for the core logic. It compiles to ~88 KB of WASM (no wasm-opt needed).

### Test the Rust side independently

```bash
cd crates/dna-core
cargo test
```

28 unit tests cover base parsing, complement/reverse-complement, transcription, codon translation, mutation semantics, and 3D helix geometry.

### Library API (Rust)

```rust
use dna_core::base::{Base, NucleicAcid};
use dna_core::strand::Strand;
use dna_core::rna::transcribe;
use dna_core::protein::translate;
use dna_core::helix::compute_helix;

let dna = Strand::from_string("ATGTGGTAATAA", NucleicAcid::Dna).unwrap();
let mrna = transcribe(&dna).unwrap();             // "AUGUGGUAAUAA"
let protein = translate(&dna, 0).unwrap();        // [Met, Trp, Stop, Stop]
let helix  = compute_helix(&dna);                  // 3D coords for 12 base pairs
println!("GC content: {:.1}%", dna.gc_content() * 100.0);
```

### WASM exports

The crate exposes these functions to JavaScript via `wasm-bindgen`:

| Function | Returns |
| --- | --- |
| `compute_helix(dna)` | `{ positions, bases, is_sense, indices, length, turn_count }` |
| `transcribe_dna(dna)` | `string` (mRNA) |
| `translate_dna(dna, frame)` | `string` (amino-acid letters) |
| `translate_six_frames_str(dna)` | `string[6]` |
| `gc_content(dna)` | `number` (0..1) |
| `reverse_complement(dna)` | `string` |
| `motif_search(dna, motif)` | `number[]` (hit positions) |
| `mutate_substitution(dna, pos)` | `string` (new sequence) |
| `mutate_deletion(dna, pos)` | `string` (new sequence) |
| `mutate_insertion(dna, pos)` | `string` (new sequence) |
| `validate(dna)` | `{ ok, length, gc_content, at_content, kind }` |
| `base_complement(b)` | `string` |
| `amino_acid_name(codon)` | `string` (amino-acid letter) |

## Tech stack

| Layer | Choice |
| --- | --- |
| Core logic | Rust 2021 |
| WASM glue | `wasm-bindgen` 0.2, `js-sys`, `serde-wasm-bindgen` |
| Frontend | Vite 5, React 18, TypeScript 5 |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei` |
| Styling | Tailwind CSS 3 |
| Deploy | Static (Vercel / Netlify / GitHub Pages) |

## Color key

| Base | Color | Hex |
| --- | --- | --- |
| A (Adenine) | red | `#ef4444` |
| T (Thymine) | blue | `#3b82f6` |
| G (Guanine) | green | `#22c55e` |
| C (Cytosine) | yellow | `#facc15` |
| U (Uracil, in mRNA) | orange | `#fb923c` |

## Inspiration

Built as a modern, browser-native spiritual successor to [vixhal-baraiya/dna-c](https://github.com/vixhal-baraiya/dna-c) — a small C program that builds DNA from scratch. The biological primitives (bases, strands, transcription, mutations) are the same; what changes is the delivery vehicle: Rust + WASM for the math, WebGL for the visualization.

## Roadmap

- [ ] Real FASTA file upload (parse in Rust, render full gene)
- [ ] 6-frame translation view
- [ ] Replication fork animation (helix unzips, two daughters form)
- [ ] Restriction enzyme cut-site finder with visual
- [ ] Chromosome mini-map (where in chr17 is TP53?)
- [ ] Variant comparison mode (load 2 sequences, diff in 3D)
- [ ] Export current state as FASTA / PNG snapshot
- [ ] Undo / redo mutation history
- [ ] LocalStorage autosave

## License

MIT.
