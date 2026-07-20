import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const norm = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

function deepMerge(base, patch) {
  if (!isObject(base) || !isObject(patch)) return structuredClone(patch);
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (key.startsWith('$') || key === '_provenance') continue;
    result[key] = isObject(value) && isObject(result[key]) ? deepMerge(result[key], value) : structuredClone(value);
  }
  return result;
}

function recordKey(record, kind) {
  if (kind === 'pokemon') return record.key ? `key:${norm(record.key)}` : `id:${record.id}`;
  return record.id != null ? `id:${record.id}` : `name:${norm(record.name || record.key)}`;
}

function recordKeys(record, kind) {
  // Numeric form IDs are exact. Prefer them for Pokémon so punctuation-heavy
  // names such as Nidoran♀ and Nidoran♂ cannot collide after normalization.
  const keys = kind === 'pokemon' && record.id != null
    ? [`id:${record.id}`, recordKey(record, kind)]
    : [recordKey(record, kind)];
  if (record.id != null) keys.push(`id:${record.id}`);
  if (record.key) keys.push(`key:${norm(record.key)}`);
  if (record.name) keys.push(`name:${norm(record.name)}`);
  return [...new Set(keys)];
}

function mergeCollection(baseline, overrides, kind) {
  const result = baseline.map(record => ({
    ...structuredClone(record),
    _provenance: { origin: 'baseline', overriddenFields: [] }
  }));
  const positions = new Map();
  result.forEach((record, index) => recordKeys(record, kind).forEach(key => positions.set(key, index)));

  for (const patch of overrides) {
    const keys = recordKeys(patch, kind);
    const index = keys.map(key => positions.get(key)).find(value => value != null);

    if (patch.$delete === true) {
      if (index != null) result[index] = null;
      continue;
    }

    if (index == null) {
      const added = deepMerge({}, patch);
      added._provenance = { origin: 'custom', overriddenFields: Object.keys(patch).filter(key => !key.startsWith('$')) };
      recordKeys(added, kind).forEach(key => positions.set(key, result.length));
      result.push(added);
      continue;
    }

    const base = result[index];
    const overriddenFields = Object.keys(patch).filter(key => !key.startsWith('$') && key !== '_provenance');
    const merged = deepMerge(base, patch);
    merged._provenance = { origin: 'mixed', overriddenFields: [...new Set([...(base._provenance?.overriddenFields || []), ...overriddenFields])] };
    result[index] = merged;
  }

  return result.filter(Boolean);
}

const baselineGuide = read('data/baseline/guide-data.json');
const baselineItems = read('data/baseline/items-data.json');
const baselineAbilities = read('data/baseline/abilities-data.json');
const overrideGuide = read('data/overrides/guide-data.json');
const overrideItems = read('data/overrides/items-data.json');
const overrideAbilities = read('data/overrides/abilities-data.json');
const config = read('config/game-config.json');
const lock = read('baseline.lock.json');

const abilities = mergeCollection(baselineAbilities, overrideAbilities, 'ability');
const abilityByName = new Map(abilities.map(ability => [norm(ability.name), ability]));
const deletedAbilityNames = new Set(overrideAbilities.filter(ability => ability.$delete === true).map(ability => norm(ability.name || ability.key)));
const pokemon = mergeCollection(baselineGuide.pokemon || [], overrideGuide.pokemon || [], 'pokemon').map(record => ({
  ...record,
  abilities: (record.abilities || []).filter(ability => !deletedAbilityNames.has(norm(ability.name))).map(ability => {
    const definition = abilityByName.get(norm(ability.name));
    return definition ? { ...ability, name: definition.name || ability.name, description: definition.description ?? ability.description } : ability;
  })
}));
const moves = mergeCollection(baselineGuide.moves || [], overrideGuide.moves || [], 'move');
const items = mergeCollection(baselineItems || [], overrideItems || [], 'item');
const locations = (overrideGuide.locations || []).filter(location => location.$delete !== true).map(location => ({
  ...location,
  _provenance: { origin: 'rom-hack', overriddenFields: Object.keys(location).filter(key => !key.startsWith('$')) }
}));

const guide = {
  meta: {
    version: config.version,
    source: 'Pinned PokéAPI baseline with ROM-hack overrides',
    baseline: {
      provider: lock.provider,
      apiDataCommit: lock.apiDataCommit,
      spriteCommit: lock.spriteCommit,
      versionGroup: lock.versionGroup,
      fetchedAt: lock.fetchedAt
    },
    overrideSource: overrideGuide.meta?.source || 'ROM hack documentation'
  },
  pokemon,
  moves,
  locations
};

write('data/guide-data.json', guide);
write('data/items-data.json', items);
write('data/abilities-data.json', abilities);
console.log(`Merged ${pokemon.length} Pokémon forms, ${moves.length} moves, ${items.length} items and ${locations.length} hack locations.`);
