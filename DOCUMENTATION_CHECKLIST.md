# ROM Hack Field Guide documentation checklist

Use this checklist before starting a new guide. Do not wait for every optional source: the minimum viable set is enough to build the Pokédex and Locations tabs first.

## 1. Minimum viable documentation

These sources are sufficient to begin a useful first version.

- [ ] Exact ROM hack name
- [ ] Exact version or patch number
- [ ] Release date or date the files were downloaded
- [ ] Base game and region
- [ ] Difficulty modes that alter data
- [ ] Current Pokédex/species dataset
- [ ] Forms and regional/custom Pokémon list
- [ ] Base stats, types, abilities and evolution methods
- [ ] Wild encounter tables
- [ ] Other principal acquisition methods, such as gifts, trades or eggs
- [ ] Move database and Pokémon learnsets
- [ ] Normal Pokémon/form sprites
- [ ] Links or files proving where each dataset came from

Best formats are JSON, CSV or XLSX. PDFs and maintained websites are also usable. Screenshots are helpful for interpreting layouts but should not be the only source for large datasets.

## 2. Source-control information

Record this for every source in `sources/source-inventory.md`.

- [ ] Source title
- [ ] File path or direct URL
- [ ] Maintainer, author or community
- [ ] Game version covered
- [ ] Last updated or downloaded date
- [ ] Subjects covered
- [ ] Whether it is official, maintained community data or a fallback
- [ ] Known gaps or conflicts
- [ ] Attribution or usage requirements

Prefer current official hack documentation, repositories and in-game/dex exports. Use generic Pokémon data only for facts confirmed to be unchanged.

## 2A. Default baseline profile

The starter can supply a complete mainline fallback before hack changes are imported. Record these choices so inherited data is deliberate and reproducible.

- [ ] Closest mainline mechanics version group for learnsets and move availability
- [ ] Maximum National Dex number, or confirmation that all species are wanted
- [ ] Whether non-default forms should be included
- [ ] Whether normal and shiny sprites should be downloaded locally
- [ ] Exact upstream revisions recorded in `baseline.lock.json`
- [ ] Which hack documents override Pokémon stats, types, abilities, evolutions and learnsets
- [ ] Which inherited high-risk fields still need verification

The baseline is a completeness fallback, not a hack authority. Missing documentation does not prove that a mainline value is unchanged.

## 3. Identity and project setup

- [ ] Game name and short display name
- [ ] Version shown in the guide
- [ ] Region name
- [ ] Base ROM/platform
- [ ] Repository slug
- [ ] Unique browser-save namespace
- [ ] Unique exported-save format
- [ ] Planned GitHub owner and repository
- [ ] Planned Pages URL
- [ ] Cloud-sync endpoint, if required

Never reuse another guide's storage namespace, save format or sync domain.

## 4. Pokédex tab and Pokémon info panel

- [ ] National/regional/custom dex number
- [ ] Canonical species name
- [ ] Canonical key for every form
- [ ] Friendly form label
- [ ] Primary and secondary type
- [ ] HP, Attack, Defense, Speed, Sp. Atk and Sp. Def
- [ ] BST
- [ ] Abilities and descriptions
- [ ] Hidden abilities, if applicable
- [ ] Evolves from, evolves to and exact method
- [ ] Normal sprite for every distinct form
- [ ] Shiny sprite for every distinct form, if available
- [ ] Learnset by level
- [ ] TM/HM learnset
- [ ] Move Tutor learnset
- [ ] Acquisition locations/methods
- [ ] Unobtainable status, if applicable
- [ ] Special form-change rules
- [ ] Cross-form move-retention rules
- [ ] Custom types or altered type matchups

Do not silently give a form the base species sprite. Record missing or uncertain form data explicitly.

## 5. Wild encounters and Locations tab

- [ ] Location name
- [ ] Location ordering or story order
- [ ] Encounter method: grass, cave, surfing, fishing or other
- [ ] Day encounters
- [ ] Night encounters
- [ ] Morning or other time periods, if used
- [ ] Pokémon form, not just species
- [ ] Minimum and maximum level
- [ ] Encounter rate or rarity
- [ ] Version/mode restrictions
- [ ] Repel, swarm, weather or conditional encounters
- [ ] Map image or map URL, if available
- [ ] Map coordinates/markers, if interactive maps are desired

Keep time periods and methods separate. Remove a duplicate only when form, location, period, method, levels and rarity are all identical.

## 6. Other acquisition subsections

Gather a location, method, requirements and Pokémon/form for each applicable category.

- [ ] Legendaries and mythicals
- [ ] Static encounters
- [ ] Gift Pokémon
- [ ] In-game trades
- [ ] Purchased Pokémon
- [ ] Wonder, regional or special eggs
- [ ] Safari Zone encounters
- [ ] Raid dens
- [ ] Fossils or revivals
- [ ] Mystery Gifts and codes
- [ ] Starter choices
- [ ] Roaming Pokémon
- [ ] Post-game encounters
- [ ] Event-only Pokémon
- [ ] Unobtainable Pokémon
- [ ] Pokémon obtained only by evolving another obtainable Pokémon

For evolved-only Pokémon, document the full interactive path from what must be caught through every evolution requirement.

## 7. Moves tab

- [ ] Move ID or stable key
- [ ] Move name
- [ ] Type
- [ ] Physical, Special or Status category
- [ ] Power
- [ ] Accuracy
- [ ] PP
- [ ] Description/effect
- [ ] Priority, if changed or important
- [ ] Multi-turn, recoil, recharge or self-damage behaviour
- [ ] Pokémon that learn it
- [ ] Learning method and level
- [ ] Mode-specific changes
- [ ] Custom or renamed moves

Learnability must be sourced from the hack, not assumed from the mainline games.

## 8. Items tab and held items

- [ ] Item ID or stable key
- [ ] Item name
- [ ] Category
- [ ] Sprite
- [ ] Description/effect
- [ ] Locations
- [ ] Shop and currency costs
- [ ] Purchase limits or prerequisites
- [ ] Held-item effect
- [ ] Linked TM/HM move
- [ ] Evolution-item relationships
- [ ] Key-item restrictions
- [ ] Custom items

## 9. Team Builder, Future Team and Favorites

These features are mostly derived from the Pokédex, Moves and Items datasets. Confirm that the following supporting rules are documented.

- [ ] Nature effects
- [ ] Ability effects
- [ ] Held-item effects
- [ ] Legal moves for each form
- [ ] Evolution paths and requirements
- [ ] Type-effectiveness chart
- [ ] Any custom types or matchup changes
- [ ] Rank/BST thresholds used by the guide
- [ ] Level caps or progression gates
- [ ] Form changes that affect team builds

## 10. Build generator and suggested teams

- [ ] Attributed competitive/community movesets
- [ ] Author/community name
- [ ] Direct source URL
- [ ] Game version and difficulty mode
- [ ] Nature
- [ ] Ability
- [ ] Held item
- [ ] Four moves and alternatives
- [ ] EVs or other training assumptions
- [ ] Intended role or strategy
- [ ] Known combinations and setup sequences

The guide can generate statistical builds without curated sets, but curated strategies need version-matched sources and attribution.

## 11. Battles tab and Battle Planner

- [ ] Battle order/category
- [ ] Trainer name and location
- [ ] Trainer sprite/art, if desired
- [ ] Difficulty mode
- [ ] Rematch or phase
- [ ] Opponent Pokémon and exact forms
- [ ] Levels
- [ ] Abilities
- [ ] Held items
- [ ] Natures and EVs, if documented
- [ ] Four moves
- [ ] Battle gimmicks, field effects or scripted behaviour
- [ ] Rewards
- [ ] Level caps or prerequisites

Full movesets make defensive recommendations far more accurate. Partial teams can still be included if uncertainty is clearly labelled.

## 12. Overview, badges and progress

- [ ] Badge names
- [ ] Badge order
- [ ] Badge artwork
- [ ] Badge leaders/locations, if shown
- [ ] Other major progression milestones
- [ ] Definition of Pokédex completion
- [ ] Whether forms count separately or by species
- [ ] Whether unobtainable Pokémon count toward completion

## 13. Branding and interface assets

- [ ] Logo
- [ ] Hero/background artwork
- [ ] Browser favicon
- [ ] iOS/iPadOS home-screen icon
- [ ] Primary and accent colours
- [ ] Type backgrounds, if used
- [ ] Menu sprites for enabled tabs
- [ ] Pokémon sprites
- [ ] Shiny sprites
- [ ] Item sprites
- [ ] Badge images
- [ ] Maps
- [ ] Source/permission notes for artwork

## 14. Save, sync and deployment

- [ ] Unique storage namespace
- [ ] Unique save-file identifier
- [ ] Save migration needs from earlier guide versions
- [ ] Cloudflare Worker/project, if cloud sync is required
- [ ] Sync endpoint
- [ ] GitHub repository
- [ ] GitHub Pages workflow
- [ ] Custom domain, if applicable
- [ ] App manifest details
- [ ] Live URL verification plan

Deployment and cloud configuration can wait until the local guide and data validation are satisfactory.

## 15. Pre-build handoff checklist

Before asking Codex to start, confirm:

- [ ] `GAME_BRIEF.md` contains the known identity and feature choices.
- [ ] All available source files are inside the project or clearly linked.
- [ ] `sources/source-inventory.md` lists each source and its version.
- [ ] The initial priority is stated, such as “Pokédex and Locations first.”
- [ ] Missing documentation is identified rather than hidden.
- [ ] Baseline defaults and hack-specific overrides are distinguished explicitly.
- [ ] Any old guide is supplied only as a design/behaviour reference.
- [ ] Local review is required before the first deployment.

## Suggested phased approach

### Phase 1 — core guide

- [ ] Identity and branding shell
- [ ] Pokédex and forms
- [ ] Caught tracking
- [ ] Wild encounters and acquisition paths
- [ ] Normal sprites

### Phase 2 — planning tools

- [ ] Moves and learnsets
- [ ] Items and held items
- [ ] Team Builder
- [ ] Future Team and Favorites

### Phase 3 — advanced guidance

- [ ] Battles and Battle Planner
- [ ] Curated builds and suggestions
- [ ] Maps, badges and enhanced progress
- [ ] Shiny sprites

### Phase 4 — release

- [ ] Mobile/tablet QA
- [ ] Save export/import QA
- [ ] Cloud sync
- [ ] GitHub Pages deployment
- [ ] Live-site verification
