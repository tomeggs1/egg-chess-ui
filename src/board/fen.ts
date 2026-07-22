import type { PieceColor, PieceType } from "../data/pieceThemes";

/** A piece sitting on a square. Files/ranks are 0-based (a=0, rank 1 = 0). */
export interface PlacedPiece {
  /** Stable identity (assigned at parse time, preserved across moves) so the UI
   *  can track a piece from square to square and animate it. */
  id?: string;
  file: number; // 0..7 (a..h)
  rank: number; // 0..7 (0 = rank 1, white's back rank)
  color: PieceColor;
  type: PieceType;
}

/** Standard chess starting position (FEN placement field). */
export const STANDARD_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

const TYPE_TO_CHAR: Record<PieceType, string> = {
  king: "k",
  queen: "q",
  rook: "r",
  bishop: "b",
  knight: "n",
  pawn: "p",
};

/** Serialize placed pieces back to a FEN placement field (inverse of parsePlacement). */
export function toPlacement(pieces: PlacedPiece[]): string {
  const grid: (PlacedPiece | undefined)[][] = Array.from({ length: 8 }, () => Array(8).fill(undefined));
  for (const p of pieces) grid[p.rank][p.file] = p;

  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = grid[rank][file];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) {
        row += empty;
        empty = 0;
      }
      const ch = TYPE_TO_CHAR[p.type];
      row += p.color === "white" ? ch.toUpperCase() : ch;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return rows.join("/");
}

/**
 * Assign stable ids to a freshly-parsed position by matching pieces to the
 * previous one, so the board can animate movement (a moved piece keeps its id
 * and CSS-transitions to its new square). Used when rendering from a server-sent
 * placement string, which carries no piece identity.
 *
 * A piece that stayed on its square keeps its id; the one piece that moved
 * inherits the id of the same-color/type piece whose square it vacated; anything
 * left over (a new piece, e.g. a promotion) gets a freshly minted id.
 */
export function reconcilePieceIds(
  previous: PlacedPiece[],
  next: PlacedPiece[],
  mint: () => string,
): PlacedPiece[] {
  const prevBySquare = new Map<string, PlacedPiece>();
  for (const p of previous) prevBySquare.set(`${p.file},${p.rank}`, p);

  const used = new Set<string>();
  const out: PlacedPiece[] = [];
  const moved: PlacedPiece[] = [];

  // Pass 1: pieces that didn't move (same square, color, type) keep their id.
  for (const np of next) {
    const pv = prevBySquare.get(`${np.file},${np.rank}`);
    if (pv?.id && pv.color === np.color && pv.type === np.type && !used.has(pv.id)) {
      used.add(pv.id);
      out.push({ ...np, id: pv.id });
    } else {
      moved.push(np);
    }
  }

  // Pass 2: a moved piece inherits a leftover same-color/type id; else it's new.
  const leftover = previous.filter((p) => p.id && !used.has(p.id));
  for (const np of moved) {
    const match = leftover.find((p) => !used.has(p.id!) && p.color === np.color && p.type === np.type);
    if (match?.id) {
      used.add(match.id);
      out.push({ ...np, id: match.id });
    } else {
      out.push({ ...np, id: mint() });
    }
  }
  // Stable order by id: a given piece always occupies the same slot in the list,
  // so React updates its DOM node in place (which lets the CSS transition run)
  // rather than re-inserting it — re-insertion cancels a running transition.
  return out.sort((a, b) => (a.id! < b.id! ? -1 : a.id! > b.id! ? 1 : 0));
}

const CHAR_TO_TYPE: Record<string, PieceType> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

/**
 * Parse the piece-placement field of a FEN string into one PlacedPiece per
 * occupied square. FEN lists ranks 8→1 and files a→h; digits are runs of empty
 * squares. A full FEN (with side-to-move, castling, …) is tolerated — only the
 * first space-separated field is read. Unknown characters are ignored.
 */
export function parsePlacement(placement: string): PlacedPiece[] {
  const field = placement.trim().split(/\s+/)[0] ?? "";
  const pieces: PlacedPiece[] = [];

  field.split("/").forEach((row, rowIndex) => {
    // Row 0 in the string is rank 8; store rank so 0 = rank 1.
    const rank = 7 - rowIndex;
    let file = 0;
    for (const ch of row) {
      if (ch >= "1" && ch <= "8") {
        file += Number(ch);
        continue;
      }
      const type = CHAR_TO_TYPE[ch.toLowerCase()];
      if (!type || file > 7) continue;
      pieces.push({
        id: `p${pieces.length}`,
        file,
        rank,
        color: ch === ch.toUpperCase() ? "white" : "black",
        type,
      });
      file += 1;
    }
  });

  return pieces;
}
