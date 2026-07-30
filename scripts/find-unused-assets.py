"""Which image assets are no longer referenced?

Grep alone is not trustworthy here, so every asset is judged against four
independent signals:

  static   its filename appears in a source file (import, CSS url(), string)
  glob     it is swept up by an import.meta.glob pattern
  build    it survives into dist/ as an emitted file
  input    it is a build-time source, not a bundled asset (src/icons/svg)

Anything with none of those is a genuine candidate for deletion. Assets that are
glob-included but not otherwise referenced get their own bucket -- Vite bundles
them regardless, so they cost bytes without necessarily being reachable.
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg", ".ico"}
SRC_EXT = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".json"}
SKIP = {"node_modules", "dist", ".git", "prototypes", "_edges"}


def walk(base):
    for p in base.rglob("*"):
        if any(part in SKIP for part in p.parts):
            continue
        if p.is_file():
            yield p


# --- the assets -------------------------------------------------------------
assets = [p for base in (ROOT / "src", ROOT / "public") if base.exists()
          for p in walk(base) if p.suffix.lower() in EXT]

# --- the corpus -------------------------------------------------------------
corpus = {}
for base in (ROOT / "src", ROOT / "scripts", ROOT):
    for p in walk(base):
        # Skip scratch files (this script's own JSON output lists every asset
        # path, so leaving it in marks all 231 as referenced) and the lockfile.
        if (p.suffix.lower() in SRC_EXT
                and not p.name.startswith("_")
                and p.name != "package-lock.json"):
            try:
                corpus[p] = p.read_text(encoding="utf8", errors="ignore")
            except OSError:
                pass
blob = "\n".join(corpus.values())

# --- glob patterns ----------------------------------------------------------
globs = []
for p, text in corpus.items():
    # A glob call may take one string OR an array of them (pieceAssets.ts passes
    # three, one per format), so grab the whole argument and pull every literal.
    for m in re.finditer(r"import\.meta\.glob\(\s*(\[[^\]]*\]|[\'\"`][^\'\"`]+[\'\"`])", text):
        for lit in re.findall(r"[\'\"`]([^\'\"`]+)[\'\"`]", m.group(1)):
            globs.append((p, lit, (p.parent / lit).resolve()))

print("import.meta.glob patterns")
for p, pat, resolved in globs:
    print(f"  {p.relative_to(ROOT)}  ->  {pat}")


def glob_covers(asset):
    a = asset.resolve()
    for _, _, resolved in globs:
        # Turn the resolved pattern into a regex.
        rx = re.escape(str(resolved)).replace(r"\*\*", ".*").replace(r"\*", "[^\\\\/]*")
        if re.fullmatch(rx, str(a)):
            return True
    return False


# --- what the build emitted -------------------------------------------------
dist = ROOT / "dist" / "assets"
# Keyed by stem AND extension. Matching on stem alone silently credits a .png
# whose .webp sibling is the one actually bundled -- which is most of the source
# art in this project, so it would have hidden exactly what we are looking for.
emitted = set()
if dist.exists():
    for p in dist.iterdir():
        m = re.match(r"(.+)-[A-Za-z0-9_-]{8}(\.[a-z0-9]+)$", p.name)
        if m:
            emitted.add((m.group(1), m.group(2).lower()))

# --- classify ---------------------------------------------------------------
rows = []
for a in sorted(assets):
    rel = a.relative_to(ROOT)
    stem, name = a.stem, a.name
    # A build-time input: consumed by scripts/build-icons.mjs, never bundled.
    is_input = "icons" in rel.parts and "svg" in rel.parts
    # Static reference: the filename (with or without extension) in any source.
    static = (name in blob) or bool(re.search(rf"[\'\"`/]{re.escape(stem)}[\'\"`]", blob))
    rows.append({
        "path": str(rel).replace("\\", "/"),
        "kb": round(a.stat().st_size / 1024, 1),
        "static": static,
        "glob": glob_covers(a),
        "built": (stem, a.suffix.lower()) in emitted,
        "input": is_input,
    })

used = [r for r in rows if r["static"] or r["glob"] or r["built"] or r["input"]]
unused = [r for r in rows if not (r["static"] or r["glob"] or r["built"] or r["input"])]
glob_only = [r for r in rows if r["glob"] and not r["static"] and not r["input"]]

print(f"\n{len(rows)} image assets, {len(used)} referenced, {len(unused)} unreferenced")
print(f"total {sum(r['kb'] for r in rows)/1024:.1f} MB, "
      f"unreferenced {sum(r['kb'] for r in unused)/1024:.1f} MB")

print(f"\n=== UNREFERENCED ({len(unused)}) ===")
for r in sorted(unused, key=lambda r: -r["kb"]):
    print(f"  {r['kb']:8.1f} KB  {r['path']}")

print(f"\n=== glob-included but never named in code ({len(glob_only)}) ===")
for r in sorted(glob_only, key=lambda r: -r["kb"])[:60]:
    print(f"  {r['kb']:8.1f} KB  {r['path']}")

(ROOT / "_unused.json").write_text(json.dumps(rows, indent=1), encoding="utf8")
