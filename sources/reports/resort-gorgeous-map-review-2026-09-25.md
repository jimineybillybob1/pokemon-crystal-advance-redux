# Resort Gorgeous map review

Review date: 2026-09-25  
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Decision

No Resort Gorgeous encounter or item record is eligible for import from the current static evidence. Maps `1,81` and `1,82` retain their direct ROM region label but remain `needs-review` in the normalized crosswalk.

## Evidence

- Both maps are cave-flagged and render as cave layouts rather than an identifiable resort exterior or building interior.
- Map `1,81` warps into maps labelled `Radio Tower` and `Union Cave`, as well as map `1,82`.
- Map `1,82` has four reciprocal warps to `1,81`, two self-warps across disconnected layout sections and one warp to a blank-labelled map.
- The two maps share an exact 12-slot Wild table. Map `1,82` also has a five-slot combined Tree/Rock table whose interaction method is unresolved.
- Five coordinate-valid item balls exist across the two maps, but their Resort Gorgeous placement cannot be trusted until runtime reachability is confirmed.

## Required follow-up

Runtime-check the entrances and map-name popup for both maps. Import only after the cave layouts and their external warps are confirmed to be playable Resort Gorgeous areas rather than reused or dormant headers.
