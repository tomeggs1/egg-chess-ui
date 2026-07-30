import type { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";
import { GameDialog } from "./GameDialog";
import { Button } from "./Button";
import { SURFACE_600, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Background color for the confirm button (e.g. a red for destructive actions). */
  confirmColor?: string;
  /** Optional icon shown above the title. */
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A small, styled yes/no confirmation modal — an in-app replacement for
 * window.confirm. Matches the app's dialog styling (see GameOverDialog).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <GameDialog
      open={open}
      onClose={onCancel}
      // A confirmation is answered by its buttons, so no corner close button —
      // and the plain paper, since this is not one of the crested dialogs.
      showClose={false}
      glow={false}
      hairline="brass"
      // The stack below already carries the padding, and it varies with `icon`.
      bodyPadding={false}
    >
      <Stack direction="column" sx={{ alignItems: "center", gap: 1.5, px: 3, pt: icon ? 4 : 3.5, pb: 3 }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_PRIMARY, textAlign: "center" }}>
          {title}
        </Typography>
        {message && (
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
            {message}
          </Typography>
        )}

        <Stack direction="row" sx={{ gap: 1.5, mt: 1.5, width: "100%" }}>
          <Button
            id="confirm-dialog-cancel"
            type="secondary"
            label={cancelLabel}
            onClick={onCancel}
            style={{ flex: 1, backgroundColor: SURFACE_600 }}
          />
          <Button
            id="confirm-dialog-confirm"
            type="primary"
            label={confirmLabel}
            onClick={onConfirm}
            style={{ flex: 1, ...(confirmColor ? { backgroundColor: confirmColor } : {}) }}
          />
        </Stack>
      </Stack>
    </GameDialog>
  );
}
