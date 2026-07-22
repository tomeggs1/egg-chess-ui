// Offline prep: convert the lichess chess-openings TSVs into a position-keyed
// JSON the app looks up at runtime. Uses chess.js (dev-only) to replay each
// opening's PGN and record its board placement (first FEN field) → {eco, name}.
// That placement string matches the app's toPlacement() output, so runtime
// lookup needs no chess library.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Chess } from "chess.js";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "data", "openings.json");

const map = {};
let parsed = 0;
let failed = 0;

for (const file of ["a", "b", "c", "d", "e"]) {
  const text = readFileSync(join(here, "_openings", `${file}.tsv`), "utf8");
  const lines = text.split("\n").slice(1); // drop header
  for (const line of lines) {
    if (!line.trim()) continue;
    const [eco, name, pgn] = line.split("\t");
    if (!pgn) continue;
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const placement = chess.fen().split(" ")[0]; // piece placement only
      map[placement] = { eco, name };
      parsed++;
    } catch {
      failed++;
    }
  }
}

writeFileSync(out, JSON.stringify(map));
console.log(`parsed ${parsed}, failed ${failed}, unique positions ${Object.keys(map).length}`);
console.log(`wrote ${out}`);
