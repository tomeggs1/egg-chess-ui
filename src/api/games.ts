import { api } from "./client";

/** A move over the wire (mirrors MoveDto on the service). */
export interface WireMove {
  fromFile: number;
  fromRank: number;
  toFile: number;
  toRank: number;
  kind: string | null; // "MOVE" | "CAPTURE" (legal moves only)
  promotion: string | null; // promoted piece code
}

/** Full live-game state (mirrors GameStateResponse on the service). */
export interface GameState {
  id: number;
  gameDefinitionId: string;
  boardWidth: number;
  boardHeight: number;
  placement: string; // FEN-like over roster symbols
  sideToMove: "white" | "black";
  whiteUsername: string;
  blackUsername: string;
  whiteAvatarKey: string | null;
  blackAvatarKey: string | null;
  whiteRating: number;
  blackRating: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  result: string | null; // "1-0" | "0-1" | "1/2-1/2"
  winnerUsername: string | null;
  outcome: "ONGOING" | "CHECK" | "CHECKMATE" | "STALEMATE"; // engine view (drives the check glow)
  /** Why a finished game ended; null while active. */
  endReason:
    | "CHECKMATE"
    | "STALEMATE"
    | "RESIGNATION"
    | "TIMEOUT"
    | "AGREEMENT"
    | "INSUFFICIENT_MATERIAL"
    | "THREEFOLD_REPETITION"
    | null;
  drawOfferBy: "white" | "black" | null; // side with an outstanding draw offer
  whiteMs: number | null; // remaining ms as of serverNow; null = untimed
  blackMs: number | null;
  serverNow: number; // server epoch ms the clocks were computed at
  capturedByWhite: string[]; // black piece codes White has captured
  capturedByBlack: string[]; // white piece codes Black has captured
  placements: string[]; // placement after each ply; [0] = start (for move review)
  moves: WireMove[];
  legalMoves: WireMove[];
}

export interface SubmitMove {
  fromFile: number;
  fromRank: number;
  toFile: number;
  toRank: number;
  promotion?: string;
}

export function getGame(id: string): Promise<GameState> {
  return api.get<GameState>(`/api/games/${id}`);
}

export function submitMove(id: string, move: SubmitMove): Promise<GameState> {
  return api.post<GameState>(`/api/games/${id}/moves`, move);
}

export function resignGame(id: string): Promise<GameState> {
  return api.post<GameState>(`/api/games/${id}/resign`);
}

/** Ask the server to check for (and settle) a flag fall. */
export function claimTimeout(id: string): Promise<GameState> {
  return api.post<GameState>(`/api/games/${id}/claim-timeout`);
}

/** Offer a draw to the opponent. */
export function offerDraw(id: string): Promise<GameState> {
  return api.post<GameState>(`/api/games/${id}/draw/offer`);
}

/** Accept the opponent's outstanding draw offer (ends the game 1/2-1/2). */
export function acceptDraw(id: string): Promise<GameState> {
  return api.post<GameState>(`/api/games/${id}/draw/accept`);
}

/** Decline the opponent's outstanding draw offer. */
export function declineDraw(id: string): Promise<GameState> {
  return api.post<GameState>(`/api/games/${id}/draw/decline`);
}
