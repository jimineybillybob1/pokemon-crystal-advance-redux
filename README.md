# Pokémon Crystal Advance Redux Field Guide

A local, installable and offline-capable guide for Pokémon Crystal Advance Redux, build 2026-07-19. It combines the supplied community workbook and official developer changelog through 2026-07-19 with a tightly scoped, pinned PokeAPI definition fallback.

**Live guide:** https://jimineybillybob1.github.io/pokemon-crystal-advance-redux/

**Repository:** https://github.com/jimineybillybob1/pokemon-crystal-advance-redux

The current provisional build contains 596 Pokémon forms, 766 workbook-referenced moves, 95 standard encounter locations, 167 other acquisition entries and exactly 451 workbook items. Standard encounters are presented as all-day tables; Seasonal Migration is a separate acquisition overlay. The fallback is restricted to the reconciled Pokémon forms and source-referenced move/item definitions, so unrelated mainline items, prices and learnsets are not presented as hack data.

See `SETUP_STATUS.md` for completed work and known gaps, and `sources/source-inventory.md` for source authority and coverage.

## Rebuild from the workbook

```powershell
npm run import:crystal
npm run build:data
npm run validate
npm run audit:assets
```

The importer reads cached values from `sources/inbox/Crystal Advance Redux.xlsx` without modifying the source workbook. Do not edit generated baseline or merged data by hand; make repeatable changes in the importer or `data/overrides/`.

## Preview locally

```powershell
npm run serve
```

Then open `http://127.0.0.1:8892/`.

The installed guide precaches its application shell and core datasets, then caches viewed artwork at runtime. Save & Sync exposes both local pre-replacement snapshots and restorable encrypted cloud revisions.

Use `npm run baseline:scope` only when intentionally regenerating the explicit fallback allowlists from a reviewed merged guide. Use `npm run baseline:fetch -- --refresh` only when deliberately updating the pinned upstream revisions in `baseline.lock.json`.
