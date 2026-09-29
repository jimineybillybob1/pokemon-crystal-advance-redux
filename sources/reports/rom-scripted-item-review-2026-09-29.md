# ROM scripted item, shop and reward review

Review date: 2026-09-29  
Target build: Pokémon Crystal Advance Redux, 2026-07-19  
ROM SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`

## Outcome

The hash-locked extractor audits all 865 active map headers, 360 standard item balls, 186 hidden signpost items and every item-related command reachable from an object, coordinate or signpost script. It found 176 unique scripted commands: 54 direct item grants, 66 gifted-Pokémon held-item commands and 56 Poké Mart commands. There are no `addpcitem` commands reachable from the audited map events.

Of those commands, 159 have a small map-local context. Seventeen are reached from many maps or roots and are explicitly marked `shared/global path; location unresolved`. Twenty-one use variables or otherwise unresolved values. Neither group is imported as literal availability. The machine-readable evidence, including raw ROM addresses, item IDs, mart lists and bounded context examples, is in `rom-scripted-item-audit-2026-09-29.json`.

The workbook remains the displayed source for gifts, shops and rewards. The audit validates that the ROM contains the documented acquisition systems, but map labels are reused heavily and command presence does not establish a safe user-facing location, progression requirement, currency or price. No speculative scripted availability is added.

## Route 31 correction

Map `3,51` is Route 31 data, not a One Island outdoor encounter map:

- Bug Catcher Wade is present in the map scripts.
- The visible Poké Ball at tile `(19, 17)` matches the workbook's Route 31 field item.
- Twenty-seven of the workbook's 32 ordered Wild/Tree/Surf/Fish slots match positionally; the five differences are rare/custom slots changed after the workbook date.
- The second visible item at tile `(33, 3)`, beside the eastern cave entrance/sign area, is ROM item 71, `PP Max`.
- The official July 19 changelog says the Route 31 Potion was fixed after the workbook's July 1 data cutoff.

The guide therefore removes the stale Route 31 Potion row and records a PP Max at that position. Map `3,51` is reclassified as `exclude-reused-mainline` in the Sevii crosswalk, removing 32 misattributed One Island encounter rows and two item placements. The genuine One Island cavern maps `1,1`, `1,2` and `1,3` remain available.

## Import boundary

- Standard and hidden ROM placements continue to require a ready map identity and valid coordinates.
- A scripted command must have a stable map identity and literal item values before it can become an acquisition row.
- Poké Mart lists alone do not establish the displayed vendor name, currency, price or progression gate.
- Gifted-Pokémon held items remain sourced from the workbook unless the gift species, map identity and held item all reconcile.
- Shared/global and dynamic commands remain audit evidence only.

The ROM and user save remain outside the repository and are not copied by the extractor.
