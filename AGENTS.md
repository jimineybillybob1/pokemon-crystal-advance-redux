# ROM Hack Field Guide project instructions

This repository is a reusable field-guide engine with a pinned mainline baseline and a replaceable ROM-hack layer. Preserve the interface and reusable behaviour unless the user asks for a design change.

## Required workflow

1. Read `SETUP_STATUS.md`, `GAME_BRIEF.md`, `BASELINE_AND_OVERRIDES.md`, and `sources/source-inventory.md` completely.
2. Inventory every supplied source before importing. Record provenance, hack version and gaps.
3. Select the closest mainline mechanics `versionGroup` in `config/baseline-config.json`, then fetch or reuse the pinned baseline.
4. Normalize hack changes and additions into `data/overrides/*.json`. Never manually edit `data/baseline/` or generated final `data/guide-data.json`, `items-data.json`, or `abilities-data.json`.
5. Put exceptional form, move-retention, alias, acquisition, or evolution rules in `config/game-overrides.js`, with a short source note.
6. Run `npm run build:data`, `npm run validate`, and `npm run audit:assets` after data changes. Review provenance warnings rather than suppressing them blindly.
7. Serve locally and review desktop and touch/mobile layouts before deployment.
8. Do not create a remote repository, push, configure cloud sync, or deploy until the user explicitly approves it.

## Guided intake

- On `start guided setup`, ask at most two closely related questions per turn and update `SETUP_STATUS.md` after every answer.
- On `continue setup`, resume from the recorded next question and do not repeat confirmed decisions.
- Inspect attachments, URLs and `sources/inbox/` before asking the user to describe available documentation.
- Accept unknown values and mark them for later review rather than blocking the scaffold.
- Report whether the project is Scaffold ready, Core data ready, Planning ready or Advanced ready.
- Start the local build once Core data is ready and the user confirms; keep deployment deferred.

## Source precedence

Current hack documentation overrides the generic baseline. The PokeAPI-derived baseline is a completeness fallback, not evidence that the hack left a field unchanged. Omission from a hack document means “not documented here,” not necessarily “unchanged.”

## Data integrity rules

- A Pokémon form has a unique `id`; forms of one species share `dexId`.
- Evolution targets reference Pokémon IDs; move references use move IDs; encounters use canonical keys.
- Preserve day and night encounters separately and deduplicate only exact matches across form, location, period, method, levels and rarity.
- Never silently substitute a base-form sprite for a distinct form.
- Use `$delete: true` only for documented removals.
- Keep unavailable or uncertain data explicit rather than inventing values.
- Keep `baseline.lock.json` under version control so builds are reproducible.

## Porting boundaries

- `app.js`, `styles.css`, and `refinements.css` are the reusable engine.
- `config/`, `data/overrides/`, `sources/`, branding, maps and special rules are hack-specific.
- `data/baseline/` is generated fallback data; final core data files are generated merge outputs.
- Search for the previous game name, storage namespace, URLs and save format before handoff.
- Keep storage namespaces unique per guide so saves cannot collide.

Treat invalid JSON, duplicate IDs/keys, broken references, unresolved forms, stale source versions and accidental old-game residue as blocking. Missing optional artwork may remain a warning only when clearly represented.
