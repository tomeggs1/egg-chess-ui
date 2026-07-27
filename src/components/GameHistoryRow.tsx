import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import type { SvgIconComponent } from "@mui/icons-material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SportsScoreRoundedIcon from "@mui/icons-material/SportsScoreRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import TimerOffRoundedIcon from "@mui/icons-material/TimerOffRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import { PlayerAvatar } from "./PlayerAvatar";
import type { GameSummary } from "../api/games";
import TrophyIcon from "../assets/images/blue-trophy.png";
import {
  ACCENT_BLUE,
  COLOR_ERROR,
  COLOR_SUCCESS,
  RESULT_ACCENT,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import { useGameCatalog } from "../data/GameCatalogContext";
import { uiPieceSrc } from "../data/pieceAssets";
import { TimerCategory } from "../data/types";
import { TIMER_CATEGORY_ICON } from "./StartGameDialog";

const TIME_CATEGORY_LABEL: Record<GameSummary["timeCategory"], string> = {
  LIGHTNING: "Lightning",
  QUICK: "Quick",
  LONG: "Long",
};

type Outcome = "win" | "loss" | "draw" | "active" | "unknown";

// The result from the perspective player's point of view. Draws are read off
// the result string; win/loss off the winner, which the service derives from
// the color that scored the point.
function outcomeFor(game: GameSummary, me: string): Outcome {
  if (game.status === "ACTIVE") return "active";
  if (game.result === "1/2-1/2") return "draw";
  if (game.winnerUsername === me) return "win";
  if (game.winnerUsername) return "loss";
  return "unknown"; // e.g. abandoned with no recorded result
}

const OUTCOME_CHIP: Record<Outcome, { label: string; color: string }> = {
  win: { label: "Win", color: COLOR_SUCCESS },
  loss: { label: "Loss", color: COLOR_ERROR },
  draw: { label: "Draw", color: TEXT_SECONDARY },
  active: { label: "Active", color: ACCENT_BLUE },
  unknown: { label: "—", color: TEXT_MUTED },
};

// Vertical gradient for the left accent border, keyed off the viewer-relative
// outcome (not the raw result, which isn't perspective-aware).
const OUTCOME_ACCENT: Record<Outcome, string> = {
  win: RESULT_ACCENT.win,
  loss: RESULT_ACCENT.loss,
  draw: RESULT_ACCENT.draw,
  active: `linear-gradient(to bottom, ${ACCENT_BLUE}, #1c4a99)`,
  unknown: "linear-gradient(to bottom, #6b7280, #374151)",
};

// Gentle pulse on the "live" dot of an in-progress game.
const livePulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.7); }
`;

type EndReason = NonNullable<GameSummary["endReason"]>;

// Human label + icon for each way a game can end.
const END_REASON_META: Record<EndReason, { label: string; icon: SvgIconComponent }> = {
  CHECKMATE: { label: "Checkmate", icon: SportsScoreRoundedIcon },
  RESIGNATION: { label: "Resignation", icon: FlagRoundedIcon },
  TIMEOUT: { label: "Timeout", icon: TimerOffRoundedIcon },
  AGREEMENT: { label: "Agreement", icon: HandshakeRoundedIcon },
  STALEMATE: { label: "Stalemate", icon: BlockRoundedIcon },
  INSUFFICIENT_MATERIAL: { label: "Insufficient material", icon: RemoveCircleOutlineRoundedIcon },
  THREEFOLD_REPETITION: { label: "Repetition", icon: RepeatRoundedIcon },
};

function formatVariant(id: string): string {
  // "standard" -> "Standard", "some-variant" -> "Some Variant"
  return id
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface GameHistoryRowProps {
  game: GameSummary;
  /** Whose perspective to render from (their opponent/color/result). */
  perspective: string;
}

/**
 * One game as a clickable row: the opponent, the color the perspective player
 * had, the outcome, the variant/speed, and when it was played. Links to the
 * game page for review.
 */
export function GameHistoryRow({ game, perspective }: GameHistoryRowProps) {
  const meIsWhite = game.whiteUsername === perspective;
  const opponentName = meIsWhite ? game.blackUsername : game.whiteUsername;
  const opponentAvatar = meIsWhite ? game.blackAvatarKey : game.whiteAvatarKey;
  const opponentRating = meIsWhite ? game.blackRating : game.whiteRating;
  const myChange = meIsWhite ? game.whiteRatingChange : game.blackRatingChange;
  const outcome = outcomeFor(game, perspective);
  const chip = OUTCOME_CHIP[outcome];
  const { definitions: games } = useGameCatalog();
  // Backend sends the enum *name* ("LIGHTNING"); TIMER_CATEGORY_ICON is keyed by
  // the TimerCategory *value* ("Lightning"). Map name -> value before the lookup.
  const TimerIcon = TIMER_CATEGORY_ICON[TimerCategory[game.timeCategory]];
  const endMeta = game.endReason ? END_REASON_META[game.endReason] : null;
  const EndReasonIcon = endMeta?.icon;

  const getGameDefinition = (id: string) => {
    return games.find((game) => game.id === id);
  };

  return (
    <Box
      component={RouterLink}
      to={`/game/${game.id}`}
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        p: 1.5,
        borderRadius: "12px",
        background: "linear-gradient(#07203b,#030f1c)",
        border: `1px solid #123255`,
        textDecoration: "none",
        maxWidth: "700px",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": { borderColor: ACCENT_BLUE, backgroundColor: "rgba(255,255,255,0.03)", textDecoration: "none" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "12px",
          padding: "2px", // stroke thickness (the ring lives in the padding gap)
          background: OUTCOME_ACCENT[outcome],
          pointerEvents: "none",
          // Ring (border-box minus content-box) INTERSECTED with a left-only
          // reveal that fades out just past the corner. Layer order:
          //   1) reveal   -> intersect
          //   2) content  -> exclude  (XOR with the border-box fill = ring)
          //   3) full box -> add      (base)
          maskImage: `
            linear-gradient(to right, #000 0 6px, transparent 15px),
            linear-gradient(#fff 0 0),
            linear-gradient(#fff 0 0)
          `,
          maskOrigin: "border-box, content-box, border-box",
          maskClip: "border-box, content-box, border-box",
          maskComposite: "intersect, exclude, add",
          WebkitMaskImage: `
            linear-gradient(to right, #000 0 6px, transparent 15px),
            linear-gradient(#fff 0 0),
            linear-gradient(#fff 0 0)
          `,
          WebkitMaskOrigin: "border-box, content-box, border-box",
          WebkitMaskClip: "border-box, content-box, border-box",
          WebkitMaskComposite: "source-in, xor, source-over",
        },
      }}
    >
      <Stack direction="column" sx={{ alignItems: "center", gap: 0.5, flexShrink: 0, width: "50px" }}>
        <Typography
          sx={{
            fontWeight: 600,
            backgroundImage: OUTCOME_ACCENT[outcome],
            fontSize: 14,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          noWrap
        >
          {chip.label.toUpperCase()}
        </Typography>
        {outcome === "active" && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: ACCENT_BLUE,
              boxShadow: `0 0 6px ${ACCENT_BLUE}`,
              animation: `${livePulse} 1.4s ease-in-out infinite`,
            }}
          />
        )}
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, display: myChange != null ? "flex" : "none" }}>
          {myChange != null && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.5, color: myChange >= 0 ? COLOR_SUCCESS : COLOR_ERROR }}
            >
              {myChange >= 0 ? `+${myChange}` : myChange}
            </Typography>
          )}
          <Box
            component="img"
            src={TrophyIcon}
            alt={"Trophy"}
            sx={{ width: 20, height: 20, flexShrink: 0, display: "block" }}
          />
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ alignItems: "center", gap: "10px", flexShrink: 0, width: "200px" }}>
        <PlayerAvatar username={opponentName} avatarKey={opponentAvatar} size={45} />
        <Stack direction="column" sx={{ alignItems: "flex-start", gap: 0 }}>
          <Typography sx={{ color: TEXT_PRIMARY, fontSize: "14px" }} noWrap>
            {opponentName}
          </Typography>
          <Typography variant="body2" sx={{ color: ACCENT_BLUE }} noWrap>
            {opponentRating != null ? `${opponentRating}` : ""}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5 }}>
          <Box
            component="img"
            src={getGameDefinition(game.gameDefinitionId)?.icon}
            alt=""
            sx={{ width: 20, height: 20, borderRadius: "4px" }}
          />
          {formatVariant(game.gameDefinitionId)} ·
          <Box
            component="img"
            src={uiPieceSrc(meIsWhite ? "white" : "black", "king")}
            alt={meIsWhite ? "White" : "Black"}
            sx={{ height: 18, width: "auto" }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 0.5 }} noWrap>
          <TimerIcon sx={{ fontSize: 16 }} /> {TIME_CATEGORY_LABEL[game.timeCategory]}
          {game.rated ? " · Rated" : " · Casual"}
        </Typography>
      </Box>

      <Stack direction="column" sx={{ alignItems: "flex-end", gap: 0.5, flexShrink: 0, width: "100px" }}>
        {outcome === "active" && (
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, color: ACCENT_BLUE }}>
            <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: "13px", fontWeight: 600 }} noWrap>
              Resume
            </Typography>
          </Stack>
        )}
        {endMeta && EndReasonIcon && (
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, color: TEXT_SECONDARY }}>
            <EndReasonIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: "13px" }} noWrap>
              {endMeta.label}
            </Typography>
          </Stack>
        )}
        <Typography variant="body2" sx={{ color: TEXT_MUTED }} noWrap>
          {formatDate(game.endedAt ?? game.createdAt)}
        </Typography>
      </Stack>
    </Box>
  );
}
