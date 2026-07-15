import { Stack, Typography, type SxProps, type Theme } from "@mui/material";
import { PlayerAvatar } from "./PlayerAvatar";
import { TEXT_MUTED, TEXT_PRIMARY } from "../constants";

interface PlayerBadgeProps {
  username: string;
  avatarKey?: string | null;
  /** When provided, shown as a subline under the username. */
  rating?: number;
  /** Avatar diameter in px. */
  size?: number;
  /** Online status; when provided, shows a presence dot on the avatar. */
  online?: boolean;
  /** Makes the badge clickable (adds a pointer cursor). */
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * A player's avatar next to their username (and optional rating). Reusable
 * wherever a player is referenced — nav bar, friends lists, game panels,
 * leaderboards. Accepts the fields common to both PlayerResponse and the
 * friendship PlayerSummary, so either shape can be spread in.
 */
export function PlayerBadge({ username, avatarKey, rating, size = 36, online, onClick, sx }: PlayerBadgeProps) {
  return (
    <Stack
      direction="row"
      onClick={onClick}
      sx={{ alignItems: "center", gap: 1, minWidth: 0, cursor: onClick ? "pointer" : "default", ...sx }}
    >
      <PlayerAvatar username={username} avatarKey={avatarKey} size={size} online={online} />
      <Stack direction="column" sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}>
          {username}
        </Typography>
        {rating != null && (
          <Typography noWrap sx={{ color: TEXT_MUTED, fontSize: "0.75rem", lineHeight: 1.2 }}>
            {rating}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
