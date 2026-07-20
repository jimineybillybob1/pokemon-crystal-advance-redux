import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const guide = read('data/guide-data.json');
const items = read('data/items-data.json');
const config = read('config/baseline-config.json');
const lock = read('baseline.lock.json');
const risky = config.warnOnInheritedFields || [];

const countOrigins = entries => entries.reduce((counts, entry) => {
  const origin = entry._provenance?.origin || 'untracked';
  counts[origin] = (counts[origin] || 0) + 1;
  return counts;
}, {});

const inherited = guide.pokemon.map(pokemon => {
  const overridden = new Set(pokemon._provenance?.overriddenFields || []);
  const fields = risky.filter(field => !overridden.has(field));
  return fields.length ? { id: pokemon.id, key: pokemon.key, fields } : null;
}).filter(Boolean);

const report = {
  generatedAt: new Date().toISOString(),
  baseline: lock,
  counts: {
    pokemon: countOrigins(guide.pokemon),
    moves: countOrigins(guide.moves),
    items: countOrigins(items),
    locations: countOrigins(guide.locations)
  },
  inheritedRiskSummary: risky.map(field => ({ field, count: inherited.filter(entry => entry.fields.includes(field)).length })),
  inheritedPokemon: inherited
};

fs.writeFileSync(path.join(root, 'data/provenance-report.json'), `${JSON.stringify(report, null, 2)}\n`);
if (lock.status !== 'ready') console.warn('WARN: The PokéAPI baseline has not been fetched and pinned yet.');
if (inherited.length) console.warn(`WARN: ${inherited.length} Pokémon forms still inherit one or more review-sensitive baseline fields.`);
console.log(`Provenance: Pokémon ${JSON.stringify(report.counts.pokemon)}, moves ${JSON.stringify(report.counts.moves)}, items ${JSON.stringify(report.counts.items)}.`);
