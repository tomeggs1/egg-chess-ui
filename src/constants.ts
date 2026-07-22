// Player-facing brand name. Safe to change freely — used only for display.
export const APP_NAME = "HP Chess";

// Stable prefix for localStorage keys. Intentionally decoupled from APP_NAME:
// changing the display name must NOT invalidate existing users' saved tokens /
// remembered usernames. Do not change this without a migration.
export const STORAGE_PREFIX = "Chess++";

// ============================================================================
// Color palette
// ----------------------------------------------------------------------------
// Tuned for a black (#000) background. Accent/text colors have enough
// luminance to stay legible on dark surfaces; brand colors are kept for
// logos/fills where contrast is handled by surrounding elements.
// ============================================================================

// --- Brand ------------------------------------------------------------------
export const MAIN_BLUE = "#143d95";
export const MAIN_BLUE_LIGHT = "#1e4dd8";
export const MAIN_BLUE_DARK = "#162456";
export const MAIN_PURPLE = "#6002c5";
export const MAIN_WHITE = "#FFFFFF";

// --- Accents (pop against black) --------------------------------------------
export const ACCENT_BLUE = "#4d8dff"; // primary interactive accent
export const ACCENT_CYAN = "#22d3ee";
export const ACCENT_TEAL = "#2dd4bf";
export const ACCENT_PURPLE = "#a855f7";
export const ACCENT_PINK = "#f472b6";
export const ACCENT_AMBER = "#fbbf24";
export const ACCENT_GREEN = "#34d399";

// --- Semantic ---------------------------------------------------------------
export const COLOR_SUCCESS = "#22c55e";
export const COLOR_WARNING = "#f59e0b";
export const COLOR_ERROR = "#ef4444";
export const COLOR_ERROR_TRANSPARENT = "#ef4444d0";
export const COLOR_INFO = "#38bdf8";

// --- Surfaces (layered dark backgrounds) ------------------------------------
export const SURFACE_BLACK = "#000000"; // app background
export const SURFACE_900 = "#0d0d0f"; // near-black raised base
export const SURFACE_800 = "#161618"; // cards / panels
export const SURFACE_700 = "#222225"; // nav / sidebars
export const SURFACE_600 = "#303034"; // hover / active states
export const SURFACE_BORDER = "#3a3a3f"; // dividers / outlines

// --- Text (on dark) ---------------------------------------------------------
export const TEXT_PRIMARY = "#f5f5f7"; // headings / high-emphasis
export const TEXT_SECONDARY = "#b5b5bd"; // body / medium-emphasis
export const TEXT_MUTED = "#7c7c85"; // captions / disabled

// --- Palette groupings (handy for iteration) --------------------------------
export const ACCENTS = [ACCENT_BLUE, ACCENT_CYAN, ACCENT_TEAL, ACCENT_GREEN, ACCENT_PINK, ACCENT_PURPLE] as const;
