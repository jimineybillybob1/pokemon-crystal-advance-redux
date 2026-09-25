import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const extractionPath = path.join(root, "sources", "reports", "sevii-rom-extraction.json");
const outputPath = path.join(root, "sources", "normalized", "sevii-map-crosswalk-2026-09-25.json");

const extraction = JSON.parse(fs.readFileSync(extractionPath, "utf8"));

const labels = {
  "1,0": ["Main area", "high"],
  "1,36": ["Cave room 1", "provisional"],
  "1,37": ["Main path", "high"],
  "1,38": ["Cave room 2", "provisional"],
  "1,39": ["Cave 1F", "high"],
  "1,40": ["Cave 2F", "high"],
  "1,41": ["Cave 3F", "high"],
  "1,75": ["Battle Room 1", "high"],
  "1,76": ["Battle Room 2", "high"],
  "1,77": ["Battle Room 3", "high"],
  "1,78": ["Battle Room 4", "high"],
  "1,79": ["Memorial interior 1", "provisional"],
  "1,80": ["Memorial interior 2", "provisional"],
  "1,137": ["Memorial interior 3", "provisional"],
  "1,138": ["Memorial interior 4", "provisional"],
  "2,120": ["Memorial interior 5", "provisional"],
  "2,47": ["Cavern area 1", "high"],
  "2,48": ["Cavern area 2", "high"],
  "2,49": ["Cavern area 3", "high"],
  "3,50": ["Exterior", "high"],
  "3,74": ["Eastern area", "high"],
  "3,113": ["Western area", "high"],
  "4,79": ["Ruins Cavern", "high"],
  "4,105": ["Area 1", "high"],
  "4,106": ["Area 2", "high"],
  "4,107": ["Area 3", "high"],
  "4,108": ["Area 4", "high"],
  "4,109": ["Area 5", "high"],
  "4,113": ["Main area", "high"],
  "15,0": ["Building interior", "high"],
  "14,13": ["Interior 1F", "high"],
  "14,14": ["Interior 2F", "high"],
  "14,15": ["Interior 3F", "high"],
};

const regionRules = {
  "Berry Forest": "ready",
  "Cape Brink": "ready",
  "Crystal Cavern": "needs-review",
  "Four Island": "ready",
  "Memorial Pillar": "ready",
  "Three Island": "ready",
};

const reviewedReadyNotes = new Map([
  ["1,0", "Reviewed Sevii Waterway main area: the direct ROM label and single coherent outdoor layout support the neutral label."],
  ["2,47", "Reviewed Crystal Cavern interior cluster: sequential layouts and reciprocal internal warps support the neutral area label."],
  ["2,48", "Reviewed Crystal Cavern interior cluster: sequential layouts and reciprocal internal warps support the neutral area label."],
  ["2,49", "Reviewed Crystal Cavern interior cluster: sequential layouts and reciprocal internal warps support the neutral area label."],
  ["3,74", "Reviewed Six Island outdoor cluster: the direct ROM label, visible grass/water terrain and reciprocal east/west connection support the neutral directional label."],
  ["3,113", "Reviewed Six Island outdoor cluster: the reciprocal east/west connection, visible grass/water terrain and shared encounter table support the neutral directional label."],
  ["4,79", "Reviewed Ruins Cavern: the cave layout, reciprocal link to the outdoor Ruins Valley map and developer changelog establish the interior label."],
  ["4,113", "Reviewed Ruins Valley main area: the outdoor layout, direct ROM label and reciprocal Ruins Cavern links support the neutral main-area label."],
]);

const reviewedHoldNotes = new Map([
  ["1,81", "Held after review: cave-flagged layout warps into maps labelled Radio Tower and Union Cave, so the Resort Gorgeous runtime identity is not established."],
  ["1,82", "Held after review: cave-flagged layout and mixed self/external warps do not establish a trustworthy Resort Gorgeous subarea."],
  ["3,75", "Held after review: snowy layout warps into maps labelled Ice Path and Ruins of Alph, so its playable Five Island identity remains unresolved."],
  ["3,112", "Held after review: snowy layout warps into Seafoam Islands and cannot yet be assigned a trustworthy Five Island subarea."],
  ["5,75", "Held after review: snowy layout warps into Safari Zone, Celadon Dept. and Route 45 maps, so its playable Five Island identity remains unresolved."],
  ["5,78", "Held after review: snowy layout warps into Goldenrod Dept. and cannot yet be assigned a trustworthy Five Island subarea."],
  ["15,0", "Held after review: the building interior has no visible encounter terrain, yet the ROM header contains Wild, Surf and Fish tables; treat those tables as placeholders until runtime-tested."],
]);

const countsByMap = new Map(extraction.maps.map((map) => [map.key, {
  wildMethods: 0,
  battleCommands: 0,
  hiddenItems: 0,
  visibleItemCandidates: 0,
}]));

for (const record of extraction.wildEncounters) countsByMap.get(record.mapKey).wildMethods += 1;
for (const record of extraction.trainerBattles) countsByMap.get(record.mapKey).battleCommands += 1;
for (const record of extraction.hiddenItems) countsByMap.get(record.mapKey).hiddenItems += 1;
for (const record of extraction.visibleItems) countsByMap.get(record.mapKey).visibleItemCandidates += 1;

const maps = extraction.maps.map((map) => {
  const counts = countsByMap.get(map.key);
  const activeRecordCount = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const malformed = map.width <= 0 || map.height <= 0 || map.width > 512 || map.height > 512;
  const ambiguousParent = map.regionName === "Unresolved Sevii-linked map";
  const proposed = labels[map.key];
  const subarea = proposed?.[0] ?? (extraction.maps.filter((candidate) => candidate.regionName === map.regionName).length === 1
    ? "Main area"
    : `Map ${map.key}`);
  const subareaConfidence = proposed?.[1] ?? (activeRecordCount === 0 ? "reference-only" : "unreviewed");

  let mapStatus = regionRules[map.regionName] ?? "needs-review";
  if (malformed) mapStatus = "exclude-malformed";
  else if (activeRecordCount === 0) mapStatus = "reference-only";
  else if (ambiguousParent) mapStatus = "needs-parent-review";
  else if (reviewedReadyNotes.has(map.key)) mapStatus = "ready";
  else if (!map.directSeviiLabel) mapStatus = "needs-linked-map-review";
  else if (mapStatus === "ready" && subareaConfidence !== "high") mapStatus = "needs-subarea-review";

  const notes = [];
  if (!map.directSeviiLabel) notes.push("Parent location is inferred from a reciprocal one-step ROM link.");
  if (ambiguousParent) notes.push(`Possible parents: ${map.inferredRegions.join(", ")}.`);
  if (malformed) notes.push("Map header/layout dimensions are invalid and this record must not be imported.");
  if (subarea.startsWith("Map ")) notes.push("User-facing subarea name has not yet been established.");
  if (map.regionName === "Mt. Ember" && activeRecordCount > 0) {
    notes.push("Rendered layout resembles reused ship/room maps; verify in-game reachability before importing battles.");
  }
  if (reviewedReadyNotes.has(map.key)) notes.push(reviewedReadyNotes.get(map.key));
  if (reviewedHoldNotes.has(map.key)) notes.push(reviewedHoldNotes.get(map.key));

  return {
    mapKey: map.key,
    parentLocation: ambiguousParent ? null : map.regionName,
    romRegionName: map.romRegionName || null,
    inferredRegions: map.inferredRegions,
    directSeviiLabel: map.directSeviiLabel,
    graphDistance: map.graphDistance,
    layoutId: map.layoutId,
    dimensions: { width: map.width, height: map.height },
    proposedSubarea: subarea,
    subareaConfidence,
    mapStatus,
    counts,
    notes,
  };
});

const statusCounts = Object.fromEntries(
  Object.entries(Object.groupBy(maps, (map) => map.mapStatus))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, entries]) => [status, entries.length]),
);

const result = {
  meta: {
    gameVersion: extraction.meta.gameVersion,
    romSha256: extraction.meta.romSha256,
    generatedAt: new Date().toISOString(),
    purpose: "Reviewable map/subarea boundary between ROM extraction and guide overrides.",
    rules: [
      "A direct ROM region label confirms the parent location but not a user-facing floor/subarea name.",
      "Only blank-labelled maps with a reciprocal one-step link are retained as linked candidates.",
      "Generic Map bank,map labels preserve uniqueness without inventing a subarea name.",
      "A ready map has a stable parent/subarea label; encounter variants and battle semantics remain separate import gates.",
      "A linked map may become ready after a documented topology review establishes a stable parent and neutral subarea label.",
    ],
  },
  summary: {
    mapCount: maps.length,
    statusCounts,
  },
  maps,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(outputPath);
console.log(JSON.stringify(result.summary, null, 2));
