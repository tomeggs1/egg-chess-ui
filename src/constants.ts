// Player-facing brand name. Safe to change freely — used only for display.
export const APP_NAME = "HP Chess";

// Stable prefix for localStorage keys. Intentionally decoupled from APP_NAME:
// changing the display name must NOT invalidate existing users' saved tokens /
// remembered usernames. Do not change this without a migration.
export const STORAGE_PREFIX = "Chess++";

// ============================================================================
// Design tokens — re-exported for backward compatibility.
// ----------------------------------------------------------------------------
// The palette lives in theme/tokens.ts, which is the single source of truth
// (it also feeds the MUI theme and the --color-* custom properties). These
// re-exports exist so the ~40 modules already importing colors from "constants"
// keep working unchanged.
//
// New code should import from "theme/tokens" (or better: use the MUI theme /
// CSS variables) rather than adding to this list.
// ============================================================================
export {
  ACCENT_PRIMARY,
  ACCENT_BRIGHT,
  ACCENT_DECOR,
  ACCENT_COOL,
  ACCENT_AMBER,
  ACCENT_GREEN,
  CTA_PRIMARY,
  CTA_PRIMARY_DARK,
  CTA_SECONDARY,
  MAIN_WHITE,
  COLOR_SUCCESS,
  COLOR_WARNING,
  COLOR_ERROR,
  COLOR_ERROR_TRANSPARENT,
  COLOR_INFO,
  COLOR_DRAW,
  HP,
  ELIXIR,
  PIECE_IVORY,
  PIECE_EBONY,
  SURFACE_BLACK,
  SURFACE_900,
  SURFACE_800,
  SURFACE_700,
  SURFACE_600,
  SURFACE_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  RESULT_ACCENT,
  ACCENTS,
  RADIUS,
  BORDER_WIDTH,
  CARVED,
  STONE_TEXTURE,
  FONT,
} from "./theme/tokens";
