#!/usr/bin/env python3
"""Generate simple solid-color PNG icons for the extension (stdlib only)."""

import struct
import zlib
from pathlib import Path

ACCENT = (108, 158, 255)  # #6c9eff
ROOT = Path(__file__).resolve().parent.parent / "icons"


def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    chunk = chunk_type + data
    return struct.pack(">I", len(data)) + chunk + struct.pack(">I", zlib.crc32(chunk) & 0xFFFFFFFF)


def write_solid_png(path: Path, size: int, rgb: tuple[int, int, int]) -> None:
    raw_rows = []
    r, g, b = rgb
    row = b"\x00" + bytes((r, g, b)) * size
    raw_rows.append(row)
    for _ in range(size - 1):
        raw_rows.append(b"\x00" + row[1:])

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"".join(raw_rows), 9)

    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", idat)
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for size in (16, 48, 128):
        write_solid_png(ROOT / f"icon{size}.png", size, ACCENT)
    print(f"Wrote icons to {ROOT}")


if __name__ == "__main__":
    main()
