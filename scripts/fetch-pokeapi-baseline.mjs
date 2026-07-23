import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
};
const config = read('config/baseline-config.json');
const existingLock = read('baseline.lock.json');
const argv = process.argv.slice(2);
const flag = name => argv.includes(name);
const option = name => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
};
const testLimit = Number(option('--limit')) || null;
const itemLimit = Number(option('--item-limit')) || null;
const refresh = flag('--refresh');
const downloadSprites = flag('--no-download-sprites') ? false : config.downloadSprites !== false;
const concurrency = Math.max(1, Number(option('--concurrency')) || Number(config.concurrency) || 12);
const supplementalMoveIds = [...new Set((config.supplementalMoveIds || []).map(Number))]
  .filter(id => Number.isInteger(id) && id > 0)
  .sort((a, b) => a - b);
const cacheRoot = path.join(root, 'work', 'pokeapi-cache');
const language = config.language || 'en';

if (!config.enabled) throw new Error('The baseline is disabled in config/baseline-config.json.');
if (config.provider !== 'pokeapi') throw new Error(`Unsupported baseline provider: ${config.provider}`);

async function fetchWithRetry(url, binary = false) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'pokemon-rom-hack-field-guide-builder' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return binary ? Buffer.from(await response.arrayBuffer()) : await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 350));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message}`);
}

async function latestCommit(repository) {
  const commits = await fetchWithRetry(`https://api.github.com/repos/${repository}/commits?per_page=1`);
  if (!Array.isArray(commits) || !commits[0]?.sha) throw new Error(`Could not resolve the latest commit for ${repository}.`);
  return commits[0].sha;
}

async function resolveCommit(repository, configured, lockField) {
  if (configured && configured !== 'latest') return configured;
  if (!refresh && existingLock.status === 'ready' && existingLock[lockField]) return existingLock[lockField];
  return latestCommit(repository);
}

const apiDataCommit = await resolveCommit(config.apiDataRepository, config.apiDataCommit, 'apiDataCommit');
const spriteCommit = await resolveCommit(config.spriteRepository, config.spriteCommit, 'spriteCommit');
const cacheNamespace = path.join(cacheRoot, apiDataCommit);

function resourceId(value) {
  const parts = String(value?.url || value || '').split('/').filter(Boolean);
  return parts.at(-1);
}

async function resource(resourceName, id = '') {
  const suffix = id === '' ? 'index' : String(id);
  const cacheFile = path.join(cacheNamespace, resourceName, `${suffix}.json`);
  if (!refresh && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const url = `https://raw.githubusercontent.com/${config.apiDataRepository}/${apiDataCommit}/data/api/v2/${resourceName}/${id === '' ? '' : `${id}/`}index.json`;
  const value = await fetchWithRetry(url);
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(value));
  return value;
}

async function mapPool(values, mapper, size = concurrency) {
  const output = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, Math.max(values.length, 1)) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await mapper(values[index], index);
      if ((index + 1) % 100 === 0) console.log(`Processed ${index + 1}/${values.length}`);
    }
  });
  await Promise.all(workers);
  return output;
}

const english = (entries, field = 'name') => entries?.find(entry => entry.language?.name === language)?.[field] || '';
const title = value => String(value || '').split('-').filter(Boolean).map(part => part.length <= 3 && /^[ivx]+$/i.test(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const keyTitle = value => title(value).replaceAll(' ', '-');
const cleanEffect = value => String(value || '').replace(/\$effect_chance/g, 'the documented').replace(/\s+/g, ' ').trim();
const typeColours = {
  normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'
};

function pinSpriteUrl(url) {
  return url ? url.replace(/\/PokeAPI\/sprites\/(?:master|main)\//i, `/PokeAPI/sprites/${spriteCommit}/`) : '';
}

async function localizeSprite(url, relativePath) {
  const pinned = pinSpriteUrl(url);
  if (!pinned || !downloadSprites) return pinned;
  const target = path.join(root, relativePath);
  if (!refresh && fs.existsSync(target)) return relativePath.replaceAll('\\', '/');
  try {
    const bytes = await fetchWithRetry(pinned, true);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    return relativePath.replaceAll('\\', '/');
  } catch (error) {
    console.warn(`WARN: ${error.message}; retaining the remote sprite URL.`);
    return pinned;
  }
}

function evolutionMethod(details = []) {
  const detail = details[0] || {};
  const parts = [];
  if (detail.min_level != null) parts.push(`Reach level ${detail.min_level}`);
  if (detail.item?.name) parts.push(`Use ${title(detail.item.name)}`);
  if (detail.held_item?.name) parts.push(`Hold ${title(detail.held_item.name)}`);
  if (detail.known_move?.name) parts.push(`know ${title(detail.known_move.name)}`);
  if (detail.known_move_type?.name) parts.push(`know a ${title(detail.known_move_type.name)}-type move`);
  if (detail.min_happiness != null) parts.push(`friendship ${detail.min_happiness}+`);
  if (detail.min_affection != null) parts.push(`affection ${detail.min_affection}+`);
  if (detail.min_beauty != null) parts.push(`beauty ${detail.min_beauty}+`);
  if (detail.time_of_day) parts.push(`during ${detail.time_of_day}`);
  if (detail.location?.name) parts.push(`at ${title(detail.location.name)}`);
  if (detail.needs_overworld_rain) parts.push('while it is raining');
  if (detail.turn_upside_down) parts.push('with the system upside down');
  if (detail.party_species?.name) parts.push(`with ${title(detail.party_species.name)} in the party`);
  if (detail.party_type?.name) parts.push(`with a ${title(detail.party_type.name)}-type Pokémon in the party`);
  if (detail.trade_species?.name) parts.push(`trade for ${title(detail.trade_species.name)}`);
  if (!parts.length && detail.trigger?.name) parts.push(title(detail.trigger.name));
  return parts.join(' · ') || 'Special evolution method';
}

console.log(`Pinning PokéAPI data ${apiDataCommit.slice(0, 12)} and sprites ${spriteCommit.slice(0, 12)}.`);
const speciesIndex = await resource('pokemon-species');
let speciesRefs = speciesIndex.results || [];
if (config.maxNationalDex != null) speciesRefs = speciesRefs.filter(ref => Number(resourceId(ref)) <= Number(config.maxNationalDex));
if (testLimit) speciesRefs = speciesRefs.slice(0, testLimit);
console.log(`Fetching ${speciesRefs.length} species.`);
const species = await mapPool(speciesRefs, ref => resource('pokemon-species', resourceId(ref)));

const varietyRefs = [];
for (const entry of species) {
  const varieties = config.includeNonDefaultForms === false ? (entry.varieties || []).filter(variety => variety.is_default) : (entry.varieties || []);
  for (const variety of varieties) varietyRefs.push({ species: entry, variety });
}
console.log(`Fetching ${varietyRefs.length} Pokémon forms.`);
const pokemonResources = await mapPool(varietyRefs, async entry => ({ ...entry, pokemon: await resource('pokemon', resourceId(entry.variety.pokemon)) }));

const abilityRefs = new Map();
const moveRefs = new Map();
for (const { pokemon } of pokemonResources) {
  for (const ability of pokemon.abilities || []) if (ability.ability) abilityRefs.set(resourceId(ability.ability), ability.ability);
  for (const move of pokemon.moves || []) {
    if ((move.version_group_details || []).some(detail => detail.version_group?.name === config.versionGroup)) moveRefs.set(resourceId(move.move), move.move);
  }
}
for (const id of supplementalMoveIds) {
  moveRefs.set(String(id), { name: `supplemental-move-${id}`, url: `https://pokeapi.co/api/v2/move/${id}/` });
}
console.log(`Fetching ${abilityRefs.size} abilities and ${moveRefs.size} learnable moves for ${config.versionGroup}.`);
const abilityResources = await mapPool([...abilityRefs], async ([id]) => resource('ability', id));
const moveResources = await mapPool([...moveRefs], async ([id]) => resource('move', id));
const abilityById = new Map(abilityResources.map(ability => [String(ability.id), ability]));
const moveById = new Map(moveResources.map(move => [String(move.id), move]));

const abilities = abilityResources.map(ability => ({
  id: ability.id,
  key: ability.name,
  name: english(ability.names) || title(ability.name),
  description: cleanEffect(english(ability.effect_entries, 'short_effect') || english(ability.flavor_text_entries, 'flavor_text')),
  generation: ability.generation?.name || ''
})).sort((a, b) => a.id - b.id);

const moves = moveResources.map(move => ({
  id: move.id,
  key: move.name,
  name: english(move.names) || title(move.name),
  type: title(move.type?.name),
  typeColour: typeColours[move.type?.name] || '#888888',
  category: title(move.damage_class?.name),
  power: move.power,
  accuracy: move.accuracy,
  pp: move.pp,
  priority: move.priority || 0,
  description: cleanEffect(english(move.effect_entries, 'short_effect') || english(move.flavor_text_entries, 'flavor_text'))
})).sort((a, b) => a.id - b.id);

const statOrder = ['hp', 'attack', 'defense', 'speed', 'special-attack', 'special-defense'];
const speciesDefaultPokemon = new Map(species.map(entry => [entry.name, Number(resourceId((entry.varieties || []).find(variety => variety.is_default)?.pokemon))]));
const pokemon = await mapPool(pokemonResources, async ({ species: speciesEntry, variety, pokemon: source }) => {
  const speciesName = english(speciesEntry.names) || title(speciesEntry.name);
  const displayKey = variety.is_default ? speciesName.replaceAll(' ', '-') : keyTitle(source.name);
  const statsByName = new Map((source.stats || []).map(stat => [stat.stat.name, stat.base_stat]));
  const stats = statOrder.map(name => Number(statsByName.get(name) || 0));
  const learnset = { level: [], tm: [], tutor: [], egg: [], other: [] };
  for (const moveEntry of source.moves || []) {
    const moveId = Number(resourceId(moveEntry.move));
    if (!moveById.has(String(moveId))) continue;
    for (const detail of (moveEntry.version_group_details || []).filter(value => value.version_group?.name === config.versionGroup)) {
      const method = detail.move_learn_method?.name;
      if (method === 'level-up') learnset.level.push({ moveId, level: Number(detail.level_learned_at || 0) });
      else if (method === 'machine') learnset.tm.push(moveId);
      else if (method === 'tutor') learnset.tutor.push(moveId);
      else if (method === 'egg') learnset.egg.push(moveId);
      else learnset.other.push({ moveId, method: method || 'special' });
    }
  }
  learnset.level = [...new Map(learnset.level.map(entry => [`${entry.moveId}:${entry.level}`, entry])).values()].sort((a, b) => a.level - b.level || a.moveId - b.moveId);
  for (const key of ['tm', 'tutor', 'egg']) learnset[key] = [...new Set(learnset[key])].sort((a, b) => a - b);
  const abilityList = (source.abilities || []).map(entry => {
    const definition = abilityById.get(String(resourceId(entry.ability)));
    return { name: english(definition?.names) || title(entry.ability?.name), description: cleanEffect(english(definition?.effect_entries, 'short_effect') || english(definition?.flavor_text_entries, 'flavor_text')), hidden: Boolean(entry.is_hidden), slot: entry.slot };
  });
  const normalRemote = pinSpriteUrl(source.sprites?.front_default);
  const shinyRemote = config.includeShinySprites === false ? '' : pinSpriteUrl(source.sprites?.front_shiny);
  const sprite = await localizeSprite(normalRemote, `assets/pokemon/${source.name}.png`);
  const shinySprite = shinyRemote ? await localizeSprite(shinyRemote, `assets/pokemon/shiny/${source.name}.png`) : '';
  return {
    id: source.id,
    dexId: speciesEntry.id,
    sourceKey: source.name,
    key: displayKey,
    name: speciesName,
    isDefaultForm: Boolean(variety.is_default),
    types: (source.types || []).sort((a, b) => a.slot - b.slot).map(entry => title(entry.type.name)),
    typeColours: (source.types || []).sort((a, b) => a.slot - b.slot).map(entry => typeColours[entry.type.name] || '#888888'),
    stats,
    bst: stats.reduce((sum, value) => sum + value, 0),
    abilities: abilityList,
    learnset,
    evolutions: [],
    sprite,
    shinySprite
  };
});

const pokemonById = new Map(pokemon.map(entry => [Number(entry.id), entry]));
const chainIds = [...new Set(species.map(entry => resourceId(entry.evolution_chain)).filter(Boolean))];
console.log(`Fetching ${chainIds.length} evolution chains.`);
const chains = await mapPool(chainIds, id => resource('evolution-chain', id));
function applyChain(node) {
  const sourceId = speciesDefaultPokemon.get(node.species?.name);
  for (const child of node.evolves_to || []) {
    const targetId = speciesDefaultPokemon.get(child.species?.name);
    const sourcePokemon = pokemonById.get(sourceId);
    if (sourcePokemon && targetId && pokemonById.has(targetId)) sourcePokemon.evolutions.push({ targetId, method: evolutionMethod(child.evolution_details) });
    applyChain(child);
  }
}
chains.forEach(chain => applyChain(chain.chain));

let items = [];
if (config.includeItems !== false) {
  const itemIndex = await resource('item');
  let itemRefs = itemIndex.results || [];
  const configuredLimit = config.maxItems == null ? null : Number(config.maxItems);
  if (configuredLimit) itemRefs = itemRefs.slice(0, configuredLimit);
  if (itemLimit) itemRefs = itemRefs.slice(0, itemLimit);
  console.log(`Fetching ${itemRefs.length} items.`);
  const itemResources = await mapPool(itemRefs, ref => resource('item', resourceId(ref)));
  items = await mapPool(itemResources, async item => {
    const remote = pinSpriteUrl(item.sprites?.default);
    const sprite = await localizeSprite(remote, `assets/items/default/${item.name}.png`);
    return {
      id: item.id,
      key: item.name,
      name: english(item.names) || title(item.name),
      description: cleanEffect(english(item.effect_entries, 'short_effect') || english(item.flavor_text_entries, 'text')),
      category: title(item.category?.name),
      sprite,
      locations: [],
      costs: item.cost ? [{ location: 'Mainline baseline', amount: item.cost, currency: 'Pokédollars', display: `₽${item.cost}` }] : [],
      move: null
    };
  });
}

const fetchedAt = new Date().toISOString();
const lock = {
  status: 'ready',
  provider: 'pokeapi',
  apiDataRepository: config.apiDataRepository,
  apiDataCommit,
  spriteRepository: config.spriteRepository,
  spriteCommit,
  versionGroup: config.versionGroup,
  maxNationalDex: config.maxNationalDex,
  includeNonDefaultForms: config.includeNonDefaultForms,
  supplementalMoveIds,
  fetchedAt,
  counts: { species: species.length, pokemonForms: pokemon.length, moves: moves.length, abilities: abilities.length, items: items.length }
};
write('baseline.lock.json', lock);
write('data/baseline/guide-data.json', { meta: { version: apiDataCommit, source: 'Pinned PokéAPI api-data snapshot', fetchedAt, versionGroup: config.versionGroup }, pokemon: pokemon.sort((a, b) => Number(a.dexId) - Number(b.dexId) || a.id - b.id), moves, locations: [] });
write('data/baseline/items-data.json', items.sort((a, b) => Number(a.id) - Number(b.id)));
write('data/baseline/abilities-data.json', abilities);
console.log(`Baseline ready: ${pokemon.length} forms, ${moves.length} moves, ${abilities.length} abilities and ${items.length} items.`);
console.log('Run npm run build:data to apply ROM-hack overrides.');
