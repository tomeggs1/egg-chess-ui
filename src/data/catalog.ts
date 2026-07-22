// Maps the server-side definition DTOs onto the frontend's existing
// GameDefinition / PieceDefinition shapes, so the rest of the app (engine,
// board, dialogs) is unchanged — it just gets its catalog from the API.
import { MoveMode, MoveType, PlayerColor, type GameDefinition, type PieceDefinition } from "./types";
import type { PieceType } from "./pieceThemes";
import { resolveGameIcon } from "./gameIcons";
import type { GameDefinitionDto, PieceDefinitionDto } from "../api/definitions";

// Backend enum names → frontend enum values (the frontend engine compares
// against these).
const MOVE_TYPE: Record<string, MoveType> = {
  LEAP: MoveType.LEAP,
  SLIDE: MoveType.SLIDE,
};
const MOVE_MODE: Record<string, MoveMode> = {
  MOVE: MoveMode.MOVE,
  CAPTURE: MoveMode.CAPTURE,
  MOVE_OR_CAPTURE: MoveMode.MOVE_OR_CAPTURE,
};

export function toPieceDefinition(p: PieceDefinitionDto): PieceDefinition {
  return {
    name: p.name,
    enPassant: p.enPassant,
    promotes: p.promotes,
    moves: p.moves.map((m) => ({
      type: MOVE_TYPE[m.type],
      mode: MOVE_MODE[m.mode],
      directions: m.directions.map((d) => ({ dx: d.dx, dy: d.dy })),
      range: m.range,
      ...(m.initialOnly ? { initial_only: true } : {}),
    })),
  };
}

export function toGameDefinition(g: GameDefinitionDto, pieceByCode: Map<string, PieceDefinition>): GameDefinition {
  const symbolToCode = new Map(g.roster.map((r) => [r.symbol, r.pieceCode] as const));
  // The roster order defines the game's piece list; drop any whose definition
  // wasn't in the fetched catalog (shouldn't happen for built-ins).
  const pieces = g.roster
    .map((r) => pieceByCode.get(r.pieceCode))
    .filter((p): p is PieceDefinition => Boolean(p));
  const promotionPieces = g.promotion
    .map((sym) => symbolToCode.get(sym))
    .filter((c): c is string => Boolean(c)) as PieceType[];

  return {
    id: g.code, // frontend keys games by their slug ("standard")
    name: g.name,
    icon: resolveGameIcon(g.iconRef) ?? "",
    player_colors: [PlayerColor.WHITE, PlayerColor.BLACK],
    pieces,
    starting_positions: g.startingPosition,
    castling: g.castling.length ? g.castling : undefined,
    promotionPieces: promotionPieces.length ? promotionPieces : undefined,
  };
}

/**
 * Assemble the frontend game catalog from the piece + game DTOs. "standard" is
 * pinned first; the rest keep the server's order (Array.sort is stable), so this
 * ordering applies everywhere the catalog is consumed (selectors, dialogs).
 */
export function buildCatalog(pieces: PieceDefinitionDto[], games: GameDefinitionDto[]): GameDefinition[] {
  const byCode = new Map<string, PieceDefinition>();
  for (const p of pieces) byCode.set(p.code, toPieceDefinition(p));
  return games
    .map((g) => toGameDefinition(g, byCode))
    .sort((a, b) => (a.id === "standard" ? -1 : b.id === "standard" ? 1 : 0));
}
