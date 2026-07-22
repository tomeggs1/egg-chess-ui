import { Fragment, useEffect, useMemo, useRef } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import { sanFigurineFromUci } from "../board/san";
import type { WireMove } from "../api/games";
import { SURFACE_BLACK, SURFACE_BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

const FILES = "abcdefgh";
const square = (file: number, rank: number) => `${FILES[file] ?? "?"}${rank + 1}`;
const UCI_PROMO: Record<string, string> = { queen: "q", rook: "r", bishop: "b", knight: "n" };
const uci = (m: WireMove) =>
  `${square(m.fromFile, m.fromRank)}${square(m.toFile, m.toRank)}${m.promotion ? (UCI_PROMO[m.promotion] ?? "") : ""}`;

interface GameMovesPanelProps {
  moves: WireMove[];
  /** Currently-viewed ply index; -1 = starting position. */
  viewedPly: number;
  /** Jump to a ply (-1 = start). Values ≥ last mean "follow live". */
  onSelect: (ply: number) => void;
  /** Standard game → SAN notation; otherwise UCI (variant-safe). */
  standard: boolean;
}

/**
 * Compact one-line move strip that scrolls horizontally as the user navigates.
 * SAN (figurine) for standard games, UCI for variants. Click a move or use the
 * nav buttons / arrow keys to review earlier positions.
 */
export function GameMovesPanel({ moves, viewedPly, onSelect, standard }: GameMovesPanelProps) {
  const last = moves.length - 1;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);

  // SAN for standard games; fall back to UCI per move where SAN isn't available.
  const san = useMemo(() => (standard ? sanFigurineFromUci(moves) : null), [standard, moves]);
  const label = (ply: number) => san?.[ply] ?? uci(moves[ply]);

  // Keep the viewed move in view as the user steps through.
  useEffect(() => {
    if (viewedPly < 0) {
      scrollRef.current?.scrollTo({ left: 0 });
    } else {
      activeRef.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
  }, [viewedPly]);

  // ←/→ steps through the history.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onSelect(Math.max(-1, viewedPly - 1));
      else if (e.key === "ArrowRight") onSelect(Math.min(last, viewedPly + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewedPly, last, onSelect]);

  const navSx = { color: TEXT_SECONDARY, "&.Mui-disabled": { color: "rgba(255,255,255,0.15)" } };

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 0.25,
        p: 0.5,
        borderRadius: "12px",
        backgroundColor: SURFACE_BLACK,
        border: `1px solid ${SURFACE_BORDER}`,
      }}
    >
      <IconButton size="small" disabled={viewedPly < 0} onClick={() => onSelect(-1)} sx={navSx} aria-label="Start">
        <FirstPageRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        disabled={viewedPly < 0}
        onClick={() => onSelect(viewedPly - 1)}
        sx={navSx}
        aria-label="Previous"
      >
        <ChevronLeftRoundedIcon fontSize="small" />
      </IconButton>

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
          "&::-webkit-scrollbar": { height: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "3px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
        }}
      >
        {moves.length === 0 ? (
          <Typography sx={{ color: TEXT_MUTED, fontSize: "0.85rem", px: 0.5 }}>No moves yet.</Typography>
        ) : (
          moves.map((_m, ply) => (
            <Fragment key={ply}>
              {ply % 2 === 0 && (
                <Typography
                  component="span"
                  sx={{ color: TEXT_MUTED, fontSize: "0.8rem", flexShrink: 0, ml: ply === 0 ? 0 : 0.75, mr: 0.25 }}
                >
                  {ply / 2 + 1}.
                </Typography>
              )}
              <Box
                component="span"
                ref={ply === viewedPly ? activeRef : undefined}
                onClick={() => onSelect(ply)}
                sx={{
                  flexShrink: 0,
                  cursor: "pointer",
                  px: 0.5,
                  py: 0.25,
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  color: ply === viewedPly ? TEXT_PRIMARY : TEXT_SECONDARY,
                  backgroundColor: ply === viewedPly ? "rgba(30,77,216,0.30)" : "transparent",
                  "&:hover": { backgroundColor: ply === viewedPly ? "rgba(30,77,216,0.30)" : "rgba(255,255,255,0.06)" },
                }}
              >
                {label(ply)}
              </Box>
            </Fragment>
          ))
        )}
      </Box>

      <IconButton
        size="small"
        disabled={viewedPly >= last}
        onClick={() => onSelect(viewedPly + 1)}
        sx={navSx}
        aria-label="Next"
      >
        <ChevronRightRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" disabled={viewedPly >= last} onClick={() => onSelect(last)} sx={navSx} aria-label="End">
        <LastPageRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
