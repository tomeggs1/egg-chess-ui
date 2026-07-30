"""Drop the navy fill out of the GamePanel frame slices, keeping the gilt.

    python scripts/cutout-panel-frame.py
    python scripts/cutout-panel-frame.py --preview

Reads  src/assets/images/panel-*.png
Writes src/assets/images/panel-*.webp   (RGBA, same dimensions)

The art is a dark navy band with a gold rim and scrolled corners. Painted as-is
the band is opaque, so a panel's own surface stops at the frame's inner edge and
the navy reads as a thick dark border. Removing the fill lets the interior run
all the way out to the gilt.

This is a COLOUR-CLASS cut, not a background cut, so there is no flood-fill step:
the navy is not a region to be reached from the border, it is interleaved with
the gold everywhere. Measured, the two do not overlap at all —

    navy fill   r-b  -75 .. -15    mean luminance  0-31
    gilt        r-b  +15 .. +135   mean luminance 30-142

— so alpha ramps on warmth (r - b) rather than on brightness. Brightness alone
would keep the navy's lighter highlights and drop the gold's shadowed side.

Dimensions are preserved deliberately. The band thickness positions the edges
against the corners, so trimming to the gilt's bbox would silently move every
piece — the same mistake that put 1px gaps in the dialog frame.
"""

import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
IM = ROOT / "src" / "assets" / "images"
PROOF = ROOT / "_panel_proof.png"

PARTS = ["top-left", "top", "top-right", "left", "right",
         "bottom-left", "bottom", "bottom-right"]

WARM0, WARM1 = 4.0, 22.0     # r-b: fully transparent below, fully opaque above
# Backgrounds for the proof. The interior colour is the point — the frame has to
# read against whatever the panel is filled with.
BANDS = [("surface", (0x21, 0x1c, 0x17)), ("nav", (0x2c, 0x25, 0x1e)),
         ("plaque", (0x12, 0x33, 0x6e)), ("magenta", (0xff, 0x00, 0xff))]


def cut(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            a = min(1.0, max(0.0, ((r - b) - WARM0) / (WARM1 - WARM0)))
            if a <= 0:
                continue
            # Edge pixels are gold blended into navy, so they carry a blue cast.
            # Gold always has b <= g; clamping is a no-op on true gold and
            # removes the fringe, which would otherwise show as a cold halo.
            op[x, y] = (r, g, min(b, g), round(a * 255))
    return out


def main(preview_only=False):
    cuts = {}
    for name in PARTS:
        src = IM / f"{name and 'panel-' + name}.png"
        art = cut(src)
        cuts[name] = art
        opaque = sum(1 for a in art.getchannel("A").getdata() if a > 8)
        print(f"  panel-{name:14} {art.size}  gilt kept {100 * opaque / (art.width * art.height):4.1f}%")
        if not preview_only:
            art.save(IM / f"panel-{name}.webp", lossless=True, method=6)

    if not preview_only:
        total = sum((IM / f"panel-{n}.webp").stat().st_size for n in PARTS) / 1024
        print(f"\n  webp total {total:.1f} KB")

    pad = 10
    W = sum(a.width for a in cuts.values()) + pad * (len(cuts) + 1)
    row = max(a.height for a in cuts.values()) + pad * 2
    sheet = Image.new("RGB", (W, row * len(BANDS)), (0, 0, 0))
    for i, (_, colour) in enumerate(BANDS):
        band = Image.new("RGB", (W, row), colour)
        x = pad
        for a in cuts.values():
            band.paste(a, (x, pad), a)
            x += a.width + pad
        sheet.paste(band, (0, i * row))
    sheet.resize((W * 2, row * len(BANDS) * 2), Image.LANCZOS).save(PROOF)
    print(f"  proof -> {PROOF.name}  ({', '.join(b[0] for b in BANDS)})")


if __name__ == "__main__":
    main("--preview" in sys.argv)
