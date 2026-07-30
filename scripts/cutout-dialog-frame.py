"""Cut the eight dialog border slices out of their dark backing and trim them.

    python scripts/cutout-dialog-frame.py            # write the .webp files
    python scripts/cutout-dialog-frame.py --preview  # proof sheet only

Reads  src/assets/images/dialog-{top-left,top,top-right,left,right,
                                 bottom-left,bottom,bottom-right}.png
Writes the same names as .webp, RGBA and trimmed.

These are hand-cropped, so nothing about them is uniform: the corners are four
different sizes (53x63, 49x68, 52x56, 50x53), none of them starts its stone at
pixel 0, and every piece carries dark backing both outside the band and inside
the corner elbows. That rules out CSS `border-image`, which needs one image with
consistent insets — the frame has to be composed from eight positioned pieces
instead, and for that each piece must be trimmed to its own art.

Cutting is by luminance, not hue: here the art is bright stone (mean 50-176) on
near-black backing (mean 7-23), which is the opposite of the small-icons case
and a much easier separation. The flood-from-border step still matters though —
it protects the dark mortar lines *inside* the stone, which a plain threshold
would punch out.
"""

import pathlib
import sys
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IM = ROOT / "src" / "assets" / "images"
PROOF = ROOT / "_frame_proof.png"

# Only the CORNERS have backing to remove — their elbows enclose dark fill.
# The four edges are solid stone bars: measured fully opaque, bbox = whole
# frame, nothing to cut. Running them through the cutter was a mistake that
# showed up as transparency in their darker pixels, and the trim then shaved
# real art off the right and bottom edges (29->28 and 29->27).
CORNERS = ["dialog-top-left", "dialog-top-right",
           "dialog-bottom-left", "dialog-bottom-right"]
EDGES = ["dialog-top", "dialog-bottom", "dialog-left", "dialog-right"]
PARTS = CORNERS + EDGES

# Deliberately low and narrow. The backing sits at luminance 7-23 and the stone
# at 50-176, so there is no reason to reach up into the 60s — doing so is what
# made shadowed stone semi-transparent.
T0, T1 = 16.0, 32.0
SURFACE = (0x21, 0x1c, 0x17)   # SURFACE_800, for the proof sheet


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def cut(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()

    soft = [[min(1.0, max(0.0, (lum(px[x, y]) - T0) / (T1 - T0))) for x in range(w)]
            for y in range(h)]

    # Flood the border through anything not fully opaque. What the flood cannot
    # reach is stone, or a mortar line enclosed by stone.
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


def main(preview_only=False):
    cuts = {}
    for name in PARTS:
        src = IM / f"{name}.png"
        if name in EDGES:
            # Straight conversion: fully opaque, nothing to cut or trim. The
            # band thickness is load-bearing for aligning edges to corners, so
            # trimming across it is what created the 1px seating gaps.
            art = Image.open(src).convert("RGBA")
            print(f"  {name:22} {art.size} -> {art.size}   edge, kept whole")
        else:
            raw = cut(src)
            box = raw.getchannel("A").getbbox()
            art = raw.crop(box)
            print(f"  {name:22} {Image.open(src).size} -> {art.size}   "
                  f"trimmed L{box[0]} T{box[1]} R{Image.open(src).width - box[2]} "
                  f"B{Image.open(src).height - box[3]}")
        cuts[name] = art
        if not preview_only:
            dest = IM / f"{name}.webp"
            art.save(dest, lossless=True, method=6)

    if not preview_only:
        total = sum((IM / f"{n}.webp").stat().st_size for n in PARTS) / 1024
        before = sum((IM / f"{n}.png").stat().st_size for n in PARTS) / 1024
        print(f"\n  {before:.0f} KB -> {total:.0f} KB")

    # Proof: every piece on the dialog surface, plus the band thickness of each.
    pad = 12
    W = sum(a.width for a in cuts.values()) + pad * (len(cuts) + 1)
    H = max(a.height for a in cuts.values()) + pad * 2
    sheet = Image.new("RGB", (W, H), SURFACE)
    x = pad
    for a in cuts.values():
        sheet.paste(a, (x, pad), a)
        x += a.width + pad
    sheet.resize((W * 2, H * 2), Image.LANCZOS).save(PROOF)
    print(f"  proof -> {PROOF.name}")
    return cuts


if __name__ == "__main__":
    main("--preview" in sys.argv)
