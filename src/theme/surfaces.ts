import type { SxProps, Theme } from "@mui/material";
import { DIALOG_GLOW, TEXT_PRIMARY } from "./tokens";

/**
 * Edge of one visible square in the dialog-header chessboard wash, in px.
 *
 * This is the knob — the CSS tile is two squares across, so both the size and
 * the offset derive from it. It was 17px, which at dialog width put ~26 squares
 * across the header and read as noise rather than a board.
 */
const CHECKER_SQUARE = 36;

/**
 * How far down the header the board stays at full strength before it starts
 * fading out. The fade always finishes at the header's bottom edge, so this
 * only moves where it *begins* — there's never a hard cutoff.
 *
 * At 0% (the original) the mask fades from the very top, so the pattern is
 * already half gone by the header's midpoint.
 */
const CHECKER_FADE_START = "58%";

/**
 * The faint chessboard wash behind dialog headers, fading out toward the
 * bottom. Two offset 45° gradients — the standard CSS checkerboard.
 *
 * Applied by GameDialog behind any dialog that supplies header props.
 */
const CHECKER_MASK = `linear-gradient(to bottom, black 0%, black ${CHECKER_FADE_START}, transparent 100%)`;

export const DIALOG_CHECKER_SX: SxProps<Theme> = {
  position: "absolute",
  inset: 0,
  opacity: 0.05,
  backgroundImage:
    `linear-gradient(45deg, ${TEXT_PRIMARY} 25%, transparent 25%, transparent 75%, ${TEXT_PRIMARY} 75%), ` +
    `linear-gradient(45deg, ${TEXT_PRIMARY} 25%, transparent 25%, transparent 75%, ${TEXT_PRIMARY} 75%)`,
  backgroundSize: `${CHECKER_SQUARE * 2}px ${CHECKER_SQUARE * 2}px`,
  backgroundPosition: `0 0, ${CHECKER_SQUARE}px ${CHECKER_SQUARE}px`,
  maskImage: CHECKER_MASK,
  WebkitMaskImage: CHECKER_MASK,
};

/**
 * The "glow" dialog treatment: a blue→cyan corner wash plus a colored halo,
 * layered on top of the base dialog paper defined in muiTheme.ts.
 *
 * Applied by GameDialog whenever `glow` is set, which is the default. The
 * plainer modals — ConfirmDialog, MessagesDialog, ChallengeManager — pass
 * `glow={false}` and get the base paper only.
 */
export const DIALOG_GLOW_SX: SxProps<Theme> = {
  "& .MuiDialog-paper": {
    position: "relative",
    overflow: "hidden",
    backgroundImage: DIALOG_GLOW.backgroundImage,
    boxShadow: DIALOG_GLOW.boxShadow,
  },
};
