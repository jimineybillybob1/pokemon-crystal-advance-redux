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
  "1,1": ["Cavern area 1", "high"],
  "1,2": ["Cavern area 2", "high"],
  "1,3": ["Cavern area 3", "high"],
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
  "3,51": ["Outdoor area", "high"],
  "3,68": ["Main area", "high"],
  "3,69": ["Eastern area", "high"],
  "3,74": ["Eastern area", "high"],
  "3,78": ["Northern area", "high"],
  "3,113": ["Western area", "high"],
  "4,8": ["Cavern", "high"],
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
  ["1,1", "Reviewed One Island cluster: the direct ROM label, rendered cavern and reciprocal links support the neutral first-cavern label."],
  ["1,2", "Reviewed One Island cluster: the reciprocal link to the labelled cavern and rendered self-contained chamber support the neutral second-cavern label."],
  ["1,3", "Reviewed One Island cluster: the direct ROM label, rendered cavern and reciprocal link to the first cavern support the neutral third-cavern label."],
  ["2,47", "Reviewed Crystal Cavern interior cluster: sequential layouts and reciprocal internal warps support the neutral area label."],
  ["2,48", "Reviewed Crystal Cavern interior cluster: sequential layouts and reciprocal internal warps support the neutral area label."],
  ["2,49", "Reviewed Crystal Cavern interior cluster: sequential layouts and reciprocal internal warps support the neutral area label."],
  ["3,51", "Reviewed One Island cluster: the rendered outdoor route and reciprocal cave entrance to map 1,1 support the neutral outdoor-area label."],
  ["3,74", "Reviewed Six Island outdoor cluster: the direct ROM label, visible grass/water terrain and reciprocal east/west connection support the neutral directional label."],
  ["3,113", "Reviewed Six Island outdoor cluster: the reciprocal east/west connection, visible grass/water terrain and shared encounter table support the neutral directional label."],
  ["3,68", "Reviewed Icefall Cave cluster: the direct ROM label, rendered waterway and reciprocal links support the neutral main-area label."],
  ["3,69", "Reviewed Icefall Cave cluster: reciprocal links to the main and northern maps support the neutral eastern-area label."],
  ["3,78", "Reviewed Icefall Cave cluster: the direct ROM label and reciprocal north/south connection support the neutral northern-area label."],
  ["4,8", "Reviewed Icefall Cave cluster: the rendered cavern and reciprocal doorway links to the main map establish the interior label."],
  ["4,79", "Reviewed Ruins Cavern: the cave layout, reciprocal link to the outdoor Ruins Valley map and developer changelog establish the interior label."],
  ["4,113", "Reviewed Ruins Valley main area: the outdoor layout, direct ROM label and reciprocal Ruins Cavern links support the neutral main-area label."],
]);

const reviewedHoldNotes = new Map([
  ["1,81", "Held after review: cave-flagged layout warps into maps labelled Radio Tower and Union Cave, so the Resort Gorgeous runtime identity is not established."],
  ["1,82", "Held after review: cave-flagged layout and mixed self/external warps do not establish a trustworthy Resort Gorgeous subarea."],
  ["15,0", "Held after review: the building interior has no visible encounter terrain, yet the ROM header contains Wild, Surf and Fish tables; treat those tables as placeholders until runtime-tested."],
]);

// Reviewed 2026-09-27 against the workbook encounter tables and raw map-header
// mapType values. These headers are Johto/Kanto maps or underwater tables that
// were pulled into the Sevii graph only by stale region labels/reused links.
// They must remain visible as audit evidence but cannot become Sevii content.
const reviewedReusedMainlineMaps = new Map([
  ["3,0", {
    matchedWorkbookLocations: ["New Bark Town"],
    encounterSemantics: "ordinary Surf/Fish/Tree",
    reason: "The ROM Tree and species pools match New Bark Town, and its ordinary town map type is not underwater. The Icefall/Underwater graph link is reused metadata.",
  }],
  ["3,45", {
    matchedWorkbookLocations: ["Route 29"],
    encounterSemantics: "ordinary Wild",
    reason: "All twelve Wild slots match Route 29 exactly. Despite the stale Underwater Sevii region label, this is a normal route map and not a Dive table.",
  }],
  ["3,46", {
    matchedWorkbookLocations: ["Route 46"],
    encounterSemantics: "ordinary Wild",
    reason: "All twelve Wild slots match Route 46 exactly. Its normal route map type and encounter table are existing Johto data, not Sevii Dive data.",
  }],
  ["3,65", {
    matchedWorkbookLocations: ["Cherrygrove City"],
    encounterSemantics: "ordinary Wild/Surf/Fish",
    reason: "The Surf and Fish tables match Cherrygrove City exactly, while the Wild table matches its Beach pool after resolving the West Sea Shellos alias.",
  }],
  ["3,75", {
    matchedWorkbookLocations: ["Route 25", "Vermilion City", "Viridian City"],
    encounterSemantics: "Dive Grass/open-water pool",
    reason: "This mapType 5 header contains the exact twelve-slot Huntail/Gorebyss Dive Grass pool and shared five-slot Dive open-water pool already documented for these Kanto locations.",
  }],
  ["3,112", {
    matchedWorkbookLocations: ["Route 25", "Vermilion City", "Viridian City"],
    encounterSemantics: "Dive Grass/open-water pool",
    reason: "This mapType 5 header duplicates the same documented Kanto Dive pools as map 3,75; its Five Island label is stale reuse rather than Sevii availability evidence.",
  }],
  ["5,75", {
    matchedWorkbookLocations: ["Pallet Town", "Route 19", "Route 21"],
    encounterSemantics: "Dive Grass/open-water pool",
    reason: "This mapType 5 header contains the exact Shellos-East/Clodsire Dive Grass pool and shared Kanto Dive open-water pool already present in the workbook.",
  }],
  ["5,78", {
    matchedWorkbookLocations: ["Route 20"],
    encounterSemantics: "Dive Grass/open-water pool",
    reason: "This mapType 5 header contains Route 20's exact Galarian Slowbro/Slowking Dive Grass pool and the shared Kanto Dive open-water pool.",
  }],
  ["6,30", {
    matchedWorkbookLocations: ["Cherrygrove City", "Goldenrod City", "Lake of Rage", "Olivine City", "Route 27", "Route 32"],
    encounterSemantics: "Dive Grass/open-water pool",
    reason: "After combining repeated species slots, this mapType 5 header matches the shared Johto Dive Grass pool and its five-slot open-water table matches the workbook exactly; it is not an Icefall Cave encounter map.",
  }],
]);

const unresolvedTriageGroups = [
  {
    disposition: "runtime-reused-network",
    priority: 3,
    mapKeys: ["0,12", "0,13", "1,6", "1,10", "1,34", "4,15", "4,16", "4,19", "4,20", "4,21", "4,47", "4,48", "4,49"],
    reason: "These Mt. Ember and Two Island headers render as bedrooms, ship corridors or narrow building links and connect into reused Johto/Kanto networks. Runtime reachability is required before treating their records as Sevii content.",
  },
  {
    disposition: "runtime-confirmation-held",
    priority: 4,
    mapKeys: ["1,81", "1,82", "3,50", "15,0"],
    reason: "Dedicated review already found insufficient static evidence for the Crystal Cavern exterior, Resort Gorgeous, Five Island, the Icefall-linked snowfield or the Six Island placeholder interior. Keep these maps held until in-game entrances and map-name behaviour are confirmed.",
  },
  {
    disposition: "runtime-layout-unrenderable",
    priority: 4,
    mapKeys: ["3,67"],
    reason: "The One Island-linked header has active encounters, trainers and items but no renderable block layout. Static visual review cannot establish a trustworthy subarea or reachability boundary.",
  },
];

const unresolvedTriageByMap = new Map();
for (const group of unresolvedTriageGroups) {
  for (const mapKey of group.mapKeys) {
    if (unresolvedTriageByMap.has(mapKey)) throw new Error(`Duplicate unresolved triage assignment for ${mapKey}.`);
    unresolvedTriageByMap.set(mapKey, {
      disposition: group.disposition,
      priority: group.priority,
      reason: group.reason,
    });
  }
}

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
  else if (reviewedReusedMainlineMaps.has(map.key)) mapStatus = "exclude-reused-mainline";
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
  if (reviewedReusedMainlineMaps.has(map.key)) notes.push(reviewedReusedMainlineMaps.get(map.key).reason);

  const unresolvedTriage = unresolvedTriageByMap.get(map.key) ?? null;

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
    unresolvedTriage,
    excludedReuse: reviewedReusedMainlineMaps.get(map.key) ?? null,
    counts,
    notes,
  };
});

const activeUnresolvedMaps = maps.filter((map) => [
  "needs-linked-map-review",
  "needs-parent-review",
  "needs-review",
  "needs-subarea-review",
].includes(map.mapStatus));
const missingTriage = activeUnresolvedMaps.filter((map) => !map.unresolvedTriage).map((map) => map.mapKey);
const staleTriage = [...unresolvedTriageByMap.keys()].filter((mapKey) => !activeUnresolvedMaps.some((map) => map.mapKey === mapKey));
if (missingTriage.length > 0) throw new Error(`Active unresolved maps missing triage: ${missingTriage.join(", ")}`);
if (staleTriage.length > 0) throw new Error(`Triage assignments no longer active: ${staleTriage.join(", ")}`);

const statusCounts = Object.fromEntries(
  Object.entries(Object.groupBy(maps, (map) => map.mapStatus))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, entries]) => [status, entries.length]),
);
const triageCounts = Object.fromEntries(
  Object.entries(Object.groupBy(activeUnresolvedMaps, (map) => map.unresolvedTriage.disposition))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([disposition, entries]) => [disposition, entries.length]),
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
      "A map proven to duplicate an existing Johto/Kanto ordinary or Dive encounter table is retained as excluded audit evidence and cannot be imported as Sevii content.",
    ],
  },
  summary: {
    mapCount: maps.length,
    statusCounts,
    activeUnresolvedCount: activeUnresolvedMaps.length,
    triageCounts,
  },
  maps,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(outputPath);
console.log(JSON.stringify(result.summary, null, 2));
