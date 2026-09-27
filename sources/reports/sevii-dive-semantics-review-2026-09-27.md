# Sevii Dive-semantics review

Review date: 2026-09-27  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19  
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Outcome

The four maps previously grouped as the mixed `Underwater Sevii` network are not Sevii Dive maps. Their ordinary encounter tables match existing Johto locations already imported from the workbook:

| Map | ROM/map evidence | Existing workbook match | Decision |
|---|---|---|---|
| `3,0` | Town map type; Wild-table fields are Surf, Fish and Tree/Rock | New Bark Town species pools, including the complete Tree roster and Fish roster | Exclude from Sevii |
| `3,45` | Route map type; stale direct `Underwater Sevii` region label | All twelve Route 29 Wild slots match exactly | Exclude from Sevii |
| `3,46` | Route map type | All twelve Route 46 Wild slots match exactly | Exclude from Sevii |
| `3,65` | Town map type | Cherrygrove City Surf and Fish tables match exactly; the Beach Wild table matches after resolving West Sea Shellos | Exclude from Sevii |

Map `4,2` is the only other header carrying the direct `Underwater Sevii` region label. It is an inactive indoor layout with no encounter table. The region string therefore does not establish Dive semantics.

No new encounters or items are imported by this review. The nine relevant headers remain in the crosswalk as excluded audit evidence so stale labels cannot leak into a later Sevii import.

## How Dive is represented

The workbook's 218 documented Dive rows establish two encounter dimensions:

- the five-slot open-water pool is stored in the ROM's `surf` field and appears as Method `Dive` with no nested subarea;
- the twelve-slot seabed pool is stored in the ROM's `grass` field and appears as Method `Dive`, subarea `Grass`;
- Fish and Tree/Rock fields are not part of the documented Dive pool.

The version-matched ROM supports that interpretation. Headers with `mapType = 5` contain the same aquatic species sequences and probabilities as the workbook's Dive tables. Repeated identical species slots in the binary are combined in the workbook where appropriate.

## Reused headers previously mistaken for Sevii

Five maps previously held as possible Five Island or Icefall Cave content are actually existing Johto/Kanto Dive pools:

| Map | Exact or normalized workbook pool | Decision |
|---|---|---|
| `3,75`, `3,112` | Route 25 / Vermilion City / Viridian City Huntail-Gorebyss Dive pool | Exclude from Sevii |
| `5,75` | Pallet Town / Route 19 / Route 21 Shellos-East-Clodsire Dive pool | Exclude from Sevii |
| `5,78` | Route 20 Galarian Slowbro-Slowking Dive pool | Exclude from Sevii |
| `6,30` | Shared Johto Dive pool used by Cherrygrove City, Goldenrod City, Lake of Rage, Olivine City, Route 27 and Route 32 | Exclude from Sevii |

The snowy or reused rendered layouts and stale Five Island/Icefall region labels do not override the encounter-table match. These are not evidence that the documented Dive pools are obtainable in Sevii.

## Script and topology checks

- The repeated coordinate script on maps `3,45` and `3,46` calls friendship/random interaction logic; it is not a Dive trigger.
- Raw map headers show the four original blockers use ordinary town/route map types rather than `mapType = 5`.
- The ROM-wide map-connection table contains no standard Dive/Emerge connection records, so the exact surface-to-underwater parent mapping cannot be reconstructed from connection topology alone.
- The encounter-table matches are sufficient to prove these records are already-documented Johto/Kanto data, but not to assign every shared Dive pool to one unique surface map.

## Crosswalk effect

- `exclude-reused-mainline`: 9 maps
- active unresolved maps: 27 → 18
- remaining unresolved dispositions: 13 reused-network runtime checks, four held runtime checks and one unrenderable layout

The next useful static review target is the Mt. Ember and Two Island reused-network group. Runtime-only maps remain explicitly held.
