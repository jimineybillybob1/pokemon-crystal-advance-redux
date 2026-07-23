# Game brief

Complete this file before asking Codex to import the guide.

## Identity

- Game name: Pokémon Crystal Advance Redux
- Version: 2026-07-19
- Region: Johto and Kanto
- Repository slug: pokemon-crystal-advance-redux
- Storage namespace: pokemon-crystal-advance-redux-field-guide
- Difficulty modes: Casual and Normal are documented in the workbook; soft Nuzlocke and No EXP options are described by the developer and need verification.
- Platform/base ROM: Pokémon FireRed v1.0 (GBA)

## Baseline profile

- Closest mainline mechanics version group (for example `ultra-sun-ultra-moon` or `scarlet-violet`): scarlet-violet
- Maximum National Dex number, or all: 1025
- Include non-default forms (`yes`/`no`): yes
- Use PokeAPI-derived defaults where the hack has no documented override (`yes`/`no`): yes
- Download normal sprites locally (`yes`/`no`): yes
- Download shiny sprites locally (`yes`/`no`): yes
- Known generations or mechanics mixed into the hack: FireRed/GBA engine with Pokémon and mechanics from later generations; Fairy type and Sylveon; regional forms and later evolutions including Dudunsparce; Generation 6-style EXP All; altered Stat EXP/EV rules; day/night/seasons; seasonal migration encounters; level caps; frequent double battles and double-battle Gym Leaders.

## Desired features

Mark each as `required`, `later`, or `disabled`.

- Pokédex and caught tracking: required
- Forms and shiny sprites: required
- Wild encounters with day/night: required; standard encounters are all-day, with seasonal migrations modelled separately
- Surfing and fishing: required
- Gifts, trades and purchases: required
- Eggs: required
- Raids: disabled
- Legendaries: required
- Items: required
- Moves and learnsets: required
- Team Builder: required
- Future Team and Favorites: required
- Trainer battle guide: required; workbook location trainers, VS Seeker rematches and intentionally hidden Gym Leader records imported through 2026-07-23
- Battle Planner: required
- Trainer profile: required; first-open setup records trainer/rival names, gender, character and starter, and is included in local/export/cloud saves
- Badges and progress: required
- Region maps: later
- Cloud save and sync: required; encrypted Cloudflare Worker/KV service requested 2026-07-21

## Special mechanics

- Standard encounters use one all-day table rather than morning/day/night variants.
- `Location Data` Method values are the primary wild-encounter subsections in this order: Wild, Tree, Rock, Surf, Fish, Dive. Every method uses the same subsection presentation as a documented sub-location. Column D `More Info` remains available as a nested label beneath its method, so floors and distinct areas are preserved without displacing the encounter method.
- Fishing encounters retain the rod named in `Location Data` column G (`More Info / Evo Method`). Within every Fish subsection they display in acquisition order: Old Rod, Good Rod, then Super Rod.
- Seasonal Migration is a separate encounter overlay. The workbook supplies Johto/Kanto seasonal species pools and rates: general seasonal pools 4.5%, April baby Pokémon 3%, and July summer migrations 1% after the developer correction. The source describes region-wide outdoor grass rather than individual routes.
- Fairy type and later-generation moves, evolutions, regional variants and forms are present.
- The workbook uses 87 legitimate older moves that no longer appear in Scarlet/Violet learnsets. Their canonical definitions are supplemented from the pinned PokéAPI revision; workbook learnsets remain authoritative, and any hack-specific effect differences still require version-matched documentation.
- The workbook's `Pokemon Data` column C is the game's own Pokédex number: 553 numbered entries, continuous from 1 through 553. Numbered regional forms are separate entries and separate catches (for example Zigzagoon #263 and Galarian Zigzagoon #536; Wooper #194 and Paldean Wooper #550). The 43 blank-numbered rows are Form Changer/special forms: 30 share a carousel and caught state with a numbered same-species anchor, while 13 Paradox forms without a numbered anchor remain separately accessible special-form cards and do not change the 553-entry completion total.
- Trade evolutions are generally replaced by held-item-plus-level methods; Eevee uses stones.
- The game uses altered Stat EXP/EV rules, optional level caps, soft Nuzlocke and No EXP modes.
- The workbook contains standard Johto/Kanto acquisition data through 2026-07-01. Post-workbook Sevii Island content needs structured encounter, item and trainer evidence.
- Encounter `More Info` values define distinct subareas/floors within a parent location and must remain separate. For trainers, `Location Data` column AD is the parent/sort location, column AE is the specific venue, and column AF is finer `More Info` such as a floor, room or Rematch. Sparse venue/detail cells inherit within their workbook block; a new populated Location or blank separator starts a new detail block. Venue and finer detail are combined when both are needed for clarity, while an exact `Rematch` label stays unchanged. A `?` Location placeholder remains undocumented rather than replacing the last known venue. Blank VS levels scale to the player's team, while other blanks remain undocumented.
- The Overview badge tracker contains eight Johto city-labelled badges followed by eight Kanto city-labelled badges. The user-supplied memory identifiers run consecutively from `82003884 018B` through `82003884 019A`; `Eceuteak` and `Celedon` are normalized to the canonical spellings Ecruteak and Celadon.
- Workbook trainer-name asterisks are treated as major-battle markers and removed from the displayed name. Silver is replaced by the player's configured rival name throughout the guide. Its five staged `SE Starter` slots resolve from the configured starter: Chikorita → Cyndaquil's line, Cyndaquil → Totodile's line, and Totodile → Chikorita's line.
- Trainer Battle cards show each Pokémon's six species base stats and BST alongside its documented workbook level. Empty ability, held-item, nature and move placeholders are hidden because the workbook supplies none of those trainer-specific fields.
- All 16 Johto/Kanto Gym Leaders are retained for their initial and rematch workbook rows. The workbook identifies their names and `(DB)` Double Battle format but deliberately withholds their Pokémon, so those cards show the leader, specialty and badge while clearly leaving the team unknown.
- Badge progress uses canonical badge names rather than city labels: Zephyr, Hive, Plain, Fog, Storm, Mineral, Glacier, Rising, Boulder, Cascade, Thunder, Rainbow, Soul, Marsh, Volcano and Earth.
- The dedicated Trainer page replaces the visible Progress tab for now. Its GBA-style Trainer Card is driven by the saved trainer name and character sprite, shows the live Pokédex count, and reveals obtained badges in two eight-slot Johto/Kanto rows. Pokédex completion is also shown as a progress bar below the card/profile area; choosing a starter marks that species caught without removing any previously caught starter.

## Branding

- Logo: `assets/art/crystal-advance-redux-logo.png` — SteamGridDB asset 156975 by ALGAE.
- Hero/background artwork: `assets/art/crystal-advance-redux-hero.png` — SteamGridDB asset 154634 by ALGAE.
- Browser/app icon: `assets/art/crystal-advance-redux-icon.png` — SteamGridDB asset 112669 by BeardedSquirrel.
- Primary colour: logo blue `#316BB4`
- Accent colour: logo yellow `#FFCA02`
- Supporting palette: Suicune cyan `#3FB7F3`, aurora aqua `#52E4D8`, forest teal `#2FC4AF`, violet `#6C61A1`, and lake navy `#03387C`, sampled from the attributed SteamGridDB hero, logo and cartridge artwork.
- Menu sprite preferences: Pokémon item sprites already used by the guide.
- Trainer profile artwork: unedited Pokémon Showdown character sprites; the former Progress tab's Adventure Guide sprite is reused for Trainer navigation. The Bulbagarden FRLG Trainer Card reference remains attributed but is no longer rendered as the profile-card background; see `sources/trainer-profile-art-attribution.md`.
- Attribution and original asset links: `sources/art-attribution.md`.

## Deployment

- GitHub owner: jimineybillybob1
- Repository name: pokemon-crystal-advance-redux
- GitHub Pages URL: https://jimineybillybob1.github.io/pokemon-crystal-advance-redux/
- Cloud sync endpoint, if already available: https://crystal-advance-redux-field-guide-sync.james-stewart1992.workers.dev
