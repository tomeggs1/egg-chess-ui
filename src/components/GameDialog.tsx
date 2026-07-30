import type { ReactNode } from "react";
import { Box, Dialog, IconButton, Stack, Typography } from "@mui/material";
import type { DialogProps, SxProps, Theme } from "@mui/material";
import { ACCENT_BRIGHT, ACCENT_DECOR, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";
import { DIALOG_CLOSE, DIALOG_FRAME, DIALOG_GLOW } from "../theme/tokens";
import { DIALOG_CHECKER_SX, DIALOG_GLOW_SX } from "../theme/surfaces";
import { FrameLayer, frameInset } from "./GamePanel";

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
 * The header is deliberately not the only way in. A dialog that needs a bespoke
 * one passes no header props and renders its own inside `children`, still
 * getting the paper, hairline and close button.
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
  /**
   * The carved stone border. On by default.
   *
   * When it is on the accent hairline is suppressed — the frame's top band
   * covers exactly where the hairline sits, so drawing both just hides one
   * under the other. Pass a `hairline` explicitly to override.
   */
  frame?: boolean;
  hairline?: DialogHairline;
  /** Padding is applied to `children` unless this is false. */
  bodyPadding?: boolean;
  bodySx?: SxProps<Theme>;
  children?: ReactNode;
}

const FRAME_INSET = frameInset(DIALOG_FRAME);

export function GameDialog({
  open,
  onClose,
  title,
  subtitle,
  emblem,
  showClose,
  closeDisabled,
  glow = true,
  frame = true,
  hairline = frame ? "none" : "gradient",
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
        // AFTER the glow: DIALOG_GLOW_SX also sets `overflow: hidden`, and the
        // later entry in an sx array wins. Put the frame first and the glow
        // silently re-clips the paper, hiding the whole frame.
        ...(frame
          ? [{
              "& .MuiDialog-paper": {
                // Must NOT clip: `overflow: hidden` clips children to the
                // PADDING box, and the frame layer sits at negative offsets
                // outside it to reach the border box. The clip only existed to
                // keep the hairline inside the radius, and the frame replaces
                // the hairline, so nothing needs it here.
                overflow: "visible",
                border: "none",
                // The frame's outline is the stone's silhouette, not a rounded
                // rectangle, so nothing may paint one at the paper's edge:
                //  - no radius, or its corner arc shows past the chamfer;
                //  - background clipped to the content box, so the surface
                //    stops exactly where the stone begins and the chamfered
                //    corners read as transparent;
                //  - the glow's 1px gilt ring dropped for the same reason.
                borderRadius: 0,
                backgroundClip: "content-box",
                ...(glow ? { boxShadow: DIALOG_GLOW.boxShadowFramed } : {}),
                paddingTop: `${FRAME_INSET.top}px`,
                paddingRight: `${FRAME_INSET.right}px`,
                paddingBottom: `${FRAME_INSET.bottom}px`,
                paddingLeft: `${FRAME_INSET.left}px`,
              },
            }]
          : []),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {/*
        `flexShrink: 0` on the chrome, and a scrolling body below.

        MUI's dialog paper is a flex column capped at `calc(100% - 64px)`. Left
        to itself, a dialog taller than the viewport shrinks its children rather
        than scrolling — SignUp's header collapsed from 220px to 44px at a 700px
        window, and since the header clips (it has to, for the checker mask) the
        title and subtitle were cut off rather than pushed out of view.
      */}
      {frame && <FrameLayer art={DIALOG_FRAME} />}
      {rule && <Box aria-hidden sx={{ height: "3px", flexShrink: 0, background: rule }} />}

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
            padding: 0.5,
            opacity: 0.85,
            transition: "opacity 0.15s ease, transform 0.15s ease",
            "&:hover": { opacity: 1, transform: "scale(1.08)" },
            "&.Mui-disabled": { opacity: 0.35 },
          }}
        >
          <Box
            component="img"
            src={DIALOG_CLOSE.art}
            alt=""
            sx={{ height: DIALOG_CLOSE.size, width: "auto", display: "block" }}
          />
        </IconButton>
      )}

      {hasHeader && (
        // The checker is absolutely positioned, so it needs its own element to
        // fill — keeping it out of the body also stops the wash running behind
        // buttons and form fields.
        //
        // When framed, the header bleeds out through the paper's padding so the
        // checker meets the stone instead of stopping short of it. Negative
        // margins take the box out to the frame; the same amount goes back on as
        // padding, so the emblem and title do not move.
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            px: 3,
            pt: 3.5,
            pb: 2,
            ...(frame
              ? {
                  marginTop: `-${FRAME_INSET.top}px`,
                  marginLeft: `-${FRAME_INSET.left}px`,
                  marginRight: `-${FRAME_INSET.right}px`,
                  paddingTop: `calc(28px + ${FRAME_INSET.top}px)`,
                  paddingLeft: `calc(24px + ${FRAME_INSET.left}px)`,
                  paddingRight: `calc(24px + ${FRAME_INSET.right}px)`,
                }
              : {}),
          }}
        >
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
              // `component="div"`, not the default <p>: subtitle takes a
              // ReactNode, and ChallengeManager puts a spinner beside its text.
              // Block elements inside a <p> are invalid and get reparented by
              // the browser, which breaks the centring.
              <Typography component="div" variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
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
            // Take the remaining height and scroll, rather than letting the
            // paper's flex layout squeeze the header. min-height:0 is required:
            // without it a flex item will not shrink below its content size and
            // the overflow never engages.
            { flex: "1 1 auto", minHeight: 0, overflowY: "auto" },
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
