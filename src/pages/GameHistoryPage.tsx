import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button as MuiButton,
  CircularProgress,
  Collapse,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { useAuth } from "../auth/AuthContext";
import { useGameCatalog } from "../data/GameCatalogContext";
import { useMyGameHistory, useMyGameHistorySummary } from "../hooks/useGameHistory";
import { GameHistoryRow } from "../components/GameHistoryRow";
import { Button } from "../components/Button";
import WinsIcon from "../assets/images/green-trophy.png";
import TotalGamesIcon from "../assets/images/gold-rook.png";
import DrawsIcon from "../assets/images/gray-handshake.png";
import LossesIcon from "../assets/images/red-shield.png";
import FilterIcon from "../assets/images/filter-large.webp";
import HistoryEmblem from "../assets/images/history-large.webp";
import type { GameHistoryFilters } from "../api/games";
import {
  ACCENT_PRIMARY,
  SURFACE_700,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

// Dark styling for the filter fields + their dropdown menus (matches the
// pattern used in StartGameDialog, since the app has no MUI dark theme).
// Base styling comes from the MuiTextField defaults in theme/muiTheme.ts.
// These are page filters rather than form inputs, so they sit on an opaque
// surface (not the translucent dialog fill) at a fixed compact height.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: SURFACE_800,
    height: 40,
    transition: "background-color 0.15s ease",
    "&:hover": { backgroundColor: SURFACE_700 },
  },
};

const menuSlotProps = {
  // Render the empty ("Any") option's text instead of falling back to the
  // placeholder, and keep the label floated so it doesn't overlap it.
  select: {
    displayEmpty: true,
  },
  inputLabel: { shrink: true },
};

/** date input value ("YYYY-MM-DD") -> inclusive ISO instant at the day's start/end. */
function dayToIso(day: string, endOfDay: boolean): string | undefined {
  if (!day) return undefined;
  const time = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  return new Date(day + time).toISOString();
}

/** A summary stat: icon + count + label. `value` is undefined until the summary loads. */
function StatCard({ icon, label, value }: { icon: string; label: string; value?: number }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Box
        component="img"
        src={icon}
        alt={label}
        sx={{ width: 44, height: 44, flexShrink: 0, objectFit: "contain", display: "block" }}
      />
      <Stack direction="column">
        <Typography sx={{ color: TEXT_PRIMARY, fontWeight: "bold", fontSize: "20px", lineHeight: 1.15 }}>
          {value == null ? "—" : value.toLocaleString("en-US")}
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
          {label}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function GameHistoryPage() {
  const { player, loading, isAuthenticated } = useAuth();
  const { definitions } = useGameCatalog();

  // Filter controls. `opponentInput` is debounced into `opponent` so we don't
  // fire a query per keystroke.
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState("");
  const [timeCategory, setTimeCategory] = useState("");
  const [rated, setRated] = useState("");
  const [variant, setVariant] = useState("");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [opponentInput, setOpponentInput] = useState("");
  const [opponent, setOpponent] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpponent(opponentInput.trim()), 300);
    return () => clearTimeout(t);
  }, [opponentInput]);

  // Number of filters currently set — drives the toggle badge and whether the
  // "Clear" action is offered.
  const activeFilterCount = [outcome, status, timeCategory, rated, variant, opponentInput, fromDay, toDay].filter(
    Boolean,
  ).length;

  function clearFilters() {
    setOutcome("");
    setStatus("");
    setTimeCategory("");
    setRated("");
    setVariant("");
    setFromDay("");
    setToDay("");
    setOpponentInput("");
    setOpponent("");
  }

  const filters: GameHistoryFilters = useMemo(
    () => ({
      outcome: (outcome || undefined) as GameHistoryFilters["outcome"],
      status: (status || undefined) as GameHistoryFilters["status"],
      timeCategory: (timeCategory || undefined) as GameHistoryFilters["timeCategory"],
      rated: rated === "" ? undefined : rated === "true",
      variant: variant || undefined,
      opponent: opponent || undefined,
      from: dayToIso(fromDay, false),
      to: dayToIso(toDay, true),
    }),
    [outcome, status, timeCategory, rated, variant, opponent, fromDay, toDay],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useMyGameHistory(filters);
  const { data: summary } = useMyGameHistorySummary(filters);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: TEXT_SECONDARY }}>Loading…</Typography>
      </Box>
    );
  }
  if (!isAuthenticated || !player) {
    return <Navigate to="/noauth" replace />;
  }

  const games = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <Box sx={{ maxWidth: 820 }}>
      {/* Emblem is decorative — the heading beside it already names the page,
          so alt="" keeps screen readers from announcing "Game History" twice. */}
      <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 1 }}>
        <Box
          component="img"
          src={HistoryEmblem}
          alt=""
          aria-hidden
          sx={{ width: 72, height: 72, flexShrink: 0, objectFit: "contain", display: "block" }}
        />
        <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
          Game History
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ mb: "10px", mt: "10px", alignItems: "center", gap: "70px", flexWrap: "wrap" }}>
        <StatCard icon={TotalGamesIcon} label="Total Games" value={summary?.total} />
        <StatCard icon={WinsIcon} label="Wins" value={summary?.won} />
        <StatCard icon={DrawsIcon} label="Draws" value={summary?.drawn} />
        <StatCard icon={LossesIcon} label="Losses" value={summary?.lost} />
      </Stack>

      {/* Separator between the stats and the filters — a line that fades at both ends. */}
      <Box
        sx={{
          height: "1px",
          maxWidth: "700px",
          my: 2,
          border: 0,
          background: `linear-gradient(to right, transparent, ${SURFACE_BORDER} 20%, ${SURFACE_BORDER} 90%, transparent)`,
        }}
      />

      {/* Filter controls: toggle the bar + clear when anything is set. */}
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: showFilters ? 2 : 3 }}>
        <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
          <IconButton onClick={() => setShowFilters((v) => !v)} aria-label="Toggle filters">
            <Badge badgeContent={activeFilterCount} color="primary">
              <Box
                component="img"
                src={FilterIcon}
                alt=""
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: "contain",
                  display: "block",
                  // Dim when no filters are active / panel is closed.
                  opacity: showFilters || activeFilterCount > 0 ? 1 : 1,
                  transition: "opacity 0.15s ease",
                }}
              />
            </Badge>
          </IconButton>
        </Tooltip>
        <Typography
          onClick={() => setShowFilters((v) => !v)}
          sx={{ color: TEXT_SECONDARY, fontWeight: 600, cursor: "pointer", userSelect: "none" }}
        >
          {showFilters ? "Hide Filters" : "Filter Games"}
        </Typography>
        {activeFilterCount > 0 && (
          <MuiButton
            onClick={clearFilters}
            startIcon={<ClearRoundedIcon />}
            size="small"
            sx={{ color: TEXT_SECONDARY, textTransform: "none" }}
          >
            Clear filters
          </MuiButton>
        )}
      </Stack>

      {/* Filter bar */}
      <Collapse in={showFilters}>
        <Stack direction="row" sx={{ gap: "10px", flexWrap: "wrap", mb: 3 }}>
          <TextField
            select
            label="Result"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            sx={{ ...fieldSx, minWidth: 100 }}
            slotProps={menuSlotProps}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="won">Win</MenuItem>
            <MenuItem value="lost">Loss</MenuItem>
            <MenuItem value="drew">Draw</MenuItem>
          </TextField>

          <TextField
            select
            label="Timer"
            value={timeCategory}
            onChange={(e) => setTimeCategory(e.target.value)}
            sx={{ ...fieldSx, minWidth: 100 }}
            slotProps={menuSlotProps}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="LIGHTNING">Lightning</MenuItem>
            <MenuItem value="QUICK">Quick</MenuItem>
            <MenuItem value="LONG">Long</MenuItem>
          </TextField>

          <TextField
            select
            label="Rated"
            value={rated}
            onChange={(e) => setRated(e.target.value)}
            sx={{ ...fieldSx, minWidth: 100 }}
            slotProps={menuSlotProps}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="true">Rated</MenuItem>
            <MenuItem value="false">Casual</MenuItem>
          </TextField>

          <TextField
            select
            label="Game"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            sx={{ ...fieldSx, minWidth: 150 }}
            slotProps={menuSlotProps}
          >
            <MenuItem value="">Any</MenuItem>
            {definitions.map((def) => (
              <MenuItem key={def.id} value={def.id}>
                {def.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Opponent"
            value={opponentInput}
            onChange={(e) => setOpponentInput(e.target.value)}
            placeholder="Username"
            sx={fieldSx}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Collapse>

      {/* Results */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: ACCENT_PRIMARY }} />
        </Box>
      ) : isError ? (
        <Typography sx={{ color: TEXT_SECONDARY, py: 4 }}>Couldn't load your games. Please try again.</Typography>
      ) : games.length === 0 ? (
        <Typography sx={{ color: TEXT_MUTED, py: 4 }}>No games match these filters.</Typography>
      ) : (
        <Stack direction="column" sx={{ gap: "8px" }}>
          {games.map((game) => (
            <GameHistoryRow key={game.id} game={game} perspective={player.username} />
          ))}
        </Stack>
      )}

      {hasNextPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            id="load-more-games"
            type="secondary"
            label={isFetchingNextPage ? "Loading…" : "Load more"}
            onClick={() => fetchNextPage()}
            isDisabled={isFetchingNextPage}
          />
        </Box>
      )}
    </Box>
  );
}
