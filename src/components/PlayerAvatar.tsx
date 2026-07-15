import { Avatar, Badge, type SxProps, type Theme } from "@mui/material";
import { AVATAR_PRESETS_BY_KEY, fallbackColor } from "../data/avatars";
import { COLOR_SUCCESS, SURFACE_800, TEXT_MUTED, TEXT_PRIMARY } from "../constants";

interface PlayerAvatarProps {
  username: string;
  /** Preset key, or null/undefined for the initials fallback. */
  avatarKey?: string | null;
  /** Diameter in px. */
  size?: number;
  /** Tooltip / accessible label; defaults to the username. */
  title?: string;
  /**
   * Online status. When provided, a colored status dot is shown (green online,
   * grey offline); omit it where presence isn't known to show no dot.
   */
  online?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Renders a player's avatar: the chosen preset medallion image when the player
 * has one, otherwise the first letter of their username on a solid color
 * derived deterministically from the name. Optionally overlays a presence dot.
 */
export function PlayerAvatar({ username, avatarKey, size = 40, title, online, sx }: PlayerAvatarProps) {
  const preset = avatarKey ? AVATAR_PRESETS_BY_KEY[avatarKey] : undefined;

  const avatar = preset ? (
    <Avatar
      src={preset.src}
      alt={title ?? preset.label}
      title={title ?? username}
      sx={{ width: size, height: size, bgcolor: "transparent", ...sx }}
    />
  ) : (
    <Avatar
      title={title ?? username}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        fontWeight: 700,
        lineHeight: 1,
        color: TEXT_PRIMARY,
        bgcolor: fallbackColor(username || "?"),
        userSelect: "none",
        ...sx,
      }}
    >
      {(username.trim()[0] ?? "?").toUpperCase()}
    </Avatar>
  );

  if (online === undefined) {
    return avatar;
  }

  return (
    <Badge
      overlap="circular"
      variant="dot"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{
        "& .MuiBadge-badge": {
          backgroundColor: online ? COLOR_SUCCESS : TEXT_MUTED,
          color: online ? COLOR_SUCCESS : TEXT_MUTED,
          boxShadow: `0 0 0 2px ${SURFACE_800}`,
        },
      }}
    >
      {avatar}
    </Badge>
  );
}
