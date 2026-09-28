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
  ["3,50", "Runtime-confirmed Crystal Cavern exterior: the exact 2026-07-19 ROM loads the expected rocky, water-lined outdoor layout from a valid late-game save, matching the direct ROM label, layout and four coordinate-valid item placements."],
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

const reviewedPlaceholderMaps = new Map([
  ["15,0", {
    excludedSemantics: "unreachable building-interior Wild/Surf/Fish placeholders",
    reason: "Runtime loading in the exact 2026-07-19 ROM confirms a small building/lab interior with no grass, water or fishing terrain. Its non-zero Wild, Surf and Fish headers are unreachable placeholders and must not become Six Island encounters.",
  }],
]);

// Reviewed 2026-09-27 against the workbook encounter, battle and item tables,
// rendered layouts and raw map-header mapType values. These headers are
// Johto/Kanto maps or underwater tables that were pulled into the Sevii graph
// only by stale region labels/reused links.
// They must remain visible as audit evidence but cannot become Sevii content.
const reviewedReusedMainlineMaps = new Map([
  ["1,81", {
    matchedWorkbookLocations: ["Radio Tower", "Union Cave"],
    encounterSemantics: "reused cave-network header",
    reason: "Runtime loading confirms a cave-grid layout rather than Resort Gorgeous. Its cave flag and warps into Radio Tower and Union Cave identify stale/reused mainline map metadata, so it cannot become Sevii content.",
  }],
  ["1,82", {
    matchedWorkbookLocations: [],
    encounterSemantics: "reused cave-network companion header",
    reason: "Runtime loading confirms a cave-grid layout with several NPCs rather than Resort Gorgeous. Its only meaningful links are the reused map 1,81 cave network and a blank-labelled map, so the Resort Gorgeous label is stale and the header cannot become Sevii content.",
  }],
  ["3,67", {
    matchedWorkbookLocations: ["Route 45"],
    encounterSemantics: "Route 45 Wild/Surf/Fish, trainers and items",
    reason: "Runtime loading confirms a rocky Johto route layout, and the extracted encounter pool, trainers (including Quentin, Kelly and Kenji) and item set reconcile with Route 45. The One Island graph link is stale reuse rather than Sevii availability evidence.",
  }],
  ["0,12", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 4 trainer variants",
    reason: "The rendered cabin and every extracted trainer party (Ethan, Carol and Sean) match the workbook's direction-specific S.S. Aqua Cabin 4 records exactly. The Mt. Ember region label is stale reuse.",
  }],
  ["0,13", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 5 trainer variant",
    reason: "The rendered cabin and Shawn's extracted party match the workbook's S.S. Aqua Cabin 5 record exactly. The Mt. Ember region label is stale reuse.",
  }],
  ["1,6", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua B1F trainer set",
    reason: "The ship-corridor layout and all ten extracted trainer parties match the workbook's S.S. Aqua B1F records exactly across the first and repeatable trips. The Mt. Ember region label is stale reuse.",
  }],
  ["1,10", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Captain's room item",
    reason: "The rendered Captain's room contains TM20, matching the workbook's TM20 Dive placement on the table in the S.S. Aqua Captain's room. The Mt. Ember region label is stale reuse.",
  }],
  ["4,15", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 2 trainer variants",
    reason: "The rendered cabin and the extracted Corey, Edward and Stanly parties match the workbook's direction- and trip-specific S.S. Aqua Cabin 2 records exactly. The Mt. Ember region label is stale reuse.",
  }],
  ["4,16", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 3 trainer variant",
    reason: "The rendered cabin and Noland's extracted party match the workbook's S.S. Aqua Cabin 3 record exactly. The Mt. Ember region label is stale reuse.",
  }],
  ["4,19", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 6 trainer variants",
    reason: "The rendered cabin and the extracted Colin, Georgia, Jeremy, Meg & Peg and Rodney parties match the workbook's direction- and trip-specific S.S. Aqua Cabin 6 records exactly. The Mt. Ember region label is stale reuse.",
  }],
  ["4,20", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 7 trainer variants",
    reason: "The rendered cabin and the extracted Cassie and Clyde parties match the workbook's direction-specific S.S. Aqua Cabin 7 records exactly. The Mt. Ember region label is stale reuse.",
  }],
  ["4,21", {
    matchedWorkbookLocations: ["S.S. Aqua"],
    encounterSemantics: "S.S. Aqua Cabin 8 trainer variants",
    reason: "The rendered cabin and the extracted Lyle and Ken parties match the workbook's direction- and trip-specific S.S. Aqua Cabin 8 records exactly. The Mt. Ember region label is stale reuse.",
  }],
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
  ["1,34", {
    matchedWorkbookLocations: ["Underground Path"],
    encounterSemantics: "Underground Path R5-R6 hidden-item corridor",
    reason: "The rendered vertical corridor and all seven hidden items match the workbook's Underground Path R5-R6 placements exactly. Its only entrances are reused Kanto gate maps, so the Two Island region label is stale reuse.",
  }],
  ["4,47", {
    matchedWorkbookLocations: ["Underground Path"],
    encounterSemantics: "Underground Path gatehouse",
    reason: "The rendered gatehouse leads to the R7-R8 corridor, and its NPC script talks about the sleeping Pokemon near Celadon. This is Kanto Underground Path content with a stale Two Island label.",
  }],
  ["4,48", {
    matchedWorkbookLocations: ["Underground Path"],
    encounterSemantics: "Underground Path R7-R8 hidden-item corridor",
    reason: "The rendered horizontal corridor and all seven hidden items match the workbook's Underground Path R7-R8 placements exactly. Its non-zero Wild/Surf headers are unreachable placeholders rather than Two Island encounters.",
  }],
  ["4,49", {
    matchedWorkbookLocations: ["Underground Path"],
    encounterSemantics: "Underground Path gatehouse",
    reason: "The rendered gatehouse leads to the R7-R8 corridor, and its NPC script discusses Celadon Department Store. This is Kanto Underground Path content with a stale Two Island label.",
  }],
]);

const unresolvedTriageGroups = [];

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
  else if (reviewedPlaceholderMaps.has(map.key)) mapStatus = "exclude-placeholder";
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
  if (map.regionName === "Mt. Ember" && activeRecordCount > 0 && !reviewedReusedMainlineMaps.has(map.key)) {
    notes.push("Rendered layout resembles reused ship/room maps; verify in-game reachability before importing battles.");
  }
  if (reviewedReadyNotes.has(map.key)) notes.push(reviewedReadyNotes.get(map.key));
  if (reviewedPlaceholderMaps.has(map.key)) notes.push(reviewedPlaceholderMaps.get(map.key).reason);
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
    excludedPlaceholder: reviewedPlaceholderMaps.get(map.key) ?? null,
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
      "A runtime-confirmed interior whose encounter headers cannot be reached from its terrain is retained as excluded placeholder evidence and cannot be imported.",
      "Runtime checks use temporary checksum-correct save copies; the user-supplied save and ROM remain untouched and outside the repository.",
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
