import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button as MuiButton,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useAuth } from "../auth/AuthContext";
import { useGameCatalog } from "../data/GameCatalogContext";
import { useRankings } from "../hooks/useRankings";
import type { RankingSpeed } from "../api/rankings";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { CountryFlag } from "../components/CountryFlag";
import {
  ACCENT_AMBER,
  ACCENT_BLUE,
  MAIN_BLUE,
  MAIN_BLUE_LIGHT,
  SURFACE_700,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

const PAGE_SIZE = 10;

const SPEED_OPTIONS: { value: RankingSpeed; label: string }[] = [
  { value: "LIGHTNING", label: "Lightning" },
  { value: "QUICK", label: "Quick" },
  { value: "LONG", label: "Long" },
];

// Medal tint for the top three ranks; the rest use the plain text color.
const RANK_COLOR: Record<number, string> = {
  1: "#f5c542",
  2: "#c9ccd4",
  3: "#cd7f32",
};

// A shared grid so the header and each row line up: rank, flag, player, then
// the three numeric columns.
const ROW_GRID = {
  display: "grid",
  gridTemplateColumns: "56px 34px 1fr 84px 84px 84px",
  alignItems: "center",
  gap: "8px",
  px: "12px",
};

const fieldSx = {
  minWidth: 220,
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: SURFACE_800,
    borderRadius: "10px",
    height: 44,
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE },
  },
  "& .MuiInputLabel-root": { color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT_BLUE },
  "& .MuiSelect-icon": { color: TEXT_MUTED },
};

const menuSlotProps = {
  select: {
    MenuProps: {
      slotProps: {
        paper: {
          sx: {
            bgcolor: SURFACE_800,
            color: TEXT_PRIMARY,
            border: `1px solid ${SURFACE_BORDER}`,
            "& .MuiMenuItem-root.Mui-selected": { backgroundColor: "rgba(77,141,255,0.20)" },
            "& .MuiMenuItem-root.Mui-focusVisible, & .MuiMenuItem-root:hover": {
              backgroundColor: "rgba(77,141,255,0.15)",
            },
          },
        },
      },
    },
  },
};

export default function RankingsPage() {
  const { player } = useAuth();
  const { definitions, loading: catalogLoading } = useGameCatalog();

  const [variant, setVariant] = useState("standard");
  const [speed, setSpeed] = useState<RankingSpeed>("QUICK");
  const [offset, setOffset] = useState(0);

  // Any pool change starts back at the first page.
  useEffect(() => {
    setOffset(0);
  }, [variant, speed]);

  const { data, isLoading, isError, isFetching } = useRankings({ variant, speed, limit: PAGE_SIZE, offset });

  const variantName = useMemo(() => definitions.find((d) => d.id === variant)?.name ?? variant, [definitions, variant]);

  const entries = data?.entries ?? [];
  const total = data?.totalEligible ?? 0;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = offset + entries.length;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
        Rankings
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mt: 0.5 }}>
        Top players by Glicko rating. Players need at least 5 games in a pool to be ranked.
      </Typography>

      {/* Pool selectors: variant (dropdown) × speed (toggle). */}
      <Stack direction="row" sx={{ gap: 2, mt: 3, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          select
          label="Variant"
          value={definitions.some((d) => d.id === variant) ? variant : ""}
          onChange={(e) => setVariant(e.target.value)}
          disabled={catalogLoading}
          sx={fieldSx}
          slotProps={menuSlotProps}
        >
          {definitions.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>

        <ToggleButtonGroup
          value={speed}
          exclusive
          onChange={(_e, next: RankingSpeed | null) => next && setSpeed(next)}
          sx={{
            "& .MuiToggleButton-root": {
              color: TEXT_SECONDARY,
              borderColor: SURFACE_BORDER,
              textTransform: "none",
              px: "18px",
              height: 44,
              "&:hover": { backgroundColor: SURFACE_700 },
              "&.Mui-selected": {
                color: TEXT_PRIMARY,
                backgroundColor: MAIN_BLUE,
                "&:hover": { backgroundColor: MAIN_BLUE_LIGHT },
              },
            },
          }}
        >
          {SPEED_OPTIONS.map((o) => (
            <ToggleButton key={o.value} value={o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {/* Leaderboard card. */}
      <Box
        sx={{
          border: `1px solid ${SURFACE_BORDER}`,
          borderRadius: "14px",
          backgroundColor: SURFACE_800,
          overflow: "hidden",
        }}
      >
        {/* Column header. */}
        <Box
          sx={{
            ...ROW_GRID,
            py: "10px",
            borderBottom: `1px solid ${SURFACE_BORDER}`,
            "& .MuiTypography-root": {
              color: TEXT_MUTED,
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            },
          }}
        >
          <Typography>Rank</Typography>
          <Typography aria-hidden>{/* flag */}</Typography>
          <Typography>Player</Typography>
          <Typography sx={{ textAlign: "right" }}>Rating</Typography>
          <Typography sx={{ textAlign: "right" }}>Games</Typography>
          <Typography sx={{ textAlign: "right" }}>Peak</Typography>
        </Box>

        {isLoading ? (
          <Stack sx={{ alignItems: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: ACCENT_BLUE }} />
          </Stack>
        ) : isError ? (
          <Typography sx={{ color: TEXT_SECONDARY, textAlign: "center", py: 6 }}>
            Couldn't load rankings. Please try again.
          </Typography>
        ) : entries.length === 0 ? (
          <Typography sx={{ color: TEXT_SECONDARY, textAlign: "center", py: 6 }}>
            No ranked players yet in {variantName} · {SPEED_OPTIONS.find((o) => o.value === speed)?.label}. Play at
            least 5 games in this pool to appear.
          </Typography>
        ) : (
          entries.map((entry) => {
            const isMe = player?.username === entry.username;
            return (
              <Box
                key={entry.playerId}
                sx={{
                  ...ROW_GRID,
                  py: "10px",
                  borderBottom: `1px solid ${SURFACE_BORDER}`,
                  "&:last-of-type": { borderBottom: "none" },
                  backgroundColor: isMe ? "rgba(77,141,255,0.12)" : "transparent",
                }}
              >
                <Typography sx={{ fontWeight: 700, color: RANK_COLOR[entry.rank] ?? TEXT_SECONDARY }}>
                  {entry.rank}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <CountryFlag country={entry.country} />
                </Box>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.25, minWidth: 0 }}>
                  <PlayerAvatar username={entry.username} avatarKey={entry.avatarKey} size={30} />
                  <Typography
                    sx={{
                      color: TEXT_PRIMARY,
                      fontWeight: isMe ? 700 : 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.username}
                    {isMe && (
                      <Box component="span" sx={{ color: ACCENT_BLUE, fontWeight: 600, ml: 0.75 }}>
                        (you)
                      </Box>
                    )}
                  </Typography>
                </Stack>
                <Typography sx={{ textAlign: "right", color: TEXT_PRIMARY, fontWeight: 700 }}>
                  {entry.rating}
                </Typography>
                <Typography sx={{ textAlign: "right", color: TEXT_SECONDARY }}>{entry.gamesPlayed}</Typography>
                <Typography sx={{ textAlign: "right", color: ACCENT_AMBER }}>{entry.peakRating}</Typography>
              </Box>
            );
          })
        )}
      </Box>

      {/* Pager. */}
      {(hasPrev || hasNext) && (
        <Stack direction="row" sx={{ mt: 2, alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
            {isFetching ? "Updating…" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
          </Typography>
          <Stack direction="row" sx={{ gap: 1 }}>
            <MuiButton
              startIcon={<ChevronLeftRoundedIcon />}
              disabled={!hasPrev}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              sx={pagerButtonSx}
            >
              Prev
            </MuiButton>
            <MuiButton
              endIcon={<ChevronRightRoundedIcon />}
              disabled={!hasNext}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              sx={pagerButtonSx}
            >
              Next
            </MuiButton>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

const pagerButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  color: TEXT_PRIMARY,
  border: `1px solid ${SURFACE_BORDER}`,
  borderRadius: "10px",
  px: 2,
  "&:hover": { backgroundColor: SURFACE_700, borderColor: ACCENT_BLUE },
  "&.Mui-disabled": { color: TEXT_MUTED, borderColor: SURFACE_BORDER, opacity: 0.5 },
};
