import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchMyGameHistory,
  fetchMyGameHistorySummary,
  type GameHistoryFilters,
  type GameSummary,
  type Page,
} from "../api/games";

// Centralized query keys so the dashboard preview and the full history page
// share (and can invalidate) the same cache namespace. Filters are part of the
// key so switching filters starts a fresh paginated query.
export const gameHistoryKeys = {
  all: ["gameHistory"] as const,
  recent: (size: number) => [...gameHistoryKeys.all, "recent", size] as const,
  list: (filters: GameHistoryFilters) => [...gameHistoryKeys.all, "list", filters] as const,
  summary: (filters: GameHistoryFilters) => [...gameHistoryKeys.all, "summary", filters] as const,
};

const PAGE_SIZE = 20;

/**
 * The authenticated player's full game history as an infinite (load-more) list.
 * `getNextPageParam` returns the next 0-based page index until the server
 * reports the last page.
 */
export function useMyGameHistory(filters: GameHistoryFilters = {}) {
  return useInfiniteQuery({
    queryKey: gameHistoryKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchMyGameHistory({ page: pageParam, size: PAGE_SIZE, filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page<GameSummary>) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });
}

/**
 * Win/loss/draw totals for the authenticated player, respecting the same filters
 * as the list (except outcome). Fetched once per filter set, not per page.
 */
export function useMyGameHistorySummary(filters: GameHistoryFilters = {}) {
  return useQuery({
    queryKey: gameHistoryKeys.summary(filters),
    queryFn: () => fetchMyGameHistorySummary(filters),
  });
}

/**
 * The most recent games for a compact dashboard preview. Defaults to 5 rows and
 * no filters — just the newest games in either color.
 */
export function useRecentGames(count = 5) {
  return useQuery({
    queryKey: gameHistoryKeys.recent(count),
    queryFn: () => fetchMyGameHistory({ page: 0, size: count }),
    select: (page) => page.content,
  });
}
