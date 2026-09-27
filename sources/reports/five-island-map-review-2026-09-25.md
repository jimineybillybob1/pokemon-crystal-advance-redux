# Five Island map review

Review date: 2026-09-25  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Decision

No Five Island encounter or item record is eligible for import from the current static evidence. A later method-semantics review proved maps `3,75`, `3,112`, `5,75` and `5,78` reproduce existing workbook Dive pools, so they are now `exclude-reused-mainline` rather than unresolved Five Island candidates. See `sevii-dive-semantics-review-2026-09-27.md`.

## Evidence

- All four direct-labelled maps render as snowy or icy areas, but no stable player-facing subarea sequence is established.
- Their warps lead into maps labelled `Ice Path`, `Ruins of Alph`, `Seafoam Islands`, `Safari Zone`, `Celadon Dept.`, `Goldenrod Dept.` and `Route 45`.
- The four maps contain distinct Wild/Surf records, including Huntail/Gorebyss, Galarian Slowbro/Slowking, East Sea Shellos and Clodsire variants.
- Twelve hidden items and three coordinate-valid item balls are recoverable, but assigning them to Five Island would be speculative while the reused-map links remain unresolved.

## Superseding review

The exact aquatic table matches and `mapType = 5` establish that these four headers belong to already-documented Kanto Dive data despite their stale Five Island labels. Their encounters and items must not be imported as Five Island content. Actual playable Five Island coverage still requires a separate version-matched source or runtime entrance trace.
