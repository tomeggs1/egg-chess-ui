import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchDailyPuzzle, submitPuzzleMove } from "../api/puzzles";

export const dailyPuzzleKeys = {
  today: ["dailyPuzzle", "today"] as const,
};

/** Today's daily puzzle (and the caller's progress, if authenticated). */
export function useDailyPuzzle() {
  return useQuery({
    queryKey: dailyPuzzleKeys.today,
    queryFn: fetchDailyPuzzle,
    staleTime: 60_000,
  });
}

/** Submit one solver move; the server validates and reveals the next reply. */
export function useSubmitPuzzleMove() {
  return useMutation({
    mutationFn: (move: string) => submitPuzzleMove(move),
  });
}
