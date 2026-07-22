"""Extract clean grass/sand tiles from Downloads/GrassSandBattlefield.png into a
new `battlefield` board theme (white* = sand, black* = grass).

Strategy: detect the 8x8 playfield bbox by color projection, center-crop the
interior of each square (away from the organic seams), classify grass vs sand by
mean color, and save the two most-uniform crops of each (least likely to contain
a big rock) as variant 1 and 2."""
import os
from PIL import Image, ImageStat

SRC = os.path.join(os.path.expanduser("~"), "Downloads", "GrassSandBattlefield.png")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "images", "boards", "battlefield")
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGB")
W, H = im.size
px = im.load()

def is_field(r, g, b):
    grass = g > 90 and g > b * 1.4 and r < 205 and g >= r * 0.8
    sand = r > 165 and g > 140 and b < 165 and abs(r - g) < 55  # tan, not saturated gold
    return grass or sand

# Walk outward from the center of a scanline; stop at the frame (a run of
# non-field wider than `maxgap`). Small gaps (pebbles/tufts) are tolerated, and
# the wide frame band keeps us from ever reaching the outer grass margin.
def bounds(mask, center, maxgap=40):
    n = len(mask)
    lo = center
    x, gap = center, 0
    while x >= 0:
        if mask[x]:
            lo, gap = x, 0
        else:
            gap += 1
            if gap > maxgap:
                break
        x -= 1
    hi = center
    x, gap = center, 0
    while x < n:
        if mask[x]:
            hi, gap = x, 0
        else:
            gap += 1
            if gap > maxgap:
                break
        x += 1
    return lo, hi

# Median the bounds over a few central scanlines for robustness.
def median(vals):
    s = sorted(vals)
    return s[len(s) // 2]

# Use scanlines at ~0.3/0.35/0.65/0.7 to dodge the banners (side banners sit at
# ~0.5 height, top/bottom banners at ~0.5 width, corner towers at the corners).
FRACS = (0.30, 0.35, 0.65, 0.70)
x0s, x1s, y0s, y1s = [], [], [], []
for frac in FRACS:
    yy = int(H * frac)  # a row → horizontal (x) bounds
    lo, hi = bounds([is_field(*px[x, yy]) for x in range(W)], W // 2)
    x0s.append(lo); x1s.append(hi)
    xx = int(W * frac)  # a column → vertical (y) bounds
    lo, hi = bounds([is_field(*px[xx, y]) for y in range(H)], H // 2)
    y0s.append(lo); y1s.append(hi)
x0, x1, y0, y1 = median(x0s), median(x1s), median(y0s), median(y1s)
pitchx, pitchy = (x1 - x0) / 8, (y1 - y0) / 8
print(f"playfield bbox=({x0},{y0})-({x1},{y1}) pitch=({pitchx:.1f},{pitchy:.1f})")

def classify(mean):
    r, g, b = mean
    return "grass" if (g > b * 1.35 and g >= r * 0.85 and r < 205) else "sand"

# Square center-crop per square, well inside the organic seams. Interior squares
# only (skip the outer ring to avoid any frame bleed), upscaled to a uniform size.
TILE = 128
half = min(pitchx, pitchy) * (0.5 - 0.22)  # 22% inset from each edge → seam-free
buckets = {"grass": [], "sand": []}
for row in range(1, 7):
    for col in range(1, 7):
        cx = x0 + (col + 0.5) * pitchx
        cy = y0 + (row + 0.5) * pitchy
        box = (round(cx - half), round(cy - half), round(cx + half), round(cy + half))
        crop = im.crop(box).resize((TILE, TILE), Image.LANCZOS)
        mean = ImageStat.Stat(crop).mean
        uniformity = ImageStat.Stat(crop.convert("L")).stddev[0]  # lower = cleaner
        buckets[classify(mean)].append((uniformity, (col, row), crop))

for kind, shade in (("sand", "white"), ("grass", "black")):
    items = sorted(buckets[kind], key=lambda t: t[0])  # cleanest first
    chosen = items[:2]
    for i, (score, cell, crop) in enumerate(chosen, start=1):
        path = os.path.join(OUT, f"{shade}{i}.png")
        crop.save(path)
        print(f"{shade}{i}.png <- {kind} square {cell} size={crop.size} stddev={score:.1f}")

print("DONE ->", os.path.normpath(OUT))
