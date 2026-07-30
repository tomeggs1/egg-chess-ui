import GlobalStyles from "@mui/material/GlobalStyles";
import {
  ACCENT_PRIMARY,
  ICON_GRADIENT,
  SURFACE_700,
  SURFACE_BLACK,
  SURFACE_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "./tokens";

/**
 * Publishes the design tokens as `--color-*` custom properties on :root.
 *
 * Plain CSS and CSS-module files can't import from TypeScript, so before this
 * existed index.css declared its own hand-maintained copy of the palette. That
 * copy had drifted badly — `--color-accent` was still the Vite starter purple
 * (#646cff), and every surface/text value disagreed with constants.ts.
 *
 * Emitting them from tokens.ts keeps the CSS-module files (LoginPage.module.css)
 * on the same palette as the MUI theme, with one place to edit.
 */
export function GlobalCss() {
  return (
    <GlobalStyles
      styles={{
        ":root": {
          "--color-bg": SURFACE_BLACK,
          "--color-surface": SURFACE_700,
          "--color-border": SURFACE_BORDER,
          "--color-text": TEXT_PRIMARY,
          "--color-muted": TEXT_SECONDARY,
          "--color-accent": ACCENT_PRIMARY,
          // Read by the gradient stops in icons/GradientIcon.tsx — SVG markup
          // can't import from TS, so the values are published here.
          "--g-light": ICON_GRADIENT.light,
          "--g-dark": ICON_GRADIENT.dark,
        },
      }}
    />
  );
}

export default GlobalCss;
