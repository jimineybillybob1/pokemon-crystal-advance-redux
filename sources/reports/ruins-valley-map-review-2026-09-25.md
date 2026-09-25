# Ruins Valley map review

Review date: 2026-09-25
Target build: Pokémon Crystal Advance Redux, 2026-07-19
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Decision

Promote ROM maps `4,113` and `4,79` as one Ruins Valley location with the user-facing subareas `Main area` and `Ruins Cavern`.

## Evidence

- Both maps carry the direct ROM region label `Ruins Valley`.
- Map `4,113` is a coherent outdoor valley layout with grass, water, a building and two reciprocal entrances into map `4,79`.
- Map `4,79` is a coherent cavern layout with matching reciprocal exits back to map `4,113`.
- The developer changelog independently states `Finished Ruins Valley mapping` and `Added Ruins Cavern interior maps` on 2026-07-06.
- The labels describe the visible map roles without inventing floors or additional place names.

## Eligible records

- `4,113` / Main area: one non-zero Wild table with 12 slots, normalizing to 10 unique rows after two exact duplicate slot pairs are collapsed.
- `4,79` / Ruins Cavern: one non-zero Wild table with 12 slots.
- `4,79` / Ruins Cavern: one coordinate-valid hidden item and three coordinate-valid standard item balls.

This adds 22 all-day Wild encounter rows and four item placements when processed by the conservative Sevii importer.

## Explicit exclusions

- The five-slot `tree` field on map `4,79` remains excluded because the ROM structure does not distinguish Tree from Rock Smash for this field.
- No trainer battle is imported; neither reviewed map contributes a trainer command, and the guide-wide Sevii trainer gate remains in place.
- Map `4,80` remains reference-only because no extracted encounter, trainer or item record depends on it.
- Scripted gifts, shops and non-standard item scripts remain outside this extraction boundary.
- No map artwork is committed; rendered previews remain local review material under ignored `work/` storage.
