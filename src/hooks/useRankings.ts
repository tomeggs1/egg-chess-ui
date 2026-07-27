import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchRankings, type RankingsQuery } from "../api/rankings";

// Query keys namespaced by the full query (variant + speed + paging), so
// switching pool or page starts a fresh cache entry.
export const rankingKeys = {
  all: ["rankings"] as const,
  list: (q: RankingsQuery) => [...rankingKeys.all, "list", q] as const,
};

/**
 * One page of a pool's leaderboard. `keepPreviousData` holds the current rows
 * on screen while a new pool/page loads, avoiding a flash of empty state.
 */
export function useRankings(query: RankingsQuery) {
  return useQuery({
    queryKey: rankingKeys.list(query),
    queryFn: () => fetchRankings(query),
    placeholderData: keepPreviousData,
  });
}
