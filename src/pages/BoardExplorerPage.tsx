import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { Board, type BoardArrow } from "../board/Board";
import { edgeColor } from "../board/edgeColor";
import { parsePlacement, toPlacement, type PlacedPiece } from "../board/fen";
import {
  generateMoves,
  generateCastling,
  generateEnPassant,
  legalMoves,
  applyMove,
  isInCheck,
  findKingSquare,
  type MoveTarget,
} from "../board/moves";
import type { CapturedPiece, MoveRecord } from "../board/history";
import { computeSanFigurine, fenAtPly } from "../board/san";
import { fetchExplorer, type ExplorerDb, type ExplorerResult } from "../data/explorer";
import { BoardControls } from "../components/BoardControls";
import { CapturedTray } from "../components/CapturedTray";
import { GameStatus } from "../components/GameStatus";
import { GameOverDialog } from "../components/GameOverDialog";
import { MoveHistory, type Notation } from "../components/MoveHistory";
import { MoveSuggestions } from "../components/MoveSuggestions";
import { PromotionPicker } from "../components/PromotionPicker";
import type { PieceColor, PieceType } from "../data/pieceThemes";
import type { GameDefinition, PieceDefinition } from "../data/types";
import { useGameCatalog } from "../data/GameCatalogContext";
import { findOpening } from "../data/openings";
import { TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

/**
 * Board Explorer — render and experiment with the board outside of real games.
 * Owns the interactive state: the starting layout, the move history, and which
 * ply is being viewed. The current board and side-to-move are derived from those.
 */
function BoardExplorer({ definitions }: { definitions: GameDefinition[] }) {
  // The standard game anchors defaults; falls back to the first definition.
  const standardDef = definitions.find((d) => d.id === "standard") ?? definitions[0];
  const [orientation, setOrientation] = useState<PieceColor>("white");
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [gameId, setGameId] = useState(standardDef.id);
  const [selected, setSelected] = useState<{ file: number; rank: number } | null>(null);
  const [startBoard, setStartBoard] = useState<PlacedPiece[]>(() =>
    parsePlacement(standardDef.starting_positions),
  );
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [currentPly, setCurrentPly] = useState(-1); // -1 = starting position
  const [notation, setNotation] = useState<Notation>("uci");
  // A pawn move awaiting the player's promotion choice.
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: { file: number; rank: number };
    to: { file: number; rank: number };
    color: PieceColor;
    captured?: PlacedPiece;
  } | null>(null);
  // Suppresses the game-over modal after "Review" (until the next move / reset).
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  // Opening-explorer move suggestions.
  const [explorerDb, setExplorerDb] = useState<ExplorerDb>("masters");
  const [explorer, setExplorer] = useState<{ data: ExplorerResult | null; loading: boolean; error: boolean }>({
    data: null,
    loading: false,
    error: false,
  });
  // A suggested move being hovered (previewed on the board).
  const [hintMove, setHintMove] = useState<{
    from: { file: number; rank: number };
    to: { file: number; rank: number };
  } | null>(null);
  // Whether to draw the top suggested moves as arrows on the board.
  const [showArrows, setShowArrows] = useState(false);

  const game = definitions.find((g) => g.id === gameId) ?? standardDef;
  const isStandard = game.id === "standard";

  // Figurine SAN per ply (standard game + SAN mode only); null → UCI fallback.
  const sanText = useMemo(
    () => (isStandard && notation === "san" ? computeSanFigurine(history) : null),
    [isStandard, notation, history],
  );

  // Captured pieces up to the viewed ply, split by capturing side.
  const captures = useMemo(() => {
    const byWhite: CapturedPiece[] = []; // black pieces White captured
    const byBlack: CapturedPiece[] = []; // white pieces Black captured
    for (const m of history.slice(0, currentPly + 1)) {
      if (m.captured) (m.captured.color === "black" ? byWhite : byBlack).push(m.captured);
    }
    return { byWhite, byBlack };
  }, [history, currentPly]);

  // Board + side-to-move are derived from the viewed ply.
  const board = currentPly < 0 ? startBoard : history[currentPly].board;
  const turn: PieceColor = currentPly < 0 ? "white" : history[currentPly].turn;

  // Detected opening — standard game only (undefined hides the row for variants).
  const opening = useMemo(
    () => (game.id === "standard" ? findOpening(toPlacement(board)) : undefined),
    [board, game],
  );

  // Immutable starting layout — used to gate `initial_only` moves (pawn double step).
  const startPieces = useMemo(() => parsePlacement(game.starting_positions), [game]);
  // type → definition ("Pawn" → "pawn", …).
  const defs = useMemo(() => {
    const map = new Map<PieceType, PieceDefinition>();
    for (const d of game.pieces) map.set(d.name.toLowerCase() as PieceType, d);
    return map;
  }, [game]);

  // Legal targets for a given piece (movement + en passant + castling, then
  // filtered so they don't leave the mover's own king in check).
  const legalTargetsFor = useCallback(
    (piece: PlacedPiece): MoveTarget[] => {
      const startAt = startPieces.find((s) => s.file === piece.file && s.rank === piece.rank);
      const isInitial = !!startAt && startAt.color === piece.color && startAt.type === piece.type;
      const def = defs.get(piece.type);
      const targets = generateMoves(board, piece, defs, isInitial);

      if (def?.enPassant) {
        const lastMove = currentPly >= 0 ? history[currentPly] : undefined;
        targets.push(...generateEnPassant(board, piece, lastMove));
      }
      if (piece.type === "king" && game.castling) {
        const movedFrom = new Set(history.slice(0, currentPly + 1).map((m) => `${m.from.file},${m.from.rank}`));
        const startSet = new Set(startPieces.map((s) => `${s.file},${s.rank}`));
        const unmoved = (f: number, r: number) => startSet.has(`${f},${r}`) && !movedFrom.has(`${f},${r}`);
        targets.push(...generateCastling(board, piece, game.castling, unmoved));
      }
      return legalMoves(board, { file: piece.file, rank: piece.rank }, targets, defs);
    },
    [board, defs, startPieces, game, history, currentPly],
  );

  const moveTargets = useMemo(() => {
    if (!selected) return [];
    const piece = board.find((p) => p.file === selected.file && p.rank === selected.rank);
    return piece ? legalTargetsFor(piece) : [];
  }, [selected, board, legalTargetsFor]);

  // The side to move is in check → highlight its king.
  const checkSquare = useMemo(
    () => (isInCheck(board, turn, defs) ? findKingSquare(board, turn) : null),
    [board, turn, defs],
  );

  // Game outcome for the side to move: no legal move = checkmate (in check) or
  // stalemate; otherwise "check" or null.
  const outcome = useMemo<"check" | "checkmate" | "stalemate" | null>(() => {
    const inCheck = isInCheck(board, turn, defs);
    const hasMove = board.some((p) => p.color === turn && legalTargetsFor(p).length > 0);
    if (!hasMove) return inCheck ? "checkmate" : "stalemate";
    return inCheck ? "check" : null;
  }, [board, turn, defs, legalTargetsFor]);

  // Full FEN of the viewed position (standard game only) — keys the explorer.
  const currentFen = useMemo(
    () => (isStandard ? fenAtPly(history, currentPly) : null),
    [isStandard, history, currentPly],
  );

  // Fetch move stats whenever the position or database changes. Aborts the
  // previous request so out-of-order responses can't clobber the current view.
  useEffect(() => {
    if (!currentFen) {
      setExplorer({ data: null, loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setExplorer((prev) => ({ ...prev, loading: true, error: false }));
    fetchExplorer(currentFen, explorerDb, controller.signal)
      .then((data) => setExplorer({ data, loading: false, error: false }))
      .catch((err) => {
        if (controller.signal.aborted) return; // superseded — ignore
        setExplorer({ data: null, loading: false, error: true });
        void err;
      });
    return () => controller.abort();
  }, [currentFen, explorerDb]);

  // Parse a UCI move ("e2e4", "e7e8q") into board squares + optional promotion.
  const parseUci = (uci: string) => ({
    from: { file: uci.charCodeAt(0) - 97, rank: Number(uci[1]) - 1 },
    to: { file: uci.charCodeAt(2) - 97, rank: Number(uci[3]) - 1 },
    promo: uci[4] as "q" | "r" | "b" | "n" | undefined,
  });
  const PROMO_TYPE: Record<string, PieceType> = { q: "queen", r: "rook", b: "bishop", n: "knight" };

  // Apply a target move, record it in history and advance. Shared by clicks,
  // promotion, and suggestion playback. Truncates any reviewed future.
  const commitMove = (
    from: { file: number; rank: number },
    target: MoveTarget,
    mover: PlacedPiece,
    promotion?: PieceType,
  ) => {
    const { pieces: nextBoard, captured } = applyMove(board, from, target, promotion);
    const record: MoveRecord = {
      from: { ...from },
      to: { file: target.file, rank: target.rank },
      color: mover.color,
      type: mover.type,
      captured: captured ? { color: captured.color, type: captured.type } : undefined,
      promotion,
      board: nextBoard,
      turn: mover.color === "white" ? "black" : "white",
    };
    setHistory((prev) => [...prev.slice(0, currentPly + 1), record]);
    setCurrentPly(currentPly + 1);
    setSelected(null);
    setHintMove(null);
    setGameOverDismissed(false);
  };

  // Play a suggested move (UCI). Resolves it to a legal MoveTarget so castling /
  // en passant side-effects are applied correctly.
  const playUci = (uci: string) => {
    const { from, to, promo } = parseUci(uci);
    const mover = board.find((p) => p.file === from.file && p.rank === from.rank);
    if (!mover || mover.color !== turn) return;
    const target = legalTargetsFor(mover).find((t) => t.file === to.file && t.rank === to.rank);
    if (!target) return;
    commitMove(from, target, mover, target.castle ? undefined : promo ? PROMO_TYPE[promo] : undefined);
  };

  // Top explorer moves as board arrows (edge-colored, ranked). Mirrors the
  // panel's sample guard; numbered sequentially 1..N.
  const suggestionArrows = useMemo<BoardArrow[]>(() => {
    if (!showArrows || !explorer.data) return [];
    const out: BoardArrow[] = [];
    for (const m of explorer.data.moves) {
      if (m.total < 50) continue; // skip statistical noise
      const wins = turn === "white" ? m.white : m.black;
      const winPct = m.total ? Math.round((100 * wins) / m.total) : 0;
      const drawPct = m.total ? Math.round((100 * m.draws) / m.total) : 0;
      const lossPct = Math.max(0, 100 - winPct - drawPct);
      const edge = winPct - lossPct;
      const color = edgeColor(edge);
      const { from, to } = parseUci(m.uci);
      out.push({ from, to, color, rank: out.length + 1 });
      if (out.length >= 5) break;
    }
    return out;
  }, [showArrows, explorer.data, turn]);

  const resetTo = (definition: GameDefinition) => {
    setStartBoard(parsePlacement(definition.starting_positions));
    setHistory([]);
    setCurrentPly(-1);
    setSelected(null);
    setPendingPromotion(null);
    setGameOverDismissed(false);
    setHintMove(null);
  };

  const handleGameChange = (id: string) => {
    const next = definitions.find((g) => g.id === id) ?? standardDef;
    setGameId(next.id);
    resetTo(next);
  };

  const jumpTo = (ply: number) => {
    setCurrentPly(Math.max(-1, Math.min(history.length - 1, ply)));
    setSelected(null);
  };

  // ←/→ steps through history.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelected(null);
        setCurrentPly((p) => Math.max(-1, p - 1));
      } else if (e.key === "ArrowRight") {
        setSelected(null);
        setCurrentPly((p) => Math.min(history.length - 1, p + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history.length]);

  const handleSquareClick = (file: number, rank: number) => {
    // Selected piece + legal target → make the move (and record it).
    const target = selected ? moveTargets.find((t) => t.file === file && t.rank === rank) : undefined;
    if (selected && target) {
      const mover = board.find((p) => p.file === selected.file && p.rank === selected.rank);
      if (!mover) return;

      // Promotion: a promoter landing on the far rank pauses for the player's
      // piece choice (finalized in choosePromotion).
      const farRank = mover.color === "white" ? 7 : 0;
      if (defs.get(mover.type)?.promotes && !target.castle && rank === farRank) {
        const captured = board.find((p) => p.file === file && p.rank === rank && p.color !== mover.color);
        setPendingPromotion({ from: { ...selected }, to: { file, rank }, color: mover.color, captured });
        setSelected(null);
        return;
      }

      commitMove(selected, target, mover);
      return;
    }

    const piece = board.find((p) => p.file === file && p.rank === rank);
    // Only the side to move may be selected; anything else clears the selection.
    if (!piece || piece.color !== turn) {
      setSelected(null);
      return;
    }
    setSelected((prev) => (prev && prev.file === file && prev.rank === rank ? null : { file, rank }));
  };

  // Pieces a pawn may promote to (game config, else the game's non-pawn/king pieces).
  const promotionOptions: PieceType[] =
    game.promotionPieces ??
    game.pieces.map((p) => p.name.toLowerCase() as PieceType).filter((t) => t !== "pawn" && t !== "king");

  const choosePromotion = (type: PieceType) => {
    const pp = pendingPromotion;
    if (!pp) return;
    const mover = board.find((p) => p.file === pp.from.file && p.rank === pp.from.rank);
    if (!mover) return;
    commitMove(pp.from, { ...pp.to, kind: "move" }, mover, type);
    setPendingPromotion(null);
  };

  return (
    <section>
      <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
        Board Explorer
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} sx={{ mt: 2, gap: 3, alignItems: "flex-start" }}>
        <Box
          sx={{
            // Board stays put on desktop while the panel column scrolls beside it.
            position: { xs: "relative", md: "sticky" },
            top: { md: "1.5rem" },
            alignSelf: { md: "flex-start" },
            flex: "1 1 auto",
            width: "100%",
            maxWidth: 712,
          }}
        >
          <Board
            position={toPlacement(board)}
            pieces={board}
            orientation={orientation}
            showCoordinates={showCoordinates}
            maxSquareSize={85}
            selectedSquare={selected}
            moveTargets={moveTargets}
            checkSquare={checkSquare}
            hintMove={hintMove}
            arrows={suggestionArrows}
            onSquareClick={handleSquareClick}
          />
          {pendingPromotion && (
            <PromotionPicker
              color={pendingPromotion.color}
              options={promotionOptions}
              onSelect={choosePromotion}
              onCancel={() => setPendingPromotion(null)}
            />
          )}
        </Box>

        <Stack
          direction="column"
          sx={{
            flexShrink: 0,
            width: { xs: "100%", md: 370 },
            gap: 2,
            // Independent scroll on desktop: the panel column scrolls internally
            // (capped to the viewport) so scrolling here never moves the board.
            maxHeight: { md: "calc(100vh - 130px)" },
            overflowY: { md: "auto" },
            pr: { md: 0.5 },
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "4px" },
            "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
          }}
        >
          <GameStatus turn={turn} opening={opening} outcome={outcome} />
          <MoveSuggestions
            turn={turn}
            data={explorer.data}
            loading={explorer.loading}
            error={explorer.error}
            available={isStandard && currentFen != null}
            db={explorerDb}
            onDbChange={setExplorerDb}
            showArrows={showArrows}
            onToggleArrows={setShowArrows}
            onHoverMove={(uci) => setHintMove(uci ? { from: parseUci(uci).from, to: parseUci(uci).to } : null)}
            onPlayMove={playUci}
          />
          <CapturedTray byWhite={captures.byWhite} byBlack={captures.byBlack} />
          <MoveHistory
            history={history}
            currentPly={currentPly}
            onJump={jumpTo}
            notation={notation}
            onNotationChange={setNotation}
            showNotationToggle={isStandard}
            sanText={sanText}
          />
          <BoardControls
            games={definitions}
            gameId={gameId}
            onGameChange={handleGameChange}
            onFlip={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
            onReset={() => resetTo(game)}
            showCoordinates={showCoordinates}
            onToggleCoordinates={setShowCoordinates}
          />
        </Stack>
      </Stack>

      <GameOverDialog
        open={(outcome === "checkmate" || outcome === "stalemate") && !gameOverDismissed}
        outcome={outcome}
        winner={outcome === "checkmate" ? (turn === "white" ? "black" : "white") : undefined}
        onNewGame={() => resetTo(game)}
        onReview={() => setGameOverDismissed(true)}
      />
    </section>
  );
}

/**
 * Loads the game catalog from the API, then renders the explorer. Kept as a thin
 * wrapper so the inner component's hooks only run once definitions are available.
 */
export default function BoardExplorerPage() {
  const { definitions, loading, error } = useGameCatalog();

  if (loading) {
    return (
      <section>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mt: 4 }}>
          <CircularProgress size={20} sx={{ color: TEXT_SECONDARY }} />
          <Typography variant="body1" sx={{ color: TEXT_SECONDARY }}>
            Loading games…
          </Typography>
        </Stack>
      </section>
    );
  }

  if (error || definitions.length === 0) {
    return (
      <section>
        <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
          Board Explorer
        </Typography>
        <Typography variant="body1" sx={{ color: TEXT_SECONDARY, mt: 2 }}>
          Couldn't load the game catalog. Is the service running?
        </Typography>
      </section>
    );
  }

  return <BoardExplorer definitions={definitions} />;
}
