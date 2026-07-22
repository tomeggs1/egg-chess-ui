// Catalog of selectable piece-image sets ("themes"). Mirrors the data-driven
// pattern used by gameDefinitions.ts: a theme is just data. Adding a new set is
// a folder under assets/images/pieces/<dir>/ plus one entry here.

export const PIECE_TYPES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;
export type PieceType = (typeof PIECE_TYPES)[number];

/** The two board sides. Matches PlayerColor's string values ("white"/"black"). */
export type PieceColor = "white" | "black";

export interface PieceTheme {
  /** Stable key persisted in preferences; never rename once shipped. */
  id: string;
  /** Human-readable name shown in the picker. */
  name: string;
  /** Folder name under src/assets/images/pieces/. */
  dir: string;
  /**
   * Optional per-piece height overrides for sets whose art has unusual
   * proportions. Falls back to PIECE_HEIGHT_RATIOS for any type not listed.
   */
  heightRatios?: Partial<Record<PieceType, number>>;
}

/**
 * Display height per piece type, relative to the king (1.0). Piece images are
 * sized by height × this ratio so the board keeps real chess proportions no
 * matter how each source image happens to be cropped — otherwise squat pieces
 * (e.g. pawns) render too large. A theme may override any value via
 * `PieceTheme.heightRatios`.
 */
export const PIECE_HEIGHT_RATIOS: Record<PieceType, number> = {
  king: 0.95,
  queen: 0.95,
  bishop: 0.86,
  knight: 0.84,
  rook: 0.78,
  pawn: 0.7,
};

/** Resolve the height ratio for a piece, honoring any per-theme override. */
export function pieceHeightRatio(theme: PieceTheme, type: PieceType): number {
  return theme.heightRatios?.[type] ?? PIECE_HEIGHT_RATIOS[type];
}

// Every theme MUST ship all 12 images named `<color>-<piece>.png`
// (white-king.png, black-knight.png, …). Incomplete themes are filtered out at
// runtime (see pieceAssets.ts) so a half-finished set can't render broken imgs.
//
// To add a set:
//   1. drop src/assets/images/pieces/MyTheme/{white,black}-{king,…}.webp
//   2. add a line below.
export const PieceThemes: PieceTheme[] = [
  { id: "elegant-blue-gold", name: "Elegant Blue & Gold", dir: "ElegantBlueGold" },
  { id: "clash-style", name: "Clash Style", dir: "ClashStyle" },
  { id: "clash2", name: "Clash 2", dir: "Clash2" },
  { id: "simple3d", name: "Simple 3D", dir: "Simple3D" },
  { id: "neo", name: "Neo", dir: "Neo" },
  { id: "flat", name: "Flat", dir: "Flat" },
  { id: "mono", name: "Mono", dir: "Mono" },
  { id: "basic", name: "Basic", dir: "Basic" },
];

export const DEFAULT_THEME_ID = "elegant-blue-gold";
