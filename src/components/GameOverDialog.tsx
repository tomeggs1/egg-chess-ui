import { Box, Dialog, Stack, Typography } from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import { Button } from "./Button";
import { uiPieceSrc } from "../data/pieceAssets";
import type { PieceColor } from "../data/pieceThemes";
import {
  ACCENT_PURPLE,
  MAIN_BLUE_LIGHT,
  MAIN_PURPLE,
  SURFACE_800,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

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
    <Dialog
      open={open}
      onClose={onReview}
      fullWidth
      maxWidth="xs"
      sx={{
        "& .MuiDialog-paper": {
          position: "relative",
          overflow: "hidden",
          backgroundColor: SURFACE_800,
          backgroundImage: `radial-gradient(circle at 15% -10%, rgba(77, 141, 255, 0.22), transparent 45%), radial-gradient(circle at 110% 0%, rgba(168, 85, 247, 0.22), transparent 42%)`,
          border: `1px solid rgba(255, 255, 255, 0.12)`,
          borderRadius: "18px",
          color: TEXT_PRIMARY,
          boxShadow: `0 0 0 1px rgba(77, 141, 255, 0.30), 0 0 50px rgba(96, 2, 197, 0.35), 0 40px 90px rgba(0, 0, 0, 0.80)`,
        },
      }}
    >
      <Box aria-hidden sx={{ height: "3px", background: `linear-gradient(90deg, ${MAIN_BLUE_LIGHT}, ${ACCENT_PURPLE})` }} />

      <Stack direction="column" sx={{ alignItems: "center", gap: 1.5, px: 3, pt: 4, pb: 3 }}>
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
          <HandshakeRoundedIcon sx={{ fontSize: 56, color: TEXT_SECONDARY }} />
        )}

        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          {isMate && <EmojiEventsRoundedIcon sx={{ color: "#f0c000" }} />}
          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            {title}
          </Typography>
        </Stack>
        <Typography variant="body1" sx={{ color: TEXT_SECONDARY }}>
          {subtitle}
        </Typography>

        <Stack direction="row" sx={{ gap: 1.5, mt: 1.5 }}>
          <Button id="game-over-review" type="secondary" label="Review" onClick={onReview} style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
          <Button id="game-over-new" type="primary" label="New Game" onClick={onNewGame} style={{ backgroundColor: MAIN_PURPLE }} />
        </Stack>
      </Stack>
    </Dialog>
  );
}
