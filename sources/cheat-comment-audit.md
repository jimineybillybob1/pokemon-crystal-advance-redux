# PokeCoders comment audit for RetroArch cheats

- Page: https://www.pokemoncoders.com/pokemon-crystal-advance-redux-cheats/#comments
- Reviewed: 2026-07-22
- Visible thread: 34 comments and replies
- Target game build: 2026-07-19
- Authority: reader reports and site-maintainer replies; community evidence, not official hack documentation

Comment evidence is used conservatively. A single unsupported code is not promoted merely because it appears in the thread. Positive confirmations, later failure reports, build dates and likely save-corruption risk all affect inclusion.

| Code or group | Decision | Evidence and reasoning |
|---|---|---|
| `820257C4 AAAA` item modifier | Replace the article's `82025840 YYYY`; add 306 non-story bag-item choices | Jonathan supplied the replacement address; Legerity and MonkeyPrince reported it working. CG's older observation indicates the result appears in bag slot 2 with quantity 99 rather than the PC. Nori's 2026-07-21 report checked the PC, so it does not contradict the bag destination. Suringware supplied 343 tested IDs; Beedril's later mint list corrects ten repurposed IDs and adds eleven IDs omitted by the older table. Forty key items, five story items and three unknown/glitch entries are excluded from the main file. |
| `8202404C AAAA` wild modifier | Remove all 463 choices from the main file | It was reported working on the 2026-04-02 build, but a later user received Bad Eggs and the article's closing note says Pokémon modifiers are not working. This is too risky for the main file. |
| Published shiny encounter sequence | Remove from the main file | Two users reported failure on recent/newest 2026 builds, including a retry after the maintainer pointed to the published code. |
| June 25 Poké Mart table, `82003884 XXXX` | Retain 307 non-risk choices | The contributor described the table as tested and the site promoted it into the article. Badges, key/story items and unknown/unused entries are excluded in line with the contributor's warning. |
| `83007CDE 0001` | Do not add | The comment calls it only a “Pokemon cheat” and provides no outcome, build or instructions. |
| `1003DAE6 0007` + `83007D4A 0XXX` + level/IV writes | Do not add | The March 2025 starter/gift modifier remains explicitly unverified in the replies and is stale for the 2026-07-19 target. |
| `83007CDF 0XXX` / `83007CDF 0YYY` March 2025 wild modifiers | Do not add | One reply says it did not work; a later positive report applies only to the March 2025 build. |
| Mint IDs | Use as corroboration | Beedril's 21 mint IDs match the IDs in Suringware's larger tested item table. |
| Ability Pill advice | Do not add as a cheat | The reply describes an ordinary in-game purchase at the Battle Tower frontier, not an emulator code. |

All retained entries remain disabled by default. This audit improves evidence quality but does not replace testing against the exact 2026-07-19 ROM in mGBA/RetroArch.
