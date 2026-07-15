import { useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import { useFriends } from "../hooks/useFriends";
import { useOnlineFriends } from "../hooks/usePresence";
import { useAuth } from "../auth/AuthContext";
import { PlayerBadge } from "./PlayerBadge";
import StartGameDialog from "./StartGameDialog";
import type { PlayerSummary } from "../api/friends";
import { OpponentType } from "../data/types";
import { ACCENT_BLUE, SURFACE_BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

// Human "time ago" for a last-seen timestamp.
function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

// Hover text for a friend's presence.
function presenceText(online: boolean | undefined, lastSeenAt?: string | null): string {
  if (online) return "Currently online";
  if (lastSeenAt) return `Last online ${timeAgo(lastSeenAt)}`;
  return "Offline";
}

// Dark, glassy field styling matching the login/sign-up dialogs.
const searchFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE, borderWidth: "1.5px" },
  },
};

// Centered placeholder used for the loading / error / empty states.
function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      sx={{ minHeight: 180, alignItems: "center", justifyContent: "center", textAlign: "center", gap: 1 }}
    >
      {children}
    </Stack>
  );
}

export function FriendsList() {
  const { player } = useAuth();
  const { data: friendships, isLoading, isError } = useFriends();
  const { data: onlineFriends } = useOnlineFriends();
  const [query, setQuery] = useState("");
  const [challengeFriend, setChallengeFriend] = useState<PlayerSummary | null>(null);

  // Each accepted friendship stores both sides; the friend is whichever side
  // isn't the current player.
  const friends: PlayerSummary[] = useMemo(() => {
    if (!friendships || !player) return [];
    return friendships.map((f) => (f.requester.id === player.id ? f.addressee : f.requester));
  }, [friendships, player]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((p) => p.username.toLowerCase().includes(q));
  }, [friends, query]);

  if (isLoading) {
    return (
      <CenteredState>
        <CircularProgress size={28} sx={{ color: ACCENT_BLUE }} />
      </CenteredState>
    );
  }

  if (isError) {
    return (
      <CenteredState>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
          Couldn't load your friends. Please try again.
        </Typography>
      </CenteredState>
    );
  }

  if (friends.length === 0) {
    return (
      <CenteredState>
        <GroupRoundedIcon sx={{ fontSize: 44, color: TEXT_MUTED }} />
        <Typography variant="subtitle1" sx={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
          No friends yet
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
          Once you add friends, they'll show up here.
        </Typography>
      </CenteredState>
    );
  }

  return (
    <Stack direction="column" sx={{ gap: 1.5 }}>
      <TextField
        placeholder="Search friends"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
              </InputAdornment>
            ),
          },
        }}
        sx={searchFieldSx}
      />

      {filtered.length === 0 ? (
        <CenteredState>
          <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
            No friends match "{query.trim()}".
          </Typography>
        </CenteredState>
      ) : (
        <Stack direction="column" sx={{ maxHeight: 260, overflowY: "auto", pr: 0.5 }}>
          {filtered.map((friend) => {
            const online = onlineFriends ? onlineFriends.has(friend.username) : undefined;
            return (
              <Tooltip key={friend.id} title={presenceText(online, friend.lastSeenAt)} placement="left" arrow>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    py: 1,
                    px: 1,
                    borderRadius: "10px",
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.04)" },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <PlayerBadge
                      username={friend.username}
                      avatarKey={friend.avatarKey}
                      rating={friend.rating}
                      online={online}
                    />
                  </Box>
                  {/* Challenge only online friends — the service rejects offline targets. */}
                  {online && (
                    <IconButton
                      size="small"
                      aria-label={`Challenge ${friend.username}`}
                      onClick={() => setChallengeFriend(friend)}
                      sx={{ color: ACCENT_BLUE }}
                    >
                      <SportsEsportsRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Tooltip>
            );
          })}
        </Stack>
      )}

      <StartGameDialog
        open={challengeFriend !== null}
        opponentType={OpponentType.HUMAN}
        presetFriend={challengeFriend}
        onClose={() => setChallengeFriend(null)}
      />
    </Stack>
  );
}
