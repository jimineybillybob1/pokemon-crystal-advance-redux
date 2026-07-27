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

## User-supplied custom-form sprites

These normal-form sprites were supplied by the user on 2026-07-27 and are preserved in `sources/inbox/custom-form-sprites-2026-07-27/`. No source page URL or reuse licence was supplied. The clone filenames attribute the artwork to `KrystalDragonX546`; the creators of the Armoured Mewtwo and XD001 sheets are unknown. Treat all five as provisional guide assets and replace them if version-matched developer artwork or clearer permissions become available.

| Guide form | Supplied file | Source SHA-256 | Processing | Local file | Local SHA-256 |
|---|---|---|---|---|---|
| Blastoise Clone | `clone_blastoise_by_krystaldragonx546_dfs4hhf.png` | `B13B874F7D8D718DDE7D6123D9EE77053E6A29876AA299DBCFF53975A109A573` | Visible 59×55 pixel sprite centred on a transparent 96×96 canvas; no resampling | `assets/pokemon/blastoise-clone.png` | `A502E41B35FA3B65F12149020A5883E52B0B66933DDEB0B0422A5C1E9D32ACD5` |
| Charizard Clone | `clone_charizard_by_krystaldragonx546_dfs3zca.png` | `5F21AC1445570F63B478586B5156FE78FC386C1005A599BC09BAFB2217976628` | Visible 64×62 pixel sprite centred on a transparent 96×96 canvas; no resampling | `assets/pokemon/charizard-clone.png` | `21DB4CFAF70E055B60691FF5D46D17B8CEC93DB5D04AB42D62FDED4C5BAF09CF` |
| Venusaur Clone | `clone_venusaur__by_krystaldragonx546_dfs3a7e.png` | `83F19092B5470841F4FF65AD640D1654C570352CF126E574B027B70DBED2FB0D` | Visible 59×54 pixel sprite centred on a transparent 96×96 canvas; no resampling | `assets/pokemon/venusaur-clone.png` | `66D80EAE530582D926CC48B524B6B5A4CA6BA8AF33CA174A0A14742B8B971B05` |
| Armoured Mewtwo | `dbak0bv-a070bdfd-fc8d-424a-aee9-1df323766b4c.png` | `9883D278BD723285276D0B78F8DA2976B49B4E9FE3048903932EBAA67B7616AB` | Extracted only the large far-left component at source bounds `(22, 36)–(86, 128)`, then centred the unchanged 64×92 pixels on a transparent 96×96 canvas | `assets/pokemon/armoured-mewtwo.png` | `7356527293302FA6732C3B307B10E56AA4A2201F90EAF3A07F16FAA81713F229` |
| XD001 | `d3xpjhr-09804149-dbfd-4eed-99ef-f067cecb35a6.png` | `F002CB11D3E45FA70CAE489278250C5745F2F644EAD872355F88444F991AF79E` | Extracted only the large bottom-left component at source bounds `(8, 171)–(104, 258)`, then centred the unchanged 96×87 pixels on a transparent 96×96 canvas | `assets/pokemon/xd001.png` | `5D9A819FD507E79D67B5536203434B7DA0ED210B9C6BB235286574D267BE7081` |

No shiny artwork was supplied for these five forms, so the guide keeps shiny display explicitly unavailable rather than substituting a placeholder or base-form sprite.

## User-supplied Crystal Onix and Steelix sprites

These normal-form sprites were supplied by the user on 2026-07-28 and are preserved in `sources/inbox/custom-form-sprites-2026-07-28/`. No source page URL, creator credit or reuse licence was supplied. Treat both as provisional guide assets and replace them if version-matched developer artwork or clearer permissions become available.

| Guide form | Supplied file | Source SHA-256 | Processing | Local file | Local SHA-256 |
|---|---|---|---|---|---|
| Onix-C | `onix-c.png` | `A55461E866F74A3DFD50C21F60D2B368ED1C7C356E6C7BD266E6821A8EB0CA16` | Isolated only the left pose at alpha bounds `(36, 36)–(252, 255)`, scaled the 216×219 visible component with nearest-neighbour sampling to fit within 88×88, then centred it on a transparent 96×96 canvas | `assets/pokemon/onix-c.png` | `D9E1D757FCDBF94F85E46328FA3F6525C86E57865F0FC80D600AB13FCDC22788` |
| Steelix-C | `steelix-c.webp` | `BCAFE9CD210E0B411D8A904852E52FD0D4D5654FBC9C86FDA113D5780C4738AE` | Cropped the supplied pose to its 148×148 alpha bounds, scaled it with nearest-neighbour sampling to 88×88, then centred it on a transparent 96×96 canvas | `assets/pokemon/steelix-c.png` | `64327AD72146DFFE702C358205BB003005C4C4CE7D2E7318304307C67D459203` |

No shiny artwork was supplied for Onix-C or Steelix-C, so shiny display remains explicitly unavailable rather than substituting another form.
