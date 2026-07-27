#!/usr/bin/env python3
"""Import the user-supplied custom-form sprites losslessly."""

from __future__ import annotations

import argparse
import hashlib
import shutil
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CANVAS_SIZE = (96, 96)
EXPECTED_HASHES = {
    "blastoise_clone": "B13B874F7D8D718DDE7D6123D9EE77053E6A29876AA299DBCFF53975A109A573",
    "charizard_clone": "5F21AC1445570F63B478586B5156FE78FC386C1005A599BC09BAFB2217976628",
    "venusaur_clone": "83F19092B5470841F4FF65AD640D1654C570352CF126E574B027B70DBED2FB0D",
    "armoured_mewtwo": "9883D278BD723285276D0B78F8DA2976B49B4E9FE3048903932EBAA67B7616AB",
    "xd001": "F002CB11D3E45FA70CAE489278250C5745F2F644EAD872355F88444F991AF79E",
}
OUTPUT_NAMES = {
    "blastoise_clone": "blastoise-clone.png",
    "charizard_clone": "charizard-clone.png",
    "venusaur_clone": "venusaur-clone.png",
    "armoured_mewtwo": "armoured-mewtwo.png",
    "xd001": "xd001.png",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def opaque_components(image: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    components: list[tuple[int, tuple[int, int, int, int]]] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            points: list[tuple[int, int]] = []
            while stack:
                point_x, point_y = stack.pop()
                points.append((point_x, point_y))
                for neighbour in (
                    (point_x - 1, point_y),
                    (point_x + 1, point_y),
                    (point_x, point_y - 1),
                    (point_x, point_y + 1),
                ):
                    neighbour_x, neighbour_y = neighbour
                    if (
                        0 <= neighbour_x < width
                        and 0 <= neighbour_y < height
                        and pixels[neighbour_x, neighbour_y] > 0
                        and neighbour not in seen
                    ):
                        seen.add(neighbour)
                        stack.append(neighbour)
            xs = [point[0] for point in points]
            ys = [point[1] for point in points]
            components.append(
                (len(points), (min(xs), min(ys), max(xs) + 1, max(ys) + 1))
            )
    return sorted(components, reverse=True)


def centre_on_canvas(sprite: Image.Image) -> Image.Image:
    bounds = sprite.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("Source sprite contains no visible pixels")
    sprite = sprite.crop(bounds)
    if sprite.width > CANVAS_SIZE[0] or sprite.height > CANVAS_SIZE[1]:
        raise ValueError(
            f"Visible sprite {sprite.size} does not fit the {CANVAS_SIZE} canvas"
        )
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    offset = (
        (CANVAS_SIZE[0] - sprite.width) // 2,
        (CANVAS_SIZE[1] - sprite.height) // 2,
    )
    canvas.alpha_composite(sprite, offset)
    return canvas


def load_sprite(kind: str, source: Path) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    if kind == "armoured_mewtwo":
        candidates = [
            component
            for component in opaque_components(image)
            if component[1][0] < image.width // 3 and component[1][1] >= 30
        ]
        if not candidates:
            raise ValueError("Could not find the large far-left Armoured Mewtwo sprite")
        _, bounds = max(candidates, key=lambda component: component[0])
        if bounds != (22, 36, 86, 128):
            raise ValueError(f"Unexpected Armoured Mewtwo crop bounds: {bounds}")
        return image.crop(bounds)
    if kind == "xd001":
        candidates = [
            component
            for component in opaque_components(image)
            if component[1][0] < image.width // 2 and component[1][1] >= image.height // 2
        ]
        if not candidates:
            raise ValueError("Could not find the large bottom-left XD001 sprite")
        _, bounds = max(candidates, key=lambda component: component[0])
        if bounds != (8, 171, 104, 258):
            raise ValueError(f"Unexpected XD001 crop bounds: {bounds}")
        return image.crop(bounds)
    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    for kind in EXPECTED_HASHES:
        parser.add_argument(f"--{kind.replace('_', '-')}", required=True, type=Path)
    args = parser.parse_args()
    sources = {
        kind: getattr(args, kind)
        for kind in EXPECTED_HASHES
    }
    archive_dir = ROOT / "sources" / "inbox" / "custom-form-sprites-2026-07-27"
    output_dir = ROOT / "assets" / "pokemon"
    archive_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    for kind, source in sources.items():
        source = source.resolve()
        actual_hash = sha256(source)
        if actual_hash != EXPECTED_HASHES[kind]:
            raise ValueError(
                f"{source.name} SHA-256 {actual_hash} does not match the supplied file"
            )
        shutil.copy2(source, archive_dir / source.name)
        output = output_dir / OUTPUT_NAMES[kind]
        centre_on_canvas(load_sprite(kind, source)).save(output, optimize=True)
        print(f"{kind}: {output.relative_to(ROOT)} ({sha256(output)})")


if __name__ == "__main__":
    main()
