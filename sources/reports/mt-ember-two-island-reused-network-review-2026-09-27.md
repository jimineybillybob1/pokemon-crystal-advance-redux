# Mt. Ember and Two Island reused-network review

Review date: 2026-09-28
Target game build: Pokémon Crystal Advance Redux, 2026-07-19

## Decision

Exclude nine apparent Mt. Ember headers as reused S.S. Aqua maps and four apparent Two Island headers as reused Underground Path maps.

No encounter, item or battle record is imported by this review. The active unresolved-map count falls from 18 to 5 because all thirteen labels are now proven duplicates of workbook content rather than possible Sevii maps.

## Mt. Ember: proven S.S. Aqua reuse

The nine active Mt. Ember-labelled maps all connect to hub map `1,5`, whose rendered layout is the S.S. Aqua interior. Their rendered cabins, corridor and Captain's room align with the workbook's S.S. Aqua subareas. More importantly, all 27 distinct extracted trainer objects reproduce workbook trainer names, party species and fixed levels exactly. The extractor records 55 battle-command paths because ordinary and alternate command paths reach the same trainer objects; those paths do not establish new Mt. Ember battles.

| ROM map | Actual workbook context | Static proof |
|---|---|---|
| `0,12` | S.S. Aqua Cabin 4 | Ethan, Carol and Sean match the direction-specific Cabin 4 teams exactly. |
| `0,13` | S.S. Aqua Cabin 5 | Shawn and his team match Cabin 5 exactly. |
| `1,6` | S.S. Aqua B1F | The ship corridor and all ten trainer teams match the workbook B1F records. |
| `1,10` | S.S. Aqua Captain's room | The room contains TM20; the workbook places TM20 Dive on the Captain's room table. |
| `4,15` | S.S. Aqua Cabin 2 | Corey, Edward and Stanly match the relevant trip/direction variants exactly. |
| `4,16` | S.S. Aqua Cabin 3 | Noland and his team match Cabin 3 exactly. |
| `4,19` | S.S. Aqua Cabin 6 | Colin, Georgia, Jeremy, Meg & Peg and Rodney match the relevant variants exactly. |
| `4,20` | S.S. Aqua Cabin 7 | Cassie and Clyde match the direction-specific variants exactly. |
| `4,21` | S.S. Aqua Cabin 8 | Lyle and Ken match the relevant variants exactly. |

These maps are now `exclude-reused-mainline`. Their workbook S.S. Aqua records remain the user-facing source of truth, so no duplicate battles or item placement are added.

## Two Island: proven Underground Path reuse

The targeted inbound-link trace, rendered layouts, object scripts and workbook item table now identify all four maps without runtime speculation:

- Map `1,34` is the vertical Underground Path R5-R6 corridor. Its seven hidden items match the workbook's R5-R6 entries exactly: Hyper Potion, Parlyz Heal, Antidote, Ether, Awakening, Ice Heal and Burn Heal.
- Map `4,48` is the horizontal Underground Path R7-R8 corridor. Its seven hidden items match the workbook's R7-R8 entries exactly: Potion, Parlyz Heal, Awakening, Burn Heal, Ether, Antidote and Ice Heal.
- Maps `4,47` and `4,49` are the R7-R8 gatehouses. Their NPC scripts discuss the sleeping Pokemon near Celadon and Celadon Department Store, respectively.
- The four maps' warp boundary leads only into reused Kanto-labelled maps. The wider target trace finds no independently labelled Two Island entrance.
- Maps `4,47`-`4,49` have non-zero Wild/Surf headers, but their gatehouse and corridor layouts contain no encounter grass or Surf water. Those headers cannot establish availability and are treated as unreachable placeholders.

These maps are now `exclude-reused-mainline`. The workbook already supplies the user-facing Underground Path item records, so none of the duplicate hidden items or placeholder encounters is added as Two Island content. The July changelog remains valid evidence that genuine Two Island maps were updated, but it does not override the exact Kanto reconciliation of these particular stale-labelled headers.

## Resulting boundary

The normalized crosswalk now contains:

- 31 ready maps;
- 22 excluded reused-mainline maps;
- eight malformed maps and 26 reference-only maps;
- five active unresolved maps: four previously held runtime checks and the unrenderable One Island-linked header `3,67`.

The reusable trace is `scripts/trace-map-inbound-links.ps1`; its primary output is `sources/reports/two-island-inbound-link-trace-2026-09-28.json`. The next map-evidence step is runtime confirmation of the four held maps or the unrenderable `3,67` when a suitable late-game save is available.
