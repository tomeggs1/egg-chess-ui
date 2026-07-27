// Read access to the public leaderboards (one pool = variant + speed).
import { api } from "./client";

/** Speed bucket a rating pool is keyed by — mirrors the server's TimeCategory. */
export type RankingSpeed = "LIGHTNING" | "QUICK" | "LONG";

/** One leaderboard row; self-contained so it renders without a follow-up call. */
export interface RankingEntry {
  rank: number;
  playerId: number;
  username: string;
  country: string | null;
  avatarKey: string | null;
  rating: number;
  ratingDeviation: number;
  gamesPlayed: number;
  peakRating: number;
}

/** One page of a pool's leaderboard. */
export interface RankingsPage {
  variant: string;
  speed: RankingSpeed;
  limit: number;
  offset: number;
  /** Players meeting the games-played floor in this pool — for "showing X of N". */
  totalEligible: number;
  entries: RankingEntry[];
}

export interface RankingsQuery {
  variant: string;
  speed: RankingSpeed;
  limit?: number;
  offset?: number;
}

/** Fetch one page of the leaderboard for a (variant, speed) pool. Public. */
export function fetchRankings({ variant, speed, limit, offset }: RankingsQuery): Promise<RankingsPage> {
  const params = new URLSearchParams({ variant, speed });
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  return api.get<RankingsPage>(`/api/rankings?${params.toString()}`);
}
