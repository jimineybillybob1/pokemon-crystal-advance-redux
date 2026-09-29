# Sevii active-map triage

Review date: 2026-09-26  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Outcome

After completing the Dive-semantics and reused-network reviews, all five active maps that are not yet marked ready have an explicit review disposition. This is a prioritisation boundary, not permission to import: their existing `needs-*` map status remains unchanged until the evidence supports a stable parent, subarea and runtime interpretation. Twenty-two headers previously counted as unresolved are now excluded because their encounters, trainers or items match existing Johto/Kanto workbook content.

| Disposition | Maps | Meaning |
|---|---:|---|
| Runtime confirmation held | 4 | Dedicated review already determined that static evidence is insufficient. |
| Runtime layout unrenderable | 1 | An active header has no renderable block layout, preventing trustworthy static review. |

## Completed static cluster reviews

- Icefall Cave maps `3,68`, `3,69`, `3,78` and `4,8` are ready. Map `6,30` was subsequently proven to contain an existing shared Johto Dive pool and is excluded from Sevii. See `icefall-cave-map-review-2026-09-26.md` and `sevii-dive-semantics-review-2026-09-27.md`.
- One Island maps `1,1`, `1,2` and `1,3` are ready; `1,1`/`1,3` use Rock Smash. The 2026-09-29 scripted-item audit reclassifies `3,51` as Route 31 reuse and removes its former One Island rows. See `one-island-map-review-2026-09-26.md`, `sevii-tree-rock-semantics-review-2026-09-28.md` and `rom-scripted-item-review-2026-09-29.md`.

## Completed: encounter-method semantics

- Mixed Underwater Sevii network: `3,0`, `3,45`, `3,46`, `3,65`.
- Reused Dive headers: `3,75`, `3,112`, `5,75`, `5,78`, `6,30`.

The four original blockers match New Bark Town, Route 29, Route 46 and Cherrygrove City ordinary encounter tables. The other five mapType 5 headers reproduce workbook Dive pools already assigned to Johto/Kanto. All nine are now `exclude-reused-mainline`; none supplies new Sevii availability. See `sevii-dive-semantics-review-2026-09-27.md`.

## Completed: Mt. Ember reuse

- Mt. Ember: `0,12`, `0,13`, `1,6`, `1,10`, `4,15`, `4,16`, `4,19`, `4,20`, `4,21`.

All nine maps are now `exclude-reused-mainline`. Their rendered layouts are S.S. Aqua cabins, B1F and the Captain's room; every extracted trainer party matches the workbook S.S. Aqua teams exactly, and the Captain's room TM20 matches the workbook's TM20 Dive placement. See `mt-ember-two-island-reused-network-review-2026-09-27.md`.

## Completed: Two Island reuse

- Two Island: `1,34`, `4,47`, `4,48`, `4,49`.

Map `1,34` is the Underground Path R5-R6 corridor, while `4,48` is the R7-R8 corridor and `4,47`/`4,49` are its gatehouses. All fourteen hidden items match the workbook's two Underground Path sections exactly, and the gatehouse NPC scripts explicitly discuss Celadon. All four are now `exclude-reused-mainline`; their non-zero encounter headers do not establish Two Island availability.

## Priority 4: previously held

- Resort Gorgeous: `1,81`, `1,82`.
- Crystal Cavern exterior: `3,50`.
- Six Island placeholder interior: `15,0`.

Dedicated reports already document why these maps remain held. They should not consume more static-analysis time unless new source or runtime evidence becomes available.

## Unrenderable active layout

- One Island-linked header: `3,67`.

This map contains active encounters, trainer commands and items, but the renderer reports `no-renderable-layout`. It cannot be promoted from static evidence and requires runtime confirmation.

## Next action

Runtime-check Resort Gorgeous maps `1,81`/`1,82`, Crystal Cavern exterior `3,50`, Six Island placeholder `15,0` and unrenderable One Island-linked map `3,67` when a suitable late-game save is available. The independent Tree/Rock audit is complete for every ready map; Ruins Cavern's unsupported combined slot remains excluded. Do not import a record when runtime reachability remains the only missing proof.
