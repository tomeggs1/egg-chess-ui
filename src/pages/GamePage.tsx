import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { Board } from "../board/Board";
import { parsePlacement, reconcilePieceIds, type PlacedPiece } from "../board/fen";
import type { MoveTarget } from "../board/moves";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";
import { PromotionPicker } from "../components/PromotionPicker";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlayerBadge } from "../components/PlayerBadge";
import { GameMovesPanel } from "../components/GameMovesPanel";
import { Button } from "../components/Button";
import { uiPieceSrc } from "../data/pieceAssets";
import { useAuth } from "../auth/AuthContext";
import {
  useAcceptDraw,
  useClaimTimeout,
  useDeclineDraw,
  useGame,
  useOfferDraw,
  useResign,
  useSubmitMove,
} from "../hooks/useGame";
import { useGameChannel } from "../hooks/useGameChannel";
import type { PieceColor, PieceType } from "../data/pieceThemes";
import {
  COLOR_ERROR,
  MAIN_BLUE_LIGHT,
  SURFACE_600,
  SURFACE_BLACK,
  SURFACE_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

type Square = { file: number; rank: number };

/**
 * Live game screen. Server-authoritative: the board renders the position the
 * service sends, selection/targets come from the server's legal-move list, and
 * moves are submitted over REST while updates arrive over the game's STOMP topic.
 */
export default function GamePage() {
  const { gameId } = useParams();
  const id = gameId ?? "";
  const { player } = useAuth();
  const { data: state, isLoading, error } = useGame(id);
  useGameChannel(id);
  const submit = useSubmitMove(id);
  const resign = useResign(id);
  const claimTimeout = useClaimTimeout(id);
  const offerDraw = useOfferDraw(id);
  const acceptDraw = useAcceptDraw(id);
  const declineDraw = useDeclineDraw(id);

  const [selected, setSelected] = useState<Square | null>(null);
  const [resignOpen, setResignOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: PieceColor;
    options: PieceType[];
  } | null>(null);
  // Which ply is being reviewed; null = follow the live position.
  const [reviewPly, setReviewPly] = useState<number | null>(null);

  // Review navigation: the viewed ply, whether we're at the live position, and
  // the placement to render. Jumping to/past the last ply resumes following live.
  const latestPly = state ? state.moves.length - 1 : -1;
  const viewedPly = reviewPly ?? latestPly;
  const atLive = viewedPly >= latestPly;
  const displayedPlacement = !state
    ? ""
    : atLive
      ? state.placement
      : (state.placements?.[viewedPly + 1] ?? state.placement);
  const setViewedPly = (ply: number) => setReviewPly(ply >= latestPly ? null : Math.max(-1, ply));

  // Pieces with stable ids so moves animate: reconcile the new position against
  // the previous one, so a moved piece keeps its id and CSS-transitions to its
  // new square (same single-commit derivation the board explorer uses). The
  // previous-position baseline is stored in a ref updated after commit.
  const prevPieces = useRef<PlacedPiece[]>([]);
  const idCounter = useRef(0);
  const board = useMemo(() => {
    const parsed = displayedPlacement ? parsePlacement(displayedPlacement) : [];
    return reconcilePieceIds(prevPieces.current, parsed, () => `lg${idCounter.current++}`);
  }, [displayedPlacement]);
  useEffect(() => {
    prevPieces.current = board;
  }, [board]);

  const me = player?.username;
  const myColor: PieceColor | null =
    state && me === state.whiteUsername ? "white" : state && me === state.blackUsername ? "black" : null;
  const isMyTurn = !!state && state.status === "ACTIVE" && myColor != null && state.sideToMove === myColor;

  // Clear any local selection whenever the position changes (either side moved).
  useEffect(() => {
    setSelected(null);
    setPendingPromotion(null);
  }, [state?.placement]);

  // No selecting while reviewing an earlier position.
  useEffect(() => {
    if (!atLive) {
      setSelected(null);
      setPendingPromotion(null);
    }
  }, [atLive]);

  // When the side-to-move's clock is due to run out, ask the server to settle it.
  // The server verifies independently, so a slightly-early client is harmless.
  // The clock doesn't run until the first move, so there's nothing to claim yet.
  useEffect(() => {
    if (!state || state.status !== "ACTIVE" || state.moves.length === 0) return;
    const runningMs = state.sideToMove === "white" ? state.whiteMs : state.blackMs;
    if (runningMs == null) return; // untimed
    const timer = setTimeout(() => claimTimeout.mutate(), Math.max(0, runningMs) + 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.serverNow, state?.status, state?.sideToMove, state?.moves.length]);

  // Targets for the selected piece, from the server's legal moves (deduped so a
  // promotion square shows one dot).
  const moveTargets = useMemo<MoveTarget[]>(() => {
    if (!state || !selected || !atLive) return [];
    const seen = new Set<string>();
    const out: MoveTarget[] = [];
    for (const m of state.legalMoves) {
      if (m.fromFile !== selected.file || m.fromRank !== selected.rank) continue;
      const key = `${m.toFile},${m.toRank}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ file: m.toFile, rank: m.toRank, kind: m.kind === "CAPTURE" ? "capture" : "move" });
    }
    return out;
  }, [state, selected]);

  // Highlight the king when the side to move is in check / mated.
  const checkSquare = useMemo<Square | null>(() => {
    if (!state || !atLive || (state.outcome !== "CHECK" && state.outcome !== "CHECKMATE")) return null;
    const king = board.find((p) => p.type === "king" && p.color === state.sideToMove);
    return king ? { file: king.file, rank: king.rank } : null;
  }, [state, board]);

  const handleSquareClick = (file: number, rank: number) => {
    if (!state || !isMyTurn || !atLive) return;

    if (selected) {
      const matches = state.legalMoves.filter(
        (m) => m.fromFile === selected.file && m.fromRank === selected.rank && m.toFile === file && m.toRank === rank,
      );
      if (matches.length > 0) {
        // Multiple matches for one square = promotion choice.
        if (matches.length > 1) {
          const options = matches.map((m) => m.promotion).filter((p): p is string => !!p) as PieceType[];
          setPendingPromotion({ from: selected, to: { file, rank }, color: myColor!, options });
          setSelected(null);
          return;
        }
        const only = matches[0];
        submit.mutate({
          fromFile: selected.file,
          fromRank: selected.rank,
          toFile: file,
          toRank: rank,
          promotion: only.promotion ?? undefined,
        });
        setSelected(null);
        return;
      }
    }

    // (Re)select one of your own pieces; anything else clears.
    const piece = board.find((p) => p.file === file && p.rank === rank);
    if (!piece || piece.color !== myColor) {
      setSelected(null);
      return;
    }
    setSelected((prev) => (prev && prev.file === file && prev.rank === rank ? null : { file, rank }));
  };

  const choosePromotion = (type: PieceType) => {
    const pp = pendingPromotion;
    if (!pp) return;
    submit.mutate({
      fromFile: pp.from.file,
      fromRank: pp.from.rank,
      toFile: pp.to.file,
      toRank: pp.to.rank,
      promotion: type,
    });
    setPendingPromotion(null);
  };

  if (isLoading) {
    return (
      <section>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mt: 4 }}>
          <CircularProgress size={20} sx={{ color: TEXT_SECONDARY }} />
          <Typography sx={{ color: TEXT_SECONDARY }}>Loading game…</Typography>
        </Stack>
      </section>
    );
  }
  if (error || !state) {
    return (
      <section>
        <Typography variant="h5" sx={{ color: TEXT_PRIMARY, mt: 2 }}>
          Game unavailable
        </Typography>
        <Typography sx={{ color: TEXT_SECONDARY, mt: 1 }}>
          This game couldn't be loaded. It may not exist, or the service is unavailable.
        </Typography>
      </section>
    );
  }

  const orientation: PieceColor = myColor ?? "white";
  const topColor: PieceColor = orientation === "white" ? "black" : "white";
  const bottomColor: PieceColor = orientation;
  const usernameFor = (c: PieceColor) => (c === "white" ? state.whiteUsername : state.blackUsername);
  const avatarKeyFor = (c: PieceColor) => (c === "white" ? state.whiteAvatarKey : state.blackAvatarKey);
  const ratingFor = (c: PieceColor) => (c === "white" ? state.whiteRating : state.blackRating);
  const clockMsFor = (c: PieceColor) => (c === "white" ? state.whiteMs : state.blackMs);
  // Pieces a player has captured (their opponent's, so rendered in the opposite color).
  const capturedFor = (c: PieceColor) => (c === "white" ? state.capturedByWhite : state.capturedByBlack);
  // Net material for a side: value of its captures minus the opponent's. Positive
  // means that side is up; only the leading side shows a "+N" badge.
  const advantageFor = (c: PieceColor) =>
    materialValue(capturedFor(c)) - materialValue(capturedFor(c === "white" ? "black" : "white"));
  const over = state.status !== "ACTIVE";
  const started = state.moves.length > 0; // clocks don't run until the first move

  return (
    <section>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ gap: 3, height: { md: "calc(100dvh - 4rem)" }, alignItems: { md: "flex-start" } }}
      >
        {/* Board + player rows, pinned left (the main padding is the gap from
            the navbar). Sized by the viewport height so the square board fills
            it, shrinking to fit the width left beside the panel. */}
        <Stack
          direction="column"
          sx={{
            gap: 1,
            flexShrink: { md: 1 },
            minWidth: 0,
            width: { xs: "100%", md: "calc(100dvh - 4rem - 140px)" },
          }}
        >
          <PlayerRow
            username={usernameFor(topColor)}
            avatarKey={avatarKeyFor(topColor)}
            rating={ratingFor(topColor)}
            captured={capturedFor(topColor)}
            advantage={advantageFor(topColor)}
            clockMs={clockMsFor(topColor)}
            color={topColor}
            toMove={state.sideToMove === topColor && !over}
            clockRunning={state.sideToMove === topColor && !over && started}
          />

          <Box sx={{ position: "relative", width: "100%" }}>
            <Board
              position={displayedPlacement}
              pieces={board}
              orientation={orientation}
              maxSquareSize={160}
              selectedSquare={selected}
              moveTargets={moveTargets}
              checkSquare={checkSquare}
              onSquareClick={handleSquareClick}
            />
            {pendingPromotion && (
              <PromotionPicker
                color={pendingPromotion.color}
                options={pendingPromotion.options}
                onSelect={choosePromotion}
                onCancel={() => setPendingPromotion(null)}
              />
            )}
          </Box>

          <PlayerRow
            username={usernameFor(bottomColor)}
            avatarKey={avatarKeyFor(bottomColor)}
            rating={ratingFor(bottomColor)}
            captured={capturedFor(bottomColor)}
            advantage={advantageFor(bottomColor)}
            clockMs={clockMsFor(bottomColor)}
            color={bottomColor}
            toMove={state.sideToMove === bottomColor && !over}
            clockRunning={state.sideToMove === bottomColor && !over && started}
          />
        </Stack>

        <Stack
          direction="column"
          sx={{ flexShrink: 0, width: { xs: "100%", md: 320 }, gap: 2, height: { md: "100%" }, minHeight: 0 }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: "16px",
              backgroundColor: SURFACE_BLACK,
              border: `1px solid ${SURFACE_BORDER}`,
              textAlign: "center",
            }}
          >
            <StatusLine state={state} myColor={myColor} isMyTurn={isMyTurn} />
          </Box>

          <GameMovesPanel
            moves={state.moves}
            viewedPly={viewedPly}
            onSelect={setViewedPly}
            standard={state.gameDefinitionId === "standard"}
          />

          {!over && myColor && (
            <GameControls
              drawOfferedToMe={!!state.drawOfferBy && state.drawOfferBy !== myColor}
              drawOfferedByMe={state.drawOfferBy === myColor}
              onOfferDraw={() => offerDraw.mutate()}
              onAcceptDraw={() => acceptDraw.mutate()}
              onDeclineDraw={() => declineDraw.mutate()}
              onResign={() => setResignOpen(true)}
            />
          )}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={resignOpen}
        title="Resign this game?"
        message="Your opponent will be awarded the win."
        confirmLabel="Resign"
        confirmColor={COLOR_ERROR}
        icon={<OutlinedFlagRoundedIcon sx={{ fontSize: 44, color: COLOR_ERROR }} />}
        onConfirm={() => {
          resign.mutate();
          setResignOpen(false);
        }}
        onCancel={() => setResignOpen(false)}
      />
    </section>
  );
}

function PlayerRow({
  username,
  avatarKey,
  rating,
  captured,
  advantage,
  clockMs,
  color,
  toMove,
  clockRunning,
}: {
  username: string;
  avatarKey: string | null;
  rating: number;
  /** Codes of the opponent's pieces this player has captured. */
  captured: string[];
  /** Net material for this side; a positive value shows as a "+N" badge. */
  advantage: number;
  /** Remaining clock in ms, or null if untimed. */
  clockMs: number | null;
  color: PieceColor;
  toMove: boolean;
  /** Whether this clock is actively counting down (turn + game in motion). */
  clockRunning: boolean;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        p: 1,
        borderRadius: "12px",
        backgroundColor: SURFACE_BLACK,
        border: `1px solid ${toMove ? MAIN_BLUE_LIGHT : SURFACE_BORDER}`,
      }}
    >
      {/* Left: avatar + name + rating (same badge used across the app). */}
      <PlayerBadge username={username} avatarKey={avatarKey} rating={rating} size={40} sx={{ minWidth: 0 }} />

      {/* Right: captured pieces pinned next to the mock timer. */}
      <Stack direction="row" sx={{ alignItems: "center", gap: 2, flexShrink: 0 }}>
        <CapturedStrip codes={captured} advantage={advantage} color={color === "white" ? "black" : "white"} />
        <Clock ms={clockMs} running={clockRunning} color={color} active={toMove} />
      </Stack>
    </Stack>
  );
}

// Piece order (high → low value) for a tidy captured display.
const CAPTURE_ORDER: Record<string, number> = { queen: 5, rook: 4, bishop: 3, knight: 2, pawn: 1 };

// Standard relative piece values for the material-advantage badge.
const PIECE_VALUE: Record<string, number> = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };
const materialValue = (codes: string[]) => codes.reduce((sum, c) => sum + (PIECE_VALUE[c] ?? 0), 0);

function CapturedStrip({ codes, advantage, color }: { codes: string[]; advantage: number; color: PieceColor }) {
  if (codes.length === 0) return null;
  const sorted = [...codes].sort((a, b) => (CAPTURE_ORDER[b] ?? 0) - (CAPTURE_ORDER[a] ?? 0));
  // Group consecutive same-type pieces: stacked tightly within a group, with a
  // clear gap between different types (as in the board explorer).
  const groups: string[][] = [];
  for (const c of sorted) {
    const last = groups[groups.length - 1];
    if (last && last[0] === c) last.push(c);
    else groups.push([c]);
  }
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", flexWrap: "nowrap", columnGap: 0.5, rowGap: 0.25, maxWidth: 250 }}
    >
      {groups.map((group, gi) => (
        <Box key={gi} sx={{ display: "flex", alignItems: "center" }}>
          {group.map((code, i) => (
            <Box
              key={i}
              component="img"
              src={uiPieceSrc(color, code as PieceType)}
              alt={code}
              sx={{ height: 20, width: "auto", ml: i === 0 ? 0 : "-13px" }}
            />
          ))}
        </Box>
      ))}
      {advantage > 0 && (
        <Typography
          sx={{ ml: 0.5, color: TEXT_SECONDARY, fontSize: "0.8rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
        >
          +{advantage}
        </Typography>
      )}
    </Stack>
  );
}

// mm:ss, switching to tenths of a second under 10s.
function formatClock(ms: number): string {
  const total = Math.max(0, ms);
  const seconds = total / 1000;
  if (seconds < 10) return seconds.toFixed(1);
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * A player's clock. `ms` is the remaining time as of the last server state;
 * when `running` it ticks down locally from receipt. Null ms = untimed (∞).
 */
function Clock({
  ms,
  running,
  color,
  active,
}: {
  ms: number | null;
  running: boolean;
  color: PieceColor;
  active: boolean;
}) {
  const isWhite = color === "white";
  const [display, setDisplay] = useState<number | null>(ms);

  useEffect(() => {
    setDisplay(ms);
    if (!running || ms == null) return;
    const start = performance.now();
    const from = ms;
    const id = setInterval(() => setDisplay(Math.max(0, from - (performance.now() - start))), 100);
    return () => clearInterval(id);
  }, [ms, running]);

  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 1.5,
        py: 0.5,
        borderRadius: "8px",
        // White/black clock face indicates which side the player is.
        backgroundColor: isWhite ? "#ececec" : "#161616",
        border: `1px solid ${active ? MAIN_BLUE_LIGHT : isWhite ? "#c9c9c9" : "#3a3a3f"}`,
      }}
    >
      <Typography
        sx={{
          fontFamily: "monospace",
          fontSize: "1.15rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: isWhite ? "#161616" : "#ececec",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display == null ? "∞" : formatClock(display)}
      </Typography>
    </Box>
  );
}

/**
 * In-game actions: offer a draw or resign. When the opponent has an outstanding
 * offer, the draw control becomes an Accept/Decline pair instead.
 */
function GameControls({
  drawOfferedToMe,
  drawOfferedByMe,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onResign,
}: {
  drawOfferedToMe: boolean;
  drawOfferedByMe: boolean;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  onResign: () => void;
}) {
  if (drawOfferedToMe) {
    return (
      <Stack direction="column" sx={{ gap: 1 }}>
        <Typography sx={{ color: TEXT_SECONDARY, fontSize: "0.85rem", textAlign: "center" }}>
          Your opponent offers a draw
        </Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button id="accept-draw" type="primary" label="Accept" onClick={onAcceptDraw} style={{ flex: 1 }} />
          <Button
            id="decline-draw"
            type="secondary"
            label="Decline"
            onClick={onDeclineDraw}
            style={{ flex: 1, backgroundColor: SURFACE_600 }}
          />
        </Stack>
      </Stack>
    );
  }
  return (
    <Stack direction="row" sx={{ gap: 1 }}>
      <Button
        id="offer-draw"
        type="secondary"
        label={drawOfferedByMe ? "Draw offered" : "Offer draw"}
        isDisabled={drawOfferedByMe}
        onClick={onOfferDraw}
        style={{ flex: 1, backgroundColor: SURFACE_600 }}
      />
      <Button
        id="resign"
        type="secondary"
        label="Resign"
        onClick={onResign}
        style={{ flex: 1, backgroundColor: SURFACE_600 }}
      />
    </Stack>
  );
}

// Human-readable "how it ended" line, from the server's endReason. Falls back to
// the engine outcome for older games settled before endReason was recorded.
function endReasonDetail(
  reason: import("../api/games").GameState["endReason"],
  isDraw: boolean,
  outcome: import("../api/games").GameState["outcome"],
): string | null {
  switch (reason) {
    case "CHECKMATE":
      return "by checkmate";
    case "RESIGNATION":
      return "by resignation";
    case "TIMEOUT":
      return isDraw ? "by timeout" : "on time";
    case "STALEMATE":
      return "by stalemate";
    case "AGREEMENT":
      return "by agreement";
    case "INSUFFICIENT_MATERIAL":
      return "by insufficient material";
    case "THREEFOLD_REPETITION":
      return "by threefold repetition";
    default:
      return outcome === "CHECKMATE" ? "by checkmate" : null;
  }
}

function StatusLine({
  state,
  myColor,
  isMyTurn,
}: {
  state: import("../api/games").GameState;
  myColor: PieceColor | null;
  isMyTurn: boolean;
}) {
  if (state.status !== "ACTIVE") {
    const isDraw = state.result === "1/2-1/2";
    let text: string;
    if (isDraw) {
      text = "Draw";
    } else if (state.winnerUsername && myColor) {
      text =
        state.winnerUsername === (myColor === "white" ? state.whiteUsername : state.blackUsername)
          ? "You won"
          : "You lost";
    } else {
      text = state.winnerUsername ? `${state.winnerUsername} won` : "Game over";
    }
    const detail = endReasonDetail(state.endReason, isDraw, state.outcome);
    return (
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="h6" sx={{ color: TEXT_PRIMARY, fontWeight: 700 }}>
          {text}
        </Typography>
        {detail && (
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
            {detail}
          </Typography>
        )}
      </Stack>
    );
  }

  const check = state.outcome === "CHECK";
  return (
    <Typography sx={{ color: check ? COLOR_ERROR : TEXT_SECONDARY, fontWeight: check ? 700 : 500 }}>
      {isMyTurn ? "Your move" : "Waiting for opponent"}
      {check ? " · Check!" : ""}
    </Typography>
  );
}
