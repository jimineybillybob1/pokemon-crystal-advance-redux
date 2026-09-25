# Six Island map review

Review date: 2026-09-25  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Decision

Maps `3,74` and `3,113` are eligible for the conservative Sevii importer as `Eastern area` and `Western area`. Map `15,0` remains excluded.

## Evidence

- Map `3,74` carries the direct ROM label `Six Island`; map `3,113` is a blank-labelled reciprocal one-step neighbour.
- The pair has a reciprocal horizontal connection: `3,74` connects left to `3,113`, and `3,113` connects right to `3,74`. This directly supports neutral east/west labels without inventing route names.
- Both rendered outdoor layouts visibly contain grass and water, matching their shared Wild, Surf and Fish tables.
- Each outdoor table supplies 12 Wild slots, five Surf slots and ten rod-specific Fish slots. The Wild table includes a 1% Sneasler slot.
- Map `3,74` contains one coordinate-valid hidden Rare Candy at tile `(29, 21)`.
- Map `15,0` renders as a building/laboratory interior with no visible grass or water but contains non-zero Wild, Surf and Fish headers. Those records are treated as inactive placeholder data until runtime-tested.

## Import boundary

- Import all non-zero Wild, Surf and Fish records from `3,74` and `3,113`.
- Preserve both directional subareas even though their runtime tables are byte-identical, because the maps are distinct playable areas.
- Preserve Old Rod, Good Rod and Super Rod on every Fish entry.
- Import the hidden Rare Candy from `3,74`.
- Import no records from `15,0`, no trainer battles and no unresolved Tree/Rock or Dive data.
