import { createTheme } from "@mui/material/styles";
import {
  ACCENT_PRIMARY,
  COLOR_ERROR,
  COLOR_INFO,
  COLOR_SUCCESS,
  COLOR_WARNING,
  DIALOG_BORDER,
  FONT,
  FONT_WEIGHT,
  INPUT_FILL,
  INPUT_FOCUS_RING,
  CTA_PRIMARY,
  ACCENT_BRIGHT,
  CTA_SECONDARY,
  RADIUS,
  BORDER_WIDTH,
  CARVED,
  SHADOW,
  SURFACE_800,
  SURFACE_BLACK,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "./tokens";

/**
 * The app's MUI theme, derived entirely from theme/tokens.ts.
 *
 * Before this existed there was no ThemeProvider at all: every MUI component
 * rendered with the stock *light* Material theme, and each call site pasted in
 * dark colors by hand via `sx`/`style`. That is why so many components carry a
 * `"& .MuiDialog-paper": { backgroundColor: SURFACE_800 }`-style override — they
 * were each compensating for a missing theme.
 *
 * Those inline overrides still win (they are more specific), so adopting this
 * theme is safe for anything already styled. What it fixes is everything that
 * was *missed* and had been quietly rendering stock Material blue on white.
 *
 * THEME: Medieval. Gold is the interactive color, corners are near-square, and
 * borders are BORDER_WIDTH (2px) rather than hairlines.
 */
export const theme = createTheme({
  palette: {
    // Matches the palette in tokens.ts: warm stone surfaces, gilt accents.
    mode: "dark",
    primary: {
      main: ACCENT_PRIMARY,
      light: ACCENT_BRIGHT,
      dark: CTA_PRIMARY,
      // Gold is light enough that white text on it fails contrast; MUI uses
      // this for filled primary buttons.
      contrastText: "#1a1510",
    },
    secondary: {
      // Deep verdigris — dark enough that parchment text reads cleanly on it.
      main: CTA_SECONDARY,
      contrastText: TEXT_PRIMARY,
    },
    error: { main: COLOR_ERROR },
    warning: { main: COLOR_WARNING },
    info: { main: COLOR_INFO },
    success: { main: COLOR_SUCCESS },
    background: {
      default: SURFACE_BLACK,
      paper: SURFACE_800,
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
      disabled: TEXT_MUTED,
    },
    divider: SURFACE_BORDER,
  },

  typography: {
    fontFamily: FONT.body,
    fontSize: 15,
    fontWeightLight: FONT_WEIGHT.light,
    fontWeightRegular: FONT_WEIGHT.regular,
    fontWeightMedium: FONT_WEIGHT.medium,
    fontWeightBold: FONT_WEIGHT.bold,
    // Headings point at the `display` stack so a re-theme can swap a single
    // token in tokens.ts and leave body copy / tables untouched.
    h1: { fontFamily: FONT.display, letterSpacing: "0.02em" },
    h2: { fontFamily: FONT.display, letterSpacing: "0.02em" },
    h3: { fontFamily: FONT.display, letterSpacing: "0.04em" },
    h4: { fontFamily: FONT.display, letterSpacing: "0.04em" },
    h5: { fontFamily: FONT.display, letterSpacing: "0.06em" },
    h6: { fontFamily: FONT.display, letterSpacing: "0.08em" },
  },

  shape: {
    // Near-square. Medieval reads as cut and joined rather than moulded, so the
    // weight moved from radius into border thickness.
    borderRadius: RADIUS.md,
  },

  components: {
    // -------------------------------------------------------------------------
    // Buttons. These values came from the static block that used to live in
    // components/Button.tsx, so our wrapper is unchanged. The six files that
    // import MuiButton directly (ChallengeManager, FriendRequests, SignUpDialog,
    // StartGameDialog, GameHistoryPage, RankingsPage) previously rendered stock
    // UPPERCASE Material buttons and now match the rest of the app.
    // -------------------------------------------------------------------------
    MuiButton: {
      styleOverrides: {
        root: {
          // Engraved capitals. The previous theme forced sentence case to undo
          // Material's default; this one wants the caps back, letterspaced.
          fontFamily: FONT.display,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: FONT_WEIGHT.bold,
          borderRadius: RADIUS.md,
          border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
        },
        // Sizing lives on the size slot, not root, so `size="small"` buttons
        // keep their compact padding.
        sizeMedium: {
          padding: "9px 20px",
          fontSize: 13,
          lineHeight: "20px",
        },
      },
    },

    // -------------------------------------------------------------------------
    // Toggle buttons are a SEPARATE component from MuiButton, so the block above
    // never reached them — five files styled them by hand and they rendered in
    // body type while every real button was engraved caps.
    // -------------------------------------------------------------------------
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontFamily: FONT.display,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: FONT_WEIGHT.bold,
          fontSize: 12,
          color: TEXT_SECONDARY,
          borderColor: SURFACE_BORDER,
          borderWidth: BORDER_WIDTH,
          borderRadius: RADIUS.md,
          "&.Mui-selected": {
            color: TEXT_PRIMARY,
            backgroundColor: CTA_PRIMARY,
            "&:hover": { backgroundColor: ACCENT_BRIGHT, color: "#1a1510" },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // Menus and select dropdowns. Twelve call sites were styling this paper by
    // hand via slotProps. Worse, components/Menu.tsx painted it CTA_PRIMARY —
    // a hangover from when that token was a dark navy and doubled as a panel
    // fill. Once it became gold, every category icon on it fell to 1.4–2.0:1
    // and effectively vanished. Menu paper is a surface, so it takes a surface.
    // -------------------------------------------------------------------------
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE_800,
          color: TEXT_PRIMARY,
          border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
          borderRadius: RADIUS.md,
          boxShadow: SHADOW.md,
          backgroundImage: "none", // cancel MUI's dark-mode elevation overlay
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          gap: "10px",
          // Gilt washes, the same pair the hand-written slotProps blocks used.
          "&:hover": { backgroundColor: "rgba(201, 162, 39, 0.15)" },
          "&.Mui-selected": {
            backgroundColor: "rgba(201, 162, 39, 0.20)",
            "&:hover": { backgroundColor: "rgba(201, 162, 39, 0.20)" },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // Dialogs. Every dialog in the app was repeating this same paper treatment
    // inline. The shared base lives here; the extra "glow" flavor used by the
    // account/settings dialogs is DIALOG_GLOW_SX in theme/surfaces.ts.
    // -------------------------------------------------------------------------
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE_800,
          color: TEXT_PRIMARY,
          border: `${BORDER_WIDTH}px solid ${DIALOG_BORDER}`,
          borderRadius: RADIUS.lg,
          boxShadow: `${SHADOW.lg}, ${CARVED}`,
          backgroundImage: "none", // cancel MUI's dark-mode elevation overlay
        },
      },
    },

    // -------------------------------------------------------------------------
    // Text fields. This is the common core of what were ten near-identical
    // `fieldSx` / `searchFieldSx` / `inputSx` constants scattered across the
    // dialogs and pages. Call sites now only declare what is genuinely local to
    // them (fixed heights, minWidth, opaque backgrounds on page filters).
    // -------------------------------------------------------------------------
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            color: TEXT_PRIMARY,
            backgroundColor: INPUT_FILL,
            borderRadius: RADIUS.md,
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            "& fieldset": { borderColor: SURFACE_BORDER },
            "&:hover fieldset": { borderColor: ACCENT_PRIMARY },
            "&.Mui-focused fieldset": { borderColor: ACCENT_PRIMARY, borderWidth: "1.5px" },
            "&.Mui-focused": { boxShadow: INPUT_FOCUS_RING },
          },
          "& .MuiInputLabel-root": { color: TEXT_MUTED },
          "& .MuiInputLabel-root.Mui-focused": { color: ACCENT_PRIMARY },
          "& .MuiFormHelperText-root": { color: TEXT_MUTED },
          "& .MuiSelect-icon": { color: TEXT_MUTED },
          // Keep disabled fields legible on dark surfaces — MUI's default
          // disabled color is near-black.
          "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: TEXT_MUTED },
          "& .MuiInputLabel-root.Mui-disabled": { color: TEXT_MUTED },
          // Chrome paints autofilled inputs a hard-coded pale yellow; the inset
          // shadow is the only way to override it.
          "& .MuiInputBase-input:-webkit-autofill": {
            WebkitTextFillColor: TEXT_PRIMARY,
            WebkitBoxShadow: `0 0 0 100px ${SURFACE_800} inset`,
            caretColor: TEXT_PRIMARY,
          },
        },
      },
    },
  },
});

export default theme;
