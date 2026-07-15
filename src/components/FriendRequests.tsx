import { useEffect, useState } from "react";
import {
  Box,
  Button as MuiButton,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import {
  useAcceptRequest,
  useDeclineRequest,
  useIncomingRequests,
  useOutgoingRequests,
  usePlayerSearch,
  useRemoveFriendship,
  useSendFriendRequest,
} from "../hooks/useFriends";
import type { FriendshipResponse, PlayerSearchResult } from "../api/friends";
import { PlayerBadge } from "./PlayerBadge";
import {
  ACCENT_BLUE,
  COLOR_SUCCESS,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

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

// A row: player on the left, an action node on the right.
function Row({ children, action }: { children: React.ReactNode; action: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, py: 1, px: 1, borderRadius: "10px" }}
    >
      {children}
      {action}
    </Stack>
  );
}

const primaryBtnSx = {
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "8px",
  backgroundColor: ACCENT_BLUE,
  "&:hover": { backgroundColor: ACCENT_BLUE },
};

const outlineBtnSx = {
  textTransform: "none",
  fontWeight: 600,
  borderRadius: "8px",
  color: TEXT_SECONDARY,
  borderColor: SURFACE_BORDER,
  "&:hover": { borderColor: ACCENT_BLUE, color: TEXT_PRIMARY },
};

function SearchResults({ query }: { query: string }) {
  const { data: results, isLoading, isError } = usePlayerSearch(query);
  const send = useSendFriendRequest();
  const accept = useAcceptRequest();

  if (isLoading) {
    return (
      <Stack sx={{ minHeight: 140, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={26} sx={{ color: ACCENT_BLUE }} />
      </Stack>
    );
  }
  if (isError) {
    return (
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center", py: 3 }}>
        Search failed. Please try again.
      </Typography>
    );
  }
  if (!results || results.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: TEXT_MUTED, textAlign: "center", py: 3 }}>
        No players found matching "{query.trim()}".
      </Typography>
    );
  }

  const action = (r: PlayerSearchResult) => {
    switch (r.relationship) {
      case "FRIENDS":
        return <Chip label="Friends" size="small" sx={{ color: COLOR_SUCCESS, borderColor: SURFACE_BORDER }} variant="outlined" />;
      case "PENDING_OUTGOING":
        return <Chip label="Requested" size="small" sx={{ color: TEXT_MUTED, borderColor: SURFACE_BORDER }} variant="outlined" />;
      case "PENDING_INCOMING":
        return (
          <MuiButton
            size="small"
            variant="contained"
            disableElevation
            disabled={accept.isPending && accept.variables === r.friendshipId}
            onClick={() => r.friendshipId != null && accept.mutate(r.friendshipId)}
            sx={primaryBtnSx}
          >
            Accept
          </MuiButton>
        );
      default:
        return (
          <MuiButton
            size="small"
            variant="contained"
            disableElevation
            startIcon={<PersonAddRoundedIcon />}
            disabled={send.isPending && send.variables === r.username}
            onClick={() => send.mutate(r.username)}
            sx={primaryBtnSx}
          >
            Add
          </MuiButton>
        );
    }
  };

  return (
    <Stack direction="column" sx={{ maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
      {results.map((r) => (
        <Row key={r.id} action={action(r)}>
          <PlayerBadge username={r.username} avatarKey={r.avatarKey} rating={r.rating} />
        </Row>
      ))}
    </Stack>
  );
}

function PendingRequests() {
  const { data: incoming, isLoading: incomingLoading } = useIncomingRequests();
  const { data: outgoing, isLoading: outgoingLoading } = useOutgoingRequests();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  const cancel = useRemoveFriendship();

  if (incomingLoading || outgoingLoading) {
    return (
      <Stack sx={{ minHeight: 140, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={26} sx={{ color: ACCENT_BLUE }} />
      </Stack>
    );
  }

  const incomingList = incoming ?? [];
  const outgoingList = outgoing ?? [];

  if (incomingList.length === 0 && outgoingList.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: TEXT_MUTED, textAlign: "center", py: 4 }}>
        No pending requests. Search above to add friends.
      </Typography>
    );
  }

  return (
    <Stack direction="column" sx={{ gap: 2, maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
      {incomingList.length > 0 && (
        <Stack direction="column" sx={{ gap: 0.5 }}>
          <Typography variant="overline" sx={{ color: TEXT_MUTED }}>
            Incoming ({incomingList.length})
          </Typography>
          {incomingList.map((f: FriendshipResponse) => (
            <Row
              key={f.id}
              action={
                <Stack direction="row" sx={{ gap: 0.75 }}>
                  <MuiButton
                    size="small"
                    variant="contained"
                    disableElevation
                    disabled={accept.isPending && accept.variables === f.id}
                    onClick={() => accept.mutate(f.id)}
                    sx={primaryBtnSx}
                  >
                    Accept
                  </MuiButton>
                  <MuiButton
                    size="small"
                    variant="outlined"
                    disabled={decline.isPending && decline.variables === f.id}
                    onClick={() => decline.mutate(f.id)}
                    sx={outlineBtnSx}
                  >
                    Decline
                  </MuiButton>
                </Stack>
              }
            >
              <PlayerBadge username={f.requester.username} avatarKey={f.requester.avatarKey} rating={f.requester.rating} />
            </Row>
          ))}
        </Stack>
      )}

      {incomingList.length > 0 && outgoingList.length > 0 && <Divider sx={{ borderColor: SURFACE_BORDER }} />}

      {outgoingList.length > 0 && (
        <Stack direction="column" sx={{ gap: 0.5 }}>
          <Typography variant="overline" sx={{ color: TEXT_MUTED }}>
            Sent ({outgoingList.length})
          </Typography>
          {outgoingList.map((f: FriendshipResponse) => (
            <Row
              key={f.id}
              action={
                <MuiButton
                  size="small"
                  variant="outlined"
                  disabled={cancel.isPending && cancel.variables === f.id}
                  onClick={() => cancel.mutate(f.id)}
                  sx={outlineBtnSx}
                >
                  Cancel
                </MuiButton>
              }
            >
              <PlayerBadge username={f.addressee.username} avatarKey={f.addressee.avatarKey} rating={f.addressee.rating} />
            </Row>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function FriendRequests() {
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(rawQuery), 300);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const searching = query.trim().length >= 2;

  return (
    <Stack direction="column" sx={{ gap: 1.5 }}>
      <TextField
        placeholder="Search players by username"
        value={rawQuery}
        onChange={(e) => setRawQuery(e.target.value)}
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

      <Box>{searching ? <SearchResults query={query} /> : <PendingRequests />}</Box>
    </Stack>
  );
}
