import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Badge,
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditSquare";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useAuth } from "../auth/AuthContext";
import { useFriends } from "../hooks/useFriends";
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useStartConversation,
} from "../hooks/useMessages";
import type { ConversationResponse } from "../api/messages";
import type { PlayerSummary } from "../api/friends";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerBadge } from "./PlayerBadge";
import {
  ACCENT_BLUE,
  SURFACE_700,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

interface MessagesDialogProps {
  open: boolean;
  onClose: () => void;
}

type View = { name: "list" } | { name: "new" } | { name: "thread"; conversation: ConversationResponse };

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE, borderWidth: "1.5px" },
  },
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center", gap: 1, px: 3 }}>
      {children}
    </Stack>
  );
}

// --- Conversation list -------------------------------------------------------

function ConversationList({ onOpen }: { onOpen: (c: ConversationResponse) => void }) {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <Centered>
        <CircularProgress size={26} sx={{ color: ACCENT_BLUE }} />
      </Centered>
    );
  }
  if (!conversations || conversations.length === 0) {
    return (
      <Centered>
        <Typography variant="subtitle1" sx={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
          No conversations yet
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
          Start a new message with one of your friends.
        </Typography>
      </Centered>
    );
  }

  return (
    <Stack direction="column" sx={{ flex: 1, overflowY: "auto" }}>
      {conversations.map((c) => (
        <Stack
          key={c.id}
          direction="row"
          onClick={() => onOpen(c)}
          sx={{
            alignItems: "center",
            gap: 1.25,
            px: 2,
            py: 1.5,
            cursor: "pointer",
            borderBottom: `1px solid ${SURFACE_BORDER}`,
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.04)" },
          }}
        >
          <PlayerAvatar
            username={c.otherParticipant?.username ?? "?"}
            avatarKey={c.otherParticipant?.avatarKey}
            size={40}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
              {c.otherParticipant?.username ?? "Unknown"}
            </Typography>
            <Typography noWrap variant="body2" sx={{ color: TEXT_MUTED }}>
              {c.lastMessageBody ?? "No messages yet"}
            </Typography>
          </Box>
          {c.unreadCount > 0 && <Badge badgeContent={c.unreadCount} max={99} color="error" sx={{ mr: 1.5 }} />}
        </Stack>
      ))}
    </Stack>
  );
}

// --- New conversation (friend picker) ---------------------------------------

function NewConversation({ onStarted }: { onStarted: (c: ConversationResponse) => void }) {
  const { player } = useAuth();
  const { data: friendships, isLoading } = useFriends();
  const startConversation = useStartConversation();

  const friends: PlayerSummary[] = useMemo(() => {
    if (!friendships || !player) return [];
    return friendships.map((f) => (f.requester.id === player.id ? f.addressee : f.requester));
  }, [friendships, player]);

  async function handlePick(username: string) {
    const conversation = await startConversation.mutateAsync(username);
    onStarted(conversation);
  }

  if (isLoading) {
    return (
      <Centered>
        <CircularProgress size={26} sx={{ color: ACCENT_BLUE }} />
      </Centered>
    );
  }
  if (friends.length === 0) {
    return (
      <Centered>
        <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
          Add some friends first — you can only message friends.
        </Typography>
      </Centered>
    );
  }

  return (
    <Stack direction="column" sx={{ flex: 1, overflowY: "auto" }}>
      {friends.map((friend) => (
        <Box
          key={friend.id}
          onClick={() => !startConversation.isPending && handlePick(friend.username)}
          sx={{
            px: 2,
            py: 1.25,
            cursor: startConversation.isPending ? "default" : "pointer",
            borderBottom: `1px solid ${SURFACE_BORDER}`,
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.04)" },
          }}
        >
          <PlayerBadge username={friend.username} avatarKey={friend.avatarKey} rating={friend.rating} />
        </Box>
      ))}
    </Stack>
  );
}

// --- Thread ------------------------------------------------------------------

function MessageThread({ conversation }: { conversation: ConversationResponse }) {
  const { player } = useAuth();
  const myId = player?.id ?? -1;
  const { data: messages, isLoading } = useMessages(conversation.id);
  const send = useSendMessage(conversation.id, myId);
  const markRead = useMarkConversationRead();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Opening a thread marks it read.
  useEffect(() => {
    markRead.mutate(conversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    send.mutate(body);
    setDraft("");
  }

  return (
    <Stack direction="column" sx={{ flex: 1, minHeight: 0 }}>
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
        {isLoading ? (
          <Centered>
            <CircularProgress size={26} sx={{ color: ACCENT_BLUE }} />
          </Centered>
        ) : (
          <Stack direction="column" sx={{ gap: 1 }}>
            {(messages ?? []).map((m) => {
              const mine = m.senderId === myId;
              return (
                <Box
                  key={m.id}
                  sx={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "78%",
                    px: 1.5,
                    py: 1,
                    borderRadius: "12px",
                    backgroundColor: mine ? ACCENT_BLUE : SURFACE_700,
                    color: mine ? "#fff" : TEXT_PRIMARY,
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {m.body}
                  </Typography>
                </Box>
              );
            })}
            <div ref={bottomRef} />
          </Stack>
        )}
      </Box>

      <Box component="form" onSubmit={handleSend} sx={{ p: 1.5, borderTop: `1px solid ${SURFACE_BORDER}` }}>
        <TextField
          placeholder="Type a message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          size="small"
          fullWidth
          autoComplete="off"
          slotProps={{
            htmlInput: { maxLength: 2000 },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" disabled={!draft.trim()} aria-label="Send" sx={{ color: ACCENT_BLUE }}>
                    <SendRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={inputSx}
        />
      </Box>
    </Stack>
  );
}

// --- Dialog shell ------------------------------------------------------------

export default function MessagesDialog({ open, onClose }: MessagesDialogProps) {
  const [view, setView] = useState<View>({ name: "list" });

  // Always land on the conversation list when reopened.
  useEffect(() => {
    if (open) setView({ name: "list" });
  }, [open]);

  const title =
    view.name === "thread"
      ? view.conversation.otherParticipant?.username ?? "Conversation"
      : view.name === "new"
        ? "New message"
        : "Messages";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          height: 540,
          display: "flex",
          flexDirection: "column",
          backgroundColor: SURFACE_800,
          border: `1px solid ${SURFACE_BORDER}`,
          borderRadius: "16px",
          color: TEXT_PRIMARY,
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        sx={{ alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: `1px solid ${SURFACE_BORDER}` }}
      >
        {view.name !== "list" && (
          <IconButton size="small" aria-label="Back" onClick={() => setView({ name: "list" })} sx={{ color: TEXT_SECONDARY }}>
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <Typography sx={{ flex: 1, fontWeight: 700, color: TEXT_PRIMARY }}>{title}</Typography>
        {view.name === "list" && (
          <IconButton size="small" aria-label="New message" onClick={() => setView({ name: "new" })} sx={{ color: ACCENT_BLUE }}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" aria-label="Close" onClick={onClose} sx={{ color: TEXT_MUTED }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Body */}
      {view.name === "list" && <ConversationList onOpen={(c) => setView({ name: "thread", conversation: c })} />}
      {view.name === "new" && <NewConversation onStarted={(c) => setView({ name: "thread", conversation: c })} />}
      {view.name === "thread" && <MessageThread conversation={view.conversation} />}
    </Dialog>
  );
}
