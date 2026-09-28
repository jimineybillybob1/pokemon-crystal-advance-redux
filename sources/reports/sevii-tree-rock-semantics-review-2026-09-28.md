# Sevii Tree/Rock interaction review

Review date: 2026-09-28  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Outcome

The ROM stores Tree and Rock Smash encounters in one five-slot field, so the extraction cannot label the interaction by address alone. Map layouts, object scripts and the workbook's established method/species patterns resolve six ready-map tables without guesswork. Those 30 encounters are imported with their exact Tree or Rock method. The remaining Ruins Cavern table is not imported because the reviewed map exposes neither interaction.

| Map | Guide destination | Decision | Evidence |
|---|---|---|---|
| `1,0` | Sevii Waterway — Main area | Tree | Tree-rich outdoor layout; Hoothoot/Pineco-led pool follows the workbook's Headbutt pattern. |
| `3,51` | One Island — Outdoor area | Tree | Tree-rich outdoor layout; Hoothoot/Pineco/Spinarak/Exeggcute/Budew match documented Tree species. |
| `3,68` | Icefall Cave — Main area | Tree | Outdoor tree layout; Hoothoot/Pineco/Ekans/Exeggcute/Burmy-T match documented Tree species. |
| `3,69` | Icefall Cave — Eastern area | Tree | Outdoor tree layout and the same Tree-species pool as the connected main area. |
| `1,1` | One Island — Cavern area 1 | Rock | Four graphics-ID 96 objects call script `0x1BE00C`; that script checks move 249, Rock Smash. |
| `1,3` | One Island — Cavern area 3 | Rock | Six graphics-ID 96 objects call the same Rock Smash script. |
| `4,79` | Ruins Valley — Ruins Cavern | Excluded | No trees, no graphics-ID 96 objects and no call to the Rock Smash script. The non-zero pool cannot establish reachable availability. |

## Imported effect

- Four Tree tables add 20 all-day rows.
- Two Rock tables add 10 all-day rows.
- ROM-derived Sevii encounter coverage increases from 466 to 496 rows.
- Standard guide encounters increase from 3,108 to 3,138 rows.
- The exact method is preserved in encounter identity, sorting, filtering and Pokémon cross-links.

The repeatable decision is encoded in `scripts/import-sevii-safe-tranche.mjs`. Machine-readable object evidence is preserved in `sources/reports/sevii-tree-rock-object-trace-2026-09-28.json`, and the generated import decisions are in `sources/reports/sevii-safe-import-report.json`.

## Remaining boundary

This review does not authorize alternate runtime tables, trainers on unresolved maps, or the five active map blockers. Ruins Cavern's combined slot remains explicitly excluded until a reachable interaction is demonstrated by a future game build or runtime evidence.

Build, validation, provenance and 1,649-asset audits pass. Desktop 1440×900 and touch 390×844 review confirms the Tree and Rock subsections, One Island cavern labels, no browser errors and no horizontal overflow.
