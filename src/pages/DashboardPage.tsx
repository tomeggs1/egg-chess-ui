import { Link as RouterLink, Navigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";
import {
  ACCENT_AMBER,
  ACCENT_BLUE,
  ACCENT_GREEN,
  ACCENT_PURPLE,
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

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: SvgIconComponent;
  color: string;
};

const quickActions: QuickAction[] = [
  { label: "Play Chess", description: "Start a new game", to: "/play", icon: SportsEsportsRoundedIcon, color: ACCENT_BLUE },
  { label: "Puzzles", description: "Sharpen your tactics", to: "/puzzles", icon: ExtensionRoundedIcon, color: ACCENT_AMBER },
  { label: "Rankings", description: "See the leaderboard", to: "/rankings", icon: LeaderboardRoundedIcon, color: ACCENT_GREEN },
  { label: "Profile", description: "Edit your account", to: "/settings/profile", icon: PersonRoundedIcon, color: ACCENT_PURPLE },
];

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

  if (loading) {
    return (
      <section>
        <p>Loading…</p>
      </section>
    );
  }

  // Reached directly without a session — send them to the not-authenticated page.
  if (!isAuthenticated || !player) {
    return <Navigate to="/noauth" replace />;
  }

  return (
    <Box sx={{ maxWidth: 920 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
        Welcome back, {player.username}
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mt: 0.5, mb: 3 }}>
        Here's your {APP_NAME} dashboard.
      </Typography>

      <Stack direction="row" sx={{ gap: "16px", flexWrap: "wrap", mb: 4 }}>
        <StatCard label="Rating" value={player.rating} />
        {player.country && <StatCard label="Country" value={player.country} />}
        <StatCard label="Member since" value={new Date(player.createdAt).toLocaleDateString()} />
      </Stack>

      <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_PRIMARY, mb: 2 }}>
        Quick actions
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: "16px" }}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <RouterLink key={action.to} to={action.to} style={{ textDecoration: "none" }}>
              <Box
                sx={{
                  ...cardSx,
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  "&:hover": { borderColor: action.color, backgroundColor: "rgba(255, 255, 255, 0.03)" },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <Icon htmlColor={action.color} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, color: TEXT_PRIMARY }}>{action.label}</Typography>
                  <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                    {action.description}
                  </Typography>
                </Box>
              </Box>
            </RouterLink>
          );
        })}
      </Box>
    </Box>
  );
}
