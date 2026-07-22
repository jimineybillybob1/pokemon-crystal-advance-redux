import fs from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2] || "sources/normalized/pokemoncoders-cheats-2026-07-11.json";
const commentAuditPath = process.argv[3] || "sources/normalized/pokemoncoders-comment-audit-2026-07-22.json";
const outputPath = process.argv[4] || "cheats/Pokemon Crystal Advance Redux (2026-07-19).cht";
const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
const commentAudit = JSON.parse(await fs.readFile(commentAuditPath, "utf8"));

if (source.schemaVersion !== 1) throw new Error(`Unsupported cheat source schema: ${source.schemaVersion}`);
if (commentAudit.schemaVersion !== 1) throw new Error(`Unsupported comment-audit schema: ${commentAudit.schemaVersion}`);

function retroArchCode(lines) {
  const tokens = [];
  for (const line of lines) {
    const hex = line.replace(/\s+/g, "").toUpperCase();
    if (!/^[0-9A-F]+$/.test(hex)) throw new Error(`Invalid cheat code: ${line}`);
    if (hex.length === 12) tokens.push(hex.slice(0, 8), hex.slice(8));
    else if (hex.length === 16) tokens.push(hex.slice(0, 8), hex.slice(8));
    else throw new Error(`Unsupported cheat-code length (${hex.length}): ${line}`);
  }
  return tokens.join("+");
}

const cheats = [];
function add(description, codes) {
  cheats.push({ description, code: retroArchCode(codes) });
}

const removedFixedCheatNames = new Set([
  "Shiny encounters (disable before catching to avoid name glitch)",
]);
for (const cheat of source.fixedCheats) {
  if (!removedFixedCheatNames.has(cheat.name)) add(`${cheat.category} | ${cheat.name}`, cheat.codes);
}

add(`Modifier lead | ${source.modifiers.levelLead.name} (enable with exactly one level)`, source.modifiers.levelLead.codes);
for (const entry of source.modifiers.levels) {
  add(`Wild level | Level ${entry.level} (requires level lead)`, entry.codes);
}

add(`Modifier lead | ${source.modifiers.natureLead.name} (enable with exactly one nature)`, source.modifiers.natureLead.codes);
for (const entry of source.modifiers.natures) {
  add(`Wild nature | ${entry.name} (requires nature lead)`, entry.codes);
}

for (const entry of commentAudit.bagModifier.items.filter((item) => !item.excludedFromMain)) {
  add(`Bag slot 2 [comment-confirmed; provisional] | ${entry.category} | ${entry.name} [${entry.id}]`, entry.codes);
}

for (const entry of source.martItems.filter((item) => !item.risk)) {
  add(`Poké Mart | ${entry.category} | ${entry.name} [${entry.id}]`, entry.codes);
}

const uniqueDescriptions = new Set(cheats.map((cheat) => cheat.description));
if (uniqueDescriptions.size !== cheats.length) {
  throw new Error(`Duplicate RetroArch descriptions: ${cheats.length - uniqueDescriptions.size}`);
}

const lines = [`cheats = ${cheats.length}`, ""];
for (const [index, cheat] of cheats.entries()) {
  lines.push(`cheat${index}_desc = ${JSON.stringify(cheat.description)}`);
  lines.push(`cheat${index}_code = ${JSON.stringify(cheat.code)}`);
  lines.push(`cheat${index}_enable = false`);
  lines.push("");
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  outputPath,
  cheats: cheats.length,
  removed: {
    shiny: 1,
    wildPokemon: source.wildPokemon.length,
    oldItemPc: source.pcItems.length,
    unsafePokeMart: source.martItems.filter((item) => item.risk).length,
  },
  added: {
    safeBagItems: commentAudit.bagModifier.items.filter((item) => !item.excludedFromMain).length,
  },
}, null, 2));
