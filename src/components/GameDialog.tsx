import type { ReactNode } from "react";
import { Box, Dialog, IconButton, Stack, Typography } from "@mui/material";
import type { DialogProps, SxProps, Theme } from "@mui/material";
import { Icon } from "../icons";
import { ACCENT_BRIGHT, ACCENT_DECOR, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";
import { DIALOG_CHECKER_SX, DIALOG_GLOW_SX } from "../theme/surfaces";

/**
 * The single dialog shell for the whole app.
 *
 * Every modal was assembling the same four things by hand — a 3px accent
 * hairline, a corner-wash paper, a top-right close button, and a crested header
 * with a checkerboard wash behind a 100px emblem. `theme/surfaces.ts` had
 * already extracted the *styles*; what stayed duplicated was the *structure*,
 * which is what drifted: header padding, hairline colour, and whether a close
 * button appeared at all varied between otherwise identical dialogs.
 *
 * Defaults are set from what the majority already did, so adopting this is
 * mostly deletion. The three plainer modals opt out via `glow={false}` and
 * `hairline`.
 *
 * The header is deliberately not the only way in. A dialog with a bespoke
 * header — GameOverDialog builds its emblem from the game result — simply
 * passes no header props and renders its own inside `children`, still getting
 * the paper, hairline and close button.
 *
 * This is the seam to style for the medieval pass: change the hairline, the
 * paper, the header wash or the emblem frame here and every modal follows.
 */

export type DialogHairline = "gradient" | "brass" | "none";

const HAIRLINE: Record<DialogHairline, string | undefined> = {
  gradient: `linear-gradient(90deg, ${ACCENT_BRIGHT}, ${ACCENT_DECOR})`,
  brass: ACCENT_BRIGHT,
  none: undefined,
};

export interface GameDialogProps extends Omit<DialogProps, "title" | "onClose"> {
  open: boolean;
  /**
   * Close handler. Also what drives the corner close button, so a dialog that
   * must be answered rather than dismissed simply omits it (or passes
   * `showClose={false}` to keep click-away closing without the button).
   */
  onClose?: () => void;
  /** Header title. Supplying any header prop renders the crested header. */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Emblem image URL, rendered at 100px above the title. */
  emblem?: string;
  /** Defaults to true whenever `onClose` is given. */
  showClose?: boolean;
  /** Greys out the close button — e.g. while a form is submitting. */
  closeDisabled?: boolean;
  /** The corner-wash paper treatment. */
  glow?: boolean;
  hairline?: DialogHairline;
  /** Padding is applied to `children` unless this is false. */
  bodyPadding?: boolean;
  bodySx?: SxProps<Theme>;
  children?: ReactNode;
}

export function GameDialog({
  open,
  onClose,
  title,
  subtitle,
  emblem,
  showClose,
  closeDisabled,
  glow = true,
  hairline = "gradient",
  bodyPadding = true,
  bodySx,
  children,
  fullWidth = true,
  maxWidth = "xs",
  sx,
  ...rest
}: GameDialogProps) {
  const hasHeader = title != null || subtitle != null || emblem != null;
  const closeVisible = showClose ?? onClose != null;
  const rule = HAIRLINE[hairline];

  return (
    <Dialog
      open={open}
      // MUI hands the close reason through; callers here never want it.
      onClose={onClose ? () => onClose() : undefined}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      sx={[
        // The hairline sits flush to the paper's top edge, so the paper has to
        // clip — otherwise the border radius leaves it with square corners.
        { "& .MuiDialog-paper": { overflow: "hidden" } },
        ...(glow ? [DIALOG_GLOW_SX] : []),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {rule && <Box aria-hidden sx={{ height: "3px", background: rule }} />}

      {closeVisible && onClose && (
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={closeDisabled}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1,
            color: TEXT_MUTED,
            "&:hover": { color: TEXT_PRIMARY },
          }}
        >
          <Icon name="close" fontSize="small" />
        </IconButton>
      )}

      {hasHeader && (
        // The checker is absolutely positioned, so it needs its own element to
        // fill — keeping it out of the body also stops the wash running behind
        // buttons and form fields.
        <Box sx={{ position: "relative", overflow: "hidden", px: 3, pt: 3.5, pb: 2 }}>
          <Box aria-hidden sx={DIALOG_CHECKER_SX} />
          <Stack direction="column" sx={{ position: "relative", alignItems: "center", gap: 1.25 }}>
            {emblem && (
              // Decorative: the heading below already names the dialog, so an
              // alt would make screen readers announce it twice.
              <Box
                component="img"
                src={emblem}
                alt=""
                aria-hidden
                sx={{ width: 100, height: 100, flexShrink: 0, objectFit: "contain", display: "block" }}
              />
            )}
            {title != null && (
              <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY, textAlign: "center" }}>
                {title}
              </Typography>
            )}
            {subtitle != null && (
              <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {/*
        Only wrap when there is something to apply. MessagesDialog gives its
        paper `display:flex; flexDirection:column` and a fixed height so its
        thread list scrolls inside it — an unconditional wrapper would become
        the single flex child and collapse that layout.
      */}
      {bodyPadding || bodySx ? (
        <Box
          sx={[
            bodyPadding ? { px: 3, pb: 3, pt: hasHeader ? 0 : 3 } : {},
            ...(Array.isArray(bodySx) ? bodySx : bodySx ? [bodySx] : []),
          ]}
        >
          {children}
        </Box>
      ) : (
        children
      )}
    </Dialog>
  );
}

export default GameDialog;
