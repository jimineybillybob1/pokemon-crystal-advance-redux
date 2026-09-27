# One Island map review

Review date: 2026-09-26  
Target build: Pokémon Crystal Advance Redux, 2026-07-19  
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Decision

Promote maps `1,1`, `1,2`, `1,3` and `3,51` to `ready` under `One Island`, using the neutral labels `Cavern area 1`, `Cavern area 2`, `Cavern area 3` and `Outdoor area`. The labels distinguish the four records without claiming undocumented floor names, Kindle Road boundaries or an Ember Cavern identity.

Do not extend the import through their external exits. The next linked maps enter the mixed Underwater network, an unrenderable active header, or deeper reused networks whose playable One Island identity is not established.

## Evidence

- Maps `1,1` and `1,3` carry the direct ROM region label `One Island` and render as distinct caverns.
- Map `1,2` renders as a self-contained chamber and links reciprocally to labelled map `1,1`.
- Map `3,51` renders as an outdoor route and has a reciprocal cave entrance to labelled map `1,1`.
- Each promoted Wild, Surf or Fish method has one non-zero runtime signature. No alternate-table selector must be inferred.
- All seventeen imported standard/hidden item coordinates lie inside their decoded map bounds.
- ROM species IDs 29 and 32 are resolved explicitly as `Nidoran♀` and `Nidoran♂`; the generic text decoder omits their gender glyphs.

## Eligible records

| Map | Label | Encounter rows | Eligible methods | Item placements |
|---|---|---:|---|---:|
| `1,1` | Cavern area 1 | 27 | Wild, Surf, Fish | 6 |
| `1,2` | Cavern area 2 | 12 | Wild | 4 |
| `1,3` | Cavern area 3 | 27 | Wild, Surf, Fish | 5 |
| `3,51` | Outdoor area | 27 | Wild, Surf, Fish | 2 |
| **Total** |  | **93** |  | **17** |

Fishing records preserve Old Rod, Good Rod and Super Rod.

## Still excluded

- The three combined Tree/Rock tables remain excluded pending interaction-method evidence.
- The four trainer commands on `3,51` remain excluded. They comprise paired type 0/type 5 paths for Bug Catcher Wade plus a trainer named `BLANK` with an implausible mixed-level party; that placeholder must not become a user-facing battle.
- Linked maps `3,46` and `3,67` remain blocked by mixed Underwater semantics and an unrenderable layout respectively.
- Deeper linked maps such as `1,135`, `3,14` and `3,47` enter reused or cross-region networks and are outside the safe one-step boundary.
- Dive is not inferred from a standard Wild or Surf table.
- Rendered previews and the temporary depth-two topology audit remain local review material under ignored `work/` storage.
