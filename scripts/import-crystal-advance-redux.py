#!/usr/bin/env python3
"""Import the Crystal Advance Redux community workbook using only Python stdlib.

The Google Sheets export is read through its Open XML package so cached formula
values remain available without requiring Excel or third-party packages.
"""

from __future__ import annotations

import argparse
from collections import Counter
import json
import re
import sys
import unicodedata
import zipfile
from copy import deepcopy
from pathlib import Path
from xml.etree import ElementTree as ET

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def column_number(reference: str) -> int:
    match = re.match(r"([A-Z]+)", reference)
    if not match:
        raise ValueError(f"Invalid cell reference: {reference}")
    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - 64
    return value


def column_name(number: int) -> str:
    value = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        value = chr(65 + remainder) + value
    return value


class OpenXmlWorkbook:
    def __init__(self, path: Path):
        self.path = path
        self.archive = zipfile.ZipFile(path)
        self.shared_strings = self._read_shared_strings()
        self.sheets = self._read_sheets()

    def close(self) -> None:
        self.archive.close()

    def _xml(self, entry: str) -> ET.Element:
        return ET.fromstring(self.archive.read(entry))

    def _read_shared_strings(self) -> list[str]:
        try:
            root = self._xml("xl/sharedStrings.xml")
        except KeyError:
            return []
        return ["".join(node.itertext()) for node in root if local_name(node.tag) == "si"]

    def _read_sheets(self) -> dict[str, str]:
        workbook = self._xml("xl/workbook.xml")
        relationships = self._xml("xl/_rels/workbook.xml.rels")
        targets = {
            node.attrib["Id"]: node.attrib["Target"]
            for node in relationships
            if local_name(node.tag) == "Relationship"
        }
        result: dict[str, str] = {}
        for node in workbook.iter():
            if local_name(node.tag) != "sheet":
                continue
            relationship_id = node.attrib[f"{{{REL_NS}}}id"]
            target = targets[relationship_id].lstrip("/")
            result[node.attrib["name"]] = target if target.startswith("xl/") else f"xl/{target}"
        return result

    def rows(self, sheet_name: str) -> dict[int, dict[int, object]]:
        root = self._xml(self.sheets[sheet_name])
        output: dict[int, dict[int, object]] = {}
        for row in root.iter():
            if local_name(row.tag) != "row":
                continue
            row_number = int(row.attrib["r"])
            values: dict[int, object] = {}
            for cell in row:
                if local_name(cell.tag) != "c":
                    continue
                value = self._cell_value(cell)
                if value is not None:
                    values[column_number(cell.attrib["r"])] = value
            output[row_number] = values
        return output

    def _cell_value(self, cell: ET.Element) -> object | None:
        cell_type = cell.attrib.get("t", "")
        value_node = next((node for node in cell if local_name(node.tag) == "v"), None)
        if cell_type == "inlineStr":
            inline = next((node for node in cell if local_name(node.tag) == "is"), None)
            return "".join(inline.itertext()) if inline is not None else None
        if value_node is None:
            return None
        raw = value_node.text
        if raw is None:
            return None
        if cell_type == "s":
            return self.shared_strings[int(raw)]
        if cell_type == "b":
            return raw == "1"
        return raw


def inspect(workbook: OpenXmlWorkbook) -> None:
    print(json.dumps({"sheets": list(workbook.sheets)}, ensure_ascii=False))
    targets = {
        "Pokemon Data": [1, 2, 3],
        "Location Data": [1, 2, 3],
        "Misc Data": [1, 2, 3],
        "Item List": [1, 2, 3],
        "BData": [1, 2, 3],
    }
    for sheet_name, wanted_rows in targets.items():
        rows = workbook.rows(sheet_name)
        print(f"\n=== {sheet_name} ===")
        for row_number in wanted_rows:
            values = rows.get(row_number, {})
            print(f"ROW {row_number}")
            for column, value in sorted(values.items()):
                text = str(value).replace("\n", " ")
                print(f"{column_name(column)}\t{text[:180]}")

    location_rows = workbook.rows("Location Data")
    methods = Counter(str(row.get(5, "")).strip() for row in location_rows.values() if row.get(5))
    item_categories = Counter(str(row.get(17, "")).strip() for row in location_rows.values() if row.get(17))
    print("\n=== LOCATION METHOD COUNTS ===")
    for value, count in methods.most_common():
        print(f"{value}\t{count}")
    print("\n=== ITEM CATEGORY COUNTS ===")
    for value, count in item_categories.most_common():
        print(f"{value}\t{count}")

    misc_rows = workbook.rows("Misc Data")
    print("\n=== SEASONAL ENCOUNTERS (AL onward) ===")
    for row_number, row in sorted(misc_rows.items()):
        selected = {column: value for column, value in row.items() if column >= 38}
        if not selected:
            continue
        cells = " | ".join(f"{column_name(column)}={value}" for column, value in sorted(selected.items()))
        print(f"ROW {row_number}\t{cells}")


def normalise(value: object) -> str:
    text = str(value or "").replace("♀", " female ").replace("♂", " male ")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]", "", text.lower())


def slug(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def normalise_trainer_subarea(value: object) -> str:
    """Clean trainer More Info labels without changing their documented meaning."""
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return re.sub(r",\s*$", "", text).strip()


def normalise_trainer_venue(value: object) -> str:
    """Clean the trainer Location label while retaining explicit workbook wording."""
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return "" if text == "?" else text


def integer(value: object, default: int | None = None) -> int | None:
    try:
        return int(float(str(value)))
    except (TypeError, ValueError):
        return default


def number(value: object) -> float | int | None:
    try:
        result = float(str(value))
    except (TypeError, ValueError):
        return None
    return int(result) if result.is_integer() else result


def ordered_unique(values: list[object]) -> list[object]:
    output = []
    seen = set()
    for value in values:
        marker = json.dumps(value, sort_keys=True, ensure_ascii=False)
        if marker not in seen:
            output.append(value)
            seen.add(marker)
    return output


REGIONAL_SUFFIXES = {
    "alola": "alolan",
    "galar": "galarian",
    "hisui": "hisuian",
    "paldea": "paldean",
}

FORM_SOURCE_KEYS = {
    "nidoranfemale": "nidoran-f",
    "nidoranmale": "nidoran-m",
    "burmyp": "burmy-plant",
    "burmys": "burmy-sandy",
    "burmyt": "burmy-trash",
    "wormadamp": "wormadam-plant",
    "wormadams": "wormadam-sandy",
    "wormadamt": "wormadam-trash",
    "deoxysa": "deoxys-attack",
    "deoxysd": "deoxys-defense",
    "deoxyss": "deoxys-speed",
    "rotomh": "rotom-heat",
    "rotomw": "rotom-wash",
    "rotomf": "rotom-frost",
    "rotomm": "rotom-mow",
    "rotoms": "rotom-fan",
    "giratinao": "giratina-origin",
    "shaymins": "shaymin-sky",
    "castformsunny": "castform-sunny",
    "castformrainy": "castform-rainy",
    "castformsnowy": "castform-snowy",
}

MOVE_ALIASES = {
    "faintattack": "feintattack",
    "disarmvoice": "disarmingvoice",
    "vicegrip": "visegrip",
    "smellingsalt": "smellingsalts",
    "drainkiss": "drainingkiss",
}

ABILITY_ALIASES = {"download2": "download"}
POKEMON_ALIASES = {
    "goldusk": "golduck",
    # Location Data trainer-team typos in the 2026-07-01 community workbook.
    "poygon2": "porygon2",
    "magneeton": "magneton",
}

TYPE_COLOURS = {
    "normal": "#A8A77A", "fire": "#EE8130", "water": "#6390F0", "electric": "#F7D02C",
    "grass": "#7AC74C", "ice": "#96D9D6", "fighting": "#C22E28", "poison": "#A33EA1",
    "ground": "#E2BF65", "flying": "#A98FF3", "psychic": "#F95587", "bug": "#A6B91A",
    "rock": "#B6A136", "ghost": "#735797", "dragon": "#6F35FC", "dark": "#705746",
    "steel": "#B7B7CE", "fairy": "#D685AD",
}

# Standard alternate forms use the project's pinned PokeAPI sprite revision;
# the workbook's A/B/C Paldean Tauros labels are matched by documented types.
# Pikachu forms use provisional form-accurate sprites from the public Radical
# Red Pokédex data repository. Crystal Advance Redux-specific shiny Pikachu
# sprites have not been located, so those remain explicitly unavailable.
# PokeAPI revision: baseline.lock.json
# Pikachu source revision: https://github.com/JwowSquared/Radical-Red-Pokedex/tree/488a0918194d567b5f7b02c396118d51fb9c81ce/graphics/frontspr
CUSTOM_FORM_SPRITES = {
    "burmy-s": {"sprite": "assets/pokemon/burmy-sandy.png", "shinySprite": "assets/pokemon/shiny/burmy-sandy.png"},
    "burmy-t": {"sprite": "assets/pokemon/burmy-trash.png", "shinySprite": "assets/pokemon/shiny/burmy-trash.png"},
    "shellos-east": {"sprite": "assets/pokemon/shellos-east.png", "shinySprite": "assets/pokemon/shiny/shellos-east.png"},
    "gastrodon-east": {"sprite": "assets/pokemon/gastrodon-east.png", "shinySprite": "assets/pokemon/shiny/gastrodon-east.png"},
    "cherrim-sunny": {"sprite": "assets/pokemon/cherrim-sunshine.png", "shinySprite": "assets/pokemon/shiny/cherrim-sunshine.png"},
    "paldean-tauros-a": {"sprite": "assets/pokemon/tauros-paldea-aqua-breed.png", "shinySprite": "assets/pokemon/shiny/tauros-paldea-aqua-breed.png"},
    "paldean-tauros-b": {"sprite": "assets/pokemon/tauros-paldea-blaze-breed.png", "shinySprite": "assets/pokemon/shiny/tauros-paldea-blaze-breed.png"},
    "paldean-tauros-c": {"sprite": "assets/pokemon/tauros-paldea-combat-breed.png", "shinySprite": "assets/pokemon/shiny/tauros-paldea-combat-breed.png"},
    "pikachu-partner": {"sprite": "assets/pokemon/pikachu-partner.png", "shinySprite": ""},
    "pikachu-surf": {"sprite": "assets/pokemon/pikachu-surf.png", "shinySprite": ""},
    "pikachu-fly": {"sprite": "assets/pokemon/pikachu-fly.png", "shinySprite": ""},
}


def baseline_form_aliases(entry: dict) -> set[str]:
    aliases = {normalise(entry.get("key")), normalise(entry.get("sourceKey")), normalise(entry.get("name"))}
    source_key = str(entry.get("sourceKey") or "")
    parts = source_key.split("-")
    if len(parts) > 1:
        base = " ".join(parts[:-1])
        suffix = parts[-1]
        aliases.update({normalise(f"{base} {suffix}"), normalise(f"{suffix} {base}")})
        if suffix in REGIONAL_SUFFIXES:
            aliases.add(normalise(f"{REGIONAL_SUFFIXES[suffix]} {base}"))
    return {value for value in aliases if value}


def workbook_roster(rows: dict[int, dict[int, object]], baseline: dict) -> tuple[list[dict], dict[str, dict], list[dict]]:
    baseline_by_dex: dict[int, list[dict]] = {}
    baseline_by_source = {str(entry.get("sourceKey")): entry for entry in baseline.get("pokemon", [])}
    for entry in baseline.get("pokemon", []):
        baseline_by_dex.setdefault(integer(entry.get("dexId"), -1), []).append(entry)

    roster: list[dict] = []
    by_alias: dict[str, dict] = {}
    custom_forms: list[dict] = []
    used_ids: set[int] = set()
    for row_number, row in sorted(rows.items()):
        name = str(row.get(1, "")).strip()
        dex_id = integer(row.get(2))
        game_dex_id = integer(row.get(3))
        if row_number < 3 or not name or dex_id is None:
            continue
        wanted = normalise(name)
        candidates = baseline_by_dex.get(dex_id, [])
        match = None
        forced_source = FORM_SOURCE_KEYS.get(wanted)
        if forced_source:
            match = baseline_by_source.get(forced_source)
        if match is None:
            exact = [entry for entry in candidates if wanted in baseline_form_aliases(entry)]
            if len(exact) == 1:
                match = exact[0]
            elif len(exact) > 1:
                match = next((entry for entry in exact if entry.get("isDefaultForm")), exact[0])
        if match is None:
            default = [entry for entry in candidates if entry.get("isDefaultForm")]
            if len(candidates) == 1 or (default and wanted == normalise(default[0].get("name"))):
                match = default[0] if default else candidates[0]

        if match:
            record_id = int(match["id"])
            key = str(match["key"])
            source_key = str(match.get("sourceKey") or "")
            is_default = bool(match.get("isDefaultForm"))
        else:
            record_id = 200000 + row_number
            key = name.replace(" ", "-")
            source_key = slug(name)
            is_default = False
            custom_forms.append({"row": row_number, "name": name, "dexId": dex_id, "id": record_id, "key": key})
        if record_id in used_ids:
            record_id = 250000 + row_number
            key = name.replace(" ", "-")
            source_key = slug(name)
            is_default = False
            match = None
            custom_forms.append({"row": row_number, "name": name, "dexId": dex_id, "id": record_id, "key": key, "reason": "distinct workbook form not represented by a unique PokeAPI variety"})
        used_ids.add(record_id)
        entry = {
            "row": row_number,
            "raw": row,
            "workbookName": name,
            "id": record_id,
            "dexId": dex_id,
            "gameDexId": game_dex_id,
            "key": key,
            "sourceKey": source_key,
            "isDefaultForm": is_default,
            "baseline": match,
        }
        roster.append(entry)
        for alias in {normalise(name), normalise(key), normalise(source_key)}:
            if alias:
                by_alias[alias] = entry
    return roster, by_alias, custom_forms


def move_id_index(project_root: Path, lock: dict) -> dict[str, int]:
    output: dict[str, int] = {}
    cache = project_root / "work" / "pokeapi-cache" / str(lock["apiDataCommit"]) / "pokemon"
    if not cache.exists():
        return output
    for path in cache.glob("*.json"):
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        for entry in value.get("moves", []):
            move = entry.get("move") or {}
            match = re.search(r"/(\d+)/?$", str(move.get("url") or ""))
            if move.get("name") and match:
                output[normalise(move["name"])] = int(match.group(1))
    return output


class MoveResolver:
    def __init__(self, baseline: dict, id_index: dict[str, int]):
        self.baseline_by_alias: dict[str, dict] = {}
        self.baseline_by_id = {int(move["id"]): move for move in baseline.get("moves", [])}
        for move in baseline.get("moves", []):
            self.baseline_by_alias[normalise(move.get("name"))] = move
            self.baseline_by_alias[normalise(move.get("key"))] = move
        self.id_index = id_index
        self.custom_by_alias: dict[str, dict] = {}
        self.custom_id = 30000

    def resolve(self, raw_name: object) -> int | None:
        name = str(raw_name or "").strip()
        if not name or normalise(name) in {"unavailable", "none", "na", "notapplicable"}:
            return None
        alias = MOVE_ALIASES.get(normalise(name), normalise(name))
        baseline = self.baseline_by_alias.get(alias)
        if baseline:
            return int(baseline["id"])
        if alias in self.custom_by_alias:
            return int(self.custom_by_alias[alias]["id"])
        move_id = self.id_index.get(alias)
        if move_id in self.baseline_by_id:
            return move_id
        if move_id is None:
            while self.custom_id in self.baseline_by_id:
                self.custom_id += 1
            move_id = self.custom_id
            self.custom_id += 1
        record = {
            "id": move_id,
            "key": slug(name),
            "name": name,
            "type": "Unknown",
            "typeColour": "#888888",
            "category": "Status",
            "power": None,
            "accuracy": None,
            "pp": None,
            "priority": 0,
            "description": "Move definition is not supplied by the 2026-07-01 community workbook; identity is retained for learnset completeness.",
        }
        self.custom_by_alias[alias] = record
        return move_id

    @property
    def custom_moves(self) -> list[dict]:
        return sorted(self.custom_by_alias.values(), key=lambda move: int(move["id"]))


def machine_move(value: object) -> str:
    return re.sub(r"^(?:TM|HM|MT|TD)\d+\s*-\s*", "", str(value or "").strip(), flags=re.I)


def level_move(value: object) -> tuple[int, str] | None:
    text = str(value or "").strip()
    if not text:
        return None
    match = re.match(r"^(\d+)\s*,\s*(.+)$", text)
    if match:
        return int(match.group(1)), match.group(2).strip()
    match = re.match(r"^(\d+)\s+(.+)$", text)
    if match:
        return int(match.group(1)), match.group(2).strip()
    match = re.match(r"^Evo\s*,\s*(.+)$", text, flags=re.I)
    if match:
        return 0, match.group(1).strip()
    return 1, text


def parse_evolution_edges(roster: list[dict], aliases: dict[str, dict]) -> tuple[dict[int, list[dict]], list[dict]]:
    start, end = column_number("IA"), column_number("IZ")
    output: dict[int, list[dict]] = {entry["id"]: [] for entry in roster}
    unresolved: list[dict] = []
    seen: set[tuple[int, int, str]] = set()
    for entry in roster:
        previous = None
        pending_method = None
        for column in range(start, end + 1):
            text = str(entry["raw"].get(column, "")).strip()
            if not text:
                continue
            if re.match(r"^[⇒→]", text):
                pending_method = re.sub(r"^[⇒→\s]+", "", text).strip() or "Evolution"
                continue
            current = aliases.get(normalise(text))
            if current is None:
                continue
            if previous and pending_method:
                marker = (previous["id"], current["id"], pending_method)
                if marker not in seen and previous["id"] != current["id"]:
                    output[previous["id"]].append({"targetId": current["id"], "method": pending_method})
                    seen.add(marker)
                pending_method = None
            previous = current
        if pending_method:
            unresolved.append({"row": entry["row"], "name": entry["workbookName"], "method": pending_method})
    return output, unresolved


def ability_lookup(baseline_abilities: list[dict]) -> dict[str, dict]:
    output = {}
    for ability in baseline_abilities:
        output[normalise(ability.get("name"))] = ability
        output[normalise(ability.get("key"))] = ability
    for source, target in ABILITY_ALIASES.items():
        if target in output:
            output[source] = output[target]
    return output


def pokemon_overrides(
    roster: list[dict],
    evolution_edges: dict[int, list[dict]],
    moves: MoveResolver,
    baseline: dict,
    baseline_abilities: list[dict],
) -> tuple[list[dict], list[dict]]:
    ability_by_name = ability_lookup(baseline_abilities)
    custom_abilities: dict[str, dict] = {}
    imported: list[dict] = []
    matched_baseline_ids: set[int] = set()
    level_columns = range(column_number("AI"), column_number("BK") + 1)
    egg_columns = range(column_number("BL"), column_number("BZ") + 1)
    tm_columns = range(column_number("CA"), column_number("EF") + 1)
    tutor_columns = range(column_number("EG"), column_number("FR") + 1)
    disk_columns = range(column_number("FS"), column_number("HQ") + 1)

    for entry in roster:
        row = entry["raw"]
        stats = [number(row.get(column)) or 0 for column in (6, 7, 8, 11, 9, 10)]
        types = [str(row.get(column)).strip() for column in (4, 5) if str(row.get(column, "")).strip()]
        abilities = []
        for column in (27, 28):
            name = str(row.get(column, "")).strip()
            if not name:
                continue
            known = ability_by_name.get(normalise(name))
            if known:
                abilities.append({"name": known["name"], "description": known.get("description", "")})
            else:
                alias = normalise(name)
                if alias not in custom_abilities:
                    custom_abilities[alias] = {
                        "id": 60000 + len(custom_abilities),
                        "key": slug(name),
                        "name": name,
                        "description": "Ability effect is not supplied by the 2026-07-01 community workbook.",
                        "generation": "rom-hack",
                    }
                abilities.append({"name": name, "description": custom_abilities[alias]["description"]})

        level_entries = []
        for column in level_columns:
            parsed = level_move(row.get(column))
            if not parsed:
                continue
            level, name = parsed
            move_id = moves.resolve(name)
            if move_id is not None:
                level_entries.append({"moveId": move_id, "level": level})
        egg_ids = [moves.resolve(row.get(column)) for column in egg_columns if row.get(column)]
        tm_ids = [moves.resolve(machine_move(row.get(column))) for column in tm_columns if row.get(column)]
        tutor_ids = [moves.resolve(machine_move(row.get(column))) for column in tutor_columns if row.get(column)]
        disk_ids = [moves.resolve(machine_move(row.get(column))) for column in disk_columns if row.get(column)]
        learnset = {
            "level": sorted(ordered_unique(level_entries), key=lambda value: (value["level"], value["moveId"])),
            "tm": sorted(set(value for value in [*tm_ids, *disk_ids] if value is not None)),
            "tutor": sorted(set(value for value in tutor_ids if value is not None)),
            "egg": sorted(set(value for value in egg_ids if value is not None)),
            "other": [],
        }
        patch = {
            "id": entry["id"],
            "dexId": entry["dexId"],
            "gameDexId": entry["gameDexId"],
            "key": entry["key"],
            "sourceKey": entry["sourceKey"],
            "name": entry["workbookName"],
            "isDefaultForm": entry["isDefaultForm"],
            "types": types,
            "typeColours": [TYPE_COLOURS.get(value.lower(), "#888888") for value in types],
            "stats": stats,
            "bst": sum(float(value) for value in stats),
            "abilities": abilities,
            "learnset": learnset,
            "evolutions": evolution_edges.get(entry["id"], []),
            "heldItems": [
                {"name": str(row.get(30)), "rate": 50} if row.get(30) else None,
                {"name": str(row.get(31)), "rate": 10} if row.get(31) else None,
            ],
            "eggGroups": [str(row.get(column)) for column in (33, 34) if row.get(column)],
            "catchRate": number(row.get(column_number("HW"))),
            "growthRate": str(row.get(column_number("HZ"), "")),
        }
        patch["heldItems"] = [value for value in patch["heldItems"] if value]
        if entry["baseline"]:
            matched_baseline_ids.add(int(entry["baseline"]["id"]))
        else:
            custom_sprites = CUSTOM_FORM_SPRITES.get(entry["sourceKey"])
            patch["sprite"] = custom_sprites["sprite"] if custom_sprites else "assets/art/placeholder-icon.svg"
            patch["shinySprite"] = custom_sprites["shinySprite"] if custom_sprites else "assets/art/placeholder-icon.svg"
        imported.append(patch)

    for baseline_entry in baseline.get("pokemon", []):
        if int(baseline_entry["id"]) not in matched_baseline_ids:
            imported.append({"id": int(baseline_entry["id"]), "key": baseline_entry["key"], "$delete": True})
    return imported, sorted(custom_abilities.values(), key=lambda value: int(value["id"]))


def resolve_pokemon(value: object, aliases: dict[str, dict]) -> dict | None:
    alias = normalise(value)
    alias = POKEMON_ALIASES.get(alias, alias)
    return aliases.get(alias)


def encounter_rate(*values: object) -> float | int | None:
    text = " ".join(str(value or "") for value in values)
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
    return number(match.group(1)) if match else None


def fishing_rod(value: object) -> str:
    match = re.search(r"\b(Old|Good|Super)\s+Rod\b", str(value or ""), flags=re.I)
    return f"{match.group(1).title()} Rod" if match else ""


def import_locations(rows: dict[int, dict[int, object]], aliases: dict[str, dict]) -> tuple[list[dict], dict[str, list[dict]], list[dict]]:
    wild_methods = {"Wild", "Fish", "Surf", "Dive", "Tree", "Rock"}
    grouped: dict[str, list[dict]] = {}
    acquisition = {"wild": [], "safari": [], "raids": [], "special": [], "gifts": [], "trades": [], "fossils": [], "unobtainable": []}
    unresolved: list[dict] = []
    for row_number, row in sorted(rows.items()):
        pokemon_name = str(row.get(2, "")).strip()
        location = str(row.get(3, "")).strip()
        subarea = str(row.get(4, "")).strip()
        method = str(row.get(5, "")).strip()
        if row_number < 2 or not pokemon_name or not location or not method or method == "Method":
            continue
        pokemon = resolve_pokemon(pokemon_name, aliases)
        if not pokemon:
            unresolved.append({"row": row_number, "pokemon": pokemon_name, "location": location, "method": method})
            continue
        details = " · ".join(ordered_unique([str(row.get(column)).strip() for column in (4, 7) if str(row.get(column, "")).strip()]))
        level = str(row.get(6, "")).strip()
        rarity = encounter_rate(row.get(4), row.get(7))
        if method in wild_methods:
            encounter = {
                "pokemon": pokemon["key"],
                "method": method,
                "level": level,
                "rarity": rarity,
                "subarea": subarea,
                "details": str(row.get(7, "")).strip(),
                "period": "all-day",
            }
            if method == "Fish":
                encounter["rod"] = fishing_rod(row.get(7))
            grouped.setdefault(location, []).append(encounter)
            continue
        if method == "Trade":
            section = "trades"
        elif method == "Event" and re.search(r"starter|gift|receive|egg", details, flags=re.I):
            section = "gifts"
        else:
            section = "special"
        acquisition[section].append({
            "pokemon": pokemon["key"],
            "location": location,
            "method": method,
            "details": details,
            "level": level,
        })

    locations = []
    for name, encounters in sorted(grouped.items()):
        unique = ordered_unique(encounters)
        locations.append({"name": name, "day": unique, "night": deepcopy(unique), "periodModel": "all-day"})
    for section in acquisition:
        acquisition[section] = ordered_unique(acquisition[section])
    return locations, acquisition, unresolved


def import_battles(rows: dict[int, dict[int, object]], aliases: dict[str, dict]) -> tuple[dict, list[dict]]:
    slot_columns = (("AI", "AJ"), ("AK", "AL"), ("AM", "AN"), ("AO", "AP"), ("AQ", "AR"), ("AS", "AT"))
    battles = []
    unresolved = []
    last_venue_by_location = {}
    last_venue_row_by_location = {}
    last_subarea_by_location = {}
    last_subarea_row_by_location = {}
    for row_number, row in sorted(rows.items()):
        location = str(row.get(column_number("AD"), "") or row.get(column_number("AE"), "")).strip()
        if row_number < 2 or not location:
            continue
        explicit_venue = normalise_trainer_venue(row.get(column_number("AE"), ""))
        explicit_subarea = normalise_trainer_subarea(row.get(column_number("AF"), ""))
        raw_trainer = str(row.get(column_number("AG"), "")).strip()
        trainer = re.sub(r"\s*\*\s*", " ", raw_trainer).strip()
        is_boss = "*" in raw_trainer
        has_team_data = any(str(row.get(column_number(pokemon_column), "")).strip() for pokemon_column, _ in slot_columns)
        if explicit_venue:
            last_venue_by_location[location] = explicit_venue
            last_venue_row_by_location[location] = row_number
            # A populated Location cell starts a new workbook block. Do not let
            # More Info from the previous venue or visit bleed into the new one.
            last_subarea_by_location.pop(location, None)
            last_subarea_row_by_location.pop(location, None)
        elif not raw_trainer and not has_team_data and not explicit_subarea:
            # Blank separator rows delimit repeat/rematch blocks while the sparse
            # Location value itself continues to apply below them.
            last_subarea_by_location.pop(location, None)
            last_subarea_row_by_location.pop(location, None)
        if explicit_subarea:
            last_subarea_by_location[location] = explicit_subarea
            last_subarea_row_by_location[location] = row_number
        effective_venue = last_venue_by_location.get(location, "")
        venue = effective_venue if normalise(effective_venue) != normalise(location) else ""
        more_info = last_subarea_by_location.get(location, "")
        if more_info and venue and normalise(more_info) != "rematch":
            subarea = f"{venue} · {more_info}"
            subarea_source_column = "AE+AF"
        elif more_info:
            subarea = more_info
            subarea_source_column = "AF"
        else:
            subarea = venue
            subarea_source_column = "AE" if venue else ""
        subarea_from_more_info = bool(more_info)
        subarea_source_row = (
            last_subarea_row_by_location.get(location)
            if subarea_from_more_info
            else last_venue_row_by_location.get(location)
        )
        if not trainer or trainer == "Trainer":
            continue
        is_vs = str(row.get(column_number("AH"), "")).strip().lower() == "vs"
        team = []
        for pokemon_column, level_column in slot_columns:
            source_name = str(row.get(column_number(pokemon_column), "")).strip()
            if not source_name:
                continue
            pokemon = resolve_pokemon(source_name, aliases)
            raw_level = str(row.get(column_number(level_column), "")).strip()
            parsed_level = number(raw_level)
            if parsed_level is not None:
                level: int | float | str = parsed_level
            elif is_vs:
                level = "Team-scaled"
            else:
                level = raw_level or "Not documented"
            member = {
                "name": pokemon["key"] if pokemon else source_name,
                "level": level,
                "ability": "",
                "item": "",
                "nature": "",
                "moves": [],
            }
            if not pokemon:
                starter_match = re.fullmatch(r"SE Starter(?: ([23]))?", source_name, flags=re.I)
                if starter_match:
                    member["conditional"] = True
                    member["condition"] = "Species depends on the player's starter choice."
                    member["conditionalKey"] = "rival-starter"
                    member["evolutionStage"] = int(starter_match.group(1) or 1)
                else:
                    unresolved.append({"row": row_number, "trainer": trainer, "pokemon": source_name})
            team.append(member)
        if not team:
            continue
        numeric_levels = [member["level"] for member in team if isinstance(member["level"], (int, float))]
        notes = []
        if is_vs:
            notes.append("VS Seeker rematch")
            if any(member["level"] == "Team-scaled" for member in team):
                notes.append("Unset levels scale to the player's team")
        if any(member["level"] == "Not documented" for member in team):
            notes.append("One or more levels are not documented in the workbook")
        if any(member.get("conditional") for member in team):
            notes.append("Conditional starter slot retained from the workbook")
        battle = {
            "id": f"location-data-{row_number}-{slug(location)}-{slug(trainer)}",
            "mode": "default",
            "category": "VS Seeker Rematch" if is_vs else "Trainer Battle",
            "trainer": trainer,
            "boss": is_boss,
            "rival": bool(re.match(r"^Silver(?:\s|$)", trainer, flags=re.I)),
            "location": location,
            "subarea": subarea,
            "rematch": is_vs,
            "team": team,
            "notes": notes,
            "source": {
                "file": "sources/inbox/Crystal Advance Redux.xlsx",
                "sheet": "Location Data",
                "row": row_number,
            },
        }
        if venue:
            battle["venue"] = venue
            battle["venueInherited"] = not bool(explicit_venue)
            battle["venueSourceRow"] = last_venue_row_by_location.get(location)
        if more_info:
            battle["moreInfo"] = more_info
            battle["moreInfoInherited"] = not bool(explicit_subarea)
        if subarea:
            battle["subareaInherited"] = (
                not bool(explicit_subarea) if subarea_from_more_info else not bool(explicit_venue)
            )
            battle["subareaSourceRow"] = subarea_source_row
            battle["subareaSourceColumn"] = subarea_source_column
        if len(numeric_levels) == len(team):
            battle["levelMin"] = min(numeric_levels)
            battle["levelMax"] = max(numeric_levels)
        battles.append(battle)
    return {
        "meta": {
            "version": "2026-07-01",
            "title": "Crystal Advance Redux community workbook trainer data",
            "sourceNote": "Trainer parent areas come from Location Data column AD, specific venues from column AE, and finer area/floor labels from column AF. Sparse Location and More Info values inherit within their workbook block. Venue and finer detail are combined when both are needed for an unambiguous label; a plain Rematch label remains unchanged.",
            "limitations": [
                "The workbook does not document trainer moves, abilities, held items or natures.",
                "Blank VS Seeker levels are explicitly shown as team-scaled; other blank levels remain not documented.",
                "Asterisks beside trainer names are preserved as a major-battle flag rather than as part of the displayed name.",
                "Silver's SE Starter placeholders are retained with their documented evolution stage and resolved from the player's starter at runtime.",
                "Workbook question-mark Location placeholders are treated as undocumented and do not replace a known venue.",
                "Post-2026-07-01 Sevii trainer data is absent.",
            ],
        },
        "battles": battles,
    }, unresolved


def import_seasonal(rows: dict[int, dict[int, object]], aliases: dict[str, dict], acquisition: dict[str, list[dict]]) -> list[dict]:
    unresolved = []
    columns = [(column_number("AL"), column_number("AM"), "Johto"), (column_number("AP"), column_number("AQ"), "Kanto")]
    for row_number, row in sorted(rows.items()):
        if row_number < 12:
            continue
        for pokemon_column, date_column, region in columns:
            pokemon_name = str(row.get(pokemon_column, "")).strip()
            date = str(row.get(date_column, "")).strip()
            if not pokemon_name or not date:
                continue
            pokemon = resolve_pokemon(pokemon_name, aliases)
            if not pokemon:
                unresolved.append({"row": row_number, "pokemon": pokemon_name, "region": region, "date": date})
                continue
            rarity = 3 if date == "April" else 1 if date == "July" else 4.5
            acquisition["special"].append({
                "pokemon": pokemon["key"],
                "location": f"Outdoor grass ({region})",
                "method": "Seasonal Migration",
                "period": date,
                "rarity": rarity,
                "details": f"{date}; {rarity}% seasonal pool trigger, then an equal random choice among the documented {region} pool. Levels scale to the lead Pokémon; Repels block these encounters; held items are disabled.",
            })
    acquisition["special"] = ordered_unique(acquisition["special"])
    return unresolved


ITEM_CATEGORIES = {
    "Medicine": "Medicine",
    "TMs/HMs/TDs": "TM & HM",
    "Held Items": "Held Items",
    "Evolution Items": "Evolution",
    "Decorations": "Other",
    "Poke Balls": "Poké Balls",
    "Berries": "Berries",
    "General Items": "Other",
    "Vitamins": "Medicine",
    "Valuable Items": "Valuables",
    "Key Items": "Key Items",
    "Battle Items": "Battle Items",
}


def import_items(rows: dict[int, dict[int, object]], baseline_items: list[dict]) -> tuple[list[dict], list[str]]:
    grouped: dict[str, dict] = {}
    for row_number, row in sorted(rows.items()):
        name = str(row.get(12, "")).strip()
        location = str(row.get(13, "")).strip()
        if row_number < 2 or not name or not location or name == "Item":
            continue
        details = str(row.get(14, "")).strip()
        source = str(row.get(15, "")).strip()
        quantity = str(row.get(16, "")).strip()
        category = ITEM_CATEGORIES.get(str(row.get(17, "")).strip())
        text = location
        annotations = [value for value in (details, source and f"Source: {source}", quantity and f"Qty: {quantity}") if value]
        if annotations:
            text += f" — {'; '.join(annotations)}"
        item = grouped.setdefault(normalise(name), {"name": name, "locations": [], "categories": []})
        item["locations"].append(text)
        if category:
            item["categories"].append(category)

    baseline_by_name = {normalise(item.get("name")): item for item in baseline_items}
    overrides = []
    custom_items = []
    next_id = 50000
    for alias, item in sorted(grouped.items(), key=lambda pair: pair[1]["name"]):
        known = baseline_by_name.get(alias)
        category = Counter(item["categories"]).most_common(1)[0][0] if item["categories"] else (known or {}).get("category", "Other")
        locations = ordered_unique(item["locations"])
        if known:
            overrides.append({"id": known["id"], "name": item["name"], "category": category, "locations": locations, "costs": []})
        else:
            record = {
                "id": next_id,
                "key": slug(item["name"]),
                "name": item["name"],
                "description": "Hack-specific item documented by the 2026-07-01 community workbook; effect text was not supplied.",
                "category": category,
                "sprite": "assets/art/placeholder-icon.svg",
                "locations": locations,
                "costs": [],
                "move": None,
            }
            next_id += 1
            overrides.append(record)
            custom_items.append(item["name"])
    return overrides, custom_items


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def import_workbook(workbook: OpenXmlWorkbook, project_root: Path) -> dict:
    baseline = json.loads((project_root / "data/baseline/guide-data.json").read_text(encoding="utf-8"))
    baseline_items = json.loads((project_root / "data/baseline/items-data.json").read_text(encoding="utf-8"))
    baseline_abilities = json.loads((project_root / "data/baseline/abilities-data.json").read_text(encoding="utf-8"))
    lock = json.loads((project_root / "baseline.lock.json").read_text(encoding="utf-8"))
    if lock.get("status") != "ready":
        raise SystemExit("Fetch the pinned baseline before importing the workbook.")

    pokemon_rows = workbook.rows("Pokemon Data")
    location_rows = workbook.rows("Location Data")
    misc_rows = workbook.rows("Misc Data")
    roster, aliases, custom_forms = workbook_roster(pokemon_rows, baseline)
    evolution_edges, unresolved_evolutions = parse_evolution_edges(roster, aliases)
    move_resolver = MoveResolver(baseline, move_id_index(project_root, lock))
    pokemon_patches, custom_abilities = pokemon_overrides(roster, evolution_edges, move_resolver, baseline, baseline_abilities)
    locations, acquisition, unresolved_acquisition = import_locations(location_rows, aliases)
    battles, unresolved_battle_pokemon = import_battles(location_rows, aliases)
    unresolved_seasonal = import_seasonal(misc_rows, aliases, acquisition)
    item_patches, custom_items = import_items(location_rows, baseline_items)

    guide_override = {
        "meta": {
            "version": "2026-07-01",
            "source": "Crystal Advance Redux community workbook (data current through 2026-07-01), reconciled with official developer changelog through 2026-07-19",
            "limitations": [
                "Post-2026-07-01 Sevii encounter, item and trainer details are not present in the workbook.",
                "Location Data Method values drive the primary encounter subsections; More Info values remain nested labels rather than replacing the encounter method.",
                "July Seasonal Migration uses the official 2026-07-01 changelog correction of a 1% pool trigger.",
                "Move stubs retain identity where the Scarlet/Violet baseline lacks an older or custom move definition.",
            ],
        },
        "pokemon": pokemon_patches,
        "moves": move_resolver.custom_moves,
        "locations": locations,
    }
    write_json(project_root / "data/overrides/guide-data.json", guide_override)
    write_json(project_root / "data/overrides/abilities-data.json", custom_abilities)
    write_json(project_root / "data/overrides/items-data.json", item_patches)
    write_json(project_root / "data/acquisition-data.json", acquisition)
    write_json(project_root / "data/battle-data.json", battles)

    report = {
        "source": str(workbook.path),
        "sourceVersion": "2026-07-01",
        "counts": {
            "workbookPokemon": len(roster),
            "numberedGameDexEntries": sum(1 for entry in roster if entry["gameDexId"] is not None),
            "unnumberedForms": sum(1 for entry in roster if entry["gameDexId"] is None),
            "uniqueGameDexNumbers": len({entry["gameDexId"] for entry in roster if entry["gameDexId"] is not None}),
            "pokemonOverrideRecordsIncludingDeletions": len(pokemon_patches),
            "customOrUnmatchedForms": len(custom_forms),
            "customMoveStubs": len(move_resolver.custom_moves),
            "customAbilityStubs": len(custom_abilities),
            "locations": len(locations),
            "wildEncounterRows": sum(len(location["day"]) for location in locations),
            "wildEncounterSubareas": len({(location["name"], encounter.get("subarea")) for location in locations for encounter in location["day"] if encounter.get("subarea")}),
            "wildEncounterMethodCounts": {method: sum(1 for location in locations for encounter in location["day"] if encounter.get("method") == method) for method in ("Wild", "Tree", "Rock", "Surf", "Fish", "Dive")},
            "fishingRodRows": sum(1 for location in locations for encounter in location["day"] if encounter.get("method") == "Fish" and encounter.get("rod")),
            "oldRodRows": sum(1 for location in locations for encounter in location["day"] if encounter.get("rod") == "Old Rod"),
            "goodRodRows": sum(1 for location in locations for encounter in location["day"] if encounter.get("rod") == "Good Rod"),
            "superRodRows": sum(1 for location in locations for encounter in location["day"] if encounter.get("rod") == "Super Rod"),
            "acquisitionRows": sum(len(values) for values in acquisition.values()),
            "trainerBattles": len(battles["battles"]),
            "vsSeekerRematches": sum(1 for battle in battles["battles"] if battle["rematch"]),
            "bossBattles": sum(1 for battle in battles["battles"] if battle.get("boss")),
            "rivalBattles": sum(1 for battle in battles["battles"] if battle.get("rival")),
            "trainerLocationsWithSubareas": len({battle["location"] for battle in battles["battles"] if battle.get("subarea")}),
            "trainerBattleSubareas": len({(battle["location"], battle["subarea"]) for battle in battles["battles"] if battle.get("subarea")}),
            "trainerInheritedSubareas": sum(1 for battle in battles["battles"] if battle.get("subareaInherited")),
            "trainerBattlesWithSpecificVenues": sum(1 for battle in battles["battles"] if battle.get("venue")),
            "trainerSpecificVenues": len({(battle["location"], battle["venue"]) for battle in battles["battles"] if battle.get("venue")}),
            "trainerVenueFallbackSubareas": sum(1 for battle in battles["battles"] if battle.get("subareaSourceColumn") == "AE"),
            "trainerCompositeVenueSubareas": sum(1 for battle in battles["battles"] if battle.get("subareaSourceColumn") == "AE+AF"),
            "itemOverrides": len(item_patches),
            "customItems": len(custom_items),
        },
        "customOrUnmatchedForms": custom_forms,
        "customMoveStubs": [move["name"] for move in move_resolver.custom_moves],
        "customItems": custom_items,
        "unresolvedEvolutionMethods": unresolved_evolutions,
        "unresolvedAcquisitionRows": unresolved_acquisition,
        "unresolvedBattlePokemon": unresolved_battle_pokemon,
        "unresolvedSeasonalRows": unresolved_seasonal,
    }
    write_json(project_root / "sources/reports/crystal-advance-redux-import-report.json", report)
    return report


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--inspect", action="store_true")
    parser.add_argument("--project-root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    workbook = OpenXmlWorkbook(args.workbook)
    try:
        if args.inspect:
            inspect(workbook)
            return
        report = import_workbook(workbook, args.project_root.resolve())
        print(json.dumps(report["counts"], ensure_ascii=False, indent=2))
    finally:
        workbook.close()


if __name__ == "__main__":
    main()
