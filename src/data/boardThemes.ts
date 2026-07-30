// Catalog of selectable board (square) themes, mirroring pieceThemes.ts. A theme
// is either the built-in CSS "Classic" look (no dir) or an image set: a folder
// under assets/images/boards/<dir>/ with `<color><variant>.png` tiles.

/** Which square shade a tile represents. Light squares = "white", dark = "black". */
export type TileColor = "white" | "black";

/** CSS square colors for a themeless (non-image) board. */
export interface BoardSquares {
  light: string;
  dark: string;
  /** Diagonal sheen overlays; omit for flat fills. */
  lightBg?: string;
  darkBg?: string;
}

export interface BoardTheme {
  /** Stable key persisted in preferences; never rename once shipped. */
  id: string;
  /** Human-readable name shown in the picker. */
  name: string;
  /** Folder under assets/images/boards/. Omitted for the CSS "Classic" theme. */
  dir?: string;
  /** Draw a dark jagged crease along the tile seams (see BoardSeams). */
  seams?: boolean;
  /** CSS square colors. Required for themes without `dir`; ignored otherwise. */
  squares?: BoardSquares;
}

/** Upper bound on tile variants per color when probing a theme's files. */
export const MAX_TILE_VARIANTS = 8;

/** Classic (CSS) square colors. Kept exported — the picker falls back to these
 *  for image themes, which have no `squares` of their own. */
export const CLASSIC_SQUARE: BoardSquares = {
  light: "#ebecd0",
  dark: "#779556",
  lightBg: "linear-gradient(135deg, #f3f4e2 0%, #e6e7ca 55%, #dcddbc 100%)",
  darkBg: "linear-gradient(135deg, #85a267 0%, #6f8f50 55%, #637f46 100%)",
};

/**
 * Warm stone squares for the medieval theme. Chosen against the default
 * Elegant Blue & Gold pieces, which are cream and navy — so the board can be
 * neither, and can't lean gold without swallowing their gilt trim.
 *
 * Measured against the piece bodies, its worst-case piece/square contrast is
 * 1.18 versus Classic Green's 1.11, and navy-on-dark is 3.50 versus 3.89 — so
 * it reads at least as clearly as the board that ships today.
 */
export const PARCHMENT_SQUARE: BoardSquares = {
  light: "#ddcda6",
  dark: "#9d7f57",
  lightBg: "linear-gradient(135deg, #e8dab9 0%, #ddcda6 55%, #cfbd93 100%)",
  darkBg: "linear-gradient(135deg, #ab8d64 0%, #9d7f57 55%, #8b6e49 100%)",
};

/** Square colors for a theme: its own, or the classic set for image themes. */
export function squaresFor(theme: BoardTheme): BoardSquares {
  return theme.squares ?? CLASSIC_SQUARE;
}

// Image themes must ship all `TILE_VARIANTS` files per color, named
// `white1.png`, `white2.png`, `black1.png`, `black2.png`. Incomplete themes are
// filtered out at runtime (see boardAssets.ts).
export const BoardThemes: BoardTheme[] = [
  { id: "parchment-bronze", name: "Parchment & Bronze", squares: PARCHMENT_SQUARE },
  { id: "classic-green", name: "Classic Green", squares: CLASSIC_SQUARE },
  { id: "grassy-sandy", name: "Grassy & Sandy", dir: "grassysandy", seams: true },
  { id: "pebble-stone", name: "Pebble Stone", dir: "pebblestone" },
];

export const DEFAULT_BOARD_THEME_ID = "parchment-bronze";

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
