"""Cut the stone pillar out of the three divider slices and alpha the rest away.

    python scripts/cutout-divider.py            # write the .webp files
    python scripts/cutout-divider.py --preview  # only write _edges/ proofs

Reads  src/assets/images/divider-stone-{top,middle,bottom}.png
Writes src/assets/images/divider-stone-{top,middle,bottom}.webp   (RGBA)

The problem
-----------
The generated art has fragments of NEIGHBOURING columns down the left and right
edges. A straight vertical crop cannot remove them, because the pillar is not a
constant width: the cornice and the plinth deliberately flare wider than the
shaft, and on `bottom` a neighbour fragment sits at the same columns the plinth
legitimately occupies. Cutting at one column either clips the plinth corner or
keeps part of the neighbour.

The method
----------
What separates the pillar from its neighbours is a near-black moat, so segment
rather than crop:

  1. bright = luminance > BRIGHT. The pillar and each neighbour fragment become
     separate blobs; the moat is the gap between them.
  2. Keep only blobs touching the centre columns -> `core`. Neighbour fragments
     never reach the centre, so they are dropped here.
  3. Flood the image border through everything not in `core`. What the flood
     cannot reach is either the pillar or a hole inside it -- which is how the
     rook's near-black arch survives without being punched out.
  4. Dilate a little, because step 3 cuts at the pillar's bright edge and the
     pillar's own dark outline reads as part of the stone.

All three slices are then cropped to ONE shared window, so the cornice keeps its
overhang over the shaft instead of every piece being scaled to the same width.
"""

import pathlib
import sys
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES = ROOT / "src" / "assets" / "images"
PROOFS = ROOT / "_edges"

PARTS = ("top", "middle", "bottom")
BRIGHT = 22        # above this is stone, below is moat/shadow
CENTRE_BAND = 6    # half-width of the strip a blob must touch to count as pillar
DILATE = 2         # px of the pillar's own dark outline to keep
NAV_BG = (44, 37, 30)   # SURFACE_700, for the proof sheet
WEBP_QUALITY = 88


def keep_mask(im):
    """Boolean grid of pixels belonging to the pillar."""
    w, h = im.size
    px = im.convert("RGB").load()
    bright = [[sum(px[x, y]) / 3 > BRIGHT for x in range(w)] for y in range(h)]

    # --- 1&2: blobs touching the centre band -------------------------------
    core = [[False] * w for _ in range(h)]
    seen = [[False] * w for _ in range(h)]
    c0, c1 = w // 2 - CENTRE_BAND, w // 2 + CENTRE_BAND
    for y in range(h):
        for x in range(c0, c1 + 1):
            if not bright[y][x] or seen[y][x]:
                continue
            q = deque([(x, y)])
            seen[y][x] = True
            while q:
                cx, cy = q.popleft()
                core[cy][cx] = True
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and bright[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        q.append((nx, ny))

    # --- 3: flood the border through everything that is not core -----------
    outside = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not core[y][x] and not outside[y][x]:
                outside[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not core[y][x] and not outside[y][x]:
                outside[y][x] = True
                q.append((x, y))
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
            if 0 <= nx < w and 0 <= ny < h and not core[ny][nx] and not outside[ny][nx]:
                outside[ny][nx] = True
                q.append((nx, ny))

    keep = [[not outside[y][x] for x in range(w)] for y in range(h)]

    # --- 4: dilate to re-include the pillar's dark outline -----------------
    for _ in range(DILATE):
        grown = [row[:] for row in keep]
        for y in range(h):
            for x in range(w):
                if keep[y][x]:
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                               (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and keep[ny][nx]:
                        grown[y][x] = True
                        break
        keep = grown
    return keep


def bounds(keep, w, h):
    """Robust left/right edge of the silhouette.

    Segmentation alone is not enough on `top` and `bottom`: a few rows have a
    bright bridge across the moat, so the neighbour joins the pillar's blob and
    the raw extent runs the full 66px. But those rows are a minority -- the
    per-row edge is 5-6 on the clear majority -- so take the median rather than
    the extreme. The pillar is a near-constant-width column, which is exactly
    the case where a median edge is the right summary.
    """
    lefts, rights = [], []
    for y in range(h):
        row = keep[y]
        l = next((x for x in range(w) if row[x]), None)
        if l is None:
            continue
        lefts.append(l)
        rights.append(next(x for x in range(w - 1, -1, -1) if row[x]))
    lefts.sort()
    rights.sort()
    return lefts[len(lefts) // 2], rights[len(rights) // 2]


def main(preview_only=False):
    cut, edges = {}, {}
    for part in PARTS:
        im = Image.open(IMAGES / f"divider-stone-{part}.png").convert("RGBA")
        keep = keep_mask(im)
        w, h = im.size
        l, r = bounds(keep, w, h)
        edges[part] = (l, r)

        raw = [x for x in range(w) if any(keep[y][x] for y in range(h))]
        print(f"  {part:7} {w}x{h}  blob x {raw[0]}-{raw[-1]}  median edge x {l}-{r}")

        # Combine: segmentation removes what the moat isolates, the median edge
        # removes what bridged across it.
        alpha = Image.new("L", (w, h), 0)
        ap = alpha.load()
        for y in range(h):
            for x in range(l, r + 1):
                if keep[y][x]:
                    ap[x, y] = 255
        im.putalpha(alpha)
        cut[part] = im

    # One shared crop window across all three, so the capitals keep whatever
    # overhang they have over the shaft instead of each being scaled to fit.
    lo = min(l for l, _ in edges.values())
    hi = max(r for _, r in edges.values()) + 1
    print(f"  shared window x {lo}-{hi}  ->  {hi - lo}px wide")

    PROOFS.mkdir(exist_ok=True)
    for part, im in cut.items():
        out = im.crop((lo, 0, hi, im.height))

        # Proof sheet: the cutout over the nav colour, magnified 8x.
        proof = Image.new("RGB", out.size, NAV_BG)
        proof.paste(out, (0, 0), out)
        proof.resize((proof.width * 8, proof.height * 8), Image.NEAREST) \
             .save(PROOFS / f"{part}-cutout.png")

        if not preview_only:
            dest = IMAGES / f"divider-stone-{part}.webp"
            out.save(dest, quality=WEBP_QUALITY, method=6)
            print(f"  wrote {dest.name}  {out.size[0]}x{out.size[1]}  "
                  f"{dest.stat().st_size / 1024:.1f} KB")

    return hi - lo


if __name__ == "__main__":
    width = main("--preview" in sys.argv)
    print(f"\n  DIVIDER source width is now {width}px (was 66)")
