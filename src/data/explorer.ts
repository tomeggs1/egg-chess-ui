/**
 * Opening-explorer client. Given a FEN, returns per-move game stats
 * (win/draw/loss counts) for the position, from either the masters database or
 * the broader amateur (lichess) database. Fetches from our own backend
 * (`/api/openings/explorer`), which proxies and caches the Lichess Opening
 * Explorer.
 *
 * Results are also cached in-memory here by `${db}:${fen}` so scrubbing move
 * history or flipping the database toggle doesn't re-hit the network for a
 * position we've already seen this session.
 */

export type ExplorerDb = "masters" | "lichess";

export interface ExplorerMove {
  uci: string;
  san: string;
  /** Games from this position that White won / drew / Black won. */
  white: number;
  draws: number;
  black: number;
  /** white + draws + black. */
  total: number;
  averageRating?: number;
}

export interface ExplorerResult {
  moves: ExplorerMove[];
  /** Total games across all listed moves. */
  total: number;
}

const cache = new Map<string, ExplorerResult>();

// The backend serves the explorer under /api; base URL mirrors the api client
// (empty in dev — Vite proxies /api to the service — set in production).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface RawMove {
  uci: string;
  san: string;
  white?: number;
  draws?: number;
  black?: number;
  total?: number;
  averageRating?: number;
}

export async function fetchExplorer(
  fen: string,
  db: ExplorerDb,
  signal?: AbortSignal,
): Promise<ExplorerResult> {
  const key = `${db}:${fen}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({ fen, db });
  const res = await fetch(`${API_BASE_URL}/api/openings/explorer?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Explorer request failed (${res.status})`);
  const data: { moves?: RawMove[]; total?: number } = await res.json();

  const moves: ExplorerMove[] = (data.moves ?? []).map((m) => {
    const white = m.white ?? 0;
    const draws = m.draws ?? 0;
    const black = m.black ?? 0;
    return { uci: m.uci, san: m.san, white, draws, black, total: m.total ?? white + draws + black, averageRating: m.averageRating };
  });
  const total = data.total ?? moves.reduce((sum, m) => sum + m.total, 0);

  const result: ExplorerResult = { moves, total };
  cache.set(key, result);
  return result;
}
