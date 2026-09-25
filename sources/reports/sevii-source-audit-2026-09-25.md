# Sevii source audit and guide comparison

Audit date: 2026-09-25  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19 release

## Outcome

No public or workbook source contains the missing structured Sevii encounter, trainer or item tables. A read-only audit of the user's version-matched ROM does contain recoverable records and is now the strongest available evidence. Four conservative tranches have been imported from only map-stable, method-unambiguous records: 223 Wild/Surf/Fish encounter rows and 54 standard/hidden item placements. Trainers and every unresolved method/map variant remain excluded.

The repeatable extraction output is `sources/reports/sevii-rom-extraction.json`. The reviewed map boundary is `sources/normalized/sevii-map-crosswalk-2026-09-25.json`. The import report is `sources/reports/sevii-safe-import-report.json`. The ROM itself is not stored in this repository.

## Sources checked

| Source | Result |
|---|---|
| `sources/inbox/Crystal Advance Redux.xlsx` | All 11 worksheets, including hidden `Location Data`, were searched for 18 exact Sevii area names. No matches were found. |
| Developer changelog through 2026-07-19 | Confirms Sevii map, interior, follower, surf/dive-interaction and hidden-item work, but contains no encounter tables, trainer teams or item lists. |
| Official PokéCommunity thread | Provides identity/features and points current builds/changelogs to Discord; no structured Sevii tables. |
| ROM Hack Guides | Explicitly avoids reproducing the detailed tables and contains no Sevii encounters, trainers or items. |
| Hackdex | Lists a newer build and changelog material but no structured encounter, trainer or item tables for the target build. |
| Public GitHub search | No relevant source repository or extracted Sevii dataset was found. |
| User-owned target ROM | Version-matched binary evidence was successfully extracted read-only. |

Public references checked:

- https://www.pokecommunity.com/threads/pok%C3%A9mon-crystal-advance-redux.527988/
- https://romhackguides.com/hacks/crystal-advance-redux/
- https://www.hackdex.app/hack/pokemon-crystal-advance-redux
- https://github.com/haven1433/HexManiacAdvance

## ROM provenance

| Field | Value |
|---|---|
| Local filename | `PokemonCrystalAdvanceRedux(GBA).gba` |
| SHA-256 | `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B` |
| Size | 33,554,432 bytes |
| Header title | `POKEMON FIRE` |
| Game code | `BPRE` |
| Extraction tool | Hex Maniac Advance Core 0.6.1 plus `scripts/extract-sevii-rom-data.ps1` |

## Extracted coverage

| Category | Recovered | Notes |
|---|---:|---|
| Directly Sevii-labelled maps/interiors | 77 | Preserved by bank/map key, layout ID and ROM region label. |
| Reciprocal one-link map candidates | 15 | Blank-labelled maps directly and reciprocally connected to a labelled Sevii map. Parent inference remains explicit. |
| Wild-table rows | 44 | 32 on directly labelled maps and 12 on linked candidates. Repeated rows are preserved. |
| Wild method records | 95 | 63 direct plus 32 linked-candidate records across Wild, Surf, Fish and the ROM's combined Tree/Rock slot. |
| Reachable trainer-battle commands | 132 | 91 direct plus 41 linked-candidate commands; alternate/rematch commands are retained. |
| Hidden items | 56 | 42 direct plus 14 linked candidates; all coordinates fall inside decoded map bounds. |
| Standard item-ball candidates | 78 | 77 coordinates are valid; one out-of-bounds candidate is retained as suspect, not trusted. |

The ROM item table, not the guide's canonical item IDs, is used to resolve item names. Internal ROM species IDs are resolved from the ROM name table, with explicit aliases for regional and special forms such as Alolan Diglett, Galarian Slowbro, Clodsire and Sneasler.

## Encounter findings

The extraction includes exact levels, slot probabilities, fishing rods, encounter rates and internal species IDs. Examples include:

- Sevii Waterway: Wild, Surf, Fish and a Tree/Rock slot, including a 1% Bulbasaur wild slot.
- Crystal Cavern: Wild, Surf and all three fishing rods, including Piplup slots.
- Cape Brink: Alolan Diglett and Alolan Dugtrio in the Wild table.
- Five Island: multiple separate map tables, including Galarian Slowbro/Slowking on one map and Clodsire on another.
- Six Island: a Wild table containing Sneasler and separate Surf/Fish tables.

Zero-rate placeholder records are preserved but must not be displayed as available encounters. Three Berry Forest bank/map records appear twice with identical data, and multiple areas have separate maps sharing one region label. These dimensions must not be deduplicated blindly.

## Map reconciliation findings

Rendered map topology showed that region labels are not sufficient by themselves. Some active Sevii-linked maps have blank region labels, while a deeper traversal enters reused Johto/Kanto map networks. The accepted boundary therefore includes only directly labelled maps and blank-labelled destinations with a reciprocal one-step link. Temporary rendered previews remain under ignored `work/` storage and are not committed.

The normalized crosswalk classifies all 92 retained maps:

| Map state | Count | Meaning |
|---|---:|---|
| Ready | 21 | Parent and subarea sequence are stable enough for downstream record review. |
| Needs linked-map review | 8 | Active blank-labelled map with one inferred parent. |
| Needs parent review | 2 | Active blank-labelled map is linked from more than one possible parent. |
| Needs review | 27 | Parent label exists, but the user-facing subarea or reachability is unresolved. |
| Reference only | 26 | No extracted encounter, trainer or item record currently depends on the map. |
| Exclude malformed | 8 | Invalid or unused layout/header; must not be imported. |

The ready map set is Cape Brink's main path; Three Island Cave 1F-3F; Memorial Pillar Battle Rooms 1-4; Berry Forest Areas 1-5; Four Island Interior 1F-2F; Crystal Cavern areas 1-3; Sevii Waterway Main area; and Ruins Valley Main area/Ruins Cavern. The reviewed Crystal Cavern, Sevii Waterway and Ruins Valley evidence and exclusions are recorded in their dated reports. “Map ready” applies only to the parent/subarea label. Encounter variants, battle stages and interaction methods still pass their own gates before import.

Mt. Ember is specifically held back: several labelled maps render as reused ship corridors or bedrooms, one active header is malformed, and the scripts expose many trainer commands. Runtime reachability must be established before those battles can be shown.

## Trainer findings

The ROM exposes trainer identity, class, party size, party species, level, held items and custom moves where present. The recursive script audit also finds alternate battle commands reached from the same object, including battle types used for later/alternate fights.

The extracted data includes trainers in Mt. Ember, Sevii Waterway, Three Island, Crystal Cavern, Icefall Cave, Berry Forest and Memorial Pillar. Memorial Pillar scripts include Elite Four identities and alternate trainer IDs. Import must wait until battle-type semantics and user-facing subarea labels are mapped, otherwise alternate/rematch teams could be presented as simultaneous encounters.

## Item findings

Across the direct and reciprocal-linked review boundary, the ROM audit found 56 hidden items and 77 coordinate-valid standard item-ball candidates. Examples include stones and mushrooms in Sevii Waterway, multiple healing items on Two Island, a Dubious Disc on Four Island, and items in Crystal Cavern, Five Island, Berry Forest and Ruins Valley.

This is not a complete acquisition audit: scripted gifts, shops, rewards and non-standard scripts require separate analysis. One apparent item ball at Sevii Waterway coordinates 293,284 falls outside its map bounds and is explicitly marked invalid/suspect.

## Comparison with the current guide

The workbook-driven guide did not conflict with the ROM-derived data; it simply lacked it. The generated guide now contains the first safe subset while retaining explicit gaps for every record that depends on unresolved runtime semantics.

| Guide area | Current state | ROM-derived opportunity |
|---|---|---|
| Locations | 223 all-day Wild/Surf/Fish rows across Berry Forest Areas 1-5, Cape Brink Main path, Three Island Cave 1F-3F, Crystal Cavern areas 1-3, Sevii Waterway Main area and Ruins Valley | Remaining exact slots require method, alternate-table or map reconciliation. |
| Battle Guide | No ROM-derived Sevii battle cards | Trainer identities and teams are recoverable, but alternate/rematch commands and subareas need mapping. |
| Items | 54 coordinate-verified standard/hidden placements across stable mapped areas | Scripted gifts/shops remain incomplete, and unresolved maps remain excluded. |
| Pokédex acquisition links | Imported encounters link automatically to the six new Sevii location cards | Broader destinations will follow only after stable location/subarea keys are assigned. |

## Blocking interpretation work before import

1. Runtime-check the 37 active maps whose parent/subarea status is not yet ready, especially Mt. Ember, One Island and the remaining linked candidates.
2. Determine whether each five-slot `tree` field is used by Tree, Rock Smash, or both on that specific map.
3. Confirm how Dive encounters are selected. Standard wild headers do not expose a dedicated Dive field, and the underwater map records cannot safely be relabelled without runtime/script evidence.
4. Classify repeated wild rows as seasonal, alternate or duplicate runtime tables. Preserve them until the selector logic is understood.
5. Decode trainer battle-type values and map alternate trainer IDs to initial/rematch/progression stages.
6. Audit non-standard item scripts, gifts and shops if complete item coverage is required.

## Import decision

Import only the mechanically unambiguous subset from maps marked `ready`: standard Wild tables with a non-zero encounter rate and one unique runtime signature, plus coordinate-valid standard/hidden items. Collapse only byte-identical duplicate tables. Keep Tree/Rock slots, distinct alternate tables, Dive interpretation and every trainer command out of the guide until their runtime selectors are understood.

That policy now produces six location cards, 223 encounter rows and 54 item placements. The fourth tranche adds Ruins Valley with 22 unique Wild rows and four items; its review explicitly keeps the unresolved Tree/Rock slot out. The repeatable importer is `scripts/import-sevii-safe-tranche.mjs`; its machine-readable decision report is `sources/reports/sevii-safe-import-report.json`. Build, validation, provenance and asset audits pass locally. Desktop and 390×844 touch review confirmed the Main area/Ruins Cavern hierarchy and imported TD23 provenance with no horizontal overflow or console warnings/errors. The first three tranches are deployed; the Ruins Valley extension remains undeployed pending user approval.
