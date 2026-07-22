import { useState } from "react";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { PieceColor } from "../data/pieceThemes";
import { uiPieceSrc } from "../data/pieceAssets";
import type { Opening } from "../data/openings";
import { COLOR_ERROR, SURFACE_BLACK, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

interface GameStatusProps {
  /** Whose turn it currently is. */
  turn: PieceColor;
  /** Detected opening for the current position; null = off-book, undefined = hide the row (variants). */
  opening?: Opening | null;
  /** Terminal/threat state for the side to move. */
  outcome?: "check" | "checkmate" | "stalemate" | null;
}

/**
 * The Board Explorer's control panel — a fully controlled presentational
 * component. It owns no state; the page passes current values and change
 * handlers.
 */
export function GameStatus({ turn, opening, outcome }: GameStatusProps) {
  const [expanded, setExpanded] = useState(true);

  const banner =
    outcome === "checkmate"
      ? { text: `Checkmate — ${turn === "white" ? "Black" : "White"} wins`, color: COLOR_ERROR }
      : outcome === "stalemate"
        ? { text: "Stalemate — draw", color: TEXT_SECONDARY }
        : outcome === "check"
          ? { text: "Check", color: COLOR_ERROR }
          : null;

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: { xs: "100%", md: 220 },
        p: 2.5,
        borderRadius: "16px",
        backgroundColor: SURFACE_BLACK,
        border: `1px solid ${SURFACE_BORDER}`,
        minWidth: "350px",
      }}
    >
      <Stack
        direction="row"
        role="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          mb: expanded ? 2 : 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY }}>
          Game Status
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            color: TEXT_SECONDARY,
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </Stack>
      <Collapse in={expanded}>
        <Stack direction="column" sx={{ gap: 2 }}>
          {banner && (
            <Typography variant="body2" sx={{ color: banner.color, fontWeight: 700, textAlign: "center" }}>
              {banner.text}
            </Typography>
          )}
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
              Turn
            </Typography>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
              <Box
                component="img"
                src={uiPieceSrc(turn, "pawn")}
                alt={`${turn} pawn`}
                sx={{ height: 24, width: "auto", display: "block" }}
              />
              <Typography variant="body2" sx={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
                {turn === "white" ? "White" : "Black"}
              </Typography>
            </Stack>
          </Stack>

          {opening && (
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" sx={{ color: TEXT_SECONDARY, flexShrink: 0 }}>
                Opening
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_PRIMARY, fontWeight: 600, textAlign: "right" }}>
                {` ${opening.name}`}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}
