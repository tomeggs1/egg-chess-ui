import type { PieceColor, PieceType } from "../data/pieceThemes";
import type { PlacedPiece } from "./fen";

/** A piece that was removed by a capture. */
export interface CapturedPiece {
  color: PieceColor;
  type: PieceType;
}

/** One played move, plus the resulting position (for click-to-jump / review). */
export interface MoveRecord {
  from: { file: number; rank: number };
  to: { file: number; rank: number };
  color: PieceColor;
  type: PieceType;
  /** The piece this move captured, if any. */
  captured?: CapturedPiece;
  /** The piece a pawn promoted to on this move, if any. */
  promotion?: PieceType;
  /** Full board placement AFTER the move (ids preserved, so jumps animate). */
  board: PlacedPiece[];
  /** Side to move AFTER this move. */
  turn: PieceColor;
}

const FILES = "abcdefgh";

/** Algebraic square name, e.g. (4,1) → "e2". */
export const squareName = (file: number, rank: number) => `${FILES[file]}${rank + 1}`;

/** Coordinate move text, e.g. "e2–e4" or "e2×d5" (capture). Variant-safe. */
export function moveText(m: MoveRecord): string {
  return `${squareName(m.from.file, m.from.rank)}${m.captured ? "×" : "–"}${squareName(m.to.file, m.to.rank)}`;
}
