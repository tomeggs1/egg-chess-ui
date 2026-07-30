import { Box, Stack, Typography } from "@mui/material";
import { GameDialog } from "./GameDialog";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { Icon } from "../icons";
import { Button } from "./Button";
import { uiPieceSrc } from "../data/pieceAssets";
import type { PieceColor } from "../data/pieceThemes";
import { ACCENT_BRIGHT, CTA_SECONDARY, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";
import { DIALOG_CHECKER_SX } from "../theme/surfaces";

interface GameOverDialogProps {
  open: boolean;
  outcome: "check" | "checkmate" | "stalemate" | null;
  /** The winning color (checkmate only). */
  winner?: PieceColor;
  onNewGame: () => void;
  onReview: () => void;
}

export function GameOverDialog({ open, outcome, winner, onNewGame, onReview }: GameOverDialogProps) {
  const isMate = outcome === "checkmate";
  const title = isMate ? "Checkmate" : "Stalemate";
  const subtitle = isMate ? `${winner === "white" ? "White" : "Black"} wins` : "Draw";

  return (
    <GameDialog
      open={open}
      onClose={onReview}
      // The result emblem is built from the outcome, so this one keeps its own
      // header rather than using the shell's. No corner close button: the two
      // buttons below are the intended way out.
      showClose={false}
      bodyPadding={false}
    >
      {/*
        Header with a faint chessboard pattern and the result emblem. Split out
        of the body Stack so the checker has an element to fill — it is
        absolutely positioned, and the buttons should sit below the wash rather
        than on it.
      */}
      <Box sx={{ position: "relative", overflow: "hidden", px: 3, pt: 4, pb: 3 }}>
        <Box aria-hidden sx={DIALOG_CHECKER_SX} />
        <Stack direction="column" sx={{ position: "relative", alignItems: "center", gap: 1.5 }}>
          {isMate && winner ? (
            <Box
              component="img"
              src={uiPieceSrc(winner, "king")}
              alt={`${winner} king`}
              sx={{
                height: 64,
                width: "auto",
                filter: winner === "black" ? "drop-shadow(0 0 3px rgba(255,255,255,0.5))" : "none",
              }}
            />
          ) : (
            <Icon name="agreement" sx={{ fontSize: 56, color: TEXT_SECONDARY }} />
          )}

          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            {isMate && <EmojiEventsRoundedIcon sx={{ color: ACCENT_BRIGHT }} />}
            <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
              {title}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: TEXT_SECONDARY }}>
            {subtitle}
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" sx={{ gap: 1.5, px: 3, pb: 3, justifyContent: "center" }}>
        <Button id="game-over-review" type="secondary" label="Review" onClick={onReview} style={{ backgroundColor: "rgba(255,235,190,0.08)" }} />
        <Button id="game-over-new" type="primary" label="New Game" onClick={onNewGame} style={{ backgroundColor: CTA_SECONDARY }} />
      </Stack>
    </GameDialog>
  );
}
