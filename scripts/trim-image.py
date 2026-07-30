"""Trim transparent padding from a large PNG and re-encode it as WebP.

    python scripts/trim-image.py profile-large
    python scripts/trim-image.py hero-art 768        # custom long edge

Reads  src/assets/images/<name>.png
Writes src/assets/images/<name>.webp
Backs up the original to ../<name>.ORIGINAL.png the first time it runs, because
these assets are not in git and the transform overwrites in place.

Why a THRESHOLD rather than a plain trim
----------------------------------------
The AI-generated source art in this project carries sub-visible alpha noise
across its "empty" area — peaks of 3-40 out of 255. A normal bounding box
(alpha > 0) therefore returns the whole frame and trims nothing. That is exactly
what happened on the first pass at gold-rook: the crop kept full height and the
original had already been overwritten.

So bounds are measured above BOUND_THRESHOLD, and everything at or below FLOOR
is zeroed, which stops the haze reappearing as a faint square halo once the art
sits on a surface.

Requires Pillow.
"""

import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES = ROOT / "src" / "assets" / "images"

BOUND_THRESHOLD = 20  # find real content above this alpha
FLOOR = 12            # erase anything at or below this
MARGIN_PCT = 0.02     # breathing room so a soft glow is not clipped flush
WEBP_QUALITY = 88


def trim(name: str, long_edge: int = 512) -> None:
    src = IMAGES / f"{name}.png"
    if not src.exists():
        sys.exit(f"not found: {src}")

    backup = ROOT.parent / f"{name}.ORIGINAL.png"
    if not backup.exists():
        backup.write_bytes(src.read_bytes())
        print(f"  backed up -> {backup}")

    im = Image.open(src).convert("RGBA")
    before_px, before_kb = im.size, src.stat().st_size / 1024

    alpha = im.getchannel("A")
    bbox = alpha.point(lambda v: 255 if v > BOUND_THRESHOLD else 0).getbbox()
    if bbox is None:
        sys.exit(f"{name}: nothing above alpha {BOUND_THRESHOLD} — is it blank?")
    im.putalpha(alpha.point(lambda v: 0 if v <= FLOOR else v))

    x0, y0, x1, y1 = bbox
    m = round(max(x1 - x0, y1 - y0) * MARGIN_PCT)
    box = (max(0, x0 - m), max(0, y0 - m),
           min(im.width, x1 + m), min(im.height, y1 + m))
    cropped = im.crop(box)

    w, h = cropped.size
    scale = long_edge / max(w, h)
    out = cropped.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    dest = IMAGES / f"{name}.webp"
    out.save(dest, quality=WEBP_QUALITY, method=6)
    after_kb = dest.stat().st_size / 1024

    naive = im.getbbox()
    trimmed_naively = naive != (0, 0, before_px[0], before_px[1])
    print(f"  {name}")
    print(f"    content   {x1-x0}x{y1-y0} found at alpha>{BOUND_THRESHOLD}"
          f"   (plain getbbox would have {'worked' if trimmed_naively else 'TRIMMED NOTHING'})")
    print(f"    {before_px[0]}x{before_px[1]} {before_kb:8.1f} KB  ->  "
          f"{out.size[0]}x{out.size[1]} {after_kb:7.1f} KB "
          f"({100 * (1 - after_kb / before_kb):.0f}% smaller)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    trim(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 512)
