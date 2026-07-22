// Resolves board tile images to hashed, build-optimized URLs via import.meta.glob,
// the same pattern as pieceAssets.ts.

import {
  BoardThemes,
  MAX_TILE_VARIANTS,
  type BoardTheme,
  type TileColor,
} from "./boardThemes";

const urls = import.meta.glob("../assets/images/boards/*/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function key(dir: string, color: TileColor, variant: number): string {
  return `../assets/images/boards/${dir}/${color}${variant}.png`;
}

/**
 * URL for a board tile, or `undefined` for the CSS "Classic" theme (no images) —
 * in which case the board falls back to its gradient squares.
 */
export function boardTileSrc(theme: BoardTheme, color: TileColor, variant: number): string | undefined {
  if (!theme.dir) return undefined;
  return urls[key(theme.dir, color, variant)];
}

/**
 * Number of interchangeable tile variants a theme ships (the largest N such that
 * white1..N and black1..N all exist). 0 for the CSS Classic theme. Lets each
 * theme carry its own variant count instead of a fixed global.
 */
export function boardVariantCount(theme: BoardTheme): number {
  if (!theme.dir) return 0;
  const colors: TileColor[] = ["white", "black"];
  let count = 0;
  for (let v = 1; v <= MAX_TILE_VARIANTS; v++) {
    if (colors.every((color) => urls[key(theme.dir!, color, v)] != null)) count = v;
    else break;
  }
  return count;
}

/** Classic (no dir) is always available; image themes need at least one variant per color. */
export function boardThemeIsComplete(theme: BoardTheme): boolean {
  return !theme.dir || boardVariantCount(theme) >= 1;
}

/**
 * The theme's seam-decal sprites (`decal1.png`, `decal2.png`, … in the theme
 * folder) — small props scattered along the tile seams. Empty if none present.
 */
export function boardDecals(theme: BoardTheme): string[] {
  if (!theme.dir) return [];
  const dir = theme.dir;
  return Object.keys(urls)
    .filter((k) => k.includes(`/boards/${dir}/`) && /\/decal\d+\.png$/.test(k))
    .sort()
    .map((k) => urls[k]);
}

/** Board themes safe to offer in the picker (all tiles present). */
export const AVAILABLE_BOARD_THEMES: BoardTheme[] = BoardThemes.filter(boardThemeIsComplete);
