# Crystal Cavern map review

Review date: 2026-09-25  
Target build: Pokémon Crystal Advance Redux, 2026-07-19  
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Decision

Promote maps `2,47`, `2,48` and `2,49` to `ready` using the neutral subarea labels `Cavern area 1`, `Cavern area 2` and `Cavern area 3`. These labels distinguish the records without claiming undocumented floor numbers or story order.

Keep map `3,50` (`Exterior`) gated. Although the ROM gives it the Crystal Cavern region label, its decoded warps leave the reviewed interior cluster and enter maps outside the accepted Sevii boundary. Its four item placements therefore remain excluded pending runtime reachability confirmation.

## Evidence

- The three promoted maps use sequential layouts 355, 356 and 357.
- Map `2,49` carries the direct ROM region label `Crystal Cavern`.
- Maps `2,47` and `2,48` are blank-labelled reciprocal one-step links whose inferred parent is only Crystal Cavern.
- The three maps form a mutually connected interior graph: `2,47` links to both `2,48` and `2,49`; both link back to `2,47`, and `2,48` and `2,49` also link to one another.
- The rendered maps share the same crystal-cavern tileset and visual language.
- No Tree/Rock table exists on these three maps, so their Wild, Surf and Fish methods do not depend on the unresolved combined interaction slot.
- Each method has one non-zero runtime table per map; no alternate-table selector must be inferred.

## Eligible records

| Map | Label | Encounter rows | Eligible methods | Item placements |
|---|---|---:|---|---:|
| `2,47` | Cavern area 1 | 27 | Wild, Surf, Fish | 4 |
| `2,48` | Cavern area 2 | 12 | Wild | 8 |
| `2,49` | Cavern area 3 | 27 | Wild, Surf, Fish | 7 |
| **Total** |  | **66** |  | **19** |

Fishing records preserve Old Rod, Good Rod and Super Rod as separate encounter dimensions. All standard and hidden item coordinates are inside their decoded map bounds.

## Still excluded

- All Crystal Cavern trainer commands remain excluded until battle-stage semantics are decoded.
- Map `3,50` and its four item placements remain excluded pending runtime reachability confirmation.
- Dive is not inferred from any standard Wild or Surf table.
- No map artwork is committed; rendered previews remain local review material under ignored `work/` storage.
