import { Link as RouterLink, Navigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useRecentGames } from "../hooks/useGameHistory";
import { GameHistoryRow } from "../components/GameHistoryRow";
import { PlayerAvatar } from "../components/PlayerAvatar";
import {
  ACCENT_PRIMARY,
  APP_NAME,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

const cardSx = {
  p: 2,
  borderRadius: "14px",
  backgroundColor: SURFACE_800,
  border: `1px solid ${SURFACE_BORDER}`,
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ ...cardSx, minWidth: 150 }}>
      <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function DashboardPage() {
  const { player, loading, isAuthenticated } = useAuth();
  const { data: recentGames } = useRecentGames(5);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 920 }}>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
          Loading…
        </Typography>
      </Box>
    );
  }

  // Reached directly without a session — send them to the not-authenticated page.
  if (!isAuthenticated || !player) {
    return <Navigate to="/noauth" replace />;
  }

  return (
    <Box sx={{ maxWidth: 920 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 3 }}>
        {/* The other pages use a commissioned emblem here. This one greets the
            player by name, so their own avatar is the subject. */}
        <PlayerAvatar username={player.username} avatarKey={player.avatarKey} size={72} title="" />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            Welcome back, {player.username}
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mt: 0.5 }}>
            Here's your {APP_NAME} dashboard.
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" sx={{ gap: "16px", flexWrap: "wrap", mb: 4 }}>
        <StatCard label="Rating (Quick)" value={player.rating} />
        {player.country && <StatCard label="Country" value={player.country} />}
        <StatCard label="Member since" value={new Date(player.createdAt).toLocaleDateString()} />
      </Stack>

      {recentGames && recentGames.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2, width: "700px" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
              Recent games
            </Typography>
            <RouterLink to="/play/history" style={{ textDecoration: "none", color: ACCENT_PRIMARY, fontSize: 14 }}>
              View all
            </RouterLink>
          </Stack>
          <Stack direction="column" sx={{ gap: "8px" }}>
            {recentGames.map((game) => (
              <GameHistoryRow key={game.id} game={game} perspective={player.username} />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
