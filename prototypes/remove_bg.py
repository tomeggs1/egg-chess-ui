"""Remove the baked gray/gold backgrounds from the ElegantBlueGold renders,
producing transparent cutouts under ElegantBlueGold/cutout/. Originals untouched."""
import os
from rembg import remove
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "images", "pieces", "ElegantBlueGold")
OUT = os.path.join(SRC, "cutout")
os.makedirs(OUT, exist_ok=True)

colors = ["white", "black"]
pieces = ["king", "queen", "rook", "bishop", "knight", "pawn"]

def trim(img):
    """Crop to the non-transparent bounding box so each sprite sits flush on its base."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img

for color in colors:
    for piece in pieces:
        name = f"{color}-{piece}.png"
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print("skip (missing):", name)
            continue
        with Image.open(path) as im:
            cut = remove(im.convert("RGBA"))   # AI segmentation
            cut = trim(cut)
            cut.save(os.path.join(OUT, name))
        print("done:", name, cut.size)

print("ALL DONE ->", OUT)
