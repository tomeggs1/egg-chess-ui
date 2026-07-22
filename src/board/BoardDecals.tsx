import { Box } from "@mui/material";

interface BoardDecalsProps {
  /** Decal sprite URLs to scatter along the seams. */
  decals: string[];
}

const SQ = 12.5; // % of the board per square
const MAX_PER_EDGE = 2; // decal slots considered per seam segment
const PLACE_CHANCE = 0.5; // chance a given slot is filled
const PERP_JITTER = 0.1; // % of board a decal may drift off the seam line
const MIN_SIZE = 0.5; // decal width as % of board
const MAX_SIZE = 1.0;

// Deterministic 0..1 hash, salted so a segment's attributes are uncorrelated.
function hash(a: number, salt: number): number {
  const s = Math.sin(a * (12.9898 + salt) + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Non-interactive decoration layer: scatters small decal sprites along the
 * board's internal seams (both horizontal and vertical), so the tile boundaries
 * read as organic rather than straight lines. Each seam segment gets a few
 * deterministic-random decals (stable across re-renders). Sits above the tiles
 * but below the pieces.
 */
export function BoardDecals({ decals }: BoardDecalsProps) {
  if (decals.length === 0) return null;

  const items: React.ReactNode[] = [];

  // `horizontal` seams sit on a square's bottom edge; `vertical` on its right edge.
  const emit = (segId: number, cx: number, cy: number, alongX: boolean) => {
    for (let i = 0; i < MAX_PER_EDGE; i++) {
      const seed = segId * 17 + i * 101;
      if (hash(seed, 1) > PLACE_CHANCE) continue;
      const t = 0.18 + hash(seed, 2) * 0.64; // position along the edge (0..1)
      const perp = (hash(seed, 3) - 0.5) * 2 * PERP_JITTER;
      const size = MIN_SIZE + hash(seed, 4) * (MAX_SIZE - MIN_SIZE);
      const rot = 0; //Math.floor(hash(seed, 5) * 360);
      const idx = Math.min(decals.length - 1, Math.floor(hash(seed, 6) * decals.length));
      const left = alongX ? cx + (t - 0.5) * SQ : cx + perp;
      const top = alongX ? cy + perp : cy + (t - 0.5) * SQ;
      items.push(
        <Box
          key={`${segId}-${i}`}
          component="img"
          src={decals[idx]}
          alt=""
          aria-hidden
          draggable={false}
          sx={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}%`,
            height: "auto",
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
            pointerEvents: "none",
          }}
        />,
      );
    }
  };

  // Internal horizontal seams: between rows sr and sr+1, centered on each square.
  for (let sr = 0; sr < 7; sr++) {
    for (let sc = 0; sc < 8; sc++) {
      emit(sr * 8 + sc, sc * SQ + SQ / 2, (sr + 1) * SQ, true);
    }
  }
  // Internal vertical seams: between cols sc and sc+1.
  for (let sc = 0; sc < 7; sc++) {
    for (let sr = 0; sr < 8; sr++) {
      emit(1000 + sc * 8 + sr, (sc + 1) * SQ, sr * SQ + SQ / 2, false);
    }
  }

  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {items}
    </Box>
  );
}
