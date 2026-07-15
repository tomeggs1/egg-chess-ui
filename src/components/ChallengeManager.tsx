import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button as MuiButton, CircularProgress, Dialog, Stack, Typography } from "@mui/material";
import {
  useAcceptChallenge,
  useCancelChallenge,
  useDeclineChallenge,
  useIncomingChallenges,
  useOutgoingChallenges,
} from "../hooks/useChallenges";
import type { ChallengeResponse } from "../api/challenges";
import { GameDefinitions } from "../data/gameDefinitions";
import { PlayerBadge } from "./PlayerBadge";
import {
  ACCENT_BLUE,
  COLOR_ERROR,
  COLOR_SUCCESS,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

function gameName(id: string): string {
  return GameDefinitions.find((g) => g.id === id)?.name ?? id;
}

function timeControl(initialSeconds: number | null, increment: number): string {
  if (initialSeconds == null) return "Unlimited";
  return `${Math.round(initialSeconds / 60)}+${increment}`;
}

// Whole seconds remaining until `expiresAt`, ticking down.
function useSecondsLeft(expiresAt: string): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
}

const dialogPaperSx = {
  "& .MuiDialog-paper": {
    backgroundColor: SURFACE_800,
    border: `1px solid ${SURFACE_BORDER}`,
    borderRadius: "16px",
    color: TEXT_PRIMARY,
    px: 3,
    py: 2.5,
    minWidth: 340,
  },
};

// --- Incoming: someone is challenging you ------------------------------------

function IncomingChallengeModal({ challenge }: { challenge: ChallengeResponse }) {
  const navigate = useNavigate();
  const accept = useAcceptChallenge();
  const decline = useDeclineChallenge();
  const secondsLeft = useSecondsLeft(challenge.expiresAt);
  const busy = accept.isPending || decline.isPending;

  if (secondsLeft <= 0) return null; // expired locally; the server event clears it too

  function handleAccept() {
    accept.mutate(challenge.id, {
      onSuccess: (started) => {
        if (started.gameId != null) navigate(`/game/${started.gameId}`);
      },
    });
  }

  return (
    <Dialog open onClose={() => {}} sx={dialogPaperSx}>
      <Stack direction="column" sx={{ gap: 1.5, alignItems: "center", textAlign: "center" }}>
        <Typography sx={{ color: ACCENT_BLUE, fontSize: "16px", fontWeight: "bold" }}>
          Game challenge · {secondsLeft}s
        </Typography>
        <PlayerBadge
          username={challenge.challenger.username}
          avatarKey={challenge.challenger.avatarKey}
          rating={challenge.challenger.rating}
          size={48}
        />
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
          challenges you to <strong>{gameName(challenge.gameDefinitionId)}</strong> ·{" "}
          {timeControl(challenge.initialSeconds, challenge.incrementSeconds)} · {challenge.rated ? "Rated" : "Casual"}
        </Typography>

        <Stack direction="row" sx={{ gap: 1.5, mt: 1 }}>
          <MuiButton
            variant="contained"
            disableElevation
            disabled={busy}
            onClick={handleAccept}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: COLOR_SUCCESS,
              "&:hover": { backgroundColor: COLOR_SUCCESS },
            }}
          >
            Accept
          </MuiButton>
          <MuiButton
            variant="outlined"
            disabled={busy}
            onClick={() => decline.mutate(challenge.id)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: TEXT_SECONDARY,
              borderColor: SURFACE_BORDER,
              "&:hover": { borderColor: COLOR_ERROR, color: TEXT_PRIMARY },
            }}
          >
            Decline
          </MuiButton>
        </Stack>
      </Stack>
    </Dialog>
  );
}

// --- Outgoing: waiting for your challenge to be answered ----------------------

function OutgoingChallengeModal({ challenge }: { challenge: ChallengeResponse }) {
  const cancel = useCancelChallenge();
  const secondsLeft = useSecondsLeft(challenge.expiresAt);

  if (secondsLeft <= 0) return null;

  return (
    <Dialog open onClose={() => {}} sx={dialogPaperSx}>
      <Stack direction="column" sx={{ gap: 1.5, alignItems: "center", textAlign: "center" }}>
        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
          <CircularProgress size={16} sx={{ color: ACCENT_BLUE }} />
          <Typography sx={{ color: ACCENT_BLUE, fontSize: "16px", fontWeight: "bold" }}>
            Game Challenge · {secondsLeft}s
          </Typography>
        </Stack>
        <PlayerBadge
          username={challenge.challengee.username}
          avatarKey={challenge.challengee.avatarKey}
          rating={challenge.challengee.rating}
          size={48}
        />
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
          Waiting for a response · <strong>{gameName(challenge.gameDefinitionId)}</strong> ·{" "}
          {timeControl(challenge.initialSeconds, challenge.incrementSeconds)} · {challenge.rated ? "Rated" : "Casual"}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <MuiButton
            variant="outlined"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(challenge.id)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: TEXT_SECONDARY,
              borderColor: SURFACE_BORDER,
              "&:hover": { borderColor: COLOR_ERROR, color: TEXT_PRIMARY },
            }}
          >
            Cancel
          </MuiButton>
        </Box>
      </Stack>
    </Dialog>
  );
}

/**
 * Renders the interactive challenge prompts app-wide: an incoming challenge to
 * respond to, and a "waiting" dialog for a challenge you've sent. Both are
 * driven by the live challenge queries (updated over WebSocket). Rendered only
 * while authenticated (its queries need a session).
 */
export function ChallengeManager() {
  const { data: incoming } = useIncomingChallenges();
  const { data: outgoing } = useOutgoingChallenges();

  const pendingIncoming = incoming?.find((c) => c.status === "PENDING");
  const pendingOutgoing = outgoing?.find((c) => c.status === "PENDING");

  return (
    <>
      {pendingIncoming && <IncomingChallengeModal key={pendingIncoming.id} challenge={pendingIncoming} />}
      {pendingOutgoing && <OutgoingChallengeModal key={pendingOutgoing.id} challenge={pendingOutgoing} />}
    </>
  );
}
