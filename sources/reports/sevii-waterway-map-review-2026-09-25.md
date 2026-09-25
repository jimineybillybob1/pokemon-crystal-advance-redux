# Sevii Waterway map review

Review date: 2026-09-25
Target build: Pokémon Crystal Advance Redux, 2026-07-19
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Decision

Promote map `1,0` to `ready` with the neutral subarea label `Main area`.

Import its one non-zero Wild table, Surf table and Fish table, plus every coordinate-valid standard and hidden item. Keep the combined Tree/Rock slot and the single trainer battle excluded because their runtime semantics have not been established.

## Evidence

- The map carries the direct ROM region label `Sevii Waterway`; no parent inference is required.
- Layout 117 is one coherent 42×64 outdoor forest/waterway map rather than a multi-floor interior.
- Its three warps lead to inactive/reference-only interiors and do not create a competing active subarea.
- Wild, Surf and Fish each have one non-zero runtime table, so no alternate-table selector must be inferred.
- Fishing rows retain Old Rod, Good Rod and Super Rod as separate dimensions.
- All seven hidden items and four genuine standard item balls are within the decoded map bounds.
- A fifth apparent item-ball candidate at tile `(293, 284)` is outside the 42×64 map and remains excluded as malformed evidence.

## Eligible records

| Map | Label | Encounter rows | Eligible methods | Item placements |
|---|---|---:|---|---:|
| `1,0` | Main area | 27 | Wild, Surf, Fish | 11 |

The encounter rows comprise 12 Wild slots, five Surf slots and ten Fish slots.

## Still excluded

- The five-entry `Tree/Rock ROM slot` is not relabelled as either Tree or Rock without runtime/script evidence.
- Bug Catcher Wayne remains excluded until trainer battle-type and progression-stage semantics are decoded consistently across the ROM audit.
- The out-of-bounds item-ball candidate at `(293, 284)` remains explicitly invalid.
- Scripted gifts, rewards, shops and non-standard item scripts are outside this extraction.
- No map artwork is committed; rendered previews remain local review material under ignored `work/` storage.
