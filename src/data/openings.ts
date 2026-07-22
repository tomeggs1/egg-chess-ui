// Chess opening lookup, keyed by board placement (the first field of a FEN,
// i.e. what board/fen.ts toPlacement() produces). The data is generated offline
// from the lichess chess-openings dataset (CC0) — see prototypes/build_openings.mjs.
import data from "./openings.json";

export interface Opening {
  /** ECO code, e.g. "B00". */
  eco: string;
  /** Opening name, e.g. "Sicilian Defense". */
  name: string;
}

const openings = data as Record<string, Opening>;

/**
 * The opening for a given board placement (FEN piece-placement field), or null
 * if the position isn't a known opening (e.g. the start, a variant, or off-book).
 */
export function findOpening(placement: string): Opening | null {
  return openings[placement] ?? null;
}
