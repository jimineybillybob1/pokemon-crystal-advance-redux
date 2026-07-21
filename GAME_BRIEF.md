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
- Trainer battle guide: later
- Battle Planner: later
- Badges and progress: required
- Region maps: later
- Cloud save and sync: required; encrypted Cloudflare Worker/KV service requested 2026-07-21

## Special mechanics

- Standard encounters use one all-day table rather than morning/day/night variants.
- Seasonal Migration is a separate encounter overlay. The workbook supplies Johto/Kanto seasonal species pools and rates: general seasonal pools 4.5%, April baby Pokémon 3%, and July summer migrations 1% after the developer correction. The source describes region-wide outdoor grass rather than individual routes.
- Fairy type and later-generation moves, evolutions, regional variants and forms are present.
- Trade evolutions are generally replaced by held-item-plus-level methods; Eevee uses stones.
- The game uses altered Stat EXP/EV rules, optional level caps, soft Nuzlocke and No EXP modes.
- The workbook contains standard Johto/Kanto acquisition data through 2026-07-01. Post-workbook Sevii Island content needs structured encounter, item and trainer evidence.

## Branding

- Logo: `assets/art/crystal-advance-redux-logo.png` — SteamGridDB asset 156975 by ALGAE.
- Hero/background artwork: `assets/art/crystal-advance-redux-hero.png` — SteamGridDB asset 154634 by ALGAE.
- Browser/app icon: `assets/art/crystal-advance-redux-icon.png` — SteamGridDB asset 112669 by BeardedSquirrel.
- Primary colour: `#f13f57`
- Accent colour: `#f2bb4b`
- Menu sprite preferences: Pokémon item sprites already used by the guide.
- Attribution and original asset links: `sources/art-attribution.md`.

## Deployment

- GitHub owner: jimineybillybob1
- Repository name: pokemon-crystal-advance-redux
- GitHub Pages URL: https://jimineybillybob1.github.io/pokemon-crystal-advance-redux/
- Cloud sync endpoint, if already available: https://crystal-advance-redux-field-guide-sync.james-stewart1992.workers.dev
