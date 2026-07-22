"""Slice FlatChessSet.png (6x2 sheet on white) into 12 transparent WebP pieces
for a new 'Flat' theme. Rows: black (top), white (bottom). Columns: rook,
knight, bishop, queen, king, pawn."""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = os.path.join(os.path.expanduser("~"), "Downloads", "FlatChessSet.png")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "images", "pieces", "Flat")
os.makedirs(OUT, exist_ok=True)

COLOR_BY_ROW = ["black", "white"]
PIECE_BY_COL = ["rook", "knight", "bishop", "queen", "king", "pawn"]
MAX_SIDE = 384

im = Image.open(SRC).convert("RGB")
W, H = im.size

# Flood-fill the connected white background from the 4 corners to a sentinel,
# so enclosed near-white highlights inside pieces stay opaque.
SENT = (255, 0, 255)
flood = im.copy()
for corner in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    ImageDraw.floodfill(flood, corner, SENT, thresh=32)
arr = np.array(flood)
fg = ~np.all(arr == SENT, axis=2)  # foreground = not background


def runs(mask, min_len):
    """Contiguous True runs (start, end inclusive) longer than min_len."""
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start > min_len:
                out.append((start, i - 1))
            start = None
    if start is not None and len(mask) - start > min_len:
        out.append((start, len(mask) - 1))
    return out


row_bands = runs(fg.any(axis=1), 50)
print("rows:", len(row_bands))

count = 0
for ri, (y0, y1) in enumerate(row_bands):
    col_bands = runs(fg[y0 : y1 + 1, :].any(axis=0), 30)
    print(f"  row {ri}: {len(col_bands)} cols")
    for ci, (x0, x1) in enumerate(col_bands):
        crop = im.crop((x0, y0, x1 + 1, y1 + 1)).convert("RGBA")
        mask = (fg[y0 : y1 + 1, x0 : x1 + 1] * 255).astype("uint8")
        alpha = Image.fromarray(mask, "L").filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
        crop.putalpha(alpha)
        bb = crop.getbbox()
        if bb:
            crop = crop.crop(bb)
        s = MAX_SIDE / max(crop.size)
        if s < 1:
            crop = crop.resize((round(crop.width * s), round(crop.height * s)), Image.LANCZOS)
        name = f"{COLOR_BY_ROW[ri]}-{PIECE_BY_COL[ci]}"
        crop.save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=90, method=6)
        count += 1
        print(f"    {name}.webp {crop.size}")

print(f"DONE — {count} pieces -> {os.path.normpath(OUT)}")
