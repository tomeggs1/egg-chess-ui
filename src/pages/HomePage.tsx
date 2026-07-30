import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { Button } from "../components/Button";
import AppLogo from "../assets/images/HPChessLogo.png";
import {
  ACCENT_BRIGHT,
  ACCENT_COOL,
  ACCENT_DECOR,
  ACCENT_GREEN,
  ACCENT_PRIMARY,
  APP_NAME,
  BORDER_WIDTH,
  CARVED,
  ELIXIR,
  FONT,
  HP,
  RADIUS,
  SURFACE_800,
  SURFACE_BLACK,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import { Icons, type IconComponent } from "../icons";
import { OpponentType } from "../data/types";
import { useState } from "react";
import StartGameDialog from "../components/StartGameDialog";
import { useAuth } from "../auth/AuthContext";

type Feature = {
  title: string;
  description: string;
  icon: IconComponent;
  color: string;
};

// Four accents, not the six the old grid used — a candle-lit palette stops
// reading as one place if you push more than a few hues through it.
const features: Feature[] = [
  {
    title: "Play anyone",
    description: "Challenge a friend, get matched with a random opponent, or sharpen up against the bot.",
    icon: Icons.play,
    color: ACCENT_PRIMARY,
  },
  {
    title: "Chess variants",
    description: "Go beyond the classics with curated variants — each with its own pieces and rules.",
    icon: Icons.variants,
    color: ACCENT_DECOR,
  },
  {
    title: "Flexible time controls",
    description: "From 1-minute lightning to multi-day classical games, pick the pace that suits you.",
    icon: BoltRoundedIcon,
    color: ACCENT_BRIGHT,
  },
  {
    title: "Daily & random puzzles",
    description: "Train your tactics with a fresh daily puzzle or an endless stream of random ones.",
    icon: Icons.puzzles,
    color: ACCENT_COOL,
  },
  {
    title: "Learn the game",
    description: "New to chess? Pick up the pieces, openings, and core tactics at your own pace.",
    icon: Icons.learn,
    color: ACCENT_DECOR,
  },
  {
    title: "Rankings & ratings",
    description: "Earn a rating for every game type and climb the leaderboards as you improve.",
    icon: Icons.podium,
    color: ACCENT_GREEN,
  },
];

/**
 * A resource meter, shown here so the two reserved gameplay colors can be
 * judged against the medieval chrome rather than in the abstract.
 *
 * The fill sits in a recessed track, which is what makes HP legible: #d00100 is
 * only 2.97:1 against a panel but 3.43:1 against the track well.
 */
function ResourceBar({
  label,
  value,
  max,
  fill,
  textColor,
}: {
  label: string;
  value: number;
  max: number;
  fill: string;
  textColor: string;
}) {
  return (
    <Stack direction="column" sx={{ gap: 0.75, minWidth: 190 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography
          sx={{
            fontFamily: FONT.display,
            fontSize: 11,
            letterSpacing: "0.18em",
            color: TEXT_SECONDARY,
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontFamily: FONT.numeric, fontSize: 13, fontWeight: 700, color: textColor }}>
          {value}
          <Box component="span" sx={{ color: TEXT_MUTED, fontWeight: 400 }}>
            /{max}
          </Box>
        </Typography>
      </Stack>
      <Box
        sx={{
          height: 14,
          backgroundColor: SURFACE_BLACK,
          border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
          borderRadius: `${RADIUS.sm}px`,
          boxShadow: "inset 0 2px 5px rgba(0, 0, 0, 0.75)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${(value / max) * 100}%`,
            height: "100%",
            backgroundColor: fill,
            // Faint top sheen so the fill reads as liquid in a channel.
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(0,0,0,0.25))",
          }}
        />
      </Box>
    </Stack>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [startGameOpen, setStartGameOpen] = useState(false);

  return (
    <>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Hero */}
        <Stack direction="column" sx={{ alignItems: "center", textAlign: "center", pt: { xs: 2, md: 5 }, pb: 5 }}>
          <Box
            component="img"
            src={AppLogo}
            alt={APP_NAME}
            sx={{ width: { xs: 180, md: 340 }, height: "auto", mb: 2 }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              lineHeight: 1.15,
              backgroundImage: `linear-gradient(180deg, ${ACCENT_BRIGHT}, ${ACCENT_PRIMARY})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              // Engraved effect: a dark drop under gilt lettering.
              filter: "drop-shadow(0 2px 0 rgba(0, 0, 0, 0.6))",
            }}
          >
            Play. Solve. Improve.
          </Typography>

          {/* Rule: a hairline with a lozenge, standing in for a proper divider ornament. */}
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mt: 2.5, width: 260 }}>
            <Box
              sx={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${SURFACE_BORDER})` }}
            />
            <Box sx={{ width: 7, height: 7, backgroundColor: ACCENT_PRIMARY, transform: "rotate(45deg)" }} />
            <Box
              sx={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${SURFACE_BORDER}, transparent)` }}
            />
          </Stack>

          <Typography variant="h6" sx={{ color: TEXT_SECONDARY, fontWeight: 400, mt: 2.5, maxWidth: 640 }}>
            A modern chess playground — classic chess, wild variants, tactics puzzles, and competitive rankings, all in
            one place.
          </Typography>

          {/* Reserved gameplay colors, shown in the chrome they have to live in. */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              gap: 3,
              mt: 4,
              px: 3,
              py: 2.5,
              backgroundColor: SURFACE_800,
              border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
              borderRadius: `${RADIUS.lg}px`,
              boxShadow: CARVED,
            }}
          >
            <ResourceBar label="HIT POINTS" value={18} max={25} fill={HP.fill} textColor={HP.text} />
            <ResourceBar label="ELIXIR" value={7} max={10} fill={ELIXIR.fill} textColor={ELIXIR.text} />
          </Stack>

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
              style={{ backgroundColor: ACCENT_PRIMARY, color: "#1a1510", padding: "12px 28px" }}
            />
            <Button
              id="home-puzzles"
              type="primary"
              label="Solve puzzles"
              onClick={() => navigate("/puzzles")}
              style={{ backgroundColor: "transparent", color: ACCENT_BRIGHT, padding: "12px 28px" }}
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
                  borderRadius: `${RADIUS.lg}px`,
                  backgroundColor: SURFACE_800,
                  border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
                  boxShadow: CARVED,
                  transition: "border-color 0.15s ease, transform 0.15s ease",
                  "&:hover": { borderColor: feature.color, transform: "translateY(-2px)" },
                }}
              >
                {/* Icon niche — square-cut and recessed, not a rounded chip. */}
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    mb: 1.75,
                    borderRadius: `${RADIUS.sm}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: SURFACE_BLACK,
                    border: `1px solid ${SURFACE_BORDER}`,
                    boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.6)",
                  }}
                >
                  <Icon htmlColor={feature.color} />
                </Box>
                <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, mb: 0.75 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: TEXT_MUTED, lineHeight: 1.65 }}>
                  {feature.description}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <StartGameDialog open={startGameOpen} onClose={() => setStartGameOpen(false)} opponentType={OpponentType.HUMAN} />
    </>
  );
}
