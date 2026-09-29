# Version-matched move and item definition review

Reviewed 2026-09-29 against the user-owned Pokémon Crystal Advance Redux ROM released 2026-07-19. The ROM remains outside this repository.

## Source identity

- File: `PokemonCrystalAdvanceRedux(GBA).gba`
- SHA-256: `716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B`
- Move records: `0x01500000`, 12 bytes per record
- Move names: `0x01501800`, 13 bytes per name
- Move-description pointers: `0x01504000`, indexed by compact ROM move ID minus one
- Item records: `0x01E22290`, 44 bytes per record

`scripts/extract-crystal-rom-definitions.py` refuses any other ROM hash and validates table signatures before writing. Its generated audit is `sources/reports/rom-definition-audit-2026-09-28.json`.

## Imported definitions

- 509 usable move records were decoded. Name matching imports 507 definitions into the guide; only Struggle and Frustration remain outside the guide because table presence alone does not establish documented availability.
- The import replaces 506 move descriptions and corrects 45 power values, 30 PP values, 27 accuracy values, ten priority values and two type values relative to the pinned fallback.
- Compact ROM move IDs are stored separately as `romId`. This fixes late-ROM trainer moves whose compact ID is not the same as a PokeAPI move ID.
- ROM move 444 is the hack-only move Triple Swipe. It is added as guide ID `30444` with the exact ROM definition. Its Physical category is explicitly labelled as an inference from the contact flag and physical tail-strike effect text.
- 374 item records were decoded. Name matching imports exact ROM descriptions for 235 of the 451 documented guide items, including 32 of the 248 hack-specific item records whose workbook description was previously only a placeholder.

## Boundaries

- The ROM move record exposes type, power, accuracy, PP, priority, effect ID, effect chance, target and flags, but not a self-describing Physical/Special/Status category. Existing pinned categories are retained except for the explicitly evidenced Triple Swipe inference.
- ROM table presence does not create move or item availability. Only records already documented by the workbook/guide are matched, with Triple Swipe as the one directly trainer-evidenced ROM-only move.
- Internal item prices are retained in the audit only. They are not treated as shop availability or displayed as purchase locations.
- The 139 unmatched ROM item records are not imported automatically. They include generic TM/HM/Technical Disk records, unused/key items and records not present in the workbook's 451-item scope.
- 216 workbook custom-item descriptions remain provisional. Scripted gifts, shops and rewards require a separate script-level audit.

## Verification

- The rebuilt guide contains 596 Pokémon forms, 770 moves, 451 items, 104 locations and 723 battles.
- All 23 imported ROM trainer battles resolve every Pokémon and move after the compact-ID crosswalk is applied.
- Data validation, provenance checks and the 1,649-asset audit pass.

