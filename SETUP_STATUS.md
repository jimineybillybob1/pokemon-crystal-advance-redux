# Guide setup status

- Status: Provisional guide built, validated and deployed
- Current phase: Source-gap follow-up
- Readiness: Core and Planning guide live; location subareas, trainer battles and encrypted cloud sync configured
- Last updated: 2026-07-22
- Next step: Obtain version-matched Sevii tables and final custom-form/item assets, then rebuild and redeploy through the existing workflow.

## Progress

| Area | Status | Notes |
|---|---|---|
| Identity | Complete | Pokémon Crystal Advance Redux 2026-07-19; Johto and Kanto; Pokémon FireRed v1.0 (GBA) |
| Baseline profile | Complete | scarlet-violet; Dex 1025; local sprites yes |
| Feature scope | Complete | Core and Planning required; Cloud save/sync promoted to required; remaining Advanced features later |
| Source inventory | Complete | Community workbook, official forum thread and official developer changelog screenshots inventoried |
| Core data | Imported and validated | 596 Pokémon forms across 553 numbered in-game Pokédex entries and 43 unnumbered special/Form Changer forms; numbered regional forms track catches separately, while unnumbered same-species forms such as Pikachu Surf/Fly/Partner share their numbered carousel; 95 locations, 2,642 standard encounter rows and 167 other acquisition entries imported; all 648 fishing rows retain their Old/Good/Super Rod requirement; Seasonal Migration is separate; later Sevii content remains a gap |
| Planning data | Imported and validated | 766 moves and 2,468 item records merged; workbook learnsets imported; 87 older/custom move definitions and 247 custom item records remain provisional |
| Advanced data | Partial / battles, badges, profile and cloud sync complete | Encrypted Cloudflare Worker/KV sync is configured; all 16 Johto/Kanto badges and 668 workbook trainer battles, including 229 VS Seeker rematches and nine populated major-battle records, are active; trainer/rival configuration is saved and synced; maps remain deferred |
| Local build | Complete | Baseline fetched and pinned; merge, schema validation, provenance audit, local-asset audit, sync-worker tests, desktop review and 375px mobile review pass |
| Deployment | Complete | Public repository, GitHub Pages and Cloudflare Worker/KV deployment verified through 2026-07-22 |

## Confirmed decisions

- Identity: Pokémon Crystal Advance Redux, version 2026-07-19, region Johto and Kanto, base ROM/platform Pokémon FireRed v1.0 (GBA).
- Baseline: scarlet-violet, National Dex 1025, local normal/shiny sprites enabled.
- Save namespace: `pokemon-crystal-advance-redux-field-guide`.
- Feature scope: Core and Planning required; Advanced later.
- Encounter modelling: standard encounters are all-day; Seasonal Migration is a separate seasonal acquisition method.
- Cloud sync: required; use browser-side AES-GCM encryption with a Cloudflare Worker and KV storage. Cloudflare must receive ciphertext only.

## Source coverage

| Category | Coverage | Best source | Gaps |
|---|---|---|---|
| Pokédex, forms, stats, abilities and evolutions | Strong through 2026-07-01 | `sources/inbox/Crystal Advance Redux.xlsx` | Verify changes through 2026-07-19 and distinct form assets |
| Moves and learnsets | Strong through 2026-07-01 | `sources/inbox/Crystal Advance Redux.xlsx` | Verify post-2026-07-01 changes and move effects |
| Wild encounters and other acquisition | Strong through 2026-07-01 | Workbook plus developer changelog screenshots | Seasonal pools are region-wide rather than route-specific; post-2026-07-01 Sevii tables absent |
| Items and shops | Strong through 2026-07-01 | `sources/inbox/Crystal Advance Redux.xlsx` | Verify Route 31 Potion fix and later Sevii placements |
| Trainer and boss battles | Strong through 2026-07-01 | Workbook plus official developer thread/changelog | Imported 668 location-based trainer teams, including 229 VS Seeker rematches; moves, abilities, items and natures are absent, and post-workbook teams still need review |
| Badges, maps and branding | Partial | Workbook level caps, official developer thread and SteamGridDB | Selected hero, logo and app icon imported with attribution; reusable maps remain unavailable |

## Open questions

- Obtain post-2026-07-01 Sevii encounter, item and trainer tables when sources become available.
- Confirm whether Seasonal Migration is intentionally region-wide or has an undisclosed eligible-route list.
- Replace provisional older/custom move definitions, custom item details and eight remaining custom-form placeholder sprites with version-matched sources/assets; replace the three provisional Pikachu form sprites if Crystal Advance Redux developer assets become available.
- Supply dedicated egg-source pools if the game has them; workbook egg moves are imported, but no hatch-source table was identified.
- Review the selected community branding if official developer-supplied guide assets become available.

## Activity log

- Project scaffold created; identity and baseline profile recorded.
- Feature scope set to Core and Planning required, Advanced later.
- Preserved the community workbook and three official developer changelog screenshots in `sources/inbox/`.
- Reconciled the 2026-07-01 workbook against developer changes through 2026-07-19; recorded seasonal migration and Sevii gaps.
- Pinned the PokeAPI baseline to api-data commit `0fb5313cb77f46269502e987a53a0bf751ae883d` and sprites commit `bf4c47ac82c33b330e33d98b8882d1cedb2f53e7`.
- Added a repeatable workbook importer and generated the Core/Planning override layer.
- Validated 596 Pokémon forms, 766 moves, 95 locations and 2,468 items; provenance and all 2,548 currently referenced local assets also pass audit.
- Reviewed the local guide at desktop and 375px mobile widths, corrected the all-day encounter presentation, removed empty/deferred navigation, fixed horizontal overflow and confirmed no browser console errors.
- Created `jimineybillybob1/pokemon-crystal-advance-redux`, enabled GitHub Pages through Actions, and verified the public page and guide-data asset return HTTP 200.
- Imported a SteamGridDB hero, official-labelled logo and cartridge icon on 2026-07-21; added creator/source attribution and connected them to the homepage, favicon, install manifest and social-preview metadata.
- Cloud save/sync promoted from later to required and configured on 2026-07-21. Deployed a versioned Cloudflare Worker with automatically provisioned KV storage, production-origin CORS, browser-side AES-GCM encryption, 64 KiB payload validation, revision conflicts and eight-version recovery history.
- Verified the live Worker health, write/read, stale-write rejection, history and blocked-origin contracts; removed the disposable KV test fixture afterwards. Reviewed the connected Save & Sync UI at desktop and 375px mobile widths with no browser console errors or horizontal overflow.
- Corrected battle recommendations so Team Builder Pokemon are scored only with selected damaging moves; blank and status-only move slots no longer trigger full-learnset fallbacks. Verified the zero-move and one-selected-move cases locally at desktop and 375px mobile widths.
- Added a generated RetroArch/mGBA cheat file from the PokeCoders list updated 2026-07-11, then audited all 34 visible comments on 2026-07-22. Replaced the broken Item PC group with the corroborated bag-slot address and tested item table, removed wild/shiny codes with newer failure reports, rejected obsolete/unverified suggestions, filtered unsafe item choices, kept master/lead codes separate and defaulted every entry off.
- Confirmed Pikachu, Pikachu-Partner, Pikachu-Surf and Pikachu-Fly share Dex ID 25, so their caught state and Pokédex card are species-wide. Replaced the three placeholders with provisional form-accurate Radical Red front sprites, kept unverified shiny sprites unavailable, and verified carousel/caught-state behaviour at desktop and 375px mobile widths.
- Imported the workbook's distinct in-game Pokédex number column: all numbers 1–553 are present once. Numbered forms now have independent cards and caught states (including Zigzagoon #263 / Galarian Zigzagoon #536 and Wooper #194 / Paldean Wooper #550); unnumbered same-species variants remain form carousels, and legacy species-level saves migrate only to the primary numbered entry.
- Audited all 2,642 workbook encounters and confirmed the Method column contains only Wild, Tree, Rock, Surf, Fish and Dive. Those values now form the primary Locations subsections in that order; `More Info` remains nested beneath Method so floors and areas stay accurate without becoming misleading peer sections. Verified Cherrygrove's Grass note under Dive and Sprout Tower's 1F/2F/3F notes under Wild at desktop and 375px mobile widths without horizontal overflow.
- Imported the rod requirement from `Location Data` column G for all 648 fishing encounters: 130 Old Rod, 197 Good Rod and 321 Super Rod rows. Location Fish cards state the rod and are stably ordered Old Rod, Good Rod, then Super Rod within each subarea.
- Imported every wild-encounter `More Info` value as a structured subarea, preserving 81 location/subarea combinations across 38 parent locations; Sprout Tower now displays separate 1F, 2F and 3F encounter tables. Imported 668 trainer-team rows from `Location Data` into the Battle Guide, including 229 VS Seeker rematches. Blank VS levels are labelled team-scaled, while other blank levels remain explicitly undocumented.
- Added Battle Guide quick filters for all 76 trainer locations and sorted both those filters and the trainer cards with the same route-first ordering used by the Locations tab.
- Added the 16 user-supplied Johto/Kanto badges to the Overview tracker in two region-labelled groups of eight, with persistent local/cloud progress and matching badge artwork.
- Converted the three provisional Pikachu form sprites' uniform pale-green background to hard-edged alpha with zero non-background RGB changes. Recovered pinned normal/shiny sprites for Sandy/Trash Burmy, East Sea Shellos/Gastrodon, Sunshine Cherrim and the three Paldean Tauros breeds, reducing placeholders from 16 to eight. Extended the asset audit to reject referenced Pokémon PNGs without transparency metadata.
- Preserved the female/male meaning of the Nidoran gender symbols during interface normalization, added explicit display names and aliases for Dex 29/32, and verified their separate workbook sprites, evolutions and learnsets. This prevents Team Builder and Pokédex detail controls from resolving Nidoran male to the female record.
- Audited trainer `More Info` across every workbook location. Blank cells now inherit the preceding explicit sub-location within the same parent, leading blanks remain in a Main area, and the Battle Guide collates interleaved rows into sub-location groups while preserving source fight order inside each group.
- Added a first-open Trainer setup and dedicated Trainer page for trainer/rival names, gender, nine official-feature-derived character choices and starter selection. The configured starter is marked caught, the profile is included in local/export/cloud saves, and the previous Progress navigation entry is hidden while its Pokédex, badge and party summaries live on the Trainer page. Verified the setup and profile at desktop and 375px mobile widths with no console errors or horizontal overflow.
- Converted trainer-name asterisks into explicit major-battle flags and highlighted the nine populated imported teams carrying that marker. Removed the Battle Guide's All category filter so Trainer Battle is the default. Silver now displays the configured rival name, and all five staged `SE Starter` placeholders resolve to the correct counter-starter evolution based on the configured player starter.
- Reused the former Progress tab's Adventure Guide sprite for Trainer navigation and removed the faint Trainer Card reference plus radial backdrop from the Trainer card panel.
- Unified wild encounter subsection styling guide-wide: Method groups such as Surf and Fish now use the same visual subsection treatment as nested `More Info` labels such as Ruins of Alph's Inside and Outside, while retaining the Method-first hierarchy.
- Confirmed that all 1,610 Pokémon slots across the 668 imported trainer battles lack documented abilities, held items, natures and moves. Replaced the repeated empty build fields on Battle Guide cards with the six species base stats and BST; move rows remain available only if a future source supplies them.
- Generated a complete browser, Apple touch and PWA icon set from the attributed SteamGridDB cartridge artwork, including iPad-specific 152/167/180px files and a safely padded maskable icon. Added standalone iOS metadata and wired every size into the page and install manifest.
- Prevented the installed iPad guide from rendering beneath the clock and battery strip by using the non-overlay Apple status-bar style and reserving the reported top safe area across the sticky header, search overlay and landscape sidebar; bottom navigation also respects the home-indicator inset.
