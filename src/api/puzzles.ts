// Daily puzzle API. The solution is never sent up front: the server reveals each
// opponent reply only after a correct move (see PuzzleDailyService).
import { api } from "./client";

export type PuzzleStatus = "NOT_STARTED" | "IN_PROGRESS" | "SOLVED" | "FAILED";

export interface DailyPuzzle {
  puzzleDate: string; // ISO date, e.g. "2026-07-28"
  initialFen: string;
  opponentFirstMove: string; // the setup move (auto-played), UCI
  solverColor: "white" | "black";
  rating: number;
  featuredTheme: string | null;
  status: PuzzleStatus;
  movesPlayed: string[]; // confirmed moves after the setup move; full line once solved/failed
  wrongMoves: number;
  hintsUsed: number;
  solveMs: number | null;
}

export interface PuzzleMoveResult {
  result: "correct" | "wrong" | "solved" | "failed";
  solved: boolean;
  opponentReply: string | null; // present on "correct" — animate this reply
  wrongMoves: number;
  solveMs: number | null; // present on "solved"
  cleanSolve: boolean | null; // present on "solved"
}

export const fetchDailyPuzzle = () => api.get<DailyPuzzle>("/api/puzzles/daily");

export const submitPuzzleMove = (move: string) =>
  api.post<PuzzleMoveResult>("/api/puzzles/daily/move", { move });
