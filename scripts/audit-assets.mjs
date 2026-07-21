import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const guide = read('data/guide-data.json');
const items = read('data/items-data.json');
const config = read('config/game-config.json');
const references = [
  ...guide.pokemon.flatMap(p => [p.sprite, p.shinySprite].filter(Boolean).map(file => [`Pokémon ${p.key}`, file])),
  ...items.filter(item => item.sprite).map(item => [`Item ${item.name}`, item.sprite]),
  ...Object.entries(config.branding || {}).filter(([, file]) => typeof file === 'string' && /[/.]/.test(file)).map(([key, file]) => [`Branding ${key}`, file]),
  ...(config.badges || []).filter(badge => badge.image).map(badge => [`Badge ${badge.name}`, badge.image])
];
const localReferences = references.filter(([, file]) => file && !/^(?:https?:|data:)/i.test(file));
const missing = localReferences.filter(([, file]) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  missing.forEach(([label, file]) => console.error(`MISSING: ${label} -> ${file}`));
  process.exit(1);
}

function pngSupportsTransparency(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.length < 33 || buffer.subarray(0, 8).toString('hex') !== pngSignature) return false;
  const colourType = buffer[25];
  if (colourType === 4 || colourType === 6) return true;
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'tRNS') return true;
    offset += length + 12;
  }
  return false;
}

const pokemonPngs = [...new Set(guide.pokemon.flatMap(p => [p.sprite, p.shinySprite]).filter(file => file && /^assets\/pokemon\/.*\.png$/i.test(file)))];
const opaquePokemonPngs = pokemonPngs.filter(file => !pngSupportsTransparency(file));
if (opaquePokemonPngs.length) {
  opaquePokemonPngs.forEach(file => console.error(`OPAQUE POKEMON SPRITE: ${file}`));
  process.exit(1);
}

console.log(`Verified ${localReferences.length} local assets; ${references.length - localReferences.length} remote/data assets were recorded but not treated as local files. Checked transparency metadata for ${pokemonPngs.length} Pokemon PNG sprites.`);
