import { MoveMode, MoveType, type CastlingRule, type PieceDefinition } from "../data/types";
import type { PieceColor, PieceType } from "../data/pieceThemes";
import type { PlacedPiece } from "./fen";
import type { MoveRecord } from "./history";

const opposite = (c: PieceColor): PieceColor => (c === "white" ? "black" : "white");
type DefMap = Map<PieceType, PieceDefinition>;

/** A square a selected piece can move to, and whether it's a capture. */
export interface MoveTarget {
  file: number;
  rank: number;
  kind: "move" | "capture";
  /** Present when this target is a castling move — the rook also relocates. */
  castle?: {
    rookFrom: { file: number; rank: number };
    rookTo: { file: number; rank: number };
  };
  /** Square of the captured piece, when it differs from the destination
   *  (en passant). Absent for normal captures (captured piece is on the target). */
  capturedSquare?: { file: number; rank: number };
}

const onBoard = (n: number) => n >= 0 && n <= 7;

/**
 * Compute the squares a piece can reach, from its data-driven PieceDefinition.
 * Pure: given the current placement, the piece, and a type→definition lookup, it
 * returns the reachable squares (move/capture). No turn/legality/check rules yet
 * — just the raw movement each piece's definition allows.
 *
 * `isInitial` gates `initial_only` moves (e.g. the pawn's double step). For the
 * Board Explorer, positions are the game's start, so every piece is unmoved.
 */
export function generateMoves(
  pieces: PlacedPiece[],
  from: PlacedPiece,
  defs: Map<PieceType, PieceDefinition>,
  isInitial = true,
): MoveTarget[] {
  const def = defs.get(from.type);
  if (!def) return [];

  const occupied = new Map<string, PlacedPiece>();
  for (const p of pieces) occupied.set(`${p.file},${p.rank}`, p);

  // Positive dy in a definition means "forward": toward rank 8 for white, rank 1
  // for black. Flipping dy makes asymmetric pieces (pawns) work for both colors.
  const forward = from.color === "white" ? 1 : -1;

  const seen = new Set<string>();
  const out: MoveTarget[] = [];
  const add = (f: number, r: number, kind: MoveTarget["kind"]) => {
    const key = `${f},${r}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ file: f, rank: r, kind });
  };

  for (const move of def.moves) {
    if (move.initial_only && !isInitial) continue;
    const maxRange = move.type === MoveType.LEAP ? 1 : Math.max(1, move.range);
    for (const dir of move.directions) {
      for (let step = 1; step <= maxRange; step++) {
        const f = from.file + dir.dx * step;
        const r = from.rank + dir.dy * forward * step;
        if (!onBoard(f) || !onBoard(r)) break;

        const occupant = occupied.get(`${f},${r}`);
        if (occupant) {
          // Any piece blocks further sliding; capture the square only if enemy
          // and this move can capture.
          if (occupant.color !== from.color && move.mode !== MoveMode.MOVE) add(f, r, "capture");
          break;
        }
        // Empty square: reachable unless this move is capture-only.
        if (move.mode !== MoveMode.CAPTURE) add(f, r, "move");
        // A leap is a single hop; a slide keeps going until blocked/out of range.
        if (move.type === MoveType.LEAP) break;
      }
    }
  }

  return out;
}

/**
 * Castling targets for a king, from the game's castling rules. Requires the king
 * and the specific rook to be unmoved (via `unmoved`) and all squares between
 * them empty. Does NOT yet enforce check-safety (king not in/through/into check).
 */
export function generateCastling(
  pieces: PlacedPiece[],
  king: PlacedPiece,
  rules: CastlingRule[],
  unmoved: (file: number, rank: number) => boolean,
): MoveTarget[] {
  if (!unmoved(king.file, king.rank)) return [];

  const at = new Map<string, PlacedPiece>();
  for (const p of pieces) at.set(`${p.file},${p.rank}`, p);
  const rank = king.rank;
  const out: MoveTarget[] = [];

  for (const rule of rules) {
    const rook = at.get(`${rule.rookFromFile},${rank}`);
    if (!rook || rook.type !== "rook" || rook.color !== king.color) continue;
    if (!unmoved(rule.rookFromFile, rank)) continue;

    // All squares strictly between the king and the rook must be empty.
    const lo = Math.min(king.file, rule.rookFromFile) + 1;
    const hi = Math.max(king.file, rule.rookFromFile) - 1;
    let blocked = false;
    for (let f = lo; f <= hi; f++) {
      if (at.has(`${f},${rank}`)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    out.push({
      file: rule.kingToFile,
      rank,
      kind: "move",
      castle: {
        rookFrom: { file: rule.rookFromFile, rank },
        rookTo: { file: rule.rookToFile, rank },
      },
    });
  }

  return out;
}

/**
 * En-passant capture for a pawn, based on the immediately preceding move. If the
 * last move was an enemy pawn's two-square advance landing beside this pawn, the
 * pawn may capture diagonally onto the passed-over square, removing that pawn
 * (which sits on the destination's *side*, not on the destination).
 */
export function generateEnPassant(
  pieces: PlacedPiece[],
  pawn: PlacedPiece,
  lastMove: MoveRecord | undefined,
): MoveTarget[] {
  if (!lastMove || lastMove.type !== "pawn" || lastMove.color === pawn.color) return [];
  // Last move must be a straight two-square advance...
  if (lastMove.from.file !== lastMove.to.file || Math.abs(lastMove.to.rank - lastMove.from.rank) !== 2) return [];
  // ...landing directly beside our pawn.
  if (lastMove.to.rank !== pawn.rank || Math.abs(lastMove.to.file - pawn.file) !== 1) return [];

  const forward = pawn.color === "white" ? 1 : -1;
  const targetRank = pawn.rank + forward;
  if ((lastMove.from.rank + lastMove.to.rank) / 2 !== targetRank) return []; // passed square is forward-diagonal

  const at = new Map<string, PlacedPiece>();
  for (const p of pieces) at.set(`${p.file},${p.rank}`, p);
  if (at.has(`${lastMove.to.file},${targetRank}`)) return []; // passed square must be empty
  const victim = at.get(`${lastMove.to.file},${lastMove.to.rank}`);
  if (!victim || victim.color === pawn.color) return [];

  return [
    {
      file: lastMove.to.file,
      rank: targetRank,
      kind: "capture",
      capturedSquare: { file: lastMove.to.file, rank: lastMove.to.rank },
    },
  ];
}

/**
 * Apply a move target to a board, returning the next pieces and any captured
 * piece. Handles castling (rook also moves), en passant (offset capture) and
 * promotion (type change). Pure — used for both execution and legality checks.
 */
export function applyMove(
  pieces: PlacedPiece[],
  from: { file: number; rank: number },
  target: MoveTarget,
  promotion?: PieceType,
): { pieces: PlacedPiece[]; captured?: PlacedPiece } {
  const mover = pieces.find((p) => p.file === from.file && p.rank === from.rank);
  if (!mover) return { pieces };

  if (target.castle) {
    const { rookFrom, rookTo } = target.castle;
    const next = pieces.map((p) => {
      if (p.file === from.file && p.rank === from.rank) return { ...p, file: target.file, rank: target.rank };
      if (p.file === rookFrom.file && p.rank === rookFrom.rank) return { ...p, file: rookTo.file, rank: rookTo.rank };
      return p;
    });
    return { pieces: next };
  }

  const capSq = target.capturedSquare ?? { file: target.file, rank: target.rank };
  const captured = pieces.find((p) => p.file === capSq.file && p.rank === capSq.rank && p.color !== mover.color);
  const next = pieces
    .filter((p) => !(p.file === capSq.file && p.rank === capSq.rank && p.color !== mover.color))
    .map((p) =>
      p.file === from.file && p.rank === from.rank
        ? { ...p, file: target.file, rank: target.rank, ...(promotion ? { type: promotion } : {}) }
        : p,
    );
  return { pieces: next, captured };
}

/** Whether `attacker` attacks `target`, treating capture-capable moves as attacks. */
function attacksSquare(
  attacker: PlacedPiece,
  target: { file: number; rank: number },
  occupied: Set<string>,
  defs: DefMap,
): boolean {
  const def = defs.get(attacker.type);
  if (!def) return false;
  const forward = attacker.color === "white" ? 1 : -1;
  for (const move of def.moves) {
    if (move.mode === MoveMode.MOVE) continue; // only capture-capable moves attack
    const maxRange = move.type === MoveType.LEAP ? 1 : Math.max(1, move.range);
    for (const dir of move.directions) {
      for (let step = 1; step <= maxRange; step++) {
        const f = attacker.file + dir.dx * step;
        const r = attacker.rank + dir.dy * forward * step;
        if (!onBoard(f) || !onBoard(r)) break;
        if (f === target.file && r === target.rank) return true;
        if (occupied.has(`${f},${r}`)) break; // blocked (target itself is caught above)
        if (move.type === MoveType.LEAP) break;
      }
    }
  }
  return false;
}

/** Whether any piece of `byColor` attacks the square. */
export function isSquareAttacked(
  pieces: PlacedPiece[],
  square: { file: number; rank: number },
  byColor: PieceColor,
  defs: DefMap,
): boolean {
  const occupied = new Set(pieces.map((p) => `${p.file},${p.rank}`));
  return pieces.some((p) => p.color === byColor && attacksSquare(p, square, occupied, defs));
}

/** The square of `color`'s king, or null. */
export function findKingSquare(pieces: PlacedPiece[], color: PieceColor): { file: number; rank: number } | null {
  const king = pieces.find((p) => p.type === "king" && p.color === color);
  return king ? { file: king.file, rank: king.rank } : null;
}

/** Whether `color`'s king is currently attacked. */
export function isInCheck(pieces: PlacedPiece[], color: PieceColor, defs: DefMap): boolean {
  const king = findKingSquare(pieces, color);
  return king != null && isSquareAttacked(pieces, king, opposite(color), defs);
}

/**
 * Filter pseudo-legal targets to those that don't leave the mover's own king in
 * check. Castling additionally requires the king to be safe on every square it
 * passes over (not in/through/into check).
 */
export function legalMoves(
  pieces: PlacedPiece[],
  from: { file: number; rank: number },
  targets: MoveTarget[],
  defs: DefMap,
): MoveTarget[] {
  const mover = pieces.find((p) => p.file === from.file && p.rank === from.rank);
  if (!mover) return targets;
  const enemy = opposite(mover.color);

  return targets.filter((t) => {
    if (t.castle) {
      const step = Math.sign(t.file - from.file) || 1;
      for (let f = from.file; ; f += step) {
        if (isSquareAttacked(pieces, { file: f, rank: from.rank }, enemy, defs)) return false;
        if (f === t.file) break;
      }
      return true;
    }
    const { pieces: next } = applyMove(pieces, from, t);
    return !isInCheck(next, mover.color, defs);
  });
}
