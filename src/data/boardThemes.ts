// Catalog of selectable board (square) themes, mirroring pieceThemes.ts. A theme
// is either the built-in CSS "Classic" look (no dir) or an image set: a folder
// under assets/images/boards/<dir>/ with `<color><variant>.png` tiles.

/** Which square shade a tile represents. Light squares = "white", dark = "black". */
export type TileColor = "white" | "black";

export interface BoardTheme {
  /** Stable key persisted in preferences; never rename once shipped. */
  id: string;
  /** Human-readable name shown in the picker. */
  name: string;
  /** Folder under assets/images/boards/. Omitted for the CSS "Classic" theme. */
  dir?: string;
  /** Draw a dark jagged crease along the tile seams (see BoardSeams). */
  seams?: boolean;
}

/** Upper bound on tile variants per color when probing a theme's files. */
export const MAX_TILE_VARIANTS = 8;

/** Classic (CSS) square colors, also used for the picker swatch. */
export const CLASSIC_SQUARE = { light: "#ebecd0", dark: "#779556" } as const;

// Image themes must ship all `TILE_VARIANTS` files per color, named
// `white1.png`, `white2.png`, `black1.png`, `black2.png`. Incomplete themes are
// filtered out at runtime (see boardAssets.ts).
export const BoardThemes: BoardTheme[] = [
  { id: "classic-green", name: "Classic Green" },
  { id: "grassy-sandy", name: "Grassy & Sandy", dir: "grassysandy", seams: true },
  { id: "pebble-stone", name: "Pebble Stone", dir: "pebblestone" },
];

export const DEFAULT_BOARD_THEME_ID = "classic-green";

/**
 * Deterministic 1-based tile variant (1..count) for a square. Deterministic (not
 * random) so a square keeps the same variant across re-renders — no flicker —
 * while the pattern still looks scattered rather than a regular repeat. `count`
 * is the theme's actual variant count (see boardVariantCount).
 */
export function tileVariant(file: number, rank: number, count: number): number {
  if (count <= 1) return 1;
  const seeded = Math.sin((file + 1) * 12.9898 + (rank + 1) * 78.233) * 43758.5453;
  const frac = seeded - Math.floor(seeded);
  return Math.floor(frac * count) + 1;
}

/**
 * Deterministic tile rotation (0/90/180/270°) for a square, to further break up
 * repetition. Uses a different seed than tileVariant so variant and rotation
 * aren't correlated. Square tiles stay perfectly aligned under these rotations.
 */
export function tileRotation(file: number, rank: number): number {
  const seeded = Math.sin((file + 1) * 39.3468 + (rank + 1) * 11.135) * 24634.6345;
  const frac = seeded - Math.floor(seeded);
  return Math.floor(frac * 4) * 90;
}
