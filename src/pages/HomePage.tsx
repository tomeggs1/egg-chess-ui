import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { Button } from "../components/Button";
import AppLogo from "../assets/images/HPChessLogo.png";
import {
  ACCENT_AMBER,
  ACCENT_BLUE,
  ACCENT_CYAN,
  ACCENT_GREEN,
  ACCENT_PINK,
  ACCENT_PURPLE,
  APP_NAME,
  MAIN_BLUE,
  MAIN_PURPLE,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import { OpponentType } from "../data/types";
import { useState } from "react";
import StartGameDialog from "../components/StartGameDialog";
import { useAuth } from "../auth/AuthContext";

type Feature = {
  title: string;
  description: string;
  icon: SvgIconComponent;
  color: string;
};

const features: Feature[] = [
  {
    title: "Play anyone",
    description: "Challenge a friend, get matched with a random opponent, or sharpen up against the bot.",
    icon: SportsEsportsRoundedIcon,
    color: ACCENT_BLUE,
  },
  {
    title: "Chess variants",
    description: "Go beyond the classics with curated variants — each with its own pieces and rules.",
    icon: AutoAwesomeRoundedIcon,
    color: ACCENT_PURPLE,
  },
  {
    title: "Flexible time controls",
    description: "From 1-minute lightning to multi-day classical games, pick the pace that suits you.",
    icon: BoltRoundedIcon,
    color: ACCENT_AMBER,
  },
  {
    title: "Daily & random puzzles",
    description: "Train your tactics with a fresh daily puzzle or an endless stream of random ones.",
    icon: ExtensionRoundedIcon,
    color: ACCENT_CYAN,
  },
  {
    title: "Learn the game",
    description: "New to chess? Pick up the pieces, openings, and core tactics at your own pace.",
    icon: SchoolRoundedIcon,
    color: ACCENT_PINK,
  },
  {
    title: "Rankings & ratings",
    description: "Earn a rating for every game type and climb the leaderboards as you improve.",
    icon: LeaderboardRoundedIcon,
    color: ACCENT_GREEN,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [startGameOpen, setStartGameOpen] = useState(false);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      {/* Hero */}
      <Stack direction="column" sx={{ alignItems: "center", textAlign: "center", pt: { xs: 2, md: 5 }, pb: 5 }}>
        <Box component="img" src={AppLogo} alt={APP_NAME} sx={{ width: { xs: 180, md: 240 }, height: "auto", mb: 2 }} />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            lineHeight: 1.1,
            backgroundImage: `linear-gradient(90deg, ${ACCENT_BLUE}, ${ACCENT_PURPLE})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Play. Solve. Improve.
        </Typography>
        <Typography variant="h6" sx={{ color: TEXT_SECONDARY, fontWeight: 400, mt: 2, maxWidth: 640 }}>
          A modern chess playground — classic chess, wild variants, tactics puzzles, and competitive rankings, all in
          one place.
        </Typography>

        <Stack direction="row" sx={{ gap: "12px", mt: 4, flexWrap: "wrap", justifyContent: "center" }}>
          <Button
            id="home-play"
            type="primary"
            label="Play now"
            onClick={() => {
              if (!isAuthenticated) {
                navigate("/noauth", { state: { message: "You must be logged in to play against another user." } });
                return;
              }
              setStartGameOpen(true);
            }}
            style={{ backgroundColor: MAIN_PURPLE, padding: "12px 28px", fontSize: "15px" }}
          />
          <Button
            id="home-puzzles"
            type="primary"
            label="Solve puzzles"
            onClick={() => navigate("/puzzles")}
            style={{ backgroundColor: MAIN_BLUE, padding: "12px 28px", fontSize: "15px" }}
          />
        </Stack>
      </Stack>

      {/* Feature grid */}
      <Box
        sx={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
        }}
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Box
              key={feature.title}
              sx={{
                p: 3,
                borderRadius: "16px",
                backgroundColor: SURFACE_800,
                border: `1px solid ${SURFACE_BORDER}`,
                transition: "border-color 0.15s ease, transform 0.15s ease",
                "&:hover": { borderColor: feature.color, transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mb: 1.5,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <Icon htmlColor={feature.color} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_PRIMARY, mb: 0.5 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_MUTED, lineHeight: 1.6 }}>
                {feature.description}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <StartGameDialog open={startGameOpen} onClose={() => setStartGameOpen(false)} opponentType={OpponentType.HUMAN} />
    </Box>
  );
}
