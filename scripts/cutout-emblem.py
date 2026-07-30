"""Cut a bright emblem out of a dark backing, trim it, and save it as WebP.

    python scripts/cutout-emblem.py close
    python scripts/cutout-emblem.py close --preview     # proof sheet only
    python scripts/cutout-emblem.py close --t0 10 --t1 24

Reads  src/assets/images/<name>.png
Writes src/assets/images/<name>.webp   (RGBA, trimmed)

For one-off art that arrives as a screenshot crop: opaque, subject brightly lit,
backing near-black. `scripts/trim-image.py` cannot help — that one assumes the
background is already transparent and only removes padding.

Two details that matter more than the threshold:

  * Flood from the border rather than thresholding globally, so dark detail
    ENCLOSED by the subject survives. A plain cut punches holes in it.
  * Keep the ramp low and narrow. Reaching too far up the luminance range eats
    the subject's own dark outline and leaves it looking shaved — that is what
    happened to the dialog frame edges before they were excluded from cutting.
"""

import argparse
import pathlib
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IM = ROOT / "src" / "assets" / "images"
BANDS = [("plaque", (0x12, 0x33, 0x6e)), ("paper", (0x21, 0x1c, 0x17)),
         ("white", (0xff, 0xff, 0xff)), ("magenta", (0xff, 0x00, 0xff))]


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def cutout(path, t0, t1):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    soft = [[min(1.0, max(0.0, (lum(px[x, y]) - t0) / (t1 - t0))) for x in range(w)]
            for y in range(h)]

    outside = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if soft[y][x] < 0.98 and not outside[y][x]:
                outside[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if soft[y][x] < 0.98 and not outside[y][x]:
                outside[y][x] = True
                q.append((x, y))
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < w and 0 <= ny < h and not outside[ny][nx] and soft[ny][nx] < 0.98:
                outside[ny][nx] = True
                q.append((nx, ny))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            a = soft[y][x] if outside[y][x] else 1.0
            if a > 0:
                op[x, y] = (*px[x, y], round(a * 255))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--t0", type=float, default=12.0)
    ap.add_argument("--t1", type=float, default=28.0)
    ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()

    src = IM / f"{a.name}.png"
    raw = cutout(src, a.t0, a.t1)
    box = raw.getchannel("A").getbbox()
    art = raw.crop(box)
    print(f"  {a.name}: {Image.open(src).size} -> {art.size}  (ramp {a.t0:.0f}-{a.t1:.0f})")

    if not a.preview:
        dest = IM / f"{a.name}.webp"
        art.save(dest, lossless=True, method=6)
        print(f"  wrote {dest.name}  {Image.open(src).size and src.stat().st_size / 1024:.1f} KB -> "
              f"{dest.stat().st_size / 1024:.1f} KB")

    # Proof. White and magenta are the point: a residual dark halo is invisible
    # on a dark surface and unmissable on those.
    pad, size = 12, 26
    bw = pad * 3 + art.width + size
    sheet = Image.new("RGB", (bw, (art.height + pad * 2) * len(BANDS)), (0, 0, 0))
    bh = art.height + pad * 2
    for i, (_, colour) in enumerate(BANDS):
        band = Image.new("RGB", (bw, bh), colour)
        band.paste(art, (pad, pad), art)
        small = art.copy()
        small.thumbnail((size, size), Image.LANCZOS)
        band.paste(small, (pad * 2 + art.width, pad + (art.height - small.height) // 2), small)
        sheet.paste(band, (0, i * bh))
    proof = ROOT / f"_{a.name}_proof.png"
    sheet.resize((sheet.width * 4, sheet.height * 4), Image.LANCZOS).save(proof)
    print(f"  proof -> {proof.name}   (also shown at {size}px, the render size)")


if __name__ == "__main__":
    main()
