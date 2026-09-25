import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const paths = {
  extraction: path.join(root, "sources", "reports", "sevii-rom-extraction.json"),
  crosswalk: path.join(root, "sources", "normalized", "sevii-map-crosswalk-2026-09-25.json"),
  guide: path.join(root, "data", "guide-data.json"),
  battles: path.join(root, "data", "battle-data.json"),
  report: path.join(root, "sources", "reports", "sevii-safe-trainer-import-report.json"),
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const normalize = (value) => String(value ?? "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "");
const slug = (value) => String(value ?? "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const extraction = readJson(paths.extraction);
const crosswalk = readJson(paths.crosswalk);
const guide = readJson(paths.guide);
const battleData = readJson(paths.battles);

const expectedHash = "716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B";
if (extraction.meta.romSha256 !== expectedHash || crosswalk.meta.romSha256 !== expectedHash) {
  throw new Error("Sevii extraction/crosswalk does not match the approved 2026-07-19 ROM hash.");
}

// These are the reviewed maps whose user-facing location/subarea labels and
// regular trainer semantics are unambiguous. Memorial Pillar is deliberately
// excluded because its two Elite Four stages still need script-condition proof.
const reviewedMapKeys = new Set(["1,0", "1,40", "2,48", "2,49", "4,106", "4,107", "4,108"]);
const maps = new Map(crosswalk.maps.map((entry) => [entry.mapKey, entry]));
for (const mapKey of reviewedMapKeys) {
  if (maps.get(mapKey)?.mapStatus !== "ready") {
    throw new Error(`Reviewed trainer map ${mapKey} is not marked ready in the crosswalk.`);
  }
}

const pokemonByAlias = new Map();
for (const pokemon of guide.pokemon) {
  for (const alias of [pokemon.key, pokemon.name, pokemon.displayName, pokemon.sourceKey]) {
    if (alias) pokemonByAlias.set(normalize(alias), pokemon);
  }
}
const moveNames = new Set(guide.moves.map((move) => normalize(move.name)));

const candidates = extraction.trainerBattles.filter((battle) =>
  reviewedMapKeys.has(battle.mapKey)
  && battle.coordinateValid
  && battle.trainer?.valid
  && [0, 5].includes(battle.battleType));

// Recursive script traversal can reach the same trainerbattle command through
// both the initial (type 0) and rematch-capable (type 5) paths. Identity here is
// the map object plus trainer record, not the script path used to reach it.
const groups = Map.groupBy(candidates, (battle) => [
  battle.mapKey,
  battle.x,
  battle.y,
  battle.trainer.id,
].join("|"));

const selected = [];
const collapsedDuplicates = [];
for (const [identity, records] of groups) {
  const signatures = new Set(records.map((battle) => JSON.stringify({
    trainer: battle.trainer.id,
    party: battle.trainer.party,
  })));
  if (signatures.size !== 1) {
    throw new Error(`Trainer identity ${identity} resolves to multiple distinct teams.`);
  }
  const sorted = [...records].sort((left, right) =>
    Number(left.battleType !== 0) - Number(right.battleType !== 0)
    || left.commandAddress.localeCompare(right.commandAddress));
  selected.push(sorted[0]);
  if (sorted.length > 1) {
    collapsedDuplicates.push({
      identity,
      keptCommandAddress: sorted[0].commandAddress,
      duplicateCommandAddresses: sorted.slice(1).map((record) => record.commandAddress),
      battleTypesSeen: [...new Set(sorted.map((record) => record.battleType))].sort(),
    });
  }
}

const unresolvedPokemon = [];
const unresolvedMoves = [];
for (const battle of selected) {
  for (const member of battle.trainer.party) {
    if (!pokemonByAlias.has(normalize(member.pokemon))) {
      unresolvedPokemon.push({ trainerId: battle.trainer.id, speciesId: member.speciesId, pokemon: member.pokemon });
    }
    for (const move of member.moves || []) {
      if (!moveNames.has(normalize(move.name))) {
        unresolvedMoves.push({ trainerId: battle.trainer.id, moveId: move.id, move: move.name });
      }
    }
  }
}
if (unresolvedPokemon.length || unresolvedMoves.length) {
  throw new Error(`Safe trainer import has ${unresolvedPokemon.length} unresolved Pokémon and ${unresolvedMoves.length} unresolved moves.`);
}

const importedBattles = selected.map((record) => {
  const map = maps.get(record.mapKey);
  const levels = record.trainer.party.map((member) => member.level);
  return {
    id: `sevii-rom-${record.mapKey.replace(",", "-")}-${record.x}-${record.y}-${slug(record.trainer.name)}-${record.trainer.id}`,
    mode: "default",
    category: "Trainer Battle",
    trainer: record.trainer.name,
    trainerClass: record.trainer.className,
    boss: false,
    rival: false,
    location: map.parentLocation,
    subarea: map.proposedSubarea,
    rematch: false,
    team: record.trainer.party.map((member) => ({
      name: pokemonByAlias.get(normalize(member.pokemon)).key,
      level: member.level,
      ability: "",
      item: member.heldItem || "",
      nature: "",
      moves: (member.moves || []).map((move) => move.name),
    })),
    notes: [`${record.trainer.className} · ROM-derived regular trainer battle`],
    doubleBattle: record.trainer.isDoubleBattle,
    source: {
      kind: "rom-audit",
      scope: "sevii-safe-trainer-tranche",
      gameVersion: extraction.meta.gameVersion,
      romSha256: extraction.meta.romSha256,
      mapKey: record.mapKey,
      x: record.x,
      y: record.y,
      objectId: record.objectId,
      objectFlag: record.objectFlag,
      objectScriptAddress: record.objectScriptAddress,
      commandAddresses: recordsFor(record, groups).map((entry) => entry.commandAddress),
      trainerId: record.trainer.id,
      partyAddress: record.trainer.partyAddress,
      structType: record.trainer.structType,
    },
    levelMin: Math.min(...levels),
    levelMax: Math.max(...levels),
  };
});

function recordsFor(record, groupedRecords) {
  return groupedRecords.get([record.mapKey, record.x, record.y, record.trainer.id].join("|")) || [record];
}

const locationOrder = new Map(crosswalk.maps
  .filter((entry) => entry.mapStatus === "ready")
  .map((entry, index) => [entry.mapKey, index]));
importedBattles.sort((left, right) => {
  const leftOrder = locationOrder.get(left.source.mapKey) ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = locationOrder.get(right.source.mapKey) ?? Number.MAX_SAFE_INTEGER;
  return leftOrder - rightOrder || left.source.y - right.source.y || left.source.x - right.source.x;
});

battleData.battles = battleData.battles.filter((battle) => battle.source?.scope !== "sevii-safe-trainer-tranche");
battleData.battles.push(...importedBattles);
battleData.meta.version = extraction.meta.gameVersion;
battleData.meta.title = "Crystal Advance Redux documented trainer data";
battleData.meta.sourceNote = "Trainer battles combine the community workbook with a conservative 2026-07-19 ROM audit. Workbook inheritance and intentionally hidden Gym Leader teams remain explicit; ROM-derived Sevii battles are limited to reviewed maps and regular trainer teams.";
battleData.meta.limitations = battleData.meta.limitations.filter((note) => note !== "Post-2026-07-01 Sevii trainer data is absent.");
const limitation = "ROM-derived Sevii rematch stages and Memorial Pillar Elite Four variants remain excluded until their script conditions can be verified.";
if (!battleData.meta.limitations.includes(limitation)) battleData.meta.limitations.push(limitation);

const report = {
  meta: {
    generatedAt: new Date().toISOString(),
    gameVersion: extraction.meta.gameVersion,
    romSha256: extraction.meta.romSha256,
    source: "sources/reports/sevii-rom-extraction.json",
    crosswalk: "sources/normalized/sevii-map-crosswalk-2026-09-25.json",
  },
  summary: {
    reviewedMapCount: reviewedMapKeys.size,
    candidateCommandCount: candidates.length,
    importedBattleCount: importedBattles.length,
    collapsedDuplicateCommandCount: collapsedDuplicates.reduce((sum, entry) => sum + entry.duplicateCommandAddresses.length, 0),
    unresolvedPokemonCount: unresolvedPokemon.length,
    unresolvedMoveCount: unresolvedMoves.length,
  },
  importedBattles: importedBattles.map((battle) => ({
    id: battle.id,
    trainer: battle.trainer,
    trainerClass: battle.trainerClass,
    location: battle.location,
    subarea: battle.subarea,
    mapKey: battle.source.mapKey,
    coordinates: [battle.source.x, battle.source.y],
    trainerId: battle.source.trainerId,
    team: battle.team.map((member) => ({ name: member.name, level: member.level })),
  })),
  collapsedDuplicates,
  unresolvedPokemon,
  unresolvedMoves,
  exclusions: [
    "Trainer commands outside the reviewed map allowlist are excluded.",
    "Memorial Pillar Elite Four variants are excluded pending script-condition proof.",
    "Type 9 special/can-lose battles are excluded.",
    "Type 5 commands are not interpreted as distinct rematch teams when they resolve to the same trainer record as type 0.",
    "Staged rematches remain unresolved because this ROM does not expose HexManiac's stock data.trainers.rematches anchor.",
  ],
};

fs.writeFileSync(paths.battles, `${JSON.stringify(battleData, null, 2)}\n`);
fs.writeFileSync(paths.report, `${JSON.stringify(report, null, 2)}\n`);
console.log(paths.report);
console.log(JSON.stringify(report.summary, null, 2));
