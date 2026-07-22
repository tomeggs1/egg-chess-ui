"""Convert all piece-theme PNGs to compressed WebP, downscaled to a sensible max
size (pieces display at ~80px, so a few hundred px is plenty even at 3x DPI).
Deletes the source PNGs. Run once; then the app globs *.webp."""
import glob
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "images", "pieces")
MAX_SIDE = 384
QUALITY = 88

pngs = glob.glob(os.path.join(ROOT, "*", "*.png"))
before = after = 0
for p in sorted(pngs):
    before += os.path.getsize(p)
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    scale = MAX_SIDE / max(w, h)
    if scale < 1:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    out = p[:-4] + ".webp"
    im.save(out, "WEBP", quality=QUALITY, method=6)
    after += os.path.getsize(out)
    os.remove(p)
    print(f"{os.path.relpath(out, ROOT)}  {im.size}")

print(f"\n{len(pngs)} files: {before / 1e6:.1f} MB -> {after / 1e6:.2f} MB")
