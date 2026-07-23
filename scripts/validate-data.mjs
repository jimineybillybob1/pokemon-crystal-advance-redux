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
const configuredSupplementalMoveIds = [...new Set((baselineConfig.supplementalMoveIds || []).map(Number))].sort((a, b) => a - b);
requireValue(JSON.stringify(baselineLock.supplementalMoveIds || []) === JSON.stringify(configuredSupplementalMoveIds), 'baseline.lock.json supplementalMoveIds must match baseline-config.json. Re-fetch the baseline.');
requireValue(Array.isArray(guide.pokemon) && Array.isArray(guide.moves) && Array.isArray(guide.locations), 'guide-data.json requires pokemon, moves and locations arrays.');
requireValue(Array.isArray(pokemonOverrides.pokemon) && Array.isArray(pokemonOverrides.moves) && Array.isArray(pokemonOverrides.locations), 'data/overrides/guide-data.json requires pokemon, moves and locations arrays.');
requireValue(Array.isArray(itemOverrides), 'data/overrides/items-data.json must be an array.');
requireValue(Array.isArray(abilityOverrides), 'data/overrides/abilities-data.json must be an array.');
unique(pokemonOverrides.pokemon.filter(entry => !entry?.$delete), 'key', 'Pokémon override');
unique(pokemonOverrides.moves.filter(entry => !entry?.$delete), 'id', 'move override');
unique(itemOverrides.filter(entry => !entry?.$delete), 'id', 'item override');
unique(guide.pokemon, 'id', 'Pokémon');
unique(guide.pokemon, 'key', 'Pokémon');
const numberedGameDex = guide.pokemon.filter(pokemon => pokemon.gameDexId != null);
unique(numberedGameDex, 'gameDexId', 'in-game Pokedex entry');
unique(guide.moves, 'id', 'move');
unique(items, 'id', 'item');
unique(battles.battles || [], 'id', 'battle');
unique(config.badges || [], 'id', 'badge');

if (config.features?.badges) requireValue(Array.isArray(config.badges) && config.badges.length > 0, 'Badge tracking is enabled but no badges are configured.');
for (const badge of config.badges || []) {
  requireValue(badge.id && badge.name && badge.region && badge.image, `Badge requires id, name, region and image: ${JSON.stringify(badge)}`);
  if (badge.code != null) requireValue(/^82003884 [0-9A-F]{4}$/.test(badge.code), `${badge.name || badge.id}: invalid documented badge code ${badge.code}.`);
}

const pokemonIds = new Set(guide.pokemon.map(p => Number(p.id)));
const pokemonKeys = new Set(guide.pokemon.map(p => norm(p.key)));
const moveIds = new Set(guide.moves.map(move => Number(move.id)));
for (const moveId of configuredSupplementalMoveIds) requireValue(moveIds.has(moveId), `Supplemental move ${moveId} is missing from the merged guide.`);

for (const move of guide.moves) {
  requireValue(move.name && move.type && move.type !== 'Unknown', `${move.id}: move requires a documented name and type.`);
  requireValue(['Physical', 'Special', 'Status'].includes(move.category), `${move.id} ${move.name}: invalid or missing move category ${move.category}.`);
  requireValue(Number.isInteger(move.pp) && move.pp > 0, `${move.id} ${move.name}: move PP must be a positive integer.`);
  requireValue(move.power == null || (Number.isFinite(move.power) && move.power >= 0), `${move.id} ${move.name}: move power must be numeric or explicitly variable.`);
  requireValue(move.accuracy == null || (Number.isFinite(move.accuracy) && move.accuracy >= 0 && move.accuracy <= 100), `${move.id} ${move.name}: move accuracy must be 0-100 or explicitly bypass checks.`);
  requireValue(Number.isInteger(move.priority), `${move.id} ${move.name}: move priority must be an integer.`);
  requireValue(Boolean(String(move.description || '').trim()) && !String(move.description).includes('definition is not supplied'), `${move.id} ${move.name}: move requires a real effect description.`);
}

for (const pokemon of guide.pokemon) {
  requireValue(pokemon.gameDexId == null || (Number.isInteger(Number(pokemon.gameDexId)) && Number(pokemon.gameDexId) > 0), `${pokemon.key}: gameDexId must be a positive integer or null.`);
  requireValue(Array.isArray(pokemon.stats) && pokemon.stats.length === 6, `${pokemon.key}: stats must contain six values.`);
  if (Array.isArray(pokemon.stats) && Number(pokemon.bst) !== pokemon.stats.reduce((sum, value) => sum + Number(value || 0), 0)) warnings.push(`${pokemon.key}: BST does not equal the six displayed base stats.`);
  for (const edge of pokemon.evolutions || []) if (!pokemonIds.has(Number(edge.targetId))) errors.push(`${pokemon.key}: missing evolution target ${edge.targetId}.`);
  for (const moveId of [...(pokemon.learnset?.level || []).map(entry => entry.moveId), ...(pokemon.learnset?.tm || []), ...(pokemon.learnset?.tutor || [])]) if (!moveIds.has(Number(moveId))) errors.push(`${pokemon.key}: missing move ${moveId}.`);
}

if (numberedGameDex.length) {
  const gameDexNumbers = numberedGameDex.map(pokemon => Number(pokemon.gameDexId)).sort((a, b) => a - b);
  requireValue(gameDexNumbers.every((value, index) => value === index + 1), `In-game Pokedex numbers must be continuous from 1; found ${gameDexNumbers.length} entries ending at ${gameDexNumbers.at(-1)}.`);
}

for (const location of guide.locations) {
  requireValue(location.name && Array.isArray(location.day) && Array.isArray(location.night), `Location requires name, day and night arrays: ${JSON.stringify(location)}`);
  for (const encounter of [...(location.day || []), ...(location.night || [])]) {
    if (!pokemonKeys.has(norm(encounter.pokemon))) errors.push(`${location.name}: unresolved encounter ${encounter.pokemon}.`);
    requireValue(['Wild', 'Tree', 'Rock', 'Surf', 'Fish', 'Dive'].includes(encounter.method), `${location.name}: invalid encounter method ${encounter.method}.`);
    requireValue(encounter.subarea == null || typeof encounter.subarea === 'string', `${location.name}: encounter subarea must be a string.`);
    requireValue(encounter.rod == null || ['Old Rod', 'Good Rod', 'Super Rod'].includes(encounter.rod), `${location.name}: invalid fishing rod ${encounter.rod}.`);
    if (encounter.method === 'Fish') requireValue(['Old Rod', 'Good Rod', 'Super Rod'].includes(encounter.rod), `${location.name}: fishing encounter ${encounter.pokemon} requires a rod.`);
  }
}

for (const [section, entries] of Object.entries(acquisition)) {
  requireValue(Array.isArray(entries), `Acquisition section ${section} must be an array.`);
  for (const entry of entries || []) if (!pokemonKeys.has(norm(entry.pokemon))) errors.push(`${section}: unresolved Pokémon ${entry.pokemon}.`);
}

for (const source of eggs) for (const name of source.pokemon || []) if (!pokemonKeys.has(norm(name))) errors.push(`${source.title || source.id}: unresolved egg Pokémon ${name}.`);
for (const battle of battles.battles || []) {
  requireValue(battle.id && battle.trainer && battle.location && battle.category, `${battle.id || 'Unknown battle'}: battle requires id, trainer, location and category.`);
  requireValue(Array.isArray(battle.team) && (battle.team.length > 0 || battle.hiddenTeam === true), `${battle.id}: battle team must be populated unless the source intentionally hides it.`);
  requireValue(typeof battle.subarea === 'string', `${battle.id}: battle subarea must be a string.`);
  requireValue(typeof battle.boss === 'boolean', `${battle.id}: battle boss flag must be a boolean.`);
  requireValue(typeof battle.rival === 'boolean', `${battle.id}: battle rival flag must be a boolean.`);
  requireValue(typeof battle.doubleBattle === 'boolean', `${battle.id}: battle double-battle flag must be a boolean.`);
  if (battle.hiddenTeam) {
    requireValue(battle.team.length === 0, `${battle.id}: hidden Gym Leader team must remain empty.`);
    requireValue(battle.gymLeader === true && battle.boss === true, `${battle.id}: hidden team must be a marked Gym Leader battle.`);
    requireValue(typeof battle.gymRematch === 'boolean', `${battle.id}: hidden Gym Leader requires an initial/rematch flag.`);
    requireValue(Boolean(battle.specialty && battle.badge), `${battle.id}: hidden Gym Leader requires specialty and badge metadata.`);
  }
  if (battle.subarea) {
    requireValue(typeof battle.subareaInherited === 'boolean', `${battle.id}: documented battle subarea requires an inheritance flag.`);
    requireValue(Number.isInteger(battle.subareaSourceRow) && battle.subareaSourceRow > 0, `${battle.id}: documented battle subarea requires a positive source row.`);
    if (battle.subareaInherited) requireValue(battle.subareaSourceRow < battle.source?.row, `${battle.id}: inherited subarea must originate on an earlier source row.`);
    else requireValue(battle.subareaSourceRow === battle.source?.row, `${battle.id}: explicit subarea must originate on its own source row.`);
  } else {
    requireValue(battle.subareaInherited == null && battle.subareaSourceRow == null, `${battle.id}: blank subarea must not carry inheritance metadata.`);
  }
  for (const member of battle.team || []) {
    requireValue(member.name && Array.isArray(member.moves), `${battle.id}: every team member requires a name and moves array.`);
    requireValue(typeof member.level === 'number' || typeof member.level === 'string', `${battle.id}: ${member.name} requires a numeric or explicit text level.`);
    if (member.conditionalKey === 'rival-starter') {
      requireValue(battle.rival, `${battle.id}: rival-starter member must belong to a rival battle.`);
      requireValue(Number.isInteger(member.evolutionStage) && member.evolutionStage >= 1 && member.evolutionStage <= 3, `${battle.id}: rival-starter member requires evolutionStage 1-3.`);
      requireValue(/^SE Starter(?: [23])?$/i.test(member.name), `${battle.id}: rival-starter placeholder is malformed: ${member.name}.`);
    }
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
