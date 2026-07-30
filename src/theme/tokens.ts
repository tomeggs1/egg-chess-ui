// ============================================================================
// Design tokens — THE single source of truth for the app's visual language.
// ----------------------------------------------------------------------------
// This is the file you edit to re-theme the app. Everything downstream derives
// from here:
//
//   tokens.ts ──┬──> muiTheme.ts   (MUI component defaults, palette, type)
//               ├──> GlobalCss.tsx (--color-* custom properties for CSS files)
//               └──> constants.ts  (backward-compatible named re-exports)
//
// Nothing else should declare a raw hex, radius, or font stack. If you find
// yourself typing "#" outside this file, add a token instead.
//
// THEME: Medieval. Warm stone and aged bronze, gilt interactive elements,
// near-square corners carrying weight in their borders rather than their radii.
// Names here are ROLES, not colors — the previous palette called its interactive
// accent ACCENT_BLUE, which stopped being true the moment it turned gold.
// ============================================================================

// ============================================================================
// Color
// ============================================================================

// --- Surfaces (deep shadow → lit stone) -------------------------------------
/** Recessed wells: bar tracks, icon niches, inset panels. The darkest surface. */
export const SURFACE_BLACK = "#0e0c0a";
/** App background behind everything. */
export const SURFACE_900 = "#16130f";
/** Panels, cards, dialogs — the primary "carved stone" surface. */
export const SURFACE_800 = "#211c17";
/** Raised surfaces: the nav rail. */
export const SURFACE_700 = "#2c251e";
/** Hover and pressed states. */
export const SURFACE_600 = "#3a3128";
/** Aged bronze edging. Borders are BORDER_WIDTH (2px) in this theme, not 1px. */
export const SURFACE_BORDER = "#4e4133";

// --- Text (parchment on stone) ----------------------------------------------
export const TEXT_PRIMARY = "#f2e9d8"; // 14.01:1 on SURFACE_800
export const TEXT_SECONDARY = "#c3b39a"; // 8.23:1
export const TEXT_MUTED = "#9a8b74"; // 5.08:1 — clears 4.5:1 for small text

export const MAIN_WHITE = "#FFFFFF";

// --- Interactive accents ----------------------------------------------------
/** Primary interactive. Gold is this theme's "you can click this". */
export const ACCENT_PRIMARY = "#c9a227"; // 6.98:1
/** Brighter gilt for hairlines, highlights and hover above ACCENT_PRIMARY. */
export const ACCENT_BRIGHT = "#e0bf6a"; // 9.52:1
/** Aged copper. The cool counterweight in decorative pairings. */
export const ACCENT_DECOR = "#4a9782"; // 4.86:1
/** Cold steel. Neutral accent for secondary and inactive states. */
export const ACCENT_COOL = "#7e93a8"; // 5.33:1
/** Amber, for value highlights (peak rating, caution). */
export const ACCENT_AMBER = "#d98e2b";
/** Moss, for advantage and positive values. */
export const ACCENT_GREEN = "#6f9e4c";

// --- Filled call-to-action buttons ------------------------------------------
/** Primary filled button. Deeper than ACCENT_PRIMARY so light text is unnecessary. */
export const CTA_PRIMARY = "#8c6f18";
export const CTA_PRIMARY_DARK = "#5f4a10";
/**
 * Secondary filled button. Was MAIN_PURPLE (#6002c5) — a violet, which this
 * palette forbids outside elixir. Deep verdigris instead: distinct from gold,
 * from HP red, from elixir violet, and 71° off the moss used for success.
 */
export const CTA_SECONDARY = "#2d6b5a";

// --- Semantic ---------------------------------------------------------------
export const COLOR_SUCCESS = "#6f9e4c"; // moss
export const COLOR_WARNING = "#d98e2b"; // amber
// Warm orange-red, not pure red: hue 0 belongs to HP. 16° off HP, and warm
// enough to sit in this palette without retuning.
export const COLOR_ERROR = "#ff6b35";
export const COLOR_ERROR_TRANSPARENT = "#ff6b35d0";
export const COLOR_INFO = "#7e93a8"; // steel
/** Weathered neutral for drawn games. */
export const COLOR_DRAW = "#a1917a";

// --- Result accents (top→bottom gradients) ----------------------------------
// Win / loss / draw gradients, shared by the game-history rows and the
// finished-game board frame. Loss is warmed off pure red and draw is neutral so
// neither can be mistaken for an HP or elixir bar; COLOR_DRAW is the matching
// solid for text.
export const RESULT_ACCENT = {
  win: "linear-gradient(to bottom, #8fbf5c, #35662f)",
  loss: "linear-gradient(to bottom, #f4703f, #8f3a18)",
  draw: "linear-gradient(to bottom, #b3a58c, #4e4437)",
} as const;

// --- Palette groupings (handy for iteration) --------------------------------
export const ACCENTS = [ACCENT_PRIMARY, ACCENT_BRIGHT, ACCENT_DECOR, ACCENT_COOL, ACCENT_AMBER, ACCENT_GREEN] as const;

// ============================================================================
// Gameplay resources
// ----------------------------------------------------------------------------
// HP and elixir own their hues outright: nothing else in the palette may use
// pure red (hue 0) or violet (hue ~271). COLOR_ERROR was moved off red, the
// loss gradient warmed, the draw accent neutralised, and the secondary CTA
// moved off violet specifically to keep these two unambiguous.
// ============================================================================

/**
 * Hit points. Two values because the fill is too dark to double as text.
 *
 * On this palette `fill` is only 2.97:1 against SURFACE_800 — below the 3:1
 * graphical minimum — because warm stone is lighter than the old near-black.
 * It is legible because bars sit in a recessed SURFACE_BLACK track (3.43:1).
 * If you ever place HP.fill directly on a panel, outline it.
 */
export const HP = {
  fill: "#d00100",
  text: "#f4433c", // 4.60:1 on SURFACE_800
} as const;

/**
 * Elixir. `fill` is 4.27:1 on SURFACE_800 — fine for a bar in a track, just
 * under the 4.5:1 text threshold, hence the lighter `text`.
 */
export const ELIXIR = {
  fill: "#a855f7", // 4.93:1 in a SURFACE_BLACK track
  text: "#bf7bff", // 6.03:1 on SURFACE_800
} as const;

// ============================================================================
// Icons
// ----------------------------------------------------------------------------
// How far the metallic gradient on an icon pushes past its own color, toward
// white at the top and black at the bottom. Published as --g-light / --g-dark
// (see GlobalCss) because the gradient stops are declared in SVG markup, which
// can't read TS. One knob for how metallic the whole app reads; 0% on both
// gives flat icons back.
// ============================================================================
export const ICON_GRADIENT = { light: "38%", dark: "34%" } as const;

// ============================================================================
// Data visualization
// ----------------------------------------------------------------------------
// Diverging ramp for a move's net edge (win% − loss%), used by both the
// Suggested Moves bars and the on-board arrows so they stay in sync.
//
// Two hues plus a NEUTRAL midpoint — not the red→yellow→green rainbow this
// replaced. A hue at the midpoint of a diverging scale reads as a third
// category rather than "even", and yellow's high lightness (OKLCH L 0.86 vs
// 0.64/0.72 at the poles) made the *middle* the loudest part of the scale.
//
// The poles are derived from COLOR_ERROR / COLOR_SUCCESS but snapped to equal
// lightness (L≈0.68) and chroma (C≈0.165). The raw semantic tokens differ too
// much in both (L 0.705/0.646, C 0.193/0.123) — used directly, "worst move"
// would read louder than "best move". `bad` stays at hue 16 like COLOR_ERROR,
// clear of HP's reserved hue 0; the old anchor was #ef4444, sitting on it.
// ============================================================================
export const EDGE_SCALE = {
  bad: "#ea6e42", // 5.48:1 on SURFACE_800
  mid: COLOR_DRAW, // near-neutral, C=0.038
  good: "#6ead33", // 6.18:1 on SURFACE_800
} as const;

// ============================================================================
// Chess sides
// ----------------------------------------------------------------------------
// The two playing colors, for UI that represents a *side* rather than a
// surface — the "play as white/black" picker, color legends, side badges.
//
// Semantically these are "light piece" and "dark piece", so they must always
// read as light and dark. They are warmed to ivory and ebony rather than pure
// #fff / #000, which look clinical against stone, but they are NOT palette
// colors and must not be retuned toward gold.
//
// Note EBONY is *darker* than SURFACE_800 (1.10:1 against it), so a dark-side
// swatch needs a border to stay visible on a panel — it cannot rely on its
// own fill for an edge.
// ============================================================================
export const PIECE_IVORY = "#ece2cd"; // 13.13:1 on SURFACE_800
export const PIECE_EBONY = "#17120e"; // 14.46:1 against PIECE_IVORY

// ============================================================================
// Navigation chrome
// ============================================================================
export const NAV = {
  background: SURFACE_700,
  text: TEXT_SECONDARY,
  textActive: TEXT_PRIMARY,
  hover: SURFACE_600,
  active: SURFACE_BORDER,
} as const;

// ============================================================================
// Shape
// ----------------------------------------------------------------------------
// The single biggest lever in this theme. Medieval reads as cut and joined, not
// moulded, so the radius scale is near-square and borders carry the weight that
// rounding used to. The previous scale was 4 / 10 / 16.
// ============================================================================
export const RADIUS = {
  /** Chips, swatches, bar tracks, icon niches. */
  sm: 1,
  /** Default: buttons, inputs, nav rows, list items. */
  md: 3,
  /** Cards, panels, dialogs. */
  lg: 5,
  /** Fully round — avatars, dots. */
  pill: 9999,
} as const;

/** Borders carry the weight that rounding used to. */
export const BORDER_WIDTH = 2;

// ============================================================================
// Typography
// ----------------------------------------------------------------------------
// Cinzel (engraved Roman capitals) for display, EB Garamond (genuine 16th-c.
// lineage, readable at small sizes) for body. Roboto is retained as the numeric
// face so ratings, clocks and HP values stay tabular and don't jitter.
// ============================================================================
const FALLBACK = "Georgia, 'Times New Roman', serif";

export const FONT = {
  body: `'EB Garamond', ${FALLBACK}`,
  display: `'Cinzel', ${FALLBACK}`,
  numeric: "'Roboto', system-ui, sans-serif",
} as const;

export const FONT_WEIGHT = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
} as const;

// ============================================================================
// Elevation
// ============================================================================
export const SHADOW = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.45)",
  lg: "0 40px 90px rgba(0, 0, 0, 0.85)",
} as const;

/** Inset shadow that makes a panel look carved rather than floating. */
export const CARVED = "inset 0 1px 0 rgba(255, 235, 190, 0.07), inset 0 -2px 4px rgba(0, 0, 0, 0.55)";

// ============================================================================
// Texture
// ----------------------------------------------------------------------------
// Reuses the pebble-stone board tile already in the repo rather than adding an
// asset. Tiled small under a heavy darkening gradient it reads as a stone wall
// while leaving text contrast intact.
// ============================================================================
// NOTE: this path is duplicated in Layout.module.css, which paints the page
// background — plain CSS can't import from TypeScript. Change both together.
//
// It must be the *light* tile. `black1.png` is the dark square: already dark
// AND cool blue-grey, so darkening it further composites to a neutral near
// black and loses the warmth entirely.
export const STONE_TEXTURE = new URL("../assets/images/boards/pebblestone/white1.png", import.meta.url).href;

// ============================================================================
// Nav plaque — the "you are here" row in the sidebar
// ----------------------------------------------------------------------------
// A dark gem-blue plate with a gilt end cap. Hybrid by design: the plate is CSS
// so it follows the palette, and only the cap is art.
//
// The blue is measured, not chosen. Sampling every blue-dominant pixel across
// the logo and the eight large emblems — 22,022 of them — gives a median hue of
// 259.5°, and the most common gem tones are ALREADY dark navies around #0d295b
// at L≈0.29. So `fill` is that colour, nudged lighter. This is the same blue as
// the crown gem in the nav crest, which is the point: the active row is keyed to
// the brand mark rather than to an invented accent.
//
// Two things this buys over the moss it replaces:
//   - it separates from the rail better, 1.24:1 against moss's 1.14:1 — still
//     small, but the only candidate measured that beat moss on that axis;
//   - green is COLOR_SUCCESS in this palette, so a moss plate could be read as
//     a status. Blue carries no semantic load here.
//
// The cost, stated plainly: 42° from elixir violet, the closest any UI surface
// comes to a reserved hue. Tolerable because the two never resemble each other
// in practice — elixir is a bright violet bar (L 0.63) inside a recessed track,
// this is a dark plate (L 0.34) behind text — and because the blue is anchored
// in shipped brand art rather than picked off a wheel. If elixir ever moves
// toward blue, this is the token that has to give way, not that one.
//
// Even so, the plate does not separate from the rail by lightness alone. It
// separates by hue and by `rim`, which makes the rim structural: take it to zero
// and the active state disappears. Dark oak was tried and rejected for exactly
// that reason — 3° from the rail's own hue, it had neither axis and vanished on
// the collapsed rail, where there is no cap and no label to carry it.
// ============================================================================
const PLAQUE_SRC_H = 62;      // the source artwork's height
const PLAQUE_SRC_CAP_W = 27;  // ...and the width of its gold end cap
const PLAQUE_SRC_RIM = 6;     // ...and its rim, top and bottom
const PLAQUE_ROW_H = 44;      // the rendered nav row: 10px padding + 24px icon
const PLAQUE_SCALE = PLAQUE_ROW_H / PLAQUE_SRC_H;

export const PLAQUE = {
  /** Plate fill, and the lighter shoulder the gradient runs to at top/bottom. */
  fill: "#12336e",
  lift: "#1d4a92",
  /**
   * Rim colour as bare channels, so the alpha can be composed in CSS. Taken
   * from the bright face of the crest's crown gem (#8dcef0), so the highlight
   * reads as light catching the same stone.
   */
  rim: "141 206 240",
  rimAlpha: 0.2,
  cap: {
    art: new URL("../assets/images/menu-plaque-cap.webp", import.meta.url).href,
    width: Math.round(PLAQUE_SRC_CAP_W * PLAQUE_SCALE),
    /**
     * A vertical three-slice, not a stretched background. The cap's rim stays
     * this many px top and bottom at any row height while only its middle
     * stretches; `background-size: 100% 100%` would thicken the rim and pull
     * the gem into an oval as the row grew. Left/right slices are 0 because
     * nothing about the cap stretches horizontally.
     */
    rimWidth: Math.round(PLAQUE_SRC_RIM * PLAQUE_SCALE),
    slice: `${PLAQUE_SRC_RIM} 0 ${PLAQUE_SRC_RIM} 0`,
  },
} as const;

// ============================================================================
// Nav divider
// ----------------------------------------------------------------------------
// A carved stone pillar standing between the nav rail and the page. Three
// slices: two fixed capitals and a shaft that tiles to whatever height is left.
//
// Sizing. The .webp slices are 56px wide — the .png originals are 66px, but the
// outer ~10px were fragments of neighbouring columns and have been cut away and
// made transparent by `scripts/cutout-divider.py`. Regenerate the .webp with
// that script, never by hand, and re-read the width it prints.
//
// 56px is close to a ceiling: at the current 30px this renders at 1.9x, just
// under the 2x a HiDPI screen wants. It is fine here because the art is rough
// stone with no fine detail to lose, but going wider means regenerating the
// source larger — not raising this number.
//
// The shaft is deliberately the full 579px strip rather than a single extracted
// course, so the block heights stay irregular (109 / 135 / ~108px) and the
// masonry doesn't read as a repeating stamp. The price is a visible splice
// every 263px where the strip wraps; its rows differ by ~12/255, which is under
// the mortar contrast and reads as another joint.
// ============================================================================
const DIVIDER_SOURCE_WIDTH = 56;

export const DIVIDER = {
  width: 30,
  /** Slice heights at source, used to hold each piece's aspect ratio. */
  capTop: (102 / DIVIDER_SOURCE_WIDTH) * 30,
  capBottom: (119 / DIVIDER_SOURCE_WIDTH) * 30,
  shaftTile: (579 / DIVIDER_SOURCE_WIDTH) * 30,
  art: {
    top: new URL("../assets/images/divider-stone-top.webp", import.meta.url).href,
    middle: new URL("../assets/images/divider-stone-middle.webp", import.meta.url).href,
    bottom: new URL("../assets/images/divider-stone-bottom.webp", import.meta.url).href,
  },
  /**
   * Cast both ways, so the pillar sits proud of the rail and the page alike.
   *
   * drop-shadow, not box-shadow: the slices are transparent outside the stone,
   * so a box-shadow would trace the element's rectangle and hang a shadow off
   * empty pixels wherever the silhouette narrows.
   */
  shadow: "drop-shadow(-2px 0 3px rgba(0, 0, 0, 0.55)) drop-shadow(3px 0 5px rgba(0, 0, 0, 0.55))",
} as const;

// ============================================================================
// Component treatments
// ----------------------------------------------------------------------------
// Named because they were repeated verbatim across many files, not because
// they're primitives.
// ============================================================================

/** Hairline on modal surfaces. A warm wash, so it works over any panel color. */
export const DIALOG_BORDER = "rgba(255, 235, 190, 0.14)";

/** Input interior — a barely-there warm lift off the panel behind it. */
export const INPUT_FILL = "rgba(255, 235, 190, 0.04)";

/** Soft halo on a focused input. ACCENT_PRIMARY at 18%. */
export const INPUT_FOCUS_RING = "0 0 0 4px rgba(201, 162, 39, 0.18)";

/**
 * The corner wash + glow shared by the account and settings dialogs. Applied
 * via DIALOG_GLOW_SX in theme/surfaces.ts. Gilt from the top-left, verdigris
 * from the top-right.
 */
export const DIALOG_GLOW = {
  backgroundImage:
    "radial-gradient(circle at 15% -10%, rgba(201, 162, 39, 0.20), transparent 45%), " +
    "radial-gradient(circle at 110% 0%, rgba(74, 151, 130, 0.18), transparent 42%)",
  boxShadow: `0 0 0 1px rgba(201, 162, 39, 0.28), 0 0 50px rgba(140, 111, 24, 0.30), ${SHADOW.lg}`,
} as const;
