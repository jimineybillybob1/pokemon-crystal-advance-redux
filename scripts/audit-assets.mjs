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
console.log(`Verified ${localReferences.length} local assets; ${references.length - localReferences.length} remote/data assets were recorded but not treated as local files.`);
