"""Cut the screenshot background off the nav-only small icons.

    python scripts/cutout-small-icons.py             # write the .webp files
    python scripts/cutout-small-icons.py --preview   # proof sheet only

Reads  src/assets/images/small-icons/*.png
Writes src/assets/images/small-icons/*.webp   (RGBA, trimmed, square)

These are screenshot crops, so three things have to happen and only the first is
obvious.

1. Remove the background. A flat threshold is not safe: the art has a dark
   outline whose luminance is close to the dark background. What separates them
   is colour, not brightness -- the backgrounds are cool (slate b-r=+15, or navy
   b-r=+90) while the outline is neutral. So the test is distance from the
   measured background colour, and the tolerance is derived from how much that
   background actually varies (play-small sits on a gradient, the others do not).

2. Keep the edge soft. A binary mask on a 45px source shown at ~22px looks
   chewed. Alpha ramps over the colour-distance band instead.

3. Unmix the background out of the partially transparent pixels. An edge pixel
   is a blend of art and background; leaving it as-is carries a slate or navy
   cast that shows as a cold fringe once the icon sits on a warm plaque. So
   solve C_fg = (C_obs - (1-a) * bg) / a for the pixels where 0 < a < 1.

Finally each icon is trimmed to its own content and padded to a common square,
so they can all be rendered at one size in the nav without per-icon nudging.
"""

import pathlib
import sys
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / "src" / "assets" / "images" / "small-icons"
PROOF = ROOT / "_small_proof.png"

CANVAS = 64          # square output, comfortably above any nav render size
CONTENT = 0.94       # how much of it the longest edge fills
PLAQUE = (0x20, 0x35, 0x1a)   # moss, for the proof sheet


def diff(c, bg):
    """Distance from the background, weighted toward hue rather than brightness.

    Plain RGB distance cannot do this job. The art's outline is neutral dark,
    around (10,10,10); the slate background is cool dark, (10,18,25). Those are
    only 17 apart in RGB -- close enough that the outline gets treated as
    background and half erased, which on a light surface shows as a ragged,
    washed-out edge.

    In opponent terms they are obvious: the background sits at r-b=-15, the
    outline at r-b=0. So compare the colour-opponent channels and keep only a
    small luminance term, which separates outline from background by ~24 while
    background noise stays under 5.
    """
    dr = (c[0] - c[2]) - (bg[0] - bg[2])
    dg = (c[1] - c[2]) - (bg[1] - bg[2])
    dl = (c[0] + c[1] + c[2] - bg[0] - bg[1] - bg[2]) / 3
    return abs(dr) + abs(dg) + 0.25 * abs(dl)


def bg_stats(px, w, h):
    """Median border colour, and how far the border strays from it."""
    ring = [px[x, y] for x in range(w) for y in (0, h - 1)]
    ring += [px[x, y] for y in range(h) for x in (0, w - 1)]
    bg = tuple(sorted(c[i] for c in ring)[len(ring) // 2] for i in range(3))
    spread = sorted(diff(c, bg) for c in ring)
    return bg, spread[int(len(spread) * 0.9)]   # 90th pct, ignores stray art


def cut(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    bg, spread = bg_stats(px, w, h)

    # Ramp alpha from "indistinguishable from background" to "clearly not it".
    t0 = max(5.0, spread * 1.4)
    t1 = t0 * 2.4

    soft = [[min(1.0, max(0.0, (diff(px[x, y], bg) - t0) / (t1 - t0)))
             for x in range(w)] for y in range(h)]

    # Flood from the border through anything not yet fully opaque, so interior
    # dark areas -- the gaps inside a crown, a puzzle notch -- stay solid.
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

    def nearest_fg(x, y, radius=3):
        """Colour of the closest fully-opaque pixel, as a foreground estimate."""
        for r_ in range(1, radius + 1):
            best = None
            for dy in range(-r_, r_ + 1):
                for dx in range(-r_, r_ + 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not outside[ny][nx]:
                        d = dx * dx + dy * dy
                        if best is None or d < best[0]:
                            best = (d, px[nx, ny])
            if best:
                return best[1]
        return None

    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            a = soft[y][x] if outside[y][x] else 1.0
            if a <= 0:
                continue
            c = px[x, y]
            if a < 1.0:
                # Refine the coverage estimate before unmixing. Distance-from-bg
                # is only a proxy for alpha, and where it overestimates, the
                # unmix under-corrects and leaves a cast -- very visible with a
                # saturated background like play-small's navy. Projecting the
                # pixel onto the bg->foreground line gives the actual blend
                # fraction, so use a local opaque neighbour as that foreground.
                fg = nearest_fg(x, y)
                if fg is not None:
                    v = [fg[i] - bg[i] for i in range(3)]
                    vv = sum(t * t for t in v)
                    if vv > 400:      # only when fg and bg are far enough apart
                        proj = sum((c[i] - bg[i]) * v[i] for i in range(3)) / vv
                        a = min(1.0, max(0.0, proj))
                if a <= 0:
                    continue
                c = tuple(min(255, max(0, round((c[i] - (1 - a) * bg[i]) / a)))
                          for i in range(3))
            op[x, y] = (*c, round(a * 255))

    return out, bg, t0


def square(im):
    """Trim to content, then centre on a common square canvas."""
    box = im.getchannel("A").getbbox()
    art = im.crop(box)
    scale = (CANVAS * CONTENT) / max(art.size)
    art = art.resize((max(1, round(art.width * scale)),
                      max(1, round(art.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(art, ((CANVAS - art.width) // 2, (CANVAS - art.height) // 2))
    return canvas, box, art.size


def main(preview_only=False):
    results = []
    for p in sorted(D.glob("*.png")):
        cutout, bg, t0 = cut(p)
        final, box, art_size = square(cutout)
        results.append((p, final))
        opaque = sum(1 for a in final.getchannel("A").getdata() if a > 8)
        print(f"  {p.stem:16} bg {bg}  tol {t0:4.1f}  "
              f"content {box[2]-box[0]}x{box[3]-box[1]} -> {art_size[0]}x{art_size[1]}  "
              f"({100*opaque/(CANVAS*CANVAS):4.1f}% of canvas)")
        if not preview_only:
            dest = p.with_suffix(".webp")
            final.save(dest, lossless=True, method=6)
            print(f"  {'':16} wrote {dest.name}  {dest.stat().st_size/1024:.1f} KB")

    # Proof sheet. White and magenta are not decorative: a residual slate or
    # navy fringe is invisible on a dark row and unmissable on those.
    BANDS = [("plaque", PLAQUE), ("rail", (0x2c, 0x25, 0x1e)),
             ("white", (0xff, 0xff, 0xff)), ("magenta", (0xff, 0x00, 0xff))]
    pad, n = 10, len(results)
    bw = pad + n * (CANVAS + pad)
    bh = pad * 2 + CANVAS + 28
    sheet = Image.new("RGB", (bw, bh * len(BANDS)), (0, 0, 0))
    for bi, (_, colour) in enumerate(BANDS):
        band = Image.new("RGB", (bw, bh), colour)
        for i, (_, im) in enumerate(results):
            x = pad + i * (CANVAS + pad)
            band.paste(im, (x, pad), im)
            small = im.resize((22, 22), Image.LANCZOS)
            band.paste(small, (x + (CANVAS - 22) // 2, pad + CANVAS + 2), small)
        sheet.paste(band, (0, bi * bh))
    sheet.resize((sheet.width * 3, sheet.height * 3), Image.LANCZOS).save(PROOF)
    print(f"\n  proof -> {PROOF.name}  (bands: {', '.join(b[0] for b in BANDS)})")


if __name__ == "__main__":
    main("--preview" in sys.argv)
