# Late-game runtime save audit

## Scope

This review closes the five active map blockers left by the static 2026-07-19 ROM audit. It uses the user-supplied late-game save only as runtime evidence; neither the original save nor the ROM is stored in the repository.

- ROM: Pokémon Crystal Advance Redux, 2026-07-19 release
- ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`
- Save SHA-256: `B9CC4C3CF266734862C756B0CC456A13A5370D99A3D5E59F1D2506DDCD93EFEC`
- Emulator: mGBA 0.10.5
- Save state: two valid rotating slots (counters 25 and 24); newest slot records trainer Jimbo, 85:04 played, six party Pokémon, all 16 badges and saved map `10,1` at `(8,10)`

## Method

The original attachment remained untouched. For each target, a temporary ignored copy of the save was given a checksum-correct position, map group/number and layout ID, then loaded through the normal Continue flow against the exact version-matched ROM. The rendered runtime layout was compared with the extracted map header, warp topology, encounters, trainers, items and workbook records.

This proves that a map/layout can be loaded and identifies obvious stale or placeholder headers. It does not prove ordinary story traversal by itself, and no encounter or trainer battle was forced. Import decisions therefore require agreement between the runtime view and the existing static evidence.

## Results

| Map | Runtime result | Final disposition |
|---|---|---|
| `1,81` / layout 154 | Loads a cave-grid network, not Resort Gorgeous. Its cave flag and warps lead into Radio Tower and Union Cave-labelled maps. | `exclude-reused-mainline` — stale/reused cave metadata; no Sevii records imported. |
| `1,82` / layout 155 | Loads another populated cave-grid map, not Resort Gorgeous, linked to the reused `1,81` network. | `exclude-reused-mainline` — stale companion header; no Sevii records imported. |
| `3,50` / layout 242 | Loads the rocky, water-lined exterior expected by the direct Crystal Cavern label and static render. All four extracted item coordinates fit the layout. | `ready`, subarea `Exterior` — four item placements imported; there is no encounter or trainer table to add. |
| `15,0` / layout 221 | Loads a small building/lab interior with no grass, water or fishing terrain. | `exclude-placeholder` — its Wild, Surf and Fish headers are unreachable placeholders; no encounters imported. |
| `3,67` / layout 445 | Loads a rocky Johto route. Its species pool, trainers (including Quentin, Kelly and Kenji) and item set reconcile with Route 45. | `exclude-reused-mainline` — stale One Island graph link; no duplicate Route 45 records imported. |

## Outcome

The normalized crosswalk now has 32 ready maps, 25 explicitly reused mainline headers, one runtime-confirmed placeholder header, eight malformed layouts, 26 reference-only maps and zero active unresolved maps. The safe import remains at 496 ROM-derived encounter rows and 23 Sevii battles, while coordinate-verified item placements increase from 77 to 81 through the Crystal Cavern exterior.

