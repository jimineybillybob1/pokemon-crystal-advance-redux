# Pokémon form sprite attribution

The following provisional form sprites were imported on 2026-07-21 from commit [`488a0918194d567b5f7b02c396118d51fb9c81ce`](https://github.com/JwowSquared/Radical-Red-Pokedex/tree/488a0918194d567b5f7b02c396118d51fb9c81ce) of the public Radical Red Pokédex data repository. Crystal Advance Redux uses matching Pikachu form names, and no form artwork is embedded in the supplied community workbook.

| Crystal Advance Redux form | Upstream Radical Red record | Source file | Local file | Dimensions | SHA-256 |
|---|---|---|---|---|---|
| Pikachu-Surf | `Pikachu-Surfing` / species 1085 | [gFrontSprite1085PikachuSurfing.png](https://github.com/JwowSquared/Radical-Red-Pokedex/blob/488a0918194d567b5f7b02c396118d51fb9c81ce/graphics/frontspr/gFrontSprite1085PikachuSurfing.png) | `assets/pokemon/pikachu-surf.png` | 64×64 RGBA PNG | `8C0135EF450A3BE17B51E9C698390F887FD0D432235FE5765A7C4D81E2B434F3` |
| Pikachu-Fly | `Pikachu-Flying` / species 1086 | [gFrontSprite1086PikachuFlying.png](https://github.com/JwowSquared/Radical-Red-Pokedex/blob/488a0918194d567b5f7b02c396118d51fb9c81ce/graphics/frontspr/gFrontSprite1086PikachuFlying.png) | `assets/pokemon/pikachu-fly.png` | 64×64 RGBA PNG | `5023EB5EB7F28428371A066CCC41729E68C326D8EDABB11D40DEB93DA8955BC3` |
| Pikachu-Partner | `Pikachu-Partner` / species 1099 (`PikachuCapPartner` asset) | [gFrontSprite1099PikachuCapPartner.png](https://github.com/JwowSquared/Radical-Red-Pokedex/blob/488a0918194d567b5f7b02c396118d51fb9c81ce/graphics/frontspr/gFrontSprite1099PikachuCapPartner.png) | `assets/pokemon/pikachu-partner.png` | 64×64 RGBA PNG | `F91E5840D7FF94CDFBB75EBE6096D152E13E6C76856741C8DDAE9064E49C624E` |

These are matching-source candidates rather than Crystal Advance Redux developer-supplied assets. The upstream repository does not publish a licence, and Pokémon rights remain with the relevant rightsholders. Replace these files if version-matched developer assets become available or removal is requested.

No trustworthy shiny sprites were located. The three forms therefore expose their normal sprites while keeping shiny artwork explicitly unavailable.

On 2026-07-21, the upstream indexed files' uniform `#98d0a0` backdrop was converted to fully transparent alpha. Validation confirmed zero RGB changes to every non-background pixel and no partially transparent pixels.

## Pinned mainline alternate forms

The following workbook forms were matched to the project's pinned PokeAPI sprite revision `bf4c47ac82c33b330e33d98b8882d1cedb2f53e7`. Both normal and shiny sprites are available. The three A/B/C Paldean Tauros labels were resolved from the workbook's Fighting/Water, Fighting/Fire and Fighting type combinations respectively.

| Workbook form | Pinned sprite identity | Local normal sprite | Local shiny sprite |
|---|---|---|---|
| Burmy-S | Sandy Cloak (`412-sandy.png`) | `assets/pokemon/burmy-sandy.png` | `assets/pokemon/shiny/burmy-sandy.png` |
| Burmy-T | Trash Cloak (`412-trash.png`) | `assets/pokemon/burmy-trash.png` | `assets/pokemon/shiny/burmy-trash.png` |
| Shellos-East | East Sea (`422-east.png`) | `assets/pokemon/shellos-east.png` | `assets/pokemon/shiny/shellos-east.png` |
| Gastrodon-East | East Sea (`423-east.png`) | `assets/pokemon/gastrodon-east.png` | `assets/pokemon/shiny/gastrodon-east.png` |
| Cherrim-Sunny | Sunshine Form (`421-sunshine.png`) | `assets/pokemon/cherrim-sunshine.png` | `assets/pokemon/shiny/cherrim-sunshine.png` |
| Paldean-Tauros-A | Aqua Breed | `assets/pokemon/tauros-paldea-aqua-breed.png` | `assets/pokemon/shiny/tauros-paldea-aqua-breed.png` |
| Paldean-Tauros-B | Blaze Breed | `assets/pokemon/tauros-paldea-blaze-breed.png` | `assets/pokemon/shiny/tauros-paldea-blaze-breed.png` |
| Paldean-Tauros-C | Combat Breed | `assets/pokemon/tauros-paldea-combat-breed.png` | `assets/pokemon/shiny/tauros-paldea-combat-breed.png` |
