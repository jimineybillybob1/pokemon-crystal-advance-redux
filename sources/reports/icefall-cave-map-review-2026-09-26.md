# Icefall Cave map review

Review date: 2026-09-26  
Target build: Pokémon Crystal Advance Redux, 2026-07-19  
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Decision

Promote maps `3,68`, `3,69`, `3,78` and `4,8` to `ready` with the neutral labels `Main area`, `Eastern area`, `Northern area` and `Cavern`. These labels distinguish the connected records without claiming undocumented floors or story order.

Map `6,30` was initially held. The later Dive-semantics review proved that its `mapType = 5` Grass/open-water records reproduce an existing shared Johto Dive pool, so it is now `exclude-reused-mainline` rather than an unresolved Icefall subarea. Its eight item placements remain excluded. See `sevii-dive-semantics-review-2026-09-27.md`.

## Evidence

- Maps `3,68` and `3,78` carry the direct ROM region label `Icefall Cave`.
- Map `3,69` connects reciprocally with the main and northern maps. Its position east of `3,68` supports a neutral directional label.
- Map `4,8` has two reciprocal doorway links to `3,68` and renders as a cavern with water and walkable ground.
- The four promoted maps form one connected graph and all render successfully.
- Each promoted Wild, Surf or Fish method has one non-zero runtime signature. No alternate-table selector must be inferred.
- The combined Tree/Rock slots on `3,68` and `3,69` remain excluded.

## Eligible records

| Map | Label | Encounter rows | Eligible methods | Item placements |
|---|---|---:|---|---:|
| `3,68` | Main area | 27 | Wild, Surf, Fish | 3 |
| `3,69` | Eastern area | 27 | Wild, Surf, Fish | 1 |
| `3,78` | Northern area | 15 | Surf, Fish | 0 |
| `4,8` | Cavern | 27 | Wild, Surf, Fish | 1 |
| **Total** |  | **96** |  | **5** |

Fishing records preserve Old Rod, Good Rod and Super Rod. All five standard/hidden item coordinates lie inside the decoded map bounds.

## Still excluded

- Every Icefall Cave trainer command remains gated. The scripts include paired type 0/type 5 paths and trainer parties using ROM move ID 475, whose hack-specific identity is unresolved.
- Both Tree/Rock tables remain excluded pending interaction-method evidence.
- Map `6,30`, its 17 encounter rows and its eight item placements are excluded because the encounter records match existing workbook Dive data rather than Icefall Cave.
- Dive is not inferred from a standard Wild or Surf table.
- Rendered previews remain local review material under ignored `work/` storage.
