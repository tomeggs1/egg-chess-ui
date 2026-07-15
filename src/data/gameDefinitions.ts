import { MoveType, MoveMode, PieceDefinition, GameDefinition, PlayerColor } from "./types";
import standardChessIcon from "../assets/images/standardChessIcon.png";
import norooksChessIcon from "../assets/images/norook.webp";

export const StandardPawn: PieceDefinition = {
  name: "Pawn",
  moves: [
    { type: MoveType.SLIDE, mode: MoveMode.MOVE, directions: [{ dx: 0, dy: 1 }], range: 2, initial_only: true },
    { type: MoveType.SLIDE, mode: MoveMode.MOVE, directions: [{ dx: 0, dy: 1 }], range: 1 },
    {
      type: MoveType.SLIDE,
      mode: MoveMode.CAPTURE,
      directions: [
        { dx: 1, dy: 1 },
        { dx: -1, dy: 1 },
      ],
      range: 1,
    },
  ],
};
export const StandardRook: PieceDefinition = {
  name: "Rook",
  moves: [
    {
      type: MoveType.SLIDE,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ],
      range: 7,
    },
  ],
};
export const StandardBishop: PieceDefinition = {
  name: "Bishop",
  moves: [
    {
      type: MoveType.SLIDE,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: -1, dy: -1 },
      ],
      range: 7,
    },
  ],
};
export const StandardQueen: PieceDefinition = {
  name: "Queen",
  moves: [
    {
      type: MoveType.SLIDE,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: -1, dy: -1 },
      ],
      range: 7,
    },
    {
      type: MoveType.SLIDE,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ],
      range: 7,
    },
  ],
};
export const StandardKing: PieceDefinition = {
  name: "King",
  moves: [
    {
      type: MoveType.SLIDE,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: -1, dy: -1 },
      ],
      range: 1,
    },
    {
      type: MoveType.SLIDE,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ],
      range: 1,
    },
  ],
};
export const StandardKnight: PieceDefinition = {
  name: "Knight",
  moves: [
    {
      type: MoveType.LEAP,
      mode: MoveMode.MOVE_OR_CAPTURE,
      directions: [
        { dx: 1, dy: 2 },
        { dx: 2, dy: 1 },
        { dx: -1, dy: 2 },
        { dx: -2, dy: 1 },
        { dx: 1, dy: -2 },
        { dx: 2, dy: -1 },
        { dx: -1, dy: -2 },
        { dx: -2, dy: -1 },
      ],
      range: 1,
    },
  ],
};

export const StandardGameDefinition: GameDefinition = {
  id: "standard",
  name: "Standard",
  player_colors: [PlayerColor.WHITE, PlayerColor.BLACK],
  pieces: [StandardPawn, StandardRook, StandardBishop, StandardKnight, StandardQueen, StandardKing],
  icon: standardChessIcon,
  starting_positions: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
};
export const NoRooksGameDefinition: GameDefinition = {
  id: "no-rooks",
  name: "No Rooks",
  player_colors: [PlayerColor.WHITE, PlayerColor.BLACK],
  pieces: [StandardPawn, StandardBishop, StandardKnight, StandardQueen, StandardKing],
  icon: norooksChessIcon,
  starting_positions: "1nbqkbn1/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBN1",
};

export const GameDefinitions: GameDefinition[] = [StandardGameDefinition, NoRooksGameDefinition];
