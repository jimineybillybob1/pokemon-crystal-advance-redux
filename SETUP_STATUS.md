# Guide setup status

- Status: Provisional guide built, validated and deployed
- Current phase: Source-gap follow-up
- Readiness: Core and Planning guide live; encrypted cloud sync configured
- Last updated: 2026-07-21
- Next step: Obtain version-matched Sevii tables and final custom-form/item assets, then rebuild and redeploy through the existing workflow.

## Progress

| Area | Status | Notes |
|---|---|---|
| Identity | Complete | Pokémon Crystal Advance Redux 2026-07-19; Johto and Kanto; Pokémon FireRed v1.0 (GBA) |
| Baseline profile | Complete | scarlet-violet; Dex 1025; local sprites yes |
| Feature scope | Complete | Core and Planning required; Cloud save/sync promoted to required; remaining Advanced features later |
| Source inventory | Complete | Community workbook, official forum thread and official developer changelog screenshots inventoried |
| Core data | Imported and validated | 596 Pokémon forms, including shared Dex tracking for four Pikachu forms and provisional Surf/Fly/Partner sprites; 95 locations, 2,642 standard encounter rows and 167 other acquisition entries imported; Seasonal Migration is separate; later Sevii content remains a gap |
| Planning data | Imported and validated | 766 moves and 2,468 item records merged; workbook learnsets imported; 87 older/custom move definitions and 247 custom item records remain provisional |
| Advanced data | Partial / cloud sync complete | Encrypted Cloudflare Worker/KV sync is configured; workbook trainer-team columns identified, while trainer battles, battle planner and maps remain deferred |
| Local build | Complete | Baseline fetched and pinned; merge, schema validation, provenance audit, local-asset audit, sync-worker tests, desktop review and 375px mobile review pass |
| Deployment | Complete | Public repository, GitHub Pages and Cloudflare Worker/KV deployment verified through 2026-07-21 |

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
| Trainer and boss battles | Structured workbook columns identified | Workbook plus official developer thread/changelog | Import deferred with Advanced features; post-workbook teams still need review |
| Badges, maps and branding | Partial | Workbook level caps, official developer thread and SteamGridDB | Selected hero, logo and app icon imported with attribution; reusable maps remain unavailable |

## Open questions

- Obtain post-2026-07-01 Sevii encounter, item and trainer tables when sources become available.
- Confirm whether Seasonal Migration is intentionally region-wide or has an undisclosed eligible-route list.
- Replace provisional older/custom move definitions, custom item details and 16 remaining custom-form placeholder sprites with version-matched sources/assets; replace the three provisional Pikachu form sprites if Crystal Advance Redux developer assets become available.
- Supply dedicated egg-source pools if the game has them; workbook egg moves are imported, but no hatch-source table was identified.
- Review the selected community branding if official developer-supplied guide assets become available.

## Activity log

- Project scaffold created; identity and baseline profile recorded.
- Feature scope set to Core and Planning required, Advanced later.
- Preserved the community workbook and three official developer changelog screenshots in `sources/inbox/`.
- Reconciled the 2026-07-01 workbook against developer changes through 2026-07-19; recorded seasonal migration and Sevii gaps.
- Pinned the PokeAPI baseline to api-data commit `0fb5313cb77f46269502e987a53a0bf751ae883d` and sprites commit `bf4c47ac82c33b330e33d98b8882d1cedb2f53e7`.
- Added a repeatable workbook importer and generated the Core/Planning override layer.
- Validated 596 Pokémon forms, 766 moves, 95 locations and 2,468 items; provenance and all 2,532 currently referenced local assets also pass audit.
- Reviewed the local guide at desktop and 375px mobile widths, corrected the all-day encounter presentation, removed empty/deferred navigation, fixed horizontal overflow and confirmed no browser console errors.
- Created `jimineybillybob1/pokemon-crystal-advance-redux`, enabled GitHub Pages through Actions, and verified the public page and guide-data asset return HTTP 200.
- Imported a SteamGridDB hero, official-labelled logo and cartridge icon on 2026-07-21; added creator/source attribution and connected them to the homepage, favicon, install manifest and social-preview metadata.
- Cloud save/sync promoted from later to required and configured on 2026-07-21. Deployed a versioned Cloudflare Worker with automatically provisioned KV storage, production-origin CORS, browser-side AES-GCM encryption, 64 KiB payload validation, revision conflicts and eight-version recovery history.
- Verified the live Worker health, write/read, stale-write rejection, history and blocked-origin contracts; removed the disposable KV test fixture afterwards. Reviewed the connected Save & Sync UI at desktop and 375px mobile widths with no browser console errors or horizontal overflow.
- Corrected battle recommendations so Team Builder Pokemon are scored only with selected damaging moves; blank and status-only move slots no longer trigger full-learnset fallbacks. Verified the zero-move and one-selected-move cases locally at desktop and 375px mobile widths.
- Confirmed Pikachu, Pikachu-Partner, Pikachu-Surf and Pikachu-Fly share Dex ID 25, so their caught state and Pokédex card are species-wide. Replaced the three placeholders with provisional form-accurate Radical Red front sprites, kept unverified shiny sprites unavailable, and verified carousel/caught-state behaviour at desktop and 375px mobile widths.
