import { Chess } from "chess.js";
import { squareName, type MoveRecord } from "./history";
import type { PieceType } from "../data/pieceThemes";

const PROMO_LETTER: Record<PieceType, "q" | "r" | "b" | "n"> = {
  queen: "q",
  rook: "r",
  bishop: "b",
  knight: "n",
  king: "q", // not promotable to; unused
  pawn: "q", // not promotable to; unused
};

// SAN piece letters → figurine glyphs (solid symbols read on the dark panel).
const FIGURINE: Record<string, string> = { N: "♞", B: "♝", R: "♜", Q: "♛", K: "♚" };
const toFigurine = (san: string) => san.replace(/[NBRQK]/g, (c) => FIGURINE[c] ?? c);

/**
 * The full FEN of a *standard* game after replaying `history` up to (and
 * including) `ply` — with correct side-to-move, castling rights and en-passant
 * square, so it can key an opening/explorer database. `ply = -1` is the start
 * position. Returns null if any move isn't legal standard chess (variants, or
 * board-engine-only moves), so callers can hide the feature.
 */
export function fenAtPly(history: MoveRecord[], ply: number): string | null {
  const chess = new Chess();
  for (let i = 0; i <= ply && i < history.length; i++) {
    const m = history[i];
    try {
      const mv = chess.move({
        from: squareName(m.from.file, m.from.rank),
        to: squareName(m.to.file, m.to.rank),
        promotion: m.promotion ? PROMO_LETTER[m.promotion] : "q",
      });
      if (!mv) return null;
    } catch {
      return null;
    }
  }
  return chess.fen();
}

/** A move expressed by its from/to squares and optional promotion code. */
export interface UciMove {
  fromFile: number;
  fromRank: number;
  toFile: number;
  toRank: number;
  promotion: string | null;
}

/**
 * Figurine SAN for each of a *standard* game's moves given as from/to squares,
 * by replaying through chess.js. Returns null for any move chess.js can't make
 * (variants, or board-engine-only moves) so the caller can fall back to UCI.
 */
export function sanFigurineFromUci(moves: UciMove[]): (string | null)[] {
  const chess = new Chess();
  const out: (string | null)[] = [];
  let broken = false;
  for (const m of moves) {
    if (broken) {
      out.push(null);
      continue;
    }
    try {
      const mv = chess.move({
        from: squareName(m.fromFile, m.fromRank),
        to: squareName(m.toFile, m.toRank),
        promotion: m.promotion ? PROMO_LETTER[m.promotion as PieceType] : "q",
      });
      out.push(mv ? toFigurine(mv.san) : null);
      if (!mv) broken = true;
    } catch {
      out.push(null);
      broken = true;
    }
  }
  return out;
}

/**
 * Figurine SAN for each ply of a *standard* game, by replaying the from/to moves
 * through chess.js. Returns null for any move chess.js can't make legally (the
 * board engine allows moves standard chess wouldn't — e.g. moving into check —
 * and doesn't model promotion/castling), so the caller falls back to UCI.
 */
export function computeSanFigurine(history: MoveRecord[]): (string | null)[] {
  const chess = new Chess();
  const out: (string | null)[] = [];
  let broken = false;
  for (const m of history) {
    if (broken) {
      out.push(null);
      continue;
    }
    try {
      const mv = chess.move({
        from: squareName(m.from.file, m.from.rank),
        to: squareName(m.to.file, m.to.rank),
        promotion: m.promotion ? PROMO_LETTER[m.promotion] : "q",
      });
      out.push(mv ? toFigurine(mv.san) : null);
      if (!mv) broken = true;
    } catch {
      out.push(null);
      broken = true;
    }
  }
  return out;
}
