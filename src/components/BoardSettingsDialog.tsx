import { Stack, Switch, Typography } from "@mui/material";
import { Icon } from "../icons";
import { GameDialog } from "./GameDialog";
import { PieceThemePicker } from "./PieceThemePicker";
import { BoardThemePicker } from "./BoardThemePicker";
import { useSound } from "../audio/SoundContext";
import { ACCENT_PRIMARY, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";
import SettingsEmblem from "../assets/images/settings-large.webp";

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
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useSound();
  return (
    <GameDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      emblem={SettingsEmblem}
      title="Board Settings"
      subtitle="Customize how the board and pieces look"
    >
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mt: 0 }}>
          Board Theme
        </Typography>
        <BoardThemePicker />
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mt: 3 }}>
          Pieces
        </Typography>
        <PieceThemePicker />

        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mt: 3 }}>
          Sound
        </Typography>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mt: 1 }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            {soundEnabled ? (
              <Icon name="sound-on" sx={{ color: ACCENT_PRIMARY }} />
            ) : (
              <Icon name="sound-off" sx={{ color: TEXT_MUTED }} />
            )}
            <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
              Play a sound when a move is made
            </Typography>
          </Stack>
          <Switch
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            slotProps={{ input: { "aria-label": "Move sounds" } }}
          />
        </Stack>
    </GameDialog>
  );
}
