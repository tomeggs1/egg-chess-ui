// Resolves piece images to hashed, build-optimized URLs. Vite's import.meta.glob
// eagerly maps every piece image (webp/svg/png) under assets/images/pieces/ at
// build time, so a theme can ship whichever format suits it — dropping in a
// theme folder is enough. Images are matched by name, ignoring the extension.

import {
  DEFAULT_THEME_ID,
  PIECE_TYPES,
  PieceThemes,
  type PieceColor,
  type PieceTheme,
  type PieceType,
} from "./pieceThemes";

const files = import.meta.glob(
  ["../assets/images/pieces/*/*.webp", "../assets/images/pieces/*/*.svg", "../assets/images/pieces/*/*.png"],
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

// Index by path without extension, so lookup is format-agnostic.
const byBase: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  byBase[path.replace(/\.(webp|svg|png)$/i, "")] = url;
}

function base(dir: string, color: PieceColor, type: PieceType): string {
  return `../assets/images/pieces/${dir}/${color}-${type}`;
}

const DEFAULT_THEME = PieceThemes.find((t) => t.id === DEFAULT_THEME_ID) ?? PieceThemes[0];

// The flat "Mono" set doubles as the UI icon set (legible at small sizes in
// panels/trays). Falls back to the default theme per-piece if it's absent.
const NEO_THEME = PieceThemes.find((t) => t.id === "neo");

/**
 * Piece image for small UI chrome (captured tray, status) — always the Mono set
 * so icons stay consistent and legible regardless of the board's piece theme.
 */
export function uiPieceSrc(color: PieceColor, type: PieceType): string {
  const neo = NEO_THEME && byBase[base(NEO_THEME.dir, color, type)];
  return neo ?? byBase[base(DEFAULT_THEME.dir, color, type)];
}

/**
 * URL for a piece image. Falls back to the default theme's equivalent image if
 * the requested theme is missing that asset, so the board never renders a
 * broken <img>.
 */
export function pieceSrc(theme: PieceTheme, color: PieceColor, type: PieceType): string {
  return byBase[base(theme.dir, color, type)] ?? byBase[base(DEFAULT_THEME.dir, color, type)];
}

/** True only when a theme ships all 12 required images (any supported format). */
export function themeIsComplete(theme: PieceTheme): boolean {
  const colors: PieceColor[] = ["white", "black"];
  return colors.every((color) => PIECE_TYPES.every((type) => byBase[base(theme.dir, color, type)] != null));
}

/** Themes safe to offer in the picker (every image present). */
export const AVAILABLE_THEMES: PieceTheme[] = PieceThemes.filter(themeIsComplete);
