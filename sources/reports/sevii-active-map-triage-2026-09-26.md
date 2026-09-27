# Sevii active-map triage

Review date: 2026-09-26  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Outcome

After completing the Dive-semantics review, all 18 active maps that are not yet marked ready have an explicit review disposition. This is a prioritisation boundary, not permission to import: their existing `needs-*` map status remains unchanged until the evidence supports a stable parent, subarea and runtime interpretation. Nine headers previously counted as unresolved are now excluded because their tables match existing Johto/Kanto ordinary or Dive encounters.

| Disposition | Maps | Meaning |
|---|---:|---|
| Runtime reused network | 13 | The maps connect to or visually reuse unrelated Johto/Kanto layouts; runtime reachability must be proven. |
| Runtime confirmation held | 4 | Dedicated review already determined that static evidence is insufficient. |
| Runtime layout unrenderable | 1 | An active header has no renderable block layout, preventing trustworthy static review. |

## Completed static cluster reviews

- Icefall Cave maps `3,68`, `3,69`, `3,78` and `4,8` are ready. Map `6,30` was subsequently proven to contain an existing shared Johto Dive pool and is excluded from Sevii. See `icefall-cave-map-review-2026-09-26.md` and `sevii-dive-semantics-review-2026-09-27.md`.
- One Island maps `1,1`, `1,2`, `1,3` and `3,51` are ready. Tree/Rock slots, trainer commands and deeper reused or unrenderable links remain gated. See `one-island-map-review-2026-09-26.md`.

## Completed: encounter-method semantics

- Mixed Underwater Sevii network: `3,0`, `3,45`, `3,46`, `3,65`.
- Reused Dive headers: `3,75`, `3,112`, `5,75`, `5,78`, `6,30`.

The four original blockers match New Bark Town, Route 29, Route 46 and Cherrygrove City ordinary encounter tables. The other five mapType 5 headers reproduce workbook Dive pools already assigned to Johto/Kanto. All nine are now `exclude-reused-mainline`; none supplies new Sevii availability. See `sevii-dive-semantics-review-2026-09-27.md`.

## Priority 3: reused networks

- Mt. Ember: `0,12`, `0,13`, `1,6`, `1,10`, `4,15`, `4,16`, `4,19`, `4,20`, `4,21`.
- Two Island: `1,34`, `4,47`, `4,48`, `4,49`.

The Mt. Ember maps render predominantly as bedrooms or ship corridors. The Two Island maps include a narrow strip and building sequence that links to maps labelled Soul House, Battle Tower, Cerulean Cave or other Kanto content. Treat these as possible reused/dormant headers until runtime entrances prove otherwise.

## Priority 4: previously held

- Resort Gorgeous: `1,81`, `1,82`.
- Crystal Cavern exterior: `3,50`.
- Six Island placeholder interior: `15,0`.

Dedicated reports already document why these maps remain held. They should not consume more static-analysis time unless new source or runtime evidence becomes available.

## Unrenderable active layout

- One Island-linked header: `3,67`.

This map contains active encounters, trainer commands and items, but the renderer reports `no-renderable-layout`. It cannot be promoted from static evidence and requires runtime confirmation.

## Next action

Review the 13 Mt. Ember and Two Island reused-network headers for any static evidence that distinguishes reachable hack content from dormant base-game maps. Do not import a record when runtime reachability remains the only missing proof.
