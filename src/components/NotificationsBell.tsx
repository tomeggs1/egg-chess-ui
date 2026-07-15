import { useState } from "react";
import { Badge, Box, IconButton, Popover, Stack, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotifications, useMarkNotificationsRead, useUnreadCount } from "../hooks/useNotifications";
import type { NotificationResponse } from "../api/notifications";
import { PlayerAvatar } from "./PlayerAvatar";
import {
  ACCENT_BLUE,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

// Which friends-dialog tab a notification should open when clicked.
export type NotificationTarget = "friends" | "requests";

interface NotificationsBellProps {
  // Opens the friends dialog on the given tab (e.g. a friend request → Requests).
  onNavigate: (target: NotificationTarget) => void;
}

// Compact relative time, e.g. "just now", "5m", "3h", "2d".
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function messageFor(n: NotificationResponse): string {
  const who = n.actor?.username ?? "Someone";
  switch (n.type) {
    case "FRIEND_REQUEST":
      return `${who} sent you a friend request`;
    case "FRIEND_REQUEST_ACCEPTED":
      return `${who} accepted your friend request`;
    default:
      return "You have a new notification";
  }
}

function targetFor(n: NotificationResponse): NotificationTarget {
  return n.type === "FRIEND_REQUEST" ? "requests" : "friends";
}

export function NotificationsBell({ onNavigate }: NotificationsBellProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const unreadCount = useUnreadCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationsRead();

  const open = Boolean(anchorEl);
  const unread = unreadCount.data ?? 0;

  function handleOpen(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
    // Opening the panel counts as seeing the notifications.
    if (unread > 0) markRead.mutate();
  }

  function handleItemClick(n: NotificationResponse) {
    setAnchorEl(null);
    onNavigate(targetFor(n));
  }

  const items = notifications ?? [];

  return (
    <>
      <IconButton onClick={handleOpen} aria-label="Notifications">
        <Badge badgeContent={unread} max={99} color="error">
          <NotificationsIcon sx={{ color: ACCENT_BLUE }} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              width: 340,
              maxHeight: 420,
              mt: -1,
              backgroundColor: SURFACE_800,
              border: `1px solid ${SURFACE_BORDER}`,
              borderRadius: "12px",
              color: TEXT_PRIMARY,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${SURFACE_BORDER}` }}>
          <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>Notifications</Typography>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ px: 2, py: 4 }}>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, textAlign: "center" }}>
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          <Stack direction="column">
            {items.map((n) => (
              <Stack
                key={n.id}
                direction="row"
                onClick={() => handleItemClick(n)}
                sx={{
                  alignItems: "center",
                  gap: 1.25,
                  px: 2,
                  py: 1.25,
                  cursor: "pointer",
                  // Subtle highlight for unread items.
                  backgroundColor: n.read ? "transparent" : "rgba(77, 141, 255, 0.08)",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                <PlayerAvatar
                  username={n.actor?.username ?? "?"}
                  avatarKey={n.actor?.avatarKey}
                  size={36}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                    {messageFor(n)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                    {relativeTime(n.createdAt)}
                  </Typography>
                </Box>
                {!n.read && (
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ACCENT_BLUE, flexShrink: 0 }} />
                )}
              </Stack>
            ))}
          </Stack>
        )}

        {items.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${SURFACE_BORDER}` }}>
            <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
              Showing your latest notifications
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
}
