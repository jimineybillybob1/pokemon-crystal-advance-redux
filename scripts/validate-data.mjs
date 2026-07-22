import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const norm = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const errors = [];
const warnings = [];
const requireValue = (condition, message) => { if (!condition) errors.push(message); };
const unique = (items, key, label) => {
  const seen = new Set();
  for (const item of items) {
    const value = String(item?.[key]);
    if (seen.has(value)) errors.push(`Duplicate ${label} ${key}: ${value}`);
    seen.add(value);
  }
};

const config = read('config/game-config.json');
const baselineConfig = read('config/baseline-config.json');
const baselineLock = read('baseline.lock.json');
const pokemonOverrides = read('data/overrides/guide-data.json');
const itemOverrides = read('data/overrides/items-data.json');
const abilityOverrides = read('data/overrides/abilities-data.json');
const guide = read('data/guide-data.json');
const items = read('data/items-data.json');
const acquisition = read('data/acquisition-data.json');
const battles = read('data/battle-data.json');
const eggs = read('data/egg-data.json');

requireValue(config.name && config.version, 'Game config requires name and version.');
requireValue(/^[a-z0-9-]+$/.test(config.storageNamespace || ''), 'storageNamespace must use lowercase letters, numbers and hyphens.');
requireValue(baselineConfig.provider === 'pokeapi', 'baseline-config.json currently supports provider "pokeapi".');
requireValue(Boolean(baselineConfig.versionGroup), 'baseline-config.json requires a mechanics versionGroup.');
requireValue(baselineLock.versionGroup === baselineConfig.versionGroup, 'baseline.lock.json versionGroup must match baseline-config.json. Re-fetch the baseline.');
requireValue(Array.isArray(guide.pokemon) && Array.isArray(guide.moves) && Array.isArray(guide.locations), 'guide-data.json requires pokemon, moves and locations arrays.');
requireValue(Array.isArray(pokemonOverrides.pokemon) && Array.isArray(pokemonOverrides.moves) && Array.isArray(pokemonOverrides.locations), 'data/overrides/guide-data.json requires pokemon, moves and locations arrays.');
requireValue(Array.isArray(itemOverrides), 'data/overrides/items-data.json must be an array.');
requireValue(Array.isArray(abilityOverrides), 'data/overrides/abilities-data.json must be an array.');
unique(pokemonOverrides.pokemon.filter(entry => !entry?.$delete), 'key', 'Pokémon override');
unique(pokemonOverrides.moves.filter(entry => !entry?.$delete), 'id', 'move override');
unique(itemOverrides.filter(entry => !entry?.$delete), 'id', 'item override');
unique(guide.pokemon, 'id', 'Pokémon');
unique(guide.pokemon, 'key', 'Pokémon');
unique(guide.moves, 'id', 'move');
unique(items, 'id', 'item');
unique(battles.battles || [], 'id', 'battle');

const pokemonIds = new Set(guide.pokemon.map(p => Number(p.id)));
const pokemonKeys = new Set(guide.pokemon.map(p => norm(p.key)));
const moveIds = new Set(guide.moves.map(move => Number(move.id)));

for (const pokemon of guide.pokemon) {
  requireValue(Array.isArray(pokemon.stats) && pokemon.stats.length === 6, `${pokemon.key}: stats must contain six values.`);
  if (Array.isArray(pokemon.stats) && Number(pokemon.bst) !== pokemon.stats.reduce((sum, value) => sum + Number(value || 0), 0)) warnings.push(`${pokemon.key}: BST does not equal the six displayed base stats.`);
  for (const edge of pokemon.evolutions || []) if (!pokemonIds.has(Number(edge.targetId))) errors.push(`${pokemon.key}: missing evolution target ${edge.targetId}.`);
  for (const moveId of [...(pokemon.learnset?.level || []).map(entry => entry.moveId), ...(pokemon.learnset?.tm || []), ...(pokemon.learnset?.tutor || [])]) if (!moveIds.has(Number(moveId))) errors.push(`${pokemon.key}: missing move ${moveId}.`);
}

for (const location of guide.locations) {
  requireValue(location.name && Array.isArray(location.day) && Array.isArray(location.night), `Location requires name, day and night arrays: ${JSON.stringify(location)}`);
  for (const encounter of [...(location.day || []), ...(location.night || [])]) {
    if (!pokemonKeys.has(norm(encounter.pokemon))) errors.push(`${location.name}: unresolved encounter ${encounter.pokemon}.`);
    requireValue(encounter.subarea == null || typeof encounter.subarea === 'string', `${location.name}: encounter subarea must be a string.`);
  }
}

for (const [section, entries] of Object.entries(acquisition)) {
  requireValue(Array.isArray(entries), `Acquisition section ${section} must be an array.`);
  for (const entry of entries || []) if (!pokemonKeys.has(norm(entry.pokemon))) errors.push(`${section}: unresolved Pokémon ${entry.pokemon}.`);
}

for (const source of eggs) for (const name of source.pokemon || []) if (!pokemonKeys.has(norm(name))) errors.push(`${source.title || source.id}: unresolved egg Pokémon ${name}.`);
for (const battle of battles.battles || []) {
  requireValue(battle.id && battle.trainer && battle.location && battle.category, `${battle.id || 'Unknown battle'}: battle requires id, trainer, location and category.`);
  requireValue(Array.isArray(battle.team) && battle.team.length > 0, `${battle.id}: battle team must be a non-empty array.`);
  for (const member of battle.team || []) {
    requireValue(member.name && Array.isArray(member.moves), `${battle.id}: every team member requires a name and moves array.`);
    requireValue(typeof member.level === 'number' || typeof member.level === 'string', `${battle.id}: ${member.name} requires a numeric or explicit text level.`);
    if (!member.conditional && !pokemonKeys.has(norm(member.name))) errors.push(`${battle.id}: unresolved battle Pokémon ${member.name}.`);
  }
}

if (!guide.pokemon.length) warnings.push('No Pokémon have been imported yet.');
if (!guide.locations.length) warnings.push('No wild encounter locations have been imported yet.');
if (baselineConfig.enabled && baselineLock.status !== 'ready') warnings.push('The default PokéAPI baseline has not been fetched yet. Run npm run baseline:fetch.');
warnings.forEach(message => console.warn(`WARN: ${message}`));
if (errors.length) {
  errors.forEach(message => console.error(`ERROR: ${message}`));
  process.exit(1);
}
console.log(`Validated ${guide.pokemon.length} Pokémon forms, ${guide.moves.length} moves, ${guide.locations.length} locations, ${items.length} items and ${(battles.battles || []).length} battles.`);
