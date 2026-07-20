# Pokémon Crystal Advance Redux Field Guide

A local, offline-friendly guide for Pokémon Crystal Advance Redux, build 2026-07-19. It combines a pinned PokeAPI baseline with the supplied community workbook and the official developer changelog through 2026-07-19.

**Live guide:** https://jimineybillybob1.github.io/pokemon-crystal-advance-redux/

**Repository:** https://github.com/jimineybillybob1/pokemon-crystal-advance-redux

The current provisional build contains 596 Pokémon forms, 766 moves, 95 standard encounter locations, 167 other acquisition entries and 2,468 items. Standard encounters are presented as all-day tables; Seasonal Migration is a separate acquisition overlay.

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

npm run serve
```

Then open `http://127.0.0.1:8892/`.

Use `npm run baseline:fetch -- --refresh` only when deliberately updating the pinned upstream revisions in `baseline.lock.json`.
