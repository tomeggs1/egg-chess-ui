import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Board } from "../board/Board";
import { parsePlacement, type PlacedPiece } from "../board/fen";
import { applyMove, findKingSquare, generateMoves, isInCheck, legalMoves, type MoveTarget } from "../board/moves";
import { PromotionPicker } from "../components/PromotionPicker";
import { useGameCatalog } from "../data/GameCatalogContext";
import type { PieceColor, PieceType } from "../data/pieceThemes";
import type { PieceDefinition } from "../data/types";
import { useAuth } from "../auth/AuthContext";
import { useDailyPuzzle, useSubmitPuzzleMove } from "../hooks/useDailyPuzzle";
import type { PuzzleStatus } from "../api/puzzles";
import {
  ACCENT_AMBER,
  ACCENT_PRIMARY,
  ACCENT_GREEN,
  COLOR_ERROR,
  COLOR_SUCCESS,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import DailyPuzzleEmblem from "../assets/images/daily-puzzle-large.webp";

type Square = { file: number; rank: number };

const PROMO_OPTIONS: PieceType[] = ["queen", "rook", "bishop", "knight"];
const PROMO_CHAR: Partial<Record<PieceType, string>> = { queen: "q", rook: "r", bishop: "b", knight: "n" };
const PROMO_TYPE: Record<string, PieceType> = { q: "queen", r: "rook", b: "bishop", n: "knight" };

const squareToUci = (s: Square) => String.fromCharCode(97 + s.file) + (s.rank + 1);
const uciFrom = (uci: string): Square => ({ file: uci.charCodeAt(0) - 97, rank: Number(uci[1]) - 1 });
const uciTo = (uci: string): Square => ({ file: uci.charCodeAt(2) - 97, rank: Number(uci[3]) - 1 });
const lastMoveOf = (uci: string) => ({ from: uciFrom(uci), to: uciTo(uci) });

/** Apply a UCI move to a board (used for the setup move + opponent replies). */
function applyUci(board: PlacedPiece[], uci: string): PlacedPiece[] {
  const to = uciTo(uci);
  const promo = uci[4] ? PROMO_TYPE[uci[4]] : undefined;
  return applyMove(board, uciFrom(uci), { file: to.file, rank: to.rank, kind: "capture" }, promo).pieces;
}

function levelName(rating: number): string {
  if (rating < 1000) return "Beginner";
  if (rating < 1500) return "Intermediate";
  if (rating < 2000) return "Expert";
  if (rating < 2500) return "Master";
  return "Grandmaster";
}

/**
 * Page header: emblem + title, with an optional subtitle line.
 *
 * Shared by the loaded and error states so the page does not reflow when the
 * puzzle resolves. The loading state keeps its bare centred spinner — it has no
 * date to show yet, and a header above a centred spinner reads as broken layout.
 */
function PageHeader({ subtitle }: { subtitle?: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
      {/* Decorative — the heading beside it already names the page. */}
      <Box
        component="img"
        src={DailyPuzzleEmblem}
        alt=""
        aria-hidden
        sx={{ width: 72, height: 72, flexShrink: 0, objectFit: "contain", display: "block" }}
      />
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
          Daily Puzzle
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: TEXT_MUTED, mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

export default function DailyPuzzlePage() {
  const { data: daily, isLoading, isError } = useDailyPuzzle();
  const { definitions, loading: catalogLoading } = useGameCatalog();
  const { isAuthenticated } = useAuth();
  const submit = useSubmitPuzzleMove();

  const standardDef = definitions.find((d) => d.id === "standard");

  // Standard piece movement rules + starting layout (for the engine).
  const defs = useMemo(() => {
    const m = new Map<PieceType, PieceDefinition>();
    if (standardDef) for (const d of standardDef.pieces) m.set(d.name.toLowerCase() as PieceType, d);
    return m;
  }, [standardDef]);
  const startPieces = useMemo(
    () => (standardDef ? parsePlacement(standardDef.starting_positions) : []),
    [standardDef],
  );

  const [pieces, setPieces] = useState<PlacedPiece[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>("NOT_STARTED");
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; target: MoveTarget } | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [solveMs, setSolveMs] = useState<number | null>(null);
  const [cleanSolve, setCleanSolve] = useState<boolean | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const solverColor = (daily?.solverColor ?? "white") as PieceColor;

  // Build the board from the puzzle: start position + setup move + confirmed moves.
  useEffect(() => {
    if (!daily || !standardDef) return;
    const line = [daily.opponentFirstMove, ...daily.movesPlayed];
    const board = line.reduce((b, uci) => applyUci(b, uci), parsePlacement(daily.initialFen));
    setPieces(board);
    setLastMove(lastMoveOf(line[line.length - 1]));
    setStatus(daily.status);
    setWrongMoves(daily.wrongMoves);
    setSolveMs(daily.solveMs);
    setSelected(null);
    setPendingPromotion(null);
    setFeedback(
      daily.status === "SOLVED"
        ? { text: "You already solved today's puzzle.", tone: "good" }
        : daily.status === "FAILED"
          ? { text: "You gave up on today's puzzle.", tone: "info" }
          : null,
    );
    return () => window.clearTimeout(timer.current);
  }, [daily, standardDef]);

  const solvable = status === "NOT_STARTED" || status === "IN_PROGRESS";
  const interactive = isAuthenticated && solvable && !busy && !pendingPromotion;

  // Legal targets for the selected piece (normal moves + promotions; the daily's
  // featured themes never require castling/en passant).
  const moveTargets = useMemo<MoveTarget[]>(() => {
    if (!selected || !interactive) return [];
    const piece = pieces.find((p) => p.file === selected.file && p.rank === selected.rank);
    if (!piece) return [];
    const startAt = startPieces.find((s) => s.file === piece.file && s.rank === piece.rank);
    const isInitial = !!startAt && startAt.color === piece.color && startAt.type === piece.type;
    const targets = generateMoves(pieces, piece, defs, isInitial);
    return legalMoves(pieces, { file: piece.file, rank: piece.rank }, targets, defs);
  }, [selected, pieces, defs, startPieces, interactive]);

  // Highlight whichever king is in check (opponent first, e.g. a mating finish).
  const checkSquare = useMemo(() => {
    const opp: PieceColor = solverColor === "white" ? "black" : "white";
    if (isInCheck(pieces, opp, defs)) return findKingSquare(pieces, opp);
    if (isInCheck(pieces, solverColor, defs)) return findKingSquare(pieces, solverColor);
    return null;
  }, [pieces, defs, solverColor]);

  function commitMove(from: Square, target: MoveTarget, promotion?: PieceType) {
    const uci = squareToUci(from) + squareToUci(target) + (promotion ? PROMO_CHAR[promotion] ?? "" : "");
    const snapshot = pieces;
    const snapshotLast = lastMove;
    setPieces(applyMove(pieces, from, target, promotion).pieces);
    setLastMove({ from, to: { file: target.file, rank: target.rank } });
    setSelected(null);
    setBusy(true);
    setFeedback(null);

    submit.mutate(uci, {
      onSuccess: (res) => {
        setWrongMoves(res.wrongMoves);
        if (res.result === "wrong") {
          setFeedback({ text: "Not the move — try again.", tone: "bad" });
          timer.current = window.setTimeout(() => {
            setPieces(snapshot);
            setLastMove(snapshotLast);
            setBusy(false);
          }, 550);
        } else if (res.result === "correct" && res.opponentReply) {
          setFeedback({ text: "Correct!", tone: "good" });
          const reply = res.opponentReply;
          timer.current = window.setTimeout(() => {
            setPieces((prev) => applyUci(prev, reply));
            setLastMove(lastMoveOf(reply));
            setBusy(false);
          }, 450);
        } else if (res.result === "solved") {
          setStatus("SOLVED");
          setSolveMs(res.solveMs);
          setCleanSolve(res.cleanSolve);
          setBusy(false);
          setFeedback({ text: "Solved! 🎉", tone: "good" });
        } else {
          setBusy(false);
        }
      },
      onError: () => {
        setPieces(snapshot);
        setLastMove(snapshotLast);
        setBusy(false);
        setFeedback({ text: "Something went wrong — try again.", tone: "bad" });
      },
    });
  }

  function handleSquareClick(file: number, rank: number) {
    if (!interactive) return;
    const target = selected ? moveTargets.find((t) => t.file === file && t.rank === rank) : undefined;
    if (selected && target) {
      const mover = pieces.find((p) => p.file === selected.file && p.rank === selected.rank);
      const farRank = solverColor === "white" ? 7 : 0;
      if (mover && defs.get(mover.type)?.promotes && !target.castle && target.rank === farRank) {
        setPendingPromotion({ from: selected, target });
        return;
      }
      commitMove(selected, target);
      return;
    }
    const piece = pieces.find((p) => p.file === file && p.rank === rank);
    setSelected(piece && piece.color === solverColor ? { file, rank } : null);
  }

  if (isLoading || catalogLoading) {
    return (
      <Stack sx={{ alignItems: "center", py: 8 }}>
        <CircularProgress sx={{ color: ACCENT_PRIMARY }} />
      </Stack>
    );
  }
  if (isError || !daily) {
    return (
      <Box sx={{ maxWidth: 560 }}>
        <PageHeader />
        <Typography sx={{ color: TEXT_SECONDARY, mt: 2 }}>
          No puzzle is available right now. Please check back later.
        </Typography>
      </Box>
    );
  }

  const dateLabel = new Date(daily.puzzleDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const feedbackColor =
    feedback?.tone === "good" ? COLOR_SUCCESS : feedback?.tone === "bad" ? COLOR_ERROR : TEXT_SECONDARY;

  return (
    <Box sx={{ maxWidth: 700 }}>
      <PageHeader subtitle={dateLabel} />

      <Stack direction="row" sx={{ gap: 1, mt: 2, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <Chip label={levelName(daily.rating)} sx={chipSx(ACCENT_PRIMARY)} />
        {daily.featuredTheme && <Chip label={daily.featuredTheme} sx={chipSx(ACCENT_AMBER)} />}
        <Chip label={`${solverColor === "white" ? "White" : "Black"} to move`} sx={chipSx(ACCENT_GREEN)} />
      </Stack>

      {/* Feedback / status banner. */}
      <Box sx={{ minHeight: 28, mb: 1 }}>
        {feedback && (
          <Typography sx={{ fontWeight: 600, color: feedbackColor }}>
            {feedback.tone === "good" && status === "SOLVED" && (
              <CheckCircleRoundedIcon fontSize="small" sx={{ verticalAlign: "text-bottom", mr: 0.5 }} />
            )}
            {feedback.text}
          </Typography>
        )}
      </Box>

      {!isAuthenticated && (
        <Typography sx={{ color: TEXT_SECONDARY, mb: 1.5 }}>
          Log in to solve today's puzzle and build your streak.
        </Typography>
      )}

      <Box sx={{ position: "relative", width: "100%" }}>
        <Board
          pieces={pieces}
          orientation={solverColor}
          showCoordinates
          maxSquareSize={88}
          selectedSquare={selected}
          moveTargets={moveTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          onSquareClick={interactive ? handleSquareClick : undefined}
        />
        {pendingPromotion && (
          <PromotionPicker
            color={solverColor}
            options={PROMO_OPTIONS}
            onSelect={(type) => {
              const p = pendingPromotion;
              setPendingPromotion(null);
              commitMove(p.from, p.target, type);
            }}
            onCancel={() => setPendingPromotion(null)}
          />
        )}
      </Box>

      {/* Solve summary. */}
      {status === "SOLVED" && (
        <Stack
          direction="row"
          sx={{
            mt: 2,
            gap: 3,
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${SURFACE_BORDER}`,
            backgroundColor: SURFACE_800,
            alignItems: "center",
          }}
        >
          <Summary label="Time" value={solveMs != null ? `${(solveMs / 1000).toFixed(1)}s` : "—"} />
          <Summary label="Wrong moves" value={String(wrongMoves)} />
          <Summary
            label="Clean solve"
            value={cleanSolve == null ? (wrongMoves === 0 ? "Yes" : "No") : cleanSolve ? "Yes" : "No"}
            highlight={(cleanSolve ?? wrongMoves === 0) ? ACCENT_GREEN : undefined}
          />
        </Stack>
      )}
    </Box>
  );
}

function Summary({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <Stack>
      <Typography variant="caption" sx={{ color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, color: highlight ?? TEXT_PRIMARY }}>{value}</Typography>
    </Stack>
  );
}

const chipSx = (color: string) => ({
  color: TEXT_PRIMARY,
  backgroundColor: "rgba(255,255,255,0.05)",
  border: `1px solid ${color}`,
  fontWeight: 600,
  textTransform: "capitalize" as const,
});
