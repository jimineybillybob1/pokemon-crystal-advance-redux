import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mappings = [
  ['config/game-config.json', 'config/game-config.js', 'GUIDE_CONFIG'],
  ['data/guide-data.json', 'data/guide-data.js', 'GUIDE_DATA'],
  ['data/items-data.json', 'data/items-data.js', 'ITEM_GUIDE_DATA'],
  ['data/legendary-data.json', 'data/legendary-data.js', 'LEGENDARY_GUIDE_DATA'],
  ['data/acquisition-data.json', 'data/acquisition-data.js', 'ACQUISITION_GUIDE_DATA'],
  ['data/egg-data.json', 'data/egg-data.js', 'EGG_GUIDE_DATA'],
  ['data/battle-data.json', 'data/battle-data.js', 'BATTLE_DATA'],
  ['data/curated-builds.json', 'data/curated-builds.js', 'CURATED_BUILD_DATA']
];

for (const [source, output, globalName] of mappings) {
  const value = JSON.parse(fs.readFileSync(path.join(root, source), 'utf8'));
  fs.writeFileSync(path.join(root, output), `window.${globalName}=${JSON.stringify(value)};\n`);
  console.log(`Built ${output}`);
}
