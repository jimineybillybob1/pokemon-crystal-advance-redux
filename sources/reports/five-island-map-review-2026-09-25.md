# Five Island map review

Review date: 2026-09-25  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Decision

No Five Island encounter or item record is eligible for import from the current static evidence. Maps `3,75`, `3,112`, `5,75` and `5,78` remain `needs-review` in the normalized crosswalk.

## Evidence

- All four direct-labelled maps render as snowy or icy areas, but no stable player-facing subarea sequence is established.
- Their warps lead into maps labelled `Ice Path`, `Ruins of Alph`, `Seafoam Islands`, `Safari Zone`, `Celadon Dept.`, `Goldenrod Dept.` and `Route 45`.
- The four maps contain distinct Wild/Surf records, including Huntail/Gorebyss, Galarian Slowbro/Slowking, East Sea Shellos and Clodsire variants.
- Twelve hidden items and three coordinate-valid item balls are recoverable, but assigning them to Five Island would be speculative while the reused-map links remain unresolved.

## Required follow-up

Runtime-check the playable Five Island entrances, map-name popups and transitions into these four headers. Once the actual route order is known, give each map a neutral subarea label and re-evaluate its encounters and items independently.
