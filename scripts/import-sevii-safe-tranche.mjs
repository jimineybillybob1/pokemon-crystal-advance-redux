import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const paths = {
  extraction: path.join(root, "sources", "reports", "sevii-rom-extraction.json"),
  crosswalk: path.join(root, "sources", "normalized", "sevii-map-crosswalk-2026-09-25.json"),
  guideOverride: path.join(root, "data", "overrides", "guide-data.json"),
  itemOverride: path.join(root, "data", "overrides", "items-data.json"),
  guideFinal: path.join(root, "data", "guide-data.json"),
  report: path.join(root, "sources", "reports", "sevii-safe-import-report.json"),
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const extraction = readJson(paths.extraction);
const crosswalk = readJson(paths.crosswalk);
const guideOverride = readJson(paths.guideOverride);
const itemOverride = readJson(paths.itemOverride);
const guideFinal = readJson(paths.guideFinal);

const expectedHash = "716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B";
if (extraction.meta.romSha256 !== expectedHash || crosswalk.meta.romSha256 !== expectedHash) {
  throw new Error("Sevii extraction/crosswalk does not match the approved 2026-07-19 ROM hash.");
}

const readyMaps = new Map(
  crosswalk.maps
    .filter((map) => map.mapStatus === "ready")
    .map((map) => [map.mapKey, map]),
);

const pokemonByAlias = new Map();
for (const pokemon of guideFinal.pokemon) {
  pokemonByAlias.set(normalize(pokemon.key), pokemon);
  pokemonByAlias.set(normalize(pokemon.name), pokemon);
  if (pokemon.displayName) pokemonByAlias.set(normalize(pokemon.displayName), pokemon);
}

const unresolvedPokemon = [];
const skippedMethods = [];
const skippedAlternateGroups = [];
const removedExactDuplicateTables = [];
const acceptedTables = [];
const encounterGroups = Map.groupBy(
  extraction.wildEncounters.filter((record) => readyMaps.has(record.mapKey)),
  (record) => `${record.mapKey}|${record.sourceField}`,
);

for (const [groupKey, records] of encounterGroups) {
  if (records.some((record) => record.method === "Tree/Rock ROM slot")) {
    skippedMethods.push({ groupKey, reason: "Tree-versus-Rock semantics unresolved", recordIndexes: records.map((record) => record.encounterRecordIndex) });
    continue;
  }
  const nonzero = records.filter((record) => record.encounterRate > 0);
  if (!nonzero.length) {
    skippedMethods.push({ groupKey, reason: "Zero encounter-rate placeholder", recordIndexes: records.map((record) => record.encounterRecordIndex) });
    continue;
  }

  const bySignature = Map.groupBy(nonzero, (record) => JSON.stringify({
    encounterRate: record.encounterRate,
    entries: record.entries.map(({ probability, rod, minLevel, maxLevel, speciesId, pokemon }) => ({ probability, rod, minLevel, maxLevel, speciesId, pokemon })),
  }));
  if (bySignature.size > 1) {
    skippedAlternateGroups.push({
      groupKey,
      reason: "More than one distinct runtime table exists for this map and method",
      recordIndexes: nonzero.map((record) => record.encounterRecordIndex),
    });
    continue;
  }

  const [selected, ...duplicates] = [...nonzero].sort((left, right) => left.encounterRecordIndex - right.encounterRecordIndex);
  if (duplicates.length) {
    removedExactDuplicateTables.push({
      groupKey,
      keptRecordIndex: selected.encounterRecordIndex,
      duplicateRecordIndexes: duplicates.map((record) => record.encounterRecordIndex),
    });
  }
  acceptedTables.push(selected);
}

const encounterRowsByLocation = new Map();
for (const table of acceptedTables) {
  const map = readyMaps.get(table.mapKey);
  if (!encounterRowsByLocation.has(map.parentLocation)) encounterRowsByLocation.set(map.parentLocation, []);
  const rows = encounterRowsByLocation.get(map.parentLocation);
  for (const entry of table.entries) {
    const pokemon = pokemonByAlias.get(normalize(entry.pokemon));
    if (!pokemon) {
      unresolvedPokemon.push({ mapKey: table.mapKey, speciesId: entry.speciesId, pokemon: entry.pokemon });
      continue;
    }
    rows.push({
      pokemon: pokemon.key,
      method: table.method,
      level: entry.minLevel === entry.maxLevel ? String(entry.minLevel) : `${entry.minLevel}-${entry.maxLevel}`,
      rarity: entry.probability,
      subarea: map.proposedSubarea,
      ...(entry.rod ? { rod: entry.rod } : {}),
      details: `${entry.probability}% slot; ${table.encounterRate}% encounter rate`,
      encounterRate: table.encounterRate,
      period: "all-day",
      source: {
        kind: "rom-audit",
        gameVersion: extraction.meta.gameVersion,
        mapKey: table.mapKey,
        encounterRecordIndex: table.encounterRecordIndex,
        slot: entry.slot,
      },
    });
  }
}

if (unresolvedPokemon.length) {
  throw new Error(`Safe Sevii import has ${unresolvedPokemon.length} unresolved Pokémon; see the generated report after resolving them.`);
}

const encounterIdentity = (entry) => JSON.stringify([
  entry.pokemon,
  entry.method,
  entry.level,
  entry.rarity,
  entry.subarea || "",
  entry.rod || "",
  entry.period || "",
]);
const naturalSubareaOrder = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const methodOrder = new Map(["Wild", "Tree", "Rock", "Surf", "Fish", "Dive"].map((method, index) => [method, index]));

guideOverride.locations = guideOverride.locations.filter((location) => location.source?.kind !== "sevii-rom-safe-tranche");
const importedLocations = [];
for (const [locationName, rawRows] of encounterRowsByLocation) {
  const uniqueRows = [...new Map(rawRows.map((row) => [encounterIdentity(row), row])).values()]
    .sort((left, right) =>
      naturalSubareaOrder.compare(left.subarea || "", right.subarea || "")
      || (methodOrder.get(left.method) ?? 99) - (methodOrder.get(right.method) ?? 99)
      || (left.source.slot ?? 0) - (right.source.slot ?? 0));
  const location = {
    name: locationName,
    day: uniqueRows,
    night: structuredClone(uniqueRows),
    periodModel: "all-day",
    source: {
      kind: "sevii-rom-safe-tranche",
      gameVersion: extraction.meta.gameVersion,
      romSha256: extraction.meta.romSha256,
      mapKeys: [...new Set(uniqueRows.map((row) => row.source.mapKey))],
      crosswalk: "sources/normalized/sevii-map-crosswalk-2026-09-25.json",
    },
  };
  guideOverride.locations.push(location);
  importedLocations.push({
    name: locationName,
    encounterCount: uniqueRows.length,
    subareas: [...new Set(uniqueRows.map((row) => row.subarea))],
    mapKeys: location.source.mapKeys,
  });
}

guideOverride.meta.source = "Crystal Advance Redux community workbook (data current through 2026-07-01), official developer changelog through 2026-07-19, and version-matched 2026-07-19 ROM audit";
guideOverride.meta.limitations = guideOverride.meta.limitations.filter((note) =>
  !note.startsWith("Post-2026-07-01 Sevii encounter")
  && !note.startsWith("ROM-derived Sevii coverage currently includes only"));
const safeTrancheNote = "ROM-derived Sevii coverage currently includes only map-stable Wild, Surf and Fish encounter tables plus standard/hidden item placements; Tree/Rock, alternate tables, Dive interpretation and trainer stages remain gated.";
if (!guideOverride.meta.limitations.includes(safeTrancheNote)) guideOverride.meta.limitations.push(safeTrancheNote);

const itemNameAliases = new Map([
  [normalize("TM26"), normalize("TM26 - Earthquake")],
  // ROM item name table uses the long Technical Disk label; the workbook
  // records the same numbered item with its taught move.
  [normalize("Tech Disk 22"), normalize("TD22 - Frost Breath")],
]);
const itemByAlias = new Map();
for (const item of itemOverride) {
  itemByAlias.set(normalize(item.name), item);
  if (item.key) itemByAlias.set(normalize(item.key), item);
}
const itemMarker = "Source: 2026-07-19 ROM audit";
for (const item of itemOverride) item.locations = (item.locations || []).filter((location) => !location.includes(itemMarker));

const itemPlacements = [
  ...extraction.hiddenItems
    .filter((entry) => readyMaps.has(entry.mapKey) && entry.coordinateValid)
    .map((entry) => ({ ...entry, placement: "hidden item" })),
  ...extraction.visibleItems
    .filter((entry) => readyMaps.has(entry.mapKey) && entry.coordinateValid)
    .map((entry) => ({ ...entry, placement: "item ball" })),
];
const importedItemPlacements = [];
const unresolvedItems = [];
for (const placement of itemPlacements) {
  const requested = itemNameAliases.get(normalize(placement.item)) || normalize(placement.item);
  const item = itemByAlias.get(requested);
  if (!item) {
    unresolvedItems.push({ mapKey: placement.mapKey, itemId: placement.itemId, item: placement.item });
    continue;
  }
  const map = readyMaps.get(placement.mapKey);
  const quantity = placement.quantity > 1 ? ` ×${placement.quantity}` : "";
  const location = `${map.parentLocation} — ${map.proposedSubarea}, ${placement.placement} at tile (${placement.x}, ${placement.y})${quantity}; ${itemMarker}`;
  if (!item.locations.includes(location)) item.locations.push(location);
  importedItemPlacements.push({ item: item.name, mapKey: placement.mapKey, location });
}

if (unresolvedItems.length) {
  throw new Error(`Safe Sevii import has ${unresolvedItems.length} unresolved items; resolve them before writing overrides.`);
}

const report = {
  meta: {
    generatedAt: new Date().toISOString(),
    gameVersion: extraction.meta.gameVersion,
    romSha256: extraction.meta.romSha256,
    source: "sources/reports/sevii-rom-extraction.json",
    crosswalk: "sources/normalized/sevii-map-crosswalk-2026-09-25.json",
  },
  summary: {
    readyMapCount: readyMaps.size,
    acceptedEncounterTableCount: acceptedTables.length,
    importedLocationCount: importedLocations.length,
    importedEncounterCount: importedLocations.reduce((sum, location) => sum + location.encounterCount, 0),
    importedItemPlacementCount: importedItemPlacements.length,
    removedExactDuplicateTableCount: removedExactDuplicateTables.length,
    skippedUnresolvedMethodGroupCount: skippedMethods.length,
    skippedAlternateTableGroupCount: skippedAlternateGroups.length,
    trainerBattleImportCount: 0,
  },
  importedLocations,
  importedItemPlacements,
  acceptedEncounterTables: acceptedTables.map((table) => ({
    mapKey: table.mapKey,
    encounterRecordIndex: table.encounterRecordIndex,
    method: table.method,
    encounterRate: table.encounterRate,
  })),
  removedExactDuplicateTables,
  skippedMethods,
  skippedAlternateGroups,
  unresolvedPokemon,
  unresolvedItems,
  exclusions: [
    "All trainer battles remain excluded pending battle-stage semantics.",
    "Tree/Rock ROM slots remain excluded pending interaction-method semantics.",
    "Distinct repeated tables remain excluded pending runtime selector semantics.",
    "Only maps marked ready in the normalized crosswalk are eligible.",
  ],
};

// The workbook importer intentionally serializes every BST as a Python float.
// Preserve that established representation so this focused import does not
// create hundreds of formatting-only changes.
const serializedGuideOverride = JSON.stringify(guideOverride, null, 2)
  .replace(/^(\s+"bst": )(-?\d+)(,?)$/gm, "$1$2.0$3");
fs.writeFileSync(paths.guideOverride, `${serializedGuideOverride}\n`);
fs.writeFileSync(paths.itemOverride, `${JSON.stringify(itemOverride, null, 2)}\n`);
fs.writeFileSync(paths.report, `${JSON.stringify(report, null, 2)}\n`);

console.log(paths.report);
console.log(JSON.stringify(report.summary, null, 2));
