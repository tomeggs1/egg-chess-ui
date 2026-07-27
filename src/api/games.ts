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
  whiteRatingChange: number | null; // signed delta from this game; null while active / casual
  blackRatingChange: number | null;
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

/** A single row in a game-history list (mirrors GameSummaryResponse on the service). */
export interface GameSummary {
  id: number;
  gameDefinitionId: string;
  whiteUsername: string;
  blackUsername: string;
  whiteAvatarKey: string | null;
  blackAvatarKey: string | null;
  whiteRating: number | null; // pool rating snapshotted at settle; null while active
  blackRating: number | null;
  whiteRatingChange: number | null; // signed delta from this game; null if casual/active
  blackRatingChange: number | null;
  timeCategory: "LIGHTNING" | "QUICK" | "LONG";
  rated: boolean;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  result: string | null; // "1-0" | "0-1" | "1/2-1/2"
  winnerUsername: string | null;
  endReason: GameState["endReason"];
  createdAt: string; // ISO-8601 instant
  endedAt: string | null;
}

/** The slice of Spring's Page<T> JSON the UI relies on. */
export interface Page<T> {
  content: T[];
  number: number; // current page index (0-based)
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Server-side history filters; every field is optional (omitted = unconstrained). */
export interface GameHistoryFilters {
  outcome?: "won" | "lost" | "drew"; // relative to the list's subject player
  variant?: string; // gameDefinitionId
  timeCategory?: GameSummary["timeCategory"];
  status?: "active" | "finished";
  opponent?: string; // username substring
  rated?: boolean;
  from?: string; // ISO-8601 instant (inclusive)
  to?: string; // ISO-8601 instant (inclusive)
}

export interface GameHistoryParams {
  page?: number;
  size?: number;
  filters?: GameHistoryFilters;
}

/** Build a query string from paging + filters, dropping empty values. */
function historyQuery({ page = 0, size = 20, filters = {} }: GameHistoryParams): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

/** A page of the authenticated player's game history. */
export function fetchMyGameHistory(params: GameHistoryParams = {}): Promise<Page<GameSummary>> {
  return api.get<Page<GameSummary>>(`/api/games/mine?${historyQuery(params)}`);
}

/**
 * A page of another player's game history. The service allows this only for the
 * caller themselves or an accepted friend (otherwise 403).
 */
export function fetchPlayerGameHistory(
  playerId: number,
  params: GameHistoryParams = {},
): Promise<Page<GameSummary>> {
  return api.get<Page<GameSummary>>(`/api/games/player/${playerId}?${historyQuery(params)}`);
}

/** Win/loss/draw totals for a history scope (mirrors GameHistorySummaryResponse). */
export interface GameHistorySummary {
  total: number; // all games in scope, including in-progress; can exceed won+lost+drawn
  won: number;
  lost: number;
  drawn: number;
}

/** Serialize just the filters (the summary endpoints ignore paging). */
function filterQuery(filters: GameHistoryFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

/** Win/loss/draw totals for the authenticated player, respecting all filters except outcome. */
export function fetchMyGameHistorySummary(filters: GameHistoryFilters = {}): Promise<GameHistorySummary> {
  const qs = filterQuery(filters);
  return api.get<GameHistorySummary>(`/api/games/mine/summary${qs ? `?${qs}` : ""}`);
}

/** Win/loss/draw totals for a viewable player (self or accepted friend). */
export function fetchPlayerGameHistorySummary(
  playerId: number,
  filters: GameHistoryFilters = {},
): Promise<GameHistorySummary> {
  const qs = filterQuery(filters);
  return api.get<GameHistorySummary>(`/api/games/player/${playerId}/summary${qs ? `?${qs}` : ""}`);
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
