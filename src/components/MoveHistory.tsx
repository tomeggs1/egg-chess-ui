import { useEffect, useRef, useState } from "react";
import { Box, Collapse, IconButton, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import { moveText, type MoveRecord } from "../board/history";
import { ACCENT_BLUE, SURFACE_BLACK, SURFACE_BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

export type Notation = "uci" | "san";

interface MoveHistoryProps {
  history: MoveRecord[];
  /** Currently-viewed ply index; -1 = starting position. */
  currentPly: number;
  onJump: (ply: number) => void;
  /** Active notation, and whether to show the UCI/SAN toggle (standard game only). */
  notation: Notation;
  onNotationChange: (n: Notation) => void;
  showNotationToggle: boolean;
  /** Figurine SAN per ply (null = fall back to UCI). Only used when notation === "san". */
  sanText?: (string | null)[] | null;
}

/**
 * Scrolling two-column move list (white | black) with click-to-jump and
 * start/prev/next/end navigation. Notation is coordinate-based (variant-safe).
 */
export function MoveHistory({
  history,
  currentPly,
  onJump,
  notation,
  onNotationChange,
  showNotationToggle,
  sanText,
}: MoveHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentPly]);

  const rows = Math.ceil(history.length / 2);
  const last = history.length - 1;

  const label = (ply: number) => {
    const san = notation === "san" && sanText ? sanText[ply] : null;
    return san ?? moveText(history[ply]);
  };

  const cell = (ply: number) => {
    if (ply >= history.length) return <Box sx={{ flex: 1 }} />;
    const active = ply === currentPly;
    return (
      <Box
        ref={active ? activeRef : undefined}
        onClick={() => onJump(ply)}
        sx={{
          flex: 1,
          cursor: "pointer",
          px: 0.75,
          py: 0.25,
          borderRadius: "6px",
          fontVariantNumeric: "tabular-nums",
          fontSize: "0.85rem",
          color: active ? TEXT_PRIMARY : TEXT_SECONDARY,
          backgroundColor: active ? "rgba(77,141,255,0.25)" : "transparent",
          "&:hover": { backgroundColor: active ? "rgba(77,141,255,0.25)" : "rgba(255,255,255,0.06)" },
        }}
      >
        {label(ply)}
      </Box>
    );
  };

  const navSx = { color: TEXT_SECONDARY, "&.Mui-disabled": { color: "rgba(255,255,255,0.15)" } };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "16px",
        backgroundColor: SURFACE_BLACK,
        border: `1px solid ${SURFACE_BORDER}`,
        width: { xs: "100%", md: 220 },
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
          mb: expanded ? 1 : 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY }}>
          Moves
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
        {showNotationToggle && (
          <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 1 }}>
            <ToggleButtonGroup
              value={notation}
              exclusive
              size="small"
              onChange={(_e, value: Notation | null) => {
                if (value) onNotationChange(value);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  color: TEXT_SECONDARY,
                  textTransform: "none",
                  px: 1.25,
                  py: 0.25,
                  fontSize: "0.72rem",
                  borderColor: SURFACE_BORDER,
                  "&.Mui-selected": {
                    color: TEXT_PRIMARY,
                    backgroundColor: ACCENT_BLUE,
                    "&:hover": { backgroundColor: ACCENT_BLUE },
                  },
                },
              }}
            >
              <ToggleButton value="uci">UCI</ToggleButton>
              <ToggleButton value="san">SAN</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        <Box sx={{ maxHeight: 140, overflowY: "auto", mb: 1 }}>
          {history.length === 0 ? (
            <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
              No moves yet.
            </Typography>
          ) : (
            <Stack direction="column" sx={{ gap: 0.25 }}>
              {Array.from({ length: rows }, (_, i) => (
                <Stack key={i} direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 26, flexShrink: 0, textAlign: "right", color: TEXT_MUTED, fontSize: "0.8rem" }}>
                    {i + 1}.
                  </Box>
                  {cell(2 * i)}
                  {cell(2 * i + 1)}
                </Stack>
              ))}
            </Stack>
          )}
        </Box>

        <Stack direction="row" sx={{ justifyContent: "center", gap: 0.5 }}>
          <IconButton size="small" disabled={currentPly < 0} onClick={() => onJump(-1)} sx={navSx} aria-label="Start">
            <FirstPageRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            disabled={currentPly < 0}
            onClick={() => onJump(currentPly - 1)}
            sx={navSx}
            aria-label="Previous"
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            disabled={currentPly >= last}
            onClick={() => onJump(currentPly + 1)}
            sx={navSx}
            aria-label="Next"
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            disabled={currentPly >= last}
            onClick={() => onJump(last)}
            sx={navSx}
            aria-label="End"
          >
            <LastPageRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Collapse>
    </Box>
  );
}
