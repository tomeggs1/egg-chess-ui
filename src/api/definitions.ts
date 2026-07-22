// Read access to the server-side piece and game definition catalog.
import { api } from "./client";

export interface MoveDirectionDto {
  dx: number;
  dy: number;
}

export interface MoveDefinitionDto {
  type: string; // "LEAP" | "SLIDE"
  mode: string; // "MOVE" | "CAPTURE" | "MOVE_OR_CAPTURE"
  directions: MoveDirectionDto[];
  range: number;
  initialOnly: boolean;
}

export interface PieceDefinitionDto {
  id: number;
  code: string;
  name: string;
  enPassant: boolean;
  promotes: boolean;
  moves: MoveDefinitionDto[];
  builtIn: boolean;
  ownerId: number | null;
}

export interface CastlingRuleDto {
  id: string;
  kingToFile: number;
  rookFromFile: number;
  rookToFile: number;
}

export interface RosterEntryDto {
  symbol: string;
  pieceId: number;
  pieceCode: string;
  pieceName: string;
}

export interface GameDefinitionDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  iconRef: string | null;
  boardWidth: number;
  boardHeight: number;
  startingPosition: string;
  castling: CastlingRuleDto[];
  promotion: string[];
  roster: RosterEntryDto[];
  builtIn: boolean;
  ownerId: number | null;
  visibility: string;
  ratedEligible: boolean;
}

/** Built-in piece catalog. */
export const fetchPieceDefinitions = () => api.get<PieceDefinitionDto[]>("/api/piece-definitions");

/** Built-in game catalog. */
export const fetchGameDefinitions = () => api.get<GameDefinitionDto[]>("/api/game-definitions");
