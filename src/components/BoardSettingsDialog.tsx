import { Box, Dialog, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import { PieceThemePicker } from "./PieceThemePicker";
import { BoardThemePicker } from "./BoardThemePicker";
import {
  ACCENT_BLUE,
  ACCENT_PURPLE,
  MAIN_BLUE_LIGHT,
  SURFACE_800,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

interface BoardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Board appearance settings in a dialog, so the user can adjust them without
 * navigating away from the page they're on. Changes apply immediately and
 * persist locally (see PieceThemeContext) — there is no save step.
 */
export default function BoardSettingsDialog({ open, onClose }: BoardSettingsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
      {/* Top accent hairline (blue → purple). */}
      <Box
        aria-hidden
        sx={{ height: "3px", background: `linear-gradient(90deg, ${MAIN_BLUE_LIGHT}, ${ACCENT_PURPLE})` }}
      />

      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          color: TEXT_MUTED,
          "&:hover": { color: TEXT_PRIMARY },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      <Box sx={{ px: 3, pt: 3.5, pb: 2 }}>
        <Stack direction="column" sx={{ alignItems: "center", gap: 1 }}>
          <GridOnRoundedIcon sx={{ fontSize: 40, color: ACCENT_BLUE }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            Board Settings
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
            Customize how the board and pieces look
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mt: 0 }}>
          Board Theme
        </Typography>
        <BoardThemePicker />
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mt: 3 }}>
          Pieces
        </Typography>
        <PieceThemePicker />
      </Box>
    </Dialog>
  );
}
