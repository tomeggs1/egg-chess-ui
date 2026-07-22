"""Generate clean grass-tuft decal sprites (transparent PNGs) for the battlefield
board theme. Blades are tapered curved polygons in a grass/olive palette, drawn
supersampled then downscaled for smooth anti-aliased edges."""
import math
import os
import random
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "images", "boards", "battlefield")
SS = 3          # supersample factor
FINAL = 112     # output px
W = FINAL * SS

# Back-to-front blade colors (darker behind for depth), plus a subtle outline.
GREENS = [(51, 71, 28), (74, 104, 40), (95, 132, 52), (120, 156, 66)]
OUTLINE = (30, 42, 16)

def blade(draw, bx, by, angle_deg, length, width, color):
    a = math.radians(angle_deg)          # 0° = straight up
    dx, dy = math.sin(a), -math.cos(a)   # blade direction
    px, py = -dy, dx                      # perpendicular
    curve = random.uniform(-0.22, 0.22)   # sideways bend
    steps = 14
    left, right = [], []
    for i in range(steps + 1):
        t = i / steps
        bend = math.sin(t * math.pi) * curve * length
        cx = bx + dx * length * t + px * bend
        cy = by + dy * length * t + py * bend
        w = width * (1 - t) ** 0.7        # taper to a point
        left.append((cx - px * w, cy - py * w))
        right.append((cx + px * w, cy + py * w))
    poly = left + right[::-1]
    draw.polygon(poly, fill=color, outline=OUTLINE)

def make_tuft(seed):
    random.seed(seed)
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bx, by = W * 0.5, W * 0.9              # base near bottom-center
    n = random.randint(6, 8)
    # Draw back (darker, wider spread) first, then front (lighter).
    order = sorted(range(n), key=lambda _: random.random())
    for rank, _ in enumerate(order):
        frac = rank / max(1, n - 1)
        angle = random.uniform(-42, 42)
        length = W * random.uniform(0.55, 0.82)
        width = W * random.uniform(0.035, 0.052)
        color = GREENS[min(len(GREENS) - 1, int(frac * len(GREENS)))]
        blade(d, bx + random.uniform(-W * 0.06, W * 0.06), by, angle, length, width, color)
    return img.resize((FINAL, FINAL), Image.LANCZOS)

for i, seed in enumerate([7, 23, 91], start=3):  # decal3, decal4, decal5
    tuft = make_tuft(seed)
    tuft.save(os.path.join(OUT, f"decal{i}.png"))
    print(f"decal{i}.png", tuft.size)

# montage preview on magenta
files = [f"decal{i}.png" for i in (3, 4, 5)]
m = Image.new("RGB", (FINAL * 3 + 40, FINAL + 20), (200, 60, 200))
for j, f in enumerate(files):
    im = Image.open(os.path.join(OUT, f)).convert("RGBA")
    m.paste(im, (10 + j * (FINAL + 10), 10), im)
m.save(os.path.join(os.path.dirname(__file__), "_tuft_montage.png"))
print("DONE")
