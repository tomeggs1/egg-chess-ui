import { useState } from "react";
import {
  Box,
  CircularProgress,
  Collapse,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { PieceColor } from "../data/pieceThemes";
import type { ExplorerDb, ExplorerResult } from "../data/explorer";
import { edgeColor } from "../board/edgeColor";
import {
  ACCENT_BLUE,
  COLOR_ERROR,
  COLOR_SUCCESS,
  SURFACE_BLACK,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

interface MoveSuggestionsProps {
  /** Side to move — win% and the W/D/L bar are shown from this side's view. */
  turn: PieceColor;
  data: ExplorerResult | null;
  loading: boolean;
  error: boolean;
  /** False for variants / positions with no reliable FEN (feature hidden). */
  available: boolean;
  db: ExplorerDb;
  onDbChange: (db: ExplorerDb) => void;
  /** Whether to draw the top moves as arrows on the board. */
  showArrows: boolean;
  onToggleArrows: (value: boolean) => void;
  /** Hover a row → preview the move on the board (null on leave). */
  onHoverMove?: (uci: string | null) => void;
  /** Click a row → play the move. */
  onPlayMove?: (uci: string) => void;
}

/** Below this many games a row is dimmed — the win% is statistical noise. */
const VERY_LOW_SAMPLE = 50;
/** Below this many games a row is dimmed — the win% is statistical noise. */
const LOW_SAMPLE = 100;
const MAX_SUGGESTIONS = 5;
/** Net edge (win% − loss%) that fills a full half of the diverging bar. Real
 *  opening edges rarely exceed this, so it keeps small differences visible. */
const MAX_EDGE = 10;

const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`);

/**
 * Opening-explorer move suggestions for the Board Explorer. Shows the database's
 * most-played moves from the current position with a win/draw/loss breakdown
 * (from the side-to-move's perspective) and game counts, so players can see what
 * tends to work. Presentational — the page fetches and owns the data.
 */
export function MoveSuggestions({
  turn,
  data,
  loading,
  error,
  available,
  db,
  onDbChange,
  showArrows,
  onToggleArrows,
  onHoverMove,
  onPlayMove,
}: MoveSuggestionsProps) {
  const [expanded, setExpanded] = useState(false);

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
          Suggested Moves
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
        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1.5 }}>
          <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 1.5 }}>
            <ToggleButtonGroup
              value={db}
              exclusive
              size="small"
              onChange={(_e, value: ExplorerDb | null) => {
                if (value) onDbChange(value);
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
              <ToggleButton value="masters">Masters</ToggleButton>
              <ToggleButton value="lichess">All Players</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Board arrows toggle */}
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
              Show arrows
            </Typography>
            <Switch
              size="small"
              checked={showArrows}
              onChange={(e) => onToggleArrows(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT_BLUE },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: ACCENT_BLUE },
              }}
            />
          </Stack>
        </Stack>

        {!available ? (
          <Message text="Move stats are available in standard chess." />
        ) : loading ? (
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: 1, py: 2 }}>
            <CircularProgress size={16} sx={{ color: TEXT_SECONDARY }} />
            <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
              Loading…
            </Typography>
          </Stack>
        ) : error ? (
          <Message text="Couldn't load move stats." />
        ) : !data || data.moves.length === 0 ? (
          <Message text="No database games — you're off book." />
        ) : (
          <Stack direction="column" sx={{ gap: 0.25 }}>
            {/* Legend — the bar shows the edge for the side to move. Ends are
                labeled with the actual colors so there's no "you/opponent"
                ambiguity while exploring both sides. */}
            <Typography sx={{ fontSize: 10, color: TEXT_MUTED, textAlign: "center", mb: 0.5 }}>
              Edge for {turn === "white" ? "White" : "Black"} to move
            </Typography>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5, px: 1 }}>
              <Box sx={{ width: 42, flexShrink: 0 }} />
              <Stack
                direction="row"
                sx={{ flex: 1, minWidth: 0, alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography sx={{ fontSize: 10, color: COLOR_ERROR }}>
                  ◄ {turn === "white" ? "Black" : "White"}
                </Typography>
                <Typography sx={{ fontSize: 10, color: edgeColor(0) }}>even</Typography>
                <Typography sx={{ fontSize: 10, color: COLOR_SUCCESS }}>
                  {turn === "white" ? "White" : "Black"} ►
                </Typography>
              </Stack>
              <Box sx={{ width: 34, flexShrink: 0 }} />
            </Stack>

            {data.moves.map((m, i) => {
              const wins = turn === "white" ? m.white : m.black;
              const winPct = m.total ? Math.round((100 * wins) / m.total) : 0;
              const drawPct = m.total ? Math.round((100 * m.draws) / m.total) : 0;
              const lossPct = Math.max(0, 100 - winPct - drawPct);
              // Net edge for the side to move: >0 favors you, <0 favors opponent.
              const edge = winPct - lossPct;
              const barColor = edgeColor(edge, MAX_EDGE);
              const fillWidth = Math.min(1, Math.abs(edge) / MAX_EDGE) * 50; // % of full track
              const lowSample = m.total < LOW_SAMPLE;
              const veryLowSample = m.total < VERY_LOW_SAMPLE;

              if (veryLowSample || i >= MAX_SUGGESTIONS) {
                return <></>;
              }

              return (
                <Box
                  key={m.uci}
                  role="button"
                  onClick={() => onPlayMove?.(m.uci)}
                  onMouseEnter={() => onHoverMove?.(m.uci)}
                  onMouseLeave={() => onHoverMove?.(null)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: "8px",
                    cursor: "pointer",
                    opacity: lowSample ? 0.5 : 1,
                    transition: "background-color 0.12s",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.07)" },
                  }}
                >
                  <Typography
                    sx={{
                      width: 42,
                      flexShrink: 0,
                      fontWeight: 700,
                      color: TEXT_PRIMARY,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {m.san}
                  </Typography>

                  {/* Diverging edge bar: fills right (you) or left (opponent) from center. */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        position: "relative",
                        height: 8,
                        borderRadius: "4px",
                        overflow: "hidden",
                        backgroundColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      {/* Center (even) tick */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: "50%",
                          top: 0,
                          bottom: 0,
                          width: "1px",
                          backgroundColor: "rgba(255,255,255,0.28)",
                          transform: "translateX(-0.5px)",
                        }}
                      />
                      {/* Fill from center toward the favored side */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          width: `${fillWidth}%`,
                          backgroundColor: barColor,
                          ...(edge >= 0
                            ? { left: "50%", borderTopRightRadius: "4px", borderBottomRightRadius: "4px" }
                            : { right: "50%", borderTopLeftRadius: "4px", borderBottomLeftRadius: "4px" }),
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: 10, color: TEXT_MUTED, mt: 0.25 }}>
                      {fmtCount(m.total)} game{m.total === 1 ? "" : "s"}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      width: 34,
                      flexShrink: 0,
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: 13,
                      color: barColor,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {edge > 0 ? `+${edge}` : edge}%
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Collapse>
    </Box>
  );
}

function Message({ text }: { text: string }) {
  return (
    <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center", py: 1.5 }}>
      {text}
    </Typography>
  );
}
