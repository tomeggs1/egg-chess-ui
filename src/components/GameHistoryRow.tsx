import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { Icons, type IconComponent } from "../icons";
import { PlayerAvatar } from "./PlayerAvatar";
import type { GameSummary } from "../api/games";
import {
  ACCENT_BRIGHT,
  ACCENT_PRIMARY,
  BORDER_WIDTH,
  COLOR_DRAW,
  COLOR_ERROR,
  COLOR_SUCCESS,
  CTA_PRIMARY,
  FONT,
  RADIUS,
  RESULT_ACCENT,
  SURFACE_900,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import { useGameCatalog } from "../data/GameCatalogContext";
import { uiPieceSrc } from "../data/pieceAssets";
import { TimerCategory } from "../data/types";
import { TIMER_CATEGORY_ICON } from "./StartGameDialog";
import GoldTrophyIcon from "../assets/images/gold-trophy.webp";

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
  // COLOR_DRAW, not TEXT_SECONDARY — GamePage colors the same concept with it,
  // and the two were quietly disagreeing.
  draw: { label: "Draw", color: COLOR_DRAW },
  active: { label: "Active", color: ACCENT_PRIMARY },
  unknown: { label: "—", color: TEXT_MUTED },
};

// Vertical gradient for the left accent border, keyed off the viewer-relative
// outcome (not the raw result, which isn't perspective-aware).
const OUTCOME_ACCENT: Record<Outcome, string> = {
  win: RESULT_ACCENT.win,
  loss: RESULT_ACCENT.loss,
  draw: RESULT_ACCENT.draw,
  // Brass fading to deep gold. The bottom stop used to be a navy (#1c4a99) left
  // over from the old palette, so after the rename this read gold-to-blue.
  active: `linear-gradient(to bottom, ${ACCENT_BRIGHT}, ${CTA_PRIMARY})`,
  // Weathered, not the cool slate greys this used to be.
  unknown: `linear-gradient(to bottom, ${TEXT_MUTED}, ${SURFACE_BORDER})`,
};

// Gentle pulse on the "live" dot of an in-progress game.
const livePulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.7); }
`;

type EndReason = NonNullable<GameSummary["endReason"]>;

// Human label + icon for each way a game can end.
const END_REASON_META: Record<EndReason, { label: string; icon: IconComponent }> = {
  CHECKMATE: { label: "Checkmate", icon: Icons.checkmate },
  RESIGNATION: { label: "Resignation", icon: Icons.resignation },
  TIMEOUT: { label: "Timeout", icon: Icons.timeout },
  AGREEMENT: { label: "Agreement", icon: Icons.agreement },
  STALEMATE: { label: "Stalemate", icon: Icons.stalemate },
  INSUFFICIENT_MATERIAL: { label: "Insufficient material", icon: Icons["insufficient-material"] },
  THREEFOLD_REPETITION: { label: "Repetition", icon: Icons.repetition },
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
        // 1.75 rather than 1.5 because the edge below is an inset ring painted
        // over the padding, not a real border adding to the box.
        p: 1.75,
        borderRadius: `${RADIUS.lg}px`,
        // Carved stone, matching the panel language. Was a navy gradient.
        background: `linear-gradient(${SURFACE_800}, ${SURFACE_900})`,
        // The stone edge is an INSET RING, not a `border`, and that is load-
        // bearing. `::before` below is absolutely positioned with `inset: 0`,
        // which resolves against the padding box — so a real border would push
        // the outcome accent inward by its own width and the accent would sit
        // *inside* the edge rather than on top of it. With no border, padding
        // box == border box, both rings occupy the same band, and the
        // pseudo-element paints above the parent's shadow.
        boxShadow: `inset 0 0 0 ${BORDER_WIDTH}px ${SURFACE_BORDER}`,
        textDecoration: "none",
        maxWidth: "700px",
        transition: "box-shadow 0.15s ease, background-color 0.15s ease",
        "&:hover": {
          boxShadow: `inset 0 0 0 ${BORDER_WIDTH}px ${ACCENT_PRIMARY}`,
          backgroundColor: "rgba(255,235,190,0.03)",
          textDecoration: "none",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: `${RADIUS.lg}px`,
          // Stroke thickness. Matches the inset ring above exactly, so the
          // accent replaces the stone edge on the left rather than nesting in it.
          padding: `${BORDER_WIDTH}px`,
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
            // Engraved caps. It's a label rather than body copy, so it takes
            // the display face even though the surrounding list stays in body.
            fontFamily: FONT.display,
            fontWeight: 700,
            letterSpacing: "0.1em",
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
              backgroundColor: ACCENT_PRIMARY,
              boxShadow: `0 0 6px ${ACCENT_PRIMARY}`,
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
            src={GoldTrophyIcon}
            alt="Gold Trophy"
            sx={{ width: 16, height: 16, flexShrink: 0, objectFit: "contain", display: "block" }}
          />
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ alignItems: "center", gap: "10px", flexShrink: 0, width: "200px" }}>
        <PlayerAvatar username={opponentName} avatarKey={opponentAvatar} size={45} />
        <Stack direction="column" sx={{ alignItems: "flex-start", gap: 0 }}>
          <Typography sx={{ color: TEXT_PRIMARY, fontSize: "14px" }} noWrap>
            {opponentName}
          </Typography>
          <Typography variant="body2" sx={{ color: ACCENT_PRIMARY }} noWrap>
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
            sx={{ width: 20, height: 20, borderRadius: `${RADIUS.sm}px` }}
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
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, color: ACCENT_PRIMARY }}>
            <Icons.resume sx={{ fontSize: 16 }} />
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
