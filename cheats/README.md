# RetroArch cheats

`Pokemon Crystal Advance Redux (2026-07-19).cht` is a comment-audited RetroArch/mGBA cheat file generated from the PokeCoders article updated 2026-07-11 and its 34 visible comments reviewed 2026-07-22.

## Install

1. Copy the `.cht` file into RetroArch's cheat directory, normally under `cheats/Nintendo - Game Boy Advance/`.
2. Start the game with the **mGBA** core.
3. Open **Quick Menu → Cheats → Load Cheat File (Replace)** and select the file.
4. Enable only the cheats you need, choose **Apply Changes**, then disable temporary modifiers after use.

All entries default to disabled. Codes labelled `Master` or `Modifier lead` must be enabled separately alongside the corresponding dependent cheat. Use only one level, nature, bag-item or Poké Mart modifier at a time.

The `Bag slot 2` group uses the comment-confirmed `820257C4` address. Its result is reported to appear in the second bag slot with quantity 99, not in the Item PC.

## Safety and version notes

- Save normally and keep a backup before using memory-altering cheats. Avoid saving while walk-through-walls or encounter modifiers are active.
- The guide targets the 2026-07-19 game build, but the source page was updated 2026-07-11. Its wild modifier was tested on the 2026-04-05 build, and its community Poké Mart table was tested through 2026-06-25. Treat every code as provisional on the newer build.
- Wild Pokémon choices were removed because a newer comment reports Bad Eggs and the article itself says Pokémon modifiers are not working.
- The published shiny sequence was removed because two users report it failing on recent 2026 builds.
- The article's `82025840` Item PC choices were replaced by 306 non-story bag-item choices using the positively confirmed `820257C4` address. The later mint reply overrides ten outdated item mappings and adds eleven omitted mint IDs.
- Badge, key/story-item, unknown and debug item choices are omitted rather than merely risk-labelled.
- The source describes 416 community Poké Mart items and later says approximately 415 mapped entries, but its table contains 381 rows and 376 unique IDs (five unknown IDs are repeated). The normalized source preserves those 376 concrete IDs; the main file retains 307 after removing badges, key/story items and unknown/unused entries.
- The vague or obsolete 2025 Pokémon, starter/gift and wild-modifier suggestions were not added.
- Structural validation cannot prove that a memory code works on the exact ROM. Keep an unmodified save backup and test one code at a time.

## Rebuild

Run `npm run cheats:build`. The normalized article data and comment decisions are stored in `sources/normalized/pokemoncoders-cheats-2026-07-11.json` and `sources/normalized/pokemoncoders-comment-audit-2026-07-22.json`. The reasoning is summarized in `sources/cheat-comment-audit.md`.

Source: [Pokemon Crystal Advance Redux Cheats — PokeCoders](https://www.pokemoncoders.com/pokemon-crystal-advance-redux-cheats/)
