import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { PANEL_FRAME } from "../theme/tokens";

/**
 * GamePanel — a raster border drawn around content, and the box that wraps it.
 *
 * Why not `border-image`: that needs one image with a consistent set of slice
 * insets. Hand-cut ornamental art rarely obliges — the dialog frame's four
 * corners are four different sizes and none matches its edge thickness. So a
 * frame here is eight absolutely-positioned pieces.
 *
 * Two things this gets right that are easy to get wrong:
 *
 *   * The layer sits at `inset: 0`, which covers the wrapper's PADDING box.
 *     That is the whole border box when there is no border, so the art lands on
 *     the outer edge. Negative offsets push it outside the box entirely — which
 *     is a silent bug when the art and the surface behind it are both dark.
 *
 *   * Edges are drawn ABOVE the corners, lapped onto them by `overlap`, with
 *     their ends masked to transparent. Butted instead, a corner's bright
 *     capstone meets an edge's first block and the step is visible.
 */

export interface FrameSlice {
  /** Band thickness across the frame, in source px. */
  thickness: number;
  /** Length along the frame, in source px — the tiling period. */
  tile: number;
}

export interface FrameArt {
  /** Rendered size as a fraction of the source art. */
  scale: number;
  /** Source px of edge lapped over each corner and faded across. */
  overlap: number;
  /**
   * Per-SIDE seating corrections in RENDERED px, applied to that side's edge
   * and to both corners on it. Not scaled — they fix the output pixel grid, so
   * scaling them would reopen the gap at other sizes.
   */
  nudge: { top: number; right: number; bottom: number; left: number };
  /**
   * Per-CORNER corrections, when one corner alone is out of true. Positive x
   * moves right, positive y moves down, regardless of which edges the corner is
   * pinned to. Also rendered px.
   */
  cornerNudge?: Partial<Record<"tl" | "tr" | "bl" | "br", { x?: number; y?: number }>>;
  corner: {
    tl: { w: number; h: number };
    tr: { w: number; h: number };
    bl: { w: number; h: number };
    br: { w: number; h: number };
  };
  edge: { top: FrameSlice; bottom: FrameSlice; left: FrameSlice; right: FrameSlice };
  art: {
    tl: string; tr: string; bl: string; br: string;
    top: string; bottom: string; left: string; right: string;
  };
}

/** Clearance the content needs on each side, in rendered px. */
export function frameInset(f: FrameArt) {
  return {
    top: f.edge.top.thickness * f.scale,
    right: f.edge.right.thickness * f.scale,
    bottom: f.edge.bottom.thickness * f.scale,
    left: f.edge.left.thickness * f.scale,
  };
}

const piece = {
  position: "absolute" as const,
  display: "block",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  pointerEvents: "none" as const,
};

function fade(axis: "x" | "y", lap: number) {
  const g =
    `linear-gradient(${axis === "x" ? "90deg" : "180deg"}, transparent 0, #000 ${lap}px, ` +
    `#000 calc(100% - ${lap}px), transparent 100%)`;
  return { maskImage: g, WebkitMaskImage: g };
}

/**
 * Just the eight pieces. Use this when the box already exists — GameDialog
 * drops it into MUI's dialog paper. Otherwise use `GamePanel`.
 *
 * The parent must be positioned, must not clip (`overflow: hidden` clips to the
 * padding box), and should pad its content by `frameInset`.
 */
export function FrameLayer({ art: f }: { art: FrameArt }) {
  const s = (n: number) => n * f.scale;
  const lap = s(f.overlap);
  const { corner: c, edge: e, art, nudge: n } = f;
  // Positive x is rightward and positive y is downward for every corner, so a
  // piece pinned by `right`/`bottom` subtracts where one pinned by `left`/`top`
  // adds. Callers should not have to reason about which edge a corner hangs off.
  const cn = (k: "tl" | "tr" | "bl" | "br") => ({
    x: f.cornerNudge?.[k]?.x ?? 0,
    y: f.cornerNudge?.[k]?.y ?? 0,
  });
  const [tl, tr, bl, br] = [cn("tl"), cn("tr"), cn("bl"), cn("br")];

  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      <Box sx={{ ...piece, zIndex: 0, left: -n.left + tl.x, top: -n.top + tl.y, width: s(c.tl.w), height: s(c.tl.h), backgroundImage: `url(${art.tl})` }} />
      <Box sx={{ ...piece, zIndex: 0, right: -n.right - tr.x, top: -n.top + tr.y, width: s(c.tr.w), height: s(c.tr.h), backgroundImage: `url(${art.tr})` }} />
      <Box sx={{ ...piece, zIndex: 0, left: -n.left + bl.x, bottom: -n.bottom - bl.y, width: s(c.bl.w), height: s(c.bl.h), backgroundImage: `url(${art.bl})` }} />
      <Box sx={{ ...piece, zIndex: 0, right: -n.right - br.x, bottom: -n.bottom - br.y, width: s(c.br.w), height: s(c.br.h), backgroundImage: `url(${art.br})` }} />

      <Box sx={{ ...piece, ...fade("x", lap), zIndex: 1, top: -n.top,
        left: s(c.tl.w) - lap, right: s(c.tr.w) - lap, height: s(e.top.thickness),
        backgroundImage: `url(${art.top})`, backgroundSize: `${s(e.top.tile)}px 100%`, backgroundRepeat: "repeat-x" }} />
      <Box sx={{ ...piece, ...fade("x", lap), zIndex: 1, bottom: -n.bottom,
        left: s(c.bl.w) - lap, right: s(c.br.w) - lap, height: s(e.bottom.thickness),
        backgroundImage: `url(${art.bottom})`, backgroundSize: `${s(e.bottom.tile)}px 100%`, backgroundRepeat: "repeat-x" }} />
      <Box sx={{ ...piece, ...fade("y", lap), zIndex: 1, left: -n.left,
        top: s(c.tl.h) - lap, bottom: s(c.bl.h) - lap, width: s(e.left.thickness),
        backgroundImage: `url(${art.left})`, backgroundSize: `100% ${s(e.left.tile)}px`, backgroundRepeat: "repeat-y" }} />
      <Box sx={{ ...piece, ...fade("y", lap), zIndex: 1, right: -n.right,
        top: s(c.tr.h) - lap, bottom: s(c.br.h) - lap, width: s(e.right.thickness),
        backgroundImage: `url(${art.right})`, backgroundSize: `100% ${s(e.right.tile)}px`, backgroundRepeat: "repeat-y" }} />
    </Box>
  );
}

export interface GamePanelProps {
  /** Defaults to PANEL_FRAME — the gilt navy band. */
  art?: FrameArt;
  children?: ReactNode;
  /**
   * Extra padding INSIDE the frame, in px. The frame's own clearance is added
   * automatically — this is the breathing room between stone and content.
   */
  inset?: number;
  /** Applied to the wrapper. Use it for the surface fill, radius, min-height. */
  sx?: SxProps<Theme>;
  className?: string;
}

/**
 * Content in a raster frame.
 *
 * ```tsx
 * <GamePanel inset={8} sx={{ backgroundColor: SURFACE_800 }}>
 *   …card content…
 * </GamePanel>
 * ```
 *
 * Pass `art` to use a different frame; GameDialog does that with the stone
 * DIALOG_FRAME, via `FrameLayer` since its box is MUI's dialog paper.
 */
export function GamePanel({ art = PANEL_FRAME, children, inset = 0, sx, className }: GamePanelProps) {
  const pad = frameInset(art);
  return (
    <Box
      className={className}
      sx={[
        {
          position: "relative",
          // Must not clip, or the frame layer is cut to the padding box.
          overflow: "visible",
          paddingTop: `${pad.top + inset}px`,
          paddingRight: `${pad.right + inset}px`,
          paddingBottom: `${pad.bottom + inset}px`,
          paddingLeft: `${pad.left + inset}px`,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <FrameLayer art={art} />
      {children}
    </Box>
  );
}
