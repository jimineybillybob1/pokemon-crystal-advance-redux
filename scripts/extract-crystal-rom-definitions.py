#!/usr/bin/env python3
"""Extract move and item definitions from the version-matched Crystal Advance Redux ROM.

The offsets below are validated against the 2026-07-19 ROM hash and table
signatures before any output is written. The script maps compact ROM move IDs
to the guide's name-based IDs so ROM trainer parties can resolve later moves
without treating the ROM ID as a PokeAPI ID.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import struct
import unicodedata
from collections import Counter
from pathlib import Path


EXPECTED_SHA256 = "716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B"
MOVE_DATA_BASE = 0x01500000
MOVE_DATA_STRIDE = 12
MOVE_NAME_BASE = 0x01501800
MOVE_NAME_LENGTH = 13
MOVE_DESCRIPTION_POINTERS = 0x01504000
MOVE_COUNT = 512
ITEM_DATA_BASE = 0x01E22290
ITEM_DATA_STRIDE = 44
ITEM_NAME_LENGTH = 14
ITEM_COUNT = 375

TYPE_NAMES = {
    0: "Normal",
    1: "Fighting",
    2: "Flying",
    3: "Poison",
    4: "Ground",
    5: "Rock",
    6: "Bug",
    7: "Ghost",
    8: "Steel",
    9: "Normal",
    10: "Fire",
    11: "Water",
    12: "Grass",
    13: "Electric",
    14: "Psychic",
    15: "Ice",
    16: "Dragon",
    17: "Dark",
    23: "Fairy",
}

CHARMAP = {
    0x00: " ",
    0x01: "À", 0x02: "Á", 0x03: "Â", 0x04: "Ç", 0x05: "È", 0x06: "É",
    0x07: "Ê", 0x08: "Ë", 0x09: "Ì", 0x0B: "Î", 0x0C: "Ï", 0x0D: "Ò",
    0x0E: "Ó", 0x0F: "Ô", 0x10: "Œ", 0x11: "Ù", 0x12: "Ú", 0x13: "Û",
    0x14: "Ñ", 0x15: "ß", 0x16: "à", 0x17: "á", 0x19: "ç", 0x1A: "è",
    0x1B: "é", 0x1C: "ê", 0x1D: "ë", 0x1E: "ì", 0x20: "î", 0x21: "ï",
    0x22: "ò", 0x23: "ó", 0x24: "ô", 0x25: "œ", 0x26: "ù", 0x27: "ú",
    0x28: "û", 0x29: "ñ", 0x2A: "º", 0x2B: "ª", 0x2D: "&", 0x2E: "+",
    0x35: "=", 0x36: ";", 0x5B: "%", 0x5C: "(", 0x5D: ")", 0x68: "â",
    0x6F: "í", 0x85: "<", 0x86: ">", 0xAB: "!", 0xAC: "?", 0xAD: ".",
    0xAE: "-", 0xAF: "·", 0xB0: "…", 0xB1: "“", 0xB2: "”", 0xB3: "‘",
    0xB4: "’", 0xB5: "♂", 0xB6: "♀", 0xB7: "¥", 0xB8: ",", 0xB9: "×",
    0xBA: "/", 0xEF: "▶", 0xF0: ":", 0xF1: "Ä", 0xF2: "Ö", 0xF3: "Ü",
    0xF4: "ä", 0xF5: "ö", 0xF6: "ü",
}
CHARMAP.update({value: chr(ord("0") + value - 0xA1) for value in range(0xA1, 0xAB)})
CHARMAP.update({value: chr(ord("A") + value - 0xBB) for value in range(0xBB, 0xD5)})
CHARMAP.update({value: chr(ord("a") + value - 0xD5) for value in range(0xD5, 0xEF)})

# The hack uses a few compressed glyph tokens in late move names. Naming them
# explicitly is safer than guessing a general-purpose token expansion table.
ROM_MOVE_NAME_FIXES = {
    136: "High Jump Kick",
    164: "Psychic Fangs",
    444: "Triple Swipe",
    462: "Baby-Doll Eyes",
    465: "Draining Kiss",
    466: "Dazzling Gleam",
    467: "Disarming Voice",
    478: "Flower Shield",
    480: "Mystical Fire",
    496: "Dual Wingbeat",
}

ROM_ONLY_GUIDE_MOVES = {
    444: {
        "id": 30444,
        "key": "triple-swipe",
        "name": "Triple Swipe",
        "category": "Physical",
        "categoryEvidence": "Inferred from the ROM contact flag and physical tail-strike effect text; the ROM table has no self-describing category field.",
    },
}

MOVE_NAME_ALIASES = {
    "vicegrip": "visegrip",
    "doubleslap": "doubleslap",
    "feintattack": "faintattack",
    "highjumpkick": "hijumpkick",
    "smellingsalts": "smellingsalt",
}


def normalise(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(character for character in text if not unicodedata.combining(character))
    return re.sub(r"[^a-z0-9]", "", text.lower())


def canonical_move_name(value: object) -> str:
    key = normalise(value)
    return MOVE_NAME_ALIASES.get(key, key)


def decode_text(data: bytes, start: int, limit: int) -> tuple[str, list[int]]:
    output: list[str] = []
    unknown: list[int] = []
    for value in data[start : start + limit]:
        if value == 0xFF:
            break
        if value in (0xFA, 0xFB, 0xFE):
            output.append(" ")
        elif value in CHARMAP:
            output.append(CHARMAP[value])
        else:
            unknown.append(value)
            output.append(f"<{value:02X}>")
    return re.sub(r"\s+", " ", "".join(output)).strip(), unknown


def rom_pointer_offset(pointer: int, size: int) -> int | None:
    if 0x08000000 <= pointer < 0x08000000 + size:
        return pointer - 0x08000000
    return None


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def deep_merge(base: object, patch: object) -> object:
    """Mirror the guide merger for a stable pre-ROM comparison dataset."""
    if not isinstance(base, dict) or not isinstance(patch, dict):
        return copy.deepcopy(patch)
    result = copy.deepcopy(base)
    for key, value in patch.items():
        if key.startswith("$") or key == "_provenance":
            continue
        result[key] = deep_merge(result.get(key), value) if isinstance(value, dict) else copy.deepcopy(value)
    return result


def merge_by_id(baseline: list[dict], overrides: list[dict]) -> list[dict]:
    """Build the documented baseline+workbook view without prior ROM patches."""
    records = {int(record["id"]): copy.deepcopy(record) for record in baseline}
    order = [int(record["id"]) for record in baseline]
    for patch in overrides:
        record_id = int(patch["id"])
        if patch.get("$delete") is True:
            records.pop(record_id, None)
            continue
        if record_id not in records:
            records[record_id] = {}
            order.append(record_id)
        records[record_id] = deep_merge(records[record_id], patch)
    return [records[record_id] for record_id in order if record_id in records]


def validate_rom(data: bytes, digest: str) -> None:
    if digest.upper() != EXPECTED_SHA256:
        raise SystemExit(f"Unsupported ROM hash {digest}; expected the 2026-07-19 ROM {EXPECTED_SHA256}.")
    expected = {
        1: bytes((0, 40, 0, 100, 35)),
        2: bytes((43, 50, 1, 100, 25)),
        3: bytes((29, 15, 0, 85, 10)),
    }
    for move_id, signature in expected.items():
        start = MOVE_DATA_BASE + move_id * MOVE_DATA_STRIDE
        if data[start : start + len(signature)] != signature:
            raise SystemExit(f"Move-table signature failed at ROM move {move_id}.")
    pound, unknown = decode_text(data, MOVE_NAME_BASE + MOVE_NAME_LENGTH, MOVE_NAME_LENGTH)
    if pound != "Pound" or unknown:
        raise SystemExit("Move-name table signature failed.")
    master_ball, unknown = decode_text(data, ITEM_DATA_BASE + ITEM_DATA_STRIDE, ITEM_NAME_LENGTH)
    if master_ball != "Master Ball" or unknown:
        raise SystemExit("Item-table signature failed.")


def extract_moves(data: bytes, guide_moves: list[dict]) -> tuple[list[dict], dict]:
    guide_by_id = {int(move["id"]): move for move in guide_moves}
    guide_by_name = {canonical_move_name(move.get("name")): move for move in guide_moves}
    type_colours = {move.get("type"): move.get("typeColour") for move in guide_moves if move.get("typeColour")}
    patches: list[dict] = []
    records: list[dict] = []
    unmatched: list[dict] = []
    ambiguous: list[dict] = []
    descriptions_with_unknown_bytes: list[dict] = []
    changed_field_counts: Counter[str] = Counter()
    stat_changes: list[dict] = []

    for rom_id in range(1, MOVE_COUNT):
        raw_name, name_unknown = decode_text(data, MOVE_NAME_BASE + rom_id * MOVE_NAME_LENGTH, MOVE_NAME_LENGTH)
        name = ROM_MOVE_NAME_FIXES.get(rom_id, raw_name)
        if not name or name in {"-", "BLANK"}:
            continue

        id_move = guide_by_id.get(rom_id) if rom_id <= 354 else None
        name_match = guide_by_name.get(canonical_move_name(name))
        if id_move and name_match and int(id_move["id"]) != int(name_match["id"]):
            ambiguous.append({"romId": rom_id, "romName": name, "idMatch": id_move["name"], "nameMatch": name_match["name"]})
        guide_move = name_match
        if not guide_move and id_move and canonical_move_name(id_move.get("name")) == canonical_move_name(name):
            guide_move = id_move

        start = MOVE_DATA_BASE + rom_id * MOVE_DATA_STRIDE
        effect, power, type_id, accuracy, pp, secondary, target, priority = struct.unpack_from("<BBBBBBBb", data, start)
        flags = struct.unpack_from("<I", data, start + 8)[0]
        description_pointer = struct.unpack_from("<I", data, MOVE_DESCRIPTION_POINTERS + (rom_id - 1) * 4)[0]
        description_offset = rom_pointer_offset(description_pointer, len(data))
        description = ""
        description_unknown: list[int] = []
        if description_offset is not None:
            description, description_unknown = decode_text(data, description_offset, 512)

        record = {
            "romId": rom_id,
            "name": name,
            "effectId": effect,
            "power": None if power <= 1 else power,
            "typeId": type_id,
            "type": TYPE_NAMES.get(type_id, f"Unknown type {type_id}"),
            "accuracy": None if accuracy == 0 else accuracy,
            "pp": pp,
            "secondaryEffectChance": secondary,
            "targetId": target,
            "priority": priority,
            "flags": flags,
            "description": description,
        }
        records.append(record)

        custom_definition = ROM_ONLY_GUIDE_MOVES.get(rom_id)
        if not guide_move and not custom_definition:
            unmatched.append({"romId": rom_id, "name": name})
            continue
        if name_unknown and rom_id not in ROM_MOVE_NAME_FIXES:
            unmatched.append({"romId": rom_id, "name": name, "reason": "name contains undecoded bytes"})
            continue
        if description_unknown:
            descriptions_with_unknown_bytes.append({
                "romId": rom_id,
                "name": name,
                "bytes": sorted(set(description_unknown)),
                "text": description,
            })

        resolved_type = record["type"]
        patch = {
            "id": int((guide_move or custom_definition)["id"]),
            "romId": rom_id,
            **({
                "key": custom_definition["key"],
                "name": custom_definition["name"],
                "category": custom_definition["category"],
                "categoryEvidence": custom_definition["categoryEvidence"],
            } if custom_definition else {}),
            "type": resolved_type,
            "typeColour": type_colours.get(resolved_type, (guide_move or {}).get("typeColour", "#888888")),
            "power": record["power"],
            "accuracy": record["accuracy"],
            "pp": pp,
            "priority": priority,
        }
        if description and not description_unknown:
            patch["description"] = description
        patches.append(patch)
        if guide_move:
            changes = {}
            for field in ("type", "power", "accuracy", "pp", "priority", "description"):
                if patch.get(field) != guide_move.get(field):
                    changed_field_counts[field] += 1
                    if field != "description":
                        changes[field] = {"guide": guide_move.get(field), "rom": patch.get(field)}
            if changes:
                stat_changes.append({"romId": rom_id, "id": guide_move["id"], "name": guide_move["name"], "changes": changes})

    return patches, {
        "records": records,
        "matched": len(patches),
        "unmatched": unmatched,
        "ambiguous": ambiguous,
        "descriptionsWithUnknownBytes": descriptions_with_unknown_bytes,
        "typeCounts": dict(sorted(Counter(record["type"] for record in records).items())),
        "changedFieldCounts": dict(sorted(changed_field_counts.items())),
        "statChanges": stat_changes,
    }


def extract_items(data: bytes, guide_items: list[dict]) -> tuple[list[dict], dict]:
    guide_by_name: dict[str, list[dict]] = {}
    for item in guide_items:
        guide_by_name.setdefault(normalise(item.get("name")), []).append(item)

    patches: list[dict] = []
    records: list[dict] = []
    unmatched: list[dict] = []
    ambiguous: list[dict] = []
    descriptions_with_unknown_bytes: list[dict] = []
    placeholder_descriptions_replaced = 0

    for rom_id in range(1, ITEM_COUNT):
        start = ITEM_DATA_BASE + rom_id * ITEM_DATA_STRIDE
        stored_id = struct.unpack_from("<H", data, start + 14)[0]
        if stored_id != rom_id:
            raise SystemExit(f"Item-table sequence failed at item {rom_id}: stored ID {stored_id}.")
        name, name_unknown = decode_text(data, start, ITEM_NAME_LENGTH)
        description_pointer = struct.unpack_from("<I", data, start + 20)[0]
        description_offset = rom_pointer_offset(description_pointer, len(data))
        description = ""
        description_unknown: list[int] = []
        if description_offset is not None:
            description, description_unknown = decode_text(data, description_offset, 512)
        price = struct.unpack_from("<I", data, start + 16)[0]
        records.append({"romId": rom_id, "name": name, "price": price, "description": description})

        matches = guide_by_name.get(normalise(name), [])
        if not matches:
            unmatched.append({"romId": rom_id, "name": name})
            continue
        if len(matches) > 1:
            ambiguous.append({"romId": rom_id, "name": name, "guideIds": [item["id"] for item in matches]})
            continue
        if name_unknown:
            unmatched.append({"romId": rom_id, "name": name, "reason": "name contains undecoded bytes"})
            continue
        if description_unknown:
            descriptions_with_unknown_bytes.append({
                "romId": rom_id,
                "name": name,
                "bytes": sorted(set(description_unknown)),
                "text": description,
            })

        patch = {"id": int(matches[0]["id"]), "romId": rom_id}
        if description and not description_unknown:
            patch["description"] = description
            if str(matches[0].get("description", "")).startswith("Hack-specific item documented"):
                placeholder_descriptions_replaced += 1
        patches.append(patch)

    return patches, {
        "records": records,
        "matched": len(patches),
        "unmatched": unmatched,
        "ambiguous": ambiguous,
        "descriptionsWithUnknownBytes": descriptions_with_unknown_bytes,
        "placeholderDescriptionsReplaced": placeholder_descriptions_replaced,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("rom", type=Path)
    parser.add_argument("--project-root", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--write", action="store_true", help="Write override and report files after validation.")
    args = parser.parse_args()
    root = args.project_root.resolve()
    data = args.rom.read_bytes()
    digest = hashlib.sha256(data).hexdigest().upper()
    validate_rom(data, digest)

    baseline_guide = read_json(root / "data/baseline/guide-data.json")
    override_guide = read_json(root / "data/overrides/guide-data.json")
    baseline_items = read_json(root / "data/baseline/items-data.json")
    override_items = read_json(root / "data/overrides/items-data.json")
    documented_moves = merge_by_id(baseline_guide.get("moves", []), override_guide.get("moves", []))
    documented_items = merge_by_id(baseline_items, override_items)
    move_patches, move_report = extract_moves(data, documented_moves)
    item_patches, item_report = extract_items(data, documented_items)
    report = {
        "source": args.rom.name,
        "sourceVersion": "2026-07-19",
        "sha256": digest,
        "tableLayout": {
            "moveData": f"0x{MOVE_DATA_BASE:08X}",
            "moveNames": f"0x{MOVE_NAME_BASE:08X}",
            "moveDescriptions": f"0x{MOVE_DESCRIPTION_POINTERS:08X}",
            "itemData": f"0x{ITEM_DATA_BASE:08X}",
        },
        "counts": {
            "romMoveRecords": len(move_report["records"]),
            "matchedGuideMoves": move_report["matched"],
            "unmatchedRomMoves": len(move_report["unmatched"]),
            "romItemRecords": len(item_report["records"]),
            "matchedGuideItems": item_report["matched"],
            "unmatchedRomItems": len(item_report["unmatched"]),
        },
        "moves": move_report,
        "items": item_report,
        "limitations": [
            "The move record exposes type, power, accuracy, PP, priority, effect ID, secondary-effect chance, target and flags, but not a self-describing physical/special category label.",
            "Move categories remain the pinned mainline fallback unless independently documented; ROM power 0 and 1 are represented as non-literal variable/status power.",
            "An internal item price does not prove shop availability, so ROM prices are retained in the audit report and are not imported as purchase locations.",
        ],
    }

    if args.write:
        write_json(root / "data/overrides/rom-move-data.json", move_patches)
        write_json(root / "data/overrides/rom-item-data.json", item_patches)
        write_json(root / "sources/reports/rom-definition-audit-2026-09-28.json", report)

    print(json.dumps(report["counts"], indent=2))
    print(json.dumps({
        "moveAmbiguities": move_report["ambiguous"],
        "moveDescriptionDecodeIssues": len(move_report["descriptionsWithUnknownBytes"]),
        "itemAmbiguities": item_report["ambiguous"],
        "itemDescriptionDecodeIssues": len(item_report["descriptionsWithUnknownBytes"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
