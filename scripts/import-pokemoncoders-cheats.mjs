import fs from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || "sources/normalized/pokemoncoders-cheats-2026-07-11.json";

if (!inputPath) {
  throw new Error("Usage: node scripts/import-pokemoncoders-cheats.mjs <extracted-page.json> [output.json]");
}

const pageSections = JSON.parse(await fs.readFile(inputPath, "utf8"));

function section(title) {
  const match = pageSections.find((entry) => entry.title === title);
  if (!match) throw new Error(`Missing source section: ${title}`);
  return match;
}

function codeBlocks(title) {
  return section(title).blocks
    .filter((block) => block.tag === "PRE")
    .map((block) => block.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
}

function flattenCodes(title) {
  return codeBlocks(title).flat();
}

function parseAssignments(title) {
  const rows = [];
  for (const block of section(title).blocks) {
    for (const line of block.text.split(/\r?\n/)) {
      const match = line.trim().match(/^([0-9A-F]{4})\s*=\s*(.+)$/i);
      if (match) rows.push({ id: match[1].toUpperCase(), name: match[2].trim() });
    }
  }
  return rows;
}

function uniqueBy(rows, key) {
  const seen = new Set();
  return rows.filter((row) => {
    const value = key(row);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

const fixedCheats = [
  {
    category: "Battle",
    name: "Catch Trainer Pokémon (press L+R before throwing a ball)",
    codes: flattenCodes("Catch the Enemy Trainer’s Pokemon"),
  },
  { category: "Battle", name: "Instant knockout", codes: flattenCodes("Instant Kill") },
  { category: "Battle", name: "Large EXP gain", codes: flattenCodes("Get a Lot of EXP") },
  { category: "Battle", name: "Unlimited PP", codes: flattenCodes("Unlimited PP") },
  { category: "Encounter", name: "Force female encounters", codes: codeBlocks("Gender Modifier")[0] },
  { category: "Encounter", name: "Force male encounters", codes: codeBlocks("Gender Modifier")[1] },
  { category: "Encounter", name: "No wild encounters", codes: flattenCodes("No Encounters") },
  {
    category: "Encounter",
    name: "Shiny encounters (disable before catching to avoid name glitch)",
    codes: flattenCodes("Shiny Pokemon Encounter"),
  },
  { category: "Shop", name: "Poké Mart items cost 1", codes: flattenCodes("Poke Mart Items Cost Only 1") },
  {
    category: "Movement",
    name: "Walk through walls (save first; avoid getting stuck)",
    codes: flattenCodes("Walk Through Walls"),
  },
];

const maxStats = section("Max Stats").blocks;
for (let index = 0; index < maxStats.length - 1; index += 1) {
  const slot = maxStats[index].text.match(/^(\d)(?:st|nd|rd|th) Pokemon$/i);
  if (slot && maxStats[index + 1].tag === "PRE") {
    fixedCheats.push({
      category: "Party",
      name: `Party slot ${slot[1]} max stats`,
      codes: maxStats[index + 1].text.split(/\r?\n/).filter(Boolean),
    });
  }
}

const perfectIvBlocks = codeBlocks("Perfect IV Stats");
fixedCheats.push(
  { category: "Master", name: "Perfect IV master code", codes: perfectIvBlocks[0] },
  { category: "Party", name: "Perfect IV stats (requires Perfect IV master)", codes: perfectIvBlocks[1] },
);

const moneyBlocks = codeBlocks("Unlimited Money");
fixedCheats.push(
  { category: "Master", name: "Unlimited money master code", codes: moneyBlocks[0] },
  { category: "Money", name: "Unlimited money (requires money master)", codes: moneyBlocks[1] },
);

const eggBlocks = codeBlocks("Fast Egg Hatch");
fixedCheats.push(
  { category: "Master", name: "Fast egg hatch master code", codes: eggBlocks[0] },
  { category: "Party", name: "Fast egg hatch (requires egg master)", codes: eggBlocks[1] },
);

const levelSection = section("Level Modifier");
const levelLead = levelSection.blocks.map((block) => block.text).join("\n")
  .match(/([0-9A-F]{8}\s+[0-9A-F]{8})\s*\+\s*Level Code/i)?.[1];
if (!levelLead) throw new Error("Could not extract the level modifier lead code");
const levels = [];
for (const block of levelSection.blocks) {
  for (const line of block.text.split(/\r?\n/)) {
    const match = line.match(/^Level\s+(\d+):\s+([0-9A-F]{8}\s+[0-9A-F]{8})$/i);
    if (match) levels.push({ level: Number(match[1]), codes: [match[2].toUpperCase()] });
  }
}

const natureSection = section("Nature Modifier");
const natureLead = natureSection.blocks.map((block) => block.text).join("\n")
  .match(/([0-9A-F]{8}\s+[0-9A-F]{8})\s*\+\s*Nature Code/i)?.[1];
if (!natureLead) throw new Error("Could not extract the nature modifier lead code");
const natures = [];
for (const block of natureSection.blocks) {
  for (const line of block.text.split(/\r?\n/)) {
    const match = line.match(/^([0-9A-F]{8}\s+[0-9A-F]{8})\s*=\s*(.+)$/i);
    if (match) natures.push({ name: match[2].trim(), codes: [match[1].toUpperCase()] });
  }
}

const wildPokemon = [];
for (let generation = 1; generation <= 4; generation += 1) {
  for (const row of parseAssignments(`Wild Pokemon Modifier Gen. ${generation}`)) {
    wildPokemon.push({ generation, ...row, codes: [`8202404C ${row.id}`] });
  }
}

const pcItemSections = ["Rare Candy", "Master Ball", "Poke Ball", "Berries", "TM and HM", "Healing Items", "Misc Items"];
const pcItems = [];
for (const title of pcItemSections) {
  const rows = parseAssignments(title);
  if (rows.length) {
    for (const row of rows) pcItems.push({ category: title, ...row, codes: [`82025840 ${row.id}`] });
  } else {
    const id = section(title).blocks.map((block) => block.text.trim()).find((text) => /^[0-9A-F]{4}$/i.test(text));
    if (!id) throw new Error(`Could not extract the ${title} Item PC code`);
    pcItems.push({ category: title, id: id.toUpperCase(), name: title, codes: [`82025840 ${id.toUpperCase()}`] });
  }
}

const martSection = section("PokeMart Modifier Codes (Shared by Justin The Butt)");
const martItems = [];
for (const block of martSection.blocks) {
  const lines = block.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length || !lines.slice(1).some((line) => /82003884/i.test(line))) continue;
  const category = lines[0].replace(/:$/, "");
  if (/^Unknown \/ Debug/i.test(category)) continue;
  for (const line of lines.slice(1)) {
    const match = line.match(/^(?:•\s*)?82003884\s+([0-9A-F]{4})\s+[–-]\s+(.+)$/i);
    if (!match) continue;
    const id = match[1].toUpperCase();
    martItems.push({
      category,
      id,
      name: match[2].trim(),
      risk: /^(Badges|Key Items|Unknown \/ Unused)/i.test(category) ? "story-or-unknown" : null,
      codes: [`82003884 ${id}`],
    });
  }
}

const normalized = {
  schemaVersion: 1,
  game: "Pokémon Crystal Advance Redux",
  guideGameVersion: "2026-07-19",
  source: {
    url: "https://www.pokemoncoders.com/pokemon-crystal-advance-redux-cheats/",
    pageUpdated: "2026-07-11",
    wildModifierTestedVersion: "2026-04-05",
    communityMartTestedThrough: "2026-06-25",
    authority: "Community cheat compilation; not official",
    extracted: "2026-07-22",
  },
  warnings: [
    "The source predates the guide's 2026-07-19 game build, so every code is provisional for that build.",
    "The page says its wild modifier was tested on the 2026-04-05 build, but its closing text also says the Pokémon modifier is not working.",
    "Item PC IDs may yield a different item or no item according to the source.",
    "Poké Mart modifiers directly alter memory; enable one at a time and avoid badges, key items, story items and unknown IDs.",
    "The page describes 416 Poké Mart items and later says about 415 mapped entries, but its table exposes 381 rows and 376 unique concrete IDs; the unique published IDs are preserved without inventing missing entries.",
  ],
  fixedCheats,
  modifiers: {
    levelLead: { name: "Wild level modifier lead code", codes: [levelLead.toUpperCase()] },
    levels,
    natureLead: { name: "Wild nature modifier lead code", codes: [natureLead.toUpperCase()] },
    natures,
  },
  wildPokemon,
  pcItems: uniqueBy(pcItems, (row) => row.id),
  martItems: uniqueBy(martItems, (row) => row.id),
};

if (levels.length !== 100) throw new Error(`Expected 100 level codes, found ${levels.length}`);
if (natures.length !== 25) throw new Error(`Expected 25 nature codes, found ${natures.length}`);
if (wildPokemon.length < 400) throw new Error(`Expected at least 400 wild Pokémon codes, found ${wildPokemon.length}`);
if (normalized.martItems.length !== 376) throw new Error(`Expected 376 unique Poké Mart codes from the published table, found ${normalized.martItems.length}`);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  outputPath,
  fixedCheats: fixedCheats.length,
  levels: levels.length,
  natures: natures.length,
  wildPokemon: wildPokemon.length,
  pcItems: normalized.pcItems.length,
  martItems: normalized.martItems.length,
}, null, 2));
