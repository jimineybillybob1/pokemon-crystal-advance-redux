import fs from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || "sources/normalized/pokemoncoders-comment-audit-2026-07-22.json";

if (!inputPath) {
  throw new Error("Usage: node scripts/import-pokemoncoders-comments.mjs <extracted-comments.json> [output.json]");
}

const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
const comments = new Map(source.comments.map((comment) => [comment.id, comment]));

function requireComment(id) {
  const comment = comments.get(id);
  if (!comment) throw new Error(`Missing expected comment ${id}`);
  return comment;
}

const testedItemTable = requireComment("61718");
const bagItems = [];
for (const line of testedItemTable.text.split(/\r?\n/)) {
  const match = line.match(/^([0-9A-F]{4})\t([^\t]+)\t([^\t]+)(?:\t(.*))?$/i);
  if (!match) continue;
  const category = match[3].trim();
  const id = match[1].toUpperCase();
  const excludedFromMain = ["Key Item", "Story Item", "Unknown"].includes(category);
  bagItems.push({
    id,
    name: match[2].trim(),
    category,
    notes: match[4]?.trim() || null,
    excludedFromMain,
    evidenceComments: ["61718"],
    codes: [`820257C4 ${id}`],
  });
}

const testedItemTableRows = bagItems.length;

const mintComment = requireComment("62377");
const mintPairs = [];
for (const line of mintComment.text.split(/\r?\n/)) {
  const match = line.match(/^(.+?)\t([0-9A-F]{4})$/i);
  if (match) mintPairs.push({ name: match[1].trim(), id: match[2].toUpperCase() });
}

for (const mint of mintPairs) {
  const item = bagItems.find((entry) => entry.id === mint.id);
  if (item) {
    if (item.name.toLowerCase() !== mint.name.toLowerCase()) {
      item.notes = `Later hack-specific mint mapping overrides the older table entry ${item.name}.`;
    }
    item.name = mint.name;
    item.category = "Mint";
    item.excludedFromMain = false;
    item.evidenceComments.push("62377");
  } else {
    bagItems.push({
      id: mint.id,
      name: mint.name,
      category: "Mint",
      notes: "Added by the later hack-specific mint confirmation.",
      excludedFromMain: false,
      evidenceComments: ["62377"],
      codes: [`820257C4 ${mint.id}`],
    });
  }
}

const audit = {
  schemaVersion: 1,
  game: "Pokémon Crystal Advance Redux",
  guideGameVersion: "2026-07-19",
  source: {
    url: "https://www.pokemoncoders.com/pokemon-crystal-advance-redux-cheats/#comments",
    reviewed: "2026-07-22",
    visibleThreadHeading: source.heading,
    visibleComments: source.comments.length,
    authority: "Public reader comments; lower authority than the maintained article and official hack sources",
  },
  decisions: [
    {
      id: "replace-item-pc-modifier",
      action: "replace",
      oldCode: "82025840 YYYY",
      newCode: "820257C4 AAAA",
      outcome: "Generate bag slot 2 item choices from the 343-row tested comment table plus the later mint corrections/additions; exclude key, story and unknown entries from the main file.",
      evidenceComments: ["61718", "62161", "62197", "62390", "58190", "63319"],
      confidence: "medium",
      reason: "Three replies report the replacement address working; an older report says the result appears in bag slot 2 with quantity 99. The newest complaint checked the PC, which is consistent with the replacement being a bag modifier rather than a PC modifier.",
    },
    {
      id: "remove-wild-modifier",
      action: "remove-from-main",
      code: "8202404C AAAA",
      outcome: "Remove all 463 concrete wild encounter choices from the main RetroArch file.",
      evidenceComments: ["62160", "62194", "62854"],
      confidence: "high",
      reason: "The code was reported working on the April 2 build, but a newer May report says it produces Bad Eggs and the article's closing text says Pokémon modifiers are not working.",
    },
    {
      id: "remove-shiny-modifier",
      action: "remove-from-main",
      code: "1670047D 04815C68 / 18452A7D DDE55BCC",
      outcome: "Remove the shiny encounter entry from the main RetroArch file.",
      evidenceComments: ["62514", "62869", "62870", "62876"],
      confidence: "high",
      reason: "Two users report failure on recent 2026 builds, including a direct newest-update retry after the site maintainer suggested the published code.",
    },
    {
      id: "reject-obsolete-or-unverified-codes",
      action: "do-not-add",
      outcome: "Do not add the vague Pokémon code, March 2025 starter/gift modifier or March 2025 wild modifier sequences.",
      evidenceComments: ["58464", "56625", "57685", "56623", "58403", "60075"],
      confidence: "high",
      reason: "The suggestions are vague, explicitly unverified, reported not working, or only claimed for the March 2025 build.",
    },
    {
      id: "retain-pokemart-table-with-safety-filter",
      action: "retain-safe-only",
      outcome: "Keep the later June 25 Poké Mart table, but omit badges, key/story items and unknown/unused entries from the main file.",
      evidenceComments: ["63115", "63251", "63319"],
      confidence: "medium",
      reason: "The June table was promoted into the article and described as tested; its own warning advises avoiding story/key items. The newest PC complaint does not test the Poké Mart address.",
    },
  ],
  bagModifier: {
    code: "820257C4",
    destination: "Bag slot 2 (reported as quantity 99)",
    evidenceComments: ["62161", "62197", "62390", "58190"],
    items: bagItems,
  },
  mintConfirmation: {
    evidenceComment: "62377",
    items: mintPairs,
  },
  commentEvidence: source.comments.map((comment) => ({
    id: comment.id,
    author: comment.author,
    dateText: comment.dateText,
    url: comment.url,
  })),
};

if (source.comments.length !== 34) throw new Error(`Expected 34 visible comments, found ${source.comments.length}`);
if (testedItemTableRows !== 343) throw new Error(`Expected 343 tested item-table rows, found ${testedItemTableRows}`);
if (bagItems.length !== 354) throw new Error(`Expected 354 merged bag-item choices, found ${bagItems.length}`);
if (new Set(bagItems.map((item) => item.id)).size !== bagItems.length) throw new Error("Duplicate IDs in tested item table");
if (bagItems.filter((item) => !item.excludedFromMain).length !== 306) throw new Error("Unexpected safe bag-item count");
if (mintPairs.length !== 21) throw new Error(`Expected 21 mint confirmations, found ${mintPairs.length}`);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  outputPath,
  comments: source.comments.length,
  testedItemTableRows,
  mergedBagItems: bagItems.length,
  mainBagItems: bagItems.filter((item) => !item.excludedFromMain).length,
  excludedBagItems: bagItems.filter((item) => item.excludedFromMain).length,
  mintConfirmations: mintPairs.length,
}, null, 2));
