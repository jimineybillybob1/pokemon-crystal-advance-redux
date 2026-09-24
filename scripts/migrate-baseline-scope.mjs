import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);

const config = read('config/baseline-config.json');
const baseline = read('data/baseline/guide-data.json');
const finalGuide = read('data/guide-data.json');
const finalItems = read('data/items-data.json');
const baselineById = new Map(baseline.pokemon.map(pokemon => [Number(pokemon.id), pokemon]));

const includedPokemonKeys = [...new Set(finalGuide.pokemon
  .filter(pokemon => pokemon._provenance?.origin === 'mixed')
  .map(pokemon => baselineById.get(Number(pokemon.id))?.sourceKey)
  .filter(Boolean))].sort();
const fallbackMoveIds = [...new Set(finalGuide.moves.map(move => Number(move.id)).filter(Number.isInteger))].sort((a, b) => a - b);
const fallbackItemIds = [...new Set(finalItems
  .filter(item => item._provenance?.origin === 'mixed')
  .map(item => Number(item.id))
  .filter(id => Number.isInteger(id) && id < 50000))].sort((a, b) => a - b);

if (!includedPokemonKeys.length || !fallbackMoveIds.length || !fallbackItemIds.length) {
  throw new Error('Could not derive a complete explicit baseline scope from the current generated guide.');
}

delete config.supplementalMoveIds;
Object.assign(config, {
  pokemonScope: 'hack-only',
  includedPokemonKeys,
  includeBaselineLearnsets: false,
  includeItems: false,
  fallbackMoveIds,
  fallbackItemIds,
});
write('config/baseline-config.json', config);
console.log(`Pinned ${includedPokemonKeys.length} PokeAPI forms, ${fallbackMoveIds.length} move definitions and ${fallbackItemIds.length} item definitions.`);
